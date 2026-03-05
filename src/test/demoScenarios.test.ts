import { describe, expect, it } from "vitest";
import { demoScenarios } from "@/lib/demoScenarios";

describe("demoScenarios", () => {
  it("includes all expected scenario ids", () => {
    expect(Object.keys(demoScenarios).sort()).toEqual(
      ["high_intent_inbound", "noisy_mixed_list", "outbound_batch"].sort(),
    );
  });

  it("has deterministic non-empty seed leads", () => {
    const first = demoScenarios.high_intent_inbound.seedLeads.map((lead) => lead.name);
    const second = demoScenarios.high_intent_inbound.seedLeads.map((lead) => lead.name);
    expect(first.length).toBeGreaterThan(0);
    expect(first).toEqual(second);
  });
});

