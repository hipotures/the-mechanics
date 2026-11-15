/*
 * The Mechanics → Apache ECharts adapter (optional, framework-free).
 *
 * ECharts cannot read CSS custom properties, so this module resolves the
 * current theme's --tm-* tokens from the DOM and turns them into plain values:
 *
 *   import * as echarts from "echarts";
 *   import { readChartTokens, createEChartsTheme } from ".../adapters/echarts.js";
 *   const t = readChartTokens(document.documentElement);
 *   echarts.registerTheme("tm", createEChartsTheme(t));
 *   const chart = echarts.init(el, "tm", { renderer: "svg" });
 *
 * Re-run both calls (and re-init charts) after changing data-tm-theme.
 * The returned tokens object also exposes semantic colors (threshold, target,
 * surface, text…) for series-level options such as markLine labels.
 */

const TOKENS = {
  chart: ["--tm-chart-1", "--tm-chart-2", "--tm-chart-3", "--tm-chart-4", "--tm-chart-5", "--tm-chart-6", "--tm-chart-7", "--tm-chart-8"],
  grid: "--tm-chart-grid",
  axis: "--tm-chart-axis",
  threshold: "--tm-chart-threshold",
  target: "--tm-chart-target",
  fillOpacity: "--tm-chart-fill-opacity",
  heatLo: "--tm-heat-lo",
  heatHi: "--tm-heat-hi",
  surface: "--tm-surface",
  text: "--tm-text",
  text2: "--tm-text-2",
  text3: "--tm-text-3",
  line1: "--tm-line-1",
  line2: "--tm-line-2",
  line3: "--tm-line-3",
  hover: "--tm-hover",
  danger: "--tm-danger",
  success: "--tm-success",
  warning: "--tm-warning",
  fontMono: "--tm-font-mono",
  fontUi: "--tm-font-ui",
};

/** Resolve the chart-relevant --tm-* tokens for the theme active on `el`. */
export function readChartTokens(el = document.documentElement) {
  const cs = getComputedStyle(el);
  const get = (name) => cs.getPropertyValue(name).trim();
  const out = {};
  for (const [key, name] of Object.entries(TOKENS)) out[key] = Array.isArray(name) ? name.map(get) : get(name);
  out.fillOpacity = parseFloat(out.fillOpacity) || 0.2;
  out.fontSize = 11;
  return out;
}

/** Line style per series index: solid, dashed, dotted, dash-dot (non-color encoding). */
export const seriesLineType = (i) => ["solid", [6, 3], [2, 3], [8, 3, 2, 3]][i % 4];

/** ECharts theme object built from resolved tokens. */
export function createEChartsTheme(t) {
  const axisLabel = { color: t.text3, fontFamily: t.fontMono, fontSize: 10.5, hideOverlap: true };
  const axisName = { color: t.text3, fontFamily: t.fontMono, fontSize: 10.5 };
  return {
    color: t.chart,
    backgroundColor: "transparent",
    textStyle: { fontFamily: t.fontMono, fontSize: t.fontSize, color: t.text2 },
    categoryAxis: {
      axisLine: { show: true, lineStyle: { color: t.axis, width: 1 } },
      axisTick: { show: false },
      axisLabel,
      nameTextStyle: axisName,
      splitLine: { show: false },
    },
    valueAxis: {
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel,
      nameTextStyle: axisName,
      splitLine: { show: true, lineStyle: { color: t.grid, width: 1 } },
    },
    line: { symbolSize: 6, lineStyle: { width: 2 }, emphasis: { disabled: true } },
    bar: { itemStyle: { borderRadius: 0 }, emphasis: { disabled: true } },
    scatter: { symbolSize: 9, emphasis: { disabled: true } },
    pie: { itemStyle: { borderColor: t.surface, borderWidth: 2 }, emphasis: { disabled: true } },
    heatmap: { itemStyle: { borderColor: t.surface, borderWidth: 2 } },
    legend: { textStyle: { color: t.text2, fontFamily: t.fontMono, fontSize: 11 }, itemWidth: 10, itemHeight: 10, icon: "rect" },
    tooltip: {
      backgroundColor: t.surface,
      borderColor: t.line1,
      borderWidth: 1,
      padding: [6, 8],
      textStyle: { color: t.text, fontFamily: t.fontUi, fontSize: 12 },
      extraCssText: "border-radius:0;box-shadow:var(--tm-shadow-raised);",
      axisPointer: { lineStyle: { color: t.text2, type: [2, 2], width: 1 }, shadowStyle: { color: t.hover } },
    },
  };
}

/** Threshold / target reference line for a value axis (markLine option). */
export function referenceLine(t, value, label, kind = "threshold") {
  const color = kind === "target" ? t.target : t.threshold;
  return {
    silent: true,
    symbol: "none",
    lineStyle: { color, width: 1.5, type: kind === "target" ? [2, 3] : [5, 3] },
    label: {
      formatter: label,
      position: "insideStartTop", // left end: away from the latest (most-watched) values
      color,
      fontFamily: t.fontMono,
      fontSize: 10.5,
      fontWeight: 600,
      backgroundColor: t.surface,
      padding: [1, 3],
    },
    data: [{ yAxis: value }],
  };
}
