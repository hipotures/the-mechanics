import { esc, icon, fmtInt, fmtMoney, badge, toast, wait, wireMenus, rovingList } from "../lib.js";
import { ANNOTATION_TAB } from "../derived.js";

const CONF = { high: "success", medium: "warning", low: "danger" };

function annotationHTML(an) {
  return `<div class="pg-annot">
    <div class="pg-annot__head"><span class="pg-term tm-wrap-anywhere">${esc(an.term)}</span>
      <span class="tm-meta">${esc(an.type)}</span>
      <span class="tm-badge tm-badge--${CONF[an.confidence] || "neutral"}">${esc(an.confidence)}</span></div>
    <p class="pg-annot__desc"><span class="pg-lang" title="English">EN</span>${esc(an.description)}</p>
    <p class="pg-annot__desc" lang="pl"><span class="pg-lang" title="Polski">PL</span>${esc(an.translationNote)}</p>
  </div>`;
}

export default {
  render(main, data) {
    const w = data.workspace;
    let selected = w.states.selectedUnit;
    let tab = w.preview.tabs[0];
    let query = "";
    let statusFilter = "all";

    const terms = w.preview.blocks.flatMap((b) => b.annotations.map((an) => ({ ...an, block: b.id })));

    main.innerHTML = `
    <header class="tm-page-head">
      <div class="tm-page-head__text">
        <nav aria-label="Breadcrumb"><ol class="tm-breadcrumbs"><li><a href="#/workspace">Projects</a></li><li><a href="#/workspace">${esc(w.project)}</a></li><li><span aria-current="page">Analyse · P1</span></li></ol></nav>
        <h1 class="tm-page-title">${esc(w.pageTitle)}</h1>
        <p class="tm-subtitle">${esc(w.description)} · <span class="tm-num">${w.completeUnits}/${w.totalUnits}</span> required units · <span class="tm-num">${w.entities}</span> entities</p>
      </div>
      <div class="pg-controls">${badge(w.completeUnits === w.totalUnits ? "complete" : "pending", w.completeUnits === w.totalUnits ? "Complete" : "In progress")}</div>
    </header>
    <section class="tm-kpi-strip pg-mb pg-kpi-5" aria-label="Run metrics">
      ${w.metrics
        .map(
          (m) => `<div class="tm-kpi"><div class="tm-kpi__label">${esc(m.label)}</div><div class="tm-kpi__value">${
            m.unit === "USD" ? fmtMoney(m.value, "USD", 4) : fmtInt(m.value)
          }</div></div>`,
        )
        .join("")}
    </section>

    <section class="tm-region" aria-label="Analysis workspace">
      <div class="tm-toolbar pg-ws-toolbar" role="toolbar" aria-label="Workspace actions">
        <div class="tm-input-group pg-search">
          <span class="tm-affix">${icon("search", "tm-icon--sm")}</span>
          <input class="tm-input" type="search" id="unit-search" placeholder="Filter units by title or id" aria-label="Filter units">
        </div>
        <fieldset class="tm-segmented tm-segmented--sm" aria-label="Status filter">
          <legend class="tm-sr-only">Status filter</legend>
          ${["all", "complete", "review", "warning"]
            .map((s) => `<label class="tm-segmented__option"><input type="radio" name="ustatus" value="${s}" ${s === "all" ? "checked" : ""}>${s === "all" ? "All" : s[0].toUpperCase() + s.slice(1)}</label>`)
            .join("")}
        </fieldset>
        <span class="tm-toolbar__spacer"></span>
        <button class="tm-btn tm-btn--sm tm-btn--outline" id="export">${icon("download", "tm-icon--sm")}Export P1</button>
        <button class="tm-btn tm-btn--sm tm-btn--primary" popovertarget="run-menu">${icon("play", "tm-icon--sm")}Run<span class="tm-sr-only"> options</span>${icon("chevronDown", "tm-icon--sm")}</button>
        <div class="tm-menu" id="run-menu" popover role="menu" aria-label="Run options">
          <div class="tm-menu__label">Re-run analysis</div>
          <button class="tm-menu__item" role="menuitem" data-run="unit">Selected unit</button>
          <button class="tm-menu__item" role="menuitem" data-run="review">Units in review</button>
          <button class="tm-menu__item" role="menuitem" disabled>All units (locked while complete)</button>
          <hr class="tm-menu__sep">
          <button class="tm-menu__item tm-menu__item--danger" role="menuitem" data-run="clear">Clear saved P1 results…</button>
        </div>
      </div>
      <div class="pg-ws-grid">
        <section class="tm-panel pg-units" aria-labelledby="units-title">
          <header class="tm-panel__head"><h2 class="tm-panel__title" id="units-title">${icon("stack", "tm-icon--sm")}Analysis units</h2><span class="tm-panel__meta" id="unit-count"></span></header>
          <div class="tm-colhead"><span>Section / unit</span><span>P1</span></div>
          <ul class="tm-list pg-unit-list" id="unit-list" aria-label="Units"></ul>
          <footer class="tm-panel__foot"><span><span class="tm-num">${w.units.length}</span> of <span class="tm-num">${w.totalUnits}</span> loaded</span>
            <span class="tm-tip"><button class="tm-btn tm-btn--sm tm-btn--outline" aria-disabled="true" aria-describedby="more-tip">Load more</button><span class="tm-tip__bubble" role="tooltip" id="more-tip">The demo fixture contains ${w.units.length} units.</span></span></footer>
        </section>

        <section class="tm-panel pg-preview" aria-labelledby="preview-title">
          <header class="tm-panel__head">
            <h2 class="tm-panel__title" id="preview-title"></h2>
            <div class="pg-icon-row">
              <span class="tm-tip"><button class="tm-btn tm-btn--ghost tm-btn--icon tm-btn--sm" aria-label="Split view" aria-describedby="tip-split" aria-pressed="true">${icon("split", "tm-icon--sm")}</button><span class="tm-tip__bubble" role="tooltip" id="tip-split">Source and notes side by side</span></span>
              <span class="tm-tip"><button class="tm-btn tm-btn--ghost tm-btn--icon tm-btn--sm" aria-label="Copy unit id" aria-describedby="tip-copy" data-copy>${icon("copy", "tm-icon--sm")}</button><span class="tm-tip__bubble" role="tooltip" id="tip-copy">Copy unit id</span></span>
            </div>
          </header>
          <div class="tm-tabs" role="tablist" aria-label="Preview views">
            ${w.preview.tabs.map((t, i) => `<button class="tm-tab" role="tab" id="tab-${i}" aria-controls="tabpanel" aria-selected="${t === tab}" tabindex="${t === tab ? 0 : -1}" data-tab="${esc(t)}">${esc(t)}<span class="tm-badge tm-badge--count" data-tab-count="${esc(t)}"></span></button>`).join("")}
          </div>
          <div class="tm-panel__body" id="tabpanel" role="tabpanel" aria-labelledby="tab-0" tabindex="0"></div>
        </section>

        <aside class="tm-panel pg-inspector" aria-labelledby="insp-title">
          <header class="tm-panel__head"><h2 class="tm-panel__title" id="insp-title">Unit details</h2></header>
          <div class="tm-panel__body pg-stack-sm" id="inspector"></div>
        </aside>
      </div>
    </section>`;

    const list = main.querySelector("#unit-list");
    const unitById = Object.fromEntries(w.units.map((u) => [u.id, u]));

    function renderUnits() {
      const q = query.trim().toLowerCase();
      const items = w.units.filter(
        (u) => (statusFilter === "all" || u.status === statusFilter) && (!q || u.title.toLowerCase().includes(q) || u.id.includes(q)),
      );
      main.querySelector("#unit-count").textContent = `${items.length} shown`;
      list.innerHTML = items.length
        ? items
            .map(
              (u) => `<li><button class="tm-row tm-row--interactive pg-unit" data-unit="${u.id}" ${u.id === selected ? 'aria-current="true"' : ""}>
              <span class="pg-unit__text"><span class="pg-unit__name">${esc(u.title)}</span><span class="pg-unit__id">${esc(u.id)}</span></span>
              ${u.progress < 100 ? `<progress class="tm-progress tm-progress--sm pg-unit__prog" max="100" value="${u.progress}" aria-label="${u.progress}% complete"></progress><span class="tm-num tm-meta">${u.progress}%</span>` : ""}
              ${badge(u.status, u.status === "warning" ? "Check" : u.status === "review" ? "Review" : "Done")}
            </button></li>`,
            )
            .join("")
        : `<li><div class="tm-state"><div class="tm-state__icon">${icon("search")}</div><div class="tm-state__title">No units match “${esc(query)}”</div><div class="tm-state__body">Check the unit id or clear the filter.</div><button class="tm-btn tm-btn--sm tm-btn--outline" id="clear-search">Clear filter</button></div></li>`;
      main.querySelector("#clear-search")?.addEventListener("click", () => {
        const s = main.querySelector("#unit-search");
        s.value = "";
        query = "";
        renderUnits();
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
              <div><span class="tm-sr-only">Notes: </span>${b.annotations.length ? b.annotations.map(annotationHTML).join("") : '<p class="tm-muted pg-none">No new terms or observations for this block.</p>'}</div>
            </div></li>`,
          )
          .join("")}</ol>
      </div>
      <div class="pg-preview-foot"><span class="tm-meta" id="blocks-shown">${w.preview.blocks.length} blocks shown</span>
        ${w.navigation.hasNext ? `<button class="tm-btn tm-btn--outline tm-btn--sm" id="load-next">${icon("arrowDown", "tm-icon--sm")}Load next ${w.navigation.pageSize} blocks</button>` : ""}</div>`;
    }

    function termsHTML(kind) {
      const rows = terms.filter((t) => ANNOTATION_TAB[t.type] === kind);
      if (kind === "Terms") rows.push({ term: w.states.longTerm, type: "protocol", confidence: "low", description: "Stress sample: an unbroken long term must wrap, not overflow.", translationNote: "Długi termin bez spacji — test zawijania.", block: "—" });
      if (!rows.length) return `<div class="tm-state"><div class="tm-state__icon">${icon("content")}</div><div class="tm-state__title">No ${kind.toLowerCase()} saved</div></div>`;
      return `<div class="tm-table-wrap"><table class="tm-table tm-table--stack">
        <thead><tr><th scope="col">Term</th><th scope="col">Type</th><th scope="col">Confidence</th><th scope="col">Note (EN / PL)</th><th scope="col">Block</th></tr></thead>
        <tbody>${rows
          .map(
            (t) => `<tr><td class="tm-cell-primary" data-label="Term"><span class="tm-table__primary tm-wrap-anywhere">${esc(t.term)}</span></td><td data-label="Type">${esc(t.type)}</td>
            <td data-label="Confidence"><span class="tm-badge tm-badge--${CONF[t.confidence]}">${esc(t.confidence)}</span></td>
            <td data-label="Note"><span>${esc(t.description)}</span><span class="tm-table__secondary" lang="pl">${esc(t.translationNote)}</span></td>
            <td class="tm-num" data-label="Block">${esc(t.block)}</td></tr>`,
          )
          .join("")}</tbody></table></div>`;
    }

    function renderPreview() {
      const u = unitById[selected];
      main.querySelector("#preview-title").innerHTML = `${icon("workspace", "tm-icon--sm")}<span class="tm-truncate">P1 preview · <span class="tm-mono">${esc(selected)}</span></span>`;
      main.querySelectorAll("[data-tab]").forEach((b) => {
        const on = b.dataset.tab === tab;
        b.setAttribute("aria-selected", String(on));
        b.tabIndex = on ? 0 : -1;
        if (on) main.querySelector("#tabpanel").setAttribute("aria-labelledby", b.id);
      });
      const hasPreview = selected === w.preview.unitId;
      main.querySelectorAll("[data-tab-count]").forEach((s) => {
        const t = s.dataset.tabCount;
        const n = !hasPreview ? 0 : t === "Preview" ? w.preview.blocks.length : terms.filter((x) => ANNOTATION_TAB[x.type] === t).length + (t === "Terms" ? 1 : 0);
        s.textContent = n;
        s.hidden = !hasPreview;
      });
      const panel = main.querySelector("#tabpanel");
      if (!hasPreview) {
        panel.innerHTML = `<div class="tm-state"><div class="tm-state__icon">${icon("workspace")}</div><div class="tm-state__title">${esc(u.title)} · no saved preview</div>
          <div class="tm-state__body">The demo fixture includes block previews for ${esc(w.preview.unitId)} only. Status: ${esc(u.status)}, ${u.progress}% processed.</div>
          <button class="tm-btn tm-btn--sm tm-btn--outline" data-goto="${esc(w.preview.unitId)}">Open ${esc(w.preview.unitId)}</button></div>`;
      } else panel.innerHTML = tab === "Preview" ? blocksHTML() : termsHTML(tab);
      renderInspector(u);
    }

    function renderInspector(u) {
      const unitTerms = selected === w.preview.unitId ? terms.length : 0;
      main.querySelector("#inspector").innerHTML = `
        <dl class="pg-dl">
          <dt>Unit</dt><dd class="tm-mono">${esc(u.id)}</dd>
          <dt>Title</dt><dd>${esc(u.title)}</dd>
          <dt>Status</dt><dd>${badge(u.status)}</dd>
          <dt>Progress</dt><dd><progress class="tm-progress ${u.progress < 100 ? "tm-progress--warning" : "tm-progress--success"}" max="100" value="${u.progress}" aria-label="Progress"></progress><span class="tm-num tm-meta">${u.progress}%</span></dd>
          <dt>Notes</dt><dd class="tm-num">${unitTerms}</dd>
        </dl>
        <fieldset class="tm-fieldset pg-stack-sm">
          <legend>Review checklist</legend>
          <label class="tm-choice"><input class="tm-check" type="checkbox" checked><span class="tm-choice__text"><span class="tm-choice__label">Terms consistent</span><span class="tm-choice__desc">Same technical name across sections</span></span></label>
          <label class="tm-choice"><input class="tm-check" type="checkbox" ${u.status === "complete" ? "checked" : ""}><span class="tm-choice__text"><span class="tm-choice__label">Roles distinguished</span><span class="tm-choice__desc">Role titles vs. personal names</span></span></label>
          <label class="tm-choice"><input class="tm-check" type="checkbox" disabled><span class="tm-choice__text"><span class="tm-choice__label">Glossary exported</span><span class="tm-choice__desc">Available after P2</span></span></label>
        </fieldset>
        <div class="tm-field"><label class="tm-field__label" for="ws-comment">Reviewer comment <span class="tm-meta">EN / PL</span></label>
          <textarea class="tm-textarea" id="ws-comment" rows="3" placeholder="Komentarz dla tłumacza… / Note for the translator…"></textarea>
          <span class="tm-field__hint">Saved locally for this demo session only.</span></div>
        <button class="tm-btn tm-btn--primary tm-btn--block" id="save-comment">${icon("check")}Save review</button>`;
      main.querySelector("#save-comment").addEventListener("click", () => {
        const v = main.querySelector("#ws-comment").value.trim();
        toast({ tone: v ? "success" : "warning", title: v ? "Review saved" : "Comment is empty", body: v ? `${u.id} marked as reviewed.` : "Add a short note before saving." });
      });
    }

    list.addEventListener("click", (e) => {
      const b = e.target.closest("[data-unit]");
      if (!b) return;
      selected = b.dataset.unit;
      list.querySelectorAll("[data-unit]").forEach((x) => (x.dataset.unit === selected ? x.setAttribute("aria-current", "true") : x.removeAttribute("aria-current")));
      renderPreview();
    });
    rovingList(list, "[data-unit]");
    main.querySelector("#unit-search").addEventListener("input", (e) => {
      query = e.target.value;
      renderUnits();
    });
    main.querySelectorAll('input[name="ustatus"]').forEach((r) =>
      r.addEventListener("change", () => {
        statusFilter = r.value;
        renderUnits();
      }),
    );
    const tablist = main.querySelector('[role="tablist"]');
    tablist.addEventListener("click", (e) => {
      const b = e.target.closest("[data-tab]");
      if (!b) return;
      tab = b.dataset.tab;
      renderPreview();
    });
    tablist.addEventListener("keydown", (e) => {
      const tabs = [...tablist.querySelectorAll("[data-tab]")];
      const i = tabs.indexOf(document.activeElement);
      if (i < 0 || !["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) return;
      e.preventDefault();
      const n = e.key === "ArrowRight" ? (i + 1) % tabs.length : e.key === "ArrowLeft" ? (i - 1 + tabs.length) % tabs.length : e.key === "Home" ? 0 : tabs.length - 1;
      tab = tabs[n].dataset.tab;
      renderPreview();
      tabs[n].focus();
    });
    main.querySelector("#tabpanel").addEventListener("click", async (e) => {
      const g = e.target.closest("[data-goto]");
      if (g) {
        selected = g.dataset.goto;
        renderUnits();
        renderPreview();
        return;
      }
      const next = e.target.closest("#load-next");
      if (!next) return;
      next.setAttribute("aria-busy", "true");
      next.disabled = true;
      const rows = main.querySelector("#block-rows");
      const sk = document.createElement("div");
      sk.className = "pg-skel-rows";
      sk.setAttribute("role", "listitem");
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
    main.querySelector("[data-copy]").addEventListener("click", () => toast({ tone: "neutral", title: "Copied unit id", body: selected, timeout: 3000 }));
    main.querySelector("#export").addEventListener("click", () => toast({ tone: "success", title: "Export prepared", body: `${w.units.length} units · ${terms.length} annotations (synthetic).` }));
    main.querySelector("#run-menu").addEventListener("click", (e) => {
      const r = e.target.closest("[data-run]");
      if (!r) return;
      if (r.dataset.run === "clear") toast({ tone: "warning", title: "Nothing cleared", body: "Destructive actions are simulated in this playground." });
      else toast({ tone: "info", title: "Run queued", body: r.dataset.run === "unit" ? selected : "Units in review: ch0005_a001" });
    });
    wireMenus(main);
    renderUnits();
    renderPreview();
  },
};
