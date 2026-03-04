import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { faqItems, landingCopy, liveTodayProof, roadmapProof } from "@/components/landing/landingContent";

export function LandingTrustSection() {
  return (
    <section className="surface-soft border-y">
      <div className="mx-auto max-w-6xl px-6 py-14 md:py-16">
        <p className="section-kicker text-center">{landingCopy.proofTitle}</p>
        <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-primary md:text-4xl">Know what you get today</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-muted-foreground">{landingCopy.proofDescription}</p>

        <div className="mt-8 rounded-2xl border bg-card/90 p-4 md:p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <article className="rounded-xl border border-border/80 bg-background/70 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-accent">Live now</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {liveTodayProof.slice(0, 3).map((item) => (
                  <li key={item.title} className="list-inside list-disc">
                    {item.title}
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-xl border border-border/80 bg-background/70 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">Current limits</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {roadmapProof.slice(0, 2).map((item) => (
                  <li key={item.title} className="list-inside list-disc">
                    {item.title}
                  </li>
                ))}
              </ul>
            </article>
          </div>

          <div className="mt-4 rounded-xl border border-border/80 bg-background/70 px-4 py-2">
            <p className="pt-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{landingCopy.faqTitle}</p>
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item, index) => (
                <AccordionItem key={item.question} value={`trust-faq-${index}`} className="border-border/80">
                  <AccordionTrigger className="text-left text-sm font-medium hover:no-underline">{item.question}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">{item.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
}
