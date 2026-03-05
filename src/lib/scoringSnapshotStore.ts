import { type ScoringConfig } from "@/lib/scoringEngine";

const SCORING_SNAPSHOTS_KEY = "lead_scorer_scoring_snapshots_v1";
const MAX_SNAPSHOTS = 20;

export interface LocalScoringConfigSnapshot {
  id: string;
  name: string;
  config: ScoringConfig;
  createdAt: string;
  note?: string;
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadScoringSnapshots(): LocalScoringConfigSnapshot[] {
  if (!isBrowser()) return [];
  const raw = window.localStorage.getItem(SCORING_SNAPSHOTS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as LocalScoringConfigSnapshot[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveSnapshots(next: LocalScoringConfigSnapshot[]): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(SCORING_SNAPSHOTS_KEY, JSON.stringify(next));
}

export function saveScoringSnapshot(input: Omit<LocalScoringConfigSnapshot, "id" | "createdAt">): LocalScoringConfigSnapshot {
  const snapshot: LocalScoringConfigSnapshot = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    ...input,
  };
  const current = loadScoringSnapshots();
  const next = [snapshot, ...current].slice(0, MAX_SNAPSHOTS);
  saveSnapshots(next);
  return snapshot;
}

export function deleteScoringSnapshot(id: string): void {
  if (!id) return;
  const next = loadScoringSnapshots().filter((item) => item.id !== id);
  saveSnapshots(next);
}

export function updateScoringSnapshot(
  id: string,
  patch: Partial<Pick<LocalScoringConfigSnapshot, "name" | "note" | "config">>,
): void {
  if (!id) return;
  const next = loadScoringSnapshots().map((item) => (item.id === id ? { ...item, ...patch } : item));
  saveSnapshots(next);
}

