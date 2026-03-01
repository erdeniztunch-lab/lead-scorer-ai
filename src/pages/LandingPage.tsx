import { Upload, BarChart3, Zap, Mail, Phone, Linkedin, ArrowRight, ChevronDown, Star, Users, Clock, Target, CheckCircle2, TrendingUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background scroll-smooth">
      {/* Nav */}
      <nav className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-lg font-bold tracking-tight text-primary">
            LeadScorer<span className="text-accent">.ai</span>
          </span>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              Log In
            </Button>
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => navigate("/dashboard")}>
              Get Started Free
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero — two-column with mini preview */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-14 md:pt-20 md:pb-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left — copy */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent mb-6">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Free for up to 500 leads — no credit card
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-primary mb-4">
              Rank your inbound leads. Contact the highest-value opportunities first.
            </h1>
            <p className="text-base md:text-lg text-muted-foreground mb-6 max-w-lg">
              AI scores and prioritizes your e-commerce leads so your sales team closes more, faster.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 text-base px-6" onClick={() => navigate("/dashboard")}>
                Start Scoring Leads
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" className="text-muted-foreground" asChild>
                <a href="#how-it-works">
                  See how it works <ChevronDown className="ml-1 h-4 w-4" />
                </a>
              </Button>
            </div>
            {/* Trust bar */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex -space-x-2">
                {["AR", "PS", "JL", "MK"].map((initials) => (
                  <Avatar key={initials} className="h-6 w-6 border-2 border-background">
                    <AvatarFallback className="text-[9px] bg-primary/10 text-primary">{initials}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <span>Trusted by <strong className="text-foreground">200+ SMB stores</strong></span>
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-accent text-accent" />
                ))}
              </div>
            </div>
          </div>

          {/* Right — mini dashboard preview */}
          <div className="hidden md:block">
            <div className="rounded-xl border bg-card shadow-lg p-5 space-y-4">
              {/* Mini KPI row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Hot Leads", value: "23", color: "text-destructive" },
                  { label: "Precision@10", value: "87%", color: "text-accent" },
                  { label: "Lift", value: "3.2×", color: "text-primary" },
                ].map((kpi) => (
                  <div key={kpi.label} className="rounded-lg border bg-background p-3 text-center">
                    <div className={`text-lg font-bold ${kpi.color}`}>{kpi.value}</div>
                    <div className="text-[10px] text-muted-foreground">{kpi.label}</div>
                  </div>
                ))}
              </div>
              {/* Mini lead rows */}
              <div className="space-y-2">
                {[
                  { rank: 1, name: "Sarah Chen", score: 94, tier: "hot" as const, reason: "High engagement" },
                  { rank: 2, name: "Marcus Johnson", score: 89, tier: "hot" as const, reason: "Demo requested" },
                  { rank: 3, name: "Aisha Patel", score: 82, tier: "hot" as const, reason: "Email engaged" },
                ].map((lead) => (
                  <div key={lead.rank} className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2.5">
                    <span className="text-xs font-medium text-muted-foreground w-4">#{lead.rank}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{lead.name}</div>
                    </div>
                    <span className="text-[10px] rounded-full bg-secondary text-secondary-foreground px-2 py-0.5">{lead.reason}</span>
                    <span className={`text-xs font-bold rounded-md px-1.5 py-0.5 ${
                      lead.tier === "hot" ? "bg-score-hot-bg text-score-hot" : "bg-score-warm-bg text-score-warm"
                    }`}>
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

      {/* How It Works — with connectors */}
      <section id="how-it-works" className="bg-card border-y">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold text-primary mb-2 text-center">How it works</h2>
          <p className="text-sm text-muted-foreground text-center mb-12">From CSV to closed deal in 3 steps</p>
          <div className="grid md:grid-cols-3 gap-6 relative">
            {/* Connector lines (desktop only) */}
            <div className="hidden md:block absolute top-10 left-[calc(33.333%-12px)] w-[calc(33.333%+24px)] h-px border-t-2 border-dashed border-border z-0" />
            <div className="hidden md:block absolute top-10 left-[calc(66.666%-12px)] w-[calc(33.333%+24px)] h-px border-t-2 border-dashed border-border z-0" />
            
            {[
              { icon: Upload, title: "Upload", desc: "Drop your CSV of leads or connect your CRM. Supports HubSpot, Salesforce, and Shopify.", step: "1" },
              { icon: BarChart3, title: "Score", desc: "AI ranks leads by purchase intent, engagement signals, and fit with your ideal customer profile.", step: "2" },
              { icon: Zap, title: "Act", desc: "Contact top leads first with one-click email, call, or LinkedIn outreach.", step: "3" },
            ].map((item) => (
              <div key={item.step} className="relative z-10 flex flex-col items-center text-center bg-card rounded-xl p-6">
                <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mb-4 border-2 border-accent/20">
                  <item.icon className="h-6 w-6 text-accent" />
                </div>
                <div className="text-xs font-bold text-accent mb-1 uppercase tracking-wider">Step {item.step}</div>
                <h3 className="text-lg font-bold text-primary mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features — with color-coded accents */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-primary mb-2 text-center">Everything you need to close faster</h2>
        <p className="text-sm text-muted-foreground text-center mb-10">Built for SMB sales teams who want results, not complexity</p>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Target, title: "AI Reason Codes", desc: "See exactly why each lead ranks high. Your team trusts the data because they understand it.", accent: "bg-accent/10 text-accent" },
            { icon: Mail, title: "One-Click Outreach", desc: "Email, call, or LinkedIn — reach out instantly without switching tools or tabs.", accent: "bg-primary/5 text-primary" },
            { icon: TrendingUp, title: "Real-Time KPIs", desc: "Monitor time-to-first-contact, precision, and lift. Know if your team is getting faster.", accent: "bg-destructive/10 text-destructive" },
          ].map((item) => (
            <Card key={item.title} className="border bg-card hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${item.accent}`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Social Proof — with roles */}
      <section className="bg-card border-y">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold text-primary mb-2 text-center">What teams are saying</h2>
          <p className="text-sm text-muted-foreground text-center mb-10">Real results from real SMB sales teams</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Alex Rivera", role: "Head of Sales", company: "ShopNova", quote: "We cut our response time by 60%. The lead scoring is shockingly accurate.", metric: "60% faster response" },
              { name: "Priya Sharma", role: "Revenue Ops", company: "LuxeThread", quote: "Finally, our sales team knows exactly who to call first. Pipeline velocity doubled.", metric: "2× pipeline velocity" },
              { name: "Jordan Lee", role: "Founder", company: "FreshFit Co", quote: "Setup took 5 minutes. We were scoring leads before lunch.", metric: "5 min setup" },
            ].map((t) => (
              <Card key={t.name} className="border bg-background">
                <CardContent className="pt-6">
                  <div className="inline-flex items-center rounded-full bg-accent/10 text-accent text-[10px] font-bold px-2 py-0.5 mb-3 uppercase tracking-wide">
                    {t.metric}
                  </div>
                  <p className="text-sm text-foreground mb-4 leading-relaxed">"{t.quote}"</p>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                        {t.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium text-foreground">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.role}, {t.company}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold text-primary mb-3">Start scoring leads — free</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">No credit card required. Upload your CSV and see your top leads ranked in under 5 minutes.</p>
        <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 text-base px-8" onClick={() => navigate("/dashboard")}>
          Get Started Free <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-accent" /> Free up to 500 leads</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-accent" /> No credit card</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-accent" /> 5 min setup</span>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm font-semibold text-primary">LeadScorer<span className="text-accent">.ai</span></span>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </footer>

      {/* Sticky Mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden z-50 border-t bg-card/95 backdrop-blur-sm px-4 py-3">
        <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => navigate("/dashboard")}>
          Start Scoring Leads <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default LandingPage;
