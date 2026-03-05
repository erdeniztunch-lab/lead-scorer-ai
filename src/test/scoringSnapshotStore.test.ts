import { beforeEach, describe, expect, it } from "vitest";
import {
  deleteScoringSnapshot,
  loadScoringSnapshots,
  saveScoringSnapshot,
} from "@/lib/scoringSnapshotStore";
import { DEFAULT_SCORING_CONFIG } from "@/lib/scoringEngine";

describe("scoringSnapshotStore", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns empty list when no snapshots exist", () => {
    expect(loadScoringSnapshots()).toEqual([]);
  });

  it("saves and loads snapshots", () => {
    const saved = saveScoringSnapshot({ name: "Baseline", config: DEFAULT_SCORING_CONFIG });
    const all = loadScoringSnapshots();
    expect(all.length).toBe(1);
    expect(all[0].id).toBe(saved.id);
  });

  it("caps snapshot count at 20", () => {
    for (let i = 0; i < 25; i += 1) {
      saveScoringSnapshot({ name: `S${i}`, config: DEFAULT_SCORING_CONFIG });
    }
    expect(loadScoringSnapshots().length).toBe(20);
  });

  it("deletes snapshot by id", () => {
    const saved = saveScoringSnapshot({ name: "ToDelete", config: DEFAULT_SCORING_CONFIG });
    deleteScoringSnapshot(saved.id);
    expect(loadScoringSnapshots().some((item) => item.id === saved.id)).toBe(false);
  });
});

