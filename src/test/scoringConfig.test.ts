import { describe, expect, it } from "vitest";
import { DEFAULT_SCORING_CONFIG, mergeScoringConfig, validateScoringConfig } from "@/lib/scoringEngine";

describe("scoring config helpers", () => {
  it("merges partial config into defaults", () => {
    const merged = mergeScoringConfig({
      preset: "conservative",
      thresholds: { hotMin: 85, warmMin: 65 },
      weights: { fit: { budgetFit: 20 } as never },
    });

    expect(merged.thresholds.hotMin).toBe(85);
    expect(merged.thresholds.warmMin).toBe(65);
    expect(merged.weights.fit.budgetFit).toBe(20);
    expect(merged.weights.fit.industryMatch).toBe(DEFAULT_SCORING_CONFIG.weights.fit.industryMatch);
    expect(merged.preset).toBe("conservative");
  });

  it("applies aggressive preset defaults", () => {
    const merged = mergeScoringConfig({ preset: "aggressive" });
    expect(merged.thresholds.hotMin).toBe(75);
    expect(merged.thresholds.warmMin).toBe(55);
  });

  it("rejects invalid thresholds", () => {
    const invalid = { ...DEFAULT_SCORING_CONFIG, thresholds: { hotMin: 60, warmMin: 60 } };
    expect(validateScoringConfig(invalid)).toContain("hotMin");
  });

  it("rejects out-of-range values", () => {
    const invalid = {
      ...DEFAULT_SCORING_CONFIG,
      weights: {
        ...DEFAULT_SCORING_CONFIG.weights,
        engagement: {
          ...DEFAULT_SCORING_CONFIG.weights.engagement,
          emailOpensCap: 1000,
        },
      },
    };
    expect(validateScoringConfig(invalid)).toContain("between");
  });
});
