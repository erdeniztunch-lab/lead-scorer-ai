const GUEST_SESSION_KEY = "leadscorer_guest_session_v1";

export function loginAsGuest(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(GUEST_SESSION_KEY, "1");
}

export function isGuestSession(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(GUEST_SESSION_KEY) === "1";
}

export async function logout(): Promise<void> {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(GUEST_SESSION_KEY);
  }
}

export async function isAuthenticated(): Promise<boolean> {
  return isGuestSession();
}
