import type { Condition } from "@/lib/model/types";

export interface TrackingFieldDef {
  value: string;
  label: string;
  group: string;
}

export const TRACKING_FIELDS: TrackingFieldDef[] = [
  { value: "eventType", label: "Typ záznamu (eventType)", group: "Typ a status" },
  { value: "derivedStatus", label: "Odvozený status", group: "Typ a status" },
  { value: "derivedStatusCode", label: "Kód odvozeného statusu", group: "Typ a status" },
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

/** Podmnožina polí, u kterých dává smysl "stejná hodnota se opakuje" (režim Opakuje se). */
export const REPEATABLE_FIELDS: TrackingFieldDef[] = TRACKING_FIELDS.filter((f) =>
  ["locationId", "city", "countryCode"].includes(f.value)
);

type IncomingCondition =
  | Extract<Condition, { kind: "field" }>
  | Extract<Condition, { kind: "tracking_aggregate"; valueMode: "same_repeats" }>;

type HistoricalCondition = Extract<Condition, { kind: "tracking_aggregate"; valueMode: "specific" }>;

/** Řádek v boxu "Podmínky pro příchozí záznam". */
export type IncomingRowKind = "is" | "is_not" | "repeats";

/** True pro řádky boxu "Podmínky pro příchozí záznam" (je/není/opakuje se). */
export function isIncomingConditionRow(c: Condition): c is IncomingCondition {
  return c.kind === "field" || (c.kind === "tracking_aggregate" && c.valueMode === "same_repeats");
}

export function incomingRowKindOf(c: IncomingCondition): IncomingRowKind {
  if (c.kind === "field") return c.operator === "není" ? "is_not" : "is";
  return "repeats";
}

/** True pro řádky boxu "Podmínky pro historické záznamy". */
export function isHistoricalConditionRow(c: Condition): c is HistoricalCondition {
  return c.kind === "tracking_aggregate" && c.valueMode === "specific";
}
