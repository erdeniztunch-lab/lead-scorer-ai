import { json, type ApiRequest, type ApiResponse, withErrorMeta } from "../_lib/http";
import { withApiHandler } from "../_lib/handler";
import { resolveAuthContext } from "../_lib/authContext";
import { getQueryValue } from "../_lib/query";

const handler = withApiHandler(
  {
    allowedMethods: ["GET"],
  },
  async (req: ApiRequest, res: ApiResponse, context): Promise<void> => {
    const auth = await resolveAuthContext(req, res, context.requestId);
    if (!auth) return;

    const requestedRunId = getQueryValue(req, "runId").trim();

    const { data: runs, error } = await auth.db
      .from("score_runs")
      .select("id,average_score,lead_count,tier_counts,started_at")
      .eq("account_id", auth.accountId)
      .order("started_at", { ascending: false })
      .limit(20);
    if (error) {
      withErrorMeta(res, 500, "db_read_error", "Failed to load score runs.", { requestId: context.requestId });
      return;
    }

    const allRuns = runs ?? [];
    if (allRuns.length < 2) {
      json(res, 200, {
        requestId: context.requestId,
        impact: null,
      });
      return;
    }

    let targetIndex = 0;
    if (requestedRunId) {
      const found = allRuns.findIndex((run) => String(run.id) === requestedRunId);
      if (found > 0) {
        targetIndex = found;
      }
    }

    const current = allRuns[targetIndex];
    const previous = allRuns[targetIndex + 1];
    if (!current || !previous) {
      json(res, 200, {
        requestId: context.requestId,
        impact: null,
      });
      return;
    }

    const currentTiers = (current.tier_counts as { hot?: number; warm?: number; cold?: number } | null) ?? {};
    const previousTiers = (previous.tier_counts as { hot?: number; warm?: number; cold?: number } | null) ?? {};

    json(res, 200, {
      requestId: context.requestId,
      impact: {
        fromRunId: String(previous.id),
        toRunId: String(current.id),
        fromStartedAt: String(previous.started_at),
        toStartedAt: String(current.started_at),
        avgScoreDelta: Number((Number(current.average_score ?? 0) - Number(previous.average_score ?? 0)).toFixed(2)),
        leadCountDelta: Number(current.lead_count ?? 0) - Number(previous.lead_count ?? 0),
        hotDelta: Number(currentTiers.hot ?? 0) - Number(previousTiers.hot ?? 0),
        warmDelta: Number(currentTiers.warm ?? 0) - Number(previousTiers.warm ?? 0),
        coldDelta: Number(currentTiers.cold ?? 0) - Number(previousTiers.cold ?? 0),
      },
    });
  },
);

export default handler;
