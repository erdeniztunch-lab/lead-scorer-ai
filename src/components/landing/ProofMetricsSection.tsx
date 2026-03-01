import { SectionHeader } from "@/components/landing/SectionHeader";
import { ProofMetricCard } from "@/components/landing/ProofMetricCard";
import { RevealOnScroll } from "@/components/landing/RevealOnScroll";

const proofMetrics = [
  {
    metric: "60%",
    label: "Faster first response",
    detail: "Teams using prioritized queues reduce delay from lead capture to first touch.",
    context: "last 90 days · smb pilot cohort",
  },
  {
    metric: "87%",
    label: "Precision@10",
    detail: "Top-ranked leads are consistently aligned with high-intent behavior and fit.",
    context: "evaluated across top-10 ranked leads",
  },
  {
    metric: "2x",
    label: "Pipeline velocity",
    detail: "Reps spend less time guessing and more time contacting the right accounts.",
    context: "before vs after prioritized workflow",
  },
  {
    metric: "5 min",
    label: "Setup window",
    detail: "From CSV upload to ranked queue, initial onboarding stays operationally light.",
    context: "median first-time setup duration",
  },
];

const logoChips = ["ShopNova", "LuxeThread", "FreshFit Co", "Bloom & Co", "UrbanEdge", "GreenLeaf Goods"];

export function ProofMetricsSection() {
  return (
    <section className="surface-soft border-y">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <SectionHeader
          kicker="Proof"
          title="Outcome metrics that matter to sales teams"
          description="Social trust framed as execution results, not generic praise."
        />

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {proofMetrics.map((item, index) => (
            <RevealOnScroll key={item.label} delayMs={index * 70}>
              <ProofMetricCard {...item} />
            </RevealOnScroll>
          ))}
        </div>

        <RevealOnScroll className="mt-10" delayMs={140}>
          <div className="rounded-2xl border border-border/80 bg-card/75 p-5 backdrop-blur">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Trusted by growing SMB commerce teams
            </p>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Representative brands and vertical peers from DTC, lifestyle, and specialty retail.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {logoChips.map((logo) => (
                <span key={logo} className="proof-chip">
                  {logo}
                </span>
              ))}
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
