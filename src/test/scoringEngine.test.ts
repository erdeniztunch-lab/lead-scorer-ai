import { describe, expect, it } from "vitest";
import { DEFAULT_SCORING_CONFIG, deriveTier, scoreLead } from "@/lib/scoringEngine";

describe("scoringEngine", () => {
  it("derives tier by thresholds", () => {
    expect(deriveTier(80, DEFAULT_SCORING_CONFIG.thresholds)).toBe("hot");
    expect(deriveTier(60, DEFAULT_SCORING_CONFIG.thresholds)).toBe("warm");
    expect(deriveTier(59, DEFAULT_SCORING_CONFIG.thresholds)).toBe("cold");
  });

  it("applies recency buckets", () => {
    const day1 = scoreLead(
      { name: "A", company: "B", source: "Website", lastActivity: "1 day ago" },
      DEFAULT_SCORING_CONFIG,
    );
    const week2 = scoreLead(
      { name: "A", company: "B", source: "Website", lastActivity: "2 weeks ago" },
      DEFAULT_SCORING_CONFIG,
    );
    expect(day1.score).toBeGreaterThan(week2.score);
  });

  it("applies source priors", () => {
    const referral = scoreLead(
      { name: "A", company: "B", source: "Referral", lastActivity: "3 days ago" },
      DEFAULT_SCORING_CONFIG,
    );
    const outbound = scoreLead(
      { name: "A", company: "B", source: "Cold outbound", lastActivity: "3 days ago" },
      DEFAULT_SCORING_CONFIG,
    );
    expect(referral.score).toBeGreaterThan(outbound.score);
  });

  it("returns deterministic top reasons ordering", () => {
    const result = scoreLead(
      {
        name: "A",
        company: "B",
        source: "Referral",
        lastActivity: "1 day ago",
        emailOpens: 10,
        emailClicks: 3,
        pageViews: 8,
      },
      DEFAULT_SCORING_CONFIG,
    );
    expect(result.topReasons.length).toBe(2);
    expect(result.topReasons[0]).not.toBe("");
    expect(result.topReasons.some((reason) => reason.includes("Clicked outreach links"))).toBe(true);
  });

  it("clamps score into 0..100", () => {
    const maxed = scoreLead(
      {
        name: "A",
        company: "B",
        source: "Referral",
        lastActivity: "1 hour ago",
        emailOpens: 100,
        emailClicks: 100,
        pageViews: 100,
        demoRequested: true,
        industryMatch: true,
        companySizeFit: true,
        budgetFit: true,
      },
      DEFAULT_SCORING_CONFIG,
    );
    expect(maxed.score).toBeLessThanOrEqual(100);
    expect(maxed.score).toBeGreaterThanOrEqual(0);
  });

  it("assigns contribution groups for explainability", () => {
    const result = scoreLead(
      {
        name: "A",
        company: "B",
        source: "Referral",
        lastActivity: "1 day ago",
        emailOpens: 2,
        emailClicks: 1,
        pageViews: 3,
        demoRequested: true,
        industryMatch: true,
        companySizeFit: true,
        budgetFit: true,
      },
      DEFAULT_SCORING_CONFIG,
    );

    const groups = new Set(result.contributions.map((item) => item.group));
    expect(groups.has("engagement")).toBe(true);
    expect(groups.has("fit")).toBe(true);
    expect(groups.has("recency")).toBe(true);
    expect(groups.has("source")).toBe(true);
    expect(result.contributions.every((item) => item.group)).toBe(true);
  });
});
