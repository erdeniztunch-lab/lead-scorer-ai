import { type Lead } from "@/data/mockLeads";
import { type LeadUIStateItem } from "@/lib/leadUiStateStore";

export type LeadSlaState = "on_track" | "due_soon" | "overdue" | "responded";

export function parseLastActivityHours(value: string): number | null {
  const normalized = value.trim().toLowerCase();
  const match = normalized.match(/^(\d+)\s+(hour|hours|day|days|week|weeks)\s+ago$/);
  if (!match) return null;

  const amount = Number(match[1]);
  const unit = match[2];
  if (!Number.isFinite(amount)) return null;

  if (unit.startsWith("hour")) return amount;
  if (unit.startsWith("day")) return amount * 24;
  return amount * 24 * 7;
}

export function isSnoozed(state: LeadUIStateItem | undefined, now = Date.now()): boolean {
  if (!state?.snoozedUntil) return false;
  const snoozedUntilMs = Date.parse(state.snoozedUntil);
  if (!Number.isFinite(snoozedUntilMs)) return false;
  return snoozedUntilMs > now;
}

export function getSlaState(lead: Lead, state: LeadUIStateItem | undefined): LeadSlaState {
  if (state?.status === "contacted") {
    return "responded";
  }

  const ageHours = parseLastActivityHours(lead.lastActivity);
  if (ageHours === null) return "due_soon";
  if (ageHours <= 24) return "on_track";
  if (ageHours <= 72) return "due_soon";
  return "overdue";
}

export function sortLeadsByWorkflowPriority(
  a: Lead,
  b: Lead,
  aState: LeadUIStateItem | undefined,
  bState: LeadUIStateItem | undefined,
): number {
  const aPinned = Boolean(aState?.pinned);
  const bPinned = Boolean(bState?.pinned);
  if (aPinned !== bPinned) return aPinned ? -1 : 1;

  const aSnoozed = isSnoozed(aState);
  const bSnoozed = isSnoozed(bState);
  if (aSnoozed !== bSnoozed) return aSnoozed ? 1 : -1;

  if (a.score !== b.score) return b.score - a.score;
  return a.rank - b.rank;
}

