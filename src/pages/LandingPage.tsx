import { Upload, BarChart3, Zap, Mail, Phone, Linkedin, ArrowRight, ChevronDown, Star, Users, Clock, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
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

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight text-primary mb-4">
            Rank your inbound leads. Contact the highest-value opportunities first.
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl">
            LeadScorer.ai uses AI to score and prioritize your e-commerce leads so your sales team closes more, faster.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 text-base px-6" onClick={() => navigate("/dashboard")}>
              Upload your CSV and see top leads now
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
            <Button variant="ghost" size="lg" className="text-muted-foreground" asChild>
              <a href="#how-it-works">
                See how it works <ChevronDown className="ml-1 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-card border-y">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold text-primary mb-10 text-center">How it works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Upload, title: "Upload", desc: "Drop your CSV of leads or connect your CRM.", step: "1" },
              { icon: BarChart3, title: "Score", desc: "AI ranks leads by purchase intent, engagement, and fit.", step: "2" },
              { icon: Zap, title: "Act", desc: "Contact top leads first with one-click outreach.", step: "3" },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <item.icon className="h-6 w-6 text-accent" />
                </div>
                <div className="text-sm font-semibold text-muted-foreground mb-1">Step {item.step}</div>
                <h3 className="text-lg font-bold text-primary mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-primary mb-10 text-center">Everything you need to close faster</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Target, title: "See why each lead ranks high", desc: "AI-generated reason codes explain every score so your team trusts the data." },
            { icon: Mail, title: "One-click email, call, or LinkedIn", desc: "Reach out instantly without switching tools or tabs." },
            { icon: Clock, title: "Track team speed with KPIs", desc: "Monitor time-to-first-contact, precision, and lift in real time." },
          ].map((item) => (
            <Card key={item.title} className="border bg-card">
              <CardContent className="pt-6">
                <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center mb-4">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-primary mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Social Proof */}
      <section className="bg-card border-y">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-accent text-accent" />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">Used by 200+ SMB stores</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Alex Rivera", company: "ShopNova", quote: "We cut our response time by 60%. The lead scoring is shockingly accurate." },
              { name: "Priya Sharma", company: "LuxeThread", quote: "Finally, our sales team knows exactly who to call first. Pipeline velocity doubled." },
              { name: "Jordan Lee", company: "FreshFit Co", quote: "Setup took 5 minutes. We were scoring leads before lunch." },
            ].map((t) => (
              <Card key={t.name} className="border bg-background">
                <CardContent className="pt-6">
                  <p className="text-sm text-foreground mb-4 italic">"{t.quote}"</p>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {t.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium text-foreground">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.company}</div>
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
        <h2 className="text-3xl font-bold text-primary mb-4">Start scoring leads — free</h2>
        <p className="text-muted-foreground mb-8">No credit card required. See results in under 5 minutes.</p>
        <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 text-base px-8" onClick={() => navigate("/dashboard")}>
          Get Started Free <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">© 2026 LeadScorer.ai</span>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
