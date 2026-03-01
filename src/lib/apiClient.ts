import { getAccessToken } from "@/lib/session";

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  const headers = new Headers(init.headers ?? {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(path, {
    ...init,
    headers,
  });
}
