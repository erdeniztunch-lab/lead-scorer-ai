import { json, type ApiRequest, type ApiResponse, withErrorMeta } from "../_lib/http";
import { withApiHandler } from "../_lib/handler";
import { resolveAuthContext } from "../_lib/authContext";
import { DEFAULT_SCORING_CONFIG, mergeScoringConfig, type ScoringConfig } from "../_lib/scoringConfig";
import { scoreLeadWithConfig } from "../_lib/scoringRuntime";

const handler = withApiHandler(
  {
    allowedMethods: ["POST"],
  },
  async (req: ApiRequest, res: ApiResponse, context): Promise<void> => {
    const auth = await resolveAuthContext(req, res, context.requestId);
    if (!auth) {
      return;
    }

    const { data: configRows, error: configError } = await auth.db
      .from("scoring_configs")
      .select("version,config_json")
      .eq("account_id", auth.accountId)
      .limit(1);
    if (configError) {
      withErrorMeta(res, 500, "db_read_error", "Failed to load scoring config.", { requestId: context.requestId });
      return;
    }
    const current = configRows?.[0];
    const config = current ? mergeScoringConfig(current.config_json as Partial<ScoringConfig>) : DEFAULT_SCORING_CONFIG;

    const { data: leads, error: leadsError } = await auth.db
      .from("leads")
      .select("id,name,company,source,last_activity")
      .eq("account_id", auth.accountId);
    if (leadsError) {
      withErrorMeta(res, 500, "db_read_error", "Failed to load leads for rescore.", { requestId: context.requestId });
      return;
    }

    const now = new Date().toISOString();
    let totalScore = 0;

    for (const lead of leads ?? []) {
      const scored = scoreLeadWithConfig({
        name: String(lead.name ?? ""),
        company: String(lead.company ?? ""),
        source: String(lead.source ?? ""),
        lastActivity: String(lead.last_activity ?? "Imported recently"),
      }, config);
      totalScore += scored.score;

      const { error: updateError } = await auth.db
        .from("leads")
        .update({
          score: scored.score,
          tier: scored.tier,
          reasons: scored.reasons,
          ai_explanation: scored.aiExplanation,
          scored_at: now,
          score_version: config.version,
        })
        .eq("id", lead.id)
        .eq("account_id", auth.accountId);

      if (updateError) {
        withErrorMeta(res, 500, "db_write_error", "Failed to update rescored leads.", { requestId: context.requestId });
        return;
      }
    }

    const leadCount = (leads ?? []).length;
    const averageScore = leadCount > 0 ? Number((totalScore / leadCount).toFixed(2)) : 0;

    const { error: runError } = await auth.db.from("score_runs").insert({
      account_id: auth.accountId,
      trigger_type: "settings_save",
      config_version: config.version,
      lead_count: leadCount,
      average_score: averageScore,
      completed_at: now,
    });

    if (runError) {
      withErrorMeta(res, 500, "db_write_error", "Failed to insert score run.", { requestId: context.requestId });
      return;
    }

    json(res, 200, {
      requestId: context.requestId,
      rescoredCount: leadCount,
      averageScore,
      configVersion: config.version,
    });
  },
);

export default handler;
