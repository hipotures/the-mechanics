# The Mechanics — Component and Token Coverage Contract

Status: **implementation specification**, not an approved visual theme. This document defines *what must be standardized* and tested across the playground. Its exact visual values remain open to design exploration.

## Evidence and scope

The user-provided saved public Cypherpunk component-gallery page was inspected as a **structural reference**, not a reusable codebase. Its eight published categories are: Foundations, Actions, Forms, Selection, Feedback, Navigation, Surfaces, and Overlays. It demonstrates 37 specimen groups, including button variants/states, fields, selection controls, alerts, tables, accordions, modal, and drawer.

The Mechanics must cover these categories **plus** dense analytics, editorial content, image-heavy catalogs, and nested workspaces. The original third-party saved HTML, runtime scripts, stylesheets, and font files must not be copied into this repository or published as part of this design system. Use links to the public previews and original independently developed examples.

## Standardization levels

1. **Foundations:** shared semantic tokens for all apps and themes.
2. **Primitives:** buttons, fields, badges, table cells, icons and their interaction states.
3. **Composites:** panel heads, cards, filter bars, table toolbars, record previews, chart containers, dialogs.
4. **Page patterns:** application shell, data-dense workspace, dashboard, catalog, editorial site.
5. **Behavior and accessibility:** predictable focus, keyboard behavior, validation, responsive layout and motion.

**Central principle:** a component's name and semantics are stable across Light, Dark and Coffee. A change of theme must not change layout, component dimensions or information hierarchy.

## Foundation tokens that must exist

| Group | Required standardized properties |
| --- | --- |
| Color roles | Page canvas; base/elevated/inset surfaces; primary/secondary/muted/inverse text; links; accent; selection; interactive hover/pressed; disabled; success/warning/danger/info; chart series |
| Border hierarchy | Major app region, functional panel, nested record/row, separator, input outline, focus outline; different strengths/tones per level |
| Typography | UI font, display font, technical/numeric font, prose font; size/weight/line-height/letter-spacing scales; tabular numerals; text truncation |
| Spacing | Consistent spacing rhythm, internal padding, gaps between groups, list-row height, toolbar height, dense and comfortable density |
| Geometry | Radius scale with restrained defaults; border widths; control heights; icon sizes; image aspect ratios |
| Elevation | Minimal, intentional shadows; no repeated shadows on nested regions |
| Layout | Reading width, content max widths, app shell, sidebar and drawer widths, breakpoints, responsive grid and stacking rules |
| Interaction | Hover, pressed, selected, focus-visible, disabled, busy, invalid, success, loading, empty, offline, stale |
| Motion | Transition duration/easing and reduced-motion overrides |
| Data graphics | Semantic chart colors, contrasting series, grid and axis lines, legend labels, tooltip, threshold colors, no color-only encoding |

Choose a namespaced token API (for example `--tm-*`) and document the public contract. Keep the playground's page-specific styles separate from the portable design system.

## Component inventory

Coverage: **P0 = required for first review**, **P1 = useful extension**. Standardize component appearance and behavior, not just its CSS color.

| Group | Standardized elements | Priority / variants and states |
| --- | --- | --- |
| Actions | Button, icon button, button group, segmented control, dropdown, action toolbar | P0: primary/secondary/outline/ghost/danger; small/default/large; icon-leading/trailing; full width; default/hover/focus/active/disabled/loading |
| Forms | Text field, textarea, select, search, number input, date/time input, slider/range, file dropzone | P0: labels, hints, errors, valid/invalid, read-only/disabled, prefixes/suffixes, field groups. P1: OTP/verification code and advanced multi-select |
| Selection | Checkbox, radio, toggle/switch, grouped options | P0: checked/unchecked/indeterminate, disabled, with label and description; consistent alignment |
| Feedback | Status badge, count badge, alert/callout, toast, tooltip, progress, skeleton, empty state | P0: neutral/success/warning/danger/info; determinate/indeterminate; timeout and dismiss behavior; persistent vs transient feedback |
| Navigation | Application shell, side navigation, top bar, breadcrumbs, tabs, pagination, contextual menu | P0: collapsed sidebar, active navigation, small screens, keyboard/focus; P1: command palette |
| Surfaces | Major region, panel, card, table/card, accordion, expandable record, list row, popover | P0: explicit 3-level visual hierarchy; nested section and nested record must look subordinate |
| Data tables | Table header/cell, sortable column, numeric column, selected row, row actions, sticky header, filter bar, pagination | P0: dense/comfortable views, long values, alignment, empty/error/loading, overflow and responsive strategy |
| Overlay | Native dialog/modal, confirmation dialog, drawer, menu, tooltip/popover | P0: overlay stacking, Escape, focus return, accessible labels, backdrop; P1: nonmodal sheet |
| Analytics | Chart frame, axis, ticks, series line, bars/stacked bars, area, donut, heatmap, thresholds, legend, tooltip, KPI tile, trend indicator | P0: consistency and readability across 12–20 panels; data/no-data/stale/error states; synchronized density |
| Commerce/media | Product card, image frame/placeholder, price, old price, sale badge, stock badge, thumbnail, filters, product details | P0: text/image balance, responsive aspect ratios, image loading/failure, long titles |
| Editorial | Hero, headings, paragraph, link, lists, blockquote, image/caption, callout, table, code block, in-page navigation, footer | P0: sustained readability and accessible long-form content |
| Shared structure | Loading state, error state, empty state, compact toolbar, action menu, search/filter chip, metadata row | P0: consistent semantics across all five demo apps |

### Chart coverage, beyond buttons and cards

Analytics must include **16 independent chart/data panels** across line, multi-series line, area, grouped and stacked bars, horizontal bars, donut, histogram, heatmap, scatter, sparkline/KPI trends and a tabular status/incident view. Prefer a limited number of chart types shown repeatedly in different contexts rather than inventing 16 incompatible renderers. Legends, tooltips, axes, thresholds, empty series, small values and large values must each be visible in at least one sample.

## Visual hierarchy contract

- **Level 1: major application region.** Strongest separation, stable across all themes.
- **Level 2: functional panel or table.** Clearly separated but subordinate to the page shell.
- **Level 3: nested group, section or individual record.** Subtle background shift, fine separator or spacing; no repetition of Level 1 header weight.
- Status badges do not inherit the enclosing panel's border strength.
- A chart inside a panel must not gain another equally prominent card frame without a functional reason.
- Selected, hovered and focused states must remain distinguishable; not by color alone.

A good stress test is the **Workspace / terminology preview**: enclosing panel, table header, block identifier, row content, annotations and inline badges must form a readable parent-child hierarchy. Another is the Analytics page with all 16 chart/data panels visible.

## Fixture-driven demos

Use `fixtures/demo-data.json` as the **shared source of deterministic example content** for the five app archetypes; the UI may transform this data but should not replace it with generated random values. No external API or live timestamp is needed.

Required cases across the fixture and components:

- Short and exceptionally long labels; Polish diacritics and mixed English/Polish body text.
- Zero, positive and negative values, percentages, currencies, large counts and missing/null values.
- Success, warning, danger, pending, offline and disabled statuses.
- Empty search results, no chart data, delayed/loading data and an error surface.
- Large table, selected rows, partial/indeterminate selection, sorting, filtering, pagination and bulk actions.
- Image loading, missing image and long commerce item title.
- Nested panels, nested record headers, chart legends with many series, chart tooltips and long axis labels.
- Mobile width and content that wraps; keyboard-only navigation with a visible focus ring.

Do not put any secrets, real credentials, private customer datasets or copyrighted book text into fixtures.

## Review and acceptance

- Visit **five app types × three themes** at desktop and mobile; also inspect the component gallery.
- Visually review actual screenshots. A successful build is not visual approval.
- Use real browser inspection to compare Level 1/2/3 strength and check the Light and Coffee palettes have distinguishable surfaces.
- Spot-check all P0 elements across variants/states and document uncovered items rather than silently calling them complete.
- Treat this document as the **component contract** and `DESIGN.md` as the future **approved design language**; do not conflate requirements with final palette values.
