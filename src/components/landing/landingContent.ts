import { type LucideIcon, Activity, BarChart3, Clock3, FileSpreadsheet, Target } from "lucide-react";

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
  output: string;
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
  evidenceDescription: "What your team can do in the next 10 minutes.",
  workflowTitle: "How It Works",
  workflowDescription: "Three steps your team can scan in seconds.",
  proofTitle: "Trust Snapshot",
  proofDescription: "Live now, limits, and critical FAQs in one block.",
  faqTitle: "Quick FAQ",
  finalCtaTitle: "See your own leads in a prioritized queue",
  finalCtaBody: "Use your CSV, review explainable scores, and decide your first outreach moves in one workspace.",
  finalCtaButton: "Try in Dashboard",
} as const;

export const evidenceItems: LandingEvidenceItem[] = [
  {
    title: "Upload CSV",
    value: "Queue Ready In Minutes",
    micro: "Map fields once and start scoring.",
    icon: FileSpreadsheet,
  },
  {
    title: "See Score Reasons",
    value: "Defend Every Priority",
    micro: "Grouped signals explain each score.",
    icon: BarChart3,
  },
  {
    title: "Run Triage Fast",
    value: "Contact The Right Leads First",
    micro: "Use presets, shortcuts, and quick actions.",
    icon: Target,
  },
  {
    title: "Replay Demo Flow",
    value: "Reset And Rerun Anytime",
    micro: "Use scenarios, guided tour, and one-click reset.",
    icon: Activity,
  },
];

export const workflowItems: LandingStepItem[] = [
  {
    step: "01",
    title: "Upload",
    oneLiner: "Import CSV and map required fields.",
    output: "Queue ready",
  },
  {
    step: "02",
    title: "Score",
    oneLiner: "Get ranked leads with reason codes.",
    output: "Hot/Warm/Cold + reasons",
  },
  {
    step: "03",
    title: "Act",
    oneLiner: "Prioritize, triage, and review narrative analytics.",
    output: "Contacted/Snoozed/Pinned",
  },
];

export const liveTodayProof: LandingProofItem[] = [
  {
    title: "Import CSV and get a ranked queue in minutes",
    detail: "Upload, map required fields, and move directly into prioritized work mode.",
  },
  {
    title: "Understand every score with grouped reasons and confidence",
    detail: "See deterministic hot/warm/cold logic with transparent contribution groups.",
  },
  {
    title: "Run triage fast with presets, shortcuts, and quick actions",
    detail: "Use contacted/snoozed/pinned states and keyboard flow to move faster.",
  },
  {
    title: "Review analytics narrative and settings impact before changes",
    detail: "Track what changed and preview scoring impact before saving.",
  },
];

export const roadmapProof: LandingProofItem[] = [
  {
    title: "No backend persistence yet (session/local only)",
    detail: "Data is kept in frontend prototype storage for the current phase.",
  },
  {
    title: "No native CRM sync yet (CSV-first)",
    detail: "Import starts from CSV mapping; direct integrations are not active yet.",
  },
  {
    title: "No automated outreach orchestration yet",
    detail: "Current product supports prioritization and manual execution, not full automation.",
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
