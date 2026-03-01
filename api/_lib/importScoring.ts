import { type CsvRow } from "./csv";

export interface ImportLeadOutput {
  name: string;
  company: string;
  email: string;
  source: string;
  score: number;
  tier: "hot" | "warm" | "cold";
  reasons: string[];
  lastActivity: string;
  aiExplanation: string;
  scoreBreakdown: Array<{ key: string; label: string; value: number }>;
  scoreVersion: string;
  scoredAt: string;
}

function parseBoolean(value: string): boolean | null {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (["true", "yes", "1", "y"].includes(normalized)) return true;
  if (["false", "no", "0", "n"].includes(normalized)) return false;
  return null;
}

function parseNumber(value: string): number | null {
  const parsed = Number(value.trim());
  if (Number.isNaN(parsed) || !Number.isFinite(parsed)) return null;
  return parsed;
}

function parseLastActivityDays(value: string): number {
  const match = value.toLowerCase().match(/(\d+)\s*(hour|hours|day|days|week|weeks)/);
  if (!match) return 30;
  const amount = Number(match[1]);
  const unit = match[2];
  if (unit.startsWith("hour")) return Math.max(0, amount / 24);
  if (unit.startsWith("day")) return amount;
  if (unit.startsWith("week")) return amount * 7;
  return 30;
}

function deriveTier(score: number): "hot" | "warm" | "cold" {
  if (score >= 80) return "hot";
  if (score >= 60) return "warm";
  return "cold";
}

export function scoreFromImport(row: CsvRow, mapping: Record<string, string>): ImportLeadOutput {
  const name = (row[mapping.name] ?? "").trim();
  const company = (row[mapping.company] ?? "").trim();
  const email = (row[mapping.email] ?? "").trim().toLowerCase();
  const source = (row[mapping.source] ?? "").trim() || "Imported CSV";
  const lastActivity = (row[mapping.lastActivity] ?? "").trim() || "Imported recently";

  const emailOpens = parseNumber(row[mapping.emailOpens] ?? "") ?? 0;
  const emailClicks = parseNumber(row[mapping.emailClicks] ?? "") ?? 0;
  const pageViews = parseNumber(row[mapping.pageViews] ?? "") ?? 0;
  const demoRequested = parseBoolean(row[mapping.demoRequested] ?? "") ?? false;
  const industryMatch = parseBoolean(row[mapping.industryMatch] ?? "") ?? false;
  const companySizeFit = parseBoolean(row[mapping.companySizeFit] ?? "") ?? false;
  const budgetFit = parseBoolean(row[mapping.budgetFit] ?? "") ?? false;

  const contributions: Array<{ key: string; label: string; value: number }> = [];
  contributions.push({ key: "email_opens", label: "Email opens", value: Math.min(emailOpens * 2, 10) });
  contributions.push({ key: "email_clicks", label: "Email clicks", value: Math.min(emailClicks * 4, 12) });
  contributions.push({ key: "page_views", label: "High page views", value: Math.min(pageViews, 10) });
  contributions.push({ key: "demo_requested", label: "Demo requested", value: demoRequested ? 8 : 0 });
  contributions.push({ key: "industry_match", label: "Industry match", value: industryMatch ? 15 : 0 });
  contributions.push({ key: "company_size_fit", label: "Company size fit", value: companySizeFit ? 10 : 0 });
  contributions.push({ key: "budget_fit", label: "Budget fit", value: budgetFit ? 10 : 0 });

  const days = parseLastActivityDays(lastActivity);
  let recencyValue = 2;
  if (days <= 1) recencyValue = 15;
  else if (days <= 3) recencyValue = 10;
  else if (days <= 7) recencyValue = 6;
  contributions.push({ key: "recency", label: "Recent activity", value: recencyValue });

  const sourcePriorMap: Record<string, number> = {
    referral: 10,
    webinar: 8,
    website: 6,
    linkedin: 5,
    "google ads": 3,
    "cold outbound": -2,
  };
  contributions.push({
    key: "source_prior",
    label: "Source quality",
    value: sourcePriorMap[source.toLowerCase()] ?? 0,
  });

  const rawScore = contributions.reduce((sum, item) => sum + item.value, 0);
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));
  const tier = deriveTier(score);
  const reasons = contributions
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 2)
    .map((item) => item.label);
  const reasonText = reasons.length > 0 ? reasons.join(" and ") : "baseline profile signals";
  const aiExplanation = `${name} at ${company} is ranked as ${tier.toUpperCase()} based on ${reasonText}. Prioritize follow-up according to this signal mix.`;

  return {
    name,
    company,
    email,
    source,
    score,
    tier,
    reasons,
    lastActivity,
    aiExplanation,
    scoreBreakdown: contributions,
    scoreVersion: "v1.0.0",
    scoredAt: new Date().toISOString(),
  };
}
