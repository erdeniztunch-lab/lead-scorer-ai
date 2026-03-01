import { json, type ApiRequest, type ApiResponse, withErrorMeta } from "../_lib/http";
import { withApiHandler } from "../_lib/handler";
import { resolveAuthContext } from "../_lib/authContext";
import { getQueryNumber } from "../_lib/query";

const handler = withApiHandler(
  {
    allowedMethods: ["GET"],
  },
  async (req: ApiRequest, res: ApiResponse, context): Promise<void> => {
    const auth = await resolveAuthContext(req, res, context.requestId);
    if (!auth) {
      return;
    }

    const page = Math.max(1, getQueryNumber(req, "page", 1));
    const pageSize = Math.max(1, Math.min(100, getQueryNumber(req, "pageSize", 10)));

    const { data, error, count } = await auth.db
      .from("score_runs")
      .select("id,trigger_type,config_version,lead_count,average_score,started_at,completed_at", { count: "exact" })
      .eq("account_id", auth.accountId)
      .order("started_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (error) {
      withErrorMeta(res, 500, "db_read_error", "Failed to load scoring runs.", { requestId: context.requestId });
      return;
    }

    const total = count ?? 0;
    json(res, 200, {
      requestId: context.requestId,
      items: data ?? [],
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  },
);

export default handler;
