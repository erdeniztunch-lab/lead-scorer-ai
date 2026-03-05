import { type Lead } from "@/data/mockLeads";
import { type ScoringConfig, scoreLeads } from "@/lib/scoringEngine";

interface LeadMoveSummary {
  key: string;
  name: string;
  fromTier: Lead["tier"];
  toTier: Lead["tier"];
  scoreDelta: number;
  rankDelta: number;
}

export interface ScoringImpactPreview {
  avgScoreDelta: number;
  hotDelta: number;
  warmDelta: number;
  coldDelta: number;
  changedLeadCount: number;
  topMovedLeads: LeadMoveSummary[];
}

function leadKey(lead: Lead): string {
  return `${lead.email.toLowerCase()}|${lead.name.toLowerCase()}|${lead.company.toLowerCase()}`;
}

export function buildImpactPreview(
  baseLeads: Lead[],
  currentConfig: ScoringConfig,
  draftConfig: ScoringConfig,
): ScoringImpactPreview {
  const currentScored = scoreLeads(baseLeads, currentConfig);
  const draftScored = scoreLeads(baseLeads, draftConfig);

  const currentAvg = currentScored.reduce((sum, item) => sum + item.score, 0) / Math.max(1, currentScored.length);
  const draftAvg = draftScored.reduce((sum, item) => sum + item.score, 0) / Math.max(1, draftScored.length);

  const countByTier = (items: Lead[]) => ({
    hot: items.filter((item) => item.tier === "hot").length,
    warm: items.filter((item) => item.tier === "warm").length,
    cold: items.filter((item) => item.tier === "cold").length,
  });

  const currentTier = countByTier(currentScored);
  const draftTier = countByTier(draftScored);

  const currentByKey = new Map(currentScored.map((lead) => [leadKey(lead), lead]));
  const moved = draftScored.flatMap((lead) => {
    const previous = currentByKey.get(leadKey(lead));
    if (!previous) return [];
    const scoreDelta = lead.score - previous.score;
    const rankDelta = previous.rank - lead.rank;
    const changed = scoreDelta !== 0 || previous.tier !== lead.tier || rankDelta !== 0;
    if (!changed) return [];

    return [
      {
        key: leadKey(lead),
        name: lead.name,
        fromTier: previous.tier,
        toTier: lead.tier,
        scoreDelta,
        rankDelta,
      },
    ];
  });

  return {
    avgScoreDelta: Number((draftAvg - currentAvg).toFixed(2)),
    hotDelta: draftTier.hot - currentTier.hot,
    warmDelta: draftTier.warm - currentTier.warm,
    coldDelta: draftTier.cold - currentTier.cold,
    changedLeadCount: moved.length,
    topMovedLeads: moved.sort((a, b) => Math.abs(b.scoreDelta) - Math.abs(a.scoreDelta)).slice(0, 3),
  };
}

