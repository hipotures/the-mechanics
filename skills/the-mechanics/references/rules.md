# The Mechanics — rules with reasons

Condensed from `DESIGN.md` (v0.1.0). Each rule says *why*, so you can apply it to cases the list does not name. Section numbers point to `DESIGN.md`.

## Contents
1. Structure and hierarchy
2. Item grammar
3. Two "on" signals
4. Toggles and stability
5. Focus
6. Status, alerts, feedback
7. Fields
8. Tables and selection
9. Layout patterns
10. Charts
11. Themes and tokens
12. Anti-patterns

## 1. Structure and hierarchy (§2)
- Free-standing objects — regions, panels, tables, menus, dialogs, toasts, controls — have a **2px frame in ink** (`--tm-line-1` / `--tm-ink`). Why: the style is "drawn with a technical pen"; strength comes from a few confident lines.
- Dividers that split one container into cells (panel grid, KPI strip, product grid, pipeline) are also 2px ink; the cells share the outer frame instead of each drawing their own.
- Lines that touch other lines (row separators, header rules inside a table) are thin (1px, `--tm-line-2/3`). Why: stacked thick lines turn into noise.
- Three levels: **region** (strongest head band) > **panel** (lighter head) > **record** (subtle). A nested header must never look stronger than its parent.
- Radius ≤ 3px. No pills, no rounded cards, no soft drop shadows on regions or panels. The only shadows are hard offset shadows on floating objects (menus, dialogs, toasts) and the focus lift.
- No colored side bars (left accent strips) on anything — alerts, selected rows, nav, toasts, code. They were removed by owner decision.

## 2. Item grammar (§2)
Every pickable item is the same inset block (4px from the container edge, 2px reserved frame, 8px padding):
| State | Look |
|---|---|
| hover | grey `--tm-hover` fill |
| selected / current | `--tm-select-bg` fill, **no frame** (`--tm-select-frame: transparent`) |
| keyboard focus | the block's frame in `--tm-focus` (ink) |
Applies to side nav, in-page nav (`.tm-toc`), list rows, menu items, select/multi-select options, command palette results, date/time picker cells. Why: one selection language across the whole app; nothing moves when state changes. Select options have no tick. Selectable rows have no separator lines (the blocks separate them). On touch screens the hover tint is dropped so a tapped link does not look selected.

## 3. Two "on" signals (§2, architectural rule)
| Signal | Meaning | Examples |
|---|---|---|
| selection fill `--tm-select-bg` | this item is the chosen one among siblings | nav item, segmented option, button group choice, category chip, selected row, pass cell in view, the bulk-action bar |
| ink fill `--tm-ink` (+ `--tm-inset` text) | this control itself is on | checked checkbox, radio dot, switch, count badge, `.tm-btn--toggle`, `.tm-meta-toggle` |
Test for anything new: *choice among siblings* → selection fill; *own on/off state* → ink. Why ink for controls: they sit inside selected areas (checkbox in a selected row, toggle in the green bulk bar). Exception: chart legend items fade hidden series instead of filling.

## 4. Toggles and stability
- A toggle keeps its label and icon; only the fill changes (`aria-pressed`). Swapping "Show selected only" ↔ "Show all rows" made neighbouring buttons jump and was rejected.
- Reserve width for changing numbers (counter badge sized for two digits), append optional buttons at the end of a row, never insert them in the middle.
- Do not add a whole toolbar row for one small display option. Put it on an existing element — e.g. the unit in a panel head becomes a `.tm-meta-toggle` (empty 2px ink frame; on = ink fill; 22px so the head keeps its height).

- View toggle vs action vs setting: a *view toggle* (filter/display option) keeps a fixed label and uses the ink fill; an *action* on a record ("Disable", "Resume") may name the action; a persistent on/off *setting* of a record is a labelled `.tm-switch`. Do not rename product actions to satisfy the toggle rule — that changes the product.

## 5. Focus (§3)
- `--tm-focus` is the ink color in every theme. Controls (buttons, fields, selects, segmented options, chips, pagination, checkbox/radio/switch, meta toggles) keep their frame and get `box-shadow: var(--tm-focus-lift)` (3px 3px 0, no blur) — "lifted off the page".
- Composite controls (stepper, input group with affixes, date/time field, multi-select, drop zone) lift as one piece; the focused part inside is marked with the press tint `--tm-press`, never with a second frame.
- Pickable items: ink frame on the block (item grammar). Tabs, accordion summaries, charts and links: 2px ink outline.
- Never a blue/teal ring, never two different focus looks on one screen. Do not move focus programmatically into a text field after a mouse action (text fields always show focus).

## 6. Status, alerts, feedback (§2, §5)
- Standalone status → `.tm-status` plate (`--sm` in panel heads and overlays) with a `.tm-mark` (`data-state`: complete, active, info, review, warning, error, pending, skipped, none). Inline status in rows/cells/text → `.tm-badge` with its marker shape. Never color alone.
- Alerts: 2px ink frame, tone tint, icon. Warnings may be hidden; a status-plate button in the page head restores them. Blocking errors cannot be hidden.
- Toasts: transient, same frame; errors persist until dismissed.
- Empty / error / stale states: `.tm-state` with title, explanation and one recovery action.

- Dialogs, never browser popups: `window.confirm/alert/prompt` are replaced by `<dialog class="tm-dialog">`. Destructive confirmation: title states the action and object, body says what is lost and what is kept, Cancel (outline, focused by default) + danger confirm; Escape and backdrop cancel; focus returns to the trigger. Reference: `confirmDialog` in `src/playground/lib.js`.
- Action weight: one primary per record or panel; other actions outline, secondary/rare ones ghost; destructive last and `tm-btn--danger-outline`. Equal frames on every action flatten the hierarchy.

## 7. Fields (§5)
- Label above, hint below, error message with a "!" glyph; invalid = `aria-invalid="true"` (red frame). Read-only = dashed frame.
- Native number spinners are hidden; use `.tm-stepper`. Native date/time popups are replaced by `.tm-picker` (Monday-first, 24h, no weekend colors).
- Text/search/email/url/tel fields get a clear ✕ (`.tm-input-clear`) while they hold text: space reserved, "Clear" tooltip, click clears and keeps focus, Escape clears search. Not on number/date/code/read-only/disabled fields, nor where a cancel ✕ already exists.
- Selects: styled option list (base-select or scripted fallback), no tick, option text aligned with the closed field.

## 8. Tables and selection (§5)
- Compact = one line per record (details in tooltip); Comfortable = full detail. The toggle must make a visible difference.
- Numbers right-aligned, tabular, mono; negatives in danger color with a real minus.
- Selection across pages: the bulk bar counts the whole selection; the header checkbox acts on the visible page; "Select all N matching" appears (last) when a full page is selected; a fixed-label "Selected only" toggle shows the whole selection and appears as a removable filter chip. The bar does not repeat what the table already shows ("2 on this page" was rejected).
- Under 640px use `.tm-table--stack` (rows become labelled records).

## 9. Layout patterns (§5 Layout patterns)
- Overview: page head (back link, eyebrow, title, meta, status plate) → stage pipeline → main table → collapsible secondary sections → page-level/destructive actions last.
- List + preview: two columns split by a 2px divider; the list's search sits in the list head; preview pages with "Load next N", no tabs.
- Panel grids never leave an empty cell: balance the column count to the item count or let the last panel span the gap (`balanceGrid`).
- A filter sits next to what it filters (section head, list head), not in a distant toolbar.
- Report state, not invented progress — no progress bars for work that does not report partial progress.
- Prefer one view plus collapsible sections over tabs.

## 10. Charts (§6)
- Apache ECharts (SVG renderer) themed via `adapters/echarts.js` (`readChartTokens`, `createEChartsTheme`); re-create charts on theme change.
- Text: IBM Plex Mono, medium 500, 11px; names and values in full text color, axis numbers in `--tm-text-2`.
- Named categories always show every label (switch bars to horizontal instead of rotating/hiding); time axes may thin. Value labels are never hidden.
- Thresholds dashed, targets dotted, labelled with the short value at the line start. Series differ by dash/marker as well as color.
- Every value reachable by tooltip **and** keyboard; tooltips sit below sticky chrome and close on scroll.
- Heatmap labels: text color by default; viewer can switch to per-cell color via the unit `.tm-meta-toggle`.

## 11. Themes and tokens (§3, §4)
- Light / Paper-Stone, Dark / Graphite, Coffee / Espresso-Mocha via `data-tm-theme` on `<html>`. Themes change color only — sizes, spacing and layout must be identical (verify by comparing page dimensions across themes).
- Use `--tm-*` tokens for every color, space, radius, border and font. Private `--_*` variables are not API.
- Display headings stay IBM Plex Mono bold; body/UI text IBM Plex Sans 13px; numbers, labels and metadata mono.
- New colors must pass contrast: 4.5:1 text, 3:1 graphics/boundaries, in all three themes.

## 12. Anti-patterns (§8) — do not
- Rounded (>3px) cards, pill buttons/badges; blurred or frosted layers; drop shadows on panels.
- A 2px frame repeated on every nested card; nested headers bolder than their parent.
- Colored side bars; blue focus rings; ticks in select options; selection frames.
- Color-only status, selection or series encoding.
- Relabelling toggles; inserting buttons mid-row; layout that shifts on state change.
- Truncating data the user must read; rotated axis labels; random or live data in fixtures/screenshots.
- Importing Tailwind/daisyUI into a consumer just to get these styles.
