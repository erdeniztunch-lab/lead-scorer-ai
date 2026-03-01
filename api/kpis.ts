import { json, type ApiRequest, type ApiResponse, withErrorMeta } from "./_lib/http.js";
import { withApiHandler } from "./_lib/handler.js";
import { resolveAuthContext } from "./_lib/authContext.js";

function parseHoursAgo(value: string): number | null {
  const text = value.toLowerCase();
  const match = text.match(/(\d+)\s*(hour|hours|day|days|week|weeks)/);
  if (!match) return null;
  const amount = Number(match[1]);
  const unit = match[2];
  if (unit.startsWith("hour")) return amount;
  if (unit.startsWith("day")) return amount * 24;
  if (unit.startsWith("week")) return amount * 24 * 7;
  return null;
}

const handler = withApiHandler(
  {
    allowedMethods: ["GET"],
  },
  async (req: ApiRequest, res: ApiResponse, context): Promise<void> => {
    const auth = await resolveAuthContext(req, res, context.requestId);
    if (!auth) {
      return;
    }

    const { data, error } = await auth.db
      .from("leads")
      .select("score,tier,last_activity")
      .eq("account_id", auth.accountId);

    if (error) {
      withErrorMeta(res, 500, "db_read_error", "Failed to load KPI inputs.", { requestId: context.requestId });
      return;
    }

    const leads = data ?? [];
    const totalLeads = leads.length;
    const hotCount = leads.filter((lead) => lead.tier === "hot").length;
    const warmCount = leads.filter((lead) => lead.tier === "warm").length;
    const coldCount = leads.filter((lead) => lead.tier === "cold").length;

    const topTen = [...leads]
      .sort((a, b) => Number(b.score ?? 0) - Number(a.score ?? 0))
      .slice(0, 10);
    const precisionAt10 =
      topTen.length > 0 ? Math.round((topTen.filter((lead) => Number(lead.score ?? 0) >= 80).length / topTen.length) * 100) : 0;

    const hourValues = leads
      .map((lead) => parseHoursAgo(String(lead.last_activity ?? "")))
      .filter((value): value is number => value !== null);
    const avgFirstContactHours =
      hourValues.length > 0 ? Number((hourValues.reduce((sum, value) => sum + value, 0) / hourValues.length).toFixed(2)) : 0;

    const hotRate = totalLeads > 0 ? hotCount / totalLeads : 0;
    const lift = Number(Math.max(1, hotRate * 4).toFixed(2));

    json(res, 200, {
      requestId: context.requestId,
      totalLeads,
      avgFirstContactHours,
      precisionAt10,
      lift,
      tierCounts: {
        hot: hotCount,
        warm: warmCount,
        cold: coldCount,
      },
    });
  },
);

export default handler;

