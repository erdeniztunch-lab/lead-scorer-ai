import { type ChangeEvent, useState } from "react";
import { type Lead } from "@/data/mockLeads";
import { inferFieldMapping, parseCsv, type CsvRow } from "@/lib/csv";
import {
  buildMappingSignature,
  deleteMappingTemplate,
  loadMappingTemplate,
  loadMappingTemplates,
  saveMappingTemplate,
  saveNamedMappingTemplate,
  type MappingTemplate,
} from "@/lib/leadStore";

export interface LeadFieldDefinition {
  key: string;
  label: string;
  required: boolean;
}

export interface ImportIssue {
  type?: string;
  rowNumber: number;
  reason: string;
  name: string;
  company: string;
  email: string;
}

interface UseLeadImportOptions<TField extends string> {
  leadFields: readonly { key: TField; label: string; required: boolean }[];
  buildLeadFromRow: (row: CsvRow, mapping: Record<TField, string>, id: number) => Lead | null;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function createEmptyMapping<TField extends string>(
  leadFields: readonly { key: TField; label: string; required: boolean }[],
): Record<TField, string> {
  return leadFields.reduce(
    (result, field) => {
      result[field.key] = "";
      return result;
    },
    {} as Record<TField, string>,
  );
}

export function useLeadImport<TField extends string>({
  leadFields,
  buildLeadFromRow,
}: UseLeadImportOptions<TField>) {
  const [uploadError, setUploadError] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const [csvContent, setCsvContent] = useState("");
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [mappingSignature, setMappingSignature] = useState("");
  const [mapping, setMapping] = useState<Record<TField, string>>(() => createEmptyMapping(leadFields));
  const [templateName, setTemplateName] = useState("Default");
  const [templates, setTemplates] = useState<MappingTemplate<TField>[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [importIssues, setImportIssues] = useState<ImportIssue[]>([]);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const requiredFieldsReady = leadFields
    .filter((field) => field.required)
    .every((field) => mapping[field.key] && mapping[field.key].length > 0);
  const selectedColumns = Object.values(mapping).filter(Boolean);
  const hasDuplicateColumnMapping = new Set(selectedColumns).size !== selectedColumns.length;

  const resetMapping = () => {
    setMapping(createEmptyMapping(leadFields));
    setSelectedTemplateId("");
    setTemplateName("Default");
    setUploadError("");
  };

  const handleTemplateSelect = (value: string) => {
    if (value === "none") {
      return;
    }
    const selected = templates.find((template) => template.id === value);
    if (!selected) {
      return;
    }
    setSelectedTemplateId(selected.id);
    setTemplateName(selected.name);
    setMapping(selected.mapping);
    setUploadError("");
    setUploadStatus(`Applied mapping template: ${selected.name}`);
  };

  const handleSaveTemplate = () => {
    if (!mappingSignature) {
      setUploadError("Upload a CSV first to save a mapping template.");
      return;
    }
    if (!templateName.trim()) {
      setUploadError("Template name cannot be empty.");
      return;
    }

    saveNamedMappingTemplate(mappingSignature, templateName.trim(), mapping);
    const next = loadMappingTemplates<TField>(mappingSignature);
    setTemplates(next);
    const selected = next.find((template) => template.name.toLowerCase() === templateName.trim().toLowerCase());
    setSelectedTemplateId(selected?.id ?? "");
    setUploadStatus(`Template "${templateName.trim()}" saved.`);
  };

  const handleDeleteTemplate = () => {
    if (!mappingSignature || !selectedTemplateId) {
      return;
    }
    const next = deleteMappingTemplate<TField>(mappingSignature, selectedTemplateId);
    setTemplates(next);
    setSelectedTemplateId("");
    setUploadStatus("Selected mapping template deleted.");
  };

  const handleCsvFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadError("");
    setUploadStatus("");
    setImportIssues([]);
    setIsParsingFile(true);

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setUploadError("Please upload a .csv file.");
      setIsParsingFile(false);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("CSV file is too large. Maximum size is 5MB.");
      setIsParsingFile(false);
      return;
    }

    try {
      const content = await file.text();
      const parsedRows = parseCsv(content);
      if (parsedRows.length === 0) {
        setUploadError("CSV could not be parsed or has no data rows.");
        setCsvContent("");
        setCsvRows([]);
        setCsvHeaders([]);
        setMappingSignature("");
        setTemplates([]);
        resetMapping();
        return;
      }

      const headers = Object.keys(parsedRows[0]);
      const signature = buildMappingSignature(headers);
      const inferred = inferFieldMapping(headers, leadFields.map((field) => field.key));
      const savedTemplate = loadMappingTemplate<TField>(signature);
      const nextTemplates = loadMappingTemplates<TField>(signature);

      setCsvContent(content);
      setCsvRows(parsedRows);
      setCsvHeaders(headers);
      setMappingSignature(signature);
      setMapping({ ...inferred, ...(savedTemplate ?? {}) });
      setTemplates(nextTemplates);
      setSelectedTemplateId(nextTemplates[0]?.id ?? "");
      setTemplateName(nextTemplates[0]?.name ?? "Default");
      setUploadStatus(`${file.name} uploaded. ${parsedRows.length} rows detected.`);
    } catch {
      setUploadError("CSV file could not be read.");
      setCsvContent("");
      setCsvRows([]);
      setCsvHeaders([]);
      setMappingSignature("");
      setTemplates([]);
      resetMapping();
    } finally {
      setIsParsingFile(false);
    }
  };

  const importRows = async (): Promise<{ leads: Lead[]; issues: ImportIssue[] }> => {
    if (csvRows.length === 0) {
      setUploadError("Select a CSV file before importing.");
      return { leads: [], issues: [] };
    }
    if (!requiredFieldsReady) {
      setUploadError("Complete all required field mappings.");
      return { leads: [], issues: [] };
    }
    if (hasDuplicateColumnMapping) {
      setUploadError("Each mapped field must use a different CSV column.");
      return { leads: [], issues: [] };
    }

    setUploadError("");
    setUploadStatus("");
    setIsImporting(true);

    try {
      const issues: ImportIssue[] = [];
      const imported = csvRows
        .map((row, index) => {
          const rowNumber = index + 2;
          const name = (row[(mapping as Record<string, string>).name] ?? "").trim();
          const company = (row[(mapping as Record<string, string>).company] ?? "").trim();
          const email = (row[(mapping as Record<string, string>).email] ?? "").trim();
          if (!name || !company || !email) {
            issues.push({ rowNumber, reason: "Missing required field (name/company/email)", name, company, email });
            return null;
          }
          if (!emailRegex.test(email)) {
            issues.push({ rowNumber, reason: "Invalid email format", name, company, email });
            return null;
          }
          return buildLeadFromRow(row, mapping, index + 1);
        })
        .filter((lead): lead is Lead => lead !== null);

      if (imported.length === 0) {
        setImportIssues(issues);
        setUploadError("No valid rows were imported. Download the issue report and fix your CSV.");
        return { leads: [], issues };
      }

      setImportIssues(issues);
      saveMappingTemplate(mappingSignature, mapping);
      setUploadStatus(
        `${imported.length} lead(s) imported.${issues.length > 0 ? ` Skipped ${issues.length} row(s).` : ""}`,
      );

      return { leads: imported, issues };
    } finally {
      setIsImporting(false);
    }
  };

  return {
    uploadError,
    uploadStatus,
    csvRows,
    csvContent,
    csvHeaders,
    mapping,
    templateName,
    templates,
    selectedTemplateId,
    importIssues,
    isParsingFile,
    isImporting,
    requiredFieldsReady,
    hasDuplicateColumnMapping,
    setMapping,
    setTemplateName,
    resetMapping,
    handleTemplateSelect,
    handleSaveTemplate,
    handleDeleteTemplate,
    handleCsvFile,
    importRows,
    setImportIssues,
    setUploadError,
    setUploadStatus,
  };
}
