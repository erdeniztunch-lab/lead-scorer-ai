import { type ApiRequest, type ApiResponse, withErrorMeta } from "./http";
import { timingSafeEqual } from "node:crypto";

function getHeader(req: ApiRequest, key: string): string {
  const value = req.headers[key.toLowerCase()];
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

export function readBearerToken(req: ApiRequest): string {
  const auth = getHeader(req, "authorization");
  return auth.startsWith("Bearer ") ? auth.slice("Bearer ".length).trim() : "";
}

export function applyApiSecurityHeaders(res: ApiResponse): void {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-DNS-Prefetch-Control", "off");
  res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
  res.setHeader("Cache-Control", "no-store");
}

function safeEqualSecrets(left: string, right: string): boolean {
  const a = Buffer.from(left, "utf8");
  const b = Buffer.from(right, "utf8");
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}

export function enforceOrigin(
  req: ApiRequest,
  res: ApiResponse,
  requestId?: string,
): boolean {
  const origin = getHeader(req, "origin");
  if (!origin) {
    return true;
  }

  const allowedRaw = process.env.ALLOWED_ORIGIN?.trim();
  if (!allowedRaw) {
    return true;
  }

  const allowedList = allowedRaw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (allowedList.length > 0 && !allowedList.includes(origin)) {
    withErrorMeta(res, 403, "forbidden_origin", "Request origin is not allowed.", {
      ...(requestId ? { requestId } : {}),
    });
    return false;
  }

  return true;
}

export function enforceBearerToken(
  req: ApiRequest,
  res: ApiResponse,
  requestId?: string,
): boolean {
  const expected = process.env.INTERNAL_API_TOKEN?.trim();
  if (!expected) {
    return true;
  }

  const token = readBearerToken(req);

  if (!token || !safeEqualSecrets(token, expected)) {
    withErrorMeta(res, 401, "unauthorized", "Missing or invalid bearer token.", {
      ...(requestId ? { requestId } : {}),
    });
    return false;
  }

  return true;
}
