import { json, type ApiRequest, type ApiResponse, withErrorMeta } from "../_lib/http";
import { withApiHandler } from "../_lib/handler";
import { resolveAuthContext } from "../_lib/authContext";
import { getQueryNumber, getQueryValue } from "../_lib/query";

const allowedSortFields = new Set(["score", "created_at", "name", "company", "source", "last_activity"]);

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
    const pageSize = Math.max(1, Math.min(100, getQueryNumber(req, "pageSize", 25)));
    const search = getQueryValue(req, "search").trim();
    const source = getQueryValue(req, "source").trim();
    const tier = getQueryValue(req, "tier").trim();
    const minScore = Math.max(0, Math.min(100, getQueryNumber(req, "minScore", 0)));
    const sortByRaw = getQueryValue(req, "sortBy").trim() || "score";
    const sortBy = allowedSortFields.has(sortByRaw) ? sortByRaw : "score";
    const sortDirRaw = getQueryValue(req, "sortDir").trim().toLowerCase();
    const ascending = sortDirRaw === "asc";

    let query = auth.db
      .from("leads")
      .select("id,name,company,email,source,score,tier,reasons,last_activity,ai_explanation,scored_at,score_version,created_at", { count: "exact" })
      .eq("account_id", auth.accountId)
      .gte("score", minScore);

    if (search) {
      query = query.or(`name.ilike.%${search}%,company.ilike.%${search}%`);
    }
    if (source && source !== "all") {
      query = query.eq("source", source);
    }
    if (tier && tier !== "all") {
      query = query.eq("tier", tier);
    }

    query = query.order(sortBy, { ascending }).range((page - 1) * pageSize, page * pageSize - 1);

    const { data, count, error } = await query;
    if (error) {
      withErrorMeta(res, 500, "db_read_error", "Failed to query leads.", { requestId: context.requestId });
      return;
    }

    const items = (data ?? []).map((row, index) => ({
      id: index + 1,
      rank: (page - 1) * pageSize + index + 1,
      name: String(row.name ?? ""),
      company: String(row.company ?? ""),
      email: String(row.email ?? ""),
      source: String(row.source ?? ""),
      score: Number(row.score ?? 0),
      tier: row.tier ?? "cold",
      reasons: Array.isArray(row.reasons) ? (row.reasons as string[]) : [],
      lastActivity: String(row.last_activity ?? "Imported recently"),
      aiExplanation: String(row.ai_explanation ?? ""),
      scoredAt: String(row.scored_at ?? ""),
      scoreVersion: String(row.score_version ?? ""),
      scoreBreakdown: [] as Array<{ key: string; label: string; value: number }>,
    }));

    const total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    json(res, 200, {
      requestId: context.requestId,
      items,
      page,
      pageSize,
      total,
      totalPages,
    });
  },
);

export default handler;
