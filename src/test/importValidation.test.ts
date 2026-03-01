import { describe, expect, it } from "vitest";
import { validateImportRows } from "../../api/_lib/importValidation";

const mapping = {
  name: "Name",
  company: "Company",
  email: "Email",
  source: "Source",
  emailOpens: "Opens",
  emailClicks: "Clicks",
  pageViews: "Views",
  demoRequested: "Demo",
  industryMatch: "Industry",
  companySizeFit: "Size",
  budgetFit: "Budget",
};

describe("import validation", () => {
  it("flags invalid email and unknown source", () => {
    const rows = [
      {
        Name: "A",
        Company: "B",
        Email: "invalid-email",
        Source: "Unknown Channel",
      },
    ];
    const result = validateImportRows(rows, mapping);
    expect(result.staged.length).toBe(0);
    expect(result.issues.some((issue) => issue.type === "invalid_email")).toBe(true);
    expect(result.issues.some((issue) => issue.type === "unknown_source")).toBe(true);
  });

  it("flags invalid boolean and number signals", () => {
    const rows = [
      {
        Name: "A",
        Company: "B",
        Email: "a@b.com",
        Source: "Website",
        Opens: "abc",
        Demo: "not-bool",
      },
    ];
    const result = validateImportRows(rows, mapping);
    expect(result.staged.length).toBe(0);
    expect(result.issues.some((issue) => issue.type === "invalid_number")).toBe(true);
    expect(result.issues.some((issue) => issue.type === "invalid_boolean")).toBe(true);
  });
});
