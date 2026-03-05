import { evidenceItems, landingCopy } from "@/components/landing/landingContent";

export function ProductEvidenceStrip() {
  return (
    <section className="reveal-fade-up reveal-delay-1 is-visible section-breathing mx-auto max-w-6xl px-6">
      <div className="glass-panel rounded-3xl p-5 md:p-6">
        <p className="section-kicker text-center">Proof In 10 Seconds</p>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-muted-foreground">{landingCopy.evidenceDescription}</p>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {evidenceItems.map((item, index) => (
            <article
              key={item.title}
              className={`evidence-card h-full rounded-2xl p-4 md:p-5 ${
                index === 0 ? "glass-panel-strong accent-halo evidence-card-focus" : "glass-panel"
              }`}
            >
              <div className="flex h-full items-start gap-3">
                <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <item.icon className="h-4 w-4" />
                </div>
                <div className="flex min-h-[88px] flex-col">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{item.title}</p>
                  <h3 className="mt-1 text-[15px] font-semibold leading-snug text-foreground">{item.value}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{item.micro}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-4 flex flex-col items-center gap-2">
          <p className="text-center text-xs text-muted-foreground">Frontend prototype: session/local mode, no backend persistence.</p>
        </div>
      </div>
    </section>
  );
}
