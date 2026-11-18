// axe-core accessibility scan: 6 pages x 3 themes x 2 viewports (one browser, sequential).
// Writes a JSON report to tmp/a11y/axe.json and prints a grouped summary.
//   pnpm build && pnpm a11y
// Automated rules cover only a subset of WCAG; keyboard and visual checks stay in smoke.mjs.
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const OUT = process.env.A11Y_DIR || "tmp/a11y";
mkdirSync(OUT, { recursive: true });
const PORT = process.env.A11Y_PORT || "4176";
const ROUTES = ["analytics", "workspace", "data", "catalog", "content", "components"];
const THEMES = ["light", "dark", "coffee"];
const VIEWPORTS = { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } };
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];
// Documented exemptions (WCAG 1.4.3 excludes inactive UI components): disabled
// rows and the "disabled" badge specimen use --tm-text-disabled on purpose.
// They are still listed in the JSON report, but do not fail the run.
const EXEMPT = [{ rule: "color-contrast", target: /\.is-disabled\b|\.tm-badge--disabled/ }];
const isExempt = (id, target) => EXEMPT.some((e) => e.rule === id && e.target.test(target));
const axeSource = readFileSync("node_modules/axe-core/axe.min.js", "utf8");

const server = spawn("node_modules/.bin/vite", ["preview", "--port", PORT, "--strictPort"], { stdio: ["ignore", "pipe", "inherit"] });
await new Promise((res, rej) => {
  server.stdout.on("data", (d) => String(d).includes(PORT) && res());
  server.on("exit", (c) => rej(new Error(`preview exited ${c}`)));
});
const BASE = `http://localhost:${PORT}/`;
const browser = await chromium.launch({ args: ["--disable-dev-shm-usage"] });

const runs = [];
try {
  for (const [vpName, viewport] of Object.entries(VIEWPORTS)) {
    const ctx = await browser.newContext({ viewport, reducedMotion: "reduce" });
    const page = await ctx.newPage();
    for (const route of ROUTES) {
      for (const theme of THEMES) {
        await page.goto("about:blank");
        await page.goto(`${BASE}?theme=${theme}#/${route}`, { waitUntil: "networkidle" });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(300); // chart first paint
        await page.addScriptTag({ content: axeSource });
        const res = await page.evaluate((tags) => window.axe.run(document, { runOnly: { type: "tag", values: tags }, resultTypes: ["violations", "incomplete"] }), TAGS);
        const slim = (list) => list.map((v) => ({
          id: v.id, impact: v.impact, help: v.help, tags: v.tags.filter((t) => t.startsWith("wcag")),
          nodes: v.nodes.map((n) => ({ target: n.target.join(" "), summary: n.failureSummary?.split("\n").slice(0, 3).join(" | "), html: n.html.slice(0, 160) })),
        }));
        const run = { route, theme, viewport: vpName, violations: slim(res.violations), incomplete: slim(res.incomplete) };
        runs.push(run);
        console.log(`${vpName.padEnd(7)} ${route.padEnd(10)} ${theme.padEnd(6)} violations=${run.violations.reduce((a, v) => a + v.nodes.length, 0)} incomplete=${run.incomplete.reduce((a, v) => a + v.nodes.length, 0)}`);
      }
    }
    await ctx.close();
  }
} finally {
  await browser.close();
  server.kill();
}

writeFileSync(`${OUT}/axe.json`, JSON.stringify(runs, null, 2));
console.log(`exempt (inactive components): ${runs.reduce((a, r) => a + r.violations.reduce((b, v) => b + v.nodes.filter((n) => isExempt(v.id, n.target)).length, 0), 0)} nodes`);
// Group violations by rule across all runs.
const byRule = new Map();
for (const r of runs) for (const v of r.violations) {
  v.nodes = v.nodes.filter((n) => !isExempt(v.id, n.target));
  if (!v.nodes.length) continue;
  const e = byRule.get(v.id) || { impact: v.impact, help: v.help, count: 0, where: new Set(), sample: v.nodes[0] };
  e.count += v.nodes.length;
  e.where.add(`${r.route}/${r.theme}/${r.viewport}`);
  byRule.set(v.id, e);
}
console.log(`\n${byRule.size} violated rules`);
for (const [id, e] of byRule) console.log(`- ${id} [${e.impact}] ${e.help}: ${e.count} nodes in ${e.where.size} runs; e.g. ${e.sample.target}`);
process.exitCode = byRule.size ? 1 : 0;
