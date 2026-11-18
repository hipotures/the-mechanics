# Performance (lab)

`corepack pnpm build && corepack pnpm vitals` loads each page at mobile size
(390×844) with 4× CPU throttling and about 1.6 Mbps at 150 ms latency. It
reports LCP, CLS, long-task time beyond 50 ms (an estimate of TBT),
transferred bytes and console errors. These are lab numbers for comparing
builds. There is no field data (the playground has no real users).

## Result (2026-11-18)

| Page | LCP before → after | CLS before → after | Long tasks before → after |
|---|---|---|---|
| Analytics | 2936 → 1028 ms | **0.236** → 0.032 | 1159 → 603 ms |
| Workspace | 2160 → 968 ms | 0.012 → 0.012 | 119 → 3 ms |
| Data | 2196 → 1072 ms | 0.002 → 0.002 | 191 → 25 ms |
| Catalog | 3188 → 1280 ms | 0.001 → 0.001 | 152 → 0 ms |
| Content | 2160 → 956 ms | 0.002 → 0.002 | 130 → 4 ms |
| Gallery | 2564 → 1520 ms | 0.040 → 0.054 | 569 → 446 ms |

No console errors on any page, before or after.

## Changes

- **Route-level code splitting** (`src/playground/main.js`). Each page is
  its own chunk. The start bundle went from 284 KB to 21 KB gzipped.
- **ECharts after first paint** (Analytics, Gallery). The chart chunk
  (233 KB gzipped) loads once the page is rendered. Chart boxes reserve
  their height, so nothing moves when the charts arrive. The helpers the
  pages need synchronously (legend, sparkline) are in
  `chart-helpers.js`, which does not import ECharts.
- **Analytics CLS.** At 390 px the filter row fit on one line with the
  fallback font and wrapped once IBM Plex loaded, which pushed the page down
  by about 70 px. On narrow screens Refresh now always starts its own line
  (`.pg-controls--break`).
- **Catalog LCP.** The LCP element is the first product image. The first
  row now loads eagerly and the first image has `fetchpriority="high"`; the
  rest stay lazy.

## Library footprint (unchanged)

`the-mechanics.css` is 27 KB and `the-mechanics.js` 11 KB gzipped. Fonts
are WOFF2 with `font-display: swap` and are split by unicode range. The
built output has no source maps, and the static analyzer from
web-quality-audit reported 0 issues.

## Not done

- Long tasks on Analytics (about 0.6 s at 4× CPU) come from initializing
  about 20 ECharts instances. Mounting charts as they scroll into view
  would reduce this. It is not done here because screenshots and smoke
  tests expect every chart to be present after load.
- Font preloading: the playground's font URLs carry a hash from the bundler,
  and LCP is already about 1 s.
