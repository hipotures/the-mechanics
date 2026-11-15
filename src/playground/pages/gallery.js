import { esc, icon, badge, toast, wireMenus, confirmDialog, rangeFill, fmtMoney, stepperHTML, wireSteppers } from "../lib.js";
import { mountChart, mountComposite } from "../charts.js";
import { media, bindMedia } from "./catalog.js";

const spec = (label, body, cls = "") => `<div class="pg-spec ${cls}"><div class="tm-label pg-spec__label">${label}</div><div class="pg-spec__body">${body}</div></div>`;
const section = (id, title, desc, body) => `<section class="tm-region pg-gal-sec" id="g-${id}" aria-labelledby="gh-${id}">
  <header class="tm-region__head"><h2 class="tm-region__title" id="gh-${id}">${title}</h2><span class="tm-panel__meta">${desc}</span></header>
  <div class="tm-region__body pg-spec-grid">${body}</div></section>`;

const COLOR_ROLES = [
  ["Canvas", "--tm-canvas"], ["Surface", "--tm-surface"], ["Surface alt", "--tm-surface-alt"], ["Head L1", "--tm-head-1"], ["Head L2", "--tm-head-2"], ["Sunken L3", "--tm-sunken"], ["Inset", "--tm-inset"], ["Inverse", "--tm-inverse"],
  ["Text", "--tm-text"], ["Text 2", "--tm-text-2"], ["Text 3", "--tm-text-3"], ["Disabled", "--tm-text-disabled"],
  ["Line L1", "--tm-line-1"], ["Line L2", "--tm-line-2"], ["Line L3", "--tm-line-3"], ["Input", "--tm-line-input"],
  ["Accent", "--tm-accent"], ["Accent soft", "--tm-accent-soft"], ["Link", "--tm-link"], ["Selection", "--tm-select-bg"], ["Select mark", "--tm-select-line"], ["Focus", "--tm-focus"],
  ["Success", "--tm-success"], ["Warning", "--tm-warning"], ["Danger", "--tm-danger"], ["Info", "--tm-info"], ["Pending", "--tm-pending"], ["Offline", "--tm-offline"],
];
const SECTIONS = [
  ["foundations", "Foundations"], ["actions", "Actions"], ["forms", "Forms"], ["selection", "Selection"], ["feedback", "Feedback"], ["navigation", "Navigation"],
  ["surfaces", "Surfaces"], ["tables", "Data tables"], ["overlays", "Overlays"], ["graphics", "Data graphics"], ["media", "Commerce & media"], ["editorial", "Editorial"], ["stress", "Stress text"], ["daisy", "daisyUI bridge"],
];

export default {
  render(main, data) {
    const cs = data.componentStates;
    const fe = cs.formExamples;
    const variants = [["Primary", "tm-btn--primary"], ["Secondary", ""], ["Outline", "tm-btn--outline"], ["Ghost", "tm-btn--ghost"], ["Danger", "tm-btn--danger"]];
    const states = [["Default", ""], ["Hover", "is-hover"], ["Focus", "is-focus"], ["Active", "is-active"], ["Disabled", "disabled"], ["Loading", "busy"]];
    const btn = (v, s, label = "Button") =>
      `<button class="tm-btn ${v} ${s === "disabled" || s === "busy" ? "" : s}" ${s === "disabled" ? "disabled" : ""} ${s === "busy" ? 'aria-busy="true"' : ""} tabindex="-1">${label}</button>`;
    const sampleChart = data.analytics.charts.find((c) => c.id === "ttft");
    const legendChart = { id: "legend-demo", title: "Series legend", kind: "line", unit: "k tokens", xLabels: data.analytics.charts[0].xLabels, series: data.analytics.charts.find((c) => c.id === "tokens").series.concat(data.analytics.charts.find((c) => c.id === "requests").series) };
    const longTitleProduct = data.commerce.products.find((p) => p.id === data.commerce.edgeCases.longDescriptionProduct);

    main.innerHTML = `
    <header class="tm-page-head">
      <div class="tm-page-head__text"><div class="tm-eyebrow">System · Reference</div><h1 class="tm-page-title">Component Gallery</h1>
      <p class="tm-subtitle">Every primitive used by the five example apps, in its default and forced states. Forced hover/focus/active use the documented <code class="tm-mono">.is-*</code> mirror classes.</p></div>
    </header>
    <div class="pg-gal-layout">
      <nav class="pg-gal-index" aria-label="Gallery sections"><div class="tm-label">Sections</div><ul class="tm-toc">${SECTIONS.map(([id, t]) => `<li><a href="#g-${id}" data-jump="g-${id}">${t}</a></li>`).join("")}</ul></nav>
      <div class="pg-stack">

      ${section("foundations", "Foundations", "tokens · type · spacing · geometry", `
        ${spec("Color roles (current theme)", `<div class="pg-swatches">${COLOR_ROLES.map(([n, v]) => `<div class="pg-swatch"><span class="pg-swatch__chip" style="background:var(${v})"></span><span class="pg-swatch__name">${n}</span><code class="pg-swatch__var">${v}</code></div>`).join("")}</div>`, "pg-spec--wide")}
        ${spec("Chart palette", `<div class="pg-swatches pg-swatches--chart">${[1, 2, 3, 4, 5, 6, 7, 8].map((i) => `<div class="pg-swatch"><span class="pg-swatch__chip" style="background:var(--tm-chart-${i})"></span><code class="pg-swatch__var">chart-${i}</code></div>`).join("")}</div>
          <div class="pg-heat-ramp" aria-label="Heat ramp">${[0, 20, 40, 60, 80, 100].map((v) => `<svg width="40" height="20" aria-hidden="true"><rect class="tm-heat-cell" style="--_heat:${v}%" width="40" height="20"/></svg>`).join("")}<span class="tm-meta">heat 0 → 100%</span></div>`)}
        ${spec("Type scale", `<div class="pg-type">
          <div style="font:var(--tm-weight-bold) var(--tm-text-4xl)/1.1 var(--tm-font-display);letter-spacing:-.03em">Display 40</div>
          <div class="tm-page-title">Page title 28</div>
          <div style="font:700 var(--tm-text-2xl)/1.2 var(--tm-font-numeric)">KPI 1,234.56</div>
          <div style="font:600 var(--tm-text-lg) var(--tm-font-ui)">Region title 16 — Zażółć gęślą jaźń</div>
          <div style="font:600 var(--tm-text-sm) var(--tm-font-ui)">Panel title 13</div>
          <div>UI body 13 · IBM Plex Sans — Łódź, Gdańsk, Kraków</div>
          <div class="tm-mono">Mono 13 · ch0001_a001 · 0O 1lI · 748,378 · −€1,234.56</div>
          <div class="tm-label">Eyebrow label 11 · tracking .08em</div>
          <div class="tm-meta">Metadata 12 · secondary information</div></div>`, "pg-spec--wide")}
        ${spec("Spacing (4px rhythm)", `<div class="pg-space">${["1", "2", "3", "4", "5", "6", "8", "10", "12"].map((s) => `<div><span class="pg-space__bar" style="width:var(--tm-space-${s})"></span><code>space-${s}</code></div>`).join("")}</div>`)}
        ${spec("Border hierarchy", `<div class="tm-region"><div class="tm-region__head"><span class="tm-region__title">Level 1 · region</span><span class="tm-meta">2px ink</span></div>
          <div class="tm-region__body"><div class="tm-panel"><div class="tm-panel__head"><span class="tm-panel__title">Level 2 · panel</span><span class="tm-panel__meta">1px pencil</span></div>
          <div class="tm-panel__body"><div class="tm-group"><div class="tm-group__head">LEVEL 3 · RECORD <span>hairline</span></div><div class="tm-record__body">Nested content stays subordinate.</div></div></div></div></div></div>`)}
        ${spec("Radius & control sizes", `<div class="pg-row-wrap"><button class="tm-btn tm-btn--sm" tabindex="-1">28 sm</button><button class="tm-btn" tabindex="-1">32 md</button><button class="tm-btn tm-btn--lg" tabindex="-1">40 lg</button></div>
          <p class="tm-meta pg-mt">Radius: regions/panels 0 · controls/badges 2px · overlays 3px. Elevation only on overlays (hard 4px offset), never on nested regions.</p>`)}
        ${spec("Motion", `<p class="tm-meta">Durations 90 / 150 / 240ms, easing <code>cubic-bezier(.2,0,0,1)</code>. <code>prefers-reduced-motion: reduce</code> sets durations to 0 and stops spinners, shimmer and stripes.</p><div class="pg-row-wrap pg-mt"><span class="tm-spinner"></span><span class="tm-skeleton" style="width:8rem"></span></div>`)}
      `)}

      ${section("actions", "Actions", "buttons · groups · segmented · menus · toolbar", `
        ${spec("Variant × state matrix", `<div class="pg-matrix-wrap"><table class="pg-matrix"><thead><tr><th></th>${states.map(([s]) => `<th scope="col">${s}</th>`).join("")}</tr></thead><tbody>
          ${variants.map(([n, v]) => `<tr><th scope="row">${n}</th>${states.map(([, s]) => `<td>${btn(v, s, s === "busy" ? "Saving" : n)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`, "pg-spec--wide")}
        ${spec("Sizes & icons", `<div class="pg-row-wrap"><button class="tm-btn tm-btn--primary tm-btn--sm">${icon("plus", "tm-icon--sm")}Small</button><button class="tm-btn tm-btn--primary">${icon("download")}Leading</button><button class="tm-btn tm-btn--outline tm-btn--lg">Trailing${icon("chevronRight")}</button></div>
          <div class="pg-row-wrap pg-mt"><button class="tm-btn tm-btn--icon tm-btn--sm" aria-label="Edit">${icon("edit", "tm-icon--sm")}</button><button class="tm-btn tm-btn--icon" aria-label="Refresh">${icon("refresh")}</button><button class="tm-btn tm-btn--icon tm-btn--lg tm-btn--ghost" aria-label="More">${icon("dots")}</button><button class="tm-btn tm-btn--danger-outline">${icon("trash")}Danger outline</button></div>
          <button class="tm-btn tm-btn--outline tm-btn--block pg-mt">Full-width button</button>`)}
        ${spec("Group · segmented · dropdown", `<div class="pg-stack-sm">
          <div class="tm-btn-group" role="group" aria-label="Alignment"><button class="tm-btn tm-btn--sm">Left</button><button class="tm-btn tm-btn--sm" aria-pressed="true">Center</button><button class="tm-btn tm-btn--sm">Right</button></div>
          <fieldset class="tm-segmented"><legend class="tm-sr-only">View</legend>${["Day", "Week", "Month"].map((v, i) => `<label class="tm-segmented__option"><input type="radio" name="g-seg" ${i === 1 ? "checked" : ""}>${v}</label>`).join("")}<label class="tm-segmented__option"><input type="radio" name="g-seg" disabled>Year</label></fieldset>
          <div><button class="tm-btn tm-btn--outline" popovertarget="g-menu">Actions${icon("chevronDown", "tm-icon--sm")}</button>
          <div class="tm-menu" id="g-menu" popover role="menu" aria-label="Actions"><div class="tm-menu__label">Record</div><button class="tm-menu__item" role="menuitem">${icon("edit", "tm-icon--sm")}Edit</button><button class="tm-menu__item" role="menuitem">${icon("copy", "tm-icon--sm")}Duplicate</button><button class="tm-menu__item" role="menuitem" disabled>${icon("upload", "tm-icon--sm")}Publish (disabled)</button><hr class="tm-menu__sep"><button class="tm-menu__item tm-menu__item--danger" role="menuitem">${icon("trash", "tm-icon--sm")}Delete</button></div></div></div>`)}
        ${spec("Action toolbar", `<div class="tm-toolbar pg-bordered" role="toolbar" aria-label="Sample toolbar"><button class="tm-btn tm-btn--sm tm-btn--primary">${icon("plus", "tm-icon--sm")}New</button><button class="tm-btn tm-btn--sm tm-btn--outline">${icon("filter", "tm-icon--sm")}Filter</button><span class="tm-toolbar__sep"></span><button class="tm-btn tm-btn--sm tm-btn--ghost">${icon("download", "tm-icon--sm")}Export</button><span class="tm-toolbar__spacer"></span><span class="tm-meta">32 records</span></div>`, "pg-spec--wide")}
      `)}

      ${section("forms", "Forms", "fields · validation · affixes · range · file", `
        ${spec("Text field states", `<div class="pg-form-grid">
          <div class="tm-field"><label class="tm-field__label" for="f1">Default</label><input class="tm-input" id="f1" placeholder="Placeholder text"><span class="tm-field__hint">Hint text explains the expected format.</span></div>
          <div class="tm-field"><label class="tm-field__label" for="f2">Hover</label><input class="tm-input is-hover" id="f2" value="${esc(fe.email)}"></div>
          <div class="tm-field"><label class="tm-field__label" for="f3">Focus</label><input class="tm-input is-focus" id="f3" value="${esc(fe.email)}"></div>
          <div class="tm-field"><label class="tm-field__label" for="f4">Valid</label><input class="tm-input is-valid" id="f4" value="${esc(fe.email)}"><span class="tm-field__success">${icon("check", "tm-icon--sm")} Looks good</span></div>
          <div class="tm-field"><label class="tm-field__label" for="f5">Invalid <span class="tm-req">*</span></label><input class="tm-input" id="f5" aria-invalid="true" aria-describedby="f5e" value="${esc(fe.invalidEmail)}"><span class="tm-field__error" id="f5e">Enter a complete email address.</span></div>
          <div class="tm-field"><label class="tm-field__label" for="f6">Read-only</label><input class="tm-input" id="f6" readonly value="ACC-1001"></div>
          <div class="tm-field"><label class="tm-field__label" for="f7">Disabled</label><input class="tm-input" id="f7" disabled value="Not editable"></div>
          <div class="tm-field"><label class="tm-field__label" for="f8">Number · invalid</label>${stepperHTML({ id: "f8", value: fe.invalidNumber, invalid: true, describedby: "f8e", label: "number" })}<span class="tm-field__error" id="f8e">Must be 0 or greater.</span></div>
        </div>`, "pg-spec--wide")}
        ${spec("Select · search · textarea", `<div class="pg-stack-sm">
          <div class="tm-field"><label class="tm-field__label" for="f9">Plan</label><select class="tm-select" id="f9">${["Starter", "Growth", "Enterprise"].map((p) => `<option ${p === fe.select ? "selected" : ""}>${p}</option>`).join("")}</select></div>
          <div class="tm-field"><label class="tm-field__label" for="f10">Search</label><div class="tm-input-group"><span class="tm-affix">${icon("search", "tm-icon--sm")}</span><input class="tm-input" type="search" id="f10" placeholder="Search…"><span class="tm-affix"><kbd class="tm-kbd">/</kbd></span></div></div>
          <div class="tm-field"><label class="tm-field__label" for="f11">Note</label><textarea class="tm-textarea" id="f11" rows="3">${esc(fe.textarea)}</textarea></div></div>`)}
        ${spec("Number · date/time · affixes", `<div class="pg-stack-sm">
          <div class="tm-field"><label class="tm-field__label" for="f12">Quantity · number stepper</label>${stepperHTML({ id: "f12", value: fe.number, min: 0, max: 99, label: "quantity" })}</div>
          <div class="pg-2col"><div class="tm-field"><label class="tm-field__label" for="f12b">At minimum</label>${stepperHTML({ id: "f12b", value: 0, min: 0, max: 10, label: "seats" })}</div><div class="tm-field"><label class="tm-field__label" for="f12c">Disabled</label>${stepperHTML({ id: "f12c", value: 3, disabled: true, label: "seats" })}</div></div>
          <div class="tm-field"><label class="tm-field__label" for="f12d">With unit · small</label>${stepperHTML({ id: "f12d", value: 500, step: 50, unit: "USD", size: "sm", label: "amount" })}</div>
          <div class="pg-2col"><div class="tm-field"><label class="tm-field__label" for="f13">Date</label><input class="tm-input" type="date" id="f13" value="2026-11-14"></div><div class="tm-field"><label class="tm-field__label" for="f14">Time (UTC)</label><input class="tm-input" type="time" id="f14" value="12:00"></div></div>
          <div class="tm-field"><label class="tm-field__label" for="f15">Price</label><div class="tm-input-group"><span class="tm-affix tm-affix--boxed">USD</span><input class="tm-input tm-input--mono" id="f15" value="1,234.56"><span class="tm-affix tm-affix--boxed">/ mo</span></div></div></div>`)}
        ${spec("Range · file dropzone · field group", `<div class="pg-stack-sm">
          <div class="tm-field"><label class="tm-field__label" for="f16">Threshold <output class="tm-num" for="f16" id="f16o">${fe.slider}%</output></label><input class="tm-range" type="range" id="f16" min="0" max="100" value="${fe.slider}"></div>
          <div class="tm-field"><label class="tm-field__label" for="f17d">Disabled range</label><input class="tm-range" type="range" id="f17d" disabled value="60"></div>
          <div class="tm-dropzone" id="dz">${icon("upload", "tm-icon--lg")}<strong>Drop files or browse</strong><span>CSV or JSON, up to 5 MB</span><input type="file" aria-label="Upload file" id="dz-input"></div>
          <fieldset class="tm-fieldset pg-2col"><legend>Field group</legend><div class="tm-field"><label class="tm-field__label" for="f18">First</label><input class="tm-input" id="f18" value="Zoë"></div><div class="tm-field"><label class="tm-field__label" for="f19">Last</label><input class="tm-input" id="f19" value="Wiśniewska"></div></fieldset></div>`)}
      `)}

      ${section("selection", "Selection", "checkbox · radio · switch", `
        ${spec("Checkbox", `<div class="pg-stack-sm">
          <label class="tm-choice"><input class="tm-check" type="checkbox"><span class="tm-choice__label">Unchecked</span></label>
          <label class="tm-choice"><input class="tm-check" type="checkbox" checked><span class="tm-choice__label">Checked</span></label>
          <label class="tm-choice"><input class="tm-check" type="checkbox" data-indeterminate><span class="tm-choice__label">Indeterminate (partial selection)</span></label>
          <label class="tm-choice"><input class="tm-check" type="checkbox" aria-invalid="true"><span class="tm-choice__text"><span class="tm-choice__label">Invalid — accept terms</span><span class="tm-choice__desc tm-text-danger">Required to continue.</span></span></label>
          <label class="tm-choice"><input class="tm-check" type="checkbox" disabled><span class="tm-choice__label">Disabled</span></label>
          <label class="tm-choice"><input class="tm-check" type="checkbox" disabled checked><span class="tm-choice__label">Disabled checked</span></label></div>`)}
        ${spec("Radio with descriptions", `<fieldset class="pg-plain-fieldset pg-stack-sm"><legend class="tm-field__label">Billing cycle</legend>
          <label class="tm-choice"><input class="tm-radio" type="radio" name="g-r" checked><span class="tm-choice__text"><span class="tm-choice__label">Monthly</span><span class="tm-choice__desc">Cancel at any time.</span></span></label>
          <label class="tm-choice"><input class="tm-radio" type="radio" name="g-r"><span class="tm-choice__text"><span class="tm-choice__label">Yearly</span><span class="tm-choice__desc">Two months included.</span></span></label>
          <label class="tm-choice"><input class="tm-radio" type="radio" name="g-r" disabled><span class="tm-choice__text"><span class="tm-choice__label">Lifetime</span><span class="tm-choice__desc">Unavailable for this plan.</span></span></label></fieldset>`)}
        ${spec("Switch", `<div class="pg-stack-sm">
          <label class="tm-choice"><input class="tm-switch" type="checkbox" role="switch" checked><span class="tm-choice__text"><span class="tm-choice__label">Notifications</span><span class="tm-choice__desc">On — email digest weekly.</span></span></label>
          <label class="tm-choice"><input class="tm-switch" type="checkbox" role="switch"><span class="tm-choice__label">Compact mode</span></label>
          <label class="tm-choice"><input class="tm-switch" type="checkbox" role="switch" disabled><span class="tm-choice__label">Disabled off</span></label>
          <label class="tm-choice"><input class="tm-switch" type="checkbox" role="switch" disabled checked><span class="tm-choice__label">Disabled on</span></label></div>`)}
      `)}

      ${section("feedback", "Feedback", "badges · alerts · toasts · tooltip · progress · states", `
        ${spec("Status badges", `<div class="pg-row-wrap">${cs.statusValues.map((s) => badge(s === "neutral" ? "neutral" : s, s[0].toUpperCase() + s.slice(1))).join("")}${badge("disabled")}</div>
          <div class="pg-row-wrap pg-mt"><span class="tm-badge tm-badge--count">3</span><span class="tm-badge tm-badge--count">128</span><span class="tm-badge tm-badge--accent">Featured</span><span class="tm-badge tm-badge--plain">Plain</span></div>
          <p class="tm-meta pg-mt">Each tone has its own marker shape (check, triangle, cross, ring, dash) so status is never color-only.</p>`)}
        ${spec("Alerts (persistent)", `<div class="pg-stack-sm">${[["info", "info", "Maintenance window", "Scheduled for Nov 16, 02:00 UTC."], ["success", "success", "Import finished", "32 records imported."], ["warning", "alert", "Telemetry delayed", "Data is 17 minutes old."], ["danger", "danger", "Provider unavailable", "One data source failed to refresh."]].map(([t, i, h, b]) => `<div class="tm-alert tm-alert--${t}">${icon(i)}<div><div class="tm-alert__title">${h}</div><div class="tm-alert__body">${b}</div></div></div>`).join("")}</div>`, "pg-spec--wide")}
        ${spec("Toasts (transient)", `<div class="pg-row-wrap"><button class="tm-btn tm-btn--outline" data-toast="success">Success · 5s</button><button class="tm-btn tm-btn--outline" data-toast="info">Info · 5s</button><button class="tm-btn tm-btn--outline" data-toast="danger">Error · persistent</button></div><p class="tm-meta pg-mt">Timed toasts pause on hover; errors stay until dismissed.</p>`)}
        ${spec("Tooltip", `<div class="pg-row-wrap pg-tip-demo"><span class="tm-tip"><button class="tm-btn tm-btn--outline" aria-describedby="gt1">Hover or focus</button><span class="tm-tip__bubble" role="tooltip" id="gt1">Tooltips describe, never hold essential actions.</span></span>
          <span class="tm-tip is-open"><span class="tm-badge tm-badge--info" tabindex="0" aria-describedby="gt2">Forced open</span><span class="tm-tip__bubble" role="tooltip" id="gt2">Escape dismisses.</span></span></div>`)}
        ${spec("Progress", `<div class="pg-stack-sm"><div><span class="tm-meta">0%</span><progress class="tm-progress" max="100" value="0" aria-label="0 percent"></progress></div>
          <div><span class="tm-meta">${fe.slider}%</span><progress class="tm-progress" max="100" value="${fe.slider}" aria-label="${fe.slider} percent"></progress></div>
          <div><span class="tm-meta">86% · warning</span><progress class="tm-progress tm-progress--warning" max="100" value="86" aria-label="86 percent"></progress></div>
          <div><span class="tm-meta">100% · success</span><progress class="tm-progress tm-progress--success" max="100" value="100" aria-label="complete"></progress></div>
          <div><span class="tm-meta">Indeterminate</span><progress class="tm-progress" aria-label="Loading"></progress></div></div>`)}
        ${spec("Loading · skeleton", `<div class="pg-stack-sm"><div class="pg-row-wrap"><span class="tm-spinner"></span><span class="tm-spinner tm-spinner--lg"></span><button class="tm-btn tm-btn--primary" aria-busy="true" disabled>Saving</button></div>
          <span class="tm-skeleton" style="width:70%"></span><span class="tm-skeleton"></span><span class="tm-skeleton" style="width:40%"></span></div>`)}
        ${spec("Empty · error · stale states", `<div class="pg-3col pg-states">
          <div class="tm-panel"><div class="tm-state"><div class="tm-state__icon">${icon("search")}</div><div class="tm-state__title">No results</div><div class="tm-state__body">Nothing matches “${esc(data.dataManagement.emptyQuery)}”.</div><button class="tm-btn tm-btn--sm tm-btn--outline">Clear search</button></div></div>
          <div class="tm-panel"><div class="tm-state tm-state--error"><div class="tm-state__icon">${icon("danger")}</div><div class="tm-state__title">${esc(data.analytics.errorPanel.title)}</div><div class="tm-state__body">${esc(data.analytics.errorPanel.message)}</div><button class="tm-btn tm-btn--sm tm-btn--outline">Retry</button></div></div>
          <div class="tm-panel"><div class="tm-state tm-state--warning"><div class="tm-state__icon">${icon("clock")}</div><div class="tm-state__title">${esc(data.analytics.stalePanel.title)}</div><div class="tm-state__body">Last update ${data.analytics.stalePanel.ageMinutes} min ago. Showing cached values.</div></div></div></div>`, "pg-spec--wide")}
      `)}

      ${section("navigation", "Navigation", "breadcrumbs · tabs · pagination · menu · chips · side nav", `
        ${spec("Breadcrumbs", `<nav aria-label="Breadcrumb sample"><ol class="tm-breadcrumbs"><li><a href="#/components">Projects</a></li><li><a href="#/components">Sample Field Manual</a></li><li><span aria-current="page">Analyse · P1</span></li></ol></nav>`)}
        ${spec("Tabs", `<div class="tm-tabs" role="tablist" aria-label="Sample tabs"><button class="tm-tab" role="tab" aria-selected="true">Preview</button><button class="tm-tab is-hover" role="tab" aria-selected="false" tabindex="-1">Terms <span class="tm-badge tm-badge--count">3</span></button><button class="tm-tab" role="tab" aria-selected="false" tabindex="-1">Observations</button><button class="tm-tab" role="tab" aria-selected="false" disabled>Locked</button></div>`)}
        ${spec("Pagination", `<div class="tm-pagination"><span class="tm-pagination__info">11–20 of 32</span><button class="tm-pagination__page" aria-label="Previous">‹</button><button class="tm-pagination__page">1</button><button class="tm-pagination__page" aria-current="page">2</button><button class="tm-pagination__page">3</button><button class="tm-pagination__page">4</button><button class="tm-pagination__page" aria-label="Next">›</button></div>
          <div class="tm-pagination pg-mt"><span class="tm-pagination__info">1–10 of 10</span><button class="tm-pagination__page" disabled aria-label="Previous">‹</button><button class="tm-pagination__page" aria-current="page">1</button><button class="tm-pagination__page" disabled aria-label="Next">›</button></div>`)}
        ${spec("Contextual menu (static)", `<div class="tm-menu pg-static-menu" role="menu" aria-label="Static menu specimen"><div class="tm-menu__label">Row</div><button class="tm-menu__item" role="menuitem" tabindex="-1">${icon("edit", "tm-icon--sm")}Edit</button><button class="tm-menu__item is-hover" role="menuitem" tabindex="-1">${icon("copy", "tm-icon--sm")}Duplicate (hover)</button><button class="tm-menu__item" role="menuitem" disabled>${icon("upload", "tm-icon--sm")}Disabled</button><hr class="tm-menu__sep"><button class="tm-menu__item tm-menu__item--danger" role="menuitem" tabindex="-1">${icon("trash", "tm-icon--sm")}Deactivate…</button></div>`)}
        ${spec("Filter chips", `<div class="pg-row-wrap"><span class="tm-chip">Status: active<button class="tm-chip__remove" aria-label="Remove status filter">${icon("x", "tm-icon--sm")}</button></span><span class="tm-chip">Team: Research<button class="tm-chip__remove" aria-label="Remove team filter">${icon("x", "tm-icon--sm")}</button></span><button class="tm-chip tm-chip--toggle" aria-pressed="true">Stationery</button><button class="tm-chip tm-chip--toggle" aria-pressed="false">Office</button></div>`)}
        ${spec("Side navigation · expanded / collapsed", `<div class="pg-row-wrap pg-align-start">
          <div class="pg-mini-nav"><ul class="tm-nav"><li><a class="tm-nav__item" href="#/components" aria-current="page">${icon("analytics")}<span class="tm-nav__label">Analytics</span></a></li><li><a class="tm-nav__item is-hover" href="#/components">${icon("data")}<span class="tm-nav__label">Data (hover)</span></a></li><li><a class="tm-nav__item" href="#/components">${icon("catalog")}<span class="tm-nav__label">Catalog</span></a></li></ul></div>
          <div class="pg-mini-nav pg-mini-nav--collapsed"><ul class="tm-nav"><li><a class="tm-nav__item" href="#/components" aria-current="page" aria-label="Analytics">${icon("analytics")}</a></li><li><a class="tm-nav__item" href="#/components" aria-label="Data">${icon("data")}</a></li><li><a class="tm-nav__item" href="#/components" aria-label="Catalog">${icon("catalog")}</a></li></ul></div></div>`)}
      `)}

      ${section("surfaces", "Surfaces", "three-level hierarchy · accordion · list rows · card · popover", `
        ${spec("Nested hierarchy stress test", `<div class="tm-panel"><div class="tm-panel__head"><span class="tm-panel__title">${icon("workspace", "tm-icon--sm")}P1 preview · ch0001_a001</span><span class="tm-panel__meta">Level 2</span></div>
          <div class="tm-panel__body"><div class="tm-group"><div class="tm-colhead"><span>English</span><span>Terms</span></div>
          ${data.workspace.preview.blocks.slice(1, 3).map((b) => `<div class="tm-record"><div class="tm-record__head"><span>${b.id}</span>${b.annotations.length ? '<span class="tm-badge tm-badge--success">high</span>' : ""}</div><div class="tm-record__cols"><div>${esc(b.english)}</div><div>${b.annotations.length ? `<strong>${esc(b.annotations[0].term)}</strong> <span class="tm-meta">${esc(b.annotations[0].type)}</span>` : '<span class="tm-muted">No new terms or observations for this block.</span>'}</div></div></div>`).join("")}</div></div></div>`, "pg-spec--wide")}
        ${spec("List rows", `<ul class="tm-list pg-bordered" aria-label="Row states">
          <li><button class="tm-row tm-row--interactive">Default row</button></li><li><button class="tm-row tm-row--interactive is-hover">Hover row</button></li>
          <li><button class="tm-row tm-row--interactive" aria-current="true">Selected row</button></li><li><button class="tm-row tm-row--interactive is-focus" style="outline:2px solid var(--tm-focus);outline-offset:-2px">Focused row</button></li>
          <li><button class="tm-row tm-row--interactive" aria-current="true" style="outline:2px solid var(--tm-focus);outline-offset:-2px">Selected + focused</button></li></ul>`)}
        ${spec("Accordion", `<div class="tm-accordion">${data.website.faq.map((f, i) => `<details ${i === 1 ? "open" : ""}><summary>${esc(f.question)}</summary><div class="tm-accordion__body">${esc(f.answer)}</div></details>`).join("")}</div>`)}
        ${spec("Card · popover", `<div class="tm-card"><div class="tm-panel__head"><span class="tm-panel__title">Card title</span>${badge("pending")}</div><div class="tm-panel__body"><p class="tm-subtitle">Cards use the Level 2 boundary and never stack a second frame inside.</p></div><div class="tm-panel__foot"><span>Updated Nov 14</span><button class="tm-btn tm-btn--sm tm-btn--outline" popovertarget="g-pop">Details</button></div></div>
          <div class="tm-popover" id="g-pop" popover aria-label="Card details"><div class="tm-label">Popover</div><p class="pg-mt">Light-dismiss surface anchored to its trigger. Escape closes and focus returns.</p></div>`)}
      `)}

      ${section("tables", "Data tables", "density · states · alignment", `
        ${spec("Compact (default) · row states", `<div class="tm-table-wrap"><table class="tm-table"><thead><tr><th class="tm-col-check"><input class="tm-check" type="checkbox" data-indeterminate aria-label="Select all"></th><th aria-sort="ascending"><button class="tm-sort">Account<span class="tm-sort__icon">▲</span></button></th><th>Status</th><th class="tm-col-num">Balance</th><th>Note</th></tr></thead><tbody>
          ${data.dataManagement.records.slice(0, 5).map((r, i) => `<tr ${i === 0 || i === 2 ? 'aria-selected="true"' : ""} class="${i === 1 ? "is-hover" : ""} ${r.status === "disabled" ? "is-disabled" : ""}"><td class="tm-col-check"><input class="tm-check" type="checkbox" ${i === 0 || i === 2 ? "checked" : ""} aria-label="Select ${esc(r.name)}"></td><td><span class="tm-table__primary">${esc(r.name)}</span></td><td>${badge(r.status)}</td><td class="tm-num ${r.balance < 0 ? "tm-text-danger" : ""}">${fmtMoney(r.balance)}</td><td class="pg-td-trunc"><span class="tm-truncate" title="${esc(data.dataManagement.records[8].note)}">${i === 4 ? esc(data.dataManagement.records[8].note) : '<span class="tm-muted">—</span>'}</span></td></tr>`).join("")}</tbody></table></div>`, "pg-spec--wide")}
        ${spec("Comfortable density", `<div class="tm-table-wrap tm-density-comfortable"><table class="tm-table"><thead><tr><th>Team</th><th class="tm-col-num">Accounts</th></tr></thead><tbody>${["Research", "Platform", "Operations"].map((t) => `<tr><td>${t}</td><td class="tm-num">${data.dataManagement.records.filter((r) => r.team === t).length}</td></tr>`).join("")}</tbody></table></div>`)}
        ${spec("Loading · empty · error", `<div class="pg-stack-sm"><div class="tm-table-wrap" aria-busy="true"><table class="tm-table"><tbody>${[1, 2].map(() => `<tr><td><span class="tm-skeleton"></span></td><td><span class="tm-skeleton" style="width:60%"></span></td></tr>`).join("")}</tbody></table></div>
          <div class="tm-table-wrap"><div class="tm-state"><div class="tm-state__title">No rows</div><div class="tm-state__body">This view has no records yet.</div></div></div>
          <div class="tm-table-wrap"><div class="tm-state tm-state--error"><div class="tm-state__icon">${icon("danger")}</div><div class="tm-state__title">Could not load rows</div></div></div></div>`)}
      `)}

      ${section("overlays", "Overlays", "dialog · confirmation · drawer · menu", `
        ${spec("Open live overlays", `<div class="pg-row-wrap"><button class="tm-btn tm-btn--outline" id="g-dialog">Open dialog</button><button class="tm-btn tm-btn--danger-outline" id="g-confirm">Confirmation</button><button class="tm-btn tm-btn--outline" id="g-drawer-btn">Open drawer</button></div>
          <p class="tm-meta pg-mt">Native <code>&lt;dialog&gt;</code>: top layer, Escape closes, backdrop click closes, focus returns to the trigger.</p>`)}
        ${spec("Dialog (static specimen)", `<div class="tm-dialog pg-static-dialog" role="group" aria-label="Dialog specimen"><div class="tm-dialog__head"><span class="tm-dialog__title">${esc(cs.confirmation.title)}</span><button class="tm-btn tm-btn--ghost tm-btn--icon tm-btn--sm" aria-label="Close" tabindex="-1">${icon("x")}</button></div><div class="tm-dialog__body">${esc(cs.confirmation.body)}</div><div class="tm-dialog__foot"><button class="tm-btn tm-btn--outline" tabindex="-1">${esc(cs.confirmation.cancel)}</button><button class="tm-btn tm-btn--danger" tabindex="-1">${esc(cs.confirmation.confirm)}</button></div></div>`, "pg-spec--wide")}
        <dialog class="tm-dialog" id="g-dlg" aria-labelledby="g-dlg-t"><form method="dialog"><div class="tm-dialog__head"><h2 class="tm-dialog__title" id="g-dlg-t">Rename unit</h2><button class="tm-btn tm-btn--ghost tm-btn--icon tm-btn--sm" aria-label="Close">${icon("x")}</button></div>
          <div class="tm-dialog__body pg-stack-sm"><div class="tm-field"><label class="tm-field__label" for="g-dlg-in">Title</label><input class="tm-input" id="g-dlg-in" value="PROLOGUE" autofocus></div></div>
          <div class="tm-dialog__foot"><button class="tm-btn tm-btn--outline" value="cancel">Cancel</button><button class="tm-btn tm-btn--primary" value="ok">Save</button></div></form></dialog>
        <dialog class="tm-drawer" id="g-drawer" aria-labelledby="g-drawer-t"><div class="tm-dialog__head"><h2 class="tm-dialog__title" id="g-drawer-t">Drawer</h2><button class="tm-btn tm-btn--ghost tm-btn--icon tm-btn--sm" data-close aria-label="Close drawer">${icon("x")}</button></div><div class="tm-dialog__body"><p>Drawers hold secondary detail views (product detail, cart, record inspector). Width: <code>--tm-drawer-w</code>.</p></div><div class="tm-dialog__foot"><button class="tm-btn tm-btn--primary" data-close>Done</button></div></dialog>
      `)}

      ${section("graphics", "Data graphics", "KPI · legend · tooltip · chart states", `
        ${spec("KPI tiles · trends", `<div class="tm-kpi-strip">
          <div class="tm-kpi"><div class="tm-kpi__label">Improving</div><div class="tm-kpi__value">712<span class="tm-kpi__unit">ms</span></div><div class="tm-kpi__foot"><span class="tm-trend tm-trend--good">${icon("arrowDown", "tm-icon--sm")}−4.2%</span></div></div>
          <div class="tm-kpi"><div class="tm-kpi__label">Worsening</div><div class="tm-kpi__value">73.4<span class="tm-kpi__unit">%</span></div><div class="tm-kpi__foot"><span class="tm-trend tm-trend--bad">${icon("arrowDown", "tm-icon--sm")}−1.6%</span></div></div>
          <div class="tm-kpi"><div class="tm-kpi__label">Neutral</div><div class="tm-kpi__value">748,378</div><div class="tm-kpi__foot"><span class="tm-trend">${icon("arrowUp", "tm-icon--sm")}+8.1%</span></div></div>
          <div class="tm-kpi"><div class="tm-kpi__label">No comparison</div><div class="tm-kpi__value">5<span class="tm-kpi__unit">/ 6</span></div><div class="tm-kpi__foot"><span class="tm-trend">— n/a</span></div></div></div>`, "pg-spec--wide")}
        ${spec("Legend with many series · threshold", `<ul class="tm-legend">${legendChart.series.map((s, i) => `<li><span class="tm-legend__item"><span class="tm-legend__swatch tm-series-${i + 1} tm-legend__swatch--line ${i ? `tm-dash-${Math.min(i + 1, 4)}` : ""}"></span>${esc(s.name)}</span></li>`).join("")}<li><button class="tm-legend__item" aria-pressed="false"><span class="tm-legend__swatch tm-series-6"></span>Hidden series</button></li><li><span class="tm-legend__item"><span class="tm-legend__swatch tm-legend__swatch--rule" style="--_series:var(--tm-chart-threshold)"></span>Threshold</span></li></ul>
          <div class="tm-chart pg-mt" id="g-chart"></div>`, "pg-spec--wide")}
        ${spec("Composite time chart · building blocks", `<div class="tm-panel">
          <header class="tm-panel__head tm-panel__head--rich">
            <div class="tm-panel__heading"><h3 class="tm-panel__title">Activity over time</h3><span class="tm-panel__subtitle">3-hour buckets · stacked by series · drag across the chart to sum a span</span></div>
            <div class="tm-panel__actions"><ul class="tm-legend" id="cx-legend" aria-label="Series"></ul>
              <fieldset class="tm-segmented tm-segmented--sm" aria-label="Metric"><legend class="tm-sr-only">Metric</legend>
                <label class="tm-segmented__option"><input type="radio" name="cx-metric" value="Tokens" checked>Tokens</label>
                <label class="tm-segmented__option"><input type="radio" name="cx-metric" value="Requests">Requests</label></fieldset></div>
          </header>
          <div class="tm-panel__body"><div class="tm-chart" id="cx-chart"></div>
            <div class="tm-chart-readout" id="cx-readout" aria-live="polite"></div>
            <div class="tm-chart-options">
              <label class="tm-choice"><input class="tm-check" type="checkbox" id="cx-peak" checked><span class="tm-choice__label">Peak marker</span></label>
              <label class="tm-choice"><input class="tm-check" type="checkbox" id="cx-window"><span class="tm-choice__label">Busy-hours window (09:00–15:00)</span></label>
            </div></div></div>
          <p class="tm-meta pg-mt">Pieces: <code>.tm-panel__head--rich</code> (title + subtitle + actions), legend and metric switcher in the head, ECharts adapter helpers <code>peakMarker</code>, <code>rangeArea</code>, <code>rangeBrush</code>, <code>dayBoundaryLabels</code>, plus <code>.tm-chart-readout</code> and <code>.tm-chart-options</code>. Data: fixture “Token volume” and “Request throughput”.</p>`, "pg-spec--wide")}
        ${spec("Tooltip (static)", `<div class="tm-chart-tooltip pg-static-tip"><div class="tm-chart-tooltip__title">12:00</div><div class="tm-chart-tooltip__row"><span class="tm-legend__swatch tm-series-1"></span><span>p50</span><span>315 ms</span></div><div class="tm-chart-tooltip__row"><span class="tm-legend__swatch tm-series-2"></span><span>p95</span><span>805 ms</span></div></div>`)}
        ${spec("Chart states", `<div class="pg-stack-sm"><div class="tm-panel"><div class="tm-panel__head"><span class="tm-panel__title">No data</span></div><div class="tm-state"><div class="tm-state__title">${esc(data.analytics.emptyPanel.title)}</div><div class="tm-state__body">${esc(data.analytics.emptyPanel.message)}</div></div></div>
          <div class="tm-panel"><div class="tm-panel__head"><span class="tm-panel__title">Stale</span>${badge("warning", `Delayed ${data.analytics.stalePanel.ageMinutes} min`)}</div><div class="tm-panel__body pg-stale"><span class="tm-skeleton" style="animation:none;height:2rem"></span></div></div></div>`)}
      `)}

      ${section("media", "Commerce & media", "image frame · product card · price", `
        ${spec("Image: loaded / loading / failed", `<div class="pg-3col"><figure>${media("product-002", "Desk lamp")}<figcaption class="tm-meta">Loaded</figcaption></figure>
          <figure><div class="tm-media" data-state="loading" data-keep-loading><div class="tm-media__fallback"></div></div><figcaption class="tm-meta">Loading (forced)</figcaption></figure>
          <figure>${media(data.commerce.edgeCases.missingImageKey, "Missing product image")}<figcaption class="tm-meta">Failed: ${esc(data.commerce.edgeCases.missingImageKey)}</figcaption></figure></div>`, "pg-spec--wide")}
        ${spec("Product card · long title", `<article class="tm-product pg-card-demo">${media(longTitleProduct.imageKey, longTitleProduct.title, { badgeHTML: `<span class="tm-badge tm-badge--info">${esc(longTitleProduct.badge)}</span>` })}<div class="tm-product__body"><h3 class="tm-product__title">${esc(longTitleProduct.title)}</h3><p class="tm-product__desc">${esc(longTitleProduct.description)}</p>${badge("preorder").replace('class="tm-badge ', 'class="tm-badge tm-badge--bare ')}</div><div class="tm-product__foot"><span class="tm-price"><span class="tm-price__now">${fmtMoney(longTitleProduct.price)}</span><span class="tm-price__old">${fmtMoney(95)}</span></span><button class="tm-btn tm-btn--outline">${icon("calendar", "tm-icon--sm")}Preorder</button></div></article>
          <p class="tm-meta pg-mt">Old price ($95.00) is a gallery-only specimen; fixture products have no sale prices.</p>`)}
      `)}

      ${section("editorial", "Editorial", "prose · lists · quote · code", `
        ${spec("Prose sample", `<div class="tm-prose"><h3>${esc(data.website.articles[0].title)}</h3><p>${esc(data.website.articles[0].paragraphs[0])}</p><ul><li>Vary separator strength.</li><li>Limit accent colors.</li></ul><blockquote><p>${esc(data.website.quote.text)}</p></blockquote><pre><code>--tm-reading-width: 68ch;</code></pre></div>`, "pg-spec--wide")}
      `)}

      ${section("stress", "Stress text", "fixture componentStates.stressText", `
        ${spec("In buttons, badges and cells", `<div class="pg-stack-sm">${cs.stressText.map((t) => `<div class="pg-stress-row"><button class="tm-btn tm-btn--outline tm-btn--wrap">${esc(t)}</button><span class="tm-badge tm-badge--neutral pg-badge-trunc" title="${esc(t)}"><span class="tm-truncate">${esc(t)}</span></span><span class="tm-num pg-stress-cell">${esc(t)}</span></div>`).join("")}</div>`, "pg-spec--wide")}
      `)}

      ${section("daisy", "daisyUI bridge", "daisyUI 5 components (prefix d-) themed by --tm-* tokens", `
        ${spec("daisyUI components under The Mechanics tokens", `<div class="pg-stack-sm">
          <div class="pg-row-wrap"><button class="d-btn d-btn-primary d-btn-sm">d-btn primary</button><button class="d-btn d-btn-outline d-btn-sm">d-btn outline</button><button class="d-btn d-btn-error d-btn-sm">d-btn error</button><span class="d-badge d-badge-success">d-badge</span><span class="d-badge d-badge-warning">warning</span><span class="d-loading d-loading-spinner d-loading-sm"></span></div>
          <div class="pg-row-wrap"><input type="checkbox" class="d-toggle d-toggle-primary" checked aria-label="daisy toggle"><input type="checkbox" class="d-checkbox d-checkbox-primary" checked aria-label="daisy checkbox"><input type="radio" class="d-radio d-radio-primary" checked aria-label="daisy radio"><input type="range" class="d-range d-range-primary d-range-sm pg-w-12" value="40" aria-label="daisy range"></div>
          <div role="alert" class="d-alert d-alert-info d-alert-soft"><span>d-alert soft info — same tokens, different component library.</span></div>
          <div role="tablist" class="d-tabs d-tabs-border"><a role="tab" class="d-tab d-tab-active">Tab one</a><a role="tab" class="d-tab">Tab two</a></div></div>
          <p class="tm-meta pg-mt">Shown to verify the adapter (<code>adapters/daisyui.css</code>). Playground apps use the framework-free <code>.tm-*</code> classes.</p>`, "pg-spec--wide")}
      `)}
      </div>
    </div>`;

    const $ = (s) => main.querySelector(s);
    main.querySelectorAll("[data-indeterminate]").forEach((c) => (c.indeterminate = true));
    main.querySelectorAll(".tm-range").forEach((r) => { rangeFill(r); r.addEventListener("input", () => rangeFill(r)); });
    $("#f16").addEventListener("input", (e) => ($("#f16o").textContent = `${e.target.value}%`));
    const dz = $("#dz");
    ["dragenter", "dragover"].forEach((ev) => dz.addEventListener(ev, () => dz.classList.add("is-dragover")));
    ["dragleave", "drop"].forEach((ev) => dz.addEventListener(ev, () => dz.classList.remove("is-dragover")));
    $("#dz-input").addEventListener("change", (e) => toast({ tone: "info", title: "File selected (not uploaded)", body: e.target.files[0]?.name || "" }));
    main.querySelectorAll("[data-toast]").forEach((b) =>
      b.addEventListener("click", () => {
        const t = b.dataset.toast;
        toast({ tone: t, title: t === "danger" ? "Export failed" : t === "success" ? "Saved" : "Heads up", body: t === "danger" ? "Stays until dismissed." : "Dismisses after 5 seconds.", timeout: t === "danger" ? 0 : 5000 });
      }),
    );
    $("#g-dialog").addEventListener("click", () => $("#g-dlg").showModal());
    $("#g-drawer-btn").addEventListener("click", () => $("#g-drawer").showModal());
    $("#g-drawer").addEventListener("click", (e) => { if (e.target.closest("[data-close]") || e.target === e.currentTarget) e.currentTarget.close(); });
    $("#g-dlg").addEventListener("click", (e) => { if (e.target === e.currentTarget) e.currentTarget.close(); });
    $("#g-confirm").addEventListener("click", async () => {
      const ok = await confirmDialog({ title: cs.confirmation.title, body: `<p>${esc(cs.confirmation.body)}</p>`, confirm: cs.confirmation.confirm, cancel: cs.confirmation.cancel, danger: true });
      toast({ tone: ok ? "success" : "neutral", title: ok ? "Confirmed" : "Cancelled", timeout: 2500 });
    });
    main.querySelectorAll("[data-jump]").forEach((a) =>
      a.addEventListener("click", (e) => {
        e.preventDefault();
        const t = main.querySelector(`#${a.dataset.jump}`);
        t.scrollIntoView({ block: "start" });
        t.querySelector("h2").setAttribute("tabindex", "-1");
        t.querySelector("h2").focus({ preventScroll: true });
      }),
    );
    wireMenus(main);
    wireSteppers(main);
    bindMedia(main);
    const chart = mountChart($("#g-chart"), sampleChart, { height: 160 });
    const byId = Object.fromEntries(data.analytics.charts.map((c) => [c.id, c]));
    const readout = $("#cx-readout");
    const idle = "Drag across the chart to sum a span.";
    readout.textContent = idle;
    const cx = mountComposite(
      $("#cx-chart"),
      {
        metrics: { Tokens: byId.tokens, Requests: byId.requests },
        date: new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", timeZone: "UTC" }).format(new Date(data.meta.asOf)).replace("/", "."),
        windowRange: ["09:00", "15:00", "busy hours"],
      },
      { onReadout: (r) => (readout.textContent = r ? `Selected ${r.from}–${r.to} · ${r.buckets} buckets · sum ${r.sum.toLocaleString("en-US")} ${r.unit}` : idle) },
    );
    const drawLegend = () => {
      $("#cx-legend").innerHTML = cx.series().map((s) => `<li><button class="tm-legend__item" type="button" aria-pressed="true" data-cx="${esc(s.name)}"><span class="tm-legend__swatch ${s.cls}"></span>${esc(s.name)}</button></li>`).join("");
    };
    drawLegend();
    $("#cx-legend").addEventListener("click", (e) => { const b = e.target.closest("[data-cx]"); if (b) b.setAttribute("aria-pressed", String(cx.toggle(b.dataset.cx))); });
    main.querySelectorAll('input[name="cx-metric"]').forEach((r) => r.addEventListener("change", () => { cx.setMetric(r.value); drawLegend(); }));
    $("#cx-peak").addEventListener("change", (e) => cx.setPeak(e.target.checked));
    $("#cx-window").addEventListener("change", (e) => cx.setWindow(e.target.checked));
    return () => { chart.destroy(); cx.destroy(); };
  },
};
