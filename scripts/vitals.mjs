// Lab Web Vitals per page (mobile 390x844, 4x CPU, ~1.6 Mbps / 150 ms):
// LCP, CLS, long-task time beyond 50 ms (TBT estimate), transferred bytes,
// console errors. Lab numbers for comparing builds, not field data.
//   pnpm build && pnpm vitals
import { chromium } from "playwright";
import { spawn } from "node:child_process";
const PORT = process.env.VITALS_PORT || "4179";
const server = spawn("node_modules/.bin/vite", ["preview", "--port", PORT, "--strictPort"], { stdio: ["ignore", "pipe", "inherit"] });
await new Promise((res) => server.stdout.on("data", (d) => String(d).includes(PORT) && res()));
const b = await chromium.launch({ args: ["--disable-dev-shm-usage"] });
try {
  for (const route of ["analytics", "workspace", "data", "catalog", "content", "components"]) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    const p = await ctx.newPage();
    const cdp = await ctx.newCDPSession(p);
    // Lab throttling roughly like Lighthouse mobile: 4x CPU, slow 4G.
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8 });
    const errors = []; p.on("console", (m) => m.type() === "error" && errors.push(m.text())); p.on("pageerror", (e) => errors.push(String(e)));
    await p.addInitScript(() => {
      window.__v = { lcp: 0, cls: 0, lt: 0 };
      new PerformanceObserver((l) => l.getEntries().forEach((e) => (window.__v.lcp = e.startTime))).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) window.__v.cls += e.value; })).observe({ type: "layout-shift", buffered: true });
      new PerformanceObserver((l) => l.getEntries().forEach((e) => (window.__v.lt += Math.max(0, e.duration - 50)))).observe({ type: "longtask", buffered: true });
    });
    await p.goto(`http://localhost:${PORT}/?theme=light#/${route}`, { waitUntil: "networkidle" });
    await p.waitForTimeout(1500);
    const v = await p.evaluate(() => ({ ...window.__v, bytes: performance.getEntriesByType("resource").reduce((a, e) => a + e.transferSize, 0) }));
    console.log(route.padEnd(11), `LCP ${Math.round(v.lcp)}ms`, `CLS ${v.cls.toFixed(3)}`, `TBT~${Math.round(v.lt)}ms`, `res ${Math.round(v.bytes / 1024)}KB`, errors.length ? `ERR ${errors.join(" | ").slice(0, 200)}` : "no console errors");
    await ctx.close();
  }
} finally { await b.close(); server.kill(); }
