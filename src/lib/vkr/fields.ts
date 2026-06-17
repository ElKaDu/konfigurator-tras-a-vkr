// Barrel — re-exports z modulárních souborů ve `fields/`.
// Tento soubor cíleně neobsahuje data; podívej se do `fields/catalog.*.ts`.

import type { FieldDef } from "./types";
import { SHIPMENT_FIELDS } from "./fields/catalog.shipment";
import { TRACKING_FIELDS } from "./fields/catalog.tracking";

export * from "./fields/enums";
export * from "./fields/operators";
export * from "./fields/schedule";

/** Kompletní katalog polí (zásilka + tracking §5). */
export const FIELDS: FieldDef[] = [...SHIPMENT_FIELDS, ...TRACKING_FIELDS];

export { SHIPMENT_FIELDS, TRACKING_FIELDS };

export const SYSTEM_ANCHORS: Array<{ key: "shipment_created" | "shipment_updated" | "order_created"; label: string }> = [
  { key: "shipment_created", label: "Vytvoření zásilky" },
  { key: "shipment_updated", label: "Poslední aktualizace zásilky" },
  { key: "order_created", label: "Vytvoření objednávky" },
];

export const fieldById = (id?: string) => FIELDS.find((f) => f.id === id);

export const FIELD_CATEGORIES = Array.from(new Set(FIELDS.map((f) => f.category)));

export const TRIGGER_LABELS: Record<string, string> = {
  schedule: "Časovač",
  condition_met: "Vždy když je splněna podmínka",
  manual: "Manuálně",
};

export const ACTION_LABELS: Record<string, string> = {
  create_vkr: "Vytvořit VkŘ",
  send_email: "Odeslat e-mail",
  set_field: "Změnit hodnotu pole",
  change_phase: "Změnit fázi zásilky",
  update_vkr: "Upravit existující VkŘ",
  add_note: "Přidat poznámku",
  request_field_from_operator: "Požádat operátora o vyplnění pole",
};

/** Sourozenecká číselná pole pro porovnání */
export const numericFields = () => FIELDS.filter((f) => f.type === "number");
/** Datetime pole (včetně systémových kotev) — pro relativní porovnání */
export const datetimeFields = () => FIELDS.filter((f) => f.type === "datetime");
/** Textová pole — pro porovnání text vs. text */
export const textFields = () => FIELDS.filter((f) => f.type === "text");
