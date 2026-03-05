import { CheckCircle2, MinusCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { faqItems, landingCopy, liveTodayProof, roadmapProof } from "@/components/landing/landingContent";

export function LandingTrustSection() {
  return (
    <section className="reveal-fade-up reveal-delay-3 is-visible">
      <div className="section-breathing mx-auto max-w-6xl px-6">
        <p className="section-kicker text-center">{landingCopy.proofTitle}</p>
        <h2 className="editorial-h2 mt-2 text-center">Know exactly what works today</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-muted-foreground">{landingCopy.proofDescription}</p>

        <div className="glass-panel mt-8 rounded-2xl p-4 md:p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <article className="glass-panel-strong rounded-xl p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-accent">Live now</h3>
              <ul className="mt-3 space-y-2.5">
                {liveTodayProof.map((item) => (
                  <li key={item.title} className="glass-chip min-h-[86px] rounded-lg px-3 py-2">
                    <div className="flex h-full items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{item.detail}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </article>

            <article className="glass-panel rounded-xl p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">Current limits</h3>
              <ul className="mt-3 space-y-2.5">
                {roadmapProof.map((item) => (
                  <li key={item.title} className="glass-chip min-h-[86px] rounded-lg px-3 py-2">
                    <div className="flex h-full items-start gap-2">
                      <MinusCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{item.detail}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          </div>

          <div className="glass-divider mt-4 pt-4">
            <div className="glass-panel rounded-xl px-4 py-2">
              <p className="pt-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{landingCopy.faqTitle}</p>
              <Accordion type="single" collapsible className="w-full">
                {faqItems.map((item, index) => (
                  <AccordionItem key={item.question} value={`trust-faq-${index}`} className="border-border/65">
                    <AccordionTrigger className="text-left text-sm font-medium hover:no-underline">{item.question}</AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">{item.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
            <div className="mt-4 flex flex-col items-center gap-3">
              <p className="text-center text-xs text-muted-foreground">
                Frontend prototype. Claims reflect current shipped behavior.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
