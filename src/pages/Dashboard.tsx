import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Clock3, Download, Filter, Flame, Layers3, Mail, MoreHorizontal, Search, Target, Upload, XCircle } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { DemoReadinessPanel } from "@/components/demo/DemoReadinessPanel";
import { GuidedTourOverlay } from "@/components/demo/GuidedTourOverlay";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockLeads, type Lead } from "@/data/mockLeads";
import { type ImportIssue, useLeadImport } from "@/hooks/useLeadImport";
import { demoScenarios } from "@/lib/demoScenarios";
import { loadDemoSessionState, markTourCompleted, resetScenarioState, type DemoScenarioId, type DemoSessionState } from "@/lib/demoStore";
import { getSlaState, isSnoozed, parseLastActivityHours, sortLeadsByWorkflowPriority } from "@/lib/dashboardWorkflowHelpers";
import { buildEnrichmentPreview, buildLeadEnrichmentMeta, type EnrichmentSuggestion } from "@/lib/enrichment";
import { loadLeadsFromStorage, saveLeadsToStorage } from "@/lib/leadStore";
import { loadLeadUiState, saveLeadUiState, type LeadStatus, type LeadUIStateMap } from "@/lib/leadUiStateStore";
import { trackPrototypeEvent } from "@/lib/prototypeTelemetry";
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
type WorkflowPreset = "none" | "hot_today" | "no_recent_touch" | "high_intent_fit";
type ContributionGroup = NonNullable<Lead["scoreBreakdown"][number]["group"]>;

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

const workflowPresetLabel: Record<WorkflowPreset, string> = {
  none: "No preset",
  hot_today: "Hot today",
  no_recent_touch: "No recent touch",
  high_intent_fit: "High intent + fit",
};

const contributionGroupOrder: ContributionGroup[] = ["engagement", "fit", "recency", "source"];

const contributionGroupLabel: Record<ContributionGroup, string> = {
  engagement: "Engagement",
  fit: "Fit",
  recency: "Recency",
  source: "Source",
};

const fallbackContributionGroupByKey: Record<string, ContributionGroup> = {
  email_opens: "engagement",
  email_clicks: "engagement",
  page_views: "engagement",
  demo_requested: "engagement",
  industry_match: "fit",
  company_size_fit: "fit",
  budget_fit: "fit",
  recency: "recency",
  source_prior: "source",
};

function groupScoreBreakdown(items: Lead["scoreBreakdown"]) {
  const grouped = new Map<ContributionGroup | "ungrouped", Lead["scoreBreakdown"]>();

  items.forEach((item) => {
    const group = item.group ?? fallbackContributionGroupByKey[item.key] ?? "ungrouped";
    const bucket = grouped.get(group) ?? [];
    bucket.push(item);
    grouped.set(group, bucket);
  });

  const orderedGroups: Array<ContributionGroup | "ungrouped"> = [
    ...contributionGroupOrder.filter((group) => grouped.has(group)),
    ...(grouped.has("ungrouped") ? (["ungrouped"] as const) : []),
  ];

  return orderedGroups.map((group) => ({
    group,
    label: group === "ungrouped" ? "Ungrouped" : contributionGroupLabel[group],
    items: grouped.get(group) ?? [],
  }));
}

function tierTone(tier: Lead["tier"]) {
  if (tier === "hot") return "border-red-200 bg-red-50 text-red-700";
  if (tier === "warm") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-100 text-slate-700";
}

function confidenceTone(confidence: Lead["scoreConfidence"] | undefined) {
  if (confidence === "high") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (confidence === "medium") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-100 text-slate-700";
}

function confidenceLabel(confidence: Lead["scoreConfidence"] | undefined) {
  return (confidence ?? "low").toUpperCase();
}

function statusTone(status: LeadStatus) {
  if (status === "contacted") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "snoozed") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-100 text-slate-700";
}

function statusLabel(status: LeadStatus) {
  if (status === "contacted") return "Contacted";
  if (status === "snoozed") return "Snoozed";
  return "New";
}

function slaTone(state: ReturnType<typeof getSlaState>) {
  if (state === "responded") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (state === "overdue") return "border-red-200 bg-red-50 text-red-700";
  if (state === "due_soon") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-sky-200 bg-sky-50 text-sky-700";
}

function slaLabel(state: ReturnType<typeof getSlaState>) {
  if (state === "responded") return "Responded";
  if (state === "overdue") return "Overdue";
  if (state === "due_soon") return "Due soon";
  return "On track";
}

function getNextActionRecommendation(lead: Lead, status: LeadStatus, slaState: ReturnType<typeof getSlaState>) {
  if (status === "contacted") {
    return {
      title: "Move to follow-up cadence",
      detail: "This lead is already contacted. Keep momentum with a clear next touchpoint.",
      tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }
  if (status === "snoozed") {
    return {
      title: "Resume after snooze window",
      detail: "Wait until snooze expires, then review score signals before re-engaging.",
      tone: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }
  if (lead.tier === "hot" && slaState === "overdue") {
    return {
      title: "Contact today (high urgency)",
      detail: "Hot lead with delayed response window. Prioritize this outreach in this session.",
      tone: "border-red-200 bg-red-50 text-red-700",
    };
  }
  return {
    title: "Review and contact in this session",
    detail: "Use the score reasons to personalize outreach and move this lead forward quickly.",
    tone: "border-sky-200 bg-sky-50 text-sky-700",
  };
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
  const [demoSession, setDemoSession] = useState<DemoSessionState>(() => loadDemoSessionState());
  const [mode, setMode] = useState<WorkMode>("work");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [guestLeads, setGuestLeads] = useState<Lead[]>(() => scoreLeads(loadLeadsFromStorage() ?? mockLeads, DEFAULT_SCORING_CONFIG));
  const [kpis, setKpis] = useState<KpiState>({ totalLeads: 0, hotLeads: 0, warmLeads: 0, coldLeads: 0, avgScore: 0 });
  const isLoadingLeads = false;
  const isLoadingKpis = false;
  const [expanded, setExpanded] = useState<number | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [qualityProfile, setQualityProfile] = useState<QualityProfile>("all");
  const [workflowPreset, setWorkflowPreset] = useState<WorkflowPreset>("none");
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [leadUiState, setLeadUiState] = useState<LeadUIStateMap>(() => loadLeadUiState());
  const [openRowMenuLeadId, setOpenRowMenuLeadId] = useState<number | null>(null);
  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [enrichmentSuggestions, setEnrichmentSuggestions] = useState<EnrichmentSuggestion[]>([]);
  const [acceptedEnrichment, setAcceptedEnrichment] = useState<Record<string, string>>({});
  const [tourOpen, setTourOpen] = useState(false);
  const [tourStepIndex, setTourStepIndex] = useState(0);
  const acceptedCount = Object.keys(acceptedEnrichment).length;
  const pendingSuggestions = enrichmentSuggestions.filter((item) => acceptedEnrichment[item.id] === undefined);
  const activeScenario = demoScenarios[(demoSession.activeScenarioId ?? "high_intent_inbound") as DemoScenarioId];

  const confidenceToneBySuggestion: Record<EnrichmentSuggestion["confidence"], string> = {
    high: "border-emerald-200 bg-emerald-50 text-emerald-700",
    medium: "border-amber-200 bg-amber-50 text-amber-700",
    low: "border-slate-200 bg-slate-100 text-slate-700",
  };
  const suggestionById = useMemo(
    () =>
      Object.fromEntries(enrichmentSuggestions.map((suggestion) => [suggestion.id, suggestion])) as Record<
        string,
        EnrichmentSuggestion
      >,
    [enrichmentSuggestions],
  );
  const tourSteps = useMemo(
    () => [
      { id: "setup", title: "Setup", body: "Start with Setup Mode to review CSV mappings and preview enrichment before import." },
      { id: "score", title: "Score", body: "Use explainable score details to understand why leads are HOT, WARM, or COLD." },
      { id: "act", title: "Act", body: "Use quick actions and shortcuts to contact, snooze, or pin leads rapidly." },
      { id: "analyze", title: "Analyze", body: "Open Analytics to explain what changed and why in this scenario." },
    ],
    [],
  );

  const importer = useLeadImport<LeadFieldKey>({
    leadFields,
    buildLeadFromRow: (row, mapping, id) => {
      const rowIndex = id - 1;
      const resolveValue = (field: LeadFieldKey) => {
        const suggestionKey = `${rowIndex}:${field}`;
        if (acceptedEnrichment[suggestionKey] !== undefined) {
          return acceptedEnrichment[suggestionKey];
        }
        const column = mapping[field];
        return column ? (row[column] ?? "").trim() : "";
      };

      const name = resolveValue("name");
      const company = resolveValue("company");
      const email = resolveValue("email").toLowerCase();
      const source = resolveValue("source") || "Website";
      const lastActivity = resolveValue("lastActivity") || "7 days ago";
      const result = scoreLead(
        {
          name,
          company,
          source,
          lastActivity,
          emailOpens: parseNumber(resolveValue("emailOpens")),
          emailClicks: parseNumber(resolveValue("emailClicks")),
          pageViews: parseNumber(resolveValue("pageViews")),
          demoRequested: parseBoolean(resolveValue("demoRequested")),
          industryMatch: parseBoolean(resolveValue("industryMatch")),
          companySizeFit: parseBoolean(resolveValue("companySizeFit")),
          budgetFit: parseBoolean(resolveValue("budgetFit")),
        },
        DEFAULT_SCORING_CONFIG,
      );
      const enrichmentMeta = buildLeadEnrichmentMeta({
        row,
        mapping: mapping as Record<string, string>,
        rowIndex,
        acceptedById: acceptedEnrichment,
        suggestionById,
        trackedFields: leadFields.map((field) => field.key),
      });

      return {
        id,
        rank: id,
        name,
        company,
        email,
        source,
        score: result.score,
        scoreConfidence: result.scoreConfidence,
        tier: result.tier,
        reasons: result.topReasons,
        lastActivity,
        aiExplanation: result.explanation,
        scoreBreakdown: result.contributions.map((item) => ({
          key: item.key,
          label: item.label,
          value: item.value,
          group: item.group,
        })),
        enrichmentMeta,
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

  const hasAdvancedFiltersActive = search.trim().length > 0 || tierFilter !== "all" || qualityProfile !== "all";

  const applyWorkflowPreset = (preset: WorkflowPreset) => {
    setWorkflowPreset(preset);
    setPage(1);
    trackPrototypeEvent("filter_used", { filter: "workflowPreset", value: preset });
    if (preset === "hot_today") {
      setTierFilter("hot");
      setQualityProfile("all");
    } else if (preset === "high_intent_fit") {
      setQualityProfile("high_intent");
    }
  };

  const resetAllFilters = () => {
    setPage(1);
    setSearch("");
    setTierFilter("all");
    setQualityProfile("all");
    setWorkflowPreset("none");
    setAdvancedFiltersOpen(false);
    trackPrototypeEvent("filter_used", { filter: "reset", value: "all" });
  };

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
      .filter((lead) => {
        const state = leadUiState[lead.id];
        if (workflowPreset === "hot_today") {
          return !isSnoozed(state);
        }
        if (workflowPreset === "no_recent_touch") {
          if (state?.status === "contacted") return false;
          const ageHours = parseLastActivityHours(lead.lastActivity);
          return ageHours !== null && ageHours > 72;
        }
        if (workflowPreset === "high_intent_fit") {
          return lead.scoreConfidence === "high" || lead.scoreConfidence === "medium";
        }
        return true;
      })
      .sort((a, b) => sortLeadsByWorkflowPriority(a, b, leadUiState[a.id], leadUiState[b.id]))
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
    setFocusedIndex((current) => Math.min(current, Math.max(0, items.length - 1)));
  };

  const fetchKpis = () => {
    setKpis(buildGuestKpis(guestLeads));
  };

  useEffect(() => {
    fetchLeads();
  }, [page, search, tierFilter, qualityProfile, workflowPreset, guestLeads, filteredGuestLeads, leadUiState]);

  useEffect(() => {
    fetchKpis();
  }, [guestLeads]);

  useEffect(() => {
    saveLeadUiState(leadUiState);
  }, [leadUiState]);

  useEffect(() => {
    saveLeadsToStorage(guestLeads);
  }, [guestLeads]);

  useEffect(() => {
    const syncDemo = () => setDemoSession(loadDemoSessionState());
    const onResetScenario = (event: Event) => {
      const custom = event as CustomEvent<{ scenarioId?: DemoScenarioId }>;
      const scenarioId = custom.detail?.scenarioId ?? loadDemoSessionState().activeScenarioId ?? "high_intent_inbound";
      const scenario = demoScenarios[scenarioId];
      if (!scenario) return;

      const seeded = scoreLeads(scenario.seedLeads, DEFAULT_SCORING_CONFIG);
      setGuestLeads(seeded);
      setLeadUiState({});
      setMode("work");
      setPage(1);
      setSearch("");
      setTierFilter("all");
      setQualityProfile("all");
      setWorkflowPreset("none");
      setExpanded(null);
      setAcceptedEnrichment({});
      setEnrichmentSuggestions([]);
      setPreview(null);
      saveLeadsToStorage(seeded);
      resetScenarioState(scenarioId);
      trackPrototypeEvent("scenario_reset", { scenarioId });
      setDemoSession(loadDemoSessionState());
    };
    const onStartTour = () => {
      setTourStepIndex(0);
      setTourOpen(true);
      trackPrototypeEvent("tour_step_viewed", { scenarioId: demoSession.activeScenarioId ?? "high_intent_inbound", step: "setup", stepIndex: 0 });
    };

    window.addEventListener("lead-scorer:demo-session-updated", syncDemo);
    window.addEventListener("lead-scorer:demo-reset-scenario", onResetScenario as EventListener);
    window.addEventListener("lead-scorer:demo-start-tour", onStartTour);
    return () => {
      window.removeEventListener("lead-scorer:demo-session-updated", syncDemo);
      window.removeEventListener("lead-scorer:demo-reset-scenario", onResetScenario as EventListener);
      window.removeEventListener("lead-scorer:demo-start-tour", onStartTour);
    };
  }, [demoSession.activeScenarioId]);

  useEffect(() => {
    if (!demoSession.enabled) return;
    const scenarioId = demoSession.activeScenarioId ?? "high_intent_inbound";
    if (demoSession.tourCompletedByScenario[scenarioId]) return;
    setTourStepIndex(0);
    setTourOpen(true);
    trackPrototypeEvent("tour_step_viewed", { scenarioId, step: "setup", stepIndex: 0 });
  }, [demoSession.enabled, demoSession.activeScenarioId, demoSession.tourCompletedByScenario]);

  useEffect(() => {
    if (expanded === null) return;
    trackPrototypeEvent("lead_expanded", { leadId: expanded });
  }, [expanded]);

  useEffect(() => {
    if (openRowMenuLeadId === null) return;

    const onDocumentPointerDown = () => {
      setOpenRowMenuLeadId(null);
    };

    const onDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenRowMenuLeadId(null);
      }
    };

    document.addEventListener("pointerdown", onDocumentPointerDown);
    document.addEventListener("keydown", onDocumentKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onDocumentPointerDown);
      document.removeEventListener("keydown", onDocumentKeyDown);
    };
  }, [openRowMenuLeadId]);

  useEffect(() => {
    if (!importer.csvRows.length) {
      setEnrichmentSuggestions([]);
      setAcceptedEnrichment({});
      return;
    }
    const previewData = buildEnrichmentPreview(importer.csvRows, importer.mapping as Record<string, string>);
    setEnrichmentSuggestions(previewData.suggestions);
    setAcceptedEnrichment((prev) => {
      const next: Record<string, string> = {};
      previewData.suggestions.forEach((suggestion) => {
        if (prev[suggestion.id] !== undefined) {
          next[suggestion.id] = prev[suggestion.id];
        }
      });
      return next;
    });
  }, [importer.csvRows, importer.mapping]);

  useEffect(() => {
    setPreview(null);
    setAcceptedEnrichment({});
  }, [importer.csvContent]);

  const markLeadContacted = (leadId: number) => {
    trackPrototypeEvent("action_clicked", { action: "contacted", leadId });
    setLeadUiState((prev) => ({
      ...prev,
      [leadId]: {
        ...(prev[leadId] ?? { leadId }),
        leadId,
        status: "contacted",
        contactedAt: new Date().toISOString(),
        snoozedUntil: undefined,
      },
    }));
  };

  const snoozeLead24h = (leadId: number) => {
    trackPrototypeEvent("action_clicked", { action: "snooze_24h", leadId });
    const snoozedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    setLeadUiState((prev) => ({
      ...prev,
      [leadId]: {
        ...(prev[leadId] ?? { leadId }),
        leadId,
        status: "snoozed",
        snoozedUntil,
      },
    }));
  };

  const toggleLeadPin = (leadId: number) => {
    trackPrototypeEvent("action_clicked", { action: "pin_toggle", leadId });
    setLeadUiState((prev) => {
      const current = prev[leadId];
      return {
        ...prev,
        [leadId]: {
          ...(current ?? { leadId, status: "new" as const }),
          leadId,
          status: current?.status ?? "new",
          pinned: !current?.pinned,
        },
      };
    });
  };

  useEffect(() => {
    if (mode !== "work") return;

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      const isTypingTarget = Boolean(
        target?.isContentEditable || tagName === "input" || tagName === "textarea" || tagName === "select",
      );
      if (isTypingTarget) return;
      if (!leads.length) return;

      const focusedLead = leads[Math.min(focusedIndex, leads.length - 1)];
      if (!focusedLead) return;

      if (event.key === "j") {
        event.preventDefault();
        setFocusedIndex((current) => Math.min(leads.length - 1, current + 1));
      } else if (event.key === "k") {
        event.preventDefault();
        setFocusedIndex((current) => Math.max(0, current - 1));
      } else if (event.key === "Enter") {
        event.preventDefault();
        setExpanded((current) => (current === focusedLead.id ? null : focusedLead.id));
      } else if (event.key === "c") {
        event.preventDefault();
        markLeadContacted(focusedLead.id);
      } else if (event.key === "s") {
        event.preventDefault();
        snoozeLead24h(focusedLead.id);
      } else if (event.key === "p") {
        event.preventDefault();
        toggleLeadPin(focusedLead.id);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mode, leads, focusedIndex]);

  const handleImport = async () => {
    trackPrototypeEvent("import_clicked", { mode });
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
    setEnrichmentSuggestions([]);
    setAcceptedEnrichment({});
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

                  {enrichmentSuggestions.length > 0 && (
                    <Card className="border-dashed">
                      <CardContent className="space-y-3 p-3 text-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Step 1.5</p>
                            <p className="text-sm font-medium">Enrichment Preview (Prototype)</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">{enrichmentSuggestions.length} suggestions</Badge>
                            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">{acceptedCount} accepted</Badge>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Review mock field completions before import. Accepted suggestions are applied only in this session.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const allAccepted: Record<string, string> = {};
                              enrichmentSuggestions.forEach((suggestion) => {
                                allAccepted[suggestion.id] = suggestion.suggestedValue;
                              });
                              setAcceptedEnrichment(allAccepted);
                            }}
                          >
                            Accept all
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setAcceptedEnrichment({})}>
                            Reset
                          </Button>
                          <p className="self-center text-xs text-muted-foreground">
                            Pending: {pendingSuggestions.length}
                          </p>
                        </div>
                        <div className="space-y-2">
                          {enrichmentSuggestions.slice(0, 10).map((suggestion) => {
                            const accepted = acceptedEnrichment[suggestion.id] !== undefined;
                            return (
                              <div key={suggestion.id} className="space-y-2 rounded-md border p-2">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <p className="text-xs text-muted-foreground">
                                    Row {suggestion.rowNumber} · {suggestion.field}
                                  </p>
                                  <Badge variant="outline" className={cn("capitalize", confidenceToneBySuggestion[suggestion.confidence])}>
                                    {suggestion.confidence}
                                  </Badge>
                                </div>
                                <p className="text-sm">
                                  <span className="text-muted-foreground">Current:</span>{" "}
                                  <span className="font-medium">{suggestion.currentValue || "empty"}</span>
                                  {"  "}
                                  <span className="text-muted-foreground">{"->"} Suggested:</span>{" "}
                                  <span className="font-semibold">{suggestion.suggestedValue}</span>
                                </p>
                                <p className="text-xs text-muted-foreground">{suggestion.reason}</p>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant={accepted ? "secondary" : "outline"}
                                    onClick={() =>
                                      setAcceptedEnrichment((prev) => ({
                                        ...prev,
                                        [suggestion.id]: suggestion.suggestedValue,
                                      }))
                                    }
                                  >
                                    {accepted ? "Applied" : "Apply"}
                                  </Button>
                                  {accepted && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() =>
                                        setAcceptedEnrichment((prev) => {
                                          const next = { ...prev };
                                          delete next[suggestion.id];
                                          return next;
                                        })
                                      }
                                    >
                                      Undo
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {enrichmentSuggestions.length > 10 && (
                          <p className="text-xs text-muted-foreground">
                            Showing first 10 suggestions for quick scan.
                          </p>
                        )}
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
            {demoSession.enabled && activeScenario && (
              <DemoReadinessPanel
                scenario={activeScenario}
                onReset={() =>
                  window.dispatchEvent(
                    new CustomEvent("lead-scorer:demo-reset-scenario", {
                      detail: { scenarioId: demoSession.activeScenarioId ?? "high_intent_inbound" },
                    }),
                  )
                }
              />
            )}
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
              <CardContent className="space-y-2.5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="inline-flex items-center gap-2 text-sm font-medium"><Filter className="h-4 w-4" />Queue Filters</p>
                  <p className="text-xs text-muted-foreground">Preset: {workflowPresetLabel[workflowPreset]} · {qualityProfileMeta[qualityProfile]}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={workflowPreset === "hot_today" ? "secondary" : "outline"}
                    onClick={() => applyWorkflowPreset("hot_today")}
                  >
                    Hot today
                  </Button>
                  <Button
                    size="sm"
                    variant={workflowPreset === "no_recent_touch" ? "secondary" : "outline"}
                    onClick={() => applyWorkflowPreset("no_recent_touch")}
                  >
                    No recent touch
                  </Button>
                  <Button
                    size="sm"
                    variant={workflowPreset === "high_intent_fit" ? "secondary" : "outline"}
                    onClick={() => applyWorkflowPreset("high_intent_fit")}
                  >
                    High intent + fit
                  </Button>
                </div>
                <Collapsible open={advancedFiltersOpen} onOpenChange={(isOpen) => setAdvancedFiltersOpen(isOpen)}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" size="sm">
                        {advancedFiltersOpen ? "Hide advanced filters" : "Advanced filters"}
                      </Button>
                    </CollapsibleTrigger>
                    {hasAdvancedFiltersActive && (
                      <Badge variant="outline" className="border-border/70 bg-muted/40 text-xs text-muted-foreground">Advanced active</Badge>
                    )}
                  </div>
                  <CollapsibleContent className="space-y-2 pt-1">
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
                      <Select value={tierFilter} onValueChange={(value) => { setPage(1); setTierFilter(value); trackPrototypeEvent("filter_used", { filter: "tier", value }); }}>
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
                          trackPrototypeEvent("filter_used", { filter: "qualityProfile", value });
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
                      <Button variant="outline" onClick={resetAllFilters}>
                        Reset filters
                      </Button>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
                <p className="text-[11px] text-muted-foreground">Keys: j/k, Enter, c/s/p.</p>
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
                  {!isLoadingLeads && leads.map((lead, rowIndex) => {
                    const groupedBreakdown = groupScoreBreakdown(lead.scoreBreakdown);
                    const uiState = leadUiState[lead.id];
                    const isFocused = focusedIndex === rowIndex;
                    const isLeadSnoozed = isSnoozed(uiState);
                    const effectiveStatus: LeadStatus =
                      uiState?.status === "contacted" ? "contacted" : isLeadSnoozed ? "snoozed" : "new";
                    const slaState = getSlaState(lead, uiState);
                    const nextAction = getNextActionRecommendation(lead, effectiveStatus, slaState);

                    return (
                      <Collapsible key={lead.id} open={expanded === lead.id} onOpenChange={(isOpen) => setExpanded(isOpen ? lead.id : null)} asChild>
                        <>
                          <CollapsibleTrigger asChild>
                            <TableRow
                              className={cn("cursor-pointer hover:bg-muted/35", isFocused && "bg-muted/45 outline outline-1 outline-primary")}
                              title="Expand lead details"
                              onMouseEnter={() => setFocusedIndex(rowIndex)}
                            >
                              <TableCell className="text-muted-foreground">{lead.rank}</TableCell>
                              <TableCell>
                                <p className="font-medium">{lead.name}</p>
                                <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                                  <p className="text-xs text-muted-foreground">{lead.email}</p>
                                  <span className={cn("rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide", statusTone(effectiveStatus))}>
                                    {statusLabel(effectiveStatus)}
                                  </span>
                                  <span className={cn("rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide", slaTone(slaState))}>
                                    {slaLabel(slaState)}
                                  </span>
                                  <p className="text-[10px] text-muted-foreground/80">
                                    Conf {confidenceLabel(lead.scoreConfidence)}
                                    {lead.enrichmentMeta?.applied ? ` · Enriched +${lead.enrichmentMeta.changeCount}` : ""}
                                    {uiState?.pinned ? " · Pinned" : ""}
                                  </p>
                                </div>
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
                                <div className="relative inline-flex flex-wrap items-center justify-end gap-1">
                                  <Button variant="ghost" size="icon" title="Email lead" aria-label={`Email ${lead.name}`} onClick={(event) => event.stopPropagation()}><Mail className="h-4 w-4" /></Button>
                                  <Button size="sm" onClick={(event) => { event.stopPropagation(); markLeadContacted(lead.id); }}>
                                    Contacted
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    aria-label={`More actions for ${lead.name}`}
                                    aria-haspopup="menu"
                                    aria-expanded={openRowMenuLeadId === lead.id}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setOpenRowMenuLeadId((current) => (current === lead.id ? null : lead.id));
                                    }}
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                    More
                                  </Button>
                                  {openRowMenuLeadId === lead.id && (
                                    <div
                                      role="menu"
                                      className="absolute right-0 top-full z-20 mt-1 w-36 space-y-1 rounded-md border bg-background p-1 shadow-md"
                                      onClick={(event) => event.stopPropagation()}
                                      onPointerDown={(event) => event.stopPropagation()}
                                    >
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        role="menuitem"
                                        className="w-full justify-start"
                                        onClick={() => {
                                          snoozeLead24h(lead.id);
                                          setOpenRowMenuLeadId(null);
                                        }}
                                      >
                                        Snooze 24h
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        role="menuitem"
                                        className="w-full justify-start"
                                        onClick={() => {
                                          toggleLeadPin(lead.id);
                                          setOpenRowMenuLeadId(null);
                                        }}
                                      >
                                        {uiState?.pinned ? "Unpin" : "Pin"}
                                      </Button>
                                    </div>
                                  )}
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
                                  <div className="mt-1 flex flex-wrap items-center gap-2">
                                    <p className="text-xs text-muted-foreground">Tier: {lead.tier.toUpperCase()} · Last activity: {lead.lastActivity}</p>
                                    <span className={cn("rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", confidenceTone(lead.scoreConfidence))}>
                                      Confidence: {confidenceLabel(lead.scoreConfidence)}
                                    </span>
                                  </div>
                                </div>

                                <div className={cn("space-y-1 rounded-md border p-3", nextAction.tone)}>
                                  <p className="text-xs font-medium uppercase tracking-wide">Recommended next action</p>
                                  <p className="text-sm font-semibold">{nextAction.title}</p>
                                  <p className="text-xs">{nextAction.detail}</p>
                                </div>

                                <div className="space-y-2.5 rounded-md border bg-background p-3">
                                  <div>
                                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Details</p>
                                    <p className="mt-1 text-xs text-muted-foreground">{lead.aiExplanation}</p>
                                  </div>
                                  {lead.enrichmentMeta?.applied && (
                                    <div className="space-y-2 rounded-md border border-border/70 bg-muted/15 p-2.5">
                                      <div className="flex flex-wrap items-center justify-between gap-2">
                                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Enrichment changes (prototype)</p>
                                        <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">
                                          +{lead.enrichmentMeta.changeCount} fields
                                        </Badge>
                                      </div>
                                      <div className="space-y-1.5">
                                        {lead.enrichmentMeta.changes.slice(0, 6).map((change) => (
                                          <div key={`${lead.id}-${change.field}-${change.enrichedValue}`} className="rounded border bg-background px-2 py-1.5 text-xs">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                              <p className="font-medium capitalize">{change.field}</p>
                                              <span className={cn("rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide", confidenceToneBySuggestion[change.confidence])}>
                                                {change.confidence}
                                              </span>
                                            </div>
                                            <p className="text-muted-foreground">
                                              {(change.originalValue || "empty")} {"->"} {change.enrichedValue}
                                            </p>
                                            <p className="text-muted-foreground">{change.reason}</p>
                                          </div>
                                        ))}
                                      </div>
                                      {lead.enrichmentMeta.changeCount > 6 && (
                                        <p className="text-[11px] text-muted-foreground">
                                          +{lead.enrichmentMeta.changeCount - 6} more changes
                                        </p>
                                      )}
                                    </div>
                                  )}
                                  <div className="grid gap-2 md:grid-cols-2">
                                    {groupedBreakdown.map((section) => (
                                      <div key={`${lead.id}-${section.group}`} className="space-y-1.5 rounded-md border border-border/70 bg-muted/15 p-2">
                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{section.label}</p>
                                        <div className="space-y-1">
                                          {section.items.map((item) => (
                                            <div key={`${lead.id}-${section.group}-${item.key}`} className="flex items-center justify-between rounded border bg-background px-2 py-1 text-xs">
                                              <span className="text-muted-foreground">{item.label}</span>
                                              <span className={cn("font-semibold", item.value < 0 && "text-destructive")}>{item.value >= 0 ? `+${item.value}` : item.value}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          </CollapsibleContent>
                        </>
                      </Collapsible>
                    );
                  })}
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
      <GuidedTourOverlay
        open={tourOpen}
        steps={tourSteps}
        stepIndex={tourStepIndex}
        onClose={() => setTourOpen(false)}
        onPrev={() => {
          setTourStepIndex((current) => Math.max(0, current - 1));
        }}
        onNext={() => {
          const scenarioId = demoSession.activeScenarioId ?? "high_intent_inbound";
          const nextStep = tourStepIndex + 1;
          if (nextStep >= tourSteps.length) {
            markTourCompleted(scenarioId);
            setDemoSession(loadDemoSessionState());
            trackPrototypeEvent("tour_completed", { scenarioId });
            setTourOpen(false);
            return;
          }
          setTourStepIndex(nextStep);
          trackPrototypeEvent("tour_step_viewed", {
            scenarioId,
            step: tourSteps[nextStep].id,
            stepIndex: nextStep,
          });
        }}
      />
    </DashboardShell>
  );
};

export default Dashboard;
