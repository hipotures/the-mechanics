// Focused interaction / keyboard / state smoke checks (one browser, sequential).
// Also captures interaction-state screenshots to tmp/screenshots/states.
//   pnpm build && pnpm smoke
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const shots = process.env.SHOT_DIR || "tmp/screenshots/states";
mkdirSync(shots, { recursive: true });
const server = spawn("node_modules/.bin/vite", ["preview", "--port", "4174", "--strictPort"], { stdio: ["ignore", "pipe", "inherit"] });
await new Promise((res, rej) => {
  server.stdout.on("data", (d) => String(d).includes("4174") && res());
  server.on("exit", (c) => rej(new Error(`preview exited ${c}`)));
});
const BASE = "http://localhost:4174/";
const browser = await chromium.launch({ args: ["--disable-dev-shm-usage"] });
const results = [];
const errors = [];

async function check(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`ok   ${name}`);
  } catch (e) {
    results.push({ name, ok: false, error: String(e.message || e).split("\n")[0] });
    console.log(`FAIL ${name}: ${String(e.message || e).split("\n")[0]}`);
  }
}
const assert = (c, msg) => { if (!c) throw new Error(msg); };

try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(String(e)));
  const go = async (route, theme = "light") => {
    await page.goto("about:blank"); // force a full reload: hash-only changes would keep state
    await page.goto(`${BASE}?theme=${theme}#/${route}`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
  };
  const shot = async (n) => { await page.waitForTimeout(350); await page.screenshot({ path: join(shots, `${n}.png`) }); };

  /* ---- Shell ---------------------------------------------------- */
  await check("theme switch is instant, reflected in URL and persisted", async () => {
    await go("analytics");
    const before = await page.locator(".tm-kpi").first().boundingBox();
    await page.click('label:has(input[value="coffee"])');
    assert((await page.getAttribute("html", "data-tm-theme")) === "coffee", "attribute not set");
    assert(page.url().includes("theme=coffee"), "URL not updated");
    const after = await page.locator(".tm-kpi").first().boundingBox();
    assert(JSON.stringify(before) === JSON.stringify(after), "geometry changed with theme");
    await page.goto(`${BASE}#/analytics`);
    assert((await page.getAttribute("html", "data-tm-theme")) === "coffee", "not persisted");
    await page.click('label:has(input[value="light"])');
  });
  await check("theme geometry identical across all themes (6 pages)", async () => {
    for (const r of ["analytics", "workspace", "data", "catalog", "content", "components"]) {
      const sizes = [];
      for (const t of ["light", "dark", "coffee"]) {
        await go(r, t);
        sizes.push(await page.evaluate(() => `${document.documentElement.scrollWidth}x${document.documentElement.scrollHeight}`));
      }
      assert(new Set(sizes).size === 1, `${r}: ${sizes.join(" / ")}`);
    }
  });
  await check("keyboard: first Tab reaches skip link; focus ring visible", async () => {
    await go("analytics");
    await page.keyboard.press("Tab");
    const f = await page.evaluate(() => ({ cls: document.activeElement.className, outline: getComputedStyle(document.activeElement).outlineStyle }));
    assert(f.cls.includes("pg-skip"), `focused ${f.cls}`);
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    const ring = await page.evaluate(() => { const s = getComputedStyle(document.activeElement); return `${s.outlineStyle} ${s.outlineWidth}`; });
    assert(ring.startsWith("solid 2px"), `ring: ${ring}`);
    await shot("focus-ring-topbar");
  });
  await check("navigation + sidebar collapse", async () => {
    await go("analytics");
    await page.click('[data-nav="workspace"]');
    await page.waitForFunction(() => document.title.startsWith("Workspace"));
    assert((await page.getAttribute('[data-nav="workspace"]', "aria-current")) === "page", "aria-current");
    await page.click("#sidebar-toggle");
    assert((await page.getAttribute("#shell", "data-sidebar")) === "collapsed", "not collapsed");
    await shot("sidebar-collapsed");
    await page.click("#sidebar-toggle");
  });

  /* ---- Analytics ------------------------------------------------ */
  await check("analytics: 16 charts + 2 state panels, legend toggle, keyboard tooltip", async () => {
    await go("analytics");
    assert((await page.locator("[data-panel]").count()) === 18, "panel count");
    assert((await page.locator("[data-chart] svg").count()) === 15, "15 svg charts + 1 table");
    const btn = page.locator('[data-panel="requests"] [data-series="Worker"]');
    await btn.click();
    assert((await btn.getAttribute("aria-pressed")) === "false", "legend not toggled");
    await page.focus('[data-chart="ttft"]');
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await page.waitForFunction(() => { const t = document.querySelector('[data-chart="ttft"] .pg-echarts-tip'); return t && getComputedStyle(t).display !== "none" && getComputedStyle(t).opacity !== "0" && t.textContent.includes("p95"); }, null, { timeout: 3000 });
    await page.locator('[data-panel="ttft"]').screenshot({ path: join(shots, "chart-keyboard-tooltip.png") });
  });
  await check("analytics: service filter + time range empty state + refresh", async () => {
    await go("analytics");
    await page.selectOption("#svc", "Queue");
    const vis = await page.locator("[data-panel]:visible").count();
    assert(vis > 0 && vis < 18, `visible ${vis}`);
    await page.selectOption("#svc", "All services");
    await page.click('label:has(input[value="7d"])');
    assert((await page.locator(".tm-state__title", { hasText: "No data for selected period" }).count()) > 5, "empty states");
    await shot("analytics-7d-empty");
    await page.click('label:has(input[value="24h"])');
    await page.click("#refresh");
    assert(await page.locator(".pg-skel-chart").first().isVisible(), "no loading skeleton");
    await page.waitForSelector(".tm-toast");
  });

  /* ---- Workspace ------------------------------------------------ */
  await check("workspace: search empty state, unit select, tab keys, load next", async () => {
    await go("workspace");
    await page.fill("#unit-search", "nonexistent-unit-xxxxx");
    assert(await page.locator("#unit-list .tm-state").isVisible(), "no empty state");
    await shot("workspace-search-empty");
    await page.fill("#unit-search", "");
    await page.click('[data-unit="ch0005_a001"]');
    assert((await page.textContent("#preview-title")).includes("ch0005_a001"), "unit not selected");
    await page.click('[data-unit="ch0001_a001"]');
    await page.focus('[data-tab="Preview"]');
    await page.keyboard.press("ArrowRight");
    assert((await page.getAttribute('[data-tab="Terms"]', "aria-selected")) === "true", "tab key nav");
    assert((await page.textContent("#tabpanel")).includes("Hyperdimensional"), "long term missing");
    await shot("workspace-terms-tab");
    await page.keyboard.press("ArrowLeft");
    await page.click("#load-next");
    await page.waitForSelector(".tm-alert--info", { timeout: 3000 });
  });

  /* ---- Data management ------------------------------------------ */
  await check("data: sort, empty search, select all/indeterminate, pagination", async () => {
    await go("data");
    assert(await page.evaluate(() => document.getElementById("check-all").indeterminate), "initial indeterminate");
    await page.click('[data-sort="name"]');
    assert((await page.getAttribute('th:has([data-sort="name"])', "aria-sort")) === "ascending", "sort");
    await page.click('[data-page="2"]');
    assert((await page.textContent(".tm-pagination__info")).startsWith("11–20"), "pagination");
    await page.fill("#q", "definitely-no-such-account-zzzzz");
    assert(await page.locator("#table-wrap .tm-state").isVisible(), "empty");
    await shot("data-empty");
    await page.click("#clear-filters");
    await page.click("#check-all"); // re-renders the table, so no page.check() re-verification
    assert((await page.textContent("#bulk .tm-badge--count")) !== "3", "select all");
  });
  await check("data: confirmation dialog — Escape closes and returns focus; confirm applies", async () => {
    await go("data");
    await page.click('[data-bulk="deactivate"]');
    await page.waitForSelector("dialog[open]");
    await shot("data-confirm-dialog");
    await page.keyboard.press("Escape");
    await page.waitForSelector("dialog[open]", { state: "detached" });
    assert(await page.evaluate(() => document.activeElement?.dataset.bulk === "deactivate"), "focus not returned");
    await page.click('[data-bulk="deactivate"]');
    await page.click('dialog button[value="confirm"]');
    await page.waitForSelector(".tm-toast");
  });
  await check("data: row menu keyboard, inline edit, editor validation, loading/error states", async () => {
    await go("data");
    const trigger = page.locator('[popovertarget^="menu-"]').first();
    await trigger.focus();
    await page.keyboard.press("Enter");
    await page.waitForSelector(".tm-menu:popover-open");
    await page.keyboard.press("ArrowDown");
    await shot("data-row-menu");
    await page.keyboard.press("Escape");
    await page.locator("[data-inline]").first().click();
    await page.fill("#inline-input", "Zoë Mitchell-Renamed");
    await page.keyboard.press("Enter");
    assert((await page.textContent("#acc-table")).includes("Renamed"), "inline edit");
    await page.click('#editor button[type="submit"]');
    assert((await page.getAttribute("#e-email", "aria-invalid")) === "true", "email not invalid");
    await page.fill("#e-email", "editor@example.test");
    await page.fill("#e-limit", "42");
    await page.click('#editor button[type="submit"]');
    assert((await page.getAttribute("#e-email", "aria-invalid")) === "false", "still invalid");
    await page.click('label:has(input[name="mode"][value="loading"])');
    assert((await page.getAttribute("#table-wrap", "aria-busy")) === "true", "loading");
    await page.click('label:has(input[name="mode"][value="error"])');
    await shot("data-error-state");
    assert(await page.locator("#table-wrap .tm-state--error").isVisible(), "error state");
  });

  /* ---- Catalog -------------------------------------------------- */
  await check("catalog: no results, detail drawer with missing image, cart discount error", async () => {
    await go("catalog");
    await page.fill("#cat-q", "supercalifragilistic-gear");
    assert(await page.locator("#grid .tm-state").isVisible(), "no-results state");
    await page.click("#clear-cat");
    await page.click('[data-detail="PROD-012"]');
    await page.waitForSelector("#detail[open]");
    await page.waitForFunction(() => document.querySelector('#detail .tm-media[data-state="error"]'));
    await shot("catalog-detail-drawer");
    await page.keyboard.press("Escape");
    await page.click("#open-cart");
    await page.click('#discount button');
    assert(await page.locator("#code-err").isVisible(), "discount error");
    await shot("catalog-cart-discount-error");
    await page.keyboard.press("Escape");
    await page.click('[data-cat="Electronics"]');
    assert((await page.locator(".tm-product").count()) === 2, "category filter");
  });

  await check("selection never shifts neighbours (chips, segmented, tabs, theme switcher)", async () => {
    // Clicking an option must not change any sibling's position or size.
    const groups = [
      ["catalog", "[data-cat]"],
      ["analytics", '.tm-segmented:has(input[name="range"]) .tm-segmented__option'],
      ["analytics", "#theme-switcher .tm-segmented__option"],
      ["data", '.tm-segmented:has(input[name="mode"]) .tm-segmented__option'],
      ["workspace", "[data-tab]"],
    ];
    for (const [route, sel] of groups) {
      await go(route, "coffee");
      const boxes = () => page.$$eval(sel, (els) => els.map((e) => { const r = e.getBoundingClientRect(); return `${r.x.toFixed(1)},${r.width.toFixed(1)}`; }).join("|"));
      const ref = await boxes();
      const n = await page.locator(sel).count();
      for (let i = 0; i < n; i++) {
        await page.locator(sel).nth(i).click();
        const now = await boxes();
        assert(now === ref, `${route} ${sel} item ${i}: ${ref} -> ${now}`);
      }
    }
  });

  await check("no horizontal overflow at 28 widths (360–1920px) on all pages", async () => {
    const bad = [];
    for (const r of ["analytics", "workspace", "data", "catalog", "content", "components"]) {
      await go(r);
      for (const w of [360, 390, 414, 480, 560, 600, 620, 640, 660, 700, 768, 800, 820, 880, 900, 960, 1024, 1100, 1180, 1200, 1240, 1280, 1366, 1440, 1536, 1600, 1700, 1920]) {
        await page.setViewportSize({ width: w, height: 900 });
        await page.waitForTimeout(40);
        const sw = await page.evaluate(() => document.documentElement.scrollWidth);
        if (sw > w) bad.push(`${r}@${w}=${sw}`);
      }
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    assert(!bad.length, bad.join(" "));
  });
  await check("analytics panel grids have no empty cells at 900/1440/2000px", async () => {
    for (const w of [900, 1440, 2000]) {
      await page.setViewportSize({ width: w, height: 900 });
      await go("analytics");
      await page.waitForTimeout(200);
      const holes = await page.evaluate(() =>
        [...document.querySelectorAll(".tm-panel-grid")].map((g) => {
          const cols = getComputedStyle(g).gridTemplateColumns.split(" ").length;
          const rows = new Map();
          g.querySelectorAll(":scope > :not([hidden])").forEach((el) => {
            const b = el.getBoundingClientRect();
            rows.set(Math.round(b.top), (rows.get(Math.round(b.top)) || 0) + Math.round(b.width / (g.clientWidth / cols)));
          });
          return [...rows.values()].filter((n) => n !== cols).length;
        }).reduce((a, b) => a + b, 0),
      );
      assert(holes === 0, `${w}px: ${holes} incomplete rows`);
    }
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  await check("chart tooltip: below sticky chrome, closes on scroll (touch phone)", async () => {
    const c2 = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const p2 = await c2.newPage();
    await p2.goto(`${BASE}?theme=coffee#/analytics`, { waitUntil: "networkidle" });
    await p2.evaluate(() => document.fonts.ready);
    await p2.evaluate(() => scrollTo(0, 900));
    await p2.waitForTimeout(400);
    const box = await p2.locator('[data-chart="requests"]').boundingBox();
    await p2.touchscreen.tap(box.x + box.width * 0.6, box.y + box.height * 0.4);
    await p2.waitForTimeout(300);
    const st = () => p2.evaluate(() => {
      const t = document.querySelector('[data-chart="requests"] .pg-echarts-tip');
      const cs = getComputedStyle(t);
      return { vis: cs.display !== "none" && +cs.opacity > 0 && cs.visibility !== "hidden", z: +cs.zIndex, nav: +getComputedStyle(document.querySelector(".tm-topbar")).zIndex };
    });
    const a = await st();
    assert(a.vis, "tooltip did not open on tap");
    assert(a.z < a.nav, `tooltip z-index ${a.z} not below topbar ${a.nav}`);
    await p2.evaluate(() => scrollBy(0, 300));
    await p2.waitForTimeout(300);
    assert(!(await st()).vis, "tooltip still visible after scroll");
    await c2.close();
  });

  /* ---- Content / gallery ---------------------------------------- */
  await check("content: TOC navigation moves focus to section heading", async () => {
    await go("content");
    await page.click('#toc [data-scroll="guides"]');
    assert(await page.evaluate(() => document.activeElement.id === "guides-h"), "focus");
  });
  await check("gallery: popover menu arrow keys + Escape; dialog; tooltip on focus; drag-to-sum", async () => {
    await go("components");
    await page.click('[popovertarget="g-menu"]');
    await page.waitForFunction(() => document.activeElement.getAttribute("role") === "menuitem");
    await page.keyboard.press("ArrowDown");
    const t = await page.evaluate(() => document.activeElement.textContent.trim());
    assert(t === "Duplicate", `focused ${t}`);
    await page.keyboard.press("Escape");
    assert(!(await page.locator("#g-menu:popover-open").count()), "menu still open");
    await page.focus('[aria-describedby="gt1"]');
    assert(await page.locator("#gt1").isVisible(), "tooltip not shown on focus");
    await page.keyboard.press("Escape");
    assert(!(await page.locator("#gt1").isVisible()), "tooltip not dismissed with Escape");
    // Composite chart: drag across 09:00–15:00 sums the stacked buckets.
    await page.locator("#cx-chart").scrollIntoViewIfNeeded();
    const bb = await page.locator("#cx-chart").boundingBox();
    await page.mouse.move(bb.x + bb.width * 0.42, bb.y + 120);
    await page.mouse.down();
    await page.mouse.move(bb.x + bb.width * 0.75, bb.y + 120, { steps: 8 });
    await page.mouse.up();
    await page.waitForFunction(() => document.querySelector("#cx-readout").textContent.startsWith("Selected"));
    const ro = await page.textContent("#cx-readout");
    assert(ro.includes("09:00–15:00") && ro.includes("796"), `readout: ${ro}`);
    await page.click("#g-dialog");
    await page.waitForSelector("#g-dlg[open]");
    await shot("gallery-dialog");
    await page.keyboard.press("Escape");
  });
  await ctx.close();

  /* ---- Reduced motion ------------------------------------------- */
  await check("reduced motion: animations neutralised", async () => {
    const c2 = await browser.newContext({ reducedMotion: "reduce" });
    const p2 = await c2.newPage();
    await p2.goto(`${BASE}#/components`);
    const d = await p2.evaluate(() => getComputedStyle(document.querySelector(".tm-spinner")).animationDuration);
    assert(parseFloat(d) < 0.001, `spinner ${d}`);
    await c2.close();
  });
  await check("no uncaught page errors", async () => assert(!errors.length, errors.join(" | ")));
} finally {
  await browser.close();
  server.kill();
}
writeFileSync(join(shots, "smoke-results.json"), JSON.stringify(results, null, 2));
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
