#!/bin/sh
# The Mechanics installer: downloads a GitHub release, verifies checksums and
# copies the CSS distribution and/or the Claude Code skill into a project.
# No clone, Node.js or build step needed. Requires: curl or wget, unzip,
# sha256sum or shasum.
#
#   curl -fsSL https://github.com/hipotures/the-mechanics/releases/latest/download/install.sh | sh
#   curl -fsSL .../install.sh | sh -s -- --version v0.1.4 --css public/vendor/the-mechanics
#
# Run it from the root of the project that will use The Mechanics.
set -eu

REPO="hipotures/the-mechanics"
VERSION="latest"
CSS_DIR="vendor/the-mechanics"
SKILL_DIR=".claude/skills/the-mechanics"
DO_CSS=1
DO_SKILL=1
FORCE=0

usage() {
  cat <<'EOF'
Usage: install.sh [options]

  --version TAG     release tag to install, e.g. v0.1.4 (default: latest)
  --css DIR         where to put the CSS + fonts (default: vendor/the-mechanics)
  --skill DIR       where to put the agent skill (default: .claude/skills/the-mechanics)
  --global-skill    put the skill in ~/.claude/skills/the-mechanics (all projects)
  --no-css          skip the CSS distribution
  --no-skill        skip the agent skill
  --force           replace a target directory that was not created by this installer
  -h, --help        show this help

Paths are relative to the current directory. An existing target that this
installer created earlier (it holds a .the-mechanics-version file) is replaced.
EOF
}

die() { echo "install.sh: $*" >&2; exit 1; }

while [ $# -gt 0 ]; do
  case "$1" in
    --version) [ $# -ge 2 ] || die "--version needs a tag"; VERSION="$2"; shift 2 ;;
    --css) [ $# -ge 2 ] || die "--css needs a directory"; CSS_DIR="$2"; shift 2 ;;
    --skill) [ $# -ge 2 ] || die "--skill needs a directory"; SKILL_DIR="$2"; shift 2 ;;
    --global-skill) SKILL_DIR="$HOME/.claude/skills/the-mechanics"; shift ;;
    --no-css) DO_CSS=0; shift ;;
    --no-skill) DO_SKILL=0; shift ;;
    --force) FORCE=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) usage >&2; die "unknown option: $1" ;;
  esac
done
[ "$DO_CSS" = 1 ] || [ "$DO_SKILL" = 1 ] || die "nothing to install (--no-css and --no-skill)"

if command -v curl >/dev/null 2>&1; then
  fetch() { curl -fsSL -o "$2" "$1"; }
  resolve_latest() { curl -fsSLI -o /dev/null -w '%{url_effective}' "https://github.com/$REPO/releases/latest"; }
elif command -v wget >/dev/null 2>&1; then
  fetch() { wget -q -O "$2" "$1"; }
  resolve_latest() { wget -q --max-redirect=5 -S -O /dev/null "https://github.com/$REPO/releases/latest" 2>&1 | sed -n 's/^ *[Ll]ocation: *//p' | tail -n 1 | tr -d '\r'; }
else
  die "needs curl or wget"
fi
command -v unzip >/dev/null 2>&1 || die "needs unzip"
if command -v sha256sum >/dev/null 2>&1; then
  check_sums() { sha256sum -c --quiet -; }
  hash_stdin() { sha256sum; }
elif command -v shasum >/dev/null 2>&1; then
  check_sums() { shasum -a 256 -c --quiet -; }
  hash_stdin() { shasum -a 256; }
else
  die "needs sha256sum or shasum"
fi

WORK=$(mktemp -d "${TMPDIR:-/tmp}/the-mechanics.XXXXXX")
trap 'rm -rf "$WORK"' EXIT INT TERM

if [ "$VERSION" = "latest" ]; then
  # The API is current right after a release; the /releases/latest redirect is
  # cached for a few minutes, so it is only the fallback (e.g. API rate limit).
  VERSION=""
  if fetch "https://api.github.com/repos/$REPO/releases/latest" "$WORK/latest.json" 2>/dev/null; then
    VERSION=$(tr -d '\n' < "$WORK/latest.json" | sed -n 's/.*"tag_name": *"\([^"]*\)".*/\1/p')
  fi
  case "$VERSION" in v[0-9]*) ;; *) VERSION=$(resolve_latest | sed 's#.*/tag/##') ;; esac
  case "$VERSION" in v[0-9]*) ;; *) die "could not resolve the latest release" ;; esac
fi
BASE="https://github.com/$REPO/releases/download/$VERSION"


CSS_ZIP="the-mechanics-css-$VERSION.zip"
SKILL_ZIP="the-mechanics-skill-$VERSION.zip"

echo "The Mechanics $VERSION"
fetch "$BASE/SHA256SUMS" "$WORK/SHA256SUMS" || die "release $VERSION not found"
wanted=""
[ "$DO_CSS" = 1 ] && wanted="$wanted $CSS_ZIP"
[ "$DO_SKILL" = 1 ] && wanted="$wanted $SKILL_ZIP"
for f in $wanted; do
  fetch "$BASE/$f" "$WORK/$f" || die "download failed: $f"
  grep "  $f\$" "$WORK/SHA256SUMS" > "$WORK/$f.sum" || die "no checksum listed for $f"
  (cd "$WORK" && check_sums < "$f.sum") || die "checksum mismatch: $f"
done

# "<hash> <hash without version numbers>  <path>" for every file under DIR
# (marker excluded), sorted by path. The second hash tells a real change from
# a file whose only difference is the release's version stamp.
manifest() {
  (cd "$1" && find . -type f ! -name .the-mechanics-version | sed 's#^\./##' | LC_ALL=C sort | while IFS= read -r f; do
    h=$(hash_stdin < "$f"); n=$(LC_ALL=C sed -E 's/v?[0-9]+\.[0-9]+\.[0-9]+//g' "$f" | hash_stdin)
    echo "${h%% *} ${n%% *}  $f"; done)
}

# place SRC_DIR (unzipped "the-mechanics/") at TARGET, replacing only our own
# installs; on an update, list what changed
UPDATED=0; OLD_VERSIONS=""
place() {
  src="$1"; target="$2"; label="$3"; old=""
  if [ -e "$target" ]; then
    if [ -f "$target/.the-mechanics-version" ]; then
      old=$(cat "$target/.the-mechanics-version")
      manifest "$target" > "$WORK/old.txt"
    elif [ "$FORCE" != 1 ]; then
      die "$target exists and was not installed by this script (use --force to replace it)"
    fi
  fi
  manifest "$src" > "$WORK/new.txt"
  if [ -n "$old" ]; then
    UPDATED=1; OLD_VERSIONS="$OLD_VERSIONS $old"
    # manifest lines: raw-hash norm-hash  path
    awk 'NR==FNR { p=substr($0, index($0, "  ")+2); o[p]=$1; on[p]=$2; next }
      { p=substr($0, index($0, "  ")+2); n[p]=$1; nn[p]=$2 }
      END {
        for (f in n) {
          if (!(f in o)) a[++na]=f
          else if (o[f]!=n[f]) { if (on[f]==nn[f]) v[++nv]=f; else c[++nc]=f }
        }
        for (f in o) if (!(f in n)) r[++nr]=f
        if (!na && !nc && !nr && !nv) { print "    no file changes"; exit }
        if (!na && !nc && !nr) { print "    no content changes (only the version stamp)"; exit }
        for (i=1;i<=nc;i++) print "1 " c[i] "\t    changed  " c[i]
        for (i=1;i<=na;i++) print "2 " a[i] "\t    added    " a[i]
        for (i=1;i<=nr;i++) print "3 " r[i] "\t    removed  " r[i]
        if (nv) print "4\t    (" nv " more file(s) differ only in the version stamp)"
      }' "$WORK/old.txt" "$WORK/new.txt" | LC_ALL=C sort | cut -f2- > "$WORK/diff.txt"
  fi
  rm -rf "$target"
  mkdir -p "$(dirname "$target")"
  cp -R "$src" "$target"
  echo "$VERSION" > "$target/.the-mechanics-version"
  if [ -z "$old" ]; then echo "  $label -> $target (installed)"
  elif [ "$old" = "$VERSION" ]; then echo "  $label -> $target (already $VERSION)"; cat "$WORK/diff.txt"
  else echo "  $label -> $target (updated $old -> $VERSION)"; cat "$WORK/diff.txt"; fi
}

if [ "$DO_CSS" = 1 ]; then
  mkdir "$WORK/css" && unzip -q "$WORK/$CSS_ZIP" -d "$WORK/css"
  place "$WORK/css/the-mechanics" "$CSS_DIR" "CSS + fonts"
fi
if [ "$DO_SKILL" = 1 ]; then
  mkdir "$WORK/skill" && unzip -q "$WORK/$SKILL_ZIP" -d "$WORK/skill"
  place "$WORK/skill/the-mechanics" "$SKILL_DIR" "agent skill"
fi

CHANGED=0
if [ "$UPDATED" = 1 ]; then
  from=$(echo $OLD_VERSIONS | tr ' ' '\n' | LC_ALL=C sort -u | head -n 1)
  if [ "$from" != "$VERSION" ]; then
    CHANGED=1
    echo
    # CHANGELOG.md: every release's notes, newest first, each under "# vX.Y.Z".
    # Print the releases after $from, without their Upgrade / Assets sections.
    if fetch "$BASE/CHANGELOG.md" "$WORK/CHANGELOG.md" 2>/dev/null; then
      echo "Release notes since $from:"
      awk -v from="$from" '/^# v/ { if ($2 == from) exit; skip = 0; print; next }
        /^## / { skip = ($0 ~ /^## (Upgrade|Assets)/) } !skip' "$WORK/CHANGELOG.md" | sed 's/^/  /'
    elif fetch "$BASE/NOTES.md" "$WORK/NOTES.md" 2>/dev/null; then
      echo "Release notes $VERSION:"
      awk '/^## /{ skip = ($0 ~ /^## (Upgrade|Assets)/) } !skip' "$WORK/NOTES.md" | sed 's/^/  /'
    fi
    echo "All changes $from -> $VERSION: https://github.com/$REPO/compare/$from...$VERSION"
  fi
fi

# The update report is meant to be pasted to the agent working on the app.
if [ "$CHANGED" = 1 ]; then
  echo
  echo "For the agent: The Mechanics was updated $from -> $VERSION. Apply the release notes and the changed files above to the app; if any skill file changed, re-read $SKILL_DIR/SKILL.md and the changed references first."
elif [ "$UPDATED" = 0 ] && [ "$DO_CSS" = 1 ]; then
  echo
  echo "Next: wire the CSS into the app — see $CSS_DIR/distribution.md (the agent skill covers this step)."
fi
