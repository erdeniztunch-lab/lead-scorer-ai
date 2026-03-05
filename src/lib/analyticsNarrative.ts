import { type Lead } from "@/data/mockLeads";
import { type LeadUIStateMap } from "@/lib/leadUiStateStore";
import { type ScoringRunSummary } from "@/lib/scoringStore";

export interface AnalyticsInsight {
  id: string;
  title: string;
  value: string;
  direction: "up" | "down" | "neutral";
  explanation: string;
}

export interface AnalyticsSegmentRow {
  label: string;
  leadCount: number;
  avgScore: number;
  hotRate: number;
}

export interface AnalyticsFunnel {
  imported: number;
  scored: number;
  prioritized: number;
  contacted: number;
}

export interface AnalyticsComparison {
  fromRunId: string;
  toRunId: string;
  avgScoreDelta: number;
  hotDelta: number;
  warmDelta: number;
  coldDelta: number;
  leadCountDelta: number;
}

export interface AnalyticsNarrativeSummary {
  narrativeLine: string;
  comparison: AnalyticsComparison | null;
  sourceSegments: AnalyticsSegmentRow[];
  tierSegments: AnalyticsSegmentRow[];
  funnel: AnalyticsFunnel;
  insights: AnalyticsInsight[];
  trend: Array<{
    runId: string;
    startedAt: string;
    avgScore: number;
    leadCount: number;
  }>;
  lastRun: ScoringRunSummary | null;
}

export function buildRunComparison(runs: ScoringRunSummary[]): AnalyticsComparison | null {
  if (runs.length < 2) return null;
  const to = runs[0];
  const from = runs[1];
  return {
    fromRunId: from.runId,
    toRunId: to.runId,
    avgScoreDelta: Number((to.averageScore - from.averageScore).toFixed(2)),
    hotDelta: 0,
    warmDelta: 0,
    coldDelta: 0,
    leadCountDelta: to.leadCount - from.leadCount,
  };
}

function toSegmentRow(label: string, leads: Lead[]): AnalyticsSegmentRow {
  const leadCount = leads.length;
  const avgScore = Number((leads.reduce((sum, lead) => sum + lead.score, 0) / Math.max(1, leadCount)).toFixed(2));
  const hotRate = Number(((leads.filter((lead) => lead.tier === "hot").length / Math.max(1, leadCount)) * 100).toFixed(1));
  return { label, leadCount, avgScore, hotRate };
}

export function buildSourceSegments(leads: Lead[]): AnalyticsSegmentRow[] {
  const buckets = new Map<string, Lead[]>();
  leads.forEach((lead) => {
    const key = lead.source || "Unknown";
    buckets.set(key, [...(buckets.get(key) ?? []), lead]);
  });
  return [...buckets.entries()]
    .map(([label, items]) => toSegmentRow(label, items))
    .sort((a, b) => b.leadCount - a.leadCount);
}

export function buildTierSegments(leads: Lead[]): AnalyticsSegmentRow[] {
  const tiers: Array<Lead["tier"]> = ["hot", "warm", "cold"];
  return tiers.map((tier) => toSegmentRow(tier.toUpperCase(), leads.filter((lead) => lead.tier === tier)));
}

export function buildQualityFunnel(leads: Lead[], leadUiState: LeadUIStateMap): AnalyticsFunnel {
  const imported = leads.length;
  const scored = leads.length;
  const prioritized = leads.filter((lead) => lead.tier === "hot" || lead.tier === "warm").length;
  const contacted = leads.filter((lead) => leadUiState[lead.id]?.status === "contacted").length;
  return { imported, scored, prioritized, contacted };
}

export function buildInsights(leads: Lead[]): AnalyticsInsight[] {
  if (!leads.length) {
    return [
      {
        id: "empty",
        title: "No lead data yet",
        value: "0",
        direction: "neutral",
        explanation: "Import or score leads to unlock analytics insights.",
      },
    ];
  }

  const signalTotals = new Map<string, { label: string; total: number; count: number }>();
  leads.forEach((lead) => {
    lead.scoreBreakdown.forEach((item) => {
      const prev = signalTotals.get(item.key) ?? { label: item.label, total: 0, count: 0 };
      prev.total += item.value;
      prev.count += 1;
      signalTotals.set(item.key, prev);
    });
  });

  const averages = [...signalTotals.values()].map((item) => ({
    label: item.label,
    avg: item.total / Math.max(1, item.count),
  }));
  const strongestPositive = [...averages].sort((a, b) => b.avg - a.avg)[0];
  const strongestNegative = [...averages].sort((a, b) => a.avg - b.avg)[0];

  return [
    {
      id: "positive",
      title: "Most influential positive signal",
      value: strongestPositive ? `${strongestPositive.label} (${strongestPositive.avg.toFixed(2)})` : "n/a",
      direction: "up",
      explanation: "This signal contributes the highest average positive impact across scored leads.",
    },
    {
      id: "negative",
      title: "Largest drop driver",
      value: strongestNegative ? `${strongestNegative.label} (${strongestNegative.avg.toFixed(2)})` : "n/a",
      direction: "down",
      explanation: "This signal is the biggest average drag and explains where score quality falls.",
    },
  ];
}

export function buildAnalyticsSummary(
  leads: Lead[],
  runs: ScoringRunSummary[],
  leadUiState: LeadUIStateMap,
): AnalyticsNarrativeSummary {
  const comparison = buildRunComparison(runs);
  const sourceSegments = buildSourceSegments(leads);
  const tierSegments = buildTierSegments(leads);
  const funnel = buildQualityFunnel(leads, leadUiState);
  const insights = buildInsights(leads);
  const trend = runs.slice(0, 7).map((run) => ({
    runId: run.runId,
    startedAt: run.timestamp,
    avgScore: run.averageScore,
    leadCount: run.leadCount,
  }));

  const narrativeLine = comparison
    ? `Compared to previous run, average score moved ${comparison.avgScoreDelta >= 0 ? "up" : "down"} by ${Math.abs(comparison.avgScoreDelta)} points.`
    : `Single-run prototype view: ${leads.length} leads scored, focus on segments and funnel quality.`;

  return {
    narrativeLine,
    comparison,
    sourceSegments,
    tierSegments,
    funnel,
    insights,
    trend,
    lastRun: runs[0] ?? null,
  };
}

