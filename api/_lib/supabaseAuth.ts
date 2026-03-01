import { type ApiResponse } from "./http";
import { error } from "./http";

interface SupabaseUserResponse {
  id?: string;
  email?: string;
}

export interface VerifiedUser {
  id: string;
  email: string;
}

export async function verifySupabaseAccessToken(
  res: ApiResponse,
  params: {
    supabaseUrl: string;
    supabaseAnonKey: string;
    accessToken: string;
  },
): Promise<VerifiedUser | null> {
  if (!params.accessToken) {
    error(res, 401, "unauthorized", "Missing access token.");
    return null;
  }

  const url = `${params.supabaseUrl.replace(/\/+$/, "")}/auth/v1/user`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      apikey: params.supabaseAnonKey,
      Authorization: `Bearer ${params.accessToken}`,
    },
  });

  if (!response.ok) {
    error(res, 401, "unauthorized", "Invalid or expired Supabase token.");
    return null;
  }

  const body = (await response.json()) as SupabaseUserResponse;
  if (!body.id || !body.email) {
    error(res, 401, "unauthorized", "Supabase user payload is invalid.");
    return null;
  }

  return {
    id: body.id,
    email: body.email,
  };
}
