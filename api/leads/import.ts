import { json, readJsonBody, type ApiRequest, type ApiResponse, withErrorMeta } from "../_lib/http.js";
import { withApiHandler } from "../_lib/handler.js";
import { parseCsv } from "../_lib/csv.js";
import { scoreFromImport } from "../_lib/importScoring.js";
import { resolveAuthContext } from "../_lib/authContext.js";
import { type ImportIssueType, type TypedImportIssue, validateImportRows } from "../_lib/importValidation.js";

type Tier = "hot" | "warm" | "cold";

interface ImportBody {
  csvContent?: string;
  mapping?: Record<string, string>;
}

interface StagedImportRow {
  rowNumber: number;
  scored: ReturnType<typeof scoreFromImport>;
}

const requiredMappingKeys = ["name", "company", "email", "source"] as const;

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
    const issues: TypedImportIssue[] = [];
    const staged: StagedImportRow[] = [];
    const validated = validateImportRows(rows, mapping);
    issues.push(...validated.issues);
    validated.staged.forEach((item) => {
      staged.push({ rowNumber: item.rowNumber, scored: scoreFromImport(item.row, mapping) });
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
      .in("email", emailList)
      .eq("account_id", accountId);

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
          type: "duplicate_in_db",
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
      reasons: item.scored.topReasons,
      top_reasons: item.scored.topReasons,
      last_activity: item.scored.lastActivity,
      ai_explanation: item.scored.aiExplanation,
      score_breakdown: item.scored.scoreBreakdown,
      scored_at: item.scored.scoredAt,
      score_version: item.scored.scoreVersion,
    }));

    const { data: insertedRows, error: insertError } = await db
      .from("leads")
      .insert(leadsInsert)
      .select("id,name,company,email,source,score,tier,reasons,top_reasons,last_activity,ai_explanation,score_breakdown,scored_at,score_version");

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
    const tierCounts = inserted.reduce(
      (acc, row) => {
        const tier = String(row.tier ?? "cold");
        if (tier === "hot") acc.hot += 1;
        else if (tier === "warm") acc.warm += 1;
        else acc.cold += 1;
        return acc;
      },
      { hot: 0, warm: 0, cold: 0 },
    );

    const { error: scoreRunError } = await db.from("score_runs").insert({
      account_id: accountId,
      trigger_type: "import",
      config_version: "v1.0.0",
      lead_count: inserted.length,
      average_score: averageScore,
      tier_counts: tierCounts,
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
        reasons: Array.isArray(row.top_reasons) ? (row.top_reasons as string[]) : Array.isArray(row.reasons) ? (row.reasons as string[]) : [],
        topReasons: Array.isArray(row.top_reasons) ? (row.top_reasons as string[]) : [],
        lastActivity: String(row.last_activity ?? "Imported recently"),
        aiExplanation: String(row.ai_explanation ?? ""),
        scoreBreakdown: Array.isArray(row.score_breakdown)
          ? (row.score_breakdown as Array<{ key: string; label: string; value: number }>)
          : [],
        scoredAt: String(row.scored_at ?? new Date().toISOString()),
        scoreVersion: String(row.score_version ?? "v1.0.0"),
      }))
      .sort((a, b) => b.score - a.score)
      .map((lead, index) => ({
        ...lead,
        rank: index + 1,
      }));

    json(res, 200, {
      requestId: context.requestId,
      importedCount: sortedLeads.length,
      skippedCount: issues.length,
      issuesByType: issues.reduce<Record<ImportIssueType, number>>(
        (acc, issue) => {
          acc[issue.type] += 1;
          return acc;
        },
        {
          missing_required: 0,
          invalid_email: 0,
          duplicate_in_file: 0,
          duplicate_in_db: 0,
          invalid_boolean: 0,
          invalid_number: 0,
          unknown_source: 0,
        },
      ),
      issues,
      leads: sortedLeads,
    });
  },
);

export default handler;

