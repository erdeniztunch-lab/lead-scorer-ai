export type PrototypeEventName =
  | "demo_mode_toggled"
  | "scenario_selected"
  | "scenario_reset"
  | "tour_step_viewed"
  | "tour_completed"
  | "import_clicked"
  | "filter_used"
  | "lead_expanded"
  | "action_clicked"
  | "analytics_viewed"
  | "settings_saved";

export interface PrototypeEvent {
  event: PrototypeEventName;
  timestamp: string;
  context: Record<string, string | number | boolean | null>;
}

const PROTOTYPE_EVENTS_KEY = "lead_scorer_prototype_events_v1";
const MAX_EVENTS = 500;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadPrototypeEvents(limit?: number): PrototypeEvent[] {
  if (!isBrowser()) return [];
  const raw = window.localStorage.getItem(PROTOTYPE_EVENTS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as PrototypeEvent[];
    if (!Array.isArray(parsed)) return [];
    return typeof limit === "number" ? parsed.slice(0, limit) : parsed;
  } catch {
    return [];
  }
}

export function trackPrototypeEvent(
  event: PrototypeEventName,
  context: Record<string, string | number | boolean | null> = {},
): void {
  if (!isBrowser()) return;
  const current = loadPrototypeEvents();
  const next: PrototypeEvent[] = [{ event, timestamp: new Date().toISOString(), context }, ...current].slice(0, MAX_EVENTS);
  window.localStorage.setItem(PROTOTYPE_EVENTS_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("lead-scorer:prototype-events-updated"));
}

export function clearPrototypeEvents(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(PROTOTYPE_EVENTS_KEY);
  window.dispatchEvent(new CustomEvent("lead-scorer:prototype-events-updated"));
}

