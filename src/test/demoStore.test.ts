import { beforeEach, describe, expect, it } from "vitest";
import {
  loadDemoSessionState,
  markTourCompleted,
  resetScenarioState,
  setActiveScenario,
  setDemoEnabled,
} from "@/lib/demoStore";

describe("demoStore", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("persists demo mode toggle", () => {
    setDemoEnabled(true);
    expect(loadDemoSessionState().enabled).toBe(true);
  });

  it("persists active scenario selection", () => {
    setActiveScenario("noisy_mixed_list");
    expect(loadDemoSessionState().activeScenarioId).toBe("noisy_mixed_list");
  });

  it("tracks tour completion per scenario", () => {
    markTourCompleted("outbound_batch");
    expect(loadDemoSessionState().tourCompletedByScenario.outbound_batch).toBe(true);
    resetScenarioState("outbound_batch");
    expect(loadDemoSessionState().tourCompletedByScenario.outbound_batch).toBe(false);
  });
});

