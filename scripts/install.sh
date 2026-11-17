#!/bin/sh
# The Mechanics installer: downloads a GitHub release, verifies checksums and
# copies the CSS distribution and/or the Claude Code skill into a project.
# No clone, Node.js or build step needed. Requires: curl or wget, unzip,
# sha256sum or shasum.
#
#   curl -fsSL https://github.com/hipotures/the-mechanics/releases/latest/download/install.sh | sh
#   curl -fsSL .../install.sh | sh -s -- --version v0.1.1 --css public/vendor/the-mechanics
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

  --version TAG     release tag to install, e.g. v0.1.1 (default: latest)
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
elif command -v shasum >/dev/null 2>&1; then
  check_sums() { shasum -a 256 -c --quiet -; }
else
  die "needs sha256sum or shasum"
fi

if [ "$VERSION" = "latest" ]; then
  VERSION=$(resolve_latest | sed 's#.*/tag/##')
  case "$VERSION" in v[0-9]*) ;; *) die "could not resolve the latest release" ;; esac
fi
BASE="https://github.com/$REPO/releases/download/$VERSION"

WORK=$(mktemp -d "${TMPDIR:-/tmp}/the-mechanics.XXXXXX")
trap 'rm -rf "$WORK"' EXIT INT TERM

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

# place SRC_DIR (unzipped "the-mechanics/") at TARGET, replacing only our own installs
place() {
  src="$1"; target="$2"; label="$3"
  if [ -e "$target" ]; then
    if [ -f "$target/.the-mechanics-version" ] || [ "$FORCE" = 1 ]; then
      rm -rf "$target"
    else
      die "$target exists and was not installed by this script (use --force to replace it)"
    fi
  fi
  mkdir -p "$(dirname "$target")"
  cp -R "$src" "$target"
  echo "$VERSION" > "$target/.the-mechanics-version"
  echo "  $label -> $target"
}

if [ "$DO_CSS" = 1 ]; then
  mkdir "$WORK/css" && unzip -q "$WORK/$CSS_ZIP" -d "$WORK/css"
  place "$WORK/css/the-mechanics" "$CSS_DIR" "CSS + fonts"
fi
if [ "$DO_SKILL" = 1 ]; then
  mkdir "$WORK/skill" && unzip -q "$WORK/$SKILL_ZIP" -d "$WORK/skill"
  place "$WORK/skill/the-mechanics" "$SKILL_DIR" "agent skill"
fi

if [ "$DO_CSS" = 1 ]; then
  cat <<EOF

Next: load the styles and opt in (see $CSS_DIR/distribution.md for React, Svelte, Rust/Datastar):
  <html data-tm-theme="light">   (light | dark | coffee)
  <link rel="stylesheet" href="/$CSS_DIR/fonts.css">
  <link rel="stylesheet" href="/$CSS_DIR/the-mechanics.css">
  <body class="tm-root">
The href must match where your server serves $CSS_DIR from.
EOF
fi
