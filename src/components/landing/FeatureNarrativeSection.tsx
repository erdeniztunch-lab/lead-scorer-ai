import { Mail, Target, TrendingUp } from "lucide-react";
import { SectionHeader } from "@/components/landing/SectionHeader";
import { RevealOnScroll } from "@/components/landing/RevealOnScroll";

export function FeatureNarrativeSection() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <SectionHeader
        kicker="Capabilities"
        title="Designed to help SMB teams close faster without complexity"
        description="Same product story, stronger product narrative: explanation first, action second, measurable impact always."
      />

      <div className="mt-12 grid gap-5 lg:grid-cols-12">
        <RevealOnScroll className="lg:col-span-8">
          <article className="surface-contrast rounded-3xl p-8">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-accent/25 bg-accent/10 text-accent">
              <Target className="h-5 w-5" />
            </div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-accent/90">Flagship capability</p>
            <h3 className="mt-2 text-2xl font-bold tracking-tight text-foreground">AI Reason Codes</h3>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
              See exactly why each lead ranks high. Your team trusts the data because they understand the ranking logic
              behind every priority decision.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <span className="proof-chip">Top reason pills on every lead</span>
              <span className="proof-chip">Expanded AI explanation per row</span>
            </div>
          </article>
        </RevealOnScroll>

        <RevealOnScroll className="lg:col-span-6" delayMs={80}>
          <article className="surface-elevated rounded-3xl p-6">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Mail className="h-4 w-4" />
            </div>
            <h3 className="mt-4 text-xl font-semibold tracking-tight text-foreground">One-Click Outreach</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Email, call, or LinkedIn outreach without context-switching between tools.
            </p>
          </article>
        </RevealOnScroll>

        <RevealOnScroll className="lg:col-span-6" delayMs={140}>
          <article className="surface-elevated rounded-3xl p-6">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <TrendingUp className="h-4 w-4" />
            </div>
            <h3 className="mt-4 text-xl font-semibold tracking-tight text-foreground">Real-Time KPI Signals</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Monitor time-to-first-contact, precision, and lift so performance improvements are visible every day.
            </p>
          </article>
        </RevealOnScroll>
      </div>
    </section>
  );
}
