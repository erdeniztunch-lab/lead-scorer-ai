import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type Lead } from "@/data/mockLeads";
import { formatHoursAverage, formatLift, formatPrecisionAt10 } from "@/lib/leadMetrics";
import { loadLeadsFromStorage } from "@/lib/leadStore";
import { loadScoringRuns } from "@/lib/scoringStore";

const DashboardAnalytics = () => {
  const [leads, setLeads] = useState<Lead[]>(() => loadLeadsFromStorage());
  const [lastRun, setLastRun] = useState(() => loadScoringRuns(1)[0] ?? null);

  useEffect(() => {
    const refresh = () => {
      setLeads(loadLeadsFromStorage());
      setLastRun(loadScoringRuns(1)[0] ?? null);
    };
    window.addEventListener("lead-scorer:leads-updated", refresh);
    window.addEventListener("lead-scorer:scoring-runs-updated", refresh);
    return () => {
      window.removeEventListener("lead-scorer:leads-updated", refresh);
      window.removeEventListener("lead-scorer:scoring-runs-updated", refresh);
    };
  }, []);

  const distribution = useMemo(() => {
    const bins = { "0-39": 0, "40-59": 0, "60-79": 0, "80-100": 0 };
    leads.forEach((lead) => {
      if (lead.score < 40) bins["0-39"] += 1;
      else if (lead.score < 60) bins["40-59"] += 1;
      else if (lead.score < 80) bins["60-79"] += 1;
      else bins["80-100"] += 1;
    });
    return bins;
  }, [leads]);

  const topReasons = useMemo(() => {
    const map = new Map<string, number>();
    leads.forEach((lead) => {
      lead.reasons.forEach((reason) => {
        map.set(reason, (map.get(reason) ?? 0) + 1);
      });
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [leads]);

  return (
    <DashboardShell title="Analytics">
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader><CardTitle className="text-base">Precision@10</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{formatPrecisionAt10(leads)}</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Average First Contact</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{formatHoursAverage(leads)}</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Lift</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{formatLift(leads)}</p></CardContent></Card>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Score Distribution</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {Object.entries(distribution).map(([label, value]) => <p key={label}>{label}: <strong>{value}</strong></p>)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Top Reason Frequency</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {topReasons.length === 0 && <p className="text-muted-foreground">No reasons yet.</p>}
            {topReasons.map(([reason, count]) => <p key={reason}>{reason}: <strong>{count}</strong></p>)}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader><CardTitle className="text-base">Last Scoring Run</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {lastRun ? `${new Date(lastRun.timestamp).toLocaleString()} (${lastRun.trigger}, ${lastRun.configVersion})` : "No scoring run found."}
        </CardContent>
      </Card>
    </DashboardShell>
  );
};

export default DashboardAnalytics;
