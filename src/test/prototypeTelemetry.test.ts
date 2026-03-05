import { beforeEach, describe, expect, it } from "vitest";
import { clearPrototypeEvents, loadPrototypeEvents, trackPrototypeEvent } from "@/lib/prototypeTelemetry";

describe("prototypeTelemetry", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("appends and loads events", () => {
    trackPrototypeEvent("demo_mode_toggled", { enabled: true });
    const events = loadPrototypeEvents();
    expect(events.length).toBe(1);
    expect(events[0].event).toBe("demo_mode_toggled");
  });

  it("retains max 500 events", () => {
    for (let i = 0; i < 510; i += 1) {
      trackPrototypeEvent("filter_used", { i });
    }
    expect(loadPrototypeEvents().length).toBe(500);
  });

  it("clears events", () => {
    trackPrototypeEvent("analytics_viewed", {});
    clearPrototypeEvents();
    expect(loadPrototypeEvents()).toEqual([]);
  });
});

