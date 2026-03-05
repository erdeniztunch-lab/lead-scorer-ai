import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DemoControlBar } from "@/components/demo/DemoControlBar";

describe("demo flow ui", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows control bar and toggles demo mode", () => {
    const onEnabledChange = vi.fn();
    const onScenarioChange = vi.fn();
    render(
      <DemoControlBar
        enabled={false}
        onEnabledChange={onEnabledChange}
        activeScenarioId="high_intent_inbound"
        onScenarioChange={onScenarioChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Demo Mode: OFF/i }));
    expect(onEnabledChange).toHaveBeenCalledWith(true);
  });

  it("dispatches reset scenario event", () => {
    const listener = vi.fn();
    window.addEventListener("lead-scorer:demo-reset-scenario", listener as EventListener);

    render(
      <DemoControlBar
        enabled={true}
        onEnabledChange={() => {}}
        activeScenarioId="high_intent_inbound"
        onScenarioChange={() => {}}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Reset scenario/i }));
    expect(listener).toHaveBeenCalled();
    window.removeEventListener("lead-scorer:demo-reset-scenario", listener as EventListener);
  });
});

