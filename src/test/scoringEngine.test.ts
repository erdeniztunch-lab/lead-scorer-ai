import { describe, expect, it } from "vitest";
import { DEFAULT_SCORING_CONFIG, buildTopReasons, deriveScoreConfidence, deriveTier, scoreLead } from "@/lib/scoringEngine";

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

  it("uses alphabetical tie-break for equal contributions", () => {
    const top = buildTopReasons([
      { key: "z", label: "Zeta signal", value: 10 },
      { key: "a", label: "Alpha signal", value: 10 },
      { key: "m", label: "Mid signal", value: 8 },
    ]);
    expect(top).toEqual(["Alpha signal", "Zeta signal"]);
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

  it("derives high confidence with rich signals", () => {
    const confidence = deriveScoreConfidence({
      name: "A",
      company: "B",
      source: "Referral",
      lastActivity: "1 day ago",
      emailOpens: 3,
      emailClicks: 2,
      pageViews: 7,
      demoRequested: true,
      industryMatch: true,
      companySizeFit: true,
      budgetFit: true,
    });
    expect(confidence).toBe("high");
  });

  it("derives low confidence with sparse partial signals", () => {
    const confidence = deriveScoreConfidence({
      name: "A",
      company: "B",
      source: "Website",
      lastActivity: "3 days ago",
      emailOpens: 1,
    });
    expect(confidence).toBe("low");
  });

  it("derives low confidence with minimal signals", () => {
    const confidence = deriveScoreConfidence({
      name: "A",
      company: "B",
      source: "",
      lastActivity: "",
    });
    expect(confidence).toBe("low");
  });

  it("keeps confidence low when booleans are explicitly false", () => {
    const confidence = deriveScoreConfidence({
      name: "A",
      company: "B",
      source: "",
      lastActivity: "",
      demoRequested: false,
      industryMatch: false,
      companySizeFit: false,
      budgetFit: false,
    });
    expect(confidence).toBe("low");
  });

  it("upgrades confidence with strong positive signals", () => {
    const confidence = deriveScoreConfidence({
      name: "A",
      company: "B",
      source: "Referral",
      lastActivity: "1 day ago",
      emailClicks: 1,
      demoRequested: true,
    });
    expect(confidence).toBe("medium");
  });
});
