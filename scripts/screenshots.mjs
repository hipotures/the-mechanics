// Visual review capture: 6 destinations × 3 themes × desktop/mobile.
// Uses ONE headless Chromium, sequential pages, and writes to a disk-backed
// directory (default tmp/screenshots/<label>). Starts `vite preview` on the
// built playground unless BASE_URL is given.
//
//   pnpm build && pnpm shots [label] [--pages=analytics,workspace] [--themes=dark]
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const args = process.argv.slice(2);
const label = args.find((a) => !a.startsWith("--")) || "review";
const opt = (k) => args.find((a) => a.startsWith(`--${k}=`))?.split("=")[1]?.split(",");
const PAGES = opt("pages") || ["analytics", "workspace", "workspace/analyse", "data", "catalog", "content", "components"];
const THEMES = opt("themes") || ["light", "dark", "coffee"];
const VIEWPORTS = (opt("viewports") || ["desktop", "mobile"]).map((v) => ({ desktop: { name: "desktop", width: 1440, height: 900 }, mobile: { name: "mobile", width: 390, height: 844 } })[v]);
const outDir = resolve(process.env.SHOT_DIR || join("tmp/screenshots", label));
mkdirSync(outDir, { recursive: true });

let server;
let base = process.env.BASE_URL;
if (!base) {
  server = spawn("node_modules/.bin/vite", ["preview", "--port", "4173", "--strictPort"], { stdio: ["ignore", "pipe", "inherit"] });
  await new Promise((res, rej) => {
    server.stdout.on("data", (d) => String(d).includes("4173") && res());
    server.on("exit", (c) => rej(new Error(`preview exited ${c}`)));
  });
  base = "http://localhost:4173/";
}

const browser = await chromium.launch({ args: ["--disable-dev-shm-usage"] });
const report = [];
try {
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1, reducedMotion: "reduce", colorScheme: "light" });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    for (const theme of THEMES) {
      for (const p of PAGES) {
        errors.length = 0;
        await page.goto(`${base}?theme=${theme}#/${p}`, { waitUntil: "networkidle" });
        await page.evaluate(() => document.fonts.ready);
        // Scroll through once so lazy images load, then wait for them.
        await page.evaluate(async () => {
          for (let y = 0; y < document.documentElement.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 30)); }
          window.scrollTo(0, 0);
          await Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; }))));
        });
        await page.waitForTimeout(150);
        const m = await page.evaluate(() => ({
          scrollW: document.documentElement.scrollWidth,
          innerW: window.innerWidth,
          theme: document.documentElement.dataset.tmTheme,
          offenders: [...document.querySelectorAll("body *")]
            .filter((el) => { const r = el.getBoundingClientRect(); return r.right > window.innerWidth + 1 && r.width > 0 && getComputedStyle(el).position !== "fixed" && !el.closest("dialog, [popover], .tm-table-wrap, .tm-tabs, .tm-sidebar, .pg-matrix-wrap"); })
            .slice(0, 5)
            .map((el) => `${el.tagName.toLowerCase()}.${[...el.classList].join(".")}`),
        }));
        const file = `${p.replace("/", "-")}-${theme}-${vp.name}.png`;
        await page.screenshot({ path: join(outDir, file), fullPage: true });
        if (args.includes("--tiles")) {
          // Viewport-height tiles of tall pages for full-resolution review.
          const h = await page.evaluate(() => document.documentElement.scrollHeight);
          for (let y = 0, i = 0; y < h; y += vp.height, i++) {
            await page.screenshot({ path: join(outDir, file.replace(".png", `-tile${String(i).padStart(2, "0")}.png`)), fullPage: true, clip: { x: 0, y, width: vp.width, height: Math.min(vp.height, h - y) } });
          }
        }
        report.push({ page: p, theme, viewport: vp.name, file, overflowX: m.scrollW > m.innerW, offenders: m.offenders, themeApplied: m.theme === theme, errors: [...errors] });
        process.stdout.write(`${file}${m.scrollW > m.innerW ? "  ⚠ overflow" : ""}${errors.length ? `  ⚠ ${errors.length} errors` : ""}\n`);
      }
    }
    await ctx.close();
  }
} finally {
  await browser.close();
  server?.kill();
}
writeFileSync(join(outDir, "report.json"), JSON.stringify(report, null, 2));
const bad = report.filter((r) => r.overflowX || r.errors.length || !r.themeApplied);
console.log(`\n${report.length} screenshots → ${outDir}; ${bad.length} with issues`);
bad.forEach((r) => console.log(" -", r.file, r.overflowX ? `overflow ${r.offenders.join(", ")}` : "", r.errors.join(" | ")));
