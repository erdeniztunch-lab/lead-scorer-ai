import { describe, expect, it } from "vitest";
import { buildEnrichmentPreview, buildLeadEnrichmentMeta } from "@/lib/enrichment";

describe("enrichment preview", () => {
  it("creates deterministic suggestions for missing core fields", () => {
    const rows = [
      {
        Email: "alex@acme.com",
        Company: "",
        Source: "",
        LastActivity: "",
        DemoRequested: "true",
        IndustryMatch: "",
        BudgetFit: "",
        PageViews: "9",
      },
    ];

    const mapping = {
      email: "Email",
      company: "Company",
      source: "Source",
      lastActivity: "LastActivity",
      demoRequested: "DemoRequested",
      industryMatch: "IndustryMatch",
      budgetFit: "BudgetFit",
      pageViews: "PageViews",
    };

    const result = buildEnrichmentPreview(rows, mapping);
    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.suggestions.some((item) => item.field === "company")).toBe(true);
    expect(result.suggestions.some((item) => item.field === "source")).toBe(true);
    expect(result.suggestions.some((item) => item.field === "lastActivity")).toBe(true);
    expect(result.suggestions.some((item) => item.field === "budgetFit")).toBe(true);
  });

  it("builds lead enrichment meta only for accepted changed suggestions", () => {
    const row = {
      Email: "alex@acme.com",
      Company: "",
      Source: "",
    };

    const mapping = {
      email: "Email",
      company: "Company",
      source: "Source",
    };

    const suggestionById = {
      "0:company": {
        id: "0:company",
        rowIndex: 0,
        rowNumber: 2,
        field: "company",
        currentValue: "",
        suggestedValue: "Acme Labs",
        confidence: "medium",
        reason: "Company inferred from email domain.",
      },
      "0:source": {
        id: "0:source",
        rowIndex: 0,
        rowNumber: 2,
        field: "source",
        currentValue: "",
        suggestedValue: "Website",
        confidence: "high",
        reason: "Default channel for missing source.",
      },
    } as const;

    const meta = buildLeadEnrichmentMeta({
      row,
      mapping,
      rowIndex: 0,
      acceptedById: {
        "0:company": "Acme Labs",
        "0:source": "",
      },
      suggestionById,
      trackedFields: ["company", "source"],
    });

    expect(meta?.applied).toBe(true);
    expect(meta?.changeCount).toBe(1);
    expect(meta?.changes[0]).toMatchObject({
      field: "company",
      originalValue: "",
      enrichedValue: "Acme Labs",
      confidence: "medium",
    });
  });
});
