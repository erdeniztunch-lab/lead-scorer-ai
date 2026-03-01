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
    return "hotMin must be greater than warmMin";
  }
  const values: number[] = [
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
    return "All numeric fields must be between -100 and 100";
  }
  return null;
}
