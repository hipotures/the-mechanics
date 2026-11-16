import { esc, icon, fmtMoney, fmtDate, badge, toast, wait, wireMenus, confirmDialog, stepperHTML, wireSteppers } from "../lib.js";

const PLANS = ["Starter", "Growth", "Enterprise"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default {
  render(main, data) {
    const dm = data.dataManagement;
    const cs = data.componentStates;
    const records = dm.records.map((r) => ({ ...r }));
    const st = {
      query: "",
      status: "all",
      team: "all",
      sort: { key: "updated", dir: "desc" },
      page: 1,
      selected: new Set(dm.selectionSample.selectedIds),
      onlySelected: false,
      density: "compact",
      mode: "live",
      inline: null,
      editing: null,
    };

    main.innerHTML = `
    <header class="tm-page-head">
      <div class="tm-page-head__text">
        <div class="tm-eyebrow">Data management · Administration</div>
        <h1 class="tm-page-title">${esc(dm.pageTitle)}</h1>
        <p class="tm-subtitle">${esc(dm.description)} <span class="tm-num">${dm.totalRecords}</span> synthetic records.</p>
      </div>
      <div class="pg-controls">
        <button class="tm-btn tm-btn--outline" id="export-all">${icon("download")}Export CSV</button>
        <button class="tm-btn tm-btn--primary" id="new-account">${icon("plus")}New account</button>
      </div>
    </header>
    <div class="pg-dm-grid">
      <section class="tm-region pg-dm-table" aria-labelledby="acc-title">
        <header class="tm-region__head"><h2 class="tm-region__title" id="acc-title">Accounts</h2>
          <fieldset class="tm-segmented tm-segmented--sm" aria-label="Data state (demo)">
            <legend class="tm-sr-only">Simulated data state</legend>
            ${["live", "loading", "error"].map((m) => `<label class="tm-segmented__option"><input type="radio" name="mode" value="${m}" ${m === "live" ? "checked" : ""}>${m[0].toUpperCase() + m.slice(1)}</label>`).join("")}
          </fieldset>
        </header>
        <div class="tm-toolbar pg-dm-toolbar" role="search">
          <div class="tm-input-group pg-search">
            <span class="tm-affix">${icon("search", "tm-icon--sm")}</span>
            <input class="tm-input" type="search" id="q" placeholder="Search name, email, id…" aria-label="Search accounts">
          </div>
          <label class="tm-sr-only" for="f-status">Status</label>
          <select class="tm-select pg-w-auto" id="f-status">${dm.filters.status.map((s) => `<option value="${s}">${s === "all" ? "All statuses" : s[0].toUpperCase() + s.slice(1)}</option>`).join("")}</select>
          <label class="tm-sr-only" for="f-team">Team</label>
          <select class="tm-select pg-w-auto" id="f-team">${dm.filters.team.map((s) => `<option value="${s}">${s === "all" ? "All teams" : esc(s)}</option>`).join("")}</select>
          <span class="tm-toolbar__spacer"></span>
          <fieldset class="tm-segmented tm-segmented--sm" aria-label="Row density">
            <legend class="tm-sr-only">Row density</legend>
            ${cs.densityModes.map((d) => `<label class="tm-segmented__option"><input type="radio" name="density" value="${d}" ${d === "compact" ? "checked" : ""}>${d[0].toUpperCase() + d.slice(1)}</label>`).join("")}
          </fieldset>
        </div>
        <div class="pg-bulk" id="bulk" role="region" aria-label="Bulk actions" hidden></div>
        <div class="pg-chips" id="chips" hidden></div>
        <div class="tm-table-wrap tm-table-wrap--flush pg-dm-wrap" id="table-wrap" aria-live="polite"></div>
        <div class="tm-panel__foot pg-dm-foot" id="pager"></div>
      </section>

      <section class="tm-region pg-dm-editor" aria-labelledby="ed-title">
        <header class="tm-region__head"><h2 class="tm-region__title" id="ed-title">Account editor</h2><span class="tm-panel__meta" id="ed-mode"></span></header>
        <form class="tm-region__body pg-stack-sm" id="editor" novalidate></form>
      </section>
    </div>`;

    const $ = (s) => main.querySelector(s);

    function filtered() {
      const q = st.query.trim().toLowerCase();
      const rows = records.filter(
        (r) =>
          (st.status === "all" || r.status === st.status) &&
          (st.team === "all" || r.team === st.team) &&
          (!st.onlySelected || st.selected.has(r.id)) &&
          (!q || [r.name, r.email, r.id, r.note || ""].some((v) => v.toLowerCase().includes(q))),
      );
      const { key, dir } = st.sort;
      const m = dir === "asc" ? 1 : -1;
      rows.sort((a, b) => (a[key] < b[key] ? -m : a[key] > b[key] ? m : a.id < b.id ? -1 : 1));
      return rows;
    }

    function headerCell(col) {
      const sortable = dm.sortableFields.includes(col.key);
      const num = col.kind === "currency";
      const sorted = st.sort.key === col.key;
      const aria = sorted ? (st.sort.dir === "asc" ? "ascending" : "descending") : "none";
      const label = esc(col.label);
      return `<th scope="col" class="${num ? "tm-col-num" : ""}" ${sortable ? `aria-sort="${aria}"` : ""}>${
        sortable
          ? `<button class="tm-sort" data-sort="${col.key}">${label}<span class="tm-sort__icon" aria-hidden="true">${sorted ? (st.sort.dir === "asc" ? "▲" : "▼") : "↕"}</span></button>`
          : label
      }</th>`;
    }

    function cell(r, col) {
      switch (col.key) {
        case "name":
          if (st.inline === r.id)
            return `<td class="tm-cell-primary" data-label=""><div class="pg-inline"><input class="tm-input tm-input--sm" id="inline-input" value="${esc(r.name)}" aria-label="Account name for ${esc(r.id)}"><button class="tm-btn tm-btn--sm tm-btn--primary tm-btn--icon" data-inline-save aria-label="Save name">${icon("check", "tm-icon--sm")}</button><button class="tm-btn tm-btn--sm tm-btn--ghost tm-btn--icon" data-inline-cancel aria-label="Cancel edit">${icon("x", "tm-icon--sm")}</button></div></td>`;
          return `<td class="tm-cell-primary" data-label=""><div class="pg-acc"><span class="tm-table__primary" title="${esc(`${r.id} · ${r.email}`)}">${esc(r.name)}</span>
            ${r.note ? `<span class="pg-note-flag" title="${esc(r.note)}" aria-label="Has internal note">${icon("info", "tm-icon--sm")}</span>` : ""}
            <button class="tm-btn tm-btn--ghost tm-btn--icon tm-btn--sm pg-inline-edit" data-inline="${r.id}" aria-label="Rename ${esc(r.name)}">${icon("edit", "tm-icon--sm")}</button></div>
            <span class="tm-table__secondary"><span class="tm-mono">${esc(r.id)}</span> · ${esc(r.email)}</span>
            ${r.note ? `<span class="tm-table__secondary pg-note tm-truncate" title="${esc(r.note)}">${icon("info", "tm-icon--sm")} ${esc(r.note)}</span>` : ""}</td>`;
        case "status":
          return `<td data-label="Status">${badge(r.status)}</td>`;
        case "balance":
          return `<td class="tm-num ${r.balance < 0 ? "tm-text-danger" : r.balance === 0 ? "tm-muted" : ""}" data-label="Balance">${fmtMoney(r.balance)}</td>`;
        case "updated":
          return `<td class="tm-num" data-label="Updated"><time datetime="${r.updated}">${fmtDate(r.updated)}</time></td>`;
        default:
          return `<td data-label="${esc(col.label)}">${esc(r[col.key])}</td>`;
      }
    }

    function renderTable() {
      const wrap = $("#table-wrap");
      // Compact: one line per account (id/email in the title tooltip), 32px rows.
      // Comfortable: name + id/email + note lines, 40px minimum and more air.
      const tbl = (body) => `<table class="tm-table tm-table--stack ${st.density === "comfortable" ? "tm-density-comfortable" : "pg-compact"}" id="acc-table">
        <caption class="tm-sr-only">Accounts, sortable by column headers</caption>
        <thead><tr><th scope="col" class="tm-col-check"><input class="tm-check" type="checkbox" id="check-all" aria-label="Select all on this page"></th>${dm.columns.map(headerCell).join("")}<th scope="col" class="tm-col-actions"><span class="tm-sr-only">Actions</span></th></tr></thead>
        <tbody>${body}</tbody></table>`;
      wrap.removeAttribute("aria-busy");
      if (st.mode === "loading") {
        wrap.setAttribute("aria-busy", "true");
        wrap.innerHTML = tbl(
          Array.from({ length: dm.pageSize }, () => `<tr><td class="tm-col-check"><span class="tm-skeleton" style="width:1rem;height:1rem"></span></td>${dm.columns.map(() => `<td><span class="tm-skeleton"></span></td>`).join("")}<td></td></tr>`).join(""),
        );
        $("#check-all").disabled = true;
        $("#pager").innerHTML = `<span class="tm-meta"><span class="tm-spinner"></span> Loading accounts…</span>`;
        return;
      }
      if (st.mode === "error") {
        wrap.innerHTML = `<div class="tm-state tm-state--error" role="alert"><div class="tm-state__icon">${icon("danger")}</div><div class="tm-state__title">Accounts could not be loaded</div><div class="tm-state__body">The directory service returned an error (simulated). Your filters are kept.</div><button class="tm-btn tm-btn--sm tm-btn--outline" id="retry">${icon("refresh", "tm-icon--sm")}Retry</button></div>`;
        $("#pager").innerHTML = "";
        $("#retry").addEventListener("click", async (e) => {
          e.currentTarget.setAttribute("aria-busy", "true");
          await wait(600);
          setMode("live");
        });
        return;
      }
      const rows = filtered();
      const pages = Math.max(1, Math.ceil(rows.length / dm.pageSize));
      st.page = Math.min(st.page, pages);
      const pageRows = rows.slice((st.page - 1) * dm.pageSize, st.page * dm.pageSize);
      if (!rows.length) {
        wrap.innerHTML = `<div class="tm-state"><div class="tm-state__icon">${icon("search")}</div><div class="tm-state__title">No accounts match${st.query ? ` “${esc(st.query)}”` : " these filters"}</div><div class="tm-state__body">Try a different search term or clear the active filters.</div><button class="tm-btn tm-btn--sm tm-btn--outline" id="clear-filters">Clear filters</button></div>`;
        $("#clear-filters").addEventListener("click", clearFilters);
      } else {
        wrap.innerHTML = tbl(
          pageRows
            .map(
              (r) => `<tr aria-selected="${st.selected.has(r.id)}" class="${r.status === "disabled" ? "is-disabled" : ""}" data-row="${r.id}">
              <td class="tm-col-check" data-label=""><input class="tm-check" type="checkbox" data-select="${r.id}" ${st.selected.has(r.id) ? "checked" : ""} aria-label="Select ${esc(r.name)}"></td>
              ${dm.columns.map((c) => cell(r, c)).join("")}
              <td class="tm-col-actions" data-label=""><button class="tm-btn tm-btn--ghost tm-btn--icon tm-btn--sm" popovertarget="menu-${r.id}" aria-label="Actions for ${esc(r.name)}">${icon("dots")}</button>
                <div class="tm-menu" id="menu-${r.id}" popover role="menu" aria-label="Actions for ${esc(r.name)}">
                  <button class="tm-menu__item" role="menuitem" data-act="edit" data-id="${r.id}">${icon("edit", "tm-icon--sm")}Edit in form</button>
                  <button class="tm-menu__item" role="menuitem" data-act="rename" data-id="${r.id}">${icon("content", "tm-icon--sm")}Rename inline</button>
                  <hr class="tm-menu__sep">
                  <button class="tm-menu__item tm-menu__item--danger" role="menuitem" data-act="deactivate" data-id="${r.id}" ${r.status === "disabled" ? "disabled" : ""}>${icon("trash", "tm-icon--sm")}Deactivate…</button>
                </div></td></tr>`,
            )
            .join(""),
        );
        const onPage = pageRows.filter((r) => st.selected.has(r.id)).length;
        const all = $("#check-all");
        all.checked = onPage > 0 && onPage === pageRows.length;
        all.indeterminate = onPage > 0 && onPage < pageRows.length;
        wireMenus(wrap);
        const inl = $("#inline-input");
        if (inl) { inl.focus(); inl.select(); }
      }
      const from = rows.length ? (st.page - 1) * dm.pageSize + 1 : 0;
      const to = Math.min(st.page * dm.pageSize, rows.length);
      $("#pager").innerHTML = `<span class="tm-pagination__info">${from}–${to} of ${rows.length}${rows.length !== records.length ? ` (filtered from ${records.length})` : ""}</span>
        <nav class="tm-pagination" aria-label="Pagination">
          <button class="tm-pagination__page" data-page="${st.page - 1}" ${st.page === 1 ? "disabled" : ""} aria-label="Previous page">‹</button>
          ${Array.from({ length: pages }, (_, i) => `<button class="tm-pagination__page" data-page="${i + 1}" ${i + 1 === st.page ? 'aria-current="page"' : ""} aria-label="Page ${i + 1}">${i + 1}</button>`).join("")}
          <button class="tm-pagination__page" data-page="${st.page + 1}" ${st.page === pages ? "disabled" : ""} aria-label="Next page">›</button>
        </nav>`;
    }

    // Selection spans pages: the count is the whole selection; "Show selected
    // only" lists all of it, "Select all N matching" extends a full page.
    function renderBulk() {
      const n = st.selected.size;
      const bulk = $("#bulk");
      if (!n && st.onlySelected) st.onlySelected = false;
      bulk.hidden = n === 0;
      if (!n) return;
      const rows = st.mode === "live" ? filtered() : [];
      const pageRows = rows.slice((st.page - 1) * dm.pageSize, st.page * dm.pageSize);
      const onPage = pageRows.filter((r) => st.selected.has(r.id)).length;
      const unselected = rows.filter((r) => !st.selected.has(r.id)).length;
      const pageFull = pageRows.length > 0 && onPage === pageRows.length;
      bulk.innerHTML = `<span class="tm-badge tm-badge--count">${n}</span><span class="pg-bulk__label">selected</span>
        ${pageFull && unselected ? `<button class="tm-btn tm-btn--sm tm-btn--ghost" data-bulk="all">Select all ${rows.length} matching</button>` : ""}
        <button class="tm-btn tm-btn--sm tm-btn--outline" data-bulk="only" aria-pressed="${st.onlySelected}">${icon(st.onlySelected ? "x" : "filter", "tm-icon--sm")}${st.onlySelected ? "Show all rows" : "Show selected only"}</button>
        <button class="tm-btn tm-btn--sm tm-btn--outline" data-bulk="export">${icon("download", "tm-icon--sm")}${esc(dm.bulkActions[0])}</button>
        <button class="tm-btn tm-btn--sm tm-btn--outline" popovertarget="assign-menu">${esc(dm.bulkActions[1])}${icon("chevronDown", "tm-icon--sm")}</button>
        <div class="tm-menu" id="assign-menu" popover role="menu" aria-label="Assign team">
          ${dm.filters.team.filter((t) => t !== "all").map((t) => `<button class="tm-menu__item" role="menuitem" data-assign="${esc(t)}">${esc(t)}</button>`).join("")}
        </div>
        <button class="tm-btn tm-btn--sm tm-btn--danger-outline" data-bulk="deactivate">${icon("trash", "tm-icon--sm")}${esc(dm.bulkActions[2])}</button>
        <span class="tm-toolbar__spacer"></span>
        <button class="tm-btn tm-btn--sm tm-btn--ghost" data-bulk="clear">Clear selection</button>`;
      wireMenus(bulk);
    }

    function renderChips() {
      const chips = [];
      if (st.query) chips.push(["query", `Search: ${st.query}`]);
      if (st.status !== "all") chips.push(["status", `Status: ${st.status}`]);
      if (st.team !== "all") chips.push(["team", `Team: ${st.team}`]);
      if (st.onlySelected) chips.push(["only", "Selected only"]);
      const el = $("#chips");
      el.hidden = !chips.length;
      el.innerHTML = chips.length
        ? `<span class="tm-label">Filters</span>${chips.map(([k, l]) => `<span class="tm-chip">${esc(l)}<button class="tm-chip__remove" data-chip="${k}" aria-label="Remove filter ${esc(l)}">${icon("x", "tm-icon--sm")}</button></span>`).join("")}<button class="tm-btn tm-btn--ghost tm-btn--sm" data-chip="all">Clear all</button>`
        : "";
    }

    const render = () => {
      renderTable();
      renderBulk();
      renderChips();
    };

    function clearFilters() {
      st.query = "";
      st.status = "all";
      st.team = "all";
      st.onlySelected = false;
      $("#q").value = "";
      $("#f-status").value = "all";
      $("#f-team").value = "all";
      render();
    }
    function setMode(m) {
      st.mode = m;
      main.querySelectorAll('input[name="mode"]').forEach((i) => (i.checked = i.value === m));
      render();
    }

    async function deactivate(ids) {
      const names = records.filter((r) => ids.includes(r.id)).map((r) => r.name);
      const ok = await confirmDialog({
        title: cs.confirmation.title,
        body: `<p>${esc(cs.confirmation.body)}</p><ul class="pg-confirm-list">${names.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>`,
        confirm: cs.confirmation.confirm,
        cancel: cs.confirmation.cancel,
        danger: true,
      });
      if (!ok) return;
      records.forEach((r) => ids.includes(r.id) && (r.status = "disabled"));
      ids.forEach((id) => st.selected.delete(id));
      render();
      toast({ tone: "success", title: `${ids.length} account${ids.length > 1 ? "s" : ""} deactivated`, body: "Change applies to this demo session only." });
    }

    /* ---------- Editor form ------------------------------------------ */
    function renderEditor(rec) {
      const draft = rec ?? {
        id: "ACC-NEW",
        name: "Alex Draft",
        email: dm.validationSamples.invalidEmail,
        team: "Research",
        plan: cs.formExamples.select,
        status: "pending",
        limit: dm.validationSamples.invalidNumber,
        note: cs.formExamples.textarea,
      };
      st.editing = rec ? rec.id : null;
      $("#ed-mode").textContent = rec ? `Editing ${rec.id}` : "New draft";
      $("#editor").innerHTML = `
        <div class="tm-field"><label class="tm-field__label" for="e-id">Account ID <span class="tm-meta">read-only</span></label><input class="tm-input tm-input--mono" id="e-id" value="${esc(draft.id)}" readonly></div>
        <div class="tm-field"><label class="tm-field__label" for="e-name">Full name <span class="tm-req" aria-hidden="true">*</span></label><input class="tm-input" id="e-name" name="name" required value="${esc(draft.name)}" aria-describedby="e-name-err"><span class="tm-field__error" id="e-name-err" hidden></span></div>
        <div class="tm-field"><label class="tm-field__label" for="e-email">Email <span class="tm-req" aria-hidden="true">*</span></label><input class="tm-input" id="e-email" name="email" type="email" required value="${esc(draft.email)}" aria-describedby="e-email-hint e-email-err" autocomplete="off"><span class="tm-field__hint" id="e-email-hint">Use the example.test domain for demo accounts.</span><span class="tm-field__error" id="e-email-err" hidden></span></div>
        <div class="pg-2col">
          <div class="tm-field"><label class="tm-field__label" for="e-team">Team</label><select class="tm-select" id="e-team" name="team">${dm.filters.team.filter((t) => t !== "all").map((t) => `<option ${t === draft.team ? "selected" : ""}>${esc(t)}</option>`).join("")}</select></div>
          <div class="tm-field"><label class="tm-field__label" for="e-limit">Credit limit</label>
            ${stepperHTML({ id: "e-limit", name: "limit", value: draft.limit ?? 500, step: 50, unit: "USD", label: "credit limit", describedby: "e-limit-err" })}
            <span class="tm-field__error" id="e-limit-err" hidden></span></div>
        </div>
        <fieldset class="tm-field pg-plain-fieldset"><legend class="tm-field__label">Plan</legend>
          <div class="tm-segmented">${PLANS.map((p) => `<label class="tm-segmented__option"><input type="radio" name="plan" value="${p}" ${p === draft.plan ? "checked" : ""}>${p}</label>`).join("")}</div></fieldset>
        <div class="tm-field"><label class="tm-field__label" for="e-note">Internal note <span class="tm-meta" id="e-note-count"></span></label><textarea class="tm-textarea" id="e-note" name="note" rows="3" maxlength="120">${esc(draft.note ?? "")}</textarea></div>
        <label class="tm-choice"><input class="tm-switch" type="checkbox" role="switch" name="active" ${draft.status === "active" ? "checked" : ""}><span class="tm-choice__text"><span class="tm-choice__label">Active access</span><span class="tm-choice__desc">Disabled accounts keep their history.</span></span></label>
        <div class="pg-form-actions"><button class="tm-btn tm-btn--outline" type="button" id="e-reset">Reset</button><button class="tm-btn tm-btn--primary" type="submit">${icon("check")}${rec ? "Save changes" : "Create account"}</button></div>`;
      const note = $("#e-note");
      const count = () => ($("#e-note-count").textContent = `${note.value.length}/120`);
      note.addEventListener("input", count);
      count();
      $("#e-reset").addEventListener("click", () => renderEditor(rec));
      ["e-name", "e-email", "e-limit"].forEach((id) => $(`#${id}`).addEventListener("blur", validate));
      $("#e-limit").addEventListener("change", validate);
      wireSteppers($("#editor"));
      validate();
    }

    function validate() {
      const errs = {};
      const name = $("#e-name").value.trim();
      const email = $("#e-email").value.trim();
      const limit = $("#e-limit").value;
      if (!name) errs.name = "Name is required.";
      if (!EMAIL_RE.test(email)) errs.email = `“${email || "empty"}” is not a complete email address.`;
      if (limit === "" || Number(limit) < 0) errs.limit = `Limit must be zero or more (got ${limit || "empty"}).`;
      for (const k of ["name", "email", "limit"]) {
        const input = $(`#e-${k}`);
        const err = $(`#e-${k}-err`);
        input.setAttribute("aria-invalid", String(!!errs[k]));
        err.hidden = !errs[k];
        err.textContent = errs[k] || "";
        input.classList.toggle("is-valid", !errs[k] && k === "email");
      }
      return errs;
    }

    $("#editor").addEventListener("submit", (e) => {
      e.preventDefault();
      const errs = validate();
      if (Object.keys(errs).length) {
        $(`#e-${Object.keys(errs)[0]}`).focus();
        toast({ tone: "danger", title: "Fix highlighted fields", body: `${Object.keys(errs).length} field(s) need attention.`, timeout: 6000 });
        return;
      }
      const f = new FormData(e.target);
      const values = { name: f.get("name").trim(), email: f.get("email").trim(), team: f.get("team"), plan: f.get("plan"), note: f.get("note") || null, status: f.get("active") ? "active" : "paused" };
      if (st.editing) Object.assign(records.find((r) => r.id === st.editing), values);
      else records.unshift({ id: `ACC-${1001 + records.length}`, balance: 0, updated: data.meta.asOf, ...values });
      render();
      toast({ tone: "success", title: st.editing ? "Account updated" : "Account created", body: values.name });
    });

    /* ---------- Events ----------------------------------------------- */
    $("#q").addEventListener("input", (e) => { st.query = e.target.value; st.page = 1; render(); });
    $("#f-status").addEventListener("change", (e) => { st.status = e.target.value; st.page = 1; render(); });
    $("#f-team").addEventListener("change", (e) => { st.team = e.target.value; st.page = 1; render(); });
    main.querySelectorAll('input[name="density"]').forEach((i) => i.addEventListener("change", () => { st.density = i.value; renderTable(); }));
    main.querySelectorAll('input[name="mode"]').forEach((i) => i.addEventListener("change", () => setMode(i.value)));
    $("#new-account").addEventListener("click", () => { renderEditor(null); $("#e-name").focus(); });
    $("#export-all").addEventListener("click", () => toast({ tone: "info", title: "Export queued", body: `${filtered().length} rows matching current filters.` }));

    main.addEventListener("click", (e) => {
      const t = e.target;
      const sort = t.closest("[data-sort]");
      if (sort) {
        const k = sort.dataset.sort;
        st.sort = st.sort.key === k ? { key: k, dir: st.sort.dir === "asc" ? "desc" : "asc" } : { key: k, dir: "asc" };
        renderTable();
        $(`[data-sort="${k}"]`).focus();
        return;
      }
      const pg = t.closest("[data-page]");
      if (pg && !pg.disabled) { st.page = +pg.dataset.page; renderTable(); $("#pager [aria-current]")?.focus(); return; }
      const chip = t.closest("[data-chip]");
      if (chip) {
        const k = chip.dataset.chip;
        if (k === "all") return clearFilters();
        if (k === "query") { st.query = ""; $("#q").value = ""; }
        if (k === "status") { st.status = "all"; $("#f-status").value = "all"; }
        if (k === "team") { st.team = "all"; $("#f-team").value = "all"; }
        if (k === "only") st.onlySelected = false;
        render();
        $("#q").focus();
        return;
      }
      const inl = t.closest("[data-inline]");
      if (inl) { st.inline = inl.dataset.inline; renderTable(); return; }
      if (t.closest("[data-inline-cancel]")) { const id = st.inline; st.inline = null; renderTable(); $(`[data-inline="${id}"]`)?.focus(); return; }
      if (t.closest("[data-inline-save]")) return saveInline();
      const act = t.closest("[data-act]");
      if (act) {
        const id = act.dataset.id;
        if (act.dataset.act === "edit") { renderEditor(records.find((r) => r.id === id)); $("#e-name").focus(); }
        if (act.dataset.act === "rename") { st.inline = id; renderTable(); }
        if (act.dataset.act === "deactivate") deactivate([id]);
        return;
      }
      const bulk = t.closest("[data-bulk]");
      if (bulk) {
        const k = bulk.dataset.bulk;
        // The bar disappears; a keyboard user lands on the header checkbox (next
        // selection control), a mouse click leaves focus alone — no jump to search.
        if (k === "clear") { st.selected.clear(); st.onlySelected = false; render(); if (e.detail === 0) $("#check-all")?.focus(); }
        if (k === "only") { st.onlySelected = !st.onlySelected; st.page = 1; render(); $('[data-bulk="only"]').focus(); }
        if (k === "all") { filtered().forEach((r) => st.selected.add(r.id)); render(); $('[data-bulk="only"]').focus(); }
        if (k === "export") toast({ tone: "success", title: `${st.selected.size} accounts exported`, body: [...st.selected].join(", ") });
        if (k === "deactivate") deactivate([...st.selected]);
        return;
      }
      const assign = t.closest("[data-assign]");
      if (assign) {
        records.forEach((r) => st.selected.has(r.id) && (r.team = assign.dataset.assign));
        render();
        toast({ tone: "success", title: `Assigned to ${assign.dataset.assign}`, body: `${st.selected.size} accounts updated.` });
      }
    });
    main.addEventListener("change", (e) => {
      const t = e.target;
      if (t.id === "check-all") {
        const ids = [...main.querySelectorAll("[data-select]")].map((c) => c.dataset.select);
        ids.forEach((id) => (t.checked ? st.selected.add(id) : st.selected.delete(id)));
        render();
        $("#check-all")?.focus();
      } else if (t.dataset.select) {
        t.checked ? st.selected.add(t.dataset.select) : st.selected.delete(t.dataset.select);
        render();
        ($(`[data-select="${t.dataset.select}"]`) || $("#check-all"))?.focus();
      }
    });
    function saveInline() {
      const v = $("#inline-input").value.trim();
      const id = st.inline;
      if (!v) { $("#inline-input").setAttribute("aria-invalid", "true"); return; }
      records.find((r) => r.id === id).name = v;
      st.inline = null;
      renderTable();
      $(`[data-inline="${id}"]`)?.focus();
      toast({ tone: "success", title: "Name updated", body: v, timeout: 3000 });
    }
    main.addEventListener("keydown", (e) => {
      if (e.target.id !== "inline-input") return;
      if (e.key === "Enter") { e.preventDefault(); saveInline(); }
      if (e.key === "Escape") { e.preventDefault(); const id = st.inline; st.inline = null; renderTable(); $(`[data-inline="${id}"]`)?.focus(); }
    });

    render();
    renderEditor(null);
  },
};
