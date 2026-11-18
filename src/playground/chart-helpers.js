// Chart helpers without ECharts: legend data, series classes and the KPI
// sparkline. Pages import these synchronously; charts.js (ECharts) loads later.
export const seriesCls = (i) => `tm-series-${(i % 8) + 1}`;
export const dashCls = (i) => (i > 0 && i < 4 ? `tm-dash-${i + 1}` : "");
export const isTimeSeries = (c) => Array.isArray(c.xLabels) && c.xLabels[0]?.includes(":");

export function legendItems(c) {
  if (["line", "area", "stacked-bar", "grouped-bar"].includes(c.kind) && c.series.length > 1)
    return c.series.map((s, i) => ({ name: s.name, cls: seriesCls(i), dash: dashCls(i), line: c.kind === "line" }));
  return [];
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
