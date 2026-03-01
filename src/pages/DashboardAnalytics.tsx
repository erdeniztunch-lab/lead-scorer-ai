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
        setSummary({
          scoreDistribution: distribution,
          topReasons,
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
            Guest analytics is based on demo/session data only and is not persisted.
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
