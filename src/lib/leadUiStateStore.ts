export type LeadStatus = "new" | "contacted" | "snoozed";

export interface LeadUIStateItem {
  leadId: number;
  status: LeadStatus;
  contactedAt?: string;
  snoozedUntil?: string;
  pinned?: boolean;
}

export type LeadUIStateMap = Record<number, LeadUIStateItem>;

const LEAD_UI_STATE_KEY = "lead_scorer_ui_state_v1";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadLeadUiState(): LeadUIStateMap {
  if (!isBrowser()) return {};
  const raw = window.localStorage.getItem(LEAD_UI_STATE_KEY);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as LeadUIStateMap;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
}

export function saveLeadUiState(state: LeadUIStateMap): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(LEAD_UI_STATE_KEY, JSON.stringify(state));
}

export function clearLeadUiState(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(LEAD_UI_STATE_KEY);
}

