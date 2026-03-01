import { type AuthChangeEvent, type Session, type Subscription } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

const GUEST_SESSION_KEY = "leadscorer_guest_session_v1";

export function loginAsGuest(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(GUEST_SESSION_KEY, "1");
}

export function isGuestSession(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(GUEST_SESSION_KEY) === "1";
}

export async function login(email: string, password: string): Promise<{ error: string | null }> {
  if (!supabase) {
    return { error: "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY." };
  }
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error: error?.message ?? null };
}

export async function register(
  email: string,
  password: string,
): Promise<{ error: string | null; requiresEmailConfirmation: boolean }> {
  if (!supabase) {
    return {
      error: "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
      requiresEmailConfirmation: false,
    };
  }

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    return { error: error.message, requiresEmailConfirmation: false };
  }

  return {
    error: null,
    requiresEmailConfirmation: !data.session,
  };
}

export async function logout(): Promise<void> {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(GUEST_SESSION_KEY);
  }
  if (!supabase) {
    return;
  }
  await supabase.auth.signOut();
}

export async function getSession(): Promise<Session | null> {
  if (!supabase) {
    return null;
  }
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    return null;
  }
  return data.session ?? null;
}

export async function isAuthenticated(): Promise<boolean> {
  if (isGuestSession()) {
    return true;
  }
  const session = await getSession();
  return Boolean(session?.access_token);
}

export async function getAccessToken(): Promise<string | null> {
  const session = await getSession();
  return session?.access_token ?? null;
}

export async function ensureUserBootstrap(accountName?: string): Promise<{ ok: boolean; error: string | null }> {
  const token = await getAccessToken();
  if (!token) {
    return { ok: false, error: "No active session." };
  }

  const response = await fetch("/api/auth/bootstrap", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      accountName: accountName?.trim() || null,
    }),
  });

  if (response.ok) {
    return { ok: true, error: null };
  }

  let message = "Failed to initialize account.";
  try {
    const payload = (await response.json()) as { message?: string };
    if (payload?.message) {
      message = payload.message;
    }
  } catch {
    // Keep default message.
  }

  return { ok: false, error: message };
}

export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void,
): Pick<Subscription, "unsubscribe"> {
  if (!supabase) {
    return { unsubscribe: () => undefined };
  }
  const { data } = supabase.auth.onAuthStateChange(callback);
  return data.subscription;
}
