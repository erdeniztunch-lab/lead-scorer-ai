import { type Lead } from "@/data/mockLeads";

export type DemoScenarioId = "high_intent_inbound" | "noisy_mixed_list" | "outbound_batch";

export interface DemoScenario {
  id: DemoScenarioId;
  name: string;
  goal: string;
  description: string;
  seedLeads: Lead[];
  recommendedSteps: string[];
}

export interface DemoSessionState {
  enabled: boolean;
  activeScenarioId?: DemoScenarioId;
  tourCompletedByScenario: Record<DemoScenarioId, boolean>;
  startedAt?: string;
  lastResetAt?: string;
}

const DEMO_SESSION_KEY = "lead_scorer_demo_session_v1";

const DEFAULT_DEMO_SESSION: DemoSessionState = {
  enabled: false,
  activeScenarioId: "high_intent_inbound",
  tourCompletedByScenario: {
    high_intent_inbound: false,
    noisy_mixed_list: false,
    outbound_batch: false,
  },
};

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadDemoSessionState(): DemoSessionState {
  if (!isBrowser()) return DEFAULT_DEMO_SESSION;
  const raw = window.localStorage.getItem(DEMO_SESSION_KEY);
  if (!raw) return DEFAULT_DEMO_SESSION;

  try {
    const parsed = JSON.parse(raw) as DemoSessionState;
    return {
      ...DEFAULT_DEMO_SESSION,
      ...parsed,
      tourCompletedByScenario: {
        ...DEFAULT_DEMO_SESSION.tourCompletedByScenario,
        ...(parsed.tourCompletedByScenario ?? {}),
      },
    };
  } catch {
    return DEFAULT_DEMO_SESSION;
  }
}

export function saveDemoSessionState(state: DemoSessionState): DemoSessionState {
  const next = {
    ...DEFAULT_DEMO_SESSION,
    ...state,
    tourCompletedByScenario: {
      ...DEFAULT_DEMO_SESSION.tourCompletedByScenario,
      ...(state.tourCompletedByScenario ?? {}),
    },
  };
  if (isBrowser()) {
    window.localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("lead-scorer:demo-session-updated"));
  }
  return next;
}

export function setDemoEnabled(enabled: boolean): DemoSessionState {
  const current = loadDemoSessionState();
  return saveDemoSessionState({
    ...current,
    enabled,
    startedAt: enabled ? new Date().toISOString() : current.startedAt,
  });
}

export function setActiveScenario(id: DemoScenarioId): DemoSessionState {
  const current = loadDemoSessionState();
  return saveDemoSessionState({
    ...current,
    activeScenarioId: id,
  });
}

export function markTourCompleted(id: DemoScenarioId): DemoSessionState {
  const current = loadDemoSessionState();
  return saveDemoSessionState({
    ...current,
    tourCompletedByScenario: {
      ...current.tourCompletedByScenario,
      [id]: true,
    },
  });
}

export function resetScenarioState(id: DemoScenarioId): DemoSessionState {
  const current = loadDemoSessionState();
  return saveDemoSessionState({
    ...current,
    activeScenarioId: id,
    lastResetAt: new Date().toISOString(),
    tourCompletedByScenario: {
      ...current.tourCompletedByScenario,
      [id]: false,
    },
  });
}

