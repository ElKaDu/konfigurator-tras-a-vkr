export type ChecklistCategory = "obsah" | "hodnota" | "dokumentace";

export const CHECKLIST_CATEGORY_ORDER: ChecklistCategory[] = ["obsah", "hodnota", "dokumentace"];

export const CHECKLIST_CATEGORY_LABELS: Record<ChecklistCategory, string> = {
  obsah: "Obsah zásilky — přípustnost",
  hodnota: "Hodnota, odpovědnost, pojištění",
  dokumentace: "Dokumentace",
};

/** Pět stavů položky checklistu — viz docs/superpowers/specs (checklist krok2 analýza). */
export type ChecklistItemState =
  | "open"
  | "resolved_ok"
  | "resolved_found"
  | "waiting_contact"
  | "waiting_delivery";

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
  /** Nabízené možnosti řešení (rychlé volby v resolution formuláři, doplnitelné volným textem). */
  resolutionOptions: string[];
}

/** Instance kontroly na konkrétní objednávce. */
export interface ChecklistItem {
  id: string;
  templateId: string;
  state: ChecklistItemState;
  finding?: string;
  resolution?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  /** Vyplněno, když state === "waiting_contact". */
  kontaktId?: string;
  /** Vyplněno, když state === "waiting_delivery" a operátor založil VkŘ pro sledování. */
  vkrId?: string;
}

export type KontaktType = "customer" | "carrier";
export type KontaktStatus = "planned" | "done";

/** Naplánovaná domluva — jedna událost, víc navázaných položek checklistu. */
export interface Kontakt {
  id: string;
  type: KontaktType;
  /** ISO datetime string, např. "2026-07-30T10:00:00". */
  scheduledAt: string;
  note?: string;
  status: KontaktStatus;
  linkedItemIds: string[];
}

/** VkŘ vytvořená ze sledování jedné konkrétní položky (stav waiting_delivery). */
export interface ChecklistVkr {
  id: string;
  title: string;
  itemId: string;
  /** ISO datetime string. */
  dueAt: string;
  createdAt: string;
  resolved: boolean;
}
