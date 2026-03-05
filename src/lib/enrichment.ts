import { type CsvRow } from "@/lib/csv";
import { type LeadEnrichmentMeta } from "@/data/mockLeads";

export type EnrichmentConfidence = "low" | "medium" | "high";

export type EnrichmentField =
  | "company"
  | "source"
  | "lastActivity"
  | "industryMatch"
  | "budgetFit"
  | "demoRequested";

export interface EnrichmentSuggestion {
  id: string;
  rowIndex: number;
  rowNumber: number;
  field: EnrichmentField;
  currentValue: string;
  suggestedValue: string;
  confidence: EnrichmentConfidence;
  reason: string;
}

export interface EnrichmentPreviewResult {
  suggestions: EnrichmentSuggestion[];
  byConfidence: Record<EnrichmentConfidence, number>;
}

export interface BuildLeadEnrichmentMetaOptions {
  row: CsvRow;
  mapping: Record<string, string>;
  rowIndex: number;
  acceptedById: Record<string, string>;
  suggestionById: Record<string, EnrichmentSuggestion>;
  trackedFields: string[];
}

function titleCase(input: string): string {
  if (!input) return input;
  return input.charAt(0).toUpperCase() + input.slice(1).toLowerCase();
}

function getMappedValue(row: CsvRow, mapping: Record<string, string>, field: string): string {
  const column = mapping[field];
  if (!column) return "";
  return (row[column] ?? "").trim();
}

function addSuggestion(
  suggestions: EnrichmentSuggestion[],
  rowIndex: number,
  field: EnrichmentField,
  currentValue: string,
  suggestedValue: string,
  confidence: EnrichmentConfidence,
  reason: string,
) {
  suggestions.push({
    id: `${rowIndex}:${field}`,
    rowIndex,
    rowNumber: rowIndex + 2,
    field,
    currentValue,
    suggestedValue,
    confidence,
    reason,
  });
}

export function buildEnrichmentPreview(rows: CsvRow[], mapping: Record<string, string>): EnrichmentPreviewResult {
  const suggestions: EnrichmentSuggestion[] = [];

  rows.forEach((row, rowIndex) => {
    const email = getMappedValue(row, mapping, "email").toLowerCase();
    const company = getMappedValue(row, mapping, "company");
    const source = getMappedValue(row, mapping, "source");
    const lastActivity = getMappedValue(row, mapping, "lastActivity");
    const demoRequested = getMappedValue(row, mapping, "demoRequested").toLowerCase();
    const industryMatch = getMappedValue(row, mapping, "industryMatch");
    const budgetFit = getMappedValue(row, mapping, "budgetFit");
    const pageViews = Number(getMappedValue(row, mapping, "pageViews"));

    if (!company && email.includes("@")) {
      const domain = email.split("@")[1]?.split(".")[0] ?? "";
      if (domain) {
        addSuggestion(
          suggestions,
          rowIndex,
          "company",
          company,
          `${titleCase(domain)} Labs`,
          "medium",
          "Company inferred from email domain.",
        );
      }
    }

    if (!source) {
      addSuggestion(suggestions, rowIndex, "source", source, "Website", "high", "Default channel for missing source.");
    }

    if (!lastActivity) {
      addSuggestion(
        suggestions,
        rowIndex,
        "lastActivity",
        lastActivity,
        "7 days ago",
        "low",
        "Fallback recency used when no activity timestamp exists.",
      );
    }

    if (!industryMatch && ["referral", "webinar"].includes(source.toLowerCase())) {
      addSuggestion(
        suggestions,
        rowIndex,
        "industryMatch",
        industryMatch,
        "true",
        "medium",
        "Referral/webinar leads tend to align with ICP.",
      );
    }

    if (!budgetFit && ["true", "yes", "1"].includes(demoRequested)) {
      addSuggestion(
        suggestions,
        rowIndex,
        "budgetFit",
        budgetFit,
        "true",
        "medium",
        "Demo request is a proxy for budget intent.",
      );
    }

    if (!demoRequested && Number.isFinite(pageViews) && pageViews >= 8) {
      addSuggestion(
        suggestions,
        rowIndex,
        "demoRequested",
        demoRequested,
        "true",
        "low",
        "High page-view activity may indicate demo intent.",
      );
    }
  });

  return {
    suggestions,
    byConfidence: suggestions.reduce(
      (acc, item) => {
        acc[item.confidence] += 1;
        return acc;
      },
      { low: 0, medium: 0, high: 0 } satisfies Record<EnrichmentConfidence, number>,
    ),
  };
}

export function buildLeadEnrichmentMeta({
  row,
  mapping,
  rowIndex,
  acceptedById,
  suggestionById,
  trackedFields,
}: BuildLeadEnrichmentMetaOptions): LeadEnrichmentMeta | undefined {
  const changes = trackedFields.flatMap((field) => {
    const suggestionId = `${rowIndex}:${field}`;
    const acceptedValue = acceptedById[suggestionId];
    if (acceptedValue === undefined) {
      return [];
    }

    const suggestion = suggestionById[suggestionId];
    const mappedColumn = mapping[field];
    const originalValue = mappedColumn ? (row[mappedColumn] ?? "").trim() : "";
    const enrichedValue = acceptedValue.trim();
    if (originalValue === enrichedValue) {
      return [];
    }

    return [
      {
        field,
        originalValue,
        enrichedValue,
        confidence: suggestion?.confidence ?? "low",
        reason: suggestion?.reason ?? "Accepted enrichment suggestion.",
      },
    ];
  });

  if (!changes.length) {
    return undefined;
  }

  return {
    applied: true,
    changeCount: changes.length,
    changes,
  };
}
