import { type CsvRow } from "./csv.js";

export type ImportIssueType =
  | "missing_required"
  | "invalid_email"
  | "duplicate_in_file"
  | "duplicate_in_db"
  | "invalid_boolean"
  | "invalid_number"
  | "unknown_source";

export interface TypedImportIssue {
  type: ImportIssueType;
  rowNumber: number;
  reason: string;
  name: string;
  company: string;
  email: string;
}

export const KNOWN_SOURCES = ["referral", "webinar", "website", "linkedin", "google ads", "cold outbound"] as const;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseBoolean(value: string): boolean | null {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (["true", "yes", "1", "y"].includes(normalized)) return true;
  if (["false", "no", "0", "n"].includes(normalized)) return false;
  return null;
}

function parseNumber(value: string): number | null {
  const parsed = Number(value.trim());
  if (Number.isNaN(parsed) || !Number.isFinite(parsed)) return null;
  return parsed;
}

function normalizeSource(rawSource: string): string {
  const normalized = rawSource.trim().toLowerCase();
  if (!normalized) return "website";
  if (KNOWN_SOURCES.includes(normalized as (typeof KNOWN_SOURCES)[number])) {
    return normalized;
  }
  return normalized;
}

function titleCaseSource(source: string): string {
  return source
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildIssue(
  type: ImportIssueType,
  rowNumber: number,
  reason: string,
  name: string,
  company: string,
  email: string,
): TypedImportIssue {
  return {
    type,
    rowNumber,
    reason,
    name,
    company,
    email,
  };
}

export interface ValidatedImportRow {
  rowNumber: number;
  row: CsvRow;
  name: string;
  company: string;
  email: string;
  normalizedSource: string;
}

export function validateImportRows(
  rows: CsvRow[],
  mapping: Record<string, string>,
): { staged: ValidatedImportRow[]; issues: TypedImportIssue[] } {
  const issues: TypedImportIssue[] = [];
  const staged: ValidatedImportRow[] = [];
  const payloadEmails = new Set<string>();

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const name = (row[mapping.name] ?? "").trim();
    const company = (row[mapping.company] ?? "").trim();
    const email = (row[mapping.email] ?? "").trim().toLowerCase();
    const rawSource = (row[mapping.source] ?? "").trim();
    const normalizedSource = normalizeSource(rawSource || "website");
    const rowIssues: TypedImportIssue[] = [];

    if (!name || !company || !email) {
      rowIssues.push(
        buildIssue("missing_required", rowNumber, "Missing required field (name/company/email)", name, company, email),
      );
    } else if (!emailRegex.test(email)) {
      rowIssues.push(buildIssue("invalid_email", rowNumber, "Invalid email format", name, company, email));
    }

    if (email && payloadEmails.has(email)) {
      rowIssues.push(buildIssue("duplicate_in_file", rowNumber, "Duplicate email in CSV payload", name, company, email));
    }

    if (email) {
      payloadEmails.add(email);
    }

    const numericFields = [mapping.emailOpens, mapping.emailClicks, mapping.pageViews].filter(Boolean);
    for (const field of numericFields) {
      const raw = (row[field] ?? "").trim();
      if (!raw) continue;
      if (parseNumber(raw) === null) {
        rowIssues.push(buildIssue("invalid_number", rowNumber, "Invalid numeric signal value", name, company, email));
        break;
      }
    }

    const booleanFields = [
      mapping.demoRequested,
      mapping.industryMatch,
      mapping.companySizeFit,
      mapping.budgetFit,
    ].filter(Boolean);
    for (const field of booleanFields) {
      const raw = (row[field] ?? "").trim();
      if (!raw) continue;
      if (parseBoolean(raw) === null) {
        rowIssues.push(buildIssue("invalid_boolean", rowNumber, "Invalid boolean signal value", name, company, email));
        break;
      }
    }

    if (rawSource && !KNOWN_SOURCES.includes(normalizedSource as (typeof KNOWN_SOURCES)[number])) {
      rowIssues.push(buildIssue("unknown_source", rowNumber, "Unknown source value", name, company, email));
    }

    if (rowIssues.length > 0) {
      issues.push(...rowIssues);
      return;
    }

    staged.push({
      rowNumber,
      row: {
        ...row,
        [mapping.source]: titleCaseSource(normalizedSource),
      },
      name,
      company,
      email,
      normalizedSource,
    });
  });

  return { staged, issues };
}

