import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { RevealOnScroll } from "@/components/landing/RevealOnScroll";

export interface StepRailItemProps {
  step: string;
  title: string;
  description: string;
  microProof: string;
  icon: LucideIcon;
  zigzag?: boolean;
  showMobileConnector?: boolean;
  revealDelayMs?: number;
}

export function StepRailItem({
  step,
  title,
  description,
  microProof,
  icon: Icon,
  zigzag = false,
  showMobileConnector = false,
  revealDelayMs = 0,
}: StepRailItemProps) {
  return (
    <RevealOnScroll delayMs={revealDelayMs}>
      <div
        className={cn(
          "relative rounded-2xl border border-border/80 bg-card/80 p-5 shadow-[0_12px_40px_-22px_hsl(var(--primary)/0.35)] backdrop-blur",
          zigzag && "md:translate-x-6",
        )}
      >
        {showMobileConnector && (
          <span className="story-divider absolute -bottom-6 left-9 top-12 w-px md:hidden" aria-hidden="true" />
        )}
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-accent/20 bg-accent/10 text-accent">
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Step {step}</p>
            <h3 className="mt-1 text-lg font-semibold tracking-tight text-foreground">{title}</h3>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">{description}</p>
            <p className="proof-chip mt-4 inline-flex">{microProof}</p>
          </div>
        </div>
      </div>
    </RevealOnScroll>
  );
}
