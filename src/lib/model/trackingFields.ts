import type { Condition } from "@/lib/model/types";

export interface TrackingFieldDef {
  value: string;
  label: string;
  group: string;
}

export const TRACKING_FIELDS: TrackingFieldDef[] = [
  { value: "eventType", label: "Typ záznamu (eventType)", group: "Typ a status" },
  { value: "derivedStatus", label: "Stav", group: "Typ a status" },
  { value: "derivedStatusCode", label: "Kód stavu", group: "Typ a status" },
  { value: "eventDescription", label: "Popis události", group: "Typ a status" },
  { value: "exceptionCode", label: "Kód výjimky", group: "Výjimka" },
  { value: "exceptionDescription", label: "Popis výjimky", group: "Výjimka" },
  { value: "locationType", label: "Typ místa", group: "Lokace" },
  { value: "locationId", label: "ID místa", group: "Lokace" },
  { value: "city", label: "Město", group: "Lokace" },
  { value: "countryCode", label: "Kód země", group: "Lokace" },
  { value: "postalCode", label: "PSČ", group: "Lokace" },
  { value: "deliveryAttempts", label: "Počet pokusů o doručení", group: "Doručení" },
  { value: "eventTime", label: "Čas záznamu (eventTime)", group: "Čas" },
];

type IncomingCondition = Extract<Condition, { kind: "field" }>;

type HistoricalCondition = Extract<Condition, { kind: "tracking_aggregate"; valueMode: "specific" }>;

/** Řádek v boxu "Podmínky pro příchozí záznam". */
export type IncomingRowKind = "is" | "is_not";

/** True pro řádky boxu "Podmínky pro příchozí záznam" (je/není). */
export function isIncomingConditionRow(c: Condition): c is IncomingCondition {
  return c.kind === "field";
}

export function incomingRowKindOf(c: IncomingCondition): IncomingRowKind {
  return c.operator === "není" ? "is_not" : "is";
}

/** True pro řádky boxu "Podmínky pro historické záznamy". */
export function isHistoricalConditionRow(c: Condition): c is HistoricalCondition {
  return c.kind === "tracking_aggregate" && c.valueMode === "specific";
}
