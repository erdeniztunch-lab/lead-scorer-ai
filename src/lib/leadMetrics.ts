import { type Lead } from "@/data/mockLeads";

function parseHoursAgo(value: string): number | null {
  const text = value.toLowerCase();
  const match = text.match(/(\d+)\s*(hour|hours|day|days|week|weeks)/);
  if (!match) {
    return null;
  }

  const amount = Number(match[1]);
  const unit = match[2];

  if (unit.startsWith("hour")) {
    return amount;
  }
  if (unit.startsWith("day")) {
    return amount * 24;
  }
  if (unit.startsWith("week")) {
    return amount * 24 * 7;
  }
  return null;
}

export function formatHoursAverage(leads: Lead[]): string {
  const values = leads.map((lead) => parseHoursAgo(lead.lastActivity)).filter((value): value is number => value !== null);
  if (values.length === 0) {
    return "n/a";
  }

  const averageHours = values.reduce((sum, value) => sum + value, 0) / values.length;
  if (averageHours < 24) {
    return `${averageHours.toFixed(1)}h`;
  }
  return `${(averageHours / 24).toFixed(1)}d`;
}

export function formatPrecisionAt10(leads: Lead[]): string {
  if (leads.length === 0) {
    return "0%";
  }
  const topTen = [...leads].sort((a, b) => b.score - a.score).slice(0, 10);
  const strong = topTen.filter((lead) => lead.score >= 80).length;
  return `${Math.round((strong / topTen.length) * 100)}%`;
}

export function formatLift(leads: Lead[]): string {
  if (leads.length === 0) {
    return "1.0x";
  }
  const hotRate = leads.filter((lead) => lead.tier === "hot").length / leads.length;
  return `${Math.max(1, hotRate * 4).toFixed(1)}x`;
}
