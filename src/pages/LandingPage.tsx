import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { HeroQueuePreview } from "@/components/landing/HeroQueuePreview";
import { LandingTrustSection } from "@/components/landing/LandingTrustSection";
import { ProductEvidenceStrip } from "@/components/landing/ProductEvidenceStrip";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { landingCopy, workflowItems } from "@/components/landing/landingContent";
import { Button } from "@/components/ui/button";

const LandingPage = () => {
  const navigate = useNavigate();
  const [showMobileStickyCta, setShowMobileStickyCta] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setShowMobileStickyCta(window.scrollY > 320);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="landing-shell min-h-screen scroll-smooth pb-24 md:pb-0">
      <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <span className="text-lg font-bold tracking-tight text-primary">
            LeadScorer<span className="text-accent">.ai</span>
          </span>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
              Log In
            </Button>
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => navigate("/dashboard")}>
              {landingCopy.navCta}
            </Button>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-6 pb-14 pt-16 md:pt-20">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              <Sparkles className="h-3.5 w-3.5" />
              {landingCopy.heroKicker}
            </div>
            <h1 className="mb-4 text-3xl font-bold leading-tight tracking-tight text-primary md:text-4xl lg:text-5xl">{landingCopy.heroTitle}</h1>
            <p className="mb-6 max-w-lg text-base text-muted-foreground md:text-lg">{landingCopy.heroDescription}</p>
            <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button
                size="lg"
                className="bg-accent px-6 text-base text-accent-foreground hover:bg-accent/90 sm:min-w-[180px] sm:flex-1 md:flex-none"
                onClick={() => navigate("/dashboard")}
              >
                {landingCopy.heroPrimaryCta}
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" className="text-muted-foreground sm:min-w-[180px] sm:flex-1 md:flex-none" asChild>
                <a href="#how-it-works">{landingCopy.heroSecondaryCta}</a>
              </Button>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
              {landingCopy.heroTrustLine}
            </div>
          </div>

          <HeroQueuePreview />
        </div>
      </section>

      <ProductEvidenceStrip />

      <section id="how-it-works" className="surface-soft border-y">
        <div className="mx-auto max-w-6xl px-6 py-14 md:py-16">
          <p className="section-kicker text-center">{landingCopy.workflowTitle}</p>
          <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-primary md:text-4xl">From CSV upload to outreach</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-muted-foreground">{landingCopy.workflowDescription}</p>

          <div className="relative mt-7">
            <div className="pointer-events-none absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-accent/35 to-transparent md:block" />
            <div className="grid gap-3 md:grid-cols-3">
              {workflowItems.map((item) => (
                <article key={item.step} className="relative rounded-2xl border bg-card/95 p-4">
                  <span className="inline-flex rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 text-xs font-semibold tracking-[0.12em] text-accent">
                    {item.step}
                  </span>
                  <h3 className="mt-2 text-base font-semibold tracking-tight">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.oneLiner}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <LandingTrustSection />

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="cta-surface relative overflow-hidden rounded-3xl border border-border/70 p-8 text-center md:p-12">
          <div className="pointer-events-none absolute inset-0 cta-mesh" />
          <div className="relative z-10">
            <p className="section-kicker">Next Step</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-primary md:text-4xl">{landingCopy.finalCtaTitle}</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">{landingCopy.finalCtaBody}</p>
            <Button
              size="lg"
              className="cta-glow mt-8 bg-accent px-8 text-base text-accent-foreground hover:bg-accent/90"
              onClick={() => navigate("/dashboard")}
            >
              {landingCopy.finalCtaButton} <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />

      <div
        className={`sticky-cta fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 px-4 py-2 backdrop-blur-sm transition-opacity duration-200 md:hidden ${
          showMobileStickyCta ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <Button className="h-10 w-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => navigate("/dashboard")}>
          {landingCopy.finalCtaButton} <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default LandingPage;
