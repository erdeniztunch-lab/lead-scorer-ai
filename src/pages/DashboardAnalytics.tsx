import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/apiClient";
import { mockLeads } from "@/data/mockLeads";
import { isGuestSession } from "@/lib/session";
import { DEFAULT_SCORING_CONFIG, scoreLeads } from "@/lib/scoringEngine";

interface AnalyticsSummary {
  scoreDistribution: Record<string, number>;
  topReasons: Array<{ reason: string; count: number }>;
  topSignals: Array<{ key: string; label: string; count: number; avgContribution: number }>;
  tierTrend: Array<{ runId: string; startedAt: string; avgScore: number; leadCount: number; hot: number; warm: number; cold: number }>;
  configImpact: {
    fromRunId: string | null;
    toRunId: string | null;
    avgScoreDelta: number;
    hotDelta: number;
    warmDelta: number;
    coldDelta: number;
    leadCountDelta: number;
  } | null;
  lastScoringRun: {
    trigger_type: string;
    config_version: string;
    started_at: string;
  } | null;
}

const DashboardAnalytics = () => {
  const guestMode = isGuestSession();
  const [summary, setSummary] = useState<AnalyticsSummary>({
    scoreDistribution: { "0-39": 0, "40-59": 0, "60-79": 0, "80-100": 0 },
    topReasons: [],
    topSignals: [],
    tierTrend: [],
    configImpact: null,
    lastScoringRun: null,
  });

  useEffect(() => {
    const load = async () => {
      if (guestMode) {
        const leads = scoreLeads(mockLeads, DEFAULT_SCORING_CONFIG);
        const distribution = leads.reduce<Record<string, number>>(
          (acc, lead) => {
            if (lead.score >= 80) acc["80-100"] += 1;
            else if (lead.score >= 60) acc["60-79"] += 1;
            else if (lead.score >= 40) acc["40-59"] += 1;
            else acc["0-39"] += 1;
            return acc;
          },
          { "0-39": 0, "40-59": 0, "60-79": 0, "80-100": 0 },
        );
        const reasonCounts = new Map<string, number>();
        leads.forEach((lead) => {
          lead.reasons.forEach((reason) => {
            reasonCounts.set(reason, (reasonCounts.get(reason) ?? 0) + 1);
          });
        });
        const topReasons = [...reasonCounts.entries()]
          .map(([reason, count]) => ({ reason, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        const signalMap = new Map<string, { label: string; count: number; total: number }>();
        leads.forEach((lead) => {
          lead.scoreBreakdown.forEach((item) => {
            const existing = signalMap.get(item.key) ?? { label: item.label, count: 0, total: 0 };
            existing.count += 1;
            existing.total += item.value;
            signalMap.set(item.key, existing);
          });
        });
        const topSignals = [...signalMap.entries()]
          .map(([key, value]) => ({
            key,
            label: value.label,
            count: value.count,
            avgContribution: Number((value.total / Math.max(1, value.count)).toFixed(2)),
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        const hot = leads.filter((lead) => lead.tier === "hot").length;
        const warm = leads.filter((lead) => lead.tier === "warm").length;
        const cold = leads.filter((lead) => lead.tier === "cold").length;
        setSummary({
          scoreDistribution: distribution,
          topReasons,
          topSignals,
          tierTrend: [
            {
              runId: "guest-session-run",
              startedAt: new Date().toISOString(),
              avgScore: Number((leads.reduce((sum, lead) => sum + lead.score, 0) / Math.max(1, leads.length)).toFixed(2)),
              leadCount: leads.length,
              hot,
              warm,
              cold,
            },
          ],
          configImpact: {
            fromRunId: null,
            toRunId: "guest-session-run",
            avgScoreDelta: 0,
            hotDelta: 0,
            warmDelta: 0,
            coldDelta: 0,
            leadCountDelta: 0,
          },
          lastScoringRun: {
            trigger_type: "guest_session",
            config_version: DEFAULT_SCORING_CONFIG.version,
            started_at: new Date().toISOString(),
          },
        });
        return;
      }

      const response = await apiFetch("/api/analytics/summary", { method: "GET" });
      if (!response.ok) {
        return;
      }
      const payload = await response.json();
      setSummary({
        scoreDistribution: payload.scoreDistribution ?? { "0-39": 0, "40-59": 0, "60-79": 0, "80-100": 0 },
        topReasons: payload.topReasons ?? [],
        topSignals: payload.topSignals ?? [],
        tierTrend: payload.tierTrend ?? [],
        configImpact: payload.configImpact ?? null,
        lastScoringRun: payload.lastScoringRun ?? null,
      });
    };
    void load();
  }, [guestMode]);

  return (
    <DashboardShell title="Analytics">
      {guestMode && (
        <Card className="mb-4 border-amber-300 bg-amber-50">
          <CardContent className="p-3 text-sm text-amber-900">
            Session-only mode is active. Analytics is based on demo/session data and is not persisted.
          </CardContent>
        </Card>
      )}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Score Distribution</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {Object.entries(summary.scoreDistribution).map(([label, value]) => <p key={label}>{label}: <strong>{value}</strong></p>)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Top Reason Frequency</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {summary.topReasons.length === 0 && <p className="text-muted-foreground">No reasons yet.</p>}
            {summary.topReasons.map((item) => <p key={item.reason}>{item.reason}: <strong>{item.count}</strong></p>)}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Top Signals</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {summary.topSignals.length === 0 && <p className="text-muted-foreground">No signal data yet.</p>}
            {summary.topSignals.map((item) => (
              <p key={item.key}>
                {item.label}: <strong>{item.count}</strong> (avg {item.avgContribution})
              </p>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Config Impact</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {!summary.configImpact && <p className="text-muted-foreground">Not enough scoring runs to compare yet.</p>}
            {summary.configImpact && (
              <>
                <p>Avg score delta: <strong>{summary.configImpact.avgScoreDelta}</strong></p>
                <p>Lead count delta: <strong>{summary.configImpact.leadCountDelta}</strong></p>
                <p>Hot/Warm/Cold delta: <strong>{summary.configImpact.hotDelta}</strong> / <strong>{summary.configImpact.warmDelta}</strong> / <strong>{summary.configImpact.coldDelta}</strong></p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader><CardTitle className="text-base">Tier Trend (Last 7 Runs)</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {summary.tierTrend.length === 0 && <p className="text-muted-foreground">No trend data yet.</p>}
          {summary.tierTrend.map((point) => (
            <p key={point.runId}>
              {new Date(point.startedAt).toLocaleString()} {"->"} hot {point.hot}, warm {point.warm}, cold {point.cold}, avg {point.avgScore}
            </p>
          ))}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader><CardTitle className="text-base">Last Scoring Run</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {summary.lastScoringRun
            ? `${new Date(summary.lastScoringRun.started_at).toLocaleString()} (${summary.lastScoringRun.trigger_type}, ${summary.lastScoringRun.config_version})`
            : "No scoring run found."}
        </CardContent>
      </Card>
    </DashboardShell>
  );
};

export default DashboardAnalytics;
