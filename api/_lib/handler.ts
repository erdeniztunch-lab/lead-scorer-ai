import { methodNotAllowed, type ApiRequest, type ApiResponse, withErrorMeta } from "./http";
import { applyApiSecurityHeaders, enforceBearerToken, enforceOrigin } from "./security";

export interface ApiHandlerContext {
  requestId: string;
}

interface HandlerOptions {
  allowedMethods: string[];
  maxBodyBytes?: number;
  requireOrigin?: boolean;
  requireInternalToken?: boolean;
}

type EndpointHandler = (
  req: ApiRequest,
  res: ApiResponse,
  context: ApiHandlerContext,
) => Promise<void> | void;

const DEFAULT_MAX_BODY_BYTES = 32 * 1024;

function createRequestId(req: ApiRequest): string {
  const header = req.headers["x-request-id"];
  const fromHeader = Array.isArray(header) ? header[0] : header;
  if (fromHeader && fromHeader.trim()) {
    return fromHeader.trim().slice(0, 100);
  }
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function getBodySizeFromHeader(req: ApiRequest): number {
  const contentLength = req.headers["content-length"];
  const value = Array.isArray(contentLength) ? contentLength[0] : contentLength;
  const parsed = Number(value ?? 0);
  if (Number.isNaN(parsed) || !Number.isFinite(parsed)) {
    return 0;
  }
  return Math.max(0, parsed);
}

export function withApiHandler(options: HandlerOptions, endpointHandler: EndpointHandler): EndpointHandler {
  return async (req, res) => {
    const requestId = createRequestId(req);
    res.setHeader("X-Request-Id", requestId);
    applyApiSecurityHeaders(res);

    try {
      if (options.requireOrigin ?? true) {
        if (!enforceOrigin(req, res, requestId)) {
          return;
        }
      }

      if (options.requireInternalToken) {
        if (!enforceBearerToken(req, res, requestId)) {
          return;
        }
      }

      const method = req.method ?? "";
      if (!options.allowedMethods.includes(method)) {
        methodNotAllowed(res, options.allowedMethods, { requestId });
        return;
      }

      const bodySize = getBodySizeFromHeader(req);
      const maxBodyBytes = options.maxBodyBytes ?? DEFAULT_MAX_BODY_BYTES;
      if (bodySize > maxBodyBytes) {
        withErrorMeta(res, 413, "payload_too_large", "Request body exceeds allowed size.", {
          requestId,
          maxBodyBytes,
        });
        return;
      }

      await endpointHandler(req, res, { requestId });
    } catch {
      withErrorMeta(res, 500, "internal_error", "Unexpected server error.", { requestId });
    }
  };
}
