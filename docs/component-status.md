# Component contract status

Status of every group in [component-coverage.md](component-coverage.md) for v0.1.0. “Gallery” = rendered in the Component Gallery; app names show where it is used in context.

| Group | P0 status | Where | Notes |
|---|---|---|---|
| Foundation tokens | Done | `tokens.css`, `themes.css`, Gallery › Foundations | All required groups: color roles, border hierarchy, type (UI/display/mono/prose, tabular nums, truncation), spacing + density, geometry, elevation, layout, interaction, motion, data graphics. |
| Actions | Done | Gallery › Actions; all apps | primary/secondary/outline/ghost/danger (+danger-outline); sm/md/lg; icon leading/trailing/icon-only; full width; default/hover/focus/active/disabled/loading matrix; button group; segmented; dropdown menu; toolbar. |
| Forms | Done | Gallery › Forms; Data editor; Catalog filters; Workspace | text, textarea, select, search, number, date, time, range, file dropzone; label/hint/error; valid/invalid; read-only/disabled; prefix/suffix; fieldset groups. |
| Forms P1 | **Not implemented** | — | OTP/verification code; advanced multi-select. |
| Selection | Done | Gallery › Selection; Data table; Catalog | checkbox checked/unchecked/indeterminate/disabled/invalid; radio; switch; label + description alignment. |
| Feedback | Done | Gallery › Feedback; all apps | status badges (7 fixture values + disabled), count badge, alerts (4 tones + neutral), toasts (timed with pause + persistent), tooltip, progress determinate/indeterminate, skeleton, spinner, empty/error/stale states. |
| Navigation | Done | Shell; Gallery › Navigation | app shell, side nav (collapsible, horizontal strip on small screens), top bar, breadcrumbs, tabs (keyboard), pagination, contextual menu, filter chips. |
| Navigation P1 | **Not implemented** | — | Command palette. |
| Surfaces | Done | Gallery › Surfaces; Workspace; Analytics | Level 1/2/3, panel grid, card, accordion, expandable records, list rows, popover. |
| Data tables | Done | Data Management; Analytics incidents; Workspace terms | dense/comfortable, long values (truncate + title / wrap), numeric alignment, selected/hover/disabled rows, sort (`aria-sort`), row actions, filter bar + chips, pagination, empty/error/loading, stacked mobile strategy. Sticky header works inside bounded-height scroll containers (`.tm-table-wrap` with a max-height); the demo tables are short enough not to need it. |
| Overlays | Done | Data confirm; Catalog drawers; Gallery › Overlays | native modal dialog, confirmation, drawer, menu, popover, tooltip; Escape, backdrop, focus return, labels. |
| Overlays P1 | **Not implemented** | — | Non-modal sheet. |
| Analytics | Done | Analytics (16 charts + 2 state panels), Gallery › Data graphics | frame, axis, ticks, line, multi-line, area, grouped/stacked/horizontal bars, histogram, donut, heatmap, scatter, threshold/target/capacity, legend (toggle), tooltip (mouse + keyboard), KPI tile + trend, data/no-data/stale/error. Composite-chart building blocks: rich panel head (subtitle + actions), peak callout, labelled range band, drag-to-sum selection with readout, day boundary labels, overlay toggles (Gallery › Data graphics). |
| Commerce/media | Done | Catalog; Gallery › Commerce | product card, image frame (loading/loaded/failed), price, old price (gallery), sale/featured/preorder/sold-out badges, stock badges, thumbnails, filters, detail drawer, long title. |
| Editorial | Done | Content Site | hero, headings, paragraph, link, lists, blockquote, figure/caption, callout, table, code block, in-page nav with scroll-spy, FAQ accordion, CTA, footer. |
| Shared structure | Done | all apps | loading, error, empty, compact toolbar, action menu, search/filter chip, metadata row. |
| Accessibility | Partially verified | see testing report | Keyboard, focus, semantics, reduced motion and token contrast verified with Playwright/scripts. No screen-reader (NVDA/VoiceOver) session and no full WCAG audit were performed. |
