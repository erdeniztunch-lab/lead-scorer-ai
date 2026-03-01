import { Mail, Target, TrendingUp } from "lucide-react";
import { SectionHeader } from "@/components/landing/SectionHeader";
import { RevealOnScroll } from "@/components/landing/RevealOnScroll";

export function FeatureNarrativeSection() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <SectionHeader
        kicker="Capabilities"
        title="Built for fast lead decisions"
        description="A compact operating stack for SMB sales teams: explain priorities, act quickly, and track execution quality."
      />

      <div className="mt-12 grid gap-5 lg:grid-cols-12">
        <RevealOnScroll className="lg:col-span-7">
          <article className="surface-contrast rounded-3xl p-8 md:p-9">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-accent/25 bg-accent/10 text-accent">
              <Target className="h-5 w-5" />
            </div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-accent/90">Flagship</p>
            <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground/80">For reps and team leads</p>
            <h3 className="mt-2 text-2xl font-bold tracking-tight text-foreground">AI Reason Codes</h3>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
              Every ranked lead includes plain-language reasons, so teams spend less time debating and more time contacting.
            </p>
            <div className="mt-6 space-y-2 text-sm text-muted-foreground">
              <p className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                Faster first-touch decisions
              </p>
              <p className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                Fewer priority debates across the team
              </p>
              <p className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                Daily queue review in under 10 minutes
              </p>
            </div>
          </article>
        </RevealOnScroll>

        <div className="grid gap-5 lg:col-span-5">
          <RevealOnScroll delayMs={80}>
            <article className="rounded-3xl border bg-background/70 p-6">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Mail className="h-4 w-4" />
              </div>
              <h3 className="mt-4 text-xl font-semibold tracking-tight text-foreground">One-Click Outreach</h3>
              <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground/80">For reps</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Go from ranked queue to email, call, or LinkedIn action in one place.
              </p>
              <p className="mt-3 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground/80">
                Outcome: lower first-contact latency
              </p>
            </article>
          </RevealOnScroll>

          <RevealOnScroll delayMs={140}>
            <article className="surface-elevated rounded-3xl p-6">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <TrendingUp className="h-4 w-4" />
              </div>
              <h3 className="mt-4 text-xl font-semibold tracking-tight text-foreground">Real-Time KPI Signals</h3>
              <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground/80">For leads and founders</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Track scoring quality and response behavior with one shared execution view.
              </p>
              <p className="mt-3 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground/80">
                Outcome: measurable pipeline execution
              </p>
            </article>
          </RevealOnScroll>
        </div>
      </div>

      <RevealOnScroll className="mt-6" delayMs={180}>
        <p className="text-center text-sm font-medium text-muted-foreground">
          Less triage time. More high-intent conversations.
        </p>
      </RevealOnScroll>
    </section>
  );
}
