// Builds the portable, framework-free CSS distribution into dist/the-mechanics/.
// No Tailwind or daisyUI is needed to consume the output.
//
//   the-mechanics.css         tokens + themes + base + components (single file)
//   the-mechanics.daisyui.css optional bridge for Tailwind 4 + daisyUI 5 apps
//   fonts.css + fonts/*.woff2 IBM Plex Sans/Mono (latin + latin-ext, OFL-1.1)
//   the-mechanics.js          optional behaviors (picker, select fallback, popups …), ES module
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "src/the-mechanics");
const out = join(root, "dist/the-mechanics");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, "fonts"), { recursive: true });

function inline(file, seen = new Set()) {
  const abs = resolve(file);
  if (seen.has(abs)) return "";
  seen.add(abs);
  const css = readFileSync(abs, "utf8");
  return css.replace(/^@import\s+"(.+?)";\s*$/gm, (_, rel) => inline(join(dirname(abs), rel), seen));
}

const banner = (name) =>
  `/*! The Mechanics ${pkg.version} — ${name} — CC0-1.0 — https://github.com/hipotures/the-mechanics */\n`;

writeFileSync(join(out, "the-mechanics.css"), banner("design system") + inline(join(src, "index.css")));
// Behaviors: the source already starts with its own /*! … */ line; stamp the version into it.
writeFileSync(
  join(out, "the-mechanics.js"),
  readFileSync(join(src, "the-mechanics.js"), "utf8").replace(/^\/\*! The Mechanics — /, `/*! The Mechanics ${pkg.version} — `),
);
writeFileSync(
  join(out, "the-mechanics.daisyui.css"),
  banner("daisyUI 5 bridge") + readFileSync(join(src, "adapters/daisyui.css"), "utf8"),
);

// Fonts: copy only latin + latin-ext subsets for the weights the system uses.
const families = [
  ["ibm-plex-sans", "IBM Plex Sans"],
  ["ibm-plex-mono", "IBM Plex Mono"],
];
const weights = [400, 500, 600, 700];
let fontsCss = banner("fonts (IBM Plex, SIL OFL 1.1)");
for (const [dir, family] of families) {
  const pkgDir = join(root, "node_modules/@fontsource", dir);
  copyFileSync(join(pkgDir, "LICENSE"), join(out, "fonts", `${dir}-LICENSE.txt`));
  for (const w of weights) {
    // The per-subset files (latin-400.css) carry no unicode-range; the
    // all-subsets file (400.css) has one block per subset, named in a comment.
    const css = readFileSync(join(pkgDir, `${w}.css`), "utf8");
    for (const subset of ["latin-ext", "latin"]) {
      const file = `${dir}-${subset}-${w}-normal.woff2`;
      const block = css.split("/* ").find((b) => b.startsWith(`${dir}-${subset}-${w}-normal */`));
      const range = block?.match(/unicode-range:\s*([^;]+);/)?.[1]?.trim();
      if (!range || !/^U\+[0-9A-F]/i.test(range)) throw new Error(`no unicode-range for ${file} in ${dir}/${w}.css`);
      copyFileSync(join(pkgDir, "files", file), join(out, "fonts", file));
      fontsCss += `@font-face{font-family:"${family}";font-style:normal;font-weight:${w};font-display:swap;src:url(./fonts/${file}) format("woff2");unicode-range:${range};}\n`;
    }
  }
}
writeFileSync(join(out, "fonts.css"), fontsCss);
console.log(`Built ${out}`);
