import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FinalCtaSectionProps {
  onPrimaryCta: () => void;
}

export function FinalCtaSection({ onPrimaryCta }: FinalCtaSectionProps) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card p-8 md:p-12">
        <div className="pointer-events-none absolute inset-0 cta-mesh" />
        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <p className="section-kicker">Start now</p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-primary md:text-4xl">
            Start scoring leads - free
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground md:text-base">
            No credit card required. Upload your CSV and see your top leads ranked in under 5 minutes.
          </p>
          <Button
            size="lg"
            className="mt-8 bg-accent px-8 text-base text-accent-foreground hover:bg-accent/90"
            onClick={onPrimaryCta}
          >
            Get Started Free <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
          <div className="mt-6 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
            <span className="inline-flex items-center justify-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
              Free up to 500 leads
            </span>
            <span className="inline-flex items-center justify-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
              No credit card
            </span>
            <span className="inline-flex items-center justify-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-accent" />5 min setup
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
