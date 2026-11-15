# The Mechanics — Design Language

**Status:** first reviewable implementation (v0.1.0) for owner review. This document records the *proposed* design language; it is not yet an approved standard for other applications.

Direction: **Sharp Retro-Tech / Structured Technical Minimalism** — precise geometry, a strong hierarchy of primary regions, lighter nested boundaries, compact legible typography, restrained decoration. It should look like precise, useful desktop software: not a rounded-card SaaS dashboard, not a terminal emulator, not a game.

Source of truth for values: `src/the-mechanics/tokens.css` (geometry, type, spacing, motion) and `src/the-mechanics/themes.css` (color). This document explains *why* and *how to use* them.

---

## 1. Principles

1. **Hierarchy by boundary strength.** Importance is shown by how strong a boundary is, not by how many boxes there are. One strong outer frame; medium panels inside; hairlines and tints inside those.
2. **Density without noise.** Compact rows (32 px), 13 px UI text, tabular numerals — but separators get *weaker* as content gets more granular.
3. **Color means something.** Accent = primary action / selection. Status hues = state. Chart hues = series identity. Decoration uses neutrals.
4. **Never color alone.** Every status badge has a marker shape; series have dash patterns or marker styles; selection adds a 3–4 px bar; invalid fields add an inset bar and an error message.
5. **Themes change paint, never geometry.** Verified by the smoke test: page dimensions are identical in all three themes on all six pages.
6. **One hover language.** Every clickable control signals hover by a fill tint (`--tm-hover`), never by changing its border; selection never changes font weight (widths stay constant). Only form fields darken their border on hover. Containers that are not clickable (panels, product cards, regions) do not react to hover.
7. **Native first.** `<dialog>`, `<details>`, `popover`, real inputs and buttons. This keeps the CSS portable to any framework or server-rendered stack.

## 2. Three-level visual hierarchy

| Level | Use | Border | Header band | Examples |
|---|---|---|---|---|
| **1 · Region** | App shell parts and major page sections | `2px` `--tm-line-1` (ink) | `--tm-head-1`, display font, 2px rule below | `.tm-topbar`, `.tm-sidebar`, `.tm-region`, `.tm-kpi-strip`, dialogs |
| **2 · Panel** | Functional panels, tables, cards | `1px` `--tm-line-2` (pencil) | `--tm-head-2`, UI font semibold 13px, hairline below | `.tm-panel`, `.tm-table-wrap`, `.tm-card`, `.tm-product` |
| **3 · Record** | Nested groups, rows, block labels | `1px` `--tm-line-3` (hairline) or background tint only | `--tm-sunken`, mono 11px | `.tm-record`, `.tm-group`, `.tm-row`, table rows |

Rules:

- A nested header must never use a heavier border, larger type or darker band than its parent.
- Panels inside a region with many siblings use **`.tm-panel-grid`**: panels lose their own frame and are separated by shared hairlines, so 16 charts read as one instrument cluster instead of 16 cards.
- Badges are Level-3 weight regardless of where they appear.
- Charts sit directly in the panel body; they never get their own frame.
- Shadows exist only on overlays (dialogs, menus, toasts) as a hard 4 px offset; regions and panels are flat.

## 3. Themes

Selected by `data-tm-theme` on `<html>` (or any subtree). Light is the default.

| Theme | Intent | Canvas → surface | Text | Accent | Focus |
|---|---|---|---|---|---|
| **Light / Paper-Stone** | Stone-gray canvas, cream paper, green-black ink. Surfaces are visibly distinct from canvas (not white-on-white). | `#dcd9cf` → `#efebe1` (shell `#e6e0cc`) | `#22271f` | olive `#44622a` | blue `#1d5fb0` |
| **Dark / Graphite** | Lifted graphite (canvas `#26292c`, never near-black); muted olive accent, no neon. | `#26292c` → `#33373b` | `#e9ebe6` | `#aac67b` | `#7db3ff` |
| **Coffee / Espresso-Mocha** | Warm mid-dark espresso, mocha surfaces, cream text, muted copper. Distinct from Graphite by hue, not just lightness. | `#33261e` → `#433228` | `#f3e8d8` | copper `#d79560` | teal `#83cfc6` |

Design choices:

- The **focus ring is a different hue family from the accent/selection** in every theme (blue/blue/teal vs olive/olive/copper), so *selected* and *focused* are always distinguishable even on the same element.
- Level-1 lines are dark ink in Light but a light gray / latte in the dark themes. Level-2 lines are lighter in tone and 1px instead of 2px, but still meet ≥3:1 against both the panel surface and the page canvas in every theme, so every panel and card edge is clearly visible. Level 3 hairlines are decorative separators inside a panel.
- The built-in daisyUI `retro`, `coffee`, `caramellatte`, `wireframe` and `cyberpunk` themes were inspected as references (radius/border/depth and base colors). None is used; all three themes are original values.

Contrast for 39 essential pairs per theme is computed by `pnpm check:contrast` → [docs/verification/contrast.md](docs/verification/contrast.md). All pass (4.5:1 text, 3:1 graphics/control boundaries).

## 4. Tokens (public API `--tm-*`)

### Color roles (per theme)
`--tm-chrome`, `--tm-canvas`, `--tm-surface`, `--tm-surface-alt`, `--tm-head-1`, `--tm-head-2`, `--tm-sunken`, `--tm-inset`, `--tm-inverse` · `--tm-text`, `--tm-text-2`, `--tm-text-3`, `--tm-text-inverse`, `--tm-text-disabled` · `--tm-line-1/2/3`, `--tm-line-input`, `--tm-line-disabled` · `--tm-accent`, `-hover`, `-press`, `-text`, `-soft` · `--tm-link`, `--tm-link-hover` · `--tm-hover`, `--tm-press`, `--tm-select-bg`, `--tm-select-line`, `--tm-focus` · status `--tm-{success|warning|danger|info|pending|neutral|offline}` each with `-soft` and `-line` · charts `--tm-chart-1…8`, `--tm-chart-grid`, `--tm-chart-axis`, `--tm-chart-threshold`, `--tm-chart-target`, `--tm-chart-fill-opacity`, `--tm-heat-lo`, `--tm-heat-hi` · `--tm-shadow-overlay`, `--tm-shadow-raised`, `--tm-backdrop`.

### Typography
| Token | Value | Use |
|---|---|---|
| `--tm-font-ui` | IBM Plex Sans | body, controls, panel titles |
| `--tm-font-mono` / `--tm-font-numeric` | IBM Plex Mono | labels, IDs, numbers, ticks, code |
| `--tm-font-display` | IBM Plex Mono (bold, −0.02em) | page/region titles, hero |
| `--tm-font-prose` | IBM Plex Sans | long-form reading |
| Scale | 11 · 12 · **13** · 14 · 16 · 18 · 22 · 28 · 40 px | 11px is the floor (eyebrows, ticks) |
| Weights | 400 / 500 / 600 / 700 | |
| Line heights | 1.15 tight · 1.3 snug · 1.4 UI · 1.65 prose | |
| Tracking | −0.02em titles · 0.08em uppercase mono labels | |

Why Plex: open license (OFL-1.1), a *soft* monospace with clear `0/O`, `1/l/I` distinction, a matching sans for body text, and complete Latin Extended-A coverage — Polish diacritics (`Zażółć gęślą jaźń`) render in both families in all screenshots. Monospace is used for labels and data, not paragraphs.

### Spacing, geometry, density
- Spacing: 4 px rhythm `--tm-space-1…16` (4, 8, 12, 16, 20, 24, 32, 40, 48, 64).
- Radius: regions/panels **0**, controls/badges **2 px**, overlays **3 px**. No pills.
- Border widths: `--tm-bw-1` 2 px, `--tm-bw-2` 1 px, `--tm-bw-3` 1 px (strength comes from color), focus 2 px + 2 px offset.
- Controls: 28 / 32 / 40 px; checkbox 16 px; icons 14 / 16 / 20 px.
- Density: rows 32 px compact (default) / 40 px comfortable via `.tm-density-comfortable` on any subtree. Toolbar 44 px, topbar 48 px.
- Media: product 4:3, thumbnail 1:1, hero 16:9.

### Layout
Reading width 68ch; content max 1600 px; narrow 1120 px; sidebar 232 px (56 px collapsed); drawer `min(26rem, 100vw)`; dialog `min(30rem, 100vw − 2rem)`. Breakpoints: 640 (stack tables, single-column forms), 900 (sidebar → horizontal strip, layouts stack), 1200, 1440.

### Motion
90 / 150 / 240 ms, `cubic-bezier(.2,0,0,1)`. Only color, opacity and small translations animate. `prefers-reduced-motion: reduce` zeroes durations and stops spinners, shimmer and stripes (verified). Theme switching suppresses transitions for one frame (`.tm-theme-switching`) so the change is instant.

## 5. Component rules

| Component | Rules |
|---|---|
| Button | Variants primary / secondary / outline / ghost / danger / danger-outline; sizes sm / md / lg; icon-only must have `aria-label`. Loading = `aria-busy="true"` (spinner + label kept). Disabled = muted surface, gray border and text, `not-allowed` cursor. Pressed = `aria-pressed="true"`. |
| Segmented control | Radio inputs inside `.tm-segmented__option` (or `aria-pressed` buttons). Selected = selection tint + 3 px underline + full-strength text color. Selection never changes font weight, so widths never shift. |
| Fields | Label above, hint below, error replaces nothing (both can show). Invalid = `aria-invalid="true"` → red border + 3 px inset bar + `.tm-field__error` with a “!” glyph. Read-only = dashed outline, transparent fill. Prefix/suffix via `.tm-input-group` + `.tm-affix`. |
| Selection | Square checkbox (2 px radius), round radio, rectangular switch (not pill). Indeterminate shows a bar. Descriptions via `.tm-choice__desc`. |
| Badge | Mono 11 px, 1 px tinted border, soft fill, **marker shape per tone** (✓ success, ▲ warning, ✕ danger, ● info, ○ pending, dashed □ offline, — disabled). Count badge is inverse. |
| Alert vs toast | Alerts are persistent, in-flow, 4 px left bar. Toasts are transient (5 s default, pause on hover, progress line); errors are persistent until dismissed. |
| Tooltip | Supplementary only; appears on hover **and** focus; Escape dismisses without moving focus. |
| Tabs | Underline 3 px in selection color + bold; arrow-key roving. |
| Table | Sticky mono header within bounded scroll containers, tabular numerals, numbers right-aligned, negative values in danger color with a real minus sign, selected row = tint + 4 px left bar. On < 640 px `.tm-table--stack` turns rows into labelled records. |
| Menu / popover | Native `popover`, Level-2 frame with Level-1 ink border and hard shadow; arrow keys, Home/End, Escape, focus return. |
| Dialog / drawer | Native `<dialog>`; 2 px ink frame; head band `--tm-head-1`; destructive dialogs add a danger bar to the head. Escape and backdrop close; focus returns to the trigger. |
| Empty / error / stale | `.tm-state` (+ `--error`, `--warning`). Always title + explanation + (where possible) one recovery action. |
| KPI | Mono value, unit in smaller muted type, trend with arrow + sign + text (“improving/worsening” for screen readers); good/bad depends on metric direction, not on sign. |
| Charts | See §6. |
| Product card | Image first (4:3); body is a stack of plain lines — meta, title (wraps fully, never truncated), description, rating, stock status as a bare badge (marker + text, no frame). Footer is one fixed-height strip of two cells: price left, action button flush with the card frame on the right, so the two share one height and center line and footers align across a row. Never mix a boxed badge, a stacked price and a floating button in the footer. Missing image shows a hatched fallback with text. |
| Prose | 16 px / 1.65, 68ch, display-font headings, square accent bullets, ink blockquote bar, code with 4 px left bar. |

### Documentation-only state classes
`.is-hover`, `.is-active`, `.is-focus`, `.is-selected`, `.is-open` mirror interactive states for galleries and visual tests. Applications should rely on real pseudo-classes and ARIA states.

## 6. Chart grammar

- **Renderer: Apache ECharts** (SVG renderer). Charts are never hand-drawn; ECharts owns layout, axis label thinning and label-collision handling (`labelLayout: moveOverlap / hideOverlap`). All visual values come from `--tm-*` tokens through `adapters/echarts.js` (`readChartTokens` → `createEChartsTheme`), so charts follow the active theme and are rebuilt on theme switch. KPI sparklines stay as tiny inline SVG (no labels).
- One grammar: hairline horizontal grid (`--tm-chart-grid`), ink baseline, mono 10.5 px ticks, unit label above the y-axis, no chart frame.
- Series order is fixed: chart-1 blue/copper, chart-2 orange/blue, chart-3 green… Series 2–4 are dashed/dotted lines, alternate series use solid vs hollow point markers.
- Thresholds are dashed `--tm-chart-threshold` lines, targets dotted `--tm-chart-target`. The line is named in the legend; the on-chart label is the short value (“750 ms”, “75% target”) at the left end, on a surface-colored background, away from the latest values.
- Point labels that collide are moved apart by ECharts with a leader line; bar value labels that would overlap are hidden rather than drawn over each other. Category labels are thinned so neighbours keep ≥12 px; value axes get one tick per ~64 px.
- Bars with long category labels automatically switch to horizontal layout so labels are never rotated or clipped. Zero values render as a visible 1 px tick.
- Donuts always carry a value + percentage legend; heatmaps print the value in every cell.
- Tooltips sit below sticky app chrome (`--tm-z-sticky`) and close on scroll or a tap outside the chart, so they never drift away from their data.
- Tooltips: hover **or** keyboard (focus chart, ←/→/Home/End, Escape); values are mirrored into a polite live region.
- **Building blocks for composite time charts** (e.g. “cost over time, stacked by model, 30-minute buckets”): rich panel head `.tm-panel__head--rich` (`.tm-panel__heading` = title + `.tm-panel__subtitle`, `.tm-panel__actions` = legend + metric `.tm-segmented--sm`); ECharts adapter helpers `peakMarker()` (boxed “peak 12:00 285 k tokens” callout), `rangeArea()` (labelled band for quota windows / incidents, tone neutral|warning|danger|success), `rangeBrush()` (drag along x to select a span) and `dayBoundaryLabels()` (midnight shown as the bold date); `.tm-chart-readout` for the live sum of a selection and `.tm-chart-options` for overlay toggles under the chart. Leave ~25 % headroom above the tallest value for the peak callout. A working composition is in the Component Gallery › Data graphics (fixture data only); concrete product charts are assembled from these pieces when needed.
- States: data, no data (`.tm-state`), stale (warning badge + hatched body + reduced opacity), error (`.tm-state--error` + retry).

## 7. Permitted variations

- Applications may choose comfortable density, wider reading width, or `.tm-panel-grid` vs separate panels depending on task.
- A product may add a fourth theme by supplying every color role in `themes.css`; it must pass `check:contrast`.
- Display font may be switched to the UI font for content-heavy products (`--tm-font-display`).
- Accent hue may be re-tuned per product; status and chart semantics may not.

## 8. Anti-patterns (do not)

- Rounded (>3 px) cards, pill buttons, pill badges.
- Repeating a 2 px ink border on every nested card; nested headers that are bolder/darker than their parent.
- Drop shadows on regions or panels; blurred/frosted layers.
- White-on-white Light surfaces; near-black (#000–#1a1a1a) dark surfaces; neon lime as a default accent.
- Color-only status, selection or series encoding.
- Truncating product titles or data that the user must read; rotating axis labels.
- Random or live chart data in fixtures or screenshots.
- Importing Tailwind/daisyUI into a consumer just to get these styles.

## 9. Decisions for owner review

1. **Monospace display headings** (Plex Mono bold) give the retro-tech character; an alternative is Plex Sans headings with mono only for labels.
2. **Level-2 line contrast** was raised after review (previously 2.2:1 in Dark/Coffee) to ≥3:1 on surface and canvas. If panels now feel too heavy, the alternative is to keep 3:1 only against the canvas.
3. **Accent hues**: olive (Light/Dark) and copper (Coffee). Dark could alternatively use a cool steel accent.
4. **Data table compact rows** show name + id/email on two lines (~54 px). A single-line variant could be added for 32 px rows.
5. **Analytics `.tm-panel-grid`** (hairline-separated panels) vs individually framed panels — chosen to avoid “grid of equally heavy boxes”.
