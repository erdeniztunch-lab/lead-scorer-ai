import { type ApiResponse } from "./http.js";
import { withErrorMeta } from "./http.js";

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
    requestId?: string;
  },
): Promise<VerifiedUser | null> {
  if (!params.accessToken) {
    withErrorMeta(res, 401, "unauthorized", "Missing access token.", {
      ...(params.requestId ? { requestId: params.requestId } : {}),
    });
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
    withErrorMeta(res, 401, "unauthorized", "Invalid or expired Supabase token.", {
      ...(params.requestId ? { requestId: params.requestId } : {}),
    });
    return null;
  }

  const body = (await response.json()) as SupabaseUserResponse;
  if (!body.id || !body.email) {
    withErrorMeta(res, 401, "unauthorized", "Supabase user payload is invalid.", {
      ...(params.requestId ? { requestId: params.requestId } : {}),
    });
    return null;
  }

  return {
    id: body.id,
    email: body.email,
  };
}

