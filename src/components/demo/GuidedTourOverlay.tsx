import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TourStep {
  id: string;
  title: string;
  body: string;
}

interface GuidedTourOverlayProps {
  open: boolean;
  steps: TourStep[];
  stepIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export function GuidedTourOverlay({ open, steps, stepIndex, onClose, onNext, onPrev }: GuidedTourOverlayProps) {
  if (!open || steps.length === 0) return null;
  const step = steps[Math.min(stepIndex, steps.length - 1)];
  const isFirst = stepIndex <= 0;
  const isLast = stepIndex >= steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <Card className="w-full max-w-xl border-2 border-primary/25">
        <CardHeader>
          <CardTitle className="text-base">{step.title}</CardTitle>
          <p className="text-xs text-muted-foreground">Step {stepIndex + 1} / {steps.length}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{step.body}</p>
          <div className="flex flex-wrap justify-between gap-2">
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={isFirst} onClick={onPrev}>Back</Button>
              <Button size="sm" onClick={onNext}>{isLast ? "Finish" : "Next"}</Button>
            </div>
            <Button size="sm" variant="ghost" onClick={onClose}>Close</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

