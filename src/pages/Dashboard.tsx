import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Download, Linkedin, Mail, Phone, RefreshCcw, Search, Upload } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type Lead } from "@/data/mockLeads";
import { type ImportIssue, useLeadImport } from "@/hooks/useLeadImport";
import { type CsvRow } from "@/lib/csv";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/apiClient";

const leadFields = [
  { key: "name", label: "Name", required: true },
  { key: "company", label: "Company", required: true },
  { key: "email", label: "Email", required: true },
  { key: "source", label: "Source", required: true },
  { key: "score", label: "Legacy Score", required: false },
  { key: "reasons", label: "Legacy Reasons", required: false },
  { key: "lastActivity", label: "Last Activity", required: false },
  { key: "emailOpens", label: "Email Opens", required: false },
  { key: "emailClicks", label: "Email Clicks", required: false },
  { key: "pageViews", label: "Page Views", required: false },
  { key: "demoRequested", label: "Demo Requested (true/false)", required: false },
  { key: "industryMatch", label: "Industry Match (true/false)", required: false },
  { key: "companySizeFit", label: "Company Size Fit (true/false)", required: false },
  { key: "budgetFit", label: "Budget Fit (true/false)", required: false },
] as const;

type LeadFieldKey = (typeof leadFields)[number]["key"];
type WorkMode = "work" | "setup";
type ScorePreset = "all" | "60" | "70" | "80" | "90" | "custom";

interface KpiState {
  totalLeads: number;
  avgFirstContactHours: number;
  precisionAt10: number;
  lift: number;
}

const emptyLeadBuilder = (_row: CsvRow, _mapping: Record<LeadFieldKey, string>, _id: number): Lead | null => null;

function downloadIssuesCsv(issues: ImportIssue[]) {
  const sanitizeCell = (value: string) => {
    const normalized = value.replace(/"/g, "\"\"");
    const first = normalized.charAt(0);
    const guarded = ["=", "+", "-", "@"].includes(first) ? `'${normalized}` : normalized;
    return `"${guarded}"`;
  };
  const header = "row_number,reason,name,company,email";
  const rows = issues.map(
    (issue) =>
      `${issue.rowNumber},${sanitizeCell(issue.reason)},${sanitizeCell(issue.name)},${sanitizeCell(issue.company)},${sanitizeCell(issue.email)}`,
  );
  const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "lead-import-issues.csv";
  link.click();
}

function toClampedScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

const Dashboard = () => {
  const { toast } = useToast();
  const [mode, setMode] = useState<WorkMode>("work");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [kpis, setKpis] = useState<KpiState>({ totalLeads: 0, avgFirstContactHours: 0, precisionAt10: 0, lift: 1 });
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [isLoadingKpis, setIsLoadingKpis] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [scorePreset, setScorePreset] = useState<ScorePreset>("all");
  const [customMinScoreInput, setCustomMinScoreInput] = useState("75");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [applyScoringOnImport] = useState(true);

  const importer = useLeadImport<LeadFieldKey>({ leadFields, buildLeadFromRow: emptyLeadBuilder });

  const effectiveMinScore = useMemo(() => {
    if (scorePreset === "all") return 0;
    if (scorePreset === "custom") return toClampedScore(Number(customMinScoreInput));
    return Number(scorePreset);
  }, [customMinScoreInput, scorePreset]);

  const fetchLeads = async () => {
    setIsLoadingLeads(true);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: "25",
      sortBy: "score",
      sortDir: "desc",
      minScore: String(effectiveMinScore),
    });
    if (search) params.set("search", search);
    if (tierFilter !== "all") params.set("tier", tierFilter);

    const response = await apiFetch(`/api/leads?${params.toString()}`, { method: "GET" });
    if (!response.ok) {
      setIsLoadingLeads(false);
      toast({ title: "Failed to load leads", description: "API request failed." });
      return;
    }
    const payload = (await response.json()) as { items: Lead[]; totalPages: number };
    setLeads(payload.items ?? []);
    setTotalPages(payload.totalPages ?? 1);
    setIsLoadingLeads(false);
  };

  const fetchKpis = async () => {
    setIsLoadingKpis(true);
    const response = await apiFetch("/api/kpis", { method: "GET" });
    if (!response.ok) {
      setIsLoadingKpis(false);
      return;
    }
    const payload = (await response.json()) as KpiState;
    setKpis(payload);
    setIsLoadingKpis(false);
  };

  useEffect(() => {
    void fetchLeads();
  }, [page, search, tierFilter, effectiveMinScore]);

  useEffect(() => {
    void fetchKpis();
  }, []);

  const handleImport = async () => {
    if (!importer.csvContent) {
      importer.setUploadError("Upload a CSV before importing.");
      return;
    }
    if (!importer.requiredFieldsReady) {
      importer.setUploadError("Complete all required field mappings.");
      return;
    }
    if (importer.hasDuplicateColumnMapping) {
      importer.setUploadError("Each mapped field must use a different CSV column.");
      return;
    }

    const response = await apiFetch("/api/leads/import", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        csvContent: importer.csvContent,
        mapping: importer.mapping,
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      importer.setUploadError(payload?.message ?? "Import request failed.");
      if (Array.isArray(payload?.issues)) {
        importer.setImportIssues(payload.issues as ImportIssue[]);
      }
      return;
    }

    importer.setUploadStatus(`${payload.importedCount} lead(s) imported.${payload.skippedCount > 0 ? ` Skipped ${payload.skippedCount} row(s).` : ""}`);
    toast({
      title: "Import completed",
      description: applyScoringOnImport ? "Leads imported and scored via API." : "Leads imported.",
    });
    setMode("work");
    setPage(1);
    await Promise.all([fetchLeads(), fetchKpis()]);
  };

  const handleManualRescore = async () => {
    const response = await apiFetch("/api/scoring/rescore", { method: "POST" });
    if (!response.ok) {
      toast({ title: "Re-score failed", description: "API request failed." });
      return;
    }
    const payload = await response.json();
    toast({ title: "Re-score complete", description: `${payload.rescoredCount} leads recalculated.` });
    await Promise.all([fetchLeads(), fetchKpis()]);
  };

  return (
    <DashboardShell title="Lead Queue">
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button variant={mode === "work" ? "default" : "outline"} onClick={() => setMode("work")}>Work Mode</Button>
          <Button variant={mode === "setup" ? "default" : "outline"} onClick={() => setMode("setup")}>Setup Mode</Button>
          {mode === "work" && <Button variant="outline" onClick={handleManualRescore}><RefreshCcw className="mr-2 h-4 w-4" />Re-score now</Button>}
        </div>

        {mode === "setup" && (
          <Card>
            <CardHeader><CardTitle className="text-base">CSV Import and Scoring</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Input type="file" accept=".csv,text/csv" onChange={importer.handleCsvFile} disabled={importer.isImporting || importer.isParsingFile} />
              {importer.uploadStatus && <p className="text-sm text-muted-foreground">{importer.uploadStatus}</p>}
              {importer.uploadError && <p className="inline-flex items-center gap-2 text-sm text-destructive"><AlertCircle className="h-4 w-4" />{importer.uploadError}</p>}
              {importer.csvHeaders.length > 0 && (
                <>
                  <div className="grid gap-2 md:grid-cols-2">{leadFields.map((field) => (
                    <div key={field.key} className="space-y-1">
                      <p className="text-xs text-muted-foreground">{field.label}{field.required ? " (required)" : ""}</p>
                      <Select value={importer.mapping[field.key] || "unmapped"} onValueChange={(value) => importer.setMapping((prev) => ({ ...prev, [field.key]: value === "unmapped" ? "" : value }))}>
                        <SelectTrigger><SelectValue placeholder="Select column" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unmapped">Unmapped</SelectItem>
                          {importer.csvHeaders.map((header) => <SelectItem key={`${field.key}-${header}`} value={header}>{header}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}</div>
                  <div className="flex gap-2">
                    <Button onClick={handleImport}><Upload className="mr-2 h-4 w-4" />Import Leads</Button>
                    {importer.importIssues.length > 0 && <Button variant="outline" onClick={() => downloadIssuesCsv(importer.importIssues)}><Download className="mr-2 h-4 w-4" />Issue Report</Button>}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {mode === "work" && (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Leads</p><p className="text-2xl font-bold">{isLoadingKpis ? "..." : kpis.totalLeads}</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Avg First Contact</p><p className="text-2xl font-bold">{isLoadingKpis ? "..." : `${kpis.avgFirstContactHours.toFixed(1)}h`}</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Precision@10</p><p className="text-2xl font-bold">{isLoadingKpis ? "..." : `${kpis.precisionAt10}%`}</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Lift</p><p className="text-2xl font-bold">{isLoadingKpis ? "..." : `${kpis.lift.toFixed(1)}x`}</p></CardContent></Card>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative"><Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="w-56 pl-8" placeholder="Search" value={search} onChange={(event) => { setPage(1); setSearch(event.target.value); }} /></div>
              <Select value={tierFilter} onValueChange={(value) => { setPage(1); setTierFilter(value); }}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All tiers</SelectItem><SelectItem value="hot">Hot</SelectItem><SelectItem value="warm">Warm</SelectItem><SelectItem value="cold">Cold</SelectItem></SelectContent></Select>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Score filter</span>
                <div className="inline-flex rounded-md border p-1">
                  {[
                    ["all", "All"],
                    ["60", "60+"],
                    ["70", "70+"],
                    ["80", "80+"],
                    ["90", "90+"],
                    ["custom", "Custom"],
                  ].map(([value, label]) => (
                    <Button key={value} size="sm" variant={scorePreset === value ? "default" : "ghost"} className="h-7 px-2 text-xs" onClick={() => { setPage(1); setScorePreset(value as ScorePreset); }}>
                      {label}
                    </Button>
                  ))}
                </div>
                {scorePreset === "custom" && (
                  <Input type="number" min={0} max={100} className="h-8 w-20" value={customMinScoreInput} onChange={(event) => { setPage(1); setCustomMinScoreInput(event.target.value); }} />
                )}
              </div>
            </div>

            <Card>
              <Table>
                <TableHeader><TableRow><TableHead>#</TableHead><TableHead>Name</TableHead><TableHead>Company</TableHead><TableHead>Score</TableHead><TableHead>Tier</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {isLoadingLeads && <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Loading leads...</TableCell></TableRow>}
                  {!isLoadingLeads && leads.map((lead) => (
                    <Collapsible key={lead.id} open={expanded === lead.id} onOpenChange={(isOpen) => setExpanded(isOpen ? lead.id : null)} asChild>
                      <>
                        <CollapsibleTrigger asChild>
                          <TableRow className="cursor-pointer">
                            <TableCell>{lead.rank}</TableCell><TableCell>{lead.name}</TableCell><TableCell>{lead.company}</TableCell><TableCell>{lead.score}</TableCell><TableCell>{lead.tier}</TableCell>
                            <TableCell className="text-right"><div className="inline-flex gap-1"><Button variant="ghost" size="icon"><Mail className="h-4 w-4" /></Button><Button variant="ghost" size="icon"><Phone className="h-4 w-4" /></Button><Button variant="ghost" size="icon"><Linkedin className="h-4 w-4" /></Button></div></TableCell>
                          </TableRow>
                        </CollapsibleTrigger>
                        <CollapsibleContent asChild>
                          <TableRow><TableCell colSpan={6} className="space-y-2 bg-muted/30">
                            <p className="text-sm">{lead.aiExplanation}</p>
                            <div className="grid gap-1 md:grid-cols-2">{lead.scoreBreakdown.map((item) => <div key={`${lead.id}-${item.key}`} className="flex items-center justify-between rounded border bg-background px-2 py-1 text-xs"><span className="text-muted-foreground">{item.label}</span><span className={cn("font-semibold", item.value < 0 && "text-destructive")}>{item.value >= 0 ? `+${item.value}` : item.value}</span></div>)}</div>
                          </TableCell></TableRow>
                        </CollapsibleContent>
                      </>
                    </Collapsible>
                  ))}
                  {!isLoadingLeads && leads.length === 0 && <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No leads found.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </Card>

            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1}>Previous</Button>
              <p className="text-sm text-muted-foreground">Page {page} / {totalPages}</p>
              <Button variant="outline" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages}>Next</Button>
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
};

export default Dashboard;
