import { mockLeads, type Lead } from "@/data/mockLeads";
import { type DemoScenario, type DemoScenarioId } from "@/lib/demoStore";
import { scoreLeads, DEFAULT_SCORING_CONFIG } from "@/lib/scoringEngine";

function cloneLead(lead: Lead, patch: Partial<Lead>): Lead {
  return {
    ...lead,
    ...patch,
    scoreBreakdown: patch.scoreBreakdown ?? lead.scoreBreakdown.map((item) => ({ ...item })),
    reasons: patch.reasons ?? [...lead.reasons],
    topReasons: patch.topReasons ?? lead.topReasons ? [...(patch.topReasons ?? lead.topReasons ?? [])] : undefined,
    enrichmentMeta: patch.enrichmentMeta
      ? {
          ...patch.enrichmentMeta,
          changes: patch.enrichmentMeta.changes.map((change) => ({ ...change })),
        }
      : lead.enrichmentMeta,
  };
}

function buildHighIntentInboundSeed(): Lead[] {
  const base = scoreLeads(mockLeads, DEFAULT_SCORING_CONFIG).slice(0, 8);
  const boosted = base.map((lead, index) =>
    cloneLead(lead, {
      source: index < 4 ? "Referral" : lead.source,
      lastActivity: index < 3 ? "2 hours ago" : lead.lastActivity,
    }),
  );
  return scoreLeads(boosted, DEFAULT_SCORING_CONFIG);
}

function buildNoisyMixedSeed(): Lead[] {
  const base = scoreLeads(mockLeads, DEFAULT_SCORING_CONFIG);
  const noisy = base.map((lead, index) =>
    cloneLead(lead, {
      source: index % 2 === 0 ? "Cold outbound" : "Google Ads",
      lastActivity: index % 3 === 0 ? "2 weeks ago" : "5 days ago",
    }),
  );
  return scoreLeads(noisy, DEFAULT_SCORING_CONFIG);
}

function buildOutboundBatchSeed(): Lead[] {
  const base = scoreLeads(mockLeads, DEFAULT_SCORING_CONFIG);
  const outbound = base.map((lead, index) =>
    cloneLead(lead, {
      source: "Cold outbound",
      lastActivity: index < 4 ? "1 day ago" : "6 days ago",
      name: `${lead.name} (OB${index + 1})`,
    }),
  );
  return scoreLeads(outbound, DEFAULT_SCORING_CONFIG);
}

export const demoScenarios: Record<DemoScenarioId, DemoScenario> = {
  high_intent_inbound: {
    id: "high_intent_inbound",
    name: "High-intent inbound",
    goal: "Show how quickly reps can act on high intent inbound signals.",
    description: "Inbound-heavy list with stronger recency and source quality.",
    seedLeads: buildHighIntentInboundSeed(),
    recommendedSteps: ["Import", "Review top 3 hot leads", "Mark contacted", "Open analytics"],
  },
  noisy_mixed_list: {
    id: "noisy_mixed_list",
    name: "Noisy mixed list",
    goal: "Show filtering and explainability on noisy lead quality.",
    description: "Mixed quality traffic where prioritization clarity matters.",
    seedLeads: buildNoisyMixedSeed(),
    recommendedSteps: ["Apply filters", "Expand why-this-score", "Snooze low-priority leads", "Open analytics"],
  },
  outbound_batch: {
    id: "outbound_batch",
    name: "Outbound batch",
    goal: "Show triage speed on outbound-heavy list.",
    description: "Outbound-first batch to demonstrate queue operations.",
    seedLeads: buildOutboundBatchSeed(),
    recommendedSteps: ["Pin top lead", "Use shortcuts", "Mark contacted", "Check settings impact"],
  },
};

