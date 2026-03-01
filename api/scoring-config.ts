import { json, readJsonBody, type ApiRequest, type ApiResponse, withErrorMeta } from "./_lib/http.js";
import { withApiHandler } from "./_lib/handler.js";
import { resolveAuthContext } from "./_lib/authContext.js";
import { DEFAULT_SCORING_CONFIG, mergeScoringConfig, validateScoringConfig, type ScoringConfig } from "./_lib/scoringConfig.js";

const handler = withApiHandler(
  {
    allowedMethods: ["GET", "PUT"],
    maxBodyBytes: 64 * 1024,
  },
  async (req: ApiRequest, res: ApiResponse, context): Promise<void> => {
    const auth = await resolveAuthContext(req, res, context.requestId);
    if (!auth) {
      return;
    }

    if (req.method === "GET") {
      const { data, error } = await auth.db
        .from("scoring_configs")
        .select("version,config_json")
        .eq("account_id", auth.accountId)
        .limit(1);
      if (error) {
        withErrorMeta(res, 500, "db_read_error", "Failed to load scoring config.", { requestId: context.requestId });
        return;
      }
      const row = data?.[0];
      const config = row ? mergeScoringConfig(row.config_json as Partial<ScoringConfig>) : DEFAULT_SCORING_CONFIG;
      json(res, 200, {
        requestId: context.requestId,
        config,
      });
      return;
    }

    const body = readJsonBody<{ config?: Partial<ScoringConfig> }>(req);
    if (!body?.config) {
      withErrorMeta(res, 400, "invalid_request", "config is required", { requestId: context.requestId });
      return;
    }

    const config = mergeScoringConfig(body.config);
    const validationError = validateScoringConfig(config);
    if (validationError) {
      withErrorMeta(res, 400, "invalid_config", validationError, { requestId: context.requestId });
      return;
    }

    const { error } = await auth.db.from("scoring_configs").upsert(
      {
        account_id: auth.accountId,
        version: config.version,
        config_json: config,
        updated_by: auth.userId,
      },
      { onConflict: "account_id" },
    );

    if (error) {
      withErrorMeta(res, 500, "db_write_error", "Failed to persist scoring config.", { requestId: context.requestId });
      return;
    }

    json(res, 200, {
      requestId: context.requestId,
      config,
      saved: true,
    });
  },
);

export default handler;

