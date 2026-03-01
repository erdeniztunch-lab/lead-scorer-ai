import { error, json, methodNotAllowed, type ApiRequest, type ApiResponse } from "./_lib/http";
import { applyApiSecurityHeaders, enforceOrigin } from "./_lib/security";

export default function handler(req: ApiRequest, res: ApiResponse): void {
  applyApiSecurityHeaders(res);

  if (!enforceOrigin(req, res)) {
    return;
  }

  if (req.method !== "GET") {
    methodNotAllowed(res, ["GET"]);
    return;
  }

  try {
    json(res, 200, {
      ok: true,
      service: "leadspark-api",
      now: new Date().toISOString(),
      environment: process.env.NODE_ENV ?? "development",
    });
  } catch {
    error(res, 500, "internal_error", "Unexpected server error.");
  }
}
