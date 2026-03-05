import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { demoScenarios } from "@/lib/demoScenarios";
import { loadDemoSessionState, setActiveScenario, setDemoEnabled, type DemoScenarioId } from "@/lib/demoStore";
import { trackPrototypeEvent } from "@/lib/prototypeTelemetry";

interface DemoControlBarProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  activeScenarioId: DemoScenarioId;
  onScenarioChange: (id: DemoScenarioId) => void;
}

export function DemoControlBar({ enabled, onEnabledChange, activeScenarioId, onScenarioChange }: DemoControlBarProps) {
  const toggle = () => {
    const next = !enabled;
    setDemoEnabled(next);
    trackPrototypeEvent("demo_mode_toggled", { enabled: next });
    onEnabledChange(next);
  };

  const handleScenarioChange = (id: DemoScenarioId) => {
    setActiveScenario(id);
    trackPrototypeEvent("scenario_selected", { scenarioId: id });
    onScenarioChange(id);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-b bg-muted/30 px-4 py-2 md:px-6">
      <Button size="sm" variant={enabled ? "default" : "outline"} onClick={toggle}>
        {enabled ? "Demo Mode: ON" : "Demo Mode: OFF"}
      </Button>
      <Select value={activeScenarioId} onValueChange={(value) => handleScenarioChange(value as DemoScenarioId)} disabled={!enabled}>
        <SelectTrigger className="w-56 max-w-[80vw]"><SelectValue /></SelectTrigger>
        <SelectContent>
          {Object.values(demoScenarios).map((scenario) => (
            <SelectItem key={scenario.id} value={scenario.id}>{scenario.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        size="sm"
        variant="outline"
        disabled={!enabled}
        onClick={() => {
          const state = loadDemoSessionState();
          window.dispatchEvent(new CustomEvent("lead-scorer:demo-reset-scenario", { detail: { scenarioId: state.activeScenarioId } }));
        }}
      >
        Reset scenario
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={!enabled}
        onClick={() => window.dispatchEvent(new CustomEvent("lead-scorer:demo-start-tour"))}
      >
        Start tour
      </Button>
    </div>
  );
}

