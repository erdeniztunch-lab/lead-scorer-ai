import { type LucideIcon, Activity, BarChart3, Clock3, FileSpreadsheet, ListChecks, Target } from "lucide-react";

export interface LandingEvidenceItem {
  title: string;
  value: string;
  micro: string;
  icon: LucideIcon;
}

export interface LandingStepItem {
  step: string;
  title: string;
  oneLiner: string;
}

export interface LandingProofItem {
  title: string;
  detail: string;
}

export interface LandingFaqItem {
  question: string;
  answer: string;
}

export const landingCopy = {
  navCta: "Try in Dashboard",
  heroKicker: "Operational Intelligence For SMB Sales",
  heroTitle: "Stop guessing which lead to call first.",
  heroDescription:
    "LeadScorer ranks inbound leads, explains each score in plain language, and gives reps one focused queue for daily outreach.",
  heroPrimaryCta: "Try in Dashboard",
  heroSecondaryCta: "See How It Works",
  heroTrustLine: "No setup call. Upload CSV, map fields, and start scoring in minutes.",
  evidenceTitle: "Product Evidence",
  evidenceDescription: "What you can do today, at a glance.",
  workflowTitle: "How It Works",
  workflowDescription: "Three steps, one repeatable rhythm.",
  proofTitle: "Trust Snapshot",
  proofDescription: "Live capabilities and current limits in one view.",
  faqTitle: "Quick FAQ",
  faqDescription: "Only what you need before trying.",
  finalCtaTitle: "See your own leads in a prioritized queue",
  finalCtaBody: "Use your CSV, review explainable scores, and decide your first outreach moves in one workspace.",
  finalCtaButton: "Try in Dashboard",
} as const;

export const evidenceItems: LandingEvidenceItem[] = [
  {
    title: "Field Mapping",
    value: "Required-Field Guardrails",
    micro: "Map required fields before scoring starts.",
    icon: FileSpreadsheet,
  },
  {
    title: "Score Explainability",
    value: "Reason Codes Per Lead",
    micro: "See why each lead is ranked.",
    icon: BarChart3,
  },
  {
    title: "Action Readiness",
    value: "Queue To Outreach",
    micro: "Move from queue to contact quickly.",
    icon: Target,
  },
  {
    title: "Execution Visibility",
    value: "Session Analytics",
    micro: "Track distribution and top signals.",
    icon: Activity,
  },
];

export const workflowItems: LandingStepItem[] = [
  {
    step: "01",
    title: "Upload And Map",
    oneLiner: "Import CSV and map required fields.",
  },
  {
    step: "02",
    title: "Score And Explain",
    oneLiner: "Get ranked leads with reason codes.",
  },
  {
    step: "03",
    title: "Act And Track",
    oneLiner: "Run outreach and review quality signals.",
  },
];

export const liveTodayProof: LandingProofItem[] = [
  {
    title: "CSV-first import flow",
    detail: "Upload, parse, map required fields, and validate rows before import.",
  },
  {
    title: "Deterministic score tiers",
    detail: "Hot/warm/cold routing with explicit thresholds and score breakdown visibility.",
  },
  {
    title: "Downloadable issue report",
    detail: "Invalid rows can be reviewed in a generated CSV issue file.",
  },
  {
    title: "Session-based analytics",
    detail: "Distribution, top reasons, and signal summaries are visible in prototype mode.",
  },
];

export const roadmapProof: LandingProofItem[] = [
  {
    title: "Backend persistence",
    detail: "Current mode is session/local. Durable storage is not yet active in this phase.",
  },
  {
    title: "Native CRM integrations",
    detail: "Product currently starts from CSV; direct CRM sync is a planned extension.",
  },
  {
    title: "Automated outreach orchestration",
    detail: "Current flow helps prioritization and manual action, not full outbound automation.",
  },
];

export const faqItems: LandingFaqItem[] = [
  {
    question: "Can I use my own CSV format?",
    answer:
      "Yes. You can map your CSV columns to required fields before import, so your existing sheet structure does not need a perfect template.",
  },
  {
    question: "Is data persisted in this phase?",
    answer:
      "Prototype mode is session/local only. Data is not persisted to a backend in this current phase.",
  },
];

export const queueSnapshot = {
  summary: [
    { label: "Hot Leads", value: "12", tone: "text-score-hot" },
    { label: "Avg Score", value: "74", tone: "text-primary" },
    { label: "First Touch SLA", value: "< 30m", tone: "text-accent" },
  ],
  leads: [
    { name: "Ava Patel", company: "NorthPeak Retail", score: 92, tier: "hot", reason: "Demo requested" },
    { name: "Liam Chen", company: "Studio Aster", score: 86, tier: "hot", reason: "High engagement" },
    { name: "Noah Rivera", company: "Greenline Goods", score: 71, tier: "warm", reason: "Strong ICP fit" },
    { name: "Mila Johnson", company: "Velora Home", score: 64, tier: "warm", reason: "Recent activity" },
  ],
  footerNote: "Queue snapshot based on prototype scoring logic.",
  latencyLabel: "Median setup time",
  latencyValue: "5 min",
  latencyIcon: Clock3,
};
