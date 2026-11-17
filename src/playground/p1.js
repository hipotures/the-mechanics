// P1 component behaviour for the Component Gallery: verification code,
// multi-select, command palette and non-modal sheet. Playground glue only;
// the look lives in the public components.css.
import { esc, icon, anchorPopover, followAnchor } from "./lib.js";

/* ---------- Verification code ------------------------------------------
   One input per character: typing advances, Backspace goes back, arrows
   move, a pasted code fills every cell. */
export function wireOtp(group, { onComplete } = {}) {
  const cells = [...group.querySelectorAll(".tm-otp__cell")];
  const value = () => cells.map((c) => c.value).join("");
  const done = () => { if (value().length === cells.length) onComplete?.(value()); };
  const fill = (from, text) => {
    const chars = text.replace(/\D/g, "").slice(0, cells.length - from).split("");
    chars.forEach((ch, k) => (cells[from + k].value = ch));
    cells[Math.min(cells.length - 1, from + chars.length)].focus();
    done();
  };
  cells.forEach((c, i) => {
    c.addEventListener("input", () => {
      const v = c.value.replace(/\D/g, "");
      if (v.length > 1) return fill(i, v); // autofill / IME
      c.value = v;
      if (v && i < cells.length - 1) cells[i + 1].focus();
      done();
    });
    c.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !c.value && i > 0) { e.preventDefault(); cells[i - 1].value = ""; cells[i - 1].focus(); }
      else if (e.key === "ArrowLeft" && i > 0) { e.preventDefault(); cells[i - 1].focus(); }
      else if (e.key === "ArrowRight" && i < cells.length - 1) { e.preventDefault(); cells[i + 1].focus(); }
    });
    c.addEventListener("focus", () => c.select());
    c.addEventListener("paste", (e) => { e.preventDefault(); fill(i, e.clipboardData.getData("text")); });
  });
  return { value, clear: () => cells.forEach((c) => (c.value = "")) };
}

/* ---------- Multi-select ------------------------------------------------
   Combobox pattern: focus stays in the filter input, the active option is
   aria-activedescendant. Enter/Space(click) toggles, Backspace in an empty
   input removes the last chip, Escape closes. */
let uid = 0;
export function wireMultiSelect(field, options, { selected = [], label = "Options", onChange } = {}) {
  const id = `ms${++uid}`;
  const chosen = new Set(selected);
  const input = field.querySelector(".tm-multiselect__input");
  const chipsEl = field.querySelector(".tm-multiselect__chips") || field;
  let list = null;
  let active = 0;
  let shown = [];

  input.setAttribute("role", "combobox");
  input.setAttribute("aria-expanded", "false");
  input.setAttribute("aria-controls", `${id}-list`);
  input.setAttribute("aria-autocomplete", "list");

  const renderChips = () => {
    field.querySelectorAll(".tm-chip").forEach((c) => c.remove());
    const html = options
      .filter((o) => chosen.has(o))
      .map((o) => `<span class="tm-chip">${esc(o)}<button type="button" class="tm-chip__remove" data-remove="${esc(o)}" aria-label="Remove ${esc(o)}" tabindex="-1">${icon("x", "tm-icon--sm")}</button></span>`)
      .join("");
    input.insertAdjacentHTML("beforebegin", html);
    input.placeholder = chosen.size ? "" : input.dataset.placeholder || "";
  };
  const renderList = () => {
    if (!list) return;
    const q = input.value.trim().toLowerCase();
    shown = options.filter((o) => o.toLowerCase().includes(q));
    active = Math.min(active, Math.max(0, shown.length - 1));
    list.querySelector(".tm-listbox__items").innerHTML = shown.length
      ? shown
          .map(
            (o, i) => `<div class="tm-menu__item tm-listbox__option" role="option" id="${id}-o${i}" data-opt="${esc(o)}" aria-selected="${chosen.has(o)}"><span class="tm-listbox__box" aria-hidden="true">${icon("check")}</span>${esc(o)}</div>`,
          )
          .join("")
      : `<div class="tm-listbox__empty">No match for “${esc(input.value)}”</div>`;
    list.querySelector(".tm-listbox__count").textContent = `${chosen.size} of ${options.length} selected`;
    setActive(active);
  };
  const setActive = (i) => {
    active = i;
    list.querySelectorAll('[role="option"]').forEach((o, j) => o.classList.toggle("is-focus", j === i));
    const el = list.querySelector(`#${id}-o${i}`);
    if (el) { input.setAttribute("aria-activedescendant", el.id); el.scrollIntoView({ block: "nearest" }); }
    else input.removeAttribute("aria-activedescendant");
  };
  const toggle = (o) => {
    chosen.has(o) ? chosen.delete(o) : chosen.add(o);
    renderChips();
    renderList();
    onChange?.([...chosen]);
  };
  let unfollow = null;
  const close = () => {
    if (!list) return;
    unfollow?.();
    unfollow = null;
    list.remove();
    list = null;
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
  };
  const open = () => {
    if (list) return;
    list = document.createElement("div");
    list.className = "tm-menu tm-listbox";
    list.id = `${id}-list`;
    list.setAttribute("popover", "manual");
    list.innerHTML = `<div class="tm-listbox__items" role="listbox" aria-multiselectable="true" aria-label="${esc(label)}"></div>
      <div class="tm-listbox__foot"><span class="tm-listbox__count"></span><button type="button" class="tm-btn tm-btn--ghost tm-btn--sm" data-clear tabindex="-1">Clear</button></div>`;
    document.body.append(list);
    list.showPopover();
    list.style.minWidth = `${field.offsetWidth}px`;
    // Pointer: mousedown would blur the input; keep focus in the field.
    list.addEventListener("mousedown", (e) => e.preventDefault());
    list.addEventListener("click", (e) => {
      const opt = e.target.closest("[data-opt]");
      if (opt) toggle(opt.dataset.opt);
      if (e.target.closest("[data-clear]")) { chosen.clear(); renderChips(); renderList(); onChange?.([]); }
      anchorPopover(list, field);
    });
    input.setAttribute("aria-expanded", "true");
    renderList();
    anchorPopover(list, field);
    unfollow = followAnchor(list, field, close);
  };

  field.addEventListener("mousedown", (e) => {
    const rm = e.target.closest("[data-remove]");
    if (rm) { e.preventDefault(); toggle(rm.dataset.remove); input.focus(); return; }
    if (e.target !== input) { e.preventDefault(); input.focus(); }
    list ? null : open();
  });
  input.addEventListener("input", () => { open(); active = 0; renderList(); anchorPopover(list, field); });
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); if (!list) return open(); setActive(Math.min(shown.length - 1, active + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); if (list) setActive(Math.max(0, active - 1)); }
    else if (e.key === "Home" && list && !input.value) { e.preventDefault(); setActive(0); }
    else if (e.key === "End" && list && !input.value) { e.preventDefault(); setActive(shown.length - 1); }
    else if (e.key === "Enter") { e.preventDefault(); if (!list) return open(); if (shown[active]) toggle(shown[active]); }
    else if (e.key === "Escape") { if (list) { e.preventDefault(); close(); } }
    else if (e.key === "Backspace" && !input.value && chosen.size) {
      const last = options.filter((o) => chosen.has(o)).at(-1);
      toggle(last);
    }
  });
  input.addEventListener("blur", () => setTimeout(() => { if (document.activeElement !== input) close(); }));
  renderChips();
  return { value: () => [...chosen], close };
}

/* ---------- Command palette ---------------------------------------------
   commands: [{ group, label, icon, hint, run }]. Opens on Ctrl/Cmd+K while
   `scope` is connected to the document. */
export function createPalette(commands, { scope } = {}) {
  const dlg = document.createElement("dialog");
  dlg.className = "tm-palette";
  dlg.setAttribute("aria-label", "Command palette");
  dlg.innerHTML = `<div class="tm-palette__search">${icon("search")}<input class="tm-palette__input" role="combobox" aria-expanded="true" aria-controls="pal-list" aria-autocomplete="list" aria-label="Search commands" placeholder="Type a command or page…" autocomplete="off" spellcheck="false"><kbd class="tm-kbd">Esc</kbd></div>
    <div class="tm-palette__list" id="pal-list" role="listbox" aria-label="Commands"></div>
    <div class="tm-palette__foot"><span><kbd class="tm-kbd">↑</kbd> <kbd class="tm-kbd">↓</kbd> move</span><span><kbd class="tm-kbd">Enter</kbd> run</span><span><kbd class="tm-kbd">Esc</kbd> close</span></div>`;
  document.body.append(dlg);
  const input = dlg.querySelector("input");
  const listEl = dlg.querySelector(".tm-palette__list");
  let shown = [];
  let active = 0;

  const mark = (text, q) => {
    if (!q) return esc(text);
    const i = text.toLowerCase().indexOf(q);
    return i < 0 ? esc(text) : `${esc(text.slice(0, i))}<mark>${esc(text.slice(i, i + q.length))}</mark>${esc(text.slice(i + q.length))}`;
  };
  const render = () => {
    const q = input.value.trim().toLowerCase();
    shown = commands.filter((c) => !q || c.label.toLowerCase().includes(q) || c.group.toLowerCase().includes(q));
    active = Math.min(active, Math.max(0, shown.length - 1));
    if (!shown.length) { listEl.innerHTML = `<div class="tm-palette__empty">No command matches “${esc(input.value)}”.</div>`; input.removeAttribute("aria-activedescendant"); return; }
    let html = "";
    let group = null;
    shown.forEach((c, i) => {
      if (c.group !== group) {
        if (group !== null) html += "</div>";
        group = c.group;
        html += `<div role="group" aria-labelledby="pal-g${i}"><div class="tm-palette__group tm-label" id="pal-g${i}">${esc(group)}</div>`;
      }
      html += `<div class="tm-palette__item" role="option" id="pal-o${i}" data-i="${i}" aria-selected="${i === active}">${icon(c.icon || "chevronRight", "tm-icon--sm")}<span>${mark(c.label, q)}</span>${c.hint ? `<span class="tm-palette__hint">${esc(c.hint)}</span>` : ""}</div>`;
    });
    listEl.innerHTML = `${html}</div>`;
    input.setAttribute("aria-activedescendant", `pal-o${active}`);
  };
  const setActive = (i) => {
    active = i;
    listEl.querySelectorAll('[role="option"]').forEach((o) => o.setAttribute("aria-selected", String(+o.dataset.i === i)));
    input.setAttribute("aria-activedescendant", `pal-o${i}`);
    listEl.querySelector(`#pal-o${i}`)?.scrollIntoView({ block: "nearest" });
  };
  const run = (i) => {
    const c = shown[i];
    if (!c) return;
    dlg.close();
    c.run();
  };
  input.addEventListener("input", () => { active = 0; render(); });
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((active + 1) % Math.max(1, shown.length)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((active - 1 + shown.length) % Math.max(1, shown.length)); }
    else if (e.key === "Enter") { e.preventDefault(); run(active); }
  });
  listEl.addEventListener("mousedown", (e) => e.preventDefault());
  listEl.addEventListener("click", (e) => { const o = e.target.closest("[data-i]"); if (o) run(+o.dataset.i); });
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });

  const open = () => {
    if (dlg.open) return;
    input.value = "";
    active = 0;
    render();
    dlg.showModal();
    input.focus();
  };
  const onKey = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      if (scope && !scope.isConnected) return;
      e.preventDefault();
      dlg.open ? dlg.close() : open();
    }
  };
  document.addEventListener("keydown", onKey);
  return { open, destroy: () => { document.removeEventListener("keydown", onKey); dlg.remove(); } };
}

/* ---------- Non-modal sheet ----------------------------------------------
   popover="manual": no backdrop, no focus trap, the page stays usable.
   Escape closes it while focus is inside; focus returns to the trigger. */
export function wireSheet(sheet, trigger) {
  const close = () => {
    sheet.hidePopover();
    trigger.setAttribute("aria-expanded", "false");
    if (sheet.contains(document.activeElement)) trigger.focus();
  };
  trigger.setAttribute("aria-expanded", "false");
  trigger.setAttribute("aria-controls", sheet.id);
  trigger.addEventListener("click", () => {
    if (sheet.matches(":popover-open")) return close();
    sheet.showPopover();
    trigger.setAttribute("aria-expanded", "true");
    sheet.querySelector("[data-autofocus]")?.focus();
  });
  sheet.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) close(); });
  sheet.addEventListener("keydown", (e) => { if (e.key === "Escape") { e.preventDefault(); close(); } });
  return { close };
}
