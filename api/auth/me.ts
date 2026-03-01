import { json, type ApiRequest, type ApiResponse } from "../_lib/http.js";
import { withApiHandler } from "../_lib/handler.js";
import { loadCoreRuntimeEnv } from "../_lib/env.js";
import { readBearerToken } from "../_lib/security.js";
import { verifySupabaseAccessToken } from "../_lib/supabaseAuth.js";

const handler = withApiHandler(
  {
    allowedMethods: ["GET"],
  },
  async (req: ApiRequest, res: ApiResponse, context): Promise<void> => {
    const env = loadCoreRuntimeEnv(res, context.requestId);
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

    json(res, 200, {
      ok: true,
      user,
      requestId: context.requestId,
      checkedAt: new Date().toISOString(),
    });
  },
);

export default handler;

