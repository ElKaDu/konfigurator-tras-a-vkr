/**
 * Katalog „pozorovaných hodnot" — value + label + počet výskytů.
 * Reálně by ho aplikace plnila parsováním příchozích trackingů od UPS/FedEx.
 * Pro prototyp je naplněn ručně. Operátor v editoru checkpointu dostane autocomplete
 * + možnost zadat volný text.
 */

export interface ObservedValue {
  value: string;
  label?: string;
  count: number;
}

export const STATUS_CODES: ObservedValue[] = [
  { value: "PU", label: "Skenování při vyzvednutí", count: 24 },
  { value: "AR", label: "Dorazil/a do zařízení", count: 102 },
];

export const MILESTONE_CODES: ObservedValue[] = [];
export const MILESTONE_STATES: ObservedValue[] = [];

export const EXCEPTION_CODES: ObservedValue[] = [
  { value: "OQ", label: "Pozdrženo — clo/daň", count: 4 },
];

export const LOCATION_CITIES: ObservedValue[] = [
  { value: "Praha", count: 14 },
  { value: "Tuchomerice", count: 24 },
];

export const LOCATION_COUNTRIES: ObservedValue[] = [
  { value: "Czech Republic", count: 60 },
];

export const LOCATION_COUNTRY_CODES: ObservedValue[] = [
  { value: "CZ", count: 60 },
  { value: "DE", count: 14 },
];

export const LOCATION_POSTAL_CODES: ObservedValue[] = [
  { value: "25267", label: "Tuchoměřice", count: 24 },
];

export const LOCATION_PROVINCE_CODES: ObservedValue[] = [
  { value: "CZ-PR", label: "Praha", count: 18 },
];

export const LOCATION_SLICS: ObservedValue[] = [
  { value: "5822", label: "Tuchomerice (CZ) — hub", count: 24 },
];

export const LOCATION_IDS: ObservedValue[] = [
  { value: "CZPRA", label: "Praha facility", count: 14 },
];

export const SERVICE_DESCRIPTIONS: ObservedValue[] = [
  { value: "559", label: "UPS Standard®", count: 18 },
];

/** Typ lokace (rozšíření katalogu — pro `CheckpointMatch.locationType`). */
export const LOCATION_TYPES: ObservedValue[] = [
  { value: "FedEx Facility", label: "FedEx Facility (fyzická lokace)", count: 60 },
  { value: "Destination Facility", label: "Destination Facility (poslední hub před doručením)", count: 40 },
];

/** Status / statusType — orientační hodnoty. */
export const STATUSES: ObservedValue[] = [
  { value: "IN_TRANSIT", label: "V přepravě", count: 110 },
  { value: "DELIVERED", label: "Doručeno", count: 90 },
];

export const STATUS_TYPES: ObservedValue[] = [
  { value: "OK", label: "OK / běžný update", count: 200 },
];

export const ANCILLARY_ACTIONS: ObservedValue[] = [
  { value: "RESCHEDULE", label: "Přeplánováno doručení", count: 5 },
];

export const ANCILLARY_REASONS: ObservedValue[] = [
  { value: "CUSTOMER_REQUEST", label: "Žádost zákazníka", count: 4 },
];

export type ObservedField =
  | "statusCode" | "status" | "statusType"
  | "exceptionCode"
  | "locationCity" | "locationCountry" | "locationCountryCode"
  | "locationPostalCode" | "locationProvinceCode"
  | "locationSlic" | "locationType" | "locationId"
  | "ancillaryAction" | "ancillaryReason"
  | "serviceCode";

export const OBSERVED_CATALOG: Record<ObservedField, ObservedValue[]> = {
  statusCode: STATUS_CODES,
  status: STATUSES,
  statusType: STATUS_TYPES,
  exceptionCode: EXCEPTION_CODES,
  locationCity: LOCATION_CITIES,
  locationCountry: LOCATION_COUNTRIES,
  locationCountryCode: LOCATION_COUNTRY_CODES,
  locationPostalCode: LOCATION_POSTAL_CODES,
  locationProvinceCode: LOCATION_PROVINCE_CODES,
  locationSlic: LOCATION_SLICS,
  locationType: LOCATION_TYPES,
  locationId: LOCATION_IDS,
  ancillaryAction: ANCILLARY_ACTIONS,
  ancillaryReason: ANCILLARY_REASONS,
  serviceCode: SERVICE_DESCRIPTIONS,
};

export function findLabel(field: ObservedField, value: string): string | undefined {
  return OBSERVED_CATALOG[field].find((v) => v.value === value)?.label;
}
