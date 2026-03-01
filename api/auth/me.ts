import { json, type ApiRequest, type ApiResponse } from "../_lib/http";
import { withApiHandler } from "../_lib/handler";
import { loadRuntimeEnv } from "../_lib/env";
import { readBearerToken } from "../_lib/security";
import { verifySupabaseAccessToken } from "../_lib/supabaseAuth";

const handler = withApiHandler(
  {
    allowedMethods: ["GET"],
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

    json(res, 200, {
      ok: true,
      user,
      requestId: context.requestId,
      checkedAt: new Date().toISOString(),
    });
  },
);

export default handler;
