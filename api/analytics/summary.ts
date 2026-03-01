import { json, type ApiRequest, type ApiResponse, withErrorMeta } from "../_lib/http";
import { withApiHandler } from "../_lib/handler";
import { resolveAuthContext } from "../_lib/authContext";

const handler = withApiHandler(
  {
    allowedMethods: ["GET"],
  },
  async (req: ApiRequest, res: ApiResponse, context): Promise<void> => {
    const auth = await resolveAuthContext(req, res, context.requestId);
    if (!auth) {
      return;
    }

    const { data: leads, error: leadsError } = await auth.db
      .from("leads")
      .select("score,reasons")
      .eq("account_id", auth.accountId);
    if (leadsError) {
      withErrorMeta(res, 500, "db_read_error", "Failed to load analytics leads.", { requestId: context.requestId });
      return;
    }

    const scoreDistribution = { "0-39": 0, "40-59": 0, "60-79": 0, "80-100": 0 };
    const reasonCount = new Map<string, number>();
    for (const lead of leads ?? []) {
      const score = Number(lead.score ?? 0);
      if (score < 40) scoreDistribution["0-39"] += 1;
      else if (score < 60) scoreDistribution["40-59"] += 1;
      else if (score < 80) scoreDistribution["60-79"] += 1;
      else scoreDistribution["80-100"] += 1;

      const reasons = Array.isArray(lead.reasons) ? (lead.reasons as string[]) : [];
      for (const reason of reasons) {
        reasonCount.set(reason, (reasonCount.get(reason) ?? 0) + 1);
      }
    }

    const { data: runRows, error: runError } = await auth.db
      .from("score_runs")
      .select("id,trigger_type,config_version,lead_count,average_score,started_at,completed_at")
      .eq("account_id", auth.accountId)
      .order("started_at", { ascending: false })
      .limit(1);
    if (runError) {
      withErrorMeta(res, 500, "db_read_error", "Failed to load last scoring run.", { requestId: context.requestId });
      return;
    }

    const topReasons = [...reasonCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([reason, count]) => ({ reason, count }));

    json(res, 200, {
      requestId: context.requestId,
      scoreDistribution,
      topReasons,
      lastScoringRun: runRows?.[0] ?? null,
    });
  },
);

export default handler;
