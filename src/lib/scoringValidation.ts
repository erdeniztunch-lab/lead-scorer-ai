import { type ScoringConfig } from "@/lib/scoringEngine";

export type FieldErrorMap = Record<string, string>;

function validateRange(errors: FieldErrorMap, path: string, value: number) {
  if (!Number.isFinite(value)) {
    errors[path] = "Must be a valid number.";
    return;
  }
  if (value < -100 || value > 100) {
    errors[path] = "Must be between -100 and 100.";
  }
}

export function validateScoringConfigFields(config: ScoringConfig): FieldErrorMap {
  const errors: FieldErrorMap = {};

  validateRange(errors, "thresholds.hotMin", config.thresholds.hotMin);
  validateRange(errors, "thresholds.warmMin", config.thresholds.warmMin);
  if (
    Number.isFinite(config.thresholds.hotMin) &&
    Number.isFinite(config.thresholds.warmMin) &&
    config.thresholds.hotMin <= config.thresholds.warmMin
  ) {
    errors["thresholds.hotMin"] = "Hot threshold must be greater than warm threshold.";
    errors["thresholds.warmMin"] = "Warm threshold must be lower than hot threshold.";
  }

  const numberFields: Array<[string, number]> = [
    ["weights.engagement.emailOpensCap", config.weights.engagement.emailOpensCap],
    ["weights.engagement.emailClicksCap", config.weights.engagement.emailClicksCap],
    ["weights.engagement.pageViewsCap", config.weights.engagement.pageViewsCap],
    ["weights.engagement.demoRequestedBonus", config.weights.engagement.demoRequestedBonus],
    ["weights.fit.industryMatch", config.weights.fit.industryMatch],
    ["weights.fit.companySizeFit", config.weights.fit.companySizeFit],
    ["weights.fit.budgetFit", config.weights.fit.budgetFit],
    ["weights.recency.within1Day", config.weights.recency.within1Day],
    ["weights.recency.within3Days", config.weights.recency.within3Days],
    ["weights.recency.within7Days", config.weights.recency.within7Days],
    ["weights.recency.older", config.weights.recency.older],
  ];
  numberFields.forEach(([path, value]) => validateRange(errors, path, value));

  Object.entries(config.weights.sourcePrior).forEach(([key, value]) => {
    validateRange(errors, `weights.sourcePrior.${key}`, value);
  });

  return errors;
}

