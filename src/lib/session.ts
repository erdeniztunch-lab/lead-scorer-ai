import { type AuthChangeEvent, type Session, type Subscription } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

export async function login(email: string, password: string): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error: error?.message ?? null };
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    return null;
  }
  return data.session ?? null;
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return Boolean(session?.access_token);
}

export async function getAccessToken(): Promise<string | null> {
  const session = await getSession();
  return session?.access_token ?? null;
}

export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void,
): Subscription {
  const { data } = supabase.auth.onAuthStateChange(callback);
  return data.subscription;
}
