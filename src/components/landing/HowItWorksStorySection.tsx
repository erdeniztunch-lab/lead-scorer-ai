import { BarChart3, Upload, Zap } from "lucide-react";
import { SectionHeader } from "@/components/landing/SectionHeader";
import { StepRailItem } from "@/components/landing/StepRailItem";

const steps = [
  {
    step: "01",
    title: "Upload",
    description:
      "Drop your CSV of leads or connect your CRM. Supports HubSpot, Salesforce, and Shopify.",
    microProof: "Maps required fields in under 2 minutes",
    icon: Upload,
  },
  {
    step: "02",
    title: "Score",
    description:
      "AI ranks leads by purchase intent, engagement signals, and fit with your ideal customer profile.",
    microProof: "Reason codes make every score explainable",
    icon: BarChart3,
  },
  {
    step: "03",
    title: "Act",
    description: "Contact top leads first with one-click email, call, or LinkedIn outreach.",
    microProof: "Prioritized queue keeps reps focused on highest-value opportunities",
    icon: Zap,
  },
];

export function HowItWorksStorySection() {
  return (
    <section id="how-it-works" className="surface-soft border-y">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <SectionHeader
          kicker="Workflow"
          title="From inbound noise to a ranked, actionable pipeline"
          description="The same 3-step model, reframed as a clear operating rhythm your team can execute every day."
        />

        <div className="mt-12 grid gap-6 md:grid-cols-[120px_minmax(0,1fr)]">
          <div className="relative hidden md:block">
            <div className="sticky top-28">
              <div className="mx-auto h-[420px] w-px story-divider" />
            </div>
          </div>
          <div className="space-y-5">
            {steps.map((item, index) => (
              <StepRailItem
                key={item.step}
                {...item}
                zigzag={index % 2 === 1}
                showMobileConnector={index < steps.length - 1}
                revealDelayMs={index * 70}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
