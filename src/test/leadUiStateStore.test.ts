import { beforeEach, describe, expect, it } from "vitest";
import { clearLeadUiState, loadLeadUiState, saveLeadUiState } from "@/lib/leadUiStateStore";

describe("leadUiStateStore", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns empty state when storage is empty", () => {
    expect(loadLeadUiState()).toEqual({});
  });

  it("saves and loads ui state map", () => {
    const state = {
      1: { leadId: 1, status: "contacted" as const, contactedAt: "2026-03-05T10:00:00.000Z", pinned: true },
    };

    saveLeadUiState(state);
    expect(loadLeadUiState()).toEqual(state);
  });

  it("fails safe to empty on malformed payload", () => {
    window.localStorage.setItem("lead_scorer_ui_state_v1", "{broken");
    expect(loadLeadUiState()).toEqual({});
  });

  it("clears stored state", () => {
    saveLeadUiState({ 2: { leadId: 2, status: "snoozed", snoozedUntil: "2099-01-01T00:00:00.000Z" } });
    clearLeadUiState();
    expect(loadLeadUiState()).toEqual({});
  });
});

