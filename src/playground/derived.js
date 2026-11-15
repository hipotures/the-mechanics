// Explicitly documented derivations from fixtures/demo-data.json.
// Nothing here invents measurements: every number is read from the fixture;
// this file only maps fixture entries onto presentation decisions.
// See docs/derived-data.md for the human-readable version.

// KPI → which direction is "good" (drives trend color + icon, never color alone)
// and which fixture chart supplies the sparkline values.
export const KPI_META = {
  requests: { good: "up", spark: (c) => sumSeries(c.requests) },
  tokens: { good: "neutral", spark: (c) => sumSeries(c.tokens) },
  cache: { good: "up", spark: (c) => c["cache-hit"].series[0].values },
  latency: { good: "down", spark: (c) => c.ttft.series[1].values },
  cost: { good: "down", spark: (c) => c["cost-trend"].series[0].values },
  errors: { good: "down", spark: (c) => c["error-rate"].series.map((p) => p.y) },
  workers: { good: "up", spark: null },
  queue: { good: "down", spark: (c) => c.queue.series[0].values },
};

function sumSeries(chart) {
  return chart.series[0].values.map((_, i) => chart.series.reduce((a, s) => a + s.values[i], 0));
}

// Analytics service filter: which panels belong to which fixture service option.
export const SERVICE_TAGS = {
  requests: ["API", "Queue"],
  tokens: ["API"],
  ttft: ["API", "GPU Workers"],
  "cost-trend": ["GPU Workers"],
  "provider-share": ["GPU Workers"],
  "model-latency": ["GPU Workers"],
  "cache-hit": ["API"],
  queue: ["Queue"],
  "error-rate": ["API"],
  "gpu-memory": ["GPU Workers"],
  durations: ["Queue"],
  network: ["API"],
  "worker-util": ["GPU Workers"],
  endpoints: ["API"],
  "model-cost": ["GPU Workers"],
  "incident-log": ["API", "GPU Workers", "Queue"],
};

// Analytics regions: grouping of the 16 fixture charts into three Level-1 regions.
export const ANALYTICS_REGIONS = [
  { id: "traffic", title: "Traffic & throughput", charts: ["requests", "tokens", "queue", "network", "endpoints", "durations"] },
  { id: "latency", title: "Latency & reliability", charts: ["ttft", "model-latency", "error-rate", "incident-log"] },
  { id: "capacity", title: "Capacity & cost", charts: ["gpu-memory", "worker-util", "cache-hit", "cost-trend", "provider-share", "model-cost"] },
];

// Which panel displays the fixture's stalePanel overlay (17 minutes delayed).
export const STALE_CHART = "gpu-memory";

// Workspace: annotation type → which preview tab lists it.
export const ANNOTATION_TAB = { place: "Terms", facility: "Terms", role: "Observations" };
