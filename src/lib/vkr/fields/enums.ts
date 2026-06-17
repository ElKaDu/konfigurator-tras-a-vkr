// ============================================================
//  Strukturované dropdown hodnoty (value → label)
//  Sdíleny napříč poli, která mají stejné enum (např. CarrierProviders).
// ============================================================

export const CARRIER_PROVIDERS = [
  { value: "FEDEX", label: "FEDEX" },
  { value: "UPS", label: "UPS" },
  { value: "DHL", label: "DHL" },
  { value: "TNT", label: "TNT" },
  { value: "DSV", label: "DSV" },
  { value: "SCHENKER", label: "SCHENKER" },
];

export const SERVICE_CODES = [
  { value: "03", label: "UPS – Ground" },
  { value: "11", label: "UPS – Standard" },
  { value: "FEDEX_INTERNATIONAL_PRIORITY", label: "FedEx International Priority" },
  { value: "INTERNATIONAL_ECONOMY", label: "FedEx International Economy" },
  { value: "PRIORITY_OVERNIGHT", label: "FedEx Priority Overnight" },
];

/** Vrátí dropdown volby pole — preferuje enumOptions, fallback na enumValues. */
export function getEnumOptions(field?: { enumOptions?: Array<{ value: string; label: string }>; enumValues?: string[] }): Array<{ value: string; label: string }> {
  if (!field) return [];
  if (field.enumOptions && field.enumOptions.length) return field.enumOptions;
  if (field.enumValues && field.enumValues.length) return field.enumValues.map((v) => ({ value: v, label: v }));
  return [];
}

/** Najde label pro hodnotu enum pole. */
export function getEnumLabel(field: { enumOptions?: Array<{ value: string; label: string }>; enumValues?: string[] } | undefined, value: string): string {
  return getEnumOptions(field).find((o) => o.value === value)?.label ?? value;
}
