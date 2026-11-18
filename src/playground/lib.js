// Shared playground helpers: escaping, deterministic formatting, icons,
// toasts, menus and dialogs. No framework — plain DOM + native elements.

// Behaviors (select fallback, picker, popups, tooltips, toasts, dialogs,
// validation …) live in the distributed library and are re-exported here.
export { trackInputModality, dismissibleAlert, toast, anchorPopover, followAnchor, wireMenus, confirmDialog, wireSteppers, enhanceSelects, enhanceDateTime, enhanceClearable, enhanceTips, setFieldError, validateInline } from "../the-mechanics/the-mechanics.js";
import { trackInputModality, dismissibleAlert, toast, anchorPopover, followAnchor, wireMenus, confirmDialog, wireSteppers, enhanceSelects, enhanceDateTime, enhanceClearable, enhanceTips, setFieldError, validateInline } from "../the-mechanics/the-mechanics.js";

export const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/* ---------- Deterministic formatting (fixed locale + UTC) ------------- */
const LOCALE = "en-US";
export const fmtInt = (n) => (n == null ? "—" : new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 }).format(n));
export const fmtNum = (n, d = 1) =>
  n == null ? "—" : new Intl.NumberFormat(LOCALE, { minimumFractionDigits: 0, maximumFractionDigits: d }).format(n);
export const fmtMoney = (n, currency = "USD", d = 2) =>
  n == null
    ? "—"
    : new Intl.NumberFormat(LOCALE, { style: "currency", currency, minimumFractionDigits: d, maximumFractionDigits: Math.max(d, 2) })
        .format(n)
        .replace("-", "−");
export const fmtSigned = (n, d = 1, suffix = "%") =>
  n == null ? "n/a" : `${n > 0 ? "+" : n < 0 ? "−" : "±"}${fmtNum(Math.abs(n), d)}${suffix}`;
export const fmtDate = (iso) =>
  new Intl.DateTimeFormat(LOCALE, { year: "numeric", month: "short", day: "2-digit", timeZone: "UTC" }).format(new Date(iso));
export const fmtDateTime = (iso) =>
  new Intl.DateTimeFormat(LOCALE, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(new Date(iso)) + " UTC";
export const fmtCompact = (n) =>
  Math.abs(n) >= 1000 ? new Intl.NumberFormat(LOCALE, { notation: "compact", maximumFractionDigits: 1 }).format(n) : fmtNum(n, 2);

/* ---------- Icons (original 16px stroke set) ------------------------- */
const P = {
  analytics: "M2 14V9M6 14V4M10 14V7M14 14V2M1 14.5h14",
  workspace: "M1.5 2.5h13v11h-13zM6 2.5v11M10.5 2.5v11",
  data: "M1.5 2.5h13v11h-13zM1.5 6h13M1.5 9.5h13M5.5 6v7.5",
  catalog: "M3 5h10l-1 9H4zM5.5 5V3.5a2.5 2.5 0 0 1 5 0V5",
  content: "M3 1.5h7l3 3v10H3zM10 1.5v3h3M5.5 7.5h5M5.5 10h5M5.5 12.5h3",
  components: "M1.5 1.5h5v5h-5zM9.5 1.5h5v5h-5zM1.5 9.5h5v5h-5zM9.5 9.5h5v5h-5z",
  menu: "M2 4h12M2 8h12M2 12h12",
  collapse: "M10 3L5 8l5 5M2.5 2v12",
  expand: "M6 3l5 5-5 5M13.5 2v12",
  search: "M7 12A5 5 0 1 0 7 2a5 5 0 0 0 0 10zM10.5 10.5L14 14",
  check: "M3 8.5l3 3 7-7",
  x: "M3.5 3.5l9 9M12.5 3.5l-9 9",
  plus: "M8 2.5v11M2.5 8h11",
  minus: "M2.5 8h11",
  dots: "M3 8h.01M8 8h.01M13 8h.01",
  chevronDown: "M3.5 6l4.5 4.5L12.5 6",
  chevronRight: "M6 3.5l4.5 4.5L6 12.5",
  chevronLeft: "M10 3.5L5.5 8l4.5 4.5",
  download: "M8 2v8.5M4.5 7L8 10.5 11.5 7M2.5 13.5h11",
  refresh: "M13 3v3.5H9.5M12.6 6.5A5 5 0 1 0 13 9",
  filter: "M2 3h12L9.5 8.5V13l-3 1.5v-6z",
  alert: "M8 1.5l6.5 12h-13zM8 6v3.5M8 11.5v.01",
  info: "M8 14.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM8 7v4.5M8 4.5v.01",
  success: "M8 14.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM5 8l2 2 4-4",
  danger: "M8 14.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM5.5 5.5l5 5M10.5 5.5l-5 5",
  cart: "M1 2h2l1.5 8h8L14 4.5H4M5.5 13.5h.01M11.5 13.5h.01",
  edit: "M10.5 2.5l3 3L6 13H3v-3zM9 4l3 3",
  trash: "M2.5 4h11M6 4V2.5h4V4M4 4l.7 9.5h6.6L12 4",
  sun: "M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3 3l1 1M12 12l1 1M3 13l1-1M12 4l1-1",
  moon: "M13.5 9.5A6 6 0 0 1 6.5 2.5a6 6 0 1 0 7 7z",
  cup: "M2.5 5.5h9v4a4 4 0 0 1-4 4h-1a4 4 0 0 1-4-4zM11.5 6.5h1.5a1.5 1.5 0 0 1 0 3h-1.5M5 1.5v2M8 1.5v2",
  external: "M9 2.5h4.5V7M13.5 2.5L7 9M11.5 9.5v4h-9v-9h4",
  split: "M1.5 2.5h13v11h-13zM8 2.5v11",
  maximize: "M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4",
  play: "M4.5 2.5l9 5.5-9 5.5z",
  upload: "M8 10.5V2M4.5 5.5L8 2l3.5 3.5M2.5 13.5h11",
  user: "M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2.5 14.5a5.5 5.5 0 0 1 11 0",
  calendar: "M2 3.5h12v10H2zM2 6.5h12M5 2v3M11 2v3",
  clock: "M8 14.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM8 4.5V8l2.5 1.5",
  copy: "M5.5 5.5h8v8h-8zM10.5 5.5v-3h-8v8h3",
  arrowUp: "M8 13V3M4 7l4-4 4 4",
  arrowDown: "M8 3v10M4 9l4 4 4-4",
  image: "M1.5 2.5h13v11h-13zM1.5 11l4-4 3 3 2-2 4 4M10.5 6h.01",
  bolt: "M9 1.5L3 9h4.5L7 14.5 13 7H8.5z",
  stack: "M8 1.5l6.5 3.5L8 8.5 1.5 5zM1.5 8L8 11.5 14.5 8M1.5 11L8 14.5 14.5 11",
  globe: "M8 14.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM1.5 8h13M8 1.5c2 2 2.5 4.5 2.5 6.5S10 12.5 8 14.5C6 12.5 5.5 10 5.5 8S6 3.5 8 1.5z",
};
export const icon = (name, cls = "") =>
  `<svg class="tm-icon ${cls}" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="${P[name] || P.dots}"/></svg>`;

/* ---------- Status vocabulary ---------------------------------------- */
export const STATUS = {
  active: { tone: "success", label: "Active" },
  complete: { tone: "success", label: "Complete" },
  success: { tone: "success", label: "Success" },
  "in-stock": { tone: "success", label: "In stock" },
  pending: { tone: "pending", label: "Pending" },
  review: { tone: "pending", label: "In review" },
  preorder: { tone: "info", label: "Preorder" },
  info: { tone: "info", label: "Info" },
  paused: { tone: "neutral", label: "Paused" },
  neutral: { tone: "neutral", label: "Neutral" },
  warning: { tone: "warning", label: "Warning" },
  limited: { tone: "warning", label: "Limited" },
  overdue: { tone: "danger", label: "Overdue" },
  error: { tone: "danger", label: "Error" },
  danger: { tone: "danger", label: "Danger" },
  "out-of-stock": { tone: "danger", label: "Out of stock" },
  disabled: { tone: "disabled", label: "Disabled" },
  offline: { tone: "offline", label: "Offline" },
};
export const badge = (status, label) => {
  const s = STATUS[status] || { tone: "neutral", label: status };
  return `<span class="tm-badge tm-badge--${s.tone}">${esc(label ?? s.label)}</span>`;
};

/* Status plate for standalone statuses (page/panel heads, KPI tiles, image
   overlays). Small .tm-badge stays for statuses inside rows and lists. */
const MARK_STATE = { success: "complete", complete: "complete", warning: "warning", danger: "error", error: "error", info: "info", pending: "pending", review: "review", active: "active" };
export function status(tone, label, { sm = true, mark = true } = {}) {
  const st = MARK_STATE[tone];
  return `<span class="tm-status${sm ? " tm-status--sm" : ""}">${mark && st ? `<span class="tm-mark" data-state="${st}" aria-hidden="true"></span>` : ""}${esc(label)}</span>`;
}



export function rangeFill(input) {
  const pct = ((input.value - (input.min || 0)) / ((input.max || 100) - (input.min || 0))) * 100;
  input.style.setProperty("--tm-range-pct", `${pct}%`);
}

// Roving focus for a vertical list of buttons (ArrowUp/Down/Home/End).
export function rovingList(container, selector) {
  container.addEventListener("keydown", (e) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
    const items = [...container.querySelectorAll(selector)];
    const i = items.indexOf(document.activeElement);
    if (i < 0) return;
    e.preventDefault();
    const n = e.key === "ArrowDown" ? i + 1 : e.key === "ArrowUp" ? i - 1 : e.key === "Home" ? 0 : items.length - 1;
    items[Math.max(0, Math.min(items.length - 1, n))].focus();
  });
}

export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Balanced panel grid: choose the column count from the available width
// (min column width = minPx), then reduce it so rows fill evenly — e.g. six
// panels that would fit five-per-row become 3 + 3 instead of 5 + 1 orphan.
// Full-width items (.pg-span-full) take their own row; span-2 items count twice.
// If the count still cannot divide evenly, the last item stretches over the gap.
export function balanceGrid(grid, minPx = 304) {
  const apply = () => {
    const width = grid.clientWidth;
    if (!width) return;
    const max = Math.max(1, Math.floor(width / minPx));
    let units = 0;
    let widest = 1;
    let last = null;
    grid.querySelectorAll(":scope > *").forEach((el) => el.style.removeProperty("grid-column"));
    grid.querySelectorAll(":scope > :not([hidden])").forEach((el) => {
      if (el.classList.contains("pg-span-full")) return;
      last = el;
      const cs = getComputedStyle(el);
      const span = /span 2/.test(`${cs.gridColumnStart} ${cs.gridColumnEnd}`) ? 2 : 1;
      units += span;
      widest = Math.max(widest, span);
    });
    if (!units) return;
    const rows = Math.ceil(units / max);
    const cols = Math.min(max, Math.max(widest, Math.ceil(units / rows)));
    grid.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
    // Still uneven (e.g. 3 panels in 2 columns)? Stretch the last panel over
    // the empty cells instead of leaving a hole.
    const gap = Math.ceil(units / cols) * cols - units;
    if (gap > 0 && last) last.style.gridColumn = `span ${Math.min(cols, gap + 1)}`;
  };
  const ro = new ResizeObserver(apply);
  ro.observe(grid);
  apply();
  return { apply, destroy: () => ro.disconnect() };
}


// Markup for .tm-stepper (keeps every usage identical).
export function stepperHTML({ id, name = "", value = "", min, max, step = 1, unit = "", label = "value", invalid = false, disabled = false, size = "", describedby = "" }) {
  const a = (k, v) => (v === undefined || v === "" || v === false ? "" : ` ${k}="${esc(v)}"`);
  return `<div class="tm-stepper${size ? ` tm-stepper--${size}` : ""}">
    <button type="button" class="tm-stepper__btn" data-tm-step="-1" aria-label="Decrease ${esc(label)}"${disabled ? " disabled" : ""}>${icon("minus", "tm-icon--sm")}</button>
    ${unit ? `<span class="tm-affix">${esc(unit)}</span>` : ""}<input class="tm-input" type="number" inputmode="decimal"${a("id", id)}${a("name", name)}${a("value", value)}${a("min", min)}${a("max", max)}${a("step", step)}${invalid ? ' aria-invalid="true"' : ""}${a("aria-describedby", describedby)}${disabled ? " disabled" : ""}>
    <button type="button" class="tm-stepper__btn" data-tm-step="1" aria-label="Increase ${esc(label)}"${disabled ? " disabled" : ""}>${icon("plus", "tm-icon--sm")}</button>
  </div>`;
}
