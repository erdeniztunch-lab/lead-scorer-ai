import { useMemo, useState } from "react";
import { type Lead } from "@/data/mockLeads";
import { scoreLeads, type ScoringConfig } from "@/lib/scoringEngine";
import { appendScoringRun, loadScoringConfig, saveScoringConfig, type ScoringRunSummary } from "@/lib/scoringStore";

function createRunSummary(
  leads: Lead[],
  config: ScoringConfig,
  trigger: ScoringRunSummary["trigger"],
): ScoringRunSummary {
  const averageScore = leads.length > 0 ? leads.reduce((sum, lead) => sum + lead.score, 0) / leads.length : 0;
  return {
    runId: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    leadCount: leads.length,
    averageScore: Number(averageScore.toFixed(2)),
    configVersion: config.version,
    trigger,
  };
}

export function useLeadScoring() {
  const [scoringConfig, setScoringConfig] = useState<ScoringConfig>(() => loadScoringConfig());

  const actions = useMemo(
    () => ({
      rescore(leads: Lead[], trigger: ScoringRunSummary["trigger"]) {
        const rescored = scoreLeads(leads, scoringConfig);
        const run = createRunSummary(rescored, scoringConfig, trigger);
        appendScoringRun(run);
        return { leads: rescored, run };
      },
      saveConfig(nextConfig: ScoringConfig) {
        saveScoringConfig(nextConfig);
        setScoringConfig(nextConfig);
      },
      loadConfig() {
        const next = loadScoringConfig();
        setScoringConfig(next);
        return next;
      },
    }),
    [scoringConfig],
  );

  return { scoringConfig, ...actions };
}
