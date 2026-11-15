# Testing report — v0.1.0

Environment: Ubuntu 26.04, Node 22.22.1, pnpm 10.34.9 (corepack), Playwright 1.65.1 with Chromium headless shell 159 (installed to `.cache/ms-playwright`, disk-backed). One browser, sequential pages. All temp files, caches and raw screenshots under the repository's `tmp/` and `.cache/` (ext4 disk, not tmpfs).

## What was actually tested

### Visual review (screenshots inspected by eye)
- `pnpm shots` → 6 destinations × 3 themes × 2 viewports = **36 full-page screenshots** (desktop 1440×900, mobile 390×844, `reducedMotion: reduce`, fixed fixture data). Curated JPEG copies: [`docs/screenshots/apps/`](../screenshots/apps/). Machine report: [`screenshot-report.json`](screenshot-report.json) — 0 horizontal overflows, 0 console/page errors, theme applied in all 36.
- Inspected directly at full resolution: all six pages in Light desktop; Analytics Dark desktop; Workspace Coffee desktop; Content Coffee desktop; Data Coffee mobile; Catalog Dark mobile; Analytics/Workspace/Content Light mobile (viewport tiles); Component Gallery Light desktop (11 viewport tiles). Remaining combinations were reviewed at thumbnail scale for gross defects only.
- Interaction-state screenshots (from `pnpm smoke`): [`docs/screenshots/states/`](../screenshots/states/) — confirmation dialog, row action menu, product drawer with missing image, cart discount error, 7d empty state, chart keyboard tooltip, workspace terms tab and search empty state, data empty/error states, collapsed sidebar, topbar focus ring, gallery dialog, plain-HTML consumer (Light, Coffee).

### Improvement passes (findings → fixes)
Round 1 (initial screenshots):
1. Prose paragraphs had no spacing and headings lost weight (Tailwind preflight + direct-child rule) → prose spacing rewritten for nested content; explicit heading weights.
2. Content figure: overlapping bars and malformed block IDs → fixed.
3. Chart y-axis unit label collided with the top tick; `1K` tick label → unit label moved above the plot; compact notation only ≥ 10 000.
4. Incident table left an empty grid cell → spans full width.
5. Sidebar background ended at viewport height on long pages → full-height Level-1 column with sticky inner wrapper.
6. Nested records sat on the same tint as their labels, weakening Level 3 → record bodies on surface, only labels tinted.
7. Mobile overflow from hidden tooltip bubbles and nowrap region metadata → tooltips `display:none` when hidden; metadata wraps.
8. Segmented controls stretched to full width in grid containers → `width: fit-content`.
9. Lazy images never loaded in full-page captures → capture script scrolls first.

Round 2 (interaction smoke + state screenshots):
10. **Router set `data-page` on `<main>`; the Data page's pagination handler matched it, so every click re-rendered the table** → renamed to `data-route`. (Static screenshots could not reveal this.)
11. Page listeners accumulated on the shared `<main>` across navigations → fresh element per route.
12. Native `<dialog>` rendered top-left because of Tailwind preflight `margin:0` → `.tm-dialog { margin: auto }`.
13. Product drawer: grid rows collapsed so thumbnails overlapped the main image → drawer content wrapped in a normal-flow container.
14. Contrast: offline badge text 4.38/4.47:1 in Dark/Coffee → lightened to pass 4.5:1.
15. Threshold labels could collide with data points → surface-colored halo on chart labels.
16. Theme switch animated colors for 90 ms → transitions suppressed for one frame during switches.

Round 3 (owner review):
17. Selected chips/segments/tabs switched to bold and shifted their neighbours by 2px → selection no longer changes font weight; new smoke check clicks every option and asserts no sibling moves (fails on the old CSS).
18. Product card footer mixed three element types and heights → stock moved into the body as a bare text badge; footer is a fixed-height price | flush-button strip.
19. Inconsistent hover (buttons filled, chips/pagination/cards changed border; cards are not clickable) → single rule: clickable controls get a fill tint, borders never change on hover, non-clickable containers do not react.
20. Level-2 borders too faint (2.15:1 Coffee, 2.19:1 Dark, 2.51:1 Light on canvas) → raised to ≥3:1 on surface and canvas in all themes; now enforced by `check:contrast` (41 pairs per theme).
21. Light theme shell (topbar, sidebar) used the same cream as the panels and read as colorless white → new `--tm-chrome` token; Light uses warm sand `#e6e0cc` (Dark/Coffee unchanged). Contrast check covers text on chrome (45 pairs per theme).
22. Light panels (`#f6f3eb`) and controls (`#fbfaf5`, even brighter) glared against the gray canvas → two variants were served side by side for owner review; chosen variant tones panels to `#efebe1` and controls to `#f2efe6` (heads/sunken shifted proportionally, canvas unchanged). All contrast pairs pass.

### Interaction / keyboard checks — `pnpm smoke` (15/15 pass, [`smoke-results.json`](smoke-results.json))
Desktop 1440×900, Chromium:
- Theme switch: instant, reflected in `?theme=`, persisted across reload; **page width/height identical across Light/Dark/Coffee on all 6 pages**.
- Keyboard: first Tab reaches the skip link; focus ring is `solid 2px`.
- Navigation `aria-current`, sidebar collapse.
- Analytics: 18 panels (15 SVG charts + incident table + 2 state panels), legend toggle `aria-pressed`, keyboard tooltip via arrow keys, service filter, 7d empty states, refresh loading skeleton + toast.
- Workspace: no-results search, unit selection, arrow-key tabs, long-term wrap row, load-next loading → end notice.
- Data: initial indeterminate header, sort `aria-sort`, pagination, empty query, select-all, bulk deactivate dialog (Escape closes and **focus returns** to trigger; confirm applies + toast), row menu via keyboard, inline rename with Enter, editor validation (invalid → fixed), loading and error states.
- Catalog: no-results query, PROD-012 drawer with missing-image failure state, cart discount `NOTVALID` error, category filter.
- Content: TOC moves focus to section heading.
- Gallery: popover menu arrow keys + Escape, tooltip on focus + Escape dismissal, dialog.
- Reduced motion: spinner animation duration ≈ 0.
- No uncaught page errors during the run.

### Contrast — `pnpm check:contrast`
39 essential token pairs × 3 themes, all ≥ 4.5:1 (text) / ≥ 3:1 (graphics, control boundaries, focus ring, chart series). Full table: [`contrast.md`](contrast.md).

### Build
`pnpm build` (CSS distribution + Vite production build) succeeds; the compiled CSS was loaded alone in `examples/plain-html/` and rendered correctly (fonts, Light and Coffee themes).

## Not tested / limitations
- **Browsers:** only Chromium. Firefox and Safari were not run (native `popover`, `:has()`, `color-mix()` and range-thumb styling should be checked there; range fill uses a WebKit-only gradient with a Firefox `::-moz-range-progress` fallback).
- **Screen readers:** no NVDA/JAWS/VoiceOver session. ARIA roles/labels were authored and spot-checked through DOM assertions only.
- **Contrast of non-token colors:** translucent hover tints, `color-mix()` heatmap cells (mid-range cells, ~55 %, have the lowest text contrast) and chart text on fills were not measured.
- **Tablet widths** (640–1200 px) were not screenshot-reviewed; layouts have breakpoints at 640/900/1200 but only 390 and 1440 were captured.
- **Mobile interactions** (touch, drawers on mobile, menu positioning on narrow screens) were not exercised by the smoke test; only mobile static rendering was reviewed.
- **Zoom / text-spacing** (WCAG 1.4.4, 1.4.12) not tested.
- No claim of full WCAG 2.2 AA conformance is made.
