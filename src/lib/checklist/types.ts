export type ChecklistCategory =
  | "obsah"
  | "zabaleni"
  | "hodnota"
  | "dokumentace"
  | "adresy"
  | "doba_doruceni"
  | "financni"
  | "celkove";

export const CHECKLIST_CATEGORY_ORDER: ChecklistCategory[] = [
  "obsah",
  "zabaleni",
  "hodnota",
  "dokumentace",
  "adresy",
  "doba_doruceni",
  "financni",
  "celkove",
];

export const CHECKLIST_CATEGORY_LABELS: Record<ChecklistCategory, string> = {
  obsah: "Obsah zásilky — přípustnost",
  zabaleni: "Obsah zásilky — vhodné zabalení",
  hodnota: "Hodnota, odpovědnost, pojištění",
  dokumentace: "Dokumentace",
  adresy: "Adresy a kontaktní údaje",
  doba_doruceni: "Doba doručení a vyzvednutí",
  financni: "Finanční hodnoty",
  celkove: "Celkové zhodnocení",
};

/** Tři stavy — nikdy se neukládá ručně, vždy se odvozuje přes deriveItemState() v derived.ts. */
export type ChecklistItemState = "open" | "waiting_contact" | "resolved";

export interface ContextField {
  label: string;
  value: string;
}

/** Šablona kontroly — konfiguruje se jednou, kopíruje se do instance na objednávce. */
export interface ChecklistItemTemplate {
  id: string;
  category: ChecklistCategory;
  order: number;
  title: string;
  description: string;
  context: ContextField[];
  /** Prázdné pole = rovnou textové pole místo dropdownu. Dropdown vždy interně přidává "Jiné…". */
  findingOptions: string[];
  resolutionOptions: string[];
}

/** Instance kontroly na konkrétní objednávce. */
export interface ChecklistItem {
  id: string;
  templateId: string;

  findingValue?: string;
  findingIsSuspicion: boolean;

  resolutionValue?: string;
  resolutionNeedsConfirm: boolean;

  manuallyResolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;

  /** Vyplněno, dokud je položka navázaná na (aktivní) kontakt. */
  kontaktId?: string;
  /** Nezávislé na stavu — položka může mít sledování i po vyřešení. */
  trackingVkrId?: string;
  /** Sdílená poznámka, viditelná i v přehledu callů. */
  noteValue?: string;
}

export type KontaktType = "customer" | "carrier";
/** "draft" = rozjednaný call bez termínu (vznikl zatržením checkboxu), "planned" = má termín. */
export type KontaktStatus = "draft" | "planned" | "done";

/** Naplánovaná domluva — jedna událost, víc navázaných položek checklistu. */
export interface Kontakt {
  id: string;
  /** Nevyplněno, dokud operátorka nezvolí — žádný výchozí typ se nepředpokládá. */
  type?: KontaktType;
  /** ISO datetime string, např. "2026-07-30T10:00:00". Prázdné, dokud je kontakt "draft". */
  scheduledAt?: string;
  note?: string;
  status: KontaktStatus;
  linkedItemIds: string[];
}

/** VkŘ vytvořená ze sledování jedné konkrétní položky. */
export interface ChecklistVkr {
  id: string;
  title: string;
  itemId: string;
  /** ISO datetime string. */
  dueAt: string;
  createdAt: string;
  resolved: boolean;
}
