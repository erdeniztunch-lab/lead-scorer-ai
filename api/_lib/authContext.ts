import { type ApiRequest, type ApiResponse, withErrorMeta } from "./http.js";
import { loadCoreRuntimeEnv } from "./env.js";
import { readBearerToken } from "./security.js";
import { verifySupabaseAccessToken } from "./supabaseAuth.js";
import { createSupabaseClientForUser } from "./supabaseDb.js";

export interface AuthContext {
  accountId: string;
  userId: string;
  userEmail: string;
  db: ReturnType<typeof createSupabaseClientForUser>;
}

export async function resolveAuthContext(
  req: ApiRequest,
  res: ApiResponse,
  requestId: string,
): Promise<AuthContext | null> {
  const env = loadCoreRuntimeEnv(res, requestId);
  if (!env) {
    return null;
  }

  const accessToken = readBearerToken(req);
  const user = await verifySupabaseAccessToken(res, {
    supabaseUrl: env.supabaseUrl,
    supabaseAnonKey: env.supabaseAnonKey,
    accessToken,
    requestId,
  });
  if (!user) {
    return null;
  }

  const db = createSupabaseClientForUser({
    supabaseUrl: env.supabaseUrl,
    supabaseAnonKey: env.supabaseAnonKey,
    accessToken,
  });

  const { data: userRows, error: userError } = await db
    .from("users")
    .select("account_id")
    .eq("id", user.id)
    .limit(1);

  if (userError || !userRows || userRows.length === 0) {
    withErrorMeta(res, 403, "account_not_found", "User account mapping not found.", { requestId });
    return null;
  }

  return {
    accountId: String(userRows[0].account_id),
    userId: user.id,
    userEmail: user.email,
    db,
  };
}

