import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { DEFAULT_SCORING_CONFIG, mergeScoringConfig, scoreLeads, type ScoringConfig } from "@/lib/scoringEngine";
import { loadLeadsFromStorage } from "@/lib/leadStore";
import { appendScoringRun, loadScoringConfig, loadScoringRuns, saveScoringConfig, type ScoringRunSummary } from "@/lib/scoringStore";
import {
  deleteScoringSnapshot,
  loadScoringSnapshots,
  saveScoringSnapshot,
  type LocalScoringConfigSnapshot,
} from "@/lib/scoringSnapshotStore";
import { buildImpactPreview } from "@/lib/scoringImpact";
import { validateScoringConfigFields, type FieldErrorMap } from "@/lib/scoringValidation";
import { trackPrototypeEvent } from "@/lib/prototypeTelemetry";

const sourceKeys = ["referral", "webinar", "website", "linkedin", "google ads", "cold outbound"] as const;

const DashboardSettings = () => {
  const { toast } = useToast();
  const [baseLeads, setBaseLeads] = useState(() => loadLeadsFromStorage());
  const [draft, setDraft] = useState<ScoringConfig>(DEFAULT_SCORING_CONFIG);
  const [savedConfig, setSavedConfig] = useState<ScoringConfig>(DEFAULT_SCORING_CONFIG);
  const [runs, setRuns] = useState<ScoringRunSummary[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrorMap>({});
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [snapshotName, setSnapshotName] = useState("");
  const [snapshotNote, setSnapshotNote] = useState("");
  const [snapshots, setSnapshots] = useState<LocalScoringConfigSnapshot[]>([]);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState("");

  const selectedSnapshot = useMemo(
    () => snapshots.find((snapshot) => snapshot.id === selectedSnapshotId) ?? null,
    [snapshots, selectedSnapshotId],
  );

  useEffect(() => {
    const leads = loadLeadsFromStorage();
    const storedConfig = loadScoringConfig();
    setBaseLeads(leads);
    setSavedConfig(storedConfig);
    setDraft(storedConfig);
    setRuns(loadScoringRuns(5));
    setSnapshots(loadScoringSnapshots());
  }, []);

  const scoredByDraft = useMemo(() => scoreLeads(baseLeads, draft), [baseLeads, draft]);
  const stats = useMemo(
    () => ({
      total: scoredByDraft.length,
      hot: scoredByDraft.filter((lead) => lead.tier === "hot").length,
      warm: scoredByDraft.filter((lead) => lead.tier === "warm").length,
      cold: scoredByDraft.filter((lead) => lead.tier === "cold").length,
    }),
    [scoredByDraft],
  );

  const saveImpact = useMemo(() => buildImpactPreview(baseLeads, savedConfig, draft), [baseLeads, savedConfig, draft]);
  const compareImpact = useMemo(
    () => (selectedSnapshot ? buildImpactPreview(baseLeads, selectedSnapshot.config, draft) : null),
    [baseLeads, selectedSnapshot, draft],
  );

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
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[path];
      return next;
    });
  };

  const getError = (path: string) => fieldErrors[path];

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
    const errors = validateScoringConfigFields(draft);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    saveScoringConfig(draft);
    setSavedConfig(draft);
    const run: ScoringRunSummary = {
      runId: `${Date.now()}`,
      timestamp: new Date().toISOString(),
      leadCount: scoredByDraft.length,
      averageScore: Number(
        (scoredByDraft.reduce((sum, lead) => sum + lead.score, 0) / Math.max(1, scoredByDraft.length)).toFixed(2),
      ),
      configVersion: draft.version,
      trigger: "settings_save",
    };
    appendScoringRun(run);
    trackPrototypeEvent("settings_saved", {
      preset: draft.preset,
      leadCount: scoredByDraft.length,
      averageScore: run.averageScore,
    });
    setRuns(loadScoringRuns(5));
    toast({
      title: "Config saved",
      description: "Settings were persisted locally and preview is updated.",
    });
  };

  const handleSaveSnapshot = () => {
    const name = snapshotName.trim();
    if (!name) return;
    saveScoringSnapshot({
      name,
      note: snapshotNote.trim() || undefined,
      config: draft,
    });
    setSnapshots(loadScoringSnapshots());
    setSnapshotName("");
    setSnapshotNote("");
  };

  const NumberField = ({
    label,
    path,
    value,
  }: {
    label: string;
    path: string;
    value: number;
  }) => (
    <label className="space-y-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <Input type="number" value={value} onChange={(event) => updateNumber(path, Number(event.target.value))} />
      {getError(path) && <p className="text-xs text-destructive">{getError(path)}</p>}
    </label>
  );

  return (
    <DashboardShell title="Settings">
      <div className="space-y-4">
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="p-3 text-sm text-amber-900">
            Prototype mode is active. Settings are local preview only and are not persisted to a backend.
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Scoring Preset</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">Choose strategy intent, then fine-tune advanced weights.</p>
            <div className="flex flex-wrap gap-2">
              <Button variant={draft.preset === "conservative" ? "default" : "outline"} onClick={() => applyPreset("conservative")}>Conservative</Button>
              <Button variant={draft.preset === "balanced" ? "default" : "outline"} onClick={() => applyPreset("balanced")}>Balanced</Button>
              <Button variant={draft.preset === "aggressive" ? "default" : "outline"} onClick={() => applyPreset("aggressive")}>Aggressive</Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Conservative: stricter HOT bar. Balanced: default. Aggressive: wider HOT capture.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Pre-save Impact Preview</CardTitle></CardHeader>
          <CardContent className="grid gap-2 text-sm md:grid-cols-2">
            <p>Avg score delta: <strong>{saveImpact.avgScoreDelta}</strong></p>
            <p>Changed leads: <strong>{saveImpact.changedLeadCount}</strong></p>
            <p>Hot delta: <strong>{saveImpact.hotDelta}</strong></p>
            <p>Warm delta: <strong>{saveImpact.warmDelta}</strong></p>
            <p>Cold delta: <strong>{saveImpact.coldDelta}</strong></p>
            <p className="text-muted-foreground">Preview compares saved config vs current draft.</p>
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
                    <NumberField label="Hot min" path="thresholds.hotMin" value={draft.thresholds.hotMin} />
                    <NumberField label="Warm min" path="thresholds.warmMin" value={draft.thresholds.warmMin} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-base">Weights</CardTitle></CardHeader>
                  <CardContent className="grid gap-3 md:grid-cols-2">
                    <NumberField label="Email opens cap" path="weights.engagement.emailOpensCap" value={draft.weights.engagement.emailOpensCap} />
                    <NumberField label="Email clicks cap" path="weights.engagement.emailClicksCap" value={draft.weights.engagement.emailClicksCap} />
                    <NumberField label="Page views cap" path="weights.engagement.pageViewsCap" value={draft.weights.engagement.pageViewsCap} />
                    <NumberField label="Demo requested bonus" path="weights.engagement.demoRequestedBonus" value={draft.weights.engagement.demoRequestedBonus} />
                    <NumberField label="Industry match" path="weights.fit.industryMatch" value={draft.weights.fit.industryMatch} />
                    <NumberField label="Company size fit" path="weights.fit.companySizeFit" value={draft.weights.fit.companySizeFit} />
                    <NumberField label="Budget fit" path="weights.fit.budgetFit" value={draft.weights.fit.budgetFit} />
                    <NumberField label="Recency <= 1 day" path="weights.recency.within1Day" value={draft.weights.recency.within1Day} />
                    <NumberField label="Recency <= 3 days" path="weights.recency.within3Days" value={draft.weights.recency.within3Days} />
                    <NumberField label="Recency <= 7 days" path="weights.recency.within7Days" value={draft.weights.recency.within7Days} />
                    <NumberField label="Recency older" path="weights.recency.older" value={draft.weights.recency.older} />
                    {sourceKeys.map((key) => (
                      <NumberField key={key} label={`Source: ${key}`} path={`weights.sourcePrior.${key}`} value={draft.weights.sourcePrior[key] ?? 0} />
                    ))}
                  </CardContent>
                </Card>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {Object.keys(fieldErrors).length > 0 && (
          <p className="text-sm text-destructive">Fix {Object.keys(fieldErrors).length} field error(s) before saving.</p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleSaveAndRescore}>Save and re-score all leads</Button>
          <Button variant="outline" onClick={() => { setDraft(savedConfig); setFieldErrors({}); }}>Revert to saved config</Button>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Config Snapshots</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 md:grid-cols-3">
              <Input value={snapshotName} onChange={(event) => setSnapshotName(event.target.value)} placeholder="Snapshot name" />
              <Input value={snapshotNote} onChange={(event) => setSnapshotNote(event.target.value)} placeholder="Optional note" />
              <Button variant="outline" onClick={handleSaveSnapshot}>Save snapshot</Button>
            </div>
            {snapshots.length === 0 && <p className="text-sm text-muted-foreground">No snapshots yet.</p>}
            <div className="space-y-2">
              {snapshots.map((snapshot) => (
                <div key={snapshot.id} className="rounded-md border p-2 text-sm">
                  <p><strong>{snapshot.name}</strong> · {new Date(snapshot.createdAt).toLocaleString()}</p>
                  {snapshot.note && <p className="text-muted-foreground">{snapshot.note}</p>}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => setDraft(snapshot.config)}>Apply</Button>
                    <Button size="sm" variant={selectedSnapshotId === snapshot.id ? "secondary" : "outline"} onClick={() => setSelectedSnapshotId(snapshot.id)}>Compare</Button>
                    <Button size="sm" variant="ghost" onClick={() => { deleteScoringSnapshot(snapshot.id); setSnapshots(loadScoringSnapshots()); if (selectedSnapshotId === snapshot.id) setSelectedSnapshotId(""); }}>Delete</Button>
                  </div>
                </div>
              ))}
            </div>
            {compareImpact && (
              <div className="rounded-md border bg-muted/20 p-3 text-sm">
                <p className="font-medium">Compare vs snapshot: {selectedSnapshot?.name}</p>
                <p>Avg score delta: <strong>{compareImpact.avgScoreDelta}</strong></p>
                <p>Hot/Warm/Cold delta: <strong>{compareImpact.hotDelta}</strong> / <strong>{compareImpact.warmDelta}</strong> / <strong>{compareImpact.coldDelta}</strong></p>
                <p>Changed leads: <strong>{compareImpact.changedLeadCount}</strong></p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardHeader><CardTitle className="text-base">Total Leads</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{stats.total}</p></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-base">Hot</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{stats.hot}</p></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-base">Warm</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{stats.warm}</p></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-base">Cold</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{stats.cold}</p></CardContent></Card>
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
