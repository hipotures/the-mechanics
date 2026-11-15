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
23. Analytics panel dividers rendered unevenly (1px grid gap on fractional column widths antialiased into 1–2px lines) and used the faint Level 3 color, reading as chart gridlines → dividers are real right/bottom panel borders in the Level 2 color, pixel-snapped; measured exactly 1px `#767b6f` at 1440 and 2000px widths; outer-edge borders clipped under the region frame.
24. Wide screens (owner uses 4K): 6 panels laid out 5 + 1 orphan, 3 charts left an empty column → panel grids keep the 1600px content cap but balance rows (column count from width, then reduced so rows fill evenly; a remaining gap is covered by stretching the last panel). Smoke check asserts no incomplete rows at 900/1440/2000px.
25. Paired horizontal bars (Requests by route) were 1px apart, so small value labels touched the bar above → 12px pitch, 9px bars, 3px gap.
26. Width sweep found pre-existing overflow at 1200px (8-column KPI strip with fixed sparklines) and 640–660px (topbar fixture badge) → KPI strip goes 8-wide only from 1360px and sparklines shrink; badge hidden below 800px. Smoke check now sweeps 28 widths (360–1920px) on all 6 pages.
27. Hand-written SVG charts produced label collisions (scatter time labels, target/threshold labels on points). Owner decision: use Apache ECharts (already used in other owner projects) styled with our tokens → all 16 analytics charts and the gallery chart now render with ECharts 6.1.0 (SVG renderer) via the new token adapter `adapters/echarts.js`; scatter labels use `moveOverlap`, bar labels `hideOverlap`, category labels are thinned by width, reference labels are short values at the line start. Issues found and fixed during the switch: hidden ECharts tooltips showed an empty frame (our tooltip class on the container), donut center title missing (TitleComponent not registered), y-axis category labels clipped when measured before webfonts loaded (explicit label gutter + re-render after `document.fonts.ready`). Verified in Light/Dark/Coffee at 1440 and 390px; keyboard tooltip check passes.
28. Donuts in narrow panels (<300px, e.g. 4K/2000px and 900px layouts): legend rows were drawn over the ring and the center total was off-center → narrow donuts use a taller layout with the same right-aligned value list below the ring; center title centered. Verified at 390/900/1440/2000px.
29. Owner request: define the elements needed for custom charts like “cost over time, stacked by model” (without building that chart) → added rich panel head (subtitle + actions), ECharts helpers `peakMarker`, `rangeArea`, `rangeBrush`, `dayBoundaryLabels`, plus `.tm-chart-readout` / `.tm-chart-options`; composed in a gallery example on fixture data. Drag-to-sum verified: 09:00–15:00 sums to 796 k tokens (236 + 285 + 275). Collision between peak callout and band label fixed (headroom + band label top-left).
30. Owner (phone): a tapped chart tooltip stayed open and, when scrolling, floated over the sticky topbar/nav (ECharts default z-index 9999999) → adapter sets the tooltip z-index to `--tm-z-sticky` (below `--tm-z-nav`), and tooltips close on page scroll and on taps/clicks outside the chart. Verified: forced to the top of the viewport the tooltip renders under the topbar (desktop + phone); after scrolling it is hidden; smoke check covers tap → open, z-index below chrome, scroll → closed.
31. Owner review: thick colored side bars (field error, selected rows, active nav, alerts, toasts, danger dialog, code block) did not fit Sharp Retro-Tech → removed everywhere; rule recorded in DESIGN.md (exceptions: blockquote, TOC indicator). Native number spinners replaced by a `.tm-stepper` component ([−] value [+]) used in the Data editor, product drawer and gallery; buttons disable at min/max (verified: quantity stops at stock 4).
32. Owner: “many delicate elements, Cypherpunk is a strong theme” → “strong controls” variant served side by side and approved: all interactive controls get 2px borders in a new `--tm-ink` token (ink in Light, bright text in Dark/Coffee so checked fills read clearly); checkboxes/radios/switches filled with ink when on (18px); segmented/chip selection marked by fill without underline (owner request). Control heights verified unchanged (28/32px); contrast check adds ink pairs (48 per theme, all pass).
33. Owner: the Compact/Comfortable toggle seemed to do nothing (two-line rows dominated the height) → Compact shows one line per account (id/email as tooltip, note marker), Comfortable shows details with extra padding; measured rows 37px vs 62px, table 401px vs 733px.
34. Owner: select option list used the OS popup (rounded, white, blue highlight) → `appearance: base-select` styling (ink frame, drawn tick, selection fill, focus ring) in supporting browsers; verified in Light/Dark/Coffee with keyboard selection.
35. Owner (most likely Firefox, no base-select support) still saw the OS list → scripted fallback `enhanceSelects()` opens the same styled listbox; tested in Chromium via the `?select=fallback` switch (open, arrows, Enter, Escape, focus return, re-rendered selects) and added to smoke. **Not verified in a real Firefox:** Playwright's Firefox needs system libraries (GTK) that require sudo; not installed per project policy.
36. Owner: the selected row in Workspace “Analysis units” had a 1px frame touching the panel frame and header line (edges looked thicker and messy), unlike the inset side-nav item → selected list rows are now an inset block (3px/4px from the edges) with the same 2px selection frame as the nav; drawn as a background layer, row height unchanged (40px). Gemini review (external) triaged: most critical findings were outdated or contradicted measurements; valid items listed for owner decision.
37. Owner: nav item and selected list row should share spacing → shared tokens `--tm-select-inset`/`--tm-select-pad`/`--tm-select-text`. Measured: edge→frame 4/4px, frame→content 10px, text at 14px for nav items, list rows, column header and nav section labels; positions/sizes identical before and after changing the selection.
38. Owner: in the Content Site hierarchy figure the Level 2 panel frame looked thinner beside its header band (header fill painted over the inner half of the stroke; same for the Level 1 band) → SVG paint order fixed: fills, then dividers, then frames last. Verified at 3× zoom.
39. Owner: the selected list row was vertically cramped versus the nav item; measured text −1px into the frame (overlapping) and the frame 3px from separators → vertical selection geometry tokens (`--tm-select-pad-y` 5px, frame 4px from the row edges). Measured after: frame 4px from separators, text 5px from the frame (nav 4.9px), list row height 40 → 54px (trade-off accepted for legibility).
40. Owner: hovering a list row painted a full-bleed gray band, so a hovered selected row showed the green block inside a gray band; nav items use one inset block for both states → list-row hover is now the same inset block (fill only, transparent frame), and a selected row shows only its selection block on hover. Measured: hover block 4px inset; selected+hover = selection colors only.

### Interaction / keyboard checks — `pnpm smoke` (all pass, [`smoke-results.json`](smoke-results.json))
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
