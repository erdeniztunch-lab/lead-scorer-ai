import { type Lead } from "@/data/mockLeads";

export interface SignalInput {
  name: string;
  company: string;
  source: string;
  lastActivity: string;
  emailOpens?: number;
  emailClicks?: number;
  pageViews?: number;
  demoRequested?: boolean;
  industryMatch?: boolean;
  companySizeFit?: boolean;
  budgetFit?: boolean;
}

export interface ScoreContribution {
  key: string;
  label: string;
  value: number;
}

export interface ScoringConfig {
  version: string;
  thresholds: {
    hotMin: number;
    warmMin: number;
  };
  weights: {
    engagement: {
      emailOpensCap: number;
      emailClicksCap: number;
      pageViewsCap: number;
      demoRequestedBonus: number;
    };
    fit: {
      industryMatch: number;
      companySizeFit: number;
      budgetFit: number;
    };
    recency: {
      within1Day: number;
      within3Days: number;
      within7Days: number;
      older: number;
    };
    sourcePrior: Record<string, number>;
  };
}

export interface ScoreResult {
  score: number;
  tier: Lead["tier"];
  contributions: ScoreContribution[];
  topReasons: string[];
  explanation: string;
}

export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  version: "v1.0.0",
  thresholds: {
    hotMin: 80,
    warmMin: 60,
  },
  weights: {
    engagement: {
      emailOpensCap: 10,
      emailClicksCap: 12,
      pageViewsCap: 10,
      demoRequestedBonus: 8,
    },
    fit: {
      industryMatch: 15,
      companySizeFit: 10,
      budgetFit: 10,
    },
    recency: {
      within1Day: 15,
      within3Days: 10,
      within7Days: 6,
      older: 2,
    },
    sourcePrior: {
      referral: 10,
      webinar: 8,
      website: 6,
      linkedin: 5,
      "google ads": 3,
      "cold outbound": -2,
    },
  },
};

export function mergeScoringConfig(input: Partial<ScoringConfig>): ScoringConfig {
  return {
    ...DEFAULT_SCORING_CONFIG,
    ...input,
    thresholds: {
      ...DEFAULT_SCORING_CONFIG.thresholds,
      ...(input.thresholds ?? {}),
    },
    weights: {
      ...DEFAULT_SCORING_CONFIG.weights,
      ...(input.weights ?? {}),
      engagement: {
        ...DEFAULT_SCORING_CONFIG.weights.engagement,
        ...(input.weights?.engagement ?? {}),
      },
      fit: {
        ...DEFAULT_SCORING_CONFIG.weights.fit,
        ...(input.weights?.fit ?? {}),
      },
      recency: {
        ...DEFAULT_SCORING_CONFIG.weights.recency,
        ...(input.weights?.recency ?? {}),
      },
      sourcePrior: {
        ...DEFAULT_SCORING_CONFIG.weights.sourcePrior,
        ...(input.weights?.sourcePrior ?? {}),
      },
    },
  };
}

export function validateScoringConfig(config: ScoringConfig): string | null {
  if (config.thresholds.hotMin <= config.thresholds.warmMin) {
    return "hotMin must be greater than warmMin.";
  }
  const values = [
    config.thresholds.hotMin,
    config.thresholds.warmMin,
    config.weights.engagement.emailOpensCap,
    config.weights.engagement.emailClicksCap,
    config.weights.engagement.pageViewsCap,
    config.weights.engagement.demoRequestedBonus,
    config.weights.fit.industryMatch,
    config.weights.fit.companySizeFit,
    config.weights.fit.budgetFit,
    config.weights.recency.within1Day,
    config.weights.recency.within3Days,
    config.weights.recency.within7Days,
    config.weights.recency.older,
    ...Object.values(config.weights.sourcePrior),
  ];
  if (values.some((value) => Number.isNaN(value) || value < -100 || value > 100)) {
    return "All values must be between -100 and 100.";
  }
  return null;
}

export function deriveTier(score: number, thresholds: ScoringConfig["thresholds"]): Lead["tier"] {
  if (score >= thresholds.hotMin) {
    return "hot";
  }
  if (score >= thresholds.warmMin) {
    return "warm";
  }
  return "cold";
}

function parseLastActivityDays(value: string): number {
  const text = value.toLowerCase();
  const match = text.match(/(\d+)\s*(hour|hours|day|days|week|weeks)/);
  if (!match) {
    return 30;
  }

  const amount = Number(match[1]);
  const unit = match[2];
  if (unit.startsWith("hour")) {
    return Math.max(0, amount / 24);
  }
  if (unit.startsWith("day")) {
    return amount;
  }
  if (unit.startsWith("week")) {
    return amount * 7;
  }
  return 30;
}

function parseNumberSignal(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }
  const numeric = Number(value);
  if (Number.isNaN(numeric) || !Number.isFinite(numeric)) {
    return undefined;
  }
  return numeric;
}

function parseBooleanSignal(value: string | undefined): boolean | undefined {
  if (!value) {
    return undefined;
  }
  const normalized = value.trim().toLowerCase();
  if (["true", "yes", "y", "1"].includes(normalized)) {
    return true;
  }
  if (["false", "no", "n", "0"].includes(normalized)) {
    return false;
  }
  return undefined;
}

function inferNumericFromName(name: string, seed: number, min: number, max: number): number {
  const hash = `${name}_${seed}`.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return min + (hash % (max - min + 1));
}

function inferSignalInput(baseLead: Lead): SignalInput {
  const explicitSignals = baseLead.scoreBreakdown.reduce<Record<string, string>>((result, item) => {
    if (item.key.startsWith("input_")) {
      result[item.key] = String(item.value);
    }
    return result;
  }, {});

  const reasons = baseLead.reasons.map((reason) => reason.toLowerCase());

  const pageViews =
    reasons.some((reason) => reason.includes("multiple page views")) || baseLead.aiExplanation.toLowerCase().includes("visited")
      ? inferNumericFromName(baseLead.name, 13, 6, 14)
      : inferNumericFromName(baseLead.name, 7, 1, 5);

  const emailOpens =
    reasons.some((reason) => reason.includes("email")) || baseLead.aiExplanation.toLowerCase().includes("opened")
      ? inferNumericFromName(baseLead.name, 17, 2, 6)
      : inferNumericFromName(baseLead.name, 3, 0, 2);

  const emailClicks =
    baseLead.aiExplanation.toLowerCase().includes("clicked") || baseLead.aiExplanation.toLowerCase().includes("click")
      ? inferNumericFromName(baseLead.name, 29, 1, 4)
      : inferNumericFromName(baseLead.name, 5, 0, 2);

  const demoRequested =
    reasons.some((reason) => reason.includes("demo")) ||
    baseLead.aiExplanation.toLowerCase().includes("demo request");

  const industryMatch =
    reasons.some((reason) => reason.includes("fit")) ||
    !baseLead.aiExplanation.toLowerCase().includes("outside your target vertical");
  const companySizeFit =
    !baseLead.aiExplanation.toLowerCase().includes("below typical conversion threshold");
  const budgetFit =
    reasons.some((reason) => reason.includes("budget")) ||
    baseLead.aiExplanation.toLowerCase().includes("budget");

  const explicitEmailOpens = parseNumberSignal(explicitSignals.input_email_opens);
  const explicitEmailClicks = parseNumberSignal(explicitSignals.input_email_clicks);
  const explicitPageViews = parseNumberSignal(explicitSignals.input_page_views);
  const explicitDemoRequested = parseBooleanSignal(explicitSignals.input_demo_requested);
  const explicitIndustryMatch = parseBooleanSignal(explicitSignals.input_industry_match);
  const explicitCompanySizeFit = parseBooleanSignal(explicitSignals.input_company_size_fit);
  const explicitBudgetFit = parseBooleanSignal(explicitSignals.input_budget_fit);

  return {
    name: baseLead.name,
    company: baseLead.company,
    source: baseLead.source,
    lastActivity: baseLead.lastActivity,
    emailOpens: explicitEmailOpens ?? emailOpens,
    emailClicks: explicitEmailClicks ?? emailClicks,
    pageViews: explicitPageViews ?? pageViews,
    demoRequested: explicitDemoRequested ?? demoRequested,
    industryMatch: explicitIndustryMatch ?? industryMatch,
    companySizeFit: explicitCompanySizeFit ?? companySizeFit,
    budgetFit: explicitBudgetFit ?? budgetFit,
  };
}

export function buildTopReasons(contributions: ScoreContribution[]): string[] {
  return contributions
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 2)
    .map((item) => item.label);
}

export function buildExplanation(
  lead: Pick<Lead, "name" | "company">,
  contributions: ScoreContribution[],
  tier: Lead["tier"],
): string {
  const top = buildTopReasons(contributions);
  const reasonText = top.length > 0 ? top.join(" and ") : "baseline profile signals";
  return `${lead.name} at ${lead.company} is ranked as ${tier.toUpperCase()} based on ${reasonText}. Prioritize follow-up according to this signal mix.`;
}

export function scoreLead(input: SignalInput, config: ScoringConfig): ScoreResult {
  const contributions: ScoreContribution[] = [];

  const emailOpens = Math.min((input.emailOpens ?? 0) * 2, config.weights.engagement.emailOpensCap);
  contributions.push({ key: "email_opens", label: "Email opens", value: emailOpens });

  const emailClicks = Math.min((input.emailClicks ?? 0) * 4, config.weights.engagement.emailClicksCap);
  contributions.push({ key: "email_clicks", label: "Email clicks", value: emailClicks });

  const pageViews = Math.min(input.pageViews ?? 0, config.weights.engagement.pageViewsCap);
  contributions.push({ key: "page_views", label: "High page views", value: pageViews });

  contributions.push({
    key: "demo_requested",
    label: "Demo requested",
    value: input.demoRequested ? config.weights.engagement.demoRequestedBonus : 0,
  });

  contributions.push({
    key: "industry_match",
    label: "Industry match",
    value: input.industryMatch ? config.weights.fit.industryMatch : 0,
  });
  contributions.push({
    key: "company_size_fit",
    label: "Company size fit",
    value: input.companySizeFit ? config.weights.fit.companySizeFit : 0,
  });
  contributions.push({
    key: "budget_fit",
    label: "Budget fit",
    value: input.budgetFit ? config.weights.fit.budgetFit : 0,
  });

  const days = parseLastActivityDays(input.lastActivity);
  let recencyScore = config.weights.recency.older;
  if (days <= 1) {
    recencyScore = config.weights.recency.within1Day;
  } else if (days <= 3) {
    recencyScore = config.weights.recency.within3Days;
  } else if (days <= 7) {
    recencyScore = config.weights.recency.within7Days;
  }
  contributions.push({ key: "recency", label: "Recent activity", value: recencyScore });

  const sourceKey = input.source.trim().toLowerCase();
  const sourceValue = config.weights.sourcePrior[sourceKey] ?? 0;
  contributions.push({ key: "source_prior", label: "Source quality", value: sourceValue });

  const rawScore = contributions.reduce((sum, part) => sum + part.value, 0);
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));
  const tier = deriveTier(score, config.thresholds);
  const topReasons = buildTopReasons(contributions);
  const explanation = buildExplanation({ name: input.name, company: input.company }, contributions, tier);

  return { score, tier, contributions, topReasons, explanation };
}

export function scoreLeads(leads: Lead[], config: ScoringConfig): Lead[] {
  const scoredAt = new Date().toISOString();
  return leads
    .map((lead, index) => {
      const input = inferSignalInput(lead);
      const result = scoreLead(input, config);
      return {
        ...lead,
        id: index + 1,
        rank: 0,
        score: result.score,
        tier: result.tier,
        reasons: result.topReasons,
        aiExplanation: result.explanation,
        scoreBreakdown: result.contributions.map((item) => ({
          key: item.key,
          label: item.label,
          value: item.value,
        })),
        scoredAt,
        scoreVersion: config.version,
      };
    })
    .sort((a, b) => b.score - a.score)
    .map((lead, index) => ({ ...lead, rank: index + 1, id: index + 1 }));
}
