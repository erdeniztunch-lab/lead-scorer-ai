import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { type DemoScenario } from "@/lib/demoStore";
import { loadPrototypeEvents } from "@/lib/prototypeTelemetry";

interface DemoReadinessPanelProps {
  scenario: DemoScenario;
  onReset: () => void;
}

export function DemoReadinessPanel({ scenario, onReset }: DemoReadinessPanelProps) {
  const events = loadPrototypeEvents(200);
  const counters = {
    import: events.filter((event) => event.event === "import_clicked").length,
    action: events.filter((event) => event.event === "action_clicked").length,
    analytics: events.filter((event) => event.event === "analytics_viewed").length,
  };

  return (
    <Card className="border-primary/25 bg-primary/5">
      <CardHeader>
        <CardTitle className="text-base">Demo Readiness</CardTitle>
        <p className="text-xs text-muted-foreground">{scenario.goal}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 text-sm md:grid-cols-3">
          <p>Import actions: <strong>{counters.import}</strong></p>
          <p>Queue actions: <strong>{counters.action}</strong></p>
          <p>Analytics views: <strong>{counters.analytics}</strong></p>
        </div>
        <div className="space-y-1 text-xs text-muted-foreground">
          {scenario.recommendedSteps.map((step) => (
            <p key={step}>- {step}</p>
          ))}
        </div>
        <Button size="sm" variant="outline" onClick={onReset}>Reset and rerun</Button>
      </CardContent>
    </Card>
  );
}

