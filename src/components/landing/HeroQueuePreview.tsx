import { CheckCircle2 } from "lucide-react";
import { queueSnapshot } from "@/components/landing/landingContent";

function scoreTone(tier: "hot" | "warm") {
  return tier === "hot" ? "bg-score-hot-bg text-score-hot" : "bg-score-warm-bg text-score-warm";
}

export function HeroQueuePreview() {
  const LatencyIcon = queueSnapshot.latencyIcon;

  return (
    <aside className="data-panel rounded-3xl p-5 md:p-6">
      <div className="data-grid absolute inset-0 rounded-3xl" />
      <div className="relative z-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">Prioritized Queue Snapshot</p>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {queueSnapshot.summary.map((item) => (
            <div key={item.label} className="rounded-xl border border-border/80 bg-card/80 p-3">
              <p className={`text-lg font-semibold ${item.tone}`}>{item.value}</p>
              <p className="text-[11px] text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-2">
          {queueSnapshot.leads.map((lead, index) => (
            <div key={lead.name} className="flex items-center gap-3 rounded-xl border border-border/80 bg-card/85 px-3 py-2">
              <span className="w-4 text-xs text-muted-foreground">#{index + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{lead.name}</p>
                <p className="truncate text-xs text-muted-foreground">{lead.company}</p>
              </div>
              <span className="hidden rounded-full bg-secondary px-2 py-0.5 text-[10px] text-secondary-foreground sm:inline-flex">
                {lead.reason}
              </span>
              <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${scoreTone(lead.tier)}`}>{lead.score}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 bg-background/85 px-3 py-2">
          <p className="text-[11px] text-muted-foreground">{queueSnapshot.footerNote}</p>
          <p className="inline-flex items-center gap-1.5 text-xs text-foreground">
            <LatencyIcon className="h-3.5 w-3.5 text-accent" />
            {queueSnapshot.latencyLabel}: <strong>{queueSnapshot.latencyValue}</strong>
          </p>
        </div>

        <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
          Explainable scoring with queue-first execution
        </p>
      </div>
    </aside>
  );
}
