import { describe, expect, it } from "vitest";
import { DEFAULT_SCORING_CONFIG } from "@/lib/scoringEngine";
import { validateScoringConfigFields } from "@/lib/scoringValidation";

describe("scoringValidation", () => {
  it("returns threshold relation errors", () => {
    const errors = validateScoringConfigFields({
      ...DEFAULT_SCORING_CONFIG,
      thresholds: { hotMin: 60, warmMin: 60 },
    });
    expect(errors["thresholds.hotMin"]).toBeTruthy();
    expect(errors["thresholds.warmMin"]).toBeTruthy();
  });

  it("returns out-of-range errors", () => {
    const errors = validateScoringConfigFields({
      ...DEFAULT_SCORING_CONFIG,
      weights: {
        ...DEFAULT_SCORING_CONFIG.weights,
        engagement: {
          ...DEFAULT_SCORING_CONFIG.weights.engagement,
          emailOpensCap: 1000,
        },
      },
    });
    expect(errors["weights.engagement.emailOpensCap"]).toContain("between");
  });

  it("returns empty map for valid config", () => {
    expect(validateScoringConfigFields(DEFAULT_SCORING_CONFIG)).toEqual({});
  });
});

