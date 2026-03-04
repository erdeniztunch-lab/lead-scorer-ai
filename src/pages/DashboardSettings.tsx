import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { DEFAULT_SCORING_CONFIG, mergeScoringConfig, validateScoringConfig, type ScoringConfig } from "@/lib/scoringEngine";
import { mockLeads } from "@/data/mockLeads";
import { scoreLeads } from "@/lib/scoringEngine";

interface ScoreRunRow {
  id: string;
  trigger_type: string;
  config_version: string;
  lead_count: number;
  average_score: number;
  started_at: string;
}

const sourceKeys = ["referral", "webinar", "website", "linkedin", "google ads", "cold outbound"] as const;

const DashboardSettings = () => {
  const { toast } = useToast();
  const [draft, setDraft] = useState<ScoringConfig>(DEFAULT_SCORING_CONFIG);
  const [runs, setRuns] = useState<ScoreRunRow[]>([]);
  const [validationError, setValidationError] = useState("");
  const [stats, setStats] = useState({ total: 0, hot: 0, warm: 0, cold: 0 });
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const totals = useMemo(() => stats, [stats]);

  const loadConfig = async () => {
    setDraft(DEFAULT_SCORING_CONFIG);
  };

  const loadRuns = async () => {
    setRuns([]);
  };

  const loadKpis = async () => {
    const scored = scoreLeads(mockLeads, draft);
    setStats({
      total: scored.length,
      hot: scored.filter((lead) => lead.tier === "hot").length,
      warm: scored.filter((lead) => lead.tier === "warm").length,
      cold: scored.filter((lead) => lead.tier === "cold").length,
    });
  };

  useEffect(() => {
    void Promise.all([loadConfig(), loadRuns(), loadKpis()]);
  }, []);

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

  const applyPreset = (preset: ScoringConfig["preset"]) => {
    if (preset === "conservative") {
      setDraft((current) =>
        mergeScoringConfig({
          ...current,
          preset,
          thresholds: { hotMin: 85, warmMin: 70 },
          weights: {
            ...current.weights,
            engagement: { ...current.weights.engagement, emailOpensCap: 12, emailClicksCap: 14 },
          },
        }),
      );
      return;
    }
    if (preset === "aggressive") {
      setDraft((current) =>
        mergeScoringConfig({
          ...current,
          preset,
          thresholds: { hotMin: 75, warmMin: 55 },
          weights: {
            ...current.weights,
            fit: { ...current.weights.fit, industryMatch: 13, companySizeFit: 9 },
          },
        }),
      );
      return;
    }
    setDraft((current) => mergeScoringConfig({ ...current, preset: "balanced" }));
  };

  const handleSaveAndRescore = async () => {
    const error = validateScoringConfig(draft);
    setValidationError(error ? "Config is invalid." : "");
    if (error) return;
    await loadKpis();
    toast({
      title: "Prototype mode",
      description: "Config applied locally for preview. No backend persistence.",
    });
  };

  return (
    <DashboardShell title="Settings">
      <div className="space-y-4">
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="p-3 text-sm text-amber-900">
            Prototype mode is active. Settings are local preview only and are not persisted.
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Scoring Preset</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">Choose a strategy, then optionally fine-tune advanced weights.</p>
            <div className="flex flex-wrap gap-2">
              <Button variant={draft.preset === "conservative" ? "default" : "outline"} onClick={() => applyPreset("conservative")}>
                Conservative
              </Button>
              <Button variant={draft.preset === "balanced" ? "default" : "outline"} onClick={() => applyPreset("balanced")}>
                Balanced
              </Button>
              <Button variant={draft.preset === "aggressive" ? "default" : "outline"} onClick={() => applyPreset("aggressive")}>
                Aggressive
              </Button>
            </div>
          </CardContent>
        </Card>

        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Advanced Tuning</CardTitle>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm">{advancedOpen ? "Hide advanced" : "Show advanced"}</Button>
                </CollapsibleTrigger>
              </div>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="space-y-4">
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
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {validationError && <p className="text-sm text-destructive">{validationError}</p>}
        <Button onClick={handleSaveAndRescore}>
          Save and re-score all leads
        </Button>

        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardHeader><CardTitle className="text-base">Total Leads</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{totals.total}</p></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-base">Hot</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{totals.hot}</p></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-base">Warm</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{totals.warm}</p></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-base">Cold</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{totals.cold}</p></CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Last 5 Scoring Runs</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {runs.length === 0 && <p className="text-muted-foreground">No scoring runs yet.</p>}
            {runs.map((run) => (
              <div key={run.id} className="rounded-md border p-2">
                <p><strong>{new Date(run.started_at).toLocaleString()}</strong> - {run.trigger_type}</p>
                <p className="text-muted-foreground">leads: {run.lead_count} | avg: {run.average_score} | version: {run.config_version}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
};

export default DashboardSettings;
