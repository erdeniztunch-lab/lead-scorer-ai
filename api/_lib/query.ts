import { type ApiRequest } from "./http";

export function getQueryValue(req: ApiRequest, key: string): string {
  const value = req.query?.[key];
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

export function getQueryNumber(req: ApiRequest, key: string, fallback: number): number {
  const raw = getQueryValue(req, key);
  const parsed = Number(raw);
  if (Number.isNaN(parsed) || !Number.isFinite(parsed)) {
    return fallback;
  }
  return parsed;
}
