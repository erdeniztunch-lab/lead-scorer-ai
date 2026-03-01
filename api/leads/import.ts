import { json, readJsonBody, type ApiRequest, type ApiResponse, withErrorMeta } from "../_lib/http";
import { withApiHandler } from "../_lib/handler";
import { parseCsv } from "../_lib/csv";
import { scoreFromImport } from "../_lib/importScoring";
import { resolveAuthContext } from "../_lib/authContext";

type Tier = "hot" | "warm" | "cold";

interface ImportBody {
  csvContent?: string;
  mapping?: Record<string, string>;
}

interface ImportIssue {
  rowNumber: number;
  reason: string;
  name: string;
  company: string;
  email: string;
}

interface StagedImportRow {
  rowNumber: number;
  scored: ReturnType<typeof scoreFromImport>;
}

const requiredMappingKeys = ["name", "company", "email", "source"] as const;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateInput(body: ImportBody | null): string | null {
  if (!body || !body.csvContent || !body.mapping) {
    return "csvContent and mapping are required.";
  }
  if (body.csvContent.length > 5 * 1024 * 1024) {
    return "CSV content exceeds 5MB limit.";
  }
  for (const key of requiredMappingKeys) {
    if (!body.mapping[key]) {
      return `Mapping for '${key}' is required.`;
    }
  }
  return null;
}

const handler = withApiHandler(
  {
    allowedMethods: ["POST"],
    maxBodyBytes: 6 * 1024 * 1024,
  },
  async (req: ApiRequest, res: ApiResponse, context): Promise<void> => {
    const auth = await resolveAuthContext(req, res, context.requestId);
    if (!auth) {
      return;
    }

    const body = readJsonBody<ImportBody>(req);
    const inputError = validateInput(body);
    if (inputError) {
      withErrorMeta(res, 400, "invalid_request", inputError, { requestId: context.requestId });
      return;
    }

    const mapping = body!.mapping!;
    const rows = parseCsv(body!.csvContent!);
    if (rows.length === 0) {
      withErrorMeta(res, 400, "invalid_csv", "CSV has no data rows.", { requestId: context.requestId });
      return;
    }

    const { db, accountId, userId } = auth;
    const issues: ImportIssue[] = [];
    const staged: StagedImportRow[] = [];
    const payloadEmails = new Set<string>();

    rows.forEach((row, index) => {
      const rowNumber = index + 2;
      const name = (row[mapping.name] ?? "").trim();
      const company = (row[mapping.company] ?? "").trim();
      const email = (row[mapping.email] ?? "").trim().toLowerCase();

      if (!name || !company || !email) {
        issues.push({ rowNumber, reason: "Missing required field (name/company/email)", name, company, email });
        return;
      }
      if (!emailRegex.test(email)) {
        issues.push({ rowNumber, reason: "Invalid email format", name, company, email });
        return;
      }
      if (payloadEmails.has(email)) {
        issues.push({ rowNumber, reason: "Duplicate email in CSV payload", name, company, email });
        return;
      }
      payloadEmails.add(email);
      staged.push({ rowNumber, scored: scoreFromImport(row, mapping) });
    });

    if (staged.length === 0) {
      withErrorMeta(res, 400, "no_valid_rows", "No valid rows to import.", {
        requestId: context.requestId,
        issues,
      });
      return;
    }

    const emailList = staged.map((item) => item.scored.email);
    const { data: existingLeads, error: existingError } = await db
      .from("leads")
      .select("email")
      .in("email", emailList);

    if (existingError) {
      withErrorMeta(res, 500, "db_read_error", "Failed to check existing leads.", {
        requestId: context.requestId,
      });
      return;
    }

    const existingEmails = new Set((existingLeads ?? []).map((row) => String(row.email).toLowerCase()));
    const importable = staged.filter((item) => !existingEmails.has(item.scored.email));

    staged
      .filter((item) => existingEmails.has(item.scored.email))
      .forEach((item) => {
        issues.push({
          rowNumber: item.rowNumber,
          reason: "Duplicate email already exists",
          name: item.scored.name,
          company: item.scored.company,
          email: item.scored.email,
        });
      });

    if (importable.length === 0) {
      withErrorMeta(res, 409, "all_duplicates", "All rows already exist.", {
        requestId: context.requestId,
        issues,
      });
      return;
    }

    const leadsInsert = importable.map((item) => ({
      account_id: accountId,
      name: item.scored.name,
      company: item.scored.company,
      email: item.scored.email,
      source: item.scored.source,
      score: item.scored.score,
      tier: item.scored.tier,
      reasons: item.scored.reasons,
      last_activity: item.scored.lastActivity,
      ai_explanation: item.scored.aiExplanation,
      scored_at: item.scored.scoredAt,
      score_version: item.scored.scoreVersion,
    }));

    const { data: insertedRows, error: insertError } = await db
      .from("leads")
      .insert(leadsInsert)
      .select("id,name,company,email,source,score,tier,reasons,last_activity,ai_explanation,scored_at,score_version");

    if (insertError) {
      withErrorMeta(res, 500, "db_insert_error", "Failed to insert leads.", {
        requestId: context.requestId,
      });
      return;
    }

    const inserted = insertedRows ?? [];
    const insertedLeadIds = inserted.map((row) => row.id as string);

    if (insertedLeadIds.length > 0) {
      const leadEventsPayload = insertedLeadIds.map((leadId) => ({
        account_id: accountId,
        lead_id: leadId,
        event_type: "imported",
        event_payload: { requestId: context.requestId },
        created_by: userId,
      }));
      const { error: leadEventsError } = await db.from("lead_events").insert(leadEventsPayload);
      if (leadEventsError) {
        withErrorMeta(res, 500, "db_insert_error", "Failed to insert lead events.", {
          requestId: context.requestId,
        });
        return;
      }
    }

    const averageScore =
      inserted.length > 0
        ? Number((inserted.reduce((sum, row) => sum + Number(row.score ?? 0), 0) / inserted.length).toFixed(2))
        : 0;

    const { error: scoreRunError } = await db.from("score_runs").insert({
      account_id: accountId,
      trigger_type: "import",
      config_version: "v1.0.0",
      lead_count: inserted.length,
      average_score: averageScore,
      completed_at: new Date().toISOString(),
    });
    if (scoreRunError) {
      withErrorMeta(res, 500, "db_insert_error", "Failed to insert score run.", {
        requestId: context.requestId,
      });
      return;
    }

    const sortedLeads = inserted
      .map((row) => ({
        id: row.id as string,
        name: String(row.name),
        company: String(row.company),
        email: String(row.email),
        source: String(row.source),
        score: Number(row.score),
        tier: row.tier as Tier,
        reasons: Array.isArray(row.reasons) ? (row.reasons as string[]) : [],
        lastActivity: String(row.last_activity ?? "Imported recently"),
        aiExplanation: String(row.ai_explanation ?? ""),
        scoredAt: String(row.scored_at ?? new Date().toISOString()),
        scoreVersion: String(row.score_version ?? "v1.0.0"),
      }))
      .sort((a, b) => b.score - a.score)
      .map((lead, index) => ({
        ...lead,
        rank: index + 1,
        scoreBreakdown: [],
      }));

    json(res, 200, {
      requestId: context.requestId,
      importedCount: sortedLeads.length,
      skippedCount: issues.length,
      issues,
      leads: sortedLeads,
    });
  },
);

export default handler;
