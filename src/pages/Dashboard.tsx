import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Clock3, Download, Filter, Flame, Layers3, Linkedin, Mail, Phone, Search, Target, Upload, XCircle } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockLeads, type Lead } from "@/data/mockLeads";
import { type ImportIssue, useLeadImport } from "@/hooks/useLeadImport";
import { DEFAULT_SCORING_CONFIG, scoreLead, scoreLeads } from "@/lib/scoringEngine";
import { isGuestSession } from "@/lib/session";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

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
type QualityProfile = "all" | "high_intent" | "balanced_pipeline" | "volume_mode";

interface KpiState {
  totalLeads: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  avgScore: number;
}

interface ImportPreviewResponse {
  rowCount: number;
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  issuesByType: Record<string, number>;
  sampleIssues: ImportIssue[];
}

const qualityProfileMeta: Record<QualityProfile, string> = {
  all: "All imported leads",
  high_intent: "Only HOT leads",
  balanced_pipeline: "HOT + WARM leads",
  volume_mode: "Score threshold: 40+",
};

function tierTone(tier: Lead["tier"]) {
  if (tier === "hot") return "border-red-200 bg-red-50 text-red-700";
  if (tier === "warm") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-100 text-slate-700";
}

function downloadIssuesCsv(issues: ImportIssue[]) {
  const sanitizeCell = (value: string) => {
    const normalized = value.replace(/"/g, '""');
    const first = normalized.charAt(0);
    const guarded = ["=", "+", "-", "@"].includes(first) ? `'${normalized}` : normalized;
    return `"${guarded}"`;
  };
  const header = "row_number,type,reason,name,company,email";
  const rows = issues.map(
    (issue) =>
      `${issue.rowNumber},${sanitizeCell(issue.type ?? "unknown")},${sanitizeCell(issue.reason)},${sanitizeCell(issue.name)},${sanitizeCell(issue.company)},${sanitizeCell(issue.email)}`,
  );
  const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "lead-import-issues.csv";
  link.click();
}

function parseNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const numeric = Number(value);
  if (Number.isNaN(numeric) || !Number.isFinite(numeric)) return undefined;
  return numeric;
}

function parseBoolean(value: string | undefined): boolean | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  if (["true", "yes", "y", "1"].includes(normalized)) return true;
  if (["false", "no", "n", "0"].includes(normalized)) return false;
  return undefined;
}

function buildGuestKpis(items: Lead[]): KpiState {
  const hotLeads = items.filter((lead) => lead.tier === "hot").length;
  const warmLeads = items.filter((lead) => lead.tier === "warm").length;
  const coldLeads = items.filter((lead) => lead.tier === "cold").length;
  const avgScore = Number((items.reduce((sum, lead) => sum + lead.score, 0) / Math.max(1, items.length)).toFixed(1));
  return { totalLeads: items.length, hotLeads, warmLeads, coldLeads, avgScore };
}

const Dashboard = () => {
  const { toast } = useToast();
  const guestMode = isGuestSession();
  const [mode, setMode] = useState<WorkMode>("work");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [guestLeads, setGuestLeads] = useState<Lead[]>(() => scoreLeads(mockLeads, DEFAULT_SCORING_CONFIG));
  const [kpis, setKpis] = useState<KpiState>({ totalLeads: 0, hotLeads: 0, warmLeads: 0, coldLeads: 0, avgScore: 0 });
  const isLoadingLeads = false;
  const isLoadingKpis = false;
  const [expanded, setExpanded] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [qualityProfile, setQualityProfile] = useState<QualityProfile>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const importer = useLeadImport<LeadFieldKey>({
    leadFields,
    buildLeadFromRow: (row, mapping, id) => {
      const name = (row[mapping.name] ?? "").trim();
      const company = (row[mapping.company] ?? "").trim();
      const email = (row[mapping.email] ?? "").trim().toLowerCase();
      const source = (row[mapping.source] ?? "Website").trim() || "Website";
      const lastActivity = (row[mapping.lastActivity] ?? "7 days ago").trim() || "7 days ago";
      const result = scoreLead(
        {
          name,
          company,
          source,
          lastActivity,
          emailOpens: parseNumber(row[mapping.emailOpens]),
          emailClicks: parseNumber(row[mapping.emailClicks]),
          pageViews: parseNumber(row[mapping.pageViews]),
          demoRequested: parseBoolean(row[mapping.demoRequested]),
          industryMatch: parseBoolean(row[mapping.industryMatch]),
          companySizeFit: parseBoolean(row[mapping.companySizeFit]),
          budgetFit: parseBoolean(row[mapping.budgetFit]),
        },
        DEFAULT_SCORING_CONFIG,
      );
      return {
        id,
        rank: id,
        name,
        company,
        email,
        source,
        score: result.score,
        tier: result.tier,
        reasons: result.topReasons,
        lastActivity,
        aiExplanation: result.explanation,
        scoreBreakdown: result.contributions.map((item) => ({ key: item.key, label: item.label, value: item.value })),
        scoredAt: new Date().toISOString(),
        scoreVersion: DEFAULT_SCORING_CONFIG.version,
      };
    },
  });

  const filteredGuestLeads = useMemo(() => {
    let next = [...guestLeads];
    if (qualityProfile === "high_intent") {
      next = next.filter((lead) => lead.tier === "hot");
    } else if (qualityProfile === "balanced_pipeline") {
      next = next.filter((lead) => lead.tier === "hot" || lead.tier === "warm");
    } else if (qualityProfile === "volume_mode") {
      next = next.filter((lead) => lead.score >= 40);
    }
    return next;
  }, [guestLeads, qualityProfile]);

  const fetchLeads = () => {
    const filtered = filteredGuestLeads
      .filter((lead) => (tierFilter === "all" ? true : lead.tier === tierFilter))
      .filter((lead) => {
        if (!search.trim()) return true;
        const term = search.trim().toLowerCase();
        return (
          lead.name.toLowerCase().includes(term) ||
          lead.company.toLowerCase().includes(term) ||
          lead.email.toLowerCase().includes(term)
        );
      })
      .sort((a, b) => b.score - a.score)
      .map((lead, index) => ({ ...lead, rank: index + 1 }));

    const pageSize = 25;
    const nextTotalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const safePage = Math.min(page, nextTotalPages);
    const start = (safePage - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    setLeads(items);
    setTotalPages(nextTotalPages);
    if (safePage !== page) {
      setPage(safePage);
    }
  };

  const fetchKpis = () => {
    setKpis(buildGuestKpis(guestLeads));
  };

  useEffect(() => {
    fetchLeads();
  }, [page, search, tierFilter, qualityProfile, guestLeads, filteredGuestLeads]);

  useEffect(() => {
    fetchKpis();
  }, [guestLeads]);

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
    if (!preview) {
      importer.setUploadError("Preview your CSV before confirming import.");
      return;
    }

    const result = await importer.importRows();
    if (result.leads.length === 0) {
      return;
    }
    const merged = scoreLeads(
      [...guestLeads, ...result.leads.map((lead) => ({ ...lead, id: 0, rank: 0 }))],
      DEFAULT_SCORING_CONFIG,
    );
    setGuestLeads(merged);
    importer.setUploadStatus(`${result.leads.length} lead(s) imported.`);
    toast({
      title: "Import completed",
      description: "Leads imported and scored in prototype mode.",
    });
    setMode("work");
    setPage(1);
    setPreview(null);
    fetchLeads();
    fetchKpis();
  };

  const handlePreviewImport = async () => {
    importer.setUploadError("");
    if (!importer.csvContent) {
      importer.setUploadError("Upload a CSV before preview.");
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

    setIsPreviewing(true);
    const rowCount = importer.csvRows.length;
    const guestPreview: ImportPreviewResponse = {
      rowCount,
      validCount: rowCount,
      invalidCount: 0,
      duplicateCount: 0,
      issuesByType: {
        missing_required: 0,
        invalid_email: 0,
        duplicate_in_file: 0,
        duplicate_in_db: 0,
        invalid_boolean: 0,
        invalid_number: 0,
        unknown_source: 0,
      },
      sampleIssues: [],
    };
    setPreview(guestPreview);
    setIsPreviewing(false);
    importer.setImportIssues([]);
    importer.setUploadStatus(`Preview ready: ${guestPreview.validCount}/${guestPreview.rowCount} rows valid.`);
  };

  return (
    <DashboardShell title="Lead Queue">
      <div className="space-y-4">
        {guestMode && (
          <Card className="border-amber-300 bg-amber-50">
            <CardContent className="p-3 text-sm text-amber-900">
              Session-only mode is active. Data is not persisted and is cleared on logout or tab close.
            </CardContent>
          </Card>
        )}

        <div className="flex gap-2">
          <Button variant={mode === "work" ? "default" : "outline"} onClick={() => setMode("work")}>Work Mode</Button>
          <Button variant={mode === "setup" ? "default" : "outline"} onClick={() => setMode("setup")}>Setup Mode</Button>
        </div>

        {mode === "setup" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">CSV Import and Scoring</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input type="file" accept=".csv,text/csv" onChange={importer.handleCsvFile} disabled={importer.isImporting || importer.isParsingFile} />
              {importer.uploadStatus && <p className="text-sm text-muted-foreground">{importer.uploadStatus}</p>}
              {importer.uploadError && <p className="inline-flex items-center gap-2 text-sm text-destructive"><AlertCircle className="h-4 w-4" />{importer.uploadError}</p>}
              {importer.csvHeaders.length > 0 && (
                <>
                  <div className="grid gap-2 md:grid-cols-2">
                    {leadFields.map((field) => (
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
                    ))}
                  </div>

                  <div className="grid gap-3 rounded-lg border border-dashed p-3 md:grid-cols-2">
                    <div className="space-y-2 rounded-md border bg-muted/20 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Step 1</p>
                      <p className="text-sm font-medium">Preview Import</p>
                      <p className="text-xs text-muted-foreground">Validate rows, detect issues, and review duplicates before writing leads.</p>
                      <Button variant="outline" onClick={handlePreviewImport} disabled={isPreviewing} className="w-full sm:w-auto">
                        {isPreviewing ? "Previewing..." : "Preview Import"}
                      </Button>
                    </div>
                    <div className="space-y-2 rounded-md border bg-muted/20 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Step 2</p>
                      <p className="text-sm font-medium">Confirm Import</p>
                      <p className="text-xs text-muted-foreground">Import scored leads only after preview is checked.</p>
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={handleImport}><Upload className="mr-2 h-4 w-4" />Confirm Import</Button>
                        {importer.importIssues.length > 0 && <Button variant="outline" onClick={() => downloadIssuesCsv(importer.importIssues)}><Download className="mr-2 h-4 w-4" />Issue Report</Button>}
                      </div>
                    </div>
                  </div>

                  {preview && (
                    <Card className="border-dashed">
                      <CardContent className="space-y-2 p-3 text-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Preview Summary</p>
                        <div className="grid gap-2 md:grid-cols-3">
                          <div className="rounded border border-emerald-200 bg-emerald-50 p-2">
                            <p className="inline-flex items-center gap-1 text-xs text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" />Valid</p>
                            <p className="text-lg font-semibold text-emerald-900">{preview.validCount}</p>
                          </div>
                          <div className="rounded border border-red-200 bg-red-50 p-2">
                            <p className="inline-flex items-center gap-1 text-xs text-red-700"><XCircle className="h-3.5 w-3.5" />Invalid</p>
                            <p className="text-lg font-semibold text-red-900">{preview.invalidCount}</p>
                          </div>
                          <div className="rounded border border-amber-200 bg-amber-50 p-2">
                            <p className="inline-flex items-center gap-1 text-xs text-amber-700"><AlertCircle className="h-3.5 w-3.5" />Duplicates</p>
                            <p className="text-lg font-semibold text-amber-900">{preview.duplicateCount}</p>
                          </div>
                        </div>
                        <p><strong>Rows:</strong> {preview.rowCount} total</p>
                        <div className="grid gap-1 md:grid-cols-2">
                          {Object.entries(preview.issuesByType).map(([type, count]) => (
                            <p key={type} className="text-muted-foreground">{type}: {count}</p>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        {mode === "work" && (
          <>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
              <Card className="surface-soft">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Total Leads</p>
                  <p className="mt-2 text-2xl font-bold">{isLoadingKpis ? "..." : kpis.totalLeads}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Flame className="h-3 w-3" />Hot</p>
                  <p className="mt-2 text-2xl font-bold text-red-600">{isLoadingKpis ? "..." : kpis.hotLeads}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Target className="h-3 w-3" />Warm</p>
                  <p className="mt-2 text-2xl font-bold text-amber-600">{isLoadingKpis ? "..." : kpis.warmLeads}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Layers3 className="h-3 w-3" />Cold</p>
                  <p className="mt-2 text-2xl font-bold text-slate-600">{isLoadingKpis ? "..." : kpis.coldLeads}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="h-3 w-3" />Avg Score</p>
                  <p className="mt-2 text-2xl font-bold">{isLoadingKpis ? "..." : kpis.avgScore}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-dashed">
              <CardContent className="space-y-3 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="inline-flex items-center gap-2 text-sm font-medium"><Filter className="h-4 w-4" />Queue Filters</p>
                  <p className="text-xs text-muted-foreground">{qualityProfileMeta[qualityProfile]}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="w-60 max-w-[75vw] pl-8"
                      placeholder="Search by name, company, email"
                      value={search}
                      onChange={(event) => {
                        setPage(1);
                        setSearch(event.target.value);
                      }}
                    />
                  </div>
                  <Select value={tierFilter} onValueChange={(value) => { setPage(1); setTierFilter(value); }}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All tiers</SelectItem>
                      <SelectItem value="hot">Hot</SelectItem>
                      <SelectItem value="warm">Warm</SelectItem>
                      <SelectItem value="cold">Cold</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={qualityProfile}
                    onValueChange={(value) => {
                      setPage(1);
                      setQualityProfile(value as QualityProfile);
                    }}
                  >
                    <SelectTrigger className="w-56 max-w-[75vw]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Lead quality: All</SelectItem>
                      <SelectItem value="high_intent">Lead quality: High intent</SelectItem>
                      <SelectItem value="balanced_pipeline">Lead quality: Balanced pipeline</SelectItem>
                      <SelectItem value="volume_mode">Lead quality: Volume mode</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPage(1);
                      setSearch("");
                      setTierFilter("all");
                      setQualityProfile("all");
                    }}
                  >
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-border/80">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>#</TableHead>
                    <TableHead>Lead</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingLeads && <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Loading leads...</TableCell></TableRow>}
                  {!isLoadingLeads && leads.map((lead) => (
                    <Collapsible key={lead.id} open={expanded === lead.id} onOpenChange={(isOpen) => setExpanded(isOpen ? lead.id : null)} asChild>
                      <>
                        <CollapsibleTrigger asChild>
                          <TableRow className="cursor-pointer hover:bg-muted/35" title="Expand lead details">
                            <TableCell className="text-muted-foreground">{lead.rank}</TableCell>
                            <TableCell>
                              <p className="font-medium">{lead.name}</p>
                              <p className="text-xs text-muted-foreground">{lead.email}</p>
                            </TableCell>
                            <TableCell>
                              <p className="font-medium">{lead.company}</p>
                              <p className="text-xs text-muted-foreground">{lead.source}</p>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold">{lead.score}</p>
                                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                                  <div className="h-full rounded-full bg-primary" style={{ width: `${lead.score}%` }} />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn("capitalize", tierTone(lead.tier))}>{lead.tier}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="inline-flex gap-1">
                                <Button variant="ghost" size="icon" title="Email lead" aria-label={`Email ${lead.name}`}><Mail className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" title="Call lead" aria-label={`Call ${lead.name}`}><Phone className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" title="Open LinkedIn" aria-label={`Open LinkedIn for ${lead.name}`}><Linkedin className="h-4 w-4" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        </CollapsibleTrigger>
                        <CollapsibleContent asChild>
                          <TableRow>
                            <TableCell colSpan={6} className="space-y-3 bg-muted/25">
                              <div className="rounded-md border bg-background p-3">
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Why this score</p>
                                <p className="mt-1 text-sm font-medium">{lead.topReasons?.length ? lead.topReasons.join(" · ") : lead.reasons.join(" · ")}</p>
                                <p className="mt-1 text-xs text-muted-foreground">Tier outcome: {lead.tier.toUpperCase()} · Last activity: {lead.lastActivity}</p>
                              </div>
                              <p className="text-sm text-muted-foreground">{lead.aiExplanation}</p>
                              <div className="grid gap-1.5 md:grid-cols-2">
                                {lead.scoreBreakdown.map((item) => (
                                  <div key={`${lead.id}-${item.key}`} className="flex items-center justify-between rounded border bg-background px-2 py-1 text-xs">
                                    <span className="text-muted-foreground">{item.label}</span>
                                    <span className={cn("font-semibold", item.value < 0 && "text-destructive")}>{item.value >= 0 ? `+${item.value}` : item.value}</span>
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
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
