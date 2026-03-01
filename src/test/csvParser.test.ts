import { describe, expect, it } from "vitest";
import { parseCsv } from "@/lib/csv";

describe("csv parser", () => {
  it("parses rows with quoted values", () => {
    const rows = parseCsv("name,company,email\n\"Jane Doe\",\"Acme, Inc\",jane@acme.com");
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe("Jane Doe");
    expect(rows[0].company).toBe("Acme, Inc");
  });

  it("returns empty for missing data rows", () => {
    const rows = parseCsv("name,email");
    expect(rows).toHaveLength(0);
  });
});
