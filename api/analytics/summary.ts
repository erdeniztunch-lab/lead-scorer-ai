import { json, type ApiRequest, type ApiResponse, withErrorMeta } from "../_lib/http.js";
import { withApiHandler } from "../_lib/handler.js";
import { resolveAuthContext } from "../_lib/authContext.js";

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
      .select("score,tier,reasons,score_breakdown")
      .eq("account_id", auth.accountId);
    if (leadsError) {
      withErrorMeta(res, 500, "db_read_error", "Failed to load analytics leads.", { requestId: context.requestId });
      return;
    }

    const scoreDistribution = { "0-39": 0, "40-59": 0, "60-79": 0, "80-100": 0 };
    const reasonCount = new Map<string, number>();
    const signalCount = new Map<string, { label: string; count: number; totalContribution: number }>();
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

      const breakdown = Array.isArray(lead.score_breakdown)
        ? (lead.score_breakdown as Array<{ key?: string; label?: string; value?: number }>)
        : [];
      for (const item of breakdown) {
        const key = String(item.key ?? "");
        if (!key) continue;
        const label = String(item.label ?? key);
        const existing = signalCount.get(key) ?? { label, count: 0, totalContribution: 0 };
        existing.count += 1;
        existing.totalContribution += Number(item.value ?? 0);
        signalCount.set(key, existing);
      }
    }

    const { data: runRows, error: runError } = await auth.db
      .from("score_runs")
      .select("id,trigger_type,config_version,lead_count,average_score,tier_counts,started_at,completed_at")
      .eq("account_id", auth.accountId)
      .order("started_at", { ascending: false })
      .limit(7);
    if (runError) {
      withErrorMeta(res, 500, "db_read_error", "Failed to load last scoring run.", { requestId: context.requestId });
      return;
    }

    const topReasons = [...reasonCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([reason, count]) => ({ reason, count }));

    const topSignals = [...signalCount.entries()]
      .map(([key, value]) => ({
        key,
        label: value.label,
        count: value.count,
        avgContribution: Number((value.totalContribution / Math.max(1, value.count)).toFixed(2)),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const tierTrend = (runRows ?? [])
      .slice()
      .reverse()
      .map((run) => {
        const tierCounts =
          run.tier_counts && typeof run.tier_counts === "object"
            ? (run.tier_counts as { hot?: number; warm?: number; cold?: number })
            : {};
        return {
          runId: run.id,
          startedAt: run.started_at,
          avgScore: Number(run.average_score ?? 0),
          leadCount: Number(run.lead_count ?? 0),
          hot: Number(tierCounts.hot ?? 0),
          warm: Number(tierCounts.warm ?? 0),
          cold: Number(tierCounts.cold ?? 0),
        };
      });

    let configImpact: {
      fromRunId: string | null;
      toRunId: string | null;
      avgScoreDelta: number;
      hotDelta: number;
      warmDelta: number;
      coldDelta: number;
      leadCountDelta: number;
    } | null = null;
    if ((runRows ?? []).length >= 2) {
      const latest = runRows![0];
      const previous = runRows![1];
      const latestTiers = (latest.tier_counts as { hot?: number; warm?: number; cold?: number } | null) ?? {};
      const previousTiers = (previous.tier_counts as { hot?: number; warm?: number; cold?: number } | null) ?? {};
      configImpact = {
        fromRunId: String(previous.id),
        toRunId: String(latest.id),
        avgScoreDelta: Number((Number(latest.average_score ?? 0) - Number(previous.average_score ?? 0)).toFixed(2)),
        hotDelta: Number(latestTiers.hot ?? 0) - Number(previousTiers.hot ?? 0),
        warmDelta: Number(latestTiers.warm ?? 0) - Number(previousTiers.warm ?? 0),
        coldDelta: Number(latestTiers.cold ?? 0) - Number(previousTiers.cold ?? 0),
        leadCountDelta: Number(latest.lead_count ?? 0) - Number(previous.lead_count ?? 0),
      };
    }

    json(res, 200, {
      requestId: context.requestId,
      scoreDistribution,
      topReasons,
      topSignals,
      tierTrend,
      configImpact,
      lastScoringRun: runRows?.[0] ?? null,
    });
  },
);

export default handler;

