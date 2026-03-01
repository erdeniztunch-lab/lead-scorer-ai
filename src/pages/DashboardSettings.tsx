import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { type Lead } from "@/data/mockLeads";
import { useLeadScoring } from "@/hooks/useLeadScoring";
import { loadLeadsFromStorage, saveLeadsToStorage } from "@/lib/leadStore";
import { loadScoringRuns } from "@/lib/scoringStore";
import { useToast } from "@/hooks/use-toast";

const sourceKeys = ["referral", "webinar", "website", "linkedin", "google ads", "cold outbound"] as const;

const DashboardSettings = () => {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>(() => loadLeadsFromStorage());
  const [runs, setRuns] = useState(() => loadScoringRuns(5));
  const { scoringConfig, saveConfig, rescore } = useLeadScoring();
  const [draft, setDraft] = useState(() => scoringConfig);
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    setDraft(scoringConfig);
  }, [scoringConfig]);

  useEffect(() => {
    const refresh = () => {
      setLeads(loadLeadsFromStorage());
      setRuns(loadScoringRuns(5));
    };
    window.addEventListener("lead-scorer:leads-updated", refresh);
    window.addEventListener("lead-scorer:scoring-runs-updated", refresh);
    return () => {
      window.removeEventListener("lead-scorer:leads-updated", refresh);
      window.removeEventListener("lead-scorer:scoring-runs-updated", refresh);
    };
  }, []);

  const totals = useMemo(() => ({
    hot: leads.filter((lead) => lead.tier === "hot").length,
    warm: leads.filter((lead) => lead.tier === "warm").length,
    cold: leads.filter((lead) => lead.tier === "cold").length,
  }), [leads]);

  const validateDraft = (): string => {
    if (draft.thresholds.hotMin <= draft.thresholds.warmMin) {
      return "hotMin must be greater than warmMin.";
    }
    const values = [
      draft.thresholds.hotMin,
      draft.thresholds.warmMin,
      draft.weights.engagement.emailOpensCap,
      draft.weights.engagement.emailClicksCap,
      draft.weights.engagement.pageViewsCap,
      draft.weights.engagement.demoRequestedBonus,
      draft.weights.fit.industryMatch,
      draft.weights.fit.companySizeFit,
      draft.weights.fit.budgetFit,
      draft.weights.recency.within1Day,
      draft.weights.recency.within3Days,
      draft.weights.recency.within7Days,
      draft.weights.recency.older,
      ...sourceKeys.map((key) => draft.weights.sourcePrior[key] ?? 0),
    ];
    if (values.some((value) => Number.isNaN(value) || value < -100 || value > 100)) {
      return "All values must be between -100 and 100.";
    }
    return "";
  };

  const updateNumber = (path: string, value: number) => {
    setDraft((current) => {
      const next = structuredClone(current);
      const keys = path.split(".");
      let target: unknown = next;
      keys.slice(0, -1).forEach((key) => {
        target = (target as Record<string, unknown>)[key];
      });
      (target as Record<string, unknown>)[keys[keys.length - 1]] = Number.isFinite(value) ? value : 0;
      return next;
    });
  };

  const handleSaveAndRescore = () => {
    const error = validateDraft();
    setValidationError(error);
    if (error) {
      return;
    }
    const nextConfig = { ...draft, version: `v1.${Date.now()}` };
    saveConfig(nextConfig);
    const result = rescore(leads, "settings_save");
    setLeads(result.leads);
    saveLeadsToStorage(result.leads);
    setRuns(loadScoringRuns(5));
    toast({
      title: "Config saved",
      description: `Rescored ${result.run.leadCount} leads with ${result.run.configVersion}.`,
    });
  };

  return (
    <DashboardShell title="Settings">
      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Tier Thresholds</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Hot min</span>
              <Input type="number" value={draft.thresholds.hotMin} onChange={(event) => updateNumber("thresholds.hotMin", Number(event.target.value))} />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Warm min</span>
              <Input type="number" value={draft.thresholds.warmMin} onChange={(event) => updateNumber("thresholds.warmMin", Number(event.target.value))} />
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Weights</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-sm"><span className="text-muted-foreground">Email opens cap</span><Input type="number" value={draft.weights.engagement.emailOpensCap} onChange={(event) => updateNumber("weights.engagement.emailOpensCap", Number(event.target.value))} /></label>
            <label className="space-y-1 text-sm"><span className="text-muted-foreground">Email clicks cap</span><Input type="number" value={draft.weights.engagement.emailClicksCap} onChange={(event) => updateNumber("weights.engagement.emailClicksCap", Number(event.target.value))} /></label>
            <label className="space-y-1 text-sm"><span className="text-muted-foreground">Page views cap</span><Input type="number" value={draft.weights.engagement.pageViewsCap} onChange={(event) => updateNumber("weights.engagement.pageViewsCap", Number(event.target.value))} /></label>
            <label className="space-y-1 text-sm"><span className="text-muted-foreground">Demo requested bonus</span><Input type="number" value={draft.weights.engagement.demoRequestedBonus} onChange={(event) => updateNumber("weights.engagement.demoRequestedBonus", Number(event.target.value))} /></label>
            <label className="space-y-1 text-sm"><span className="text-muted-foreground">Industry match</span><Input type="number" value={draft.weights.fit.industryMatch} onChange={(event) => updateNumber("weights.fit.industryMatch", Number(event.target.value))} /></label>
            <label className="space-y-1 text-sm"><span className="text-muted-foreground">Company size fit</span><Input type="number" value={draft.weights.fit.companySizeFit} onChange={(event) => updateNumber("weights.fit.companySizeFit", Number(event.target.value))} /></label>
            <label className="space-y-1 text-sm"><span className="text-muted-foreground">Budget fit</span><Input type="number" value={draft.weights.fit.budgetFit} onChange={(event) => updateNumber("weights.fit.budgetFit", Number(event.target.value))} /></label>
            <label className="space-y-1 text-sm"><span className="text-muted-foreground">Recency {"<="} 1 day</span><Input type="number" value={draft.weights.recency.within1Day} onChange={(event) => updateNumber("weights.recency.within1Day", Number(event.target.value))} /></label>
            <label className="space-y-1 text-sm"><span className="text-muted-foreground">Recency {"<="} 3 days</span><Input type="number" value={draft.weights.recency.within3Days} onChange={(event) => updateNumber("weights.recency.within3Days", Number(event.target.value))} /></label>
            <label className="space-y-1 text-sm"><span className="text-muted-foreground">Recency {"<="} 7 days</span><Input type="number" value={draft.weights.recency.within7Days} onChange={(event) => updateNumber("weights.recency.within7Days", Number(event.target.value))} /></label>
            <label className="space-y-1 text-sm"><span className="text-muted-foreground">Recency older</span><Input type="number" value={draft.weights.recency.older} onChange={(event) => updateNumber("weights.recency.older", Number(event.target.value))} /></label>
            {sourceKeys.map((key) => (
              <label key={key} className="space-y-1 text-sm"><span className="text-muted-foreground">Source: {key}</span><Input type="number" value={draft.weights.sourcePrior[key] ?? 0} onChange={(event) => updateNumber(`weights.sourcePrior.${key}`, Number(event.target.value))} /></label>
            ))}
          </CardContent>
        </Card>

        {validationError && <p className="text-sm text-destructive">{validationError}</p>}
        <Button onClick={handleSaveAndRescore}>Save and re-score all leads</Button>

        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardHeader><CardTitle className="text-base">Total Leads</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{leads.length}</p></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-base">Hot</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{totals.hot}</p></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-base">Warm</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{totals.warm}</p></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-base">Cold</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{totals.cold}</p></CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Last 5 Scoring Runs</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {runs.length === 0 && <p className="text-muted-foreground">No scoring runs yet.</p>}
            {runs.map((run) => (
              <div key={run.runId} className="rounded-md border p-2">
                <p><strong>{new Date(run.timestamp).toLocaleString()}</strong> - {run.trigger}</p>
                <p className="text-muted-foreground">leads: {run.leadCount} | avg: {run.averageScore} | version: {run.configVersion}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
};

export default DashboardSettings;
