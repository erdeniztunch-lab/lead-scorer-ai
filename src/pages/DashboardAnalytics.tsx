import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/apiClient";

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
  const [summary, setSummary] = useState<AnalyticsSummary>({
    scoreDistribution: { "0-39": 0, "40-59": 0, "60-79": 0, "80-100": 0 },
    topReasons: [],
    lastScoringRun: null,
  });

  useEffect(() => {
    const load = async () => {
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
  }, []);

  return (
    <DashboardShell title="Analytics">
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
