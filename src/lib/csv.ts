export type CsvRow = Record<string, string>;

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values.map((value) => value.replace(/^"|"$/g, ""));
}

export function parseCsv(content: string): CsvRow[] {
  const lines = content
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  const headers = parseCsvLine(lines[0]);
  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const values = parseCsvLine(lines[i]);
    const row: CsvRow = {};

    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });

    rows.push(row);
  }

  return rows;
}

const aliases: Record<string, string[]> = {
  name: ["name", "full_name", "lead_name", "contact_name"],
  company: ["company", "company_name", "account", "organization"],
  email: ["email", "email_address", "work_email"],
  source: ["source", "lead_source", "channel", "acquisition_source"],
  score: ["score", "lead_score", "engagement_score"],
  reasons: ["reasons", "reason", "reason_codes", "top_reasons"],
  lastActivity: ["last_activity", "lastactivity", "activity", "last_touch"],
  aiExplanation: ["ai_explanation", "explanation", "score_explanation", "why"],
};

function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, "_");
}

export function inferFieldMapping<TField extends string>(
  headers: string[],
  fields: readonly TField[],
): Record<TField, string> {
  const headerByNormalized = new Map<string, string>();
  headers.forEach((header) => {
    headerByNormalized.set(normalizeHeader(header), header);
  });

  return fields.reduce(
    (result, field) => {
      const candidates = aliases[field] ?? [field];
      const matched = candidates.find((candidate) => headerByNormalized.has(candidate));
      result[field] = matched ? (headerByNormalized.get(matched) ?? "") : "";
      return result;
    },
    {} as Record<TField, string>,
  );
}
