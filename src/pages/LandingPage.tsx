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
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setShowMobileStickyCta(window.scrollY > 320);
      setHasScrolled(window.scrollY > 10);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="landing-atmosphere min-h-screen scroll-smooth pb-24 md:pb-0">
      <nav className={`sticky top-0 z-50 border-b border-border/50 backdrop-blur-xl transition-colors ${hasScrolled ? "bg-background/75" : "bg-background/45"}`}>
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <span className="text-lg font-bold tracking-tight text-primary">
            LeadScorer<span className="text-accent">.ai</span>
          </span>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
              Log In
            </Button>
            <Button size="sm" className="cta-glow bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => navigate("/dashboard")}>
              {landingCopy.navCta}
            </Button>
          </div>
        </div>
      </nav>

      <section className="section-breathing mx-auto max-w-6xl px-6 pt-16 md:pt-20">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
          <div className="reveal-fade-up is-visible">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              <Sparkles className="h-3.5 w-3.5" />
              {landingCopy.heroKicker}
            </div>
            <h1 className="editorial-h1 mb-4 max-w-xl">{landingCopy.heroTitle}</h1>
            <p className="editorial-body mb-6 max-w-lg">{landingCopy.heroDescription}</p>
            <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button
                size="lg"
                className="cta-glow bg-accent px-6 text-base text-accent-foreground hover:bg-accent/90 sm:min-w-[180px] sm:flex-1 md:flex-none"
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

          <div className="reveal-fade-up reveal-delay-1 is-visible">
            <HeroQueuePreview />
          </div>
        </div>
      </section>

      <ProductEvidenceStrip />

      <section id="how-it-works" className="reveal-fade-up reveal-delay-2 is-visible">
        <div className="section-breathing mx-auto max-w-6xl px-6">
          <p className="section-kicker text-center">{landingCopy.workflowTitle}</p>
          <h2 className="editorial-h2 mt-2 text-center">How your team runs this daily</h2>
          <p className="mx-auto mt-2 max-w-md text-center text-sm text-muted-foreground">{landingCopy.workflowDescription}</p>

          <div className="relative mt-7">
            <div className="pointer-events-none absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-accent/14 to-transparent md:block" />
            <div className="grid gap-3 md:grid-cols-3">
              {workflowItems.map((item) => (
                <article key={item.step} className="glass-panel relative flex h-full flex-col rounded-2xl p-4 md:p-5">
                  <span className="inline-flex w-fit rounded-full border border-accent/55 bg-accent/15 px-2.5 py-1 text-xs font-semibold tracking-[0.14em] text-accent">
                    {item.step}
                  </span>
                  <h3 className="mt-2 text-base font-semibold tracking-tight">{item.title}</h3>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground">{item.oneLiner}</p>
                  <span className="glass-chip mt-3 inline-flex w-fit rounded-full px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                    {item.output}
                  </span>
                </article>
              ))}
            </div>
          </div>

          <div className="glass-divider mt-6 flex flex-col items-center gap-3 pt-4">
            <p className="text-center text-xs text-muted-foreground">Frontend prototype: session/local mode.</p>
          </div>
        </div>
      </section>

      <LandingTrustSection />

      <section className="mx-auto max-w-6xl px-6 pb-16 md:pb-20">
        <div className="cta-surface glass-panel-strong relative overflow-hidden rounded-3xl p-8 text-center md:p-12">
          <div className="pointer-events-none absolute inset-0 cta-mesh" />
          <div className="relative z-10">
            <p className="section-kicker">Next Step</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-primary md:text-4xl">{landingCopy.finalCtaTitle}</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">{landingCopy.finalCtaBody}</p>
            <Button
              size="lg"
              className="cta-glow-soft mt-8 bg-accent px-8 text-base text-accent-foreground hover:bg-accent/90"
              onClick={() => navigate("/dashboard")}
            >
              {landingCopy.finalCtaButton} <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />

      <div
        className={`sticky-cta glass-panel fixed bottom-0 left-0 right-0 z-50 border-t px-4 py-2 transition-opacity duration-200 md:hidden ${
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
