export interface ScoringConfig {
  preset: "conservative" | "balanced" | "aggressive";
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
  preset: "balanced",
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

function buildConfigForPreset(preset: ScoringConfig["preset"]): ScoringConfig {
  if (preset === "conservative") {
    return {
      ...DEFAULT_SCORING_CONFIG,
      preset,
      thresholds: {
        hotMin: 85,
        warmMin: 70,
      },
      weights: {
        ...DEFAULT_SCORING_CONFIG.weights,
        engagement: {
          ...DEFAULT_SCORING_CONFIG.weights.engagement,
          emailOpensCap: 12,
          emailClicksCap: 14,
        },
      },
    };
  }
  if (preset === "aggressive") {
    return {
      ...DEFAULT_SCORING_CONFIG,
      preset,
      thresholds: {
        hotMin: 75,
        warmMin: 55,
      },
      weights: {
        ...DEFAULT_SCORING_CONFIG.weights,
        fit: {
          ...DEFAULT_SCORING_CONFIG.weights.fit,
          industryMatch: 13,
          companySizeFit: 9,
        },
      },
    };
  }
  return { ...DEFAULT_SCORING_CONFIG, preset: "balanced" };
}

export function mergeScoringConfig(input: Partial<ScoringConfig>): ScoringConfig {
  const preset = input.preset ?? DEFAULT_SCORING_CONFIG.preset;
  const presetBase = buildConfigForPreset(preset);
  return {
    ...presetBase,
    ...input,
    preset,
    thresholds: {
      ...presetBase.thresholds,
      ...(input.thresholds ?? {}),
    },
    weights: {
      ...presetBase.weights,
      ...(input.weights ?? {}),
      engagement: {
        ...presetBase.weights.engagement,
        ...(input.weights?.engagement ?? {}),
      },
      fit: {
        ...presetBase.weights.fit,
        ...(input.weights?.fit ?? {}),
      },
      recency: {
        ...presetBase.weights.recency,
        ...(input.weights?.recency ?? {}),
      },
      sourcePrior: {
        ...presetBase.weights.sourcePrior,
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
