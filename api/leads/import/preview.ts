import { readJsonBody, json, type ApiRequest, type ApiResponse, withErrorMeta } from "../../_lib/http";
import { withApiHandler } from "../../_lib/handler";
import { parseCsv } from "../../_lib/csv";
import { resolveAuthContext } from "../../_lib/authContext";
import { type ImportIssueType, validateImportRows } from "../../_lib/importValidation";

interface PreviewBody {
  csvContent?: string;
  mapping?: Record<string, string>;
}

const requiredMappingKeys = ["name", "company", "email", "source"] as const;

function validateInput(body: PreviewBody | null): string | null {
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

    const body = readJsonBody<PreviewBody>(req);
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

    const validated = validateImportRows(rows, mapping);
    const emails = validated.staged.map((item) => item.email);
    const issues = [...validated.issues];

    if (emails.length > 0) {
      const { data: existingLeads, error } = await auth.db
        .from("leads")
        .select("email")
        .in("email", emails)
        .eq("account_id", auth.accountId);
      if (error) {
        withErrorMeta(res, 500, "db_read_error", "Failed to check existing leads.", { requestId: context.requestId });
        return;
      }
      const existingSet = new Set((existingLeads ?? []).map((row) => String(row.email).toLowerCase()));
      for (const row of validated.staged) {
        if (existingSet.has(row.email)) {
          issues.push({
            type: "duplicate_in_db",
            rowNumber: row.rowNumber,
            reason: "Duplicate email already exists",
            name: row.name,
            company: row.company,
            email: row.email,
          });
        }
      }
    }

    const issueCounts = issues.reduce<Record<ImportIssueType, number>>(
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
    );

    const duplicateCount = issueCounts.duplicate_in_file + issueCounts.duplicate_in_db;
    const invalidRows = new Set(issues.map((issue) => issue.rowNumber));
    const invalidCount = invalidRows.size;
    const validCount = Math.max(0, rows.length - invalidCount);

    json(res, 200, {
      requestId: context.requestId,
      rowCount: rows.length,
      validCount,
      invalidCount,
      duplicateCount,
      issuesByType: issueCounts,
      sampleIssues: issues.slice(0, 20),
    });
  },
);

export default handler;
