import { evidenceItems, landingCopy } from "@/components/landing/landingContent";

export function ProductEvidenceStrip() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-14 md:py-16">
      <div className="signal-strip rounded-3xl border p-5 md:p-6">
        <p className="section-kicker text-center">Proof In 10 Seconds</p>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-muted-foreground">{landingCopy.evidenceDescription}</p>

        <div className="mt-7 grid gap-3 md:grid-cols-2">
          {evidenceItems.map((item, index) => (
            <article key={item.title} className={`evidence-card rounded-2xl p-4 ${index === 1 ? "evidence-card-focus" : ""}`}>
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <item.icon className="h-4 w-4" />
              </div>
              <p className="mt-3 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{item.title}</p>
              <h3 className="mt-1 text-[15px] font-semibold leading-snug text-foreground">{item.value}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{item.micro}</p>
            </article>
          ))}
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">Live in prototype mode - no backend persistence yet</p>
      </div>
    </section>
  );
}
