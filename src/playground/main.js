import "./app.css";
import data from "../../fixtures/demo-data.json";
import { icon, esc, enhanceSelects, enhanceDateTime } from "./lib.js";
import analytics from "./pages/analytics.js";
import workspace from "./pages/workspace.js";
import dataManagement from "./pages/data.js";
import catalog from "./pages/catalog.js";
import content from "./pages/content.js";
import gallery from "./pages/gallery.js";

const PAGES = [
  { id: "analytics", label: "Analytics", icon: "analytics", page: analytics, group: "apps" },
  { id: "workspace", label: "Workspace", icon: "workspace", page: workspace, group: "apps" },
  { id: "data", label: "Data Management", icon: "data", page: dataManagement, group: "apps" },
  { id: "catalog", label: "Catalog", icon: "catalog", page: catalog, group: "apps" },
  { id: "content", label: "Content Site", icon: "content", page: content, group: "apps" },
  { id: "components", label: "Component Gallery", icon: "components", page: gallery, group: "system" },
];
const THEMES = [
  { id: "light", label: "Light", icon: "sun", desc: "Paper-Stone" },
  { id: "dark", label: "Dark", icon: "moon", desc: "Graphite" },
  { id: "coffee", label: "Coffee", icon: "cup", desc: "Espresso-Mocha" },
];

const root = document.documentElement;
const app = document.getElementById("app");

function currentTheme() {
  return root.getAttribute("data-tm-theme") || "light";
}
function setTheme(id) {
  if (!THEMES.some((t) => t.id === id)) return;
  root.classList.add("tm-theme-switching");
  root.setAttribute("data-tm-theme", id);
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove("tm-theme-switching")));
  try { localStorage.setItem("tm-theme", id); } catch {}
  const url = new URL(location.href);
  url.searchParams.set("theme", id);
  history.replaceState(null, "", url);
  document.querySelectorAll('input[name="tm-theme"]').forEach((i) => (i.checked = i.value === id));
}

function navItem(p) {
  return `<li><a class="tm-nav__item" href="#/${p.id}" data-nav="${p.id}" title="${esc(p.label)}">${icon(p.icon)}<span class="tm-nav__label">${esc(p.label)}</span></a></li>`;
}

app.innerHTML = `
<a class="pg-skip tm-btn tm-btn--primary" href="#main">Skip to content</a>
<div class="tm-shell" data-sidebar="expanded" id="shell">
  <header class="tm-topbar">
    <button class="tm-btn tm-btn--ghost tm-btn--icon pg-collapse" id="sidebar-toggle" aria-controls="sidebar" aria-expanded="true" aria-label="Collapse navigation">${icon("collapse")}</button>
    <a class="tm-brand" href="#/analytics"><span class="tm-brand__mark" aria-hidden="true">TM</span><span class="pg-brand-text">The Mechanics</span></a>
    <span class="tm-badge tm-badge--plain pg-hide-md" title="Fixture as-of time">fixture ${esc(data.meta.version)} · ${esc(data.meta.asOf.replace("T", " ").replace(":00Z", " UTC"))}</span>
    <span class="tm-toolbar__spacer"></span>
    <fieldset class="tm-segmented tm-segmented--sm" id="theme-switcher" aria-label="Theme" data-testid="theme-switcher">
      <legend class="tm-sr-only">Theme</legend>
      ${THEMES.map(
        (t) => `<label class="tm-segmented__option" title="${t.label} / ${t.desc}"><input type="radio" name="tm-theme" value="${t.id}" data-theme-option="${t.id}" ${
          t.id === currentTheme() ? "checked" : ""
        }>${icon(t.icon, "tm-icon--sm")}<span>${t.label}</span></label>`,
      ).join("")}
    </fieldset>
  </header>
  <nav class="tm-sidebar" id="sidebar" aria-label="Destinations"><div class="tm-sidebar__inner">
    <div class="tm-nav__section tm-label">Example apps</div>
    <ul class="tm-nav">${PAGES.filter((p) => p.group === "apps").map(navItem).join("")}</ul>
    <div class="tm-nav__section tm-label">System</div>
    <ul class="tm-nav">${PAGES.filter((p) => p.group === "system").map(navItem).join("")}</ul>
    <div class="pg-sidebar-foot" data-tm-desktop-only>
      <p class="tm-meta pg-sidebar-note">Synthetic fixtures only. Themes change color, never geometry.</p>
    </div>
  </div></nav>
  <main class="tm-main" id="main" tabindex="-1"></main>
</div>
<div class="tm-toast-region" aria-live="polite" aria-relevant="additions"></div>`;

const shell = document.getElementById("shell");
let main = document.getElementById("main");

document.getElementById("theme-switcher").addEventListener("change", (e) => setTheme(e.target.value));
document.getElementById("sidebar-toggle").addEventListener("click", (e) => {
  const collapsed = shell.dataset.sidebar !== "collapsed";
  shell.dataset.sidebar = collapsed ? "collapsed" : "expanded";
  e.currentTarget.setAttribute("aria-expanded", String(!collapsed));
  e.currentTarget.setAttribute("aria-label", collapsed ? "Expand navigation" : "Collapse navigation");
  e.currentTarget.innerHTML = icon(collapsed ? "expand" : "collapse");
  try { localStorage.setItem("tm-sidebar", shell.dataset.sidebar); } catch {}
});
try {
  if (localStorage.getItem("tm-sidebar") === "collapsed") document.getElementById("sidebar-toggle").click();
} catch {}

let cleanup = null;
let currentId = null;
function route() {
  const id = (location.hash.match(/^#\/([\w-]+)/) || [])[1] || "analytics";
  const entry = PAGES.find((p) => p.id === id) || PAGES[0];
  if (entry.id === currentId) return;
  const first = currentId === null;
  currentId = entry.id;
  cleanup?.();
  // Fresh element per route: drops every listener the previous page attached.
  const fresh = main.cloneNode(false);
  main.replaceWith(fresh);
  main = fresh;
  main.dataset.route = entry.id;
  document.title = `${entry.label} — The Mechanics`;
  document.querySelectorAll("[data-nav]").forEach((a) => {
    if (a.dataset.nav === entry.id) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  cleanup = entry.page.render(main, data) || null;
  enhanceDateTime(main);
  window.scrollTo(0, 0);
  if (!first) main.focus({ preventScroll: true });
}
window.addEventListener("hashchange", route);
document.querySelector(".pg-skip").addEventListener("click", (e) => {
  e.preventDefault();
  main.focus();
});
// Escape dismisses any hovered/focused tooltip without moving focus (WCAG 1.4.13).
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  document.querySelectorAll(".tm-tip").forEach((t) => t.matches(":hover, :focus-within") && t.classList.add("is-dismissed"));
});
document.addEventListener("focusout", (e) => e.target.closest?.(".tm-tip")?.classList.remove("is-dismissed"));
document.addEventListener("pointerover", (e) => {
  if (!e.target.closest?.(".tm-tip")) document.querySelectorAll(".tm-tip.is-dismissed").forEach((t) => t.classList.remove("is-dismissed"));
});

setTheme(currentTheme());
route();
enhanceSelects(document);
