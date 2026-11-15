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

/* ---------- Composite-chart building blocks ---------------------------
 * Pieces for richer time charts (e.g. "cost over time, stacked by model"):
 * peak callout, highlighted ranges (quota windows, incidents), drag-to-sum
 * range selection and day boundaries on a time-of-day axis. Each returns a
 * plain ECharts option fragment styled from the resolved tokens.
 */

/** Callout above the highest point/stack: "peak 12:00  $11.86". Use as series.markPoint. */
export function peakMarker(t, { coord, label }) {
  return {
    silent: true,
    symbol: "rect",
    symbolSize: 1,
    itemStyle: { color: "transparent" },
    label: {
      show: true,
      position: "top",
      distance: 8,
      formatter: label,
      color: t.text,
      fontFamily: t.fontMono,
      fontSize: 11,
      fontWeight: 600,
      backgroundColor: t.surface,
      borderColor: t.line1,
      borderWidth: 1,
      padding: [3, 6],
    },
    data: [{ coord }],
  };
}

/** Highlighted x-range band with a label (quota window, maintenance, incident). Use as series.markArea. */
export function rangeArea(t, ranges, kind = "neutral") {
  const tone = { neutral: t.text3, warning: t.warning, danger: t.danger, success: t.success }[kind] || t.text3;
  return {
    silent: true,
    itemStyle: { color: tone, opacity: 0.1, borderColor: tone, borderWidth: 1, borderType: [3, 3] },
    // Label at the band's top-left corner, away from a centered peak callout.
    label: { position: "insideTopLeft", color: tone, fontFamily: t.fontMono, fontSize: 10.5, fontWeight: 600, distance: 4 },
    data: ranges.map(([from, to, name]) => [{ xAxis: from, name }, { xAxis: to }]),
  };
}

/** Drag-to-select along x (sum a span). Pair with dispatchAction({type:"takeGlobalCursor", key:"brush", brushOption:{brushType:"lineX"}}). */
export function rangeBrush(t) {
  return {
    xAxisIndex: 0,
    brushType: "lineX",
    brushMode: "single",
    transformable: false,
    throttleType: "debounce",
    throttleDelay: 60,
    brushStyle: { color: t.hover, borderColor: t.line1, borderWidth: 1 },
    outOfBrush: { colorAlpha: 0.35 },
  };
}

/**
 * Axis label formatter for a time-of-day category axis: midnight ("00:00")
 * is replaced by the date in bold so day boundaries are visible.
 * dateFor(index) returns the date string for a midnight label.
 */
export function dayBoundaryLabels(t, dateFor) {
  return {
    formatter: (value, index) => (value === "00:00" ? `{day|${dateFor(index)}}` : value),
    rich: { day: { color: t.text, fontFamily: t.fontMono, fontSize: 10.5, fontWeight: 700 } },
  };
}
