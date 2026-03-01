import { type ScoringConfig } from "./scoringConfig";

interface ScoreContribution {
  key: string;
  label: string;
  value: number;
}

interface ScoreInput {
  name: string;
  company: string;
  source: string;
  lastActivity: string;
}

const SIGNAL_LABELS: Record<string, string> = {
  email_opens: "Frequent email opens",
  email_clicks: "Clicked outreach links",
  page_views: "High website activity",
  demo_requested: "Requested a demo",
  industry_match: "Strong ICP industry fit",
  company_size_fit: "Company size matches ICP",
  budget_fit: "Budget fit signal",
  recency: "Recent activity",
  source_prior: "Source quality signal",
};

function labelForSignal(key: string, fallback: string): string {
  return SIGNAL_LABELS[key] ?? fallback;
}

function parseLastActivityDays(value: string): number {
  const match = value.toLowerCase().match(/(\d+)\s*(hour|hours|day|days|week|weeks)/);
  if (!match) return 30;
  const amount = Number(match[1]);
  const unit = match[2];
  if (unit.startsWith("hour")) return amount / 24;
  if (unit.startsWith("day")) return amount;
  if (unit.startsWith("week")) return amount * 7;
  return 30;
}

function fallbackSignal(name: string, seed: number, min: number, max: number): number {
  const hash = `${name}_${seed}`.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return min + (hash % (max - min + 1));
}

function deriveTier(score: number, config: ScoringConfig): "hot" | "warm" | "cold" {
  if (score >= config.thresholds.hotMin) return "hot";
  if (score >= config.thresholds.warmMin) return "warm";
  return "cold";
}

export function scoreLeadWithConfig(input: ScoreInput, config: ScoringConfig) {
  const contributions: ScoreContribution[] = [];

  const emailOpens = Math.min(fallbackSignal(input.name, 17, 1, 6) * 2, config.weights.engagement.emailOpensCap);
  const emailClicks = Math.min(fallbackSignal(input.name, 29, 0, 4) * 4, config.weights.engagement.emailClicksCap);
  const pageViews = Math.min(fallbackSignal(input.name, 13, 1, 12), config.weights.engagement.pageViewsCap);

  contributions.push({ key: "email_opens", label: labelForSignal("email_opens", "Email opens"), value: emailOpens });
  contributions.push({ key: "email_clicks", label: labelForSignal("email_clicks", "Email clicks"), value: emailClicks });
  contributions.push({ key: "page_views", label: labelForSignal("page_views", "High page views"), value: pageViews });
  contributions.push({ key: "demo_requested", label: labelForSignal("demo_requested", "Demo requested"), value: 0 });
  contributions.push({
    key: "industry_match",
    label: labelForSignal("industry_match", "Industry match"),
    value: config.weights.fit.industryMatch,
  });
  contributions.push({
    key: "company_size_fit",
    label: labelForSignal("company_size_fit", "Company size fit"),
    value: config.weights.fit.companySizeFit,
  });
  contributions.push({ key: "budget_fit", label: labelForSignal("budget_fit", "Budget fit"), value: config.weights.fit.budgetFit });

  const days = parseLastActivityDays(input.lastActivity);
  let recency = config.weights.recency.older;
  if (days <= 1) recency = config.weights.recency.within1Day;
  else if (days <= 3) recency = config.weights.recency.within3Days;
  else if (days <= 7) recency = config.weights.recency.within7Days;
  contributions.push({ key: "recency", label: labelForSignal("recency", "Recent activity"), value: recency });

  const sourcePrior = config.weights.sourcePrior[input.source.toLowerCase()] ?? 0;
  contributions.push({ key: "source_prior", label: labelForSignal("source_prior", "Source quality"), value: sourcePrior });

  const score = Math.max(0, Math.min(100, Math.round(contributions.reduce((sum, item) => sum + item.value, 0))));
  const tier = deriveTier(score, config);
  const topReasons = contributions
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 2)
    .map((item) => item.label);
  const reasonText = topReasons.length > 0 ? topReasons.join(" and ") : "baseline profile signals";

  return {
    score,
    tier,
    reasons: topReasons,
    topReasons,
    aiExplanation: `${input.name} at ${input.company} is ranked as ${tier.toUpperCase()} based on ${reasonText}. Prioritize follow-up according to this signal mix.`,
    scoreBreakdown: contributions,
  };
}
