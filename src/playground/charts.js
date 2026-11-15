// Deterministic SVG chart renderer. One visual grammar for every chart kind:
// hairline grid, ink axis, tabular mono ticks, series colors from --tm-chart-*,
// dash patterns + point markers as non-color encodings, shared tooltip and
// keyboard stepping. Charts render at their real pixel width so labels stay
// at a constant, legible size; a ResizeObserver re-renders on width change.
import { esc, fmtNum, fmtCompact } from "./lib.js";

const CHAR_W = 6.4; // approx. advance of 10.5px IBM Plex Mono
const TICK = "tm-chart__tick";

function niceStep(raw) {
  const p = 10 ** Math.floor(Math.log10(raw));
  const f = raw / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
}
export function niceScale(min, max, count = 4) {
  if (max === min) max = min + 1;
  const step = niceStep((max - min) / count);
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(+v.toFixed(6));
  return { lo, hi, ticks };
}
const tickLabel = (v) => (Math.abs(v) >= 10000 ? fmtCompact(v) : fmtNum(v, Math.abs(v) < 10 && v % 1 ? 1 : 0));
const valueLabel = (v, unit) => (v == null ? "no data" : `${fmtNum(v, 2)}${unit ? ` ${unit}` : ""}`);
const textW = (s) => String(s).length * CHAR_W;
const seriesCls = (i) => `tm-series-${(i % 8) + 1}`;
const dashCls = (i) => (i > 0 && i < 4 ? `tm-dash-${i + 1}` : "");

function yAxis({ ticks, lo, hi }, m, w, h, unit) {
  const y = (v) => m.t + (1 - (v - lo) / (hi - lo)) * (h - m.t - m.b);
  let s = "";
  for (const t of ticks) {
    const yy = Math.round(y(t)) + 0.5;
    s += `<line class="tm-chart__grid" x1="${m.l}" x2="${w - m.r}" y1="${yy}" y2="${yy}"/>`;
    s += `<text class="${TICK}" x="${m.l - 6}" y="${yy + 3.5}" text-anchor="end">${tickLabel(t)}</text>`;
  }
  s += `<line class="tm-chart__axis" x1="${m.l}" x2="${w - m.r}" y1="${Math.round(y(lo)) + 0.5}" y2="${Math.round(y(lo)) + 0.5}"/>`;
  if (unit) s += `<text class="${TICK}" x="0" y="9">${esc(unit)}</text>`;
  return { s, y };
}

function xLabels(labels, xAt, yPos, plotW) {
  const maxW = Math.max(...labels.map(textW)) + 8;
  const every = Math.max(1, Math.ceil((maxW * labels.length) / plotW));
  return labels
    .map((l, i) => (i % every === 0 ? `<text class="${TICK}" x="${xAt(i)}" y="${yPos}" text-anchor="middle">${esc(l)}</text>` : ""))
    .join("");
}

function marginLeft(ticks) {
  return Math.max(28, Math.max(...ticks.map((t) => textW(tickLabel(t)))) + 10);
}

/* ---------- Line / area -------------------------------------------- */
function lineChart(c, w, h, hidden, area = false) {
  const all = c.series.flatMap((s) => s.values).filter((v) => v != null);
  const refs = [c.threshold, c.capacity, c.target].filter((v) => v != null);
  const sc = niceScale(0, Math.max(...all, ...refs));
  const m = { t: 22, r: 12, b: 22, l: marginLeft(sc.ticks, c.unit) };
  const { s: axis, y } = yAxis(sc, m, w, h, c.unit);
  const n = c.xLabels.length;
  const plotW = w - m.l - m.r;
  const x = (i) => m.l + (i * plotW) / (n - 1);
  let body = axis;
  const ref = (v, cls, label) => {
    const yy = y(v);
    body += `<line class="tm-chart__${cls}" x1="${m.l}" x2="${w - m.r}" y1="${yy}" y2="${yy}"/>`;
    body += `<text class="tm-chart__${cls}-label" x="${w - m.r}" y="${yy - 4}" text-anchor="end">${esc(label)}</text>`;
  };
  if (c.threshold != null) ref(c.threshold, "threshold", `Threshold ${fmtNum(c.threshold)} ${c.unit}`);
  if (c.capacity != null) ref(c.capacity, "threshold", `Capacity ${fmtNum(c.capacity)} ${c.unit}`);
  if (c.target != null) ref(c.target, "target", `Target ${fmtNum(c.target)}${c.unit === "%" ? "%" : ` ${c.unit}`}`);
  c.series.forEach((s, si) => {
    if (hidden.has(s.name)) return;
    const pts = s.values.map((v, i) => (v == null ? null : [x(i), y(v)]));
    const d = pts.map((p, i) => (p ? `${i === 0 || !pts[i - 1] ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}` : "")).join("");
    const g = `${seriesCls(si)}`;
    if (area) {
      const base = y(sc.lo);
      body += `<path class="tm-chart__area ${g}" d="${d}L${x(n - 1)},${base}L${x(0)},${base}Z"/>`;
    }
    body += `<path class="tm-chart__line ${g} ${dashCls(si)}" d="${d}"/>`;
    pts.forEach((p) => {
      if (p) body += `<circle class="tm-chart__point ${si % 2 ? "tm-chart__point--solid" : ""} ${g}" cx="${p[0]}" cy="${p[1]}" r="2.6"/>`;
    });
  });
  body += xLabels(c.xLabels, x, h - 6, plotW);
  const stops = c.xLabels.map((lab, i) => ({
    x: x(i),
    y: m.t,
    cursor: { x: x(i), y1: m.t, y2: h - m.b },
    title: lab,
    rows: c.series
      .map((s, si) => ({ name: s.name, value: valueLabel(s.values[i], c.unit), cls: seriesCls(si), hidden: hidden.has(s.name) }))
      .filter((r) => !r.hidden),
  }));
  return { body, stops };
}

/* ---------- Bars ------------------------------------------------------ */
function barChart(c, w, h, hidden, mode) {
  const vis = c.series.map((s, si) => ({ ...s, si })).filter((s) => !hidden.has(s.name));
  const n = c.xLabels.length;
  const totals = c.xLabels.map((_, i) => c.series.reduce((a, s) => a + (s.values[i] ?? 0), 0));
  const max = mode === "stacked" ? Math.max(...totals) : Math.max(...c.series.flatMap((s) => s.values));
  const sc = niceScale(0, max);
  const m = { t: 22, r: 8, b: 22, l: marginLeft(sc.ticks, c.unit) };
  const plotW = w - m.l - m.r;
  const band = plotW / n;
  const { s: axis, y } = yAxis(sc, m, w, h, c.unit);
  let body = axis;
  const pad = Math.min(10, band * 0.18);
  const xAt = (i) => m.l + band * i + band / 2;
  for (let i = 0; i < n; i++) {
    const x0 = m.l + band * i + pad;
    const bw = band - pad * 2;
    if (mode === "stacked") {
      let acc = 0;
      vis.forEach((s) => {
        const v = s.values[i] ?? 0;
        const y1 = y(acc + v);
        const y0 = y(acc);
        body += `<rect class="tm-chart__bar ${seriesCls(s.si)}" x="${x0}" y="${y1}" width="${bw}" height="${Math.max(0, y0 - y1 - (acc ? 1 : 0))}"/>`;
        acc += v;
      });
    } else {
      const sub = bw / Math.max(1, vis.length);
      vis.forEach((s, k) => {
        const v = s.values[i] ?? 0;
        const hh = y(0) - y(v);
        // Small non-zero values keep a 1px sliver; zero renders a tick so "0" is visible.
        body += `<rect class="tm-chart__bar ${seriesCls(s.si)}" x="${x0 + k * sub + 0.5}" y="${y(v) - (v === 0 ? 1 : 0)}" width="${Math.max(1, sub - 1)}" height="${Math.max(v === 0 ? 1 : 1, hh)}"/>`;
      });
    }
  }
  body += xLabels(c.xLabels, xAt, h - 6, plotW);
  const stops = c.xLabels.map((lab, i) => ({
    x: xAt(i),
    y: m.t,
    cursor: { x: xAt(i), y1: m.t, y2: h - m.b },
    title: lab,
    rows: [
      ...vis.map((s) => ({ name: s.name, value: valueLabel(s.values[i], c.unit), cls: seriesCls(s.si) })),
      ...(mode === "stacked" ? [{ name: "Total", value: valueLabel(totals[i], c.unit) }] : []),
    ],
  }));
  return { body, stops };
}

// Horizontal grouped bars — used automatically when category labels are too
// long for a vertical axis (long axis labels stay fully readable).
function hGroupedChart(c, w, hidden) {
  const vis = c.series.map((s, si) => ({ ...s, si })).filter((s) => !hidden.has(s.name));
  const labW = Math.min(w * 0.38, Math.max(...c.xLabels.map(textW)) + 10);
  const max = Math.max(...c.series.flatMap((s) => s.values));
  const sc = niceScale(0, max);
  const PITCH = 12; // bar-to-bar pitch inside a group: 9px bar + 3px gap, fits a 10.5px value label
  const rowH = Math.max(18, vis.length * PITCH + 10);
  const m = { t: 6, r: 40, b: 20, l: labW };
  const h = m.t + rowH * c.xLabels.length + m.b;
  const plotW = w - m.l - m.r;
  const x = (v) => m.l + (v / sc.hi) * plotW;
  let body = "";
  sc.ticks.forEach((t) => {
    const xx = Math.round(x(t)) + 0.5;
    body += `<line class="tm-chart__grid" x1="${xx}" x2="${xx}" y1="${m.t}" y2="${h - m.b}"/>`;
    body += `<text class="${TICK}" x="${xx}" y="${h - 6}" text-anchor="middle">${tickLabel(t)}</text>`;
  });
  body += `<line class="tm-chart__axis" x1="${m.l + 0.5}" x2="${m.l + 0.5}" y1="${m.t}" y2="${h - m.b}"/>`;
  const stops = [];
  c.xLabels.forEach((lab, i) => {
    const y0 = m.t + i * rowH + 4;
    body += `<text class="${TICK} tm-chart__tick--strong" x="${m.l - 6}" y="${y0 + (vis.length * PITCH - 3) / 2 + 3.5}" text-anchor="end">${esc(lab)}</text>`;
    const bh = PITCH;
    vis.forEach((s, k) => {
      const v = s.values[i] ?? 0;
      const yy = y0 + k * bh;
      body += `<rect class="tm-chart__bar ${seriesCls(s.si)}" x="${m.l + 1}" y="${yy}" width="${Math.max(1, x(v) - m.l - 1)}" height="${bh - 3}"/>`;
      body += `<text class="tm-chart__value" x="${x(v) + 4}" y="${yy + (bh - 3) / 2 + 3.5}">${fmtNum(v)}</text>`;
    });
    stops.push({
      x: m.l + plotW / 2,
      y: y0,
      band: { y1: y0 - 4, y2: y0 + rowH - 4 },
      title: lab,
      rows: vis.map((s) => ({ name: s.name, value: valueLabel(s.values[i], c.unit), cls: seriesCls(s.si) })),
    });
  });
  return { body, stops, h };
}

function hBarChart(c, w) {
  const items = c.series;
  const labW = Math.min(w * 0.4, Math.max(...items.map((d) => textW(d.label))) + 10);
  const max = Math.max(...items.map((d) => d.value));
  const rowH = 24;
  const m = { t: 4, r: 48, b: 4, l: labW };
  const h = m.t + rowH * items.length + m.b;
  const plotW = w - m.l - m.r;
  let body = `<line class="tm-chart__axis" x1="${m.l + 0.5}" x2="${m.l + 0.5}" y1="${m.t}" y2="${h - m.b}"/>`;
  const stops = [];
  items.forEach((d, i) => {
    const y0 = m.t + i * rowH;
    const bw = (d.value / max) * plotW;
    body += `<text class="${TICK} tm-chart__tick--strong" x="${m.l - 6}" y="${y0 + rowH / 2 + 3.5}" text-anchor="end">${esc(d.label)}</text>`;
    body += `<rect class="tm-chart__bar ${seriesCls(0)}" x="${m.l + 1}" y="${y0 + 5}" width="${Math.max(1, bw)}" height="${rowH - 10}"/>`;
    body += `<text class="tm-chart__value" x="${m.l + bw + 5}" y="${y0 + rowH / 2 + 3.5}">${fmtNum(d.value)}</text>`;
    stops.push({ x: m.l + bw, y: y0, band: { y1: y0, y2: y0 + rowH }, title: d.label, rows: [{ name: c.unit, value: fmtNum(d.value), cls: seriesCls(0) }] });
  });
  return { body, stops, h };
}

function histogram(c, w, h) {
  const items = c.series;
  const sc = niceScale(0, Math.max(...items.map((d) => d.count)));
  const m = { t: 22, r: 8, b: 22, l: marginLeft(sc.ticks, c.unit) };
  const { s: axis, y } = yAxis(sc, m, w, h, c.unit);
  const plotW = w - m.l - m.r;
  const band = plotW / items.length;
  let body = axis;
  const xAt = (i) => m.l + band * i + band / 2;
  items.forEach((d, i) => {
    body += `<rect class="tm-chart__bar ${seriesCls(0)}" x="${m.l + band * i + 1}" y="${y(d.count)}" width="${band - 2}" height="${y(0) - y(d.count)}"/>`;
    body += `<text class="tm-chart__value" x="${xAt(i)}" y="${y(d.count) - 4}" text-anchor="middle">${d.count}</text>`;
  });
  body += xLabels(items.map((d) => d.range), xAt, h - 6, plotW);
  const total = items.reduce((a, d) => a + d.count, 0);
  const stops = items.map((d, i) => ({
    x: xAt(i),
    y: m.t,
    cursor: { x: xAt(i), y1: m.t, y2: h - m.b },
    title: d.range,
    rows: [{ name: "Tasks", value: fmtNum(d.count), cls: seriesCls(0) }, { name: "Share", value: `${fmtNum((d.count / total) * 100, 1)}%` }],
  }));
  return { body, stops };
}

function donut(c, w, h) {
  const total = c.series.reduce((a, d) => a + d.value, 0);
  const size = Math.min(h, 150);
  const cx = size / 2 + 2;
  const cy = h / 2;
  const R = size / 2 - 2;
  const r = R * 0.6;
  let a0 = -Math.PI / 2;
  let body = "";
  const stops = [];
  c.series.forEach((d, i) => {
    const a1 = a0 + (d.value / total) * Math.PI * 2;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const p = (rad, a) => `${(cx + rad * Math.cos(a)).toFixed(2)},${(cy + rad * Math.sin(a)).toFixed(2)}`;
    body += `<path class="tm-chart__slice ${seriesCls(i)}" d="M${p(R, a0)}A${R},${R} 0 ${large} 1 ${p(R, a1)}L${p(r, a1)}A${r},${r} 0 ${large} 0 ${p(r, a0)}Z"/>`;
    const mid = (a0 + a1) / 2;
    stops.push({
      x: cx + ((R + r) / 2) * Math.cos(mid),
      y: cy + ((R + r) / 2) * Math.sin(mid),
      title: d.label,
      rows: [
        { name: "Value", value: c.unit === "USD" ? `$${fmtNum(d.value, 2)}` : `${fmtNum(d.value, 2)}${c.unit === "%" ? "%" : ""}`, cls: seriesCls(i) },
        { name: "Share", value: `${fmtNum((d.value / total) * 100, 1)}%` },
      ],
    });
    a0 = a1;
  });
  const totalLabel = c.unit === "USD" ? `$${fmtNum(total, 2)}` : c.unit === "%" ? `${fmtNum(total)}%` : fmtNum(total);
  body += `<text class="tm-chart__tick" x="${cx}" y="${cy - 3}" text-anchor="middle">TOTAL</text>`;
  body += `<text x="${cx}" y="${cy + 12}" text-anchor="middle" style="fill:var(--tm-text);font-size:13px;font-weight:700">${totalLabel}</text>`;
  // Value legend to the right — values + share, never color-only.
  const lx = size + 16;
  c.series.forEach((d, i) => {
    const ly = cy - (c.series.length * 20) / 2 + i * 20 + 12;
    const pct = `${fmtNum((d.value / total) * 100, 1)}%`;
    body += `<rect class="tm-chart__bar ${seriesCls(i)}" x="${lx}" y="${ly - 8}" width="10" height="10"/>`;
    body += `<text class="${TICK} tm-chart__tick--strong" x="${lx + 16}" y="${ly}">${esc(d.label)}</text>`;
    if (w - lx > 150) body += `<text class="tm-chart__value" x="${w - 4}" y="${ly}" text-anchor="end">${pct}</text>`;
  });
  return { body, stops, free: true };
}

function heatmap(c, w) {
  const rows = c.series;
  const labW = Math.max(...rows.map((r) => textW(r.row))) + 10;
  const cellH = 22;
  const m = { t: 2, r: 2, b: 20, l: labW };
  const h = m.t + rows.length * cellH + m.b;
  const n = c.xLabels.length;
  const cw = (w - m.l - m.r) / n;
  let body = "";
  const stops = [];
  rows.forEach((r, ri) => {
    const y0 = m.t + ri * cellH;
    body += `<text class="${TICK} tm-chart__tick--strong" x="${m.l - 6}" y="${y0 + cellH / 2 + 3.5}" text-anchor="end">${esc(r.row)}</text>`;
    r.values.forEach((v, i) => {
      const x0 = m.l + i * cw;
      body += `<rect class="tm-heat-cell" style="--_heat:${v}%" x="${x0}" y="${y0}" width="${cw}" height="${cellH}"/>`;
      if (cw > 22)
        body += `<text x="${x0 + cw / 2}" y="${y0 + cellH / 2 + 3.5}" text-anchor="middle" style="font-size:10px;font-variant-numeric:tabular-nums;fill:${
          v >= 55 ? "var(--tm-surface)" : "var(--tm-text)"
        }">${v}</text>`;
      stops.push({ x: x0 + cw / 2, y: y0, title: `${r.row} · ${c.xLabels[i]}`, rows: [{ name: "Utilization", value: `${v}%` }] });
    });
  });
  body += xLabels(c.xLabels, (i) => m.l + i * cw + cw / 2, h - 6, w - m.l - m.r);
  return { body, stops, h };
}

function scatter(c, w, h) {
  const pts = c.series;
  const xs = niceScale(Math.min(...pts.map((p) => p.x)) * 0.8, Math.max(...pts.map((p) => p.x)));
  const ys = niceScale(0, Math.max(...pts.map((p) => p.y)));
  const m = { t: 22, r: 14, b: 32, l: marginLeft(ys.ticks, "%") };
  const { s: axis, y } = yAxis(ys, m, w, h, "error %");
  const x = (v) => m.l + ((v - xs.lo) / (xs.hi - xs.lo)) * (w - m.l - m.r);
  let body = axis;
  xs.ticks.forEach((t) => {
    body += `<text class="${TICK}" x="${x(t)}" y="${h - 18}" text-anchor="middle">${tickLabel(t)}</text>`;
  });
  body += `<text class="${TICK}" x="${w - m.r}" y="${h - 4}" text-anchor="end">traffic, req/min →</text>`;
  const stops = [];
  pts.forEach((p) => {
    const hot = p.y >= 1;
    body += hot
      ? `<rect class="tm-chart__bar tm-series-6" x="${x(p.x) - 4}" y="${y(p.y) - 4}" width="8" height="8"/>`
      : `<circle class="tm-chart__point tm-chart__point--solid tm-series-1" cx="${x(p.x)}" cy="${y(p.y)}" r="4"/>`;
    body += `<text class="tm-chart__value" x="${x(p.x) + 7}" y="${y(p.y) + 3.5}">${esc(p.label)}</text>`;
    stops.push({ x: x(p.x), y: y(p.y), title: p.label, rows: [{ name: "Traffic", value: `${p.x} req/min` }, { name: "Error rate", value: `${fmtNum(p.y, 1)}%`, cls: hot ? "tm-series-6" : "tm-series-1" }] });
  });
  return { body, stops };
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

export function mountChart(el, chart, { height = 168 } = {}) {
  const hidden = new Set();
  let stops = [];
  let idx = -1;
  let lastW = 0;
  const tip = document.createElement("div");
  tip.className = "tm-chart-tooltip";
  tip.hidden = true;
  tip.setAttribute("aria-hidden", "true");
  const live = document.createElement("div");
  live.className = "tm-sr-only";
  live.setAttribute("aria-live", "polite");
  const host = document.createElement("div");
  el.append(host, tip, live);
  el.tabIndex = 0;
  el.setAttribute("role", "img");
  el.setAttribute("aria-roledescription", "chart");
  el.setAttribute("aria-label", `${summarize(chart)} Use left and right arrow keys to inspect values.`);

  function render() {
    const w = Math.max(220, Math.round(el.clientWidth || 320));
    lastW = w;
    let r;
    let h = height;
    switch (chart.kind) {
      case "line": r = lineChart(chart, w, h, hidden); break;
      case "area": r = lineChart(chart, w, h, hidden, true); break;
      case "stacked-bar": r = barChart(chart, w, h, hidden, "stacked"); break;
      case "grouped-bar": {
        const band = (w - 50) / chart.xLabels.length;
        r = Math.max(...chart.xLabels.map(textW)) + 6 > band ? hGroupedChart(chart, w, hidden) : barChart(chart, w, h, hidden, "grouped");
        break;
      }
      case "horizontal-bar": r = hBarChart(chart, w); break;
      case "histogram": r = histogram(chart, w, h); break;
      case "donut": r = donut(chart, w, Math.min(h, 150)); h = Math.min(h, 150); break;
      case "heatmap": r = heatmap(chart, w); break;
      case "scatter": r = scatter(chart, w, h); break;
      default: r = { body: "", stops: [] };
    }
    h = r.h ?? h;
    stops = r.stops;
    host.innerHTML = `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true">${r.body}<g class="pg-cursor"></g></svg>`;
    if (idx >= 0) show(idx);
  }

  function show(i) {
    idx = Math.max(0, Math.min(stops.length - 1, i));
    const s = stops[idx];
    if (!s) return;
    const g = host.querySelector(".pg-cursor");
    const svgW = lastW;
    g.innerHTML = s.cursor
      ? `<line class="tm-chart__cursor" x1="${s.cursor.x}" x2="${s.cursor.x}" y1="${s.cursor.y1}" y2="${s.cursor.y2}"/>`
      : s.band
        ? `<rect x="0" y="${s.band.y1}" width="${svgW}" height="${s.band.y2 - s.band.y1}" style="fill:var(--tm-hover);stroke:var(--tm-line-2);stroke-dasharray:2 2"/>`
        : `<circle cx="${s.x}" cy="${s.y}" r="7" style="fill:none;stroke:var(--tm-text);stroke-width:1.5"/>`;
    tip.innerHTML = `<div class="tm-chart-tooltip__title">${esc(s.title)}</div>${s.rows
      .map(
        (r) =>
          `<div class="tm-chart-tooltip__row">${r.cls ? `<span class="tm-legend__swatch ${r.cls}"></span>` : ""}<span>${esc(r.name)}</span><span>${esc(r.value)}</span></div>`,
      )
      .join("")}`;
    tip.hidden = false;
    const tw = tip.offsetWidth;
    let left = s.x + 12;
    if (left + tw > el.clientWidth) left = Math.max(0, s.x - tw - 12);
    tip.style.left = `${left}px`;
    tip.style.top = `${Math.max(0, s.y)}px`;
    live.textContent = `${s.title}: ${s.rows.map((r) => `${r.name} ${r.value}`).join(", ")}`;
  }
  function hide() {
    idx = -1;
    tip.hidden = true;
    const g = host.querySelector(".pg-cursor");
    if (g) g.innerHTML = "";
  }

  el.addEventListener("pointermove", (e) => {
    const r = el.getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    let best = -1;
    let bd = Infinity;
    stops.forEach((s, i) => {
      const d = s.cursor ? Math.abs(s.x - px) : s.band ? (py >= s.band.y1 && py <= s.band.y2 ? 0 : Infinity) : Math.hypot(s.x - px, s.y - py);
      if (d < bd) { bd = d; best = i; }
    });
    if (best >= 0 && bd < 60) show(best);
    else hide();
  });
  el.addEventListener("pointerleave", hide);
  el.addEventListener("blur", hide);
  el.addEventListener("keydown", (e) => {
    if (["ArrowRight", "ArrowDown"].includes(e.key)) { e.preventDefault(); show(idx + 1); }
    else if (["ArrowLeft", "ArrowUp"].includes(e.key)) { e.preventDefault(); show(idx < 0 ? stops.length - 1 : idx - 1); }
    else if (e.key === "Home") { e.preventDefault(); show(0); }
    else if (e.key === "End") { e.preventDefault(); show(stops.length - 1); }
    else if (e.key === "Escape") hide();
  });

  const ro = new ResizeObserver(() => {
    if (Math.abs((el.clientWidth || 0) - lastW) > 4) render();
  });
  ro.observe(el);
  render();
  return {
    toggle(name) {
      hidden.has(name) ? hidden.delete(name) : hidden.add(name);
      render();
      return !hidden.has(name);
    },
    destroy() { ro.disconnect(); },
  };
}

// Inline sparkline for KPI tiles (decorative; the value is in text).
export function sparkline(values, { w = 84, h = 22, tone = "tm-series-1" } = {}) {
  if (!values?.length) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const x = (i) => 1 + (i * (w - 2)) / (values.length - 1);
  const y = (v) => h - 2 - ((v - min) / (max - min || 1)) * (h - 4);
  const d = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
  return `<svg class="pg-spark ${tone}" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true"><path class="tm-chart__area" d="${d}L${w - 1},${h}L1,${h}Z"/><path class="tm-chart__line" style="stroke-width:1.5" d="${d}"/><circle class="tm-chart__point tm-chart__point--solid" cx="${x(values.length - 1)}" cy="${y(values.at(-1))}" r="2"/></svg>`;
}
