import { esc, icon, fmtInt, fmtNum, fmtMoney, fmtSigned, fmtDateTime, badge, toast, wait, balanceGrid } from "../lib.js";
import { mountChart, legendItems, sparkline, isTimeSeries } from "../charts.js";
import { KPI_META, SERVICE_TAGS, ANALYTICS_REGIONS, STALE_CHART } from "../derived.js";

const WIDE = new Set(["worker-util"]);
const FULL = new Set(["incident-log"]);

function kpiTile(k, charts) {
  const meta = KPI_META[k.id] || { good: "neutral" };
  let value;
  if (k.unit === "USD") value = fmtMoney(k.value);
  else if (k.denominator != null) value = `${fmtInt(k.value)}<span class="tm-kpi__unit">/ ${fmtInt(k.denominator)}</span>`;
  else value = `${k.value % 1 ? fmtNum(k.value, 2) : fmtInt(k.value)}${k.unit ? `<span class="tm-kpi__unit">${esc(k.unit)}</span>` : ""}`;
  let trend;
  if (k.deltaPercent == null) {
    trend = `<span class="tm-trend" title="No comparison data">— n/a</span>`;
  } else {
    const dir = k.deltaPercent > 0 ? "up" : k.deltaPercent < 0 ? "down" : "flat";
    const tone = meta.good === "neutral" || dir === "flat" ? "" : dir === meta.good ? "tm-trend--good" : "tm-trend--bad";
    const verdict = tone === "tm-trend--good" ? "improving" : tone === "tm-trend--bad" ? "worsening" : "change";
    trend = `<span class="tm-trend ${tone}" title="${verdict} vs previous period">${icon(dir === "down" ? "arrowDown" : "arrowUp", "tm-icon--sm")}${fmtSigned(k.deltaPercent)}<span class="tm-sr-only"> (${verdict})</span></span>`;
  }
  const spark = meta.spark ? sparkline(meta.spark(charts), { tone: k.id === "errors" ? "tm-series-6" : "tm-series-1" }) : "";
  const extra = k.id === "workers" ? badge("warning", `${k.denominator - k.value} offline`) : "";
  return `<div class="tm-kpi" data-kpi="${esc(k.id)}">
    <div class="tm-kpi__label">${esc(k.label)}</div>
    <div class="tm-kpi__value">${value}</div>
    <div class="tm-kpi__foot">${trend}${extra || spark}</div>
  </div>`;
}

function incidentTable(c) {
  return `<div class="tm-table-wrap tm-table-wrap--flush"><table class="tm-table tm-table--stack">
    <thead><tr><th scope="col">Time (UTC)</th><th scope="col">Type</th><th scope="col">Event</th><th scope="col">Service</th><th scope="col" class="tm-col-num">Duration</th></tr></thead>
    <tbody>${c.series
      .map(
        (r) => `<tr>
        <td class="tm-num" data-label="Time">${esc(fmtDateTime(r.at).replace(" UTC", ""))}</td>
        <td data-label="Type">${badge(r.type, { warning: "Warning", error: "Error", success: "Resolved", info: "Info" }[r.type])}</td>
        <td class="tm-cell-primary" data-label="Event"><span class="tm-table__primary">${esc(r.name)}</span></td>
        <td data-label="Service">${esc(r.service)}</td>
        <td class="tm-num" data-label="Duration">${r.duration === "—" ? '<span class="tm-muted" title="Not applicable">—</span>' : esc(r.duration)}</td>
      </tr>`,
      )
      .join("")}</tbody></table></div>`;
}

function panel(c, staleMin) {
  const legend = legendItems(c);
  const stale = c.id === STALE_CHART;
  return `<article class="tm-panel ${WIDE.has(c.id) ? "pg-span-2" : ""} ${FULL.has(c.id) ? "pg-span-full" : ""}" data-panel="${esc(c.id)}" aria-labelledby="p-${esc(c.id)}">
    <header class="tm-panel__head">
      <h3 class="tm-panel__title" id="p-${esc(c.id)}">${esc(c.title)}</h3>
      ${stale ? badge("warning", `Delayed ${staleMin} min`) : `<span class="tm-panel__meta">${esc(c.unit)}</span>`}
    </header>
    <div class="tm-panel__body ${c.kind === "table" ? "tm-panel__body--flush" : ""}" data-body>
      ${
        legend.length
          ? `<ul class="tm-legend pg-legend" aria-label="Series">${legend
              .map(
                (l) => `<li><button class="tm-legend__item" type="button" aria-pressed="true" data-series="${esc(l.name)}">
                  <span class="tm-legend__swatch ${l.cls} ${l.line ? `tm-legend__swatch--line ${l.dash}` : ""}"></span>${esc(l.name)}</button></li>`,
              )
              .join("")}${
              c.threshold != null || c.capacity != null
                ? `<li><span class="tm-legend__item"><span class="tm-legend__swatch tm-legend__swatch--rule" style="--_series:var(--tm-chart-threshold)"></span>${c.threshold != null ? "Threshold" : "Capacity"}</span></li>`
                : ""
            }</ul>`
          : c.target != null
            ? `<ul class="tm-legend pg-legend"><li><span class="tm-legend__item"><span class="tm-legend__swatch tm-series-1"></span>${esc(c.series[0].name)}</span></li><li><span class="tm-legend__item"><span class="tm-legend__swatch tm-legend__swatch--rule" style="--_series:var(--tm-chart-target)"></span>Target</span></li></ul>`
            : ""
      }
      ${c.kind === "table" ? incidentTable(c) : `<div class="tm-chart" data-chart="${esc(c.id)}"></div>`}
    </div>
  </article>`;
}

function statePanel({ id, title, tone, stateTitle, message, action }) {
  return `<article class="tm-panel" data-panel="${id}" aria-labelledby="p-${id}">
    <header class="tm-panel__head"><h3 class="tm-panel__title" id="p-${id}">${esc(title)}</h3>${
      tone === "error" ? badge("error", "Unavailable") : `<span class="tm-panel__meta">—</span>`
    }</header>
    <div class="tm-panel__body" data-body>
      <div class="tm-state ${tone === "error" ? "tm-state--error" : ""}" ${tone === "error" ? 'role="alert"' : ""}>
        <div class="tm-state__icon">${icon(tone === "error" ? "danger" : "analytics")}</div>
        <div class="tm-state__title">${esc(stateTitle)}</div>
        <div class="tm-state__body">${esc(message)}</div>
        ${action || ""}
      </div>
    </div>
  </article>`;
}

export default {
  render(main, data) {
    const a = data.analytics;
    const byId = Object.fromEntries(a.charts.map((c) => [c.id, c]));
    let range = a.timeRange;
    let service = a.serviceFilter;
    const mounts = [];

    main.innerHTML = `
    <header class="tm-page-head">
      <div class="tm-page-head__text">
        <div class="tm-eyebrow">Analytics · Operations monitoring</div>
        <h1 class="tm-page-title">${esc(a.pageTitle)}</h1>
        <p class="tm-subtitle">${esc(a.description)} <span class="tm-mono">As of ${esc(fmtDateTime(data.meta.asOf))}.</span></p>
      </div>
      <div class="pg-controls" role="group" aria-label="Dashboard filters">
        <fieldset class="tm-segmented" aria-label="Time range">
          <legend class="tm-sr-only">Time range</legend>
          ${a.timeRangeOptions
            .map((o) => `<label class="tm-segmented__option"><input type="radio" name="range" value="${o}" ${o === range ? "checked" : ""}>${o}</label>`)
            .join("")}
        </fieldset>
        <label class="tm-sr-only" for="svc">Service</label>
        <select class="tm-select pg-w-auto" id="svc">${a.serviceOptions.map((o) => `<option ${o === service ? "selected" : ""}>${esc(o)}</option>`).join("")}</select>
        <button class="tm-btn tm-btn--outline" id="refresh">${icon("refresh")}Refresh</button>
      </div>
    </header>
    <div class="tm-alert tm-alert--warning pg-mb" role="status">
      ${icon("alert")}
      <div><div class="tm-alert__title">${esc(a.stalePanel.title)}</div>
      <div class="tm-alert__body">${esc(byId[STALE_CHART].title)} has not refreshed for ${a.stalePanel.ageMinutes} minutes. Other panels are current.</div></div>
    </div>
    <section class="tm-kpi-strip pg-mb" aria-label="Key metrics, last 24 hours">${a.kpis.map((k) => kpiTile(k, byId)).join("")}</section>
    <p class="tm-meta pg-filter-note" id="filter-note" aria-live="polite"></p>
    <div class="pg-stack" id="regions">
      ${ANALYTICS_REGIONS.map(
        (r) => `<section class="tm-region" data-region="${r.id}" aria-labelledby="r-${r.id}">
          <header class="tm-region__head"><h2 class="tm-region__title" id="r-${r.id}">${esc(r.title)}</h2><span class="tm-panel__meta" data-count></span></header>
          <div class="tm-panel-grid">
            ${r.charts.map((id) => panel(byId[id], a.stalePanel.ageMinutes)).join("")}
            ${
              r.id === "capacity"
                ? statePanel({
                    id: "provider-health",
                    title: "External provider sync",
                    tone: "error",
                    stateTitle: a.errorPanel.title,
                    message: a.errorPanel.message,
                    action: `<button class="tm-btn tm-btn--sm tm-btn--outline" data-retry>${icon("refresh", "tm-icon--sm")}Retry</button>`,
                  }) +
                  statePanel({ id: "batch-exports", title: "Batch export volume", tone: "empty", stateTitle: a.emptyPanel.title, message: a.emptyPanel.message })
                : ""
            }
          </div>
        </section>`,
      ).join("")}
    </div>`;

    const STATE_TAGS = { "provider-health": ["API"], "batch-exports": ["Queue"] };

    function mountAll() {
      mounts.splice(0).forEach((m) => m.destroy());
      main.querySelectorAll("[data-panel]").forEach((p) => {
        const id = p.dataset.panel;
        const c = byId[id];
        if (!c || c.kind === "table") return;
        const body = p.querySelector("[data-body]");
        if (range !== a.timeRange && isTimeSeries(c)) {
          body.innerHTML = `<div class="tm-state"><div class="tm-state__icon">${icon("calendar")}</div><div class="tm-state__title">${esc(
            a.emptyPanel.title,
          )}</div><div class="tm-state__body">${esc(a.emptyPanel.message)} Fixture contains ${esc(a.timeRange)} only.</div></div>`;
          return;
        }
        if (!body.querySelector("[data-chart]")) {
          const tmp = document.createElement("div");
          tmp.innerHTML = panel(c, a.stalePanel.ageMinutes);
          body.replaceWith(tmp.querySelector("[data-body]"));
        }
        const el = p.querySelector("[data-chart]");
        el.innerHTML = "";
        const m = mountChart(el, c, { height: c.kind === "donut" ? 150 : 168 });
        mounts.push(m);
        p.querySelectorAll("[data-series]").forEach((b) =>
          b.addEventListener("click", () => b.setAttribute("aria-pressed", String(m.toggle(b.dataset.series)))),
        );
        if (id === STALE_CHART) p.querySelector("[data-body]").classList.add("pg-stale");
      });
    }

    function applyFilter() {
      let shown = 0;
      let total = 0;
      main.querySelectorAll("[data-panel]").forEach((p) => {
        const tags = SERVICE_TAGS[p.dataset.panel] || STATE_TAGS[p.dataset.panel] || [];
        const vis = service === "All services" || tags.includes(service);
        p.hidden = !vis;
        total++;
        if (vis) shown++;
      });
      main.querySelectorAll("[data-region]").forEach((r) => {
        const n = r.querySelectorAll("[data-panel]:not([hidden])").length;
        r.hidden = n === 0;
        r.querySelector("[data-count]").textContent = `${n} panel${n === 1 ? "" : "s"}`;
      });
      main.querySelector("#filter-note").textContent =
        service === "All services" ? "" : `Showing ${shown} of ${total} panels tagged “${service}”.`;
      grids.forEach((g) => g.apply());
    }

    main.querySelectorAll('input[name="range"]').forEach((i) =>
      i.addEventListener("change", () => {
        range = i.value;
        mountAll();
      }),
    );
    main.querySelector("#svc").addEventListener("change", (e) => {
      service = e.target.value;
      applyFilter();
      mountAll();
    });
    main.querySelector("#refresh").addEventListener("click", async (e) => {
      const btn = e.currentTarget;
      btn.setAttribute("aria-busy", "true");
      btn.disabled = true;
      main.querySelectorAll("[data-chart]").forEach((el) => {
        el.innerHTML = `<div class="pg-skel-chart" aria-hidden="true"><span class="tm-skeleton"></span><span class="tm-skeleton"></span><span class="tm-skeleton"></span></div>`;
      });
      await wait(700);
      mountAll();
      btn.removeAttribute("aria-busy");
      btn.disabled = false;
      toast({ tone: "success", title: "Dashboard refreshed", body: "Fixture data reloaded; values are deterministic." });
    });
    main.addEventListener("click", async (e) => {
      const retry = e.target.closest("[data-retry]");
      if (!retry) return;
      retry.setAttribute("aria-busy", "true");
      retry.disabled = true;
      await wait(800);
      retry.removeAttribute("aria-busy");
      retry.disabled = false;
      toast({ tone: "danger", title: a.errorPanel.title, body: "Retry failed. The fixture simulates a persistent outage.", timeout: 0 });
    });

    const grids = [...main.querySelectorAll(".tm-panel-grid")].map((g) => balanceGrid(g));
    applyFilter();
    mountAll();
    return () => {
      mounts.forEach((m) => m.destroy());
      grids.forEach((g) => g.destroy());
    };
  },
};
