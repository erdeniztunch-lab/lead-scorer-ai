export type ApiRequest = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
  query?: Record<string, string | string[] | undefined>;
};

export type ApiResponse = {
  status: (code: number) => ApiResponse;
  setHeader: (name: string, value: string) => void;
  json: (body: unknown) => void;
};

export function json(res: ApiResponse, statusCode: number, body: unknown): void {
  res.status(statusCode);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.json(body);
}

export function methodNotAllowed(
  res: ApiResponse,
  allowed: string[],
  meta?: Record<string, unknown>,
): void {
  res.setHeader("Allow", allowed.join(", "));
  json(res, 405, { error: "method_not_allowed", allowed, ...(meta ?? {}) });
}

export function error(res: ApiResponse, statusCode: number, code: string, message: string): void {
  json(res, statusCode, {
    error: code,
    message,
    timestamp: new Date().toISOString(),
  });
}

export function withErrorMeta(
  res: ApiResponse,
  statusCode: number,
  code: string,
  message: string,
  meta?: Record<string, unknown>,
): void {
  json(res, statusCode, {
    error: code,
    message,
    timestamp: new Date().toISOString(),
    ...(meta ?? {}),
  });
}

export function readJsonBody<T>(req: ApiRequest): T | null {
  if (req.body && typeof req.body === "object") {
    return req.body as T;
  }
  return null;
}
