import { describe, expect, it } from "vitest";
import {
  buildAnalyticsSummary,
  buildQualityFunnel,
  buildRunComparison,
  buildSourceSegments,
  buildTierSegments,
} from "@/lib/analyticsNarrative";
import { type Lead } from "@/data/mockLeads";

function makeLead(overrides: Partial<Lead>): Lead {
  return {
    id: 1,
    rank: 1,
    name: "Lead",
    company: "Acme",
    score: 70,
    tier: "warm",
    reasons: ["Reason"],
    source: "Website",
    lastActivity: "1 day ago",
    email: "lead@acme.com",
    aiExplanation: "x",
    scoreBreakdown: [
      { key: "sig_a", label: "Signal A", value: 10 },
      { key: "sig_b", label: "Signal B", value: -4 },
    ],
    scoredAt: "2026-03-05T10:00:00.000Z",
    scoreVersion: "v1",
    ...overrides,
  };
}

describe("analyticsNarrative", () => {
  it("builds source and tier segments", () => {
    const leads = [
      makeLead({ id: 1, source: "Website", tier: "hot", score: 90 }),
      makeLead({ id: 2, source: "Referral", tier: "warm", score: 65 }),
      makeLead({ id: 3, source: "Website", tier: "cold", score: 35 }),
    ];

    const sourceSegments = buildSourceSegments(leads);
    const tierSegments = buildTierSegments(leads);

    expect(sourceSegments[0].label).toBe("Website");
    expect(sourceSegments[0].leadCount).toBe(2);
    expect(tierSegments.find((item) => item.label === "HOT")?.leadCount).toBe(1);
  });

  it("builds run comparison deltas", () => {
    const comparison = buildRunComparison([
      { runId: "new", timestamp: "2026-03-05T12:00:00.000Z", leadCount: 12, averageScore: 67, configVersion: "v2", trigger: "manual_rescore" },
      { runId: "old", timestamp: "2026-03-05T11:00:00.000Z", leadCount: 10, averageScore: 60, configVersion: "v1", trigger: "import" },
    ]);

    expect(comparison?.avgScoreDelta).toBe(7);
    expect(comparison?.leadCountDelta).toBe(2);
  });

  it("builds quality funnel from lead ui state", () => {
    const leads = [makeLead({ id: 1, tier: "hot" }), makeLead({ id: 2, tier: "cold" })];
    const funnel = buildQualityFunnel(leads, { 1: { leadId: 1, status: "contacted" } });

    expect(funnel.imported).toBe(2);
    expect(funnel.prioritized).toBe(1);
    expect(funnel.contacted).toBe(1);
  });

  it("builds narrative summary with insights", () => {
    const leads = [makeLead({ id: 1, score: 85, tier: "hot" }), makeLead({ id: 2, score: 40, tier: "cold" })];
    const summary = buildAnalyticsSummary(leads, [], {});
    expect(summary.insights.length).toBeGreaterThan(0);
    expect(summary.narrativeLine.length).toBeGreaterThan(10);
  });
});

