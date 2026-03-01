import { useMemo, useState } from "react";
import {
  AlertCircle,
  Download,
  Linkedin,
  Mail,
  Phone,
  RefreshCcw,
  Search,
  Upload,
  Users,
} from "lucide-react";
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
import { useLeadScoring } from "@/hooks/useLeadScoring";
import { type CsvRow } from "@/lib/csv";
import { formatHoursAverage, formatLift, formatPrecisionAt10 } from "@/lib/leadMetrics";
import { loadLeadsFromStorage, saveLeadsToStorage } from "@/lib/leadStore";
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
type ScorePreset = "all" | "60" | "70" | "80" | "90" | "custom";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseNumber(value: string): number | undefined {
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseBoolean(value: string): boolean | undefined {
  const normalized = value.trim().toLowerCase();
  if (["true", "yes", "1"].includes(normalized)) return true;
  if (["false", "no", "0"].includes(normalized)) return false;
  return undefined;
}

function buildLeadFromRow(row: CsvRow, mapping: Record<LeadFieldKey, string>, id: number): Lead | null {
  const name = (row[mapping.name] ?? "").trim();
  const company = (row[mapping.company] ?? "").trim();
  const email = (row[mapping.email] ?? "").trim();
  const source = (row[mapping.source] ?? "").trim() || "Imported CSV";
  if (!name || !company || !email || !emailRegex.test(email)) return null;

  const legacyScore = Number(row[mapping.score] ?? 0);
  const now = new Date().toISOString();
  const breakdown: Lead["scoreBreakdown"] = [{ key: "legacy_score_hint", label: "Legacy score hint", value: Number.isFinite(legacyScore) ? legacyScore : 0 }];
  const numberInputs: Array<[LeadFieldKey, string]> = [["emailOpens", "input_email_opens"], ["emailClicks", "input_email_clicks"], ["pageViews", "input_page_views"]];
  numberInputs.forEach(([key, storageKey]) => {
    if (!mapping[key]) return;
    const value = parseNumber(row[mapping[key]] ?? "");
    if (typeof value === "number") breakdown.push({ key: storageKey, label: `CSV ${key}`, value });
  });
  const booleanInputs: Array<[LeadFieldKey, string]> = [["demoRequested", "input_demo_requested"], ["industryMatch", "input_industry_match"], ["companySizeFit", "input_company_size_fit"], ["budgetFit", "input_budget_fit"]];
  booleanInputs.forEach(([key, storageKey]) => {
    if (!mapping[key]) return;
    const value = parseBoolean(row[mapping[key]] ?? "");
    if (typeof value === "boolean") breakdown.push({ key: storageKey, label: `CSV ${key}`, value: value ? 1 : 0 });
  });

  return {
    id,
    rank: id,
    name,
    company,
    score: Number.isFinite(legacyScore) ? Math.round(legacyScore) : 0,
    tier: "cold",
    reasons: (row[mapping.reasons] ?? "").split(/[|;,]/).map((item) => item.trim()).filter(Boolean).slice(0, 2),
    source,
    lastActivity: (row[mapping.lastActivity] ?? "").trim() || "Imported recently",
    email,
    aiExplanation: `${name} from ${company} imported from CSV.`,
    scoreBreakdown: breakdown,
    scoredAt: now,
    scoreVersion: "v0-legacy-import",
  };
}

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
  const { rescore } = useLeadScoring();
  const [mode, setMode] = useState<WorkMode>("work");
  const [leads, setLeads] = useState<Lead[]>(() => loadLeadsFromStorage());
  const [applyScoringOnImport, setApplyScoringOnImport] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [scorePreset, setScorePreset] = useState<ScorePreset>("all");
  const [customMinScoreInput, setCustomMinScoreInput] = useState("75");

  const importer = useLeadImport<LeadFieldKey>({ leadFields, buildLeadFromRow });

  const effectiveMinScore = useMemo(() => {
    if (scorePreset === "all") return 0;
    if (scorePreset === "custom") return toClampedScore(Number(customMinScoreInput));
    return Number(scorePreset);
  }, [customMinScoreInput, scorePreset]);

  const filtered = useMemo(() => leads.filter((lead) => {
    if (search && !`${lead.name} ${lead.company}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (tierFilter !== "all" && lead.tier !== tierFilter) return false;
    if (lead.score < effectiveMinScore) return false;
    return true;
  }), [effectiveMinScore, leads, search, tierFilter]);

  const kpis = useMemo(() => ({
    total: leads.length,
    firstContact: formatHoursAverage(leads),
    precision: formatPrecisionAt10(leads),
    lift: formatLift(leads),
  }), [leads]);

  const handleImport = async () => {
    const result = await importer.importRows();
    if (result.leads.length === 0) return;
    const imported = result.leads.map((lead, index) => ({ ...lead, id: index + 1, rank: index + 1 }));
    const next = rescore(imported, "import").leads;
    setLeads(next);
    saveLeadsToStorage(next);
    setMode("work");
  };

  const handleManualRescore = () => {
    const result = rescore(leads, "manual_rescore");
    setLeads(result.leads);
    saveLeadsToStorage(result.leads);
    toast({ title: "Re-score complete", description: `${result.run.leadCount} leads recalculated.` });
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
              <div className="flex items-center justify-between rounded-md border p-3">
                <span className="text-sm text-muted-foreground">Apply scoring on import</span>
                <Switch checked={applyScoringOnImport} onCheckedChange={setApplyScoringOnImport} />
              </div>
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
              <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Leads</p><p className="text-2xl font-bold">{kpis.total}</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Avg First Contact</p><p className="text-2xl font-bold">{kpis.firstContact}</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Precision@10</p><p className="text-2xl font-bold">{kpis.precision}</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Lift</p><p className="text-2xl font-bold">{kpis.lift}</p></CardContent></Card>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative"><Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="w-56 pl-8" placeholder="Search" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
              <Select value={tierFilter} onValueChange={setTierFilter}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All tiers</SelectItem><SelectItem value="hot">Hot</SelectItem><SelectItem value="warm">Warm</SelectItem><SelectItem value="cold">Cold</SelectItem></SelectContent></Select>
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
                    <Button
                      key={value}
                      size="sm"
                      variant={scorePreset === value ? "default" : "ghost"}
                      className="h-7 px-2 text-xs"
                      onClick={() => setScorePreset(value as ScorePreset)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
                {scorePreset === "custom" && (
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    className="h-8 w-20"
                    value={customMinScoreInput}
                    onChange={(event) => setCustomMinScoreInput(event.target.value)}
                  />
                )}
              </div>
            </div>
            <Card>
              <Table>
                <TableHeader><TableRow><TableHead>#</TableHead><TableHead>Name</TableHead><TableHead>Company</TableHead><TableHead>Score</TableHead><TableHead>Tier</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filtered.map((lead) => (
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
                  {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No leads found.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </Card>
          </>
        )}
      </div>
    </DashboardShell>
  );
};

export default Dashboard;
