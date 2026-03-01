import { json, readJsonBody, type ApiRequest, type ApiResponse, withErrorMeta } from "../_lib/http";
import { withApiHandler } from "../_lib/handler";
import { loadRuntimeEnv } from "../_lib/env";
import { readBearerToken } from "../_lib/security";
import { verifySupabaseAccessToken } from "../_lib/supabaseAuth";
import { createSupabaseClientForUser } from "../_lib/supabaseDb";

type BootstrapBody = {
  accountName?: string | null;
};

const handler = withApiHandler(
  {
    allowedMethods: ["POST"],
    maxBodyBytes: 8 * 1024,
  },
  async (req: ApiRequest, res: ApiResponse, context): Promise<void> => {
    const env = loadRuntimeEnv(res, context.requestId);
    if (!env) {
      return;
    }

    const accessToken = readBearerToken(req);
    const user = await verifySupabaseAccessToken(res, {
      supabaseUrl: env.supabaseUrl,
      supabaseAnonKey: env.supabaseAnonKey,
      accessToken,
      requestId: context.requestId,
    });
    if (!user) {
      return;
    }

    const body = readJsonBody<BootstrapBody>(req);
    const rawAccountName = typeof body?.accountName === "string" ? body.accountName.trim() : "";
    const fallbackName = user.email?.split("@")[0] || "LeadScorer Workspace";
    const accountName = (rawAccountName || fallbackName).slice(0, 120);

    const db = createSupabaseClientForUser({
      supabaseUrl: env.supabaseUrl,
      supabaseAnonKey: env.supabaseAnonKey,
      accessToken,
    });

    const { data, error } = await db.rpc("bootstrap_current_user", {
      p_account_name: accountName,
    });

    if (error) {
      withErrorMeta(res, 500, "bootstrap_failed", "Failed to initialize workspace mapping.", {
        requestId: context.requestId,
      });
      return;
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row || !row.account_id || !row.user_id) {
      withErrorMeta(res, 500, "bootstrap_failed", "Workspace bootstrap returned invalid payload.", {
        requestId: context.requestId,
      });
      return;
    }

    json(res, 200, {
      ok: true,
      requestId: context.requestId,
      accountId: row.account_id,
      userId: row.user_id,
      created: Boolean(row.created),
    });
  },
);

export default handler;
