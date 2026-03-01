const SESSION_KEY = "lead_scorer_session_v1";
const DEFAULT_SESSION_TTL_MS = 1000 * 60 * 60 * 12;

interface SessionPayload {
  status: "active";
  issuedAt: number;
  expiresAt: number;
  nonce: string;
}

function getStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }
  if (typeof window.sessionStorage !== "undefined") {
    return window.sessionStorage;
  }
  if (typeof window.localStorage !== "undefined") {
    return window.localStorage;
  }
  return null;
}

function readSession(): SessionPayload | null {
  const storage = getStorage();
  if (!storage) {
    return null;
  }
  const raw = storage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as SessionPayload;
    if (parsed.status !== "active" || typeof parsed.expiresAt !== "number" || typeof parsed.issuedAt !== "number") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function randomNonce(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function isAuthenticated(): boolean {
  const storage = getStorage();
  if (!storage) {
    return false;
  }
  const session = readSession();
  if (!session) {
    storage.removeItem(SESSION_KEY);
    return false;
  }
  if (Date.now() > session.expiresAt) {
    storage.removeItem(SESSION_KEY);
    return false;
  }
  return true;
}

export function login(): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  const issuedAt = Date.now();
  const payload: SessionPayload = {
    status: "active",
    issuedAt,
    expiresAt: issuedAt + DEFAULT_SESSION_TTL_MS,
    nonce: randomNonce(),
  };
  storage.setItem(SESSION_KEY, JSON.stringify(payload));
}

export function logout(): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  storage.removeItem(SESSION_KEY);
}
