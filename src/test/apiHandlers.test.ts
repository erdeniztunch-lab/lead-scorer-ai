import { describe, expect, it, vi } from "vitest";
import healthHandler from "../../api/health";
import importHandler from "../../api/leads/import";

function createMockRes() {
  let statusCode = 200;
  let payload: unknown = null;
  const headers = new Map<string, string>();
  return {
    status(code: number) {
      statusCode = code;
      return this;
    },
    setHeader(name: string, value: string) {
      headers.set(name.toLowerCase(), value);
    },
    json(body: unknown) {
      payload = body;
    },
    getStatus() {
      return statusCode;
    },
    getPayload() {
      return payload as Record<string, unknown>;
    },
    getHeaders() {
      return headers;
    },
  };
}

describe("api handlers", () => {
  it("health returns 200 on GET", async () => {
    const req = { method: "GET", headers: {} };
    const res = createMockRes();
    await healthHandler(req, res);
    expect(res.getStatus()).toBe(200);
    expect(res.getPayload().ok).toBe(true);
    expect(res.getHeaders().get("x-request-id")).toBeTruthy();
  });

  it("import rejects unsupported method", async () => {
    const req = { method: "GET", headers: {} };
    const res = createMockRes();
    await importHandler(req, res);
    expect(res.getStatus()).toBe(405);
  });

  it("health rejects disallowed origin", async () => {
    vi.stubEnv("ALLOWED_ORIGIN", "https://app.example.com");
    const req = { method: "GET", headers: { origin: "https://evil.example.com" } };
    const res = createMockRes();
    await healthHandler(req, res);
    expect(res.getStatus()).toBe(403);
    vi.unstubAllEnvs();
  });
});
