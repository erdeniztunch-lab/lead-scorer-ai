import { mockLeads, type Lead } from "@/data/mockLeads";

const LEADS_STORAGE_KEY = "lead_scorer_imported_leads_v1";
const MAPPING_STORAGE_PREFIX = "lead_scorer_mapping_templates_v1_";
const LEGACY_MAPPING_STORAGE_PREFIX = "lead_scorer_mapping_v1_";

export interface MappingTemplate<TField extends string> {
  id: string;
  name: string;
  mapping: Record<TField, string>;
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadLeadsFromStorage(): Lead[] {
  if (!isBrowser()) {
    return mockLeads;
  }

  const raw = window.localStorage.getItem(LEADS_STORAGE_KEY);
  if (!raw) {
    return mockLeads;
  }

  try {
    const parsed = JSON.parse(raw) as Lead[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return mockLeads;
    }
    return parsed;
  } catch {
    return mockLeads;
  }
}

export function hasStoredLeads(): boolean {
  if (!isBrowser()) {
    return false;
  }
  return Boolean(window.localStorage.getItem(LEADS_STORAGE_KEY));
}

export function saveLeadsToStorage(leads: Lead[]): void {
  if (!isBrowser()) {
    return;
  }
  window.localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(leads));
  window.dispatchEvent(new CustomEvent("lead-scorer:leads-updated"));
}

export function buildMappingSignature(headers: string[]): string {
  return headers.map((header) => header.trim().toLowerCase()).sort().join("|");
}

export function saveMappingTemplate<TField extends string>(
  signature: string,
  mapping: Record<TField, string>,
): void {
  saveNamedMappingTemplate(signature, "Default", mapping);
}

function templatesKey(signature: string): string {
  return `${MAPPING_STORAGE_PREFIX}${signature}`;
}

function legacyTemplateKey(signature: string): string {
  return `${LEGACY_MAPPING_STORAGE_PREFIX}${signature}`;
}

export function loadMappingTemplates<TField extends string>(signature: string): MappingTemplate<TField>[] {
  if (!isBrowser() || !signature) {
    return [];
  }

  const raw = window.localStorage.getItem(templatesKey(signature));
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as MappingTemplate<TField>[];
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      return [];
    }
  }

  const legacyRaw = window.localStorage.getItem(legacyTemplateKey(signature));
  if (!legacyRaw) {
    return [];
  }

  try {
    const legacyMapping = JSON.parse(legacyRaw) as Record<TField, string>;
    return [{ id: "default", name: "Default", mapping: legacyMapping }];
  } catch {
    return [];
  }
}

export function saveNamedMappingTemplate<TField extends string>(
  signature: string,
  name: string,
  mapping: Record<TField, string>,
): void {
  if (!isBrowser() || !signature || !name.trim()) {
    return;
  }

  const templates = loadMappingTemplates<TField>(signature);
  const normalizedName = name.trim();
  const existing = templates.find(
    (template) => template.name.trim().toLowerCase() === normalizedName.toLowerCase(),
  );

  if (existing) {
    existing.mapping = mapping;
  } else {
    templates.push({
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: normalizedName,
      mapping,
    });
  }

  window.localStorage.setItem(templatesKey(signature), JSON.stringify(templates));
}

export function loadMappingTemplate<TField extends string>(signature: string): Record<TField, string> | null {
  const templates = loadMappingTemplates<TField>(signature);
  if (templates.length === 0) {
    return null;
  }
  return templates[0].mapping;
}

export function deleteMappingTemplate<TField extends string>(signature: string, templateId: string): MappingTemplate<TField>[] {
  if (!isBrowser() || !signature || !templateId) {
    return loadMappingTemplates<TField>(signature);
  }

  const next = loadMappingTemplates<TField>(signature).filter((template) => template.id !== templateId);
  window.localStorage.setItem(templatesKey(signature), JSON.stringify(next));
  return next;
}
