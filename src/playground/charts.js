// Chart rendering with Apache ECharts (SVG renderer), styled entirely from
// The Mechanics tokens via src/the-mechanics/adapters/echarts.js.
// ECharts handles layout, axis labels and label collision
// (labelLayout: moveOverlap / hideOverlap); this module only maps fixture
// chart definitions to options and adds the shared keyboard/legend contract.
import * as echarts from "echarts/core";
import { LineChart, BarChart, PieChart, HeatmapChart, ScatterChart } from "echarts/charts";
import { GridComponent, TooltipComponent, MarkLineComponent, VisualMapComponent, LegendComponent, TitleComponent } from "echarts/components";
import { LabelLayout } from "echarts/features";
import { SVGRenderer } from "echarts/renderers";
import { readChartTokens, createEChartsTheme, seriesLineType, referenceLine } from "../the-mechanics/adapters/echarts.js";
import { esc, fmtNum } from "./lib.js";

echarts.use([LineChart, BarChart, PieChart, HeatmapChart, ScatterChart, GridComponent, TooltipComponent, MarkLineComponent, VisualMapComponent, LegendComponent, TitleComponent, LabelLayout, SVGRenderer]);

const CHAR_W = 6.4; // approx. advance of 10.5px IBM Plex Mono, used for layout decisions
const textW = (s) => String(s).length * CHAR_W;
const seriesCls = (i) => `tm-series-${(i % 8) + 1}`;
const dashCls = (i) => (i > 0 && i < 4 ? `tm-dash-${i + 1}` : "");
const fmtVal = (v, unit) => (v == null ? "no data" : unit === "%" ? `${fmtNum(v, 2)}%` : `${fmtNum(v, 2)}${unit ? ` ${unit}` : ""}`);
const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Theme registration (one ECharts theme per tm theme) ------- */
const registered = new Set();
function themeName() {
  const id = document.documentElement.getAttribute("data-tm-theme") || "light";
  const name = `tm-${id}`;
  if (!registered.has(name)) {
    echarts.registerTheme(name, createEChartsTheme(readChartTokens()));
    registered.add(name);
  }
  return name;
}

/* ---------- Tooltip markup (our classes, inside the ECharts tooltip) -- */
const tipHTML = (title, rows) =>
  `<div class="tm-chart-tooltip__title">${esc(title)}</div>${rows
    .map((r) => `<div class="tm-chart-tooltip__row">${r.cls ? `<span class="tm-legend__swatch ${r.cls}"></span>` : ""}<span>${esc(r.name)}</span><span>${esc(r.value)}</span></div>`)
    .join("")}`;

/* ---------- Option builders ---------------------------------------- */
// Show every n-th category label so neighbouring labels keep >= 12px between them.
function labelInterval(labels, plotWidth) {
  const need = Math.max(...labels.map(textW)) + 12;
  return Math.max(0, Math.ceil((need * labels.length) / Math.max(1, plotWidth)) - 1);
}
// Grid for charts with category labels on the y-axis: reserve the label width explicitly.
const catYGrid = (labels, extra = {}) => ({ left: Math.ceil(Math.max(...labels.map(textW))) + 16, right: 14, top: 4, bottom: 4, containLabel: false, ...extra });
const baseGrid = (extra = {}) => ({ left: 4, right: 14, top: 28, bottom: 2, containLabel: true, ...extra });
const valueAxis = (unit, extra = {}) => ({ type: "value", name: unit, nameLocation: "end", nameGap: 10, nameTextStyle: { align: "left", padding: [0, 0, 0, -26] }, ...extra });
function niceCeil(v) {
  const p = 10 ** Math.floor(Math.log10(v || 1));
  const f = v / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 3 ? 3 : f <= 5 ? 5 : 10) * p;
}
const selected = (c, hidden) => ({ show: false, selected: Object.fromEntries(c.series.map((s) => [s.name, !hidden.has(s.name)])) });

function lineOption(c, t, hidden, area, width) {
  const refs = [];
  // Short value labels; the legend names the line (Threshold / Capacity / Target).
  if (c.threshold != null) refs.push(referenceLine(t, c.threshold, `${fmtNum(c.threshold)} ${c.unit}`));
  if (c.capacity != null) refs.push(referenceLine(t, c.capacity, `${fmtNum(c.capacity)} ${c.unit} max`));
  if (c.target != null) refs.push(referenceLine(t, c.target, `${fmtNum(c.target)}${c.unit === "%" ? "%" : ` ${c.unit}`} target`, "target"));
  const max = Math.max(...c.series.flatMap((s) => s.values), ...[c.threshold, c.capacity, c.target].filter((v) => v != null));
  // Reference lines live on a silent helper series so hiding a data series never removes them.
  const refSeries = refs.length
    ? [{ type: "line", name: "__ref", data: [], silent: true, tooltip: { show: false }, markLine: { ...refs[0], data: refs.flatMap((r) => r.data.map((d) => ({ ...d, lineStyle: r.lineStyle, label: r.label }))) } }]
    : [];
  return {
    grid: baseGrid(),
    xAxis: { type: "category", data: c.xLabels, boundaryGap: false, axisLabel: { interval: labelInterval(c.xLabels, width - 60) } },
    yAxis: valueAxis(c.unit, { min: 0, max: niceCeil(max * 1.08) }),
    tooltip: { trigger: "axis" },
    legend: selected(c, hidden),
    series: [
      ...c.series.map((s, i) => ({
        type: "line",
        name: s.name,
        data: s.values,
        symbol: i % 2 ? "circle" : "emptyCircle",
        lineStyle: { type: seriesLineType(i) },
        ...(area ? { areaStyle: { opacity: t.fillOpacity } } : {}),
      })),
      ...refSeries,
    ],
  };
}

function barOption(c, t, hidden, mode, horizontal, width) {
  const cat = { type: "category", data: c.xLabels, ...(horizontal ? { inverse: true, axisLabel: { color: t.text2 } } : { axisLabel: { interval: labelInterval(c.xLabels, width - 60) } }) };
  // Horizontal value axis: one tick per ~64px so numbers never crowd.
  const val = valueAxis(horizontal ? "" : c.unit, { min: 0, ...(horizontal ? { splitNumber: Math.max(2, Math.floor((width - Math.max(...c.xLabels.map(textW)) - 60) / 64)) } : {}) });
  return {
    grid: horizontal ? catYGrid(c.xLabels, { top: 6, right: 34, bottom: 22 }) : baseGrid(),
    xAxis: horizontal ? val : cat,
    yAxis: horizontal ? cat : val,
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    legend: selected(c, hidden),
    labelLayout: { hideOverlap: true },
    series: c.series.map((s, i) => ({
      type: "bar",
      name: s.name,
      data: s.values,
      ...(mode === "stacked" ? { stack: "total", barWidth: "58%" } : { barGap: "25%", barCategoryGap: horizontal ? "26%" : "30%" }),
      ...(mode === "stacked"
        ? {}
        : { label: { show: true, position: horizontal ? "right" : "top", distance: 4, fontFamily: t.fontMono, fontSize: 10.5, color: t.text2 } }),
      barMinHeight: 1, // zero values keep a visible 1px stub
      itemStyle: { color: t.chart[i % 8] },
    })),
  };
}

function hBarOption(c, t) {
  return {
    grid: catYGrid(c.series.map((d) => d.label), { right: 48 }),
    xAxis: { type: "value", min: 0, show: false },
    yAxis: { type: "category", data: c.series.map((d) => d.label), inverse: true, axisLabel: { color: t.text2 } },
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    series: [{ type: "bar", data: c.series.map((d) => d.value), barWidth: 14, label: { show: true, position: "right", fontFamily: t.fontMono, fontSize: 10.5, color: t.text2, formatter: (p) => fmtNum(p.value) } }],
  };
}

function histogramOption(c, t) {
  return {
    grid: baseGrid(),
    xAxis: { type: "category", data: c.series.map((d) => d.range) },
    yAxis: valueAxis(c.unit, { min: 0 }),
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    series: [{ type: "bar", data: c.series.map((d) => d.count), barCategoryGap: "3%", label: { show: true, position: "top", fontFamily: t.fontMono, fontSize: 10.5, color: t.text2 } }],
  };
}

const DONUT_H = 156;
function donutOption(c, t, width) {
  const total = c.series.reduce((a, d) => a + d.value, 0);
  const side = width >= 300; // legend beside the ring when there is room, else below
  const totalLabel = c.unit === "USD" ? `$${fmtNum(total, 2)}` : c.unit === "%" ? `${fmtNum(total)}%` : fmtNum(total);
  const center = side ? [78, DONUT_H / 2] : ["50%", 74];
  const pct = (name) => fmtNum((c.series.find((d) => d.label === name).value / total) * 100, 1);
  return {
    tooltip: { trigger: "item" },
    legend: {
      selectedMode: false,
      icon: "rect",
      ...(side ? { orient: "vertical", left: 170, right: 4, top: "middle", itemGap: 8 } : { orient: "horizontal", left: "center", bottom: 0 }),
      formatter: (name) => (side ? `{n|${name}}{p|${pct(name)}%}` : `${name} ${pct(name)}%`),
      textStyle: { rich: { n: { width: Math.max(64, width - 170 - 64), color: t.text2 }, p: { align: "right", width: 44, color: t.text, fontWeight: 600 } } },
    },
    title: {
      text: `{a|TOTAL}\n{b|${totalLabel}}`,
      left: side ? center[0] : "center",
      top: (side ? DONUT_H / 2 : 74) - 18,
      textAlign: "center",
      textStyle: {
        rich: {
          a: { fontFamily: t.fontMono, fontSize: 10, fontWeight: 500, color: t.text3, lineHeight: 16, align: "center" },
          b: { fontFamily: t.fontMono, fontSize: 13, fontWeight: 700, color: t.text, lineHeight: 18, align: "center" },
        },
      },
    },
    series: [{ type: "pie", radius: [44, 70], center, label: { show: false }, data: c.series.map((d) => ({ name: d.label, value: d.value })) }],
  };
}

function heatmapOption(c, t, width) {
  return {
    grid: catYGrid(c.series.map((r) => r.row), { right: 4, bottom: 22 }),
    xAxis: { type: "category", data: c.xLabels, axisLine: { show: false }, axisLabel: { interval: labelInterval(c.xLabels, width - 80) } },
    yAxis: { type: "category", data: c.series.map((r) => r.row), inverse: true, axisLine: { show: false }, axisLabel: { color: t.text2 } },
    visualMap: { show: false, min: 0, max: 100, inRange: { color: [t.heatLo, t.heatHi] } },
    tooltip: { trigger: "item" },
    series: [
      {
        type: "heatmap",
        data: c.series.flatMap((r, ri) => r.values.map((v, i) => ({ value: [i, ri, v], label: { color: v >= 55 ? t.surface : t.text } }))),
        label: { show: true, fontFamily: t.fontMono, fontSize: 10 },
      },
    ],
  };
}

function scatterOption(c, t) {
  return {
    grid: baseGrid({ bottom: 20, right: 52 }),
    xAxis: { type: "value", scale: true, name: "traffic, req/min →", nameLocation: "end", nameGap: 0, nameTextStyle: { align: "right", verticalAlign: "top", padding: [26, 0, 0, 0] }, splitLine: { show: false }, axisLine: { show: true } },
    yAxis: valueAxis("error %", { min: 0 }),
    tooltip: { trigger: "item" },
    // ECharts moves colliding point labels apart vertically and draws a leader line.
    labelLayout: { moveOverlap: "shiftY" },
    series: [
      {
        type: "scatter",
        data: c.series.map((p) => {
          const hot = p.y >= 1;
          return { name: p.label, value: [p.x, p.y], symbol: hot ? "rect" : "circle", symbolSize: hot ? 9 : 10, itemStyle: { color: hot ? t.chart[5] : t.chart[0] } };
        }),
        label: { show: true, position: "right", distance: 6, formatter: "{b}", fontFamily: t.fontMono, fontSize: 10.5, color: t.text2, backgroundColor: t.surface, padding: [0, 2] },
        labelLine: { show: true, length2: 4, lineStyle: { color: t.line2 } },
      },
    ],
  };
}

/* ---------- Tooltip formatters (rows rendered with our markup) ------ */
function formatter(c) {
  return (params) => {
    const ps = (Array.isArray(params) ? params : [params]).filter((p) => p.seriesName !== "__ref");
    const p0 = ps[0];
    if (!p0) return "";
    if (c.kind === "donut") {
      const total = c.series.reduce((a, d) => a + d.value, 0);
      return tipHTML(p0.name, [
        { name: "Value", value: c.unit === "USD" ? `$${fmtNum(p0.value, 2)}` : `${fmtNum(p0.value, 2)}${c.unit === "%" ? "%" : ""}`, cls: seriesCls(p0.dataIndex) },
        { name: "Share", value: `${fmtNum((p0.value / total) * 100, 1)}%` },
      ]);
    }
    if (c.kind === "heatmap") return tipHTML(`${c.series[p0.value[1]].row} · ${c.xLabels[p0.value[0]]}`, [{ name: "Utilization", value: `${p0.value[2]}%` }]);
    if (c.kind === "scatter") return tipHTML(p0.name, [{ name: "Traffic", value: `${p0.value[0]} req/min` }, { name: "Error rate", value: `${fmtNum(p0.value[1], 1)}%`, cls: p0.value[1] >= 1 ? "tm-series-6" : "tm-series-1" }]);
    if (c.kind === "horizontal-bar") return tipHTML(p0.name, [{ name: c.unit, value: fmtNum(p0.value), cls: seriesCls(0) }]);
    if (c.kind === "histogram") {
      const total = c.series.reduce((a, d) => a + d.count, 0);
      return tipHTML(p0.name, [{ name: "Tasks", value: fmtNum(p0.value), cls: seriesCls(0) }, { name: "Share", value: `${fmtNum((p0.value / total) * 100, 1)}%` }]);
    }
    const rows = ps.map((p) => ({ name: p.seriesName, value: fmtVal(p.value, c.unit), cls: seriesCls(p.seriesIndex) }));
    if (c.kind === "stacked-bar") rows.push({ name: "Total", value: fmtVal(ps.reduce((a, p) => a + (p.value ?? 0), 0), c.unit) });
    return tipHTML(p0.name, rows);
  };
}

/* ---------- Public API --------------------------------------------- */
export const isTimeSeries = (c) => Array.isArray(c.xLabels) && c.xLabels[0]?.includes(":");

export function legendItems(c) {
  if (["line", "area", "stacked-bar", "grouped-bar"].includes(c.kind) && c.series.length > 1)
    return c.series.map((s, i) => ({ name: s.name, cls: seriesCls(i), dash: dashCls(i), line: c.kind === "line" }));
  return [];
}

export function summarize(c) {
  const kind = c.kind.replace("-", " ");
  if (c.series[0]?.values) {
    const parts = c.series.map((s) => {
      const max = Math.max(...s.values);
      return `${s.name} peak ${fmtNum(max, 2)} at ${c.xLabels[s.values.indexOf(max)]}`;
    });
    return `${c.title}: ${kind} chart in ${c.unit}. ${parts.join("; ")}.`;
  }
  return `${c.title}: ${kind} chart in ${c.unit}, ${c.series.length} items.`;
}

const pointCount = (c) => (c.kind === "heatmap" ? c.series.length * c.xLabels.length : c.series[0]?.values ? c.xLabels.length : c.series.length);

export function mountChart(el, chart, { height = 180 } = {}) {
  const hidden = new Set();
  let inst = null;
  let idx = -1;
  let layoutKey = "";
  const host = document.createElement("div");
  host.className = "pg-chart-host";
  const live = document.createElement("div");
  live.className = "tm-sr-only";
  live.setAttribute("aria-live", "polite");
  el.append(host, live);
  el.tabIndex = 0;
  el.setAttribute("role", "img");
  el.setAttribute("aria-roledescription", "chart");
  el.setAttribute("aria-label", `${summarize(chart)} Use left and right arrow keys to inspect values.`);

  const width = () => Math.max(220, Math.round(el.clientWidth || 320));
  // Long category labels switch grouped bars to a horizontal layout.
  const horizontalGrouped = () => chart.kind === "grouped-bar" && Math.max(...chart.xLabels.map(textW)) + 6 > (width() - 50) / chart.xLabels.length;
  // Layout decisions that need a rebuild (not just resize): orientation, donut legend side, label thinning.
  const key = () => `${horizontalGrouped()}|${chart.kind === "donut" ? width() >= 300 : ""}|${Math.round(width() / 40)}`;

  function option() {
    const t = readChartTokens(el);
    const w = width();
    const builders = {
      line: () => lineOption(chart, t, hidden, false, w),
      area: () => lineOption(chart, t, hidden, true, w),
      "stacked-bar": () => barOption(chart, t, hidden, "stacked", false, w),
      "grouped-bar": () => barOption(chart, t, hidden, "grouped", horizontalGrouped(), w),
      "horizontal-bar": () => hBarOption(chart, t),
      histogram: () => histogramOption(chart, t),
      donut: () => donutOption(chart, t, w),
      heatmap: () => heatmapOption(chart, t, w),
      scatter: () => scatterOption(chart, t),
    };
    const o = builders[chart.kind]?.() ?? {};
    o.animation = !reducedMotion();
    o.animationDuration = 200;
    // Neutral container class: the box is styled by the ECharts theme; rows use tm-chart-tooltip__*.
    o.tooltip = { ...(o.tooltip || {}), confine: true, className: "pg-echarts-tip", formatter: formatter(chart) };
    return o;
  }

  function chartHeight() {
    if (chart.kind === "grouped-bar" && horizontalGrouped()) return chart.xLabels.length * (chart.series.length * 13 + 12) + 30;
    if (chart.kind === "horizontal-bar") return chart.series.length * 26 + 10;
    if (chart.kind === "heatmap") return chart.series.length * 24 + 26;
    if (chart.kind === "donut") return DONUT_H;
    return height;
  }

  function render() {
    inst?.dispose();
    host.style.height = `${chartHeight()}px`;
    inst = echarts.init(host, themeName(), { renderer: "svg" });
    inst.setOption(option());
    layoutKey = key();
    if (idx >= 0) show(idx);
  }

  function describe(i) {
    const c = chart;
    if (c.kind === "heatmap") {
      const r = Math.floor(i / c.xLabels.length);
      const x = i % c.xLabels.length;
      return `${c.series[r].row} at ${c.xLabels[x]}: ${c.series[r].values[x]}%`;
    }
    if (c.series[0]?.values) return `${c.xLabels[i]}: ${c.series.filter((s) => !hidden.has(s.name)).map((s) => `${s.name} ${fmtVal(s.values[i], c.unit)}`).join(", ")}`;
    const d = c.series[i];
    return `${d.label ?? d.range}: ${fmtNum(d.value ?? d.count ?? d.y, 2)}`;
  }

  function show(i) {
    const n = pointCount(chart);
    idx = ((i % n) + n) % n;
    const seriesIndex = chart.series[0]?.values ? Math.max(0, chart.series.findIndex((s) => !hidden.has(s.name))) : 0;
    inst.dispatchAction({ type: "showTip", seriesIndex, dataIndex: idx });
    live.textContent = describe(idx);
  }
  function hide() {
    idx = -1;
    inst?.dispatchAction({ type: "hideTip" });
  }

  el.addEventListener("keydown", (e) => {
    const n = pointCount(chart);
    if (["ArrowRight", "ArrowDown"].includes(e.key)) { e.preventDefault(); show(idx + 1); }
    else if (["ArrowLeft", "ArrowUp"].includes(e.key)) { e.preventDefault(); show(idx < 0 ? n - 1 : idx - 1); }
    else if (e.key === "Home") { e.preventDefault(); show(0); }
    else if (e.key === "End") { e.preventDefault(); show(n - 1); }
    else if (e.key === "Escape") hide();
  });
  el.addEventListener("blur", hide);

  // Resize: re-layout in place; rebuild only when a layout decision flips.
  const ro = new ResizeObserver(() => {
    if (!inst) return;
    if (key() !== layoutKey) render();
    else inst.resize();
  });
  ro.observe(el);
  // Theme switch: re-resolve tokens and re-create the chart.
  const mo = new MutationObserver(() => render());
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-tm-theme"] });

  render();
  // ECharts measures text during layout; re-render once the webfonts are in.
  if (document.fonts && document.fonts.status !== "loaded") document.fonts.ready.then(() => inst && render());
  return {
    toggle(name) {
      hidden.has(name) ? hidden.delete(name) : hidden.add(name);
      inst.dispatchAction({ type: hidden.has(name) ? "legendUnSelect" : "legendSelect", name });
      return !hidden.has(name);
    },
    destroy() {
      ro.disconnect();
      mo.disconnect();
      inst?.dispose();
      inst = null;
    },
  };
}

// Inline sparkline for KPI tiles (decorative, no labels; the value is in text).
export function sparkline(values, { w = 84, h = 22, tone = "tm-series-1" } = {}) {
  if (!values?.length) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const x = (i) => 1 + (i * (w - 2)) / (values.length - 1);
  const y = (v) => h - 2 - ((v - min) / (max - min || 1)) * (h - 4);
  const d = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
  return `<svg class="pg-spark ${tone}" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" preserveAspectRatio="none" aria-hidden="true"><path class="tm-chart__area" d="${d}L${w - 1},${h}L1,${h}Z"/><path class="tm-chart__line" style="stroke-width:1.5" d="${d}"/><circle class="tm-chart__point tm-chart__point--solid" cx="${x(values.length - 1)}" cy="${y(values.at(-1))}" r="2"/></svg>`;
}
