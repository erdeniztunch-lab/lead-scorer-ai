import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildAnalyticsSummary, type AnalyticsNarrativeSummary } from "@/lib/analyticsNarrative";
import { loadLeadsFromStorage } from "@/lib/leadStore";
import { loadLeadUiState } from "@/lib/leadUiStateStore";
import { trackPrototypeEvent } from "@/lib/prototypeTelemetry";
import { loadScoringRuns, type ScoringRunSummary } from "@/lib/scoringStore";

const DashboardAnalytics = () => {
  const [summary, setSummary] = useState<AnalyticsNarrativeSummary>({
    narrativeLine: "Loading analytics...",
    comparison: null,
    sourceSegments: [],
    tierSegments: [],
    funnel: { imported: 0, scored: 0, prioritized: 0, contacted: 0 },
    insights: [],
    trend: [],
    lastRun: null,
  });

  useEffect(() => {
    const load = () => {
      trackPrototypeEvent("analytics_viewed", { page: "dashboard_analytics" });
      const leads = loadLeadsFromStorage();
      const leadUiState = loadLeadUiState();
      let runs = loadScoringRuns(7);

      if (!runs.length) {
        const syntheticRun: ScoringRunSummary = {
          runId: "prototype-session-run",
          timestamp: new Date().toISOString(),
          leadCount: leads.length,
          averageScore: Number((leads.reduce((sum, lead) => sum + lead.score, 0) / Math.max(1, leads.length)).toFixed(2)),
          configVersion: leads[0]?.scoreVersion ?? "prototype",
          trigger: "import",
        };
        runs = [syntheticRun];
      }

      setSummary(buildAnalyticsSummary(leads, runs, leadUiState));
    };

    load();
    window.addEventListener("lead-scorer:leads-updated", load);
    window.addEventListener("lead-scorer:scoring-runs-updated", load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener("lead-scorer:leads-updated", load);
      window.removeEventListener("lead-scorer:scoring-runs-updated", load);
      window.removeEventListener("storage", load);
    };
  }, []);

  return (
    <DashboardShell title="Analytics">
      <Card className="mb-4 border-amber-300 bg-amber-50">
        <CardContent className="p-3 text-sm text-amber-900">
          Prototype mode is active. Analytics is based on session/mock data and is not persisted.
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">What Changed and Why</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">{summary.narrativeLine}</CardContent>
      </Card>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Before/After Comparison</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {!summary.comparison && <p className="text-muted-foreground">Not enough runs to compare yet.</p>}
            {summary.comparison && (
              <>
                <p>Avg score delta: <strong>{summary.comparison.avgScoreDelta}</strong></p>
                <p>Lead count delta: <strong>{summary.comparison.leadCountDelta}</strong></p>
                <p className="text-muted-foreground">Run: {summary.comparison.fromRunId} {"->"} {summary.comparison.toRunId}</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Quality Funnel</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Imported: <strong>{summary.funnel.imported}</strong></p>
            <p>Scored: <strong>{summary.funnel.scored}</strong></p>
            <p>Prioritized (hot+warm): <strong>{summary.funnel.prioritized}</strong></p>
            <p>Contacted: <strong>{summary.funnel.contacted}</strong></p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Source Segments</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {summary.sourceSegments.length === 0 && <p className="text-muted-foreground">No segment data yet.</p>}
            {summary.sourceSegments.map((item) => (
              <p key={item.label}>
                {item.label}: <strong>{item.leadCount}</strong> (avg {item.avgScore}, hot {item.hotRate}%)
              </p>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Tier Segments</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {summary.tierSegments.map((item) => (
              <p key={item.label}>
                {item.label}: <strong>{item.leadCount}</strong> (avg {item.avgScore}, hot {item.hotRate}%)
              </p>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader><CardTitle className="text-base">Insight Callouts</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {summary.insights.map((insight) => (
            <div key={insight.id} className="rounded border p-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{insight.title}</p>
              <p className="font-medium">{insight.value}</p>
              <p className="text-muted-foreground">{insight.explanation}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader><CardTitle className="text-base">Trend (Last 7 Runs)</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {summary.trend.length === 0 && <p className="text-muted-foreground">No trend data yet.</p>}
          {summary.trend.map((point) => (
            <p key={point.runId}>
              {new Date(point.startedAt).toLocaleString()} {"->"} avg {point.avgScore}, leads {point.leadCount}
            </p>
          ))}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader><CardTitle className="text-base">Last Scoring Run</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {summary.lastRun
            ? `${new Date(summary.lastRun.timestamp).toLocaleString()} (${summary.lastRun.trigger}, ${summary.lastRun.configVersion})`
            : "No scoring run found."}
        </CardContent>
      </Card>
    </DashboardShell>
  );
};

export default DashboardAnalytics;
