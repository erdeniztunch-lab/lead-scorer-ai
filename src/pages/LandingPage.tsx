import { ArrowRight, CheckCircle2, ChevronDown, Mail, Phone, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FeatureNarrativeSection } from "@/components/landing/FeatureNarrativeSection";
import { FinalCtaSection } from "@/components/landing/FinalCtaSection";
import { HowItWorksStorySection } from "@/components/landing/HowItWorksStorySection";
import { ProofMetricsSection } from "@/components/landing/ProofMetricsSection";
import { SiteFooter } from "@/components/landing/SiteFooter";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen scroll-smooth bg-background pb-24 md:pb-0">
      <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <span className="text-lg font-bold tracking-tight text-primary">
            LeadScorer<span className="text-accent">.ai</span>
          </span>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
              Log In
            </Button>
            <Button
              size="sm"
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={() => navigate("/dashboard")}
            >
              Get Started Free
            </Button>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-6 pb-14 pt-16 md:pb-16 md:pt-20">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Free for up to 500 leads - no credit card
            </div>
            <h1 className="mb-4 text-3xl font-bold leading-tight tracking-tight text-primary md:text-4xl lg:text-5xl">
              Rank your inbound leads. Contact the highest-value opportunities first.
            </h1>
            <p className="mb-6 max-w-lg text-base text-muted-foreground md:text-lg">
              AI scores and prioritizes your e-commerce leads so your sales team closes more, faster.
            </p>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="bg-accent px-6 text-base text-accent-foreground hover:bg-accent/90"
                onClick={() => navigate("/dashboard")}
              >
                Start Scoring Leads
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" className="text-muted-foreground" asChild>
                <a href="#how-it-works">
                  See how it works <ChevronDown className="ml-1 h-4 w-4" />
                </a>
              </Button>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex -space-x-2">
                {["AR", "PS", "JL", "MK"].map((initials) => (
                  <Avatar key={initials} className="h-6 w-6 border-2 border-background">
                    <AvatarFallback className="bg-primary/10 text-[9px] text-primary">{initials}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <span>
                Trusted by <strong className="text-foreground">200+ SMB stores</strong>
              </span>
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, index) => (
                  <Star key={index} className="h-3 w-3 fill-accent text-accent" />
                ))}
              </div>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="space-y-4 rounded-xl border bg-card p-5 shadow-lg">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Hot Leads", value: "23", color: "text-destructive" },
                  { label: "Precision@10", value: "87%", color: "text-accent" },
                  { label: "Lift", value: "3.2x", color: "text-primary" },
                ].map((kpi) => (
                  <div key={kpi.label} className="rounded-lg border bg-background p-3 text-center">
                    <div className={`text-lg font-bold ${kpi.color}`}>{kpi.value}</div>
                    <div className="text-[10px] text-muted-foreground">{kpi.label}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                {[
                  { rank: 1, name: "Sarah Chen", score: 94, tier: "hot" as const, reason: "High engagement" },
                  { rank: 2, name: "Marcus Johnson", score: 89, tier: "hot" as const, reason: "Demo requested" },
                  { rank: 3, name: "Aisha Patel", score: 82, tier: "hot" as const, reason: "Email engaged" },
                ].map((lead) => (
                  <div key={lead.rank} className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2.5">
                    <span className="w-4 text-xs font-medium text-muted-foreground">#{lead.rank}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-foreground">{lead.name}</div>
                    </div>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-secondary-foreground">
                      {lead.reason}
                    </span>
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-xs font-bold ${
                        lead.tier === "hot" ? "bg-score-hot-bg text-score-hot" : "bg-score-warm-bg text-score-warm"
                      }`}
                    >
                      {lead.score}
                    </span>
                    <div className="flex gap-0.5">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <span className="text-[10px] text-muted-foreground">Live dashboard preview</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <HowItWorksStorySection />
      <FeatureNarrativeSection />
      <ProofMetricsSection />
      <FinalCtaSection onPrimaryCta={() => navigate("/dashboard")} />
      <SiteFooter />

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 px-4 py-3 backdrop-blur-sm md:hidden">
        <Button
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
          onClick={() => navigate("/dashboard")}
        >
          Start Scoring Leads <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default LandingPage;
