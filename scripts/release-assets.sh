#!/bin/sh
# Builds the release assets for TAG into tmp/release/TAG/:
#   the-mechanics-css-TAG.zip    dist/the-mechanics + LICENSE + distribution.md
#   the-mechanics-skill-TAG.zip  skills/the-mechanics + DESIGN.md + distribution.md (in references/)
#   install.sh, SHA256SUMS, NOTES.md (docs/releases/TAG.md),
#   CHANGELOG.md (all docs/releases/*.md up to TAG, newest first; the installer prints the new part on update)
# Usage (repo root, after `corepack pnpm build:css`): sh scripts/release-assets.sh v0.1.1
set -eu
TAG="${1:?usage: release-assets.sh TAG}"
ROOT=$(cd "$(dirname "$0")/.." && pwd)
OUT="$ROOT/tmp/release/$TAG"
[ -f "$ROOT/dist/the-mechanics/the-mechanics.css" ] || { echo "run corepack pnpm build:css first" >&2; exit 1; }
[ -f "$ROOT/docs/releases/$TAG.md" ] || { echo "write docs/releases/$TAG.md first" >&2; exit 1; }
rm -rf "$OUT" && mkdir -p "$OUT/css" "$OUT/skill"
cp -R "$ROOT/dist/the-mechanics" "$OUT/css/"
cp "$ROOT/LICENSE" "$ROOT/docs/distribution.md" "$OUT/css/the-mechanics/"
cp -R "$ROOT/skills/the-mechanics" "$OUT/skill/"
cp "$ROOT/DESIGN.md" "$ROOT/docs/distribution.md" "$OUT/skill/the-mechanics/references/"
(cd "$OUT/css" && zip -qrX "../the-mechanics-css-$TAG.zip" the-mechanics)
(cd "$OUT/skill" && zip -qrX "../the-mechanics-skill-$TAG.zip" the-mechanics)
cp "$ROOT/scripts/install.sh" "$OUT/"
cp "$ROOT/docs/releases/$TAG.md" "$OUT/NOTES.md"
for f in $(ls "$ROOT"/docs/releases/v*.md | sed 's#.*/##; s#\.md$##' | sort -Vr); do
  # only releases up to TAG
  [ "$(printf '%s\n%s\n' "$f" "$TAG" | sort -V | tail -n 1)" = "$TAG" ] || continue
  printf '# %s\n\n' "$f"; cat "$ROOT/docs/releases/$f.md"; printf '\n'
done > "$OUT/CHANGELOG.md"
(cd "$OUT" && sha256sum "the-mechanics-css-$TAG.zip" "the-mechanics-skill-$TAG.zip" > SHA256SUMS)
rm -rf "$OUT/css" "$OUT/skill"
ls -l "$OUT"
