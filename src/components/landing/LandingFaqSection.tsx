import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { faqItems, landingCopy } from "@/components/landing/landingContent";

export function LandingFaqSection() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-20">
      <p className="section-kicker text-center">{landingCopy.faqTitle}</p>
      <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-primary md:text-4xl">Decision friction removed</h2>
      <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-muted-foreground md:text-base">
        {landingCopy.faqDescription}
      </p>

      <div className="mt-8 rounded-2xl border bg-card/85 px-5 py-2">
        <Accordion type="single" collapsible className="w-full">
          {faqItems.map((item, index) => (
            <AccordionItem key={item.question} value={`faq-${index}`} className="border-border/80">
              <AccordionTrigger className="text-left text-base font-medium hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
