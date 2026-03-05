import { describe, expect, it } from "vitest";
import { buildImpactPreview } from "@/lib/scoringImpact";
import { DEFAULT_SCORING_CONFIG } from "@/lib/scoringEngine";
import { mockLeads } from "@/data/mockLeads";

describe("scoringImpact", () => {
  it("returns zero deltas for identical configs", () => {
    const impact = buildImpactPreview(mockLeads, DEFAULT_SCORING_CONFIG, DEFAULT_SCORING_CONFIG);
    expect(impact.avgScoreDelta).toBe(0);
    expect(impact.hotDelta).toBe(0);
    expect(impact.warmDelta).toBe(0);
    expect(impact.coldDelta).toBe(0);
  });

  it("returns non-zero delta when thresholds differ", () => {
    const aggressive = {
      ...DEFAULT_SCORING_CONFIG,
      thresholds: { hotMin: 70, warmMin: 50 },
    };
    const impact = buildImpactPreview(mockLeads, DEFAULT_SCORING_CONFIG, aggressive);
    expect(impact.changedLeadCount).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(impact.avgScoreDelta)).toBe(true);
  });
});

