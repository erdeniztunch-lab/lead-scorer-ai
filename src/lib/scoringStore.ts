import { DEFAULT_SCORING_CONFIG, type ScoringConfig } from "@/lib/scoringEngine";

const SCORING_CONFIG_KEY = "lead_scorer_scoring_config_v1";
const SCORING_RUNS_KEY = "lead_scorer_scoring_runs_v1";

export interface ScoringRunSummary {
  runId: string;
  timestamp: string;
  leadCount: number;
  averageScore: number;
  configVersion: string;
  trigger: "import" | "manual_rescore" | "settings_save";
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function mergeConfig(input: Partial<ScoringConfig>): ScoringConfig {
  return {
    ...DEFAULT_SCORING_CONFIG,
    ...input,
    thresholds: {
      ...DEFAULT_SCORING_CONFIG.thresholds,
      ...(input.thresholds ?? {}),
    },
    weights: {
      ...DEFAULT_SCORING_CONFIG.weights,
      ...(input.weights ?? {}),
      engagement: {
        ...DEFAULT_SCORING_CONFIG.weights.engagement,
        ...(input.weights?.engagement ?? {}),
      },
      fit: {
        ...DEFAULT_SCORING_CONFIG.weights.fit,
        ...(input.weights?.fit ?? {}),
      },
      recency: {
        ...DEFAULT_SCORING_CONFIG.weights.recency,
        ...(input.weights?.recency ?? {}),
      },
      sourcePrior: {
        ...DEFAULT_SCORING_CONFIG.weights.sourcePrior,
        ...(input.weights?.sourcePrior ?? {}),
      },
    },
  };
}

export function loadScoringConfig(): ScoringConfig {
  if (!isBrowser()) {
    return DEFAULT_SCORING_CONFIG;
  }
  const raw = window.localStorage.getItem(SCORING_CONFIG_KEY);
  if (!raw) {
    return DEFAULT_SCORING_CONFIG;
  }
  try {
    return mergeConfig(JSON.parse(raw) as Partial<ScoringConfig>);
  } catch {
    return DEFAULT_SCORING_CONFIG;
  }
}

export function saveScoringConfig(config: ScoringConfig): void {
  if (!isBrowser()) {
    return;
  }
  window.localStorage.setItem(SCORING_CONFIG_KEY, JSON.stringify(config));
  window.dispatchEvent(new CustomEvent("lead-scorer:scoring-config-updated"));
}

export function loadScoringRuns(limit?: number): ScoringRunSummary[] {
  if (!isBrowser()) {
    return [];
  }
  const raw = window.localStorage.getItem(SCORING_RUNS_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as ScoringRunSummary[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return typeof limit === "number" ? parsed.slice(0, limit) : parsed;
  } catch {
    return [];
  }
}

export function appendScoringRun(run: ScoringRunSummary): void {
  if (!isBrowser()) {
    return;
  }
  const runs = loadScoringRuns();
  const next = [run, ...runs].slice(0, 50);
  window.localStorage.setItem(SCORING_RUNS_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("lead-scorer:scoring-runs-updated"));
}
