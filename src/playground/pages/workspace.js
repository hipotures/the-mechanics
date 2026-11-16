// Workspace — modelled on the owner's pipeline UI (layout only; all content is
// synthetic fixture data). Two views share one route:
//   #/workspace          overview: stage pipeline, sections × passes matrix,
//                        collapsible model assignment + activity, archive
//   #/workspace/analyse  Analyse · P1: unit list with a P1 pass column,
//                        block preview, collapsible terms/costs, danger zone
import { esc, icon, fmtInt, fmtMoney, fmtDateTime, toast, wait, confirmDialog, rovingList } from "../lib.js";

const STATE_LABEL = { complete: "Complete", review: "In review", warning: "Needs check", active: "In progress", pending: "Pending", skipped: "Not required", error: "Failed", none: "Excluded" };
const PROCESSING = { full: "Full", "translate-only": "Translate only", excluded: "Excluded" };
const CONF = { high: "success", medium: "warning", low: "danger" };
const mark = (state, label = STATE_LABEL[state]) => `<span class="tm-mark" data-state="${state}" role="img" aria-label="${esc(label)}" data-tm-tip="${esc(label)}"></span>`;
const statusIcon = { complete: "check", review: "clock", warning: "alert", error: "danger" };

function viewFromHash() {
  const m = location.hash.match(/^#\/workspace\/(analyse)(?:\?unit=([\w-]+))?/);
  return m ? { view: "analyse", unit: m[2] } : { view: "overview" };
}

/* ---------------------------------------------------------------- overview */
function renderOverview(main, data) {
  const w = data.workspace;
  const ov = w.overview;
  let filter = "all";
  const excluded = ov.sections.filter((s) => s.processing === "excluded").length;

  main.innerHTML = `
  <a class="pg-back" href="#/workspace">${icon("chevronLeft", "tm-icon--sm")}Library</a>
  <header class="tm-page-head">
    <div class="tm-page-head__text">
      <div class="tm-eyebrow">Workspace</div>
      <h1 class="tm-page-title">${esc(w.project)}</h1>
      <p class="tm-meta-row"><span>${esc(ov.languagePair)}</span><span class="tm-num">${fmtInt(ov.words)} words</span><span class="tm-num">${ov.sections.length} sections</span></p>
    </div>
    <div class="pg-controls"><span class="tm-status">${mark("active")}In progress</span></div>
  </header>

  <nav class="tm-pipeline pg-mb" aria-label="Pipeline stages">
    ${ov.stages
      .map((s) => {
        const inner = `${mark(s.status)}<span class="tm-stage__title">${esc(s.label)}</span><span class="tm-stage__note">${esc(s.note)}</span>`;
        return s.view ? `<a class="tm-stage" data-state="${s.status}" href="#/workspace/${s.view}">${inner}</a>` : `<div class="tm-stage" data-state="${s.status}">${inner}</div>`;
      })
      .join("")}
  </nav>

  <section aria-labelledby="sec-h" class="pg-mb">
    <div class="tm-section-head">
      <h2 class="tm-section-head__title" id="sec-h">Sections</h2>
      <span class="tm-section-head__meta">${ov.sections.length} detected · ${excluded} excluded</span>
      <fieldset class="tm-segmented tm-segmented--sm" aria-label="Filter sections">
        <legend class="tm-sr-only">Filter sections</legend>
        ${ov.sectionFilters.map((f) => `<label class="tm-segmented__option"><input type="radio" name="secf" value="${f}" ${f === "all" ? "checked" : ""}>${f === "all" ? "All" : PROCESSING[f]}</label>`).join("")}
      </fieldset>
    </div>
    <div class="tm-table-wrap">
      <table class="tm-table pg-sections">
        <caption class="tm-sr-only">Sections and pass status P0 to P5</caption>
        <thead><tr><th scope="col" class="pg-col-n">#</th><th scope="col">Section</th><th scope="col" class="pg-col-proc">Processing</th>${ov.passIds.map((p) => `<th scope="col" class="pg-col-pass">${p}</th>`).join("")}</tr></thead>
        <tbody id="sec-rows"></tbody>
      </table>
    </div>
  </section>

  <div class="pg-stack">
    <details class="tm-collapsible">
      <summary><span class="tm-collapsible__title">Pipeline models</span><span class="tm-collapsible__desc">Assign configured profiles to P1–P5</span></summary>
      <div class="tm-collapsible__body pg-pass-models">
        ${Object.entries(ov.models)
          .map(([pass, model]) => `<div class="tm-field"><label class="tm-label" for="m-${pass}">Pass ${pass.slice(1)}</label><select class="tm-select" id="m-${pass}" data-pass="${pass}">${ov.modelOptions.map((o) => `<option ${o === model ? "selected" : ""}>${esc(o)}</option>`).join("")}</select></div>`)
          .join("")}
      </div>
    </details>
    <details class="tm-collapsible">
      <summary><span class="tm-collapsible__title">Live activity</span><span class="tm-badge tm-badge--count">${ov.activity.length}</span><span class="tm-collapsible__desc">Pipeline events and model waits</span></summary>
      <div class="tm-collapsible__body">
        <ol class="pg-log">${ov.activity
          .map((a) => `<li><time class="tm-num" datetime="${a.at}">${esc(fmtDateTime(a.at).replace(" UTC", ""))}</time>${a.tone === "neutral" || a.tone === "info" ? `<span>${esc(a.event)}</span>` : `<span class="tm-badge tm-badge--${a.tone}">${esc(a.event)}</span>`}</li>`)
          .join("")}</ol>
      </div>
    </details>
  </div>
  <div class="pg-page-end"><button class="tm-btn tm-btn--danger-outline" id="archive">${icon("download", "tm-icon--sm")}Archive workspace</button></div>`;

  const rows = main.querySelector("#sec-rows");
  const draw = () => {
    const list = ov.sections.filter((s) => filter === "all" || s.processing === filter);
    rows.innerHTML = list
      .map((s) => {
        const ex = s.processing === "excluded";
        const title = s.processing === "full" ? `<a href="#/workspace/analyse?unit=${s.id}">${esc(s.title)}</a>` : esc(s.title);
        return `<tr class="${ex ? "is-disabled" : ""}"><td class="tm-num pg-col-n">${String(s.n).padStart(2, "0")}</td><td><span class="tm-table__primary">${title}</span><span class="tm-table__secondary tm-mono">${esc(s.id)}${s.words ? ` · ${fmtInt(s.words)} words` : ""}</span><span class="tm-table__secondary tm-mono pg-proc-inline">${PROCESSING[s.processing]}</span></td><td class="tm-mono pg-col-proc">${PROCESSING[s.processing]}</td>${s.passes
          .map((st, i) => `<td class="pg-col-pass">${mark(st, `${ov.passIds[i]}: ${STATE_LABEL[st]}`)}</td>`)
          .join("")}</tr>`;
      })
      .join("");
  };
  main.querySelectorAll('input[name="secf"]').forEach((r) => r.addEventListener("change", () => { filter = r.value; draw(); }));
  main.querySelectorAll("[data-pass]").forEach((sel) => sel.addEventListener("change", () => toast({ tone: "success", title: `Pass ${sel.dataset.pass.slice(1)} model updated`, body: sel.value, timeout: 3000 })));
  main.querySelector("#archive").addEventListener("click", async () => {
    const ok = await confirmDialog({ title: "Archive this workspace?", body: `<p>${esc(w.project)} becomes read-only. Exports and history stay available.</p>`, confirm: "Archive", danger: true });
    if (ok) toast({ tone: "neutral", title: "Archive simulated", body: "Nothing was changed in this playground." });
  });
  draw();
}

/* ----------------------------------------------------------------- analyse */
function renderAnalyse(main, data, preselect) {
  const w = data.workspace;
  const ov = w.overview;
  const units = w.units;
  let selected = units.some((u) => u.id === preselect) ? preselect : w.states.selectedUnit;
  let query = "";
  const terms = w.preview.blocks.flatMap((b) => b.annotations.map((an) => ({ ...an, block: b.id })));
  terms.push({ term: w.states.longTerm, type: "protocol", confidence: "low", description: "Stress sample: an unbroken long term must wrap, not overflow.", translationNote: "Długi termin bez spacji — test zawijania.", block: "—" });

  main.innerHTML = `
  <a class="pg-back" href="#/workspace">${icon("chevronLeft", "tm-icon--sm")}Workspace</a>
  <header class="tm-page-head">
    <div class="tm-page-head__text">
      <div class="tm-eyebrow">Analyse · ${esc(w.project)}</div>
      <h1 class="tm-page-title">${esc(w.pageTitle)}</h1>
      <p class="tm-subtitle">${esc(w.description)} · <span class="tm-num">${w.completeUnits}/${w.totalUnits}</span> required units · <span class="tm-num">${w.entities}</span> entities</p>
    </div>
    <div class="pg-controls"><span class="tm-status">${mark("complete")}Complete</span></div>
  </header>
  <section class="tm-kpi-strip pg-mb pg-kpi-5" aria-label="Run metrics">
    ${w.metrics.map((m) => `<div class="tm-kpi"><div class="tm-kpi__label">${esc(m.label)}</div><div class="tm-kpi__value">${m.unit === "USD" ? fmtMoney(m.value, "USD", 4) : fmtInt(m.value)}</div></div>`).join("")}
  </section>

  <section class="tm-region pg-mb" aria-label="Analysis">
    <div class="pg-an-grid tm-cells">
      <section class="tm-panel pg-units" aria-labelledby="units-title">
        <header class="tm-panel__head">
          <h2 class="tm-panel__title" id="units-title">Analysis units</h2>
          <div class="tm-input-group pg-units-search"><span class="tm-affix">${icon("search", "tm-icon--sm")}</span><input class="tm-input tm-input--sm" type="search" id="unit-search" placeholder="Filter units" aria-label="Filter units by title or id"></div>
        </header>
        <div class="tm-colhead"><span>Section / unit</span><span class="pg-pass-head">P1</span></div>
        <ul class="tm-list pg-unit-list" id="unit-list" aria-label="Units"></ul>
        <footer class="tm-panel__foot"><span><span class="tm-num">${units.length}</span> of <span class="tm-num">${w.totalUnits}</span> units in this demo</span></footer>
      </section>
      <section class="tm-panel pg-preview" aria-labelledby="preview-title">
        <header class="tm-panel__head"><h2 class="tm-panel__title" id="preview-title"></h2></header>
        <div class="tm-panel__body" id="preview-body"></div>
      </section>
    </div>
  </section>

  <div class="pg-stack">
    <details class="tm-collapsible">
      <summary><span class="tm-collapsible__title">P1 terms and observations</span><span class="tm-badge tm-badge--count">${terms.length}</span><span class="tm-collapsible__desc">Saved terminology for the selected unit</span></summary>
      <div class="tm-collapsible__body"><div class="tm-table-wrap"><table class="tm-table tm-table--stack">
        <thead><tr><th scope="col">Term</th><th scope="col">Type</th><th scope="col">Confidence</th><th scope="col">Note (EN / PL)</th><th scope="col">Block</th></tr></thead>
        <tbody>${terms.map((t) => `<tr><td class="tm-cell-primary" data-label="Term"><span class="tm-table__primary tm-wrap-anywhere">${esc(t.term)}</span></td><td data-label="Type">${esc(t.type)}</td><td data-label="Confidence"><span class="tm-badge tm-badge--${CONF[t.confidence]}">${esc(t.confidence)}</span></td><td data-label="Note"><span>${esc(t.description)}</span><span class="tm-table__secondary" lang="pl">${esc(t.translationNote)}</span></td><td class="tm-num" data-label="Block">${esc(t.block)}</td></tr>`).join("")}</tbody>
      </table></div></div>
    </details>
    <details class="tm-collapsible">
      <summary><span class="tm-collapsible__title">P1 costs and tokens</span><span class="tm-collapsible__desc">Recorded provider usage for this pass</span></summary>
      <div class="tm-collapsible__body pg-stack-sm">
        <div class="tm-label">Current model assignment</div>
        <p>P1 → <span class="tm-mono">${esc(ov.models.P1)}</span></p>
        <div class="tm-table-wrap"><table class="tm-table">
          <thead><tr><th scope="col">Pass</th><th scope="col">Units</th>${w.metrics.map((m) => `<th scope="col" class="tm-col-num">${esc(m.label)}</th>`).join("")}</tr></thead>
          <tbody><tr><td>P1</td><td class="tm-num">${w.completeUnits}/${w.totalUnits} completed</td>${w.metrics.map((m) => `<td class="tm-num">${m.unit === "USD" ? fmtMoney(m.value, "USD", 4) : fmtInt(m.value)}</td>`).join("")}</tr></tbody>
        </table></div>
      </div>
    </details>
    <section class="tm-panel" aria-labelledby="danger-h">
      <header class="tm-panel__head"><h2 class="tm-panel__title" id="danger-h">${esc(ov.danger.title)}</h2></header>
      <div class="tm-panel__body tm-danger-zone">
        <p>${esc(ov.danger.body)}</p>
        <button class="tm-btn tm-btn--danger-outline" disabled aria-describedby="danger-note">${icon("trash", "tm-icon--sm")}${esc(ov.danger.action)}</button>
        <p class="tm-danger-zone__note" id="danger-note">${esc(ov.danger.blocked)}</p>
      </div>
    </section>
  </div>`;

  const list = main.querySelector("#unit-list");
  const byId = Object.fromEntries(units.map((u) => [u.id, u]));

  function drawUnits() {
    const q = query.trim().toLowerCase();
    const items = units.filter((u) => !q || u.title.toLowerCase().includes(q) || u.id.includes(q));
    list.innerHTML = items.length
      ? items
          .map((u) => {
            const on = u.id === selected;
            return `<li class="tm-row pg-unit" data-unit="${u.id}" ${on ? 'aria-current="true"' : ""}>
              <span class="pg-unit__text"><span class="pg-unit__name">${esc(u.title)}</span><span class="pg-unit__id">${esc(u.id)}</span></span>
              <span class="tm-passcell">
                <button class="tm-btn" data-select="${u.id}" data-state="${u.status}" aria-pressed="${on}" aria-label="P1 ${esc(STATE_LABEL[u.status])}: show ${esc(u.title)}" data-tm-tip="P1 · ${esc(STATE_LABEL[u.status])}">${icon(statusIcon[u.status] || "check", "tm-icon--sm")}</button>
                <button class="tm-btn" data-run="${u.id}" aria-label="Run P1 for ${esc(u.title)}" data-tm-tip="Run P1">${icon("play", "tm-icon--sm")}</button>
              </span></li>`;
          })
          .join("")
      : `<li><div class="tm-state"><div class="tm-state__icon">${icon("search")}</div><div class="tm-state__title">No units match “${esc(query)}”</div><div class="tm-state__body">Check the unit id or clear the filter.</div><button class="tm-btn tm-btn--sm tm-btn--outline" id="clear-search">Clear filter</button></div></li>`;
    main.querySelector("#clear-search")?.addEventListener("click", () => {
      const s = main.querySelector("#unit-search");
      s.value = "";
      query = "";
      drawUnits();
      s.focus();
    });
  }

  function blocksHTML() {
    return `<div class="pg-preview-intro"><div class="tm-label">${esc(w.preview.title)}</div><p class="tm-subtitle">Saved P1 terms and observations for this unit.</p></div>
      <div class="tm-group pg-blocks">
        <div class="tm-colhead pg-blocks__cols" aria-hidden="true"><span>English source</span><span>Terms & observations · EN / PL</span></div>
        <ol class="tm-list" id="block-rows" aria-label="Blocks: English source with terms and observations">${w.preview.blocks
          .map(
            (b) => `<li class="tm-record">
            <div class="tm-record__head"><span>${esc(b.id)}</span>${b.annotations.length ? `<span class="tm-meta">${b.annotations.length} note${b.annotations.length > 1 ? "s" : ""}</span>` : ""}</div>
            <div class="tm-record__cols">
              <div class="pg-source"><span class="tm-sr-only">Source: </span>${esc(b.english)}</div>
              <div><span class="tm-sr-only">Notes: </span>${
                b.annotations.length
                  ? b.annotations
                      .map(
                        (an) => `<div class="pg-annot"><div class="pg-annot__head"><span class="pg-term tm-wrap-anywhere">${esc(an.term)}</span><span class="tm-meta">${esc(an.type)}</span><span class="tm-badge tm-badge--${CONF[an.confidence] || "neutral"}">${esc(an.confidence)}</span></div>
                <p class="pg-annot__desc"><span class="pg-lang" data-tm-tip="English">EN</span>${esc(an.description)}</p><p class="pg-annot__desc" lang="pl"><span class="pg-lang" data-tm-tip="Polski">PL</span>${esc(an.translationNote)}</p></div>`,
                      )
                      .join("")
                  : '<p class="tm-muted pg-none">No new terms or observations for this block.</p>'
              }</div>
            </div></li>`,
          )
          .join("")}</ol>
      </div>
      <div class="pg-preview-foot"><span class="tm-meta" id="blocks-shown">${w.preview.blocks.length} blocks shown</span>
        ${w.navigation.hasNext ? `<button class="tm-btn tm-btn--outline tm-btn--sm" id="load-next">${icon("arrowDown", "tm-icon--sm")}Load next ${w.navigation.pageSize} blocks</button>` : ""}</div>`;
  }

  function drawPreview() {
    const u = byId[selected];
    main.querySelector("#preview-title").innerHTML = `<span class="tm-truncate">P1 preview · <span class="tm-mono">${esc(selected)}</span></span>`;
    main.querySelector("#preview-body").innerHTML =
      selected === w.preview.unitId
        ? blocksHTML()
        : `<div class="tm-state"><div class="tm-state__icon">${icon("workspace")}</div><div class="tm-state__title">${esc(u.title)} · no saved preview</div>
          <div class="tm-state__body">The demo fixture includes block previews for ${esc(w.preview.unitId)} only. P1 status: ${esc(STATE_LABEL[u.status])}.</div>
          <button class="tm-btn tm-btn--sm tm-btn--outline" data-goto="${esc(w.preview.unitId)}">Open ${esc(w.preview.unitId)}</button></div>`;
  }

  function select(id) {
    selected = id;
    list.querySelectorAll("[data-unit]").forEach((li) => {
      const on = li.dataset.unit === id;
      on ? li.setAttribute("aria-current", "true") : li.removeAttribute("aria-current");
      li.querySelector("[data-select]").setAttribute("aria-pressed", String(on));
    });
    drawPreview();
  }

  list.addEventListener("click", (e) => {
    const run = e.target.closest("[data-run]");
    if (run) {
      toast({ tone: "info", title: "P1 run queued (simulated)", body: byId[run.dataset.run].title, timeout: 3000 });
      return;
    }
    const li = e.target.closest("[data-unit]");
    if (li) select(li.dataset.unit);
  });
  rovingList(list, "[data-select]");
  main.querySelector("#unit-search").addEventListener("input", (e) => {
    query = e.target.value;
    drawUnits();
  });
  main.querySelector("#preview-body").addEventListener("click", async (e) => {
    const g = e.target.closest("[data-goto]");
    if (g) {
      select(g.dataset.goto);
      return;
    }
    const next = e.target.closest("#load-next");
    if (!next) return;
    next.setAttribute("aria-busy", "true");
    next.disabled = true;
    const rows = main.querySelector("#block-rows");
    const sk = document.createElement("li");
    sk.className = "pg-skel-rows";
    sk.setAttribute("aria-label", "Loading blocks");
    sk.innerHTML = Array.from({ length: 3 }, () => `<div class="tm-record"><div class="tm-record__head"><span class="tm-skeleton" style="width:5rem"></span></div><div class="tm-record__body"><span class="tm-skeleton"></span><span class="tm-skeleton" style="width:60%;margin-top:6px"></span></div></div>`).join("");
    rows.append(sk);
    await wait(900);
    sk.remove();
    next.remove();
    const end = document.createElement("div");
    end.className = "tm-alert tm-alert--info pg-mt";
    end.setAttribute("role", "status");
    end.innerHTML = `${icon("info")}<div><div class="tm-alert__title">End of demo fixture</div><div class="tm-alert__body">A real application would request the next ${w.navigation.pageSize} blocks here.</div></div>`;
    main.querySelector(".pg-preview-foot").after(end);
  });

  drawUnits();
  drawPreview();
}

export default {
  render(main, data) {
    const draw = () => {
      const v = viewFromHash();
      main.dataset.view = v.view;
      v.view === "analyse" ? renderAnalyse(main, data, v.unit) : renderOverview(main, data);
      window.scrollTo(0, 0);
    };
    // Sub-views share the route, so the page follows hash changes itself.
    window.addEventListener("hashchange", draw);
    draw();
    return () => window.removeEventListener("hashchange", draw);
  },
};
