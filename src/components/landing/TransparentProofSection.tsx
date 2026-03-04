import { CircleOff, ShieldCheck } from "lucide-react";
import { landingCopy, liveTodayProof, roadmapProof } from "@/components/landing/landingContent";

function ProofList({
  title,
  items,
  tone,
}: {
  title: string;
  items: { title: string; detail: string }[];
  tone: "live" | "roadmap";
}) {
  const iconClasses = tone === "live" ? "text-accent bg-accent/10" : "text-muted-foreground bg-muted";
  const Icon = tone === "live" ? ShieldCheck : CircleOff;

  return (
    <article className="rounded-2xl border bg-card/90 p-6">
      <div className="inline-flex items-center gap-2">
        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${iconClasses}`}>
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      </div>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.title} className="rounded-xl border border-border/80 bg-background/70 p-3">
            <p className="text-sm font-medium text-foreground">{item.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

export function TransparentProofSection() {
  return (
    <section className="surface-soft border-y">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <p className="section-kicker text-center">{landingCopy.proofTitle}</p>
        <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-primary md:text-4xl">
          Build trust with clarity
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-muted-foreground md:text-base">
          {landingCopy.proofDescription}
        </p>

        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          <ProofList title="Live Today" items={liveTodayProof} tone="live" />
          <ProofList title="Not Yet / Roadmap" items={roadmapProof} tone="roadmap" />
        </div>
      </div>
    </section>
  );
}
