import { describe, expect, it } from "vitest";
import { getSlaState, parseLastActivityHours, sortLeadsByWorkflowPriority } from "@/lib/dashboardWorkflowHelpers";
import { type Lead } from "@/data/mockLeads";

function makeLead(overrides: Partial<Lead>): Lead {
  return {
    id: 1,
    rank: 1,
    name: "Lead",
    company: "Acme",
    score: 50,
    tier: "warm",
    reasons: ["Test"],
    source: "Website",
    lastActivity: "2 days ago",
    email: "lead@acme.com",
    aiExplanation: "Test",
    scoreBreakdown: [{ key: "k", label: "l", value: 1 }],
    scoredAt: new Date().toISOString(),
    scoreVersion: "v1",
    ...overrides,
  };
}

describe("dashboardWorkflowHelpers", () => {
  it("parses last activity strings into hours", () => {
    expect(parseLastActivityHours("2 hours ago")).toBe(2);
    expect(parseLastActivityHours("3 days ago")).toBe(72);
    expect(parseLastActivityHours("2 weeks ago")).toBe(336);
  });

  it("derives SLA state", () => {
    expect(getSlaState(makeLead({ lastActivity: "2 hours ago" }), undefined)).toBe("on_track");
    expect(getSlaState(makeLead({ lastActivity: "3 days ago" }), undefined)).toBe("due_soon");
    expect(getSlaState(makeLead({ lastActivity: "2 weeks ago" }), undefined)).toBe("overdue");
    expect(getSlaState(makeLead({ lastActivity: "2 weeks ago" }), { leadId: 1, status: "contacted" })).toBe("responded");
  });

  it("sorts by pinned, snoozed, then score", () => {
    const a = makeLead({ id: 1, score: 60, rank: 1 });
    const b = makeLead({ id: 2, score: 90, rank: 2 });
    const nowPlus = new Date(Date.now() + 1000 * 60 * 60).toISOString();

    const pinnedFirst = sortLeadsByWorkflowPriority(
      a,
      b,
      { leadId: 1, status: "new", pinned: true },
      { leadId: 2, status: "new" },
    );
    expect(pinnedFirst).toBeLessThan(0);

    const nonSnoozedFirst = sortLeadsByWorkflowPriority(
      a,
      b,
      { leadId: 1, status: "snoozed", snoozedUntil: nowPlus },
      { leadId: 2, status: "new" },
    );
    expect(nonSnoozedFirst).toBeGreaterThan(0);
  });
});

