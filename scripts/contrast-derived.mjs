// WCAG 2.x contrast of DERIVED colors — the ones that are not plain token
// pairs: translucent hover/press tints, the ECharts heatmap ramp (RGB
// interpolation, label color switching at 55 %), the CSS heat ramp
// (color-mix in oklab), the danger button hover/press mixes and the chart
// range band label. Writes docs/verification/contrast-derived.md.
// Exit code 1 if a required pair fails.
import { readFileSync, writeFileSync } from "node:fs";

const css = readFileSync("src/the-mechanics/themes.css", "utf8");
const themes = {};
for (const [, sel, body] of css.matchAll(/((?:\[data-tm-theme="\w+"\]|:root)[^{]*)\{([^}]*)\}/g)) {
  const id = sel.match(/data-tm-theme="(\w+)"/)?.[1];
  if (!id) continue;
  const t = (themes[id] ||= {});
  for (const [, k, v] of body.matchAll(/--tm-([\w-]+):\s*(#[0-9a-f]{6}|rgb\([^)]*\))/gi)) t[k] = v;
}

// ---- color helpers (sRGB 0..1 arrays, alpha separate) ----
const parse = (v) => {
  if (v.startsWith("#")) return { c: [1, 3, 5].map((i) => parseInt(v.slice(i, i + 2), 16) / 255), a: 1 };
  const m = v.match(/rgb\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+))?\)/);
  return { c: [m[1], m[2], m[3]].map((n) => +n / 255), a: m[4] === undefined ? 1 : +m[4] };
};
const over = (fg, bg) => fg.c.map((x, i) => x * fg.a + bg[i] * (1 - fg.a));
const lin = (x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
const unlin = (x) => (x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055);
const lum = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const hex = (c) => `#${c.map((x) => Math.round(Math.min(1, Math.max(0, x)) * 255).toString(16).padStart(2, "0")).join("")}`;
const toOklab = (c) => {
  const [r, g, b] = c.map(lin);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
};
const fromOklab = ([L, A, B]) => {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s].map(unlin);
};
const mixOklab = (a, b, pa) => fromOklab(toOklab(a).map((x, i) => x * pa + toOklab(b)[i] * (1 - pa)));
const mixRgb = (a, b, pb) => a.map((x, i) => x + (b[i] - x) * pb); // ECharts visualMap interpolation

const T = 4.5, G = 3;
const rows = [];
let fails = 0;
for (const [id, t] of Object.entries(themes)) {
  const C = (k) => parse(t[k]).c;
  const add = (what, fg, bg, min, note = "") => {
    const r = ratio(fg, bg);
    const ok = r >= min;
    if (!ok) fails++;
    rows.push([id, what, hex(fg), hex(bg), r.toFixed(2), min, ok ? "pass" : "**FAIL**", note]);
  };
  // 1. Hover and press tints (translucent) on every surface they appear on.
  for (const tint of ["hover", "press"]) {
    for (const surf of ["surface", "canvas", "chrome", "inset"]) {
      const bg = over(parse(t[tint]), C(surf));
      add(`text on ${tint} over ${surf}`, C("text"), bg, T);
      add(`text-2 on ${tint} over ${surf}`, C("text-2"), bg, T);
    }
  }
  // 2. ECharts heatmap (charts.js heatLabel): label = the better of text and
  //    surface; where that is still < 4.5:1 the label gets a 2px halo in the
  //    other tone, so the digits are read against the halo.
  let worst = { r: 99 }, halo = 0, haloWorst = { r: 99 };
  for (let v = 0; v <= 100; v++) {
    const bg = mixRgb(C("heat-lo"), C("heat-hi"), v / 100);
    const [rt, rs] = [ratio(C("text"), bg), ratio(C("surface"), bg)];
    const useText = rt >= rs;
    const r = Math.max(rt, rs);
    if (r >= T) { if (r < worst.r) worst = { r, v, fg: useText ? C("text") : C("surface"), bg }; continue; }
    halo++;
    const fg = useText ? C("text") : C("surface"), ring = useText ? C("surface") : C("text");
    const rr = ratio(fg, ring);
    if (rr < haloWorst.r) haloWorst = { r: rr, v, fg, ring };
  }
  add(`heatmap label, plain (worst plain cell, ${worst.v} %)`, worst.fg, worst.bg, T);
  if (halo) add(`heatmap label on halo (${halo} values of 101 use it)`, haloWorst.fg, haloWorst.ring, T, "mid-ramp cells");
  // 3. CSS heat ramp (color-mix in oklab) as a graphic against the panel.
  const lo = mixOklab(C("heat-hi"), C("heat-lo"), 0);
  const hi = mixOklab(C("heat-hi"), C("heat-lo"), 1);
  add("heat ramp high end vs panel", hi, C("surface"), G, "graphic; low end is a near-surface tint by design");
  void lo;
  // 4. Danger button hover/press: color-mix(danger 86 % / 76 %, text).
  add("danger button label on hover", C("surface"), mixOklab(C("danger"), C("text"), 0.86), T);
  add("danger button label on press", C("surface"), mixOklab(C("danger"), C("text"), 0.76), T);
  // 5. Chart range band: warning label on warning 10 % over the panel.
  add("chart range band label", C("warning"), over({ c: C("warning"), a: 0.1 }, C("surface")), T);
  // 6. Brush selection: chart text on hover tint over the panel.
  add("chart text under drag selection", C("text"), over(parse(t.hover), C("surface")), T);
}

const md = `# Derived-color contrast

Generated by \`node scripts/contrast-derived.mjs\` from \`src/the-mechanics/themes.css\`.
Covers colors that are computed rather than declared: translucent hover/press tints composited on each surface, the ECharts heatmap ramp (RGB interpolation; every value 0–100 checked, worst cell reported), the CSS heat ramp (oklab), danger button hover/press mixes, and chart overlay labels. Token pairs are in [contrast.md](contrast.md).

Thresholds: 4.5:1 text, 3:1 graphics. Result: **${fails ? `${fails} failure(s)` : "all pass"}** (${rows.length} checks).

| Theme | Pair | Foreground | Background | Ratio | Min | Result | Note |
|---|---|---|---|---:|---:|---|---|
${rows.map((r) => `| ${r.join(" | ")} |`).join("\n")}
`;
writeFileSync("docs/verification/contrast-derived.md", md);
console.log(rows.filter((r) => r[6] !== "pass").map((r) => r.slice(0, 5).join("  ")).join("\n") || "all derived pairs pass");
console.log(`${rows.length} checks, ${fails} failures`);
process.exit(fails ? 1 : 0);
