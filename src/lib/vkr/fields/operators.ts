import type { FieldType, StateOperator, DurationAnchorKey } from "../types";

export const OPERATOR_LABELS: Record<string, string> = {
  is_empty: "je prázdné",
  is_not_empty: "není prázdné",
  equals: "je",
  not_equals: "není",
  is_any_of: "je jedna z",
  is_none_of: "není žádná z",
  contains: "obsahuje",
  not_contains: "neobsahuje",
  starts_with: "začíná na",
  ends_with: "končí na",
  changed_to: "změnilo se na",
  changed_from_to: "změnilo se z … na …",
  not_changed_since: "nebylo změněno déle než",
  gt: "je vyšší než",
  gte: "je vyšší nebo rovno",
  lt: "je nižší než",
  lte: "je nižší nebo rovno",
  between: "je mezi",
  compare_field: "porovnat s polem",
  is: "je přesně",
  is_today: "je dnes",
  is_past: "je v minulosti",
  is_future: "je v budoucnosti",
  before: "je před",
  after: "je po",
  is_on_or_before: "je v den nebo dříve",
  is_on_or_after: "je v den nebo později",
  is_between: "je mezi (dvěma daty)",
  within_next: "nastane do",
  within_past: "nastalo před méně než",
  is_true: "je Ano",
  is_false: "je Ne",
};

export type ConditionOperatorOption = { value: string; label: string };
const op = (v: string): ConditionOperatorOption => ({ value: v, label: OPERATOR_LABELS[v] ?? v });

export function operatorsForType(type?: string): ConditionOperatorOption[] {
  switch (type) {
    case "text":
      return ["equals", "not_equals", "contains", "not_contains", "starts_with", "ends_with", "is_any_of", "is_none_of", "changed_to", "is_empty", "is_not_empty"].map(op);
    case "number":
      return ["equals", "not_equals", "gt", "gte", "lt", "lte", "between", "is_empty", "is_not_empty"].map(op);
    case "datetime":
      return ["is", "before", "after", "is_on_or_before", "is_on_or_after", "is_between", "is_today", "is_past", "is_future", "within_next", "within_past", "not_changed_since", "is_empty", "is_not_empty"].map(op);
    case "enum":
      return ["equals", "not_equals", "is_any_of", "is_none_of", "changed_to", "changed_from_to", "is_empty", "is_not_empty"].map(op);
    case "boolean":
      return ["is_true", "is_false"].map(op);
    case "user":
      return [{ value: "contains", label: "obsahuje" }, { value: "not_contains", label: "neobsahuje" }, { value: "is_empty", label: "je prázdné" }, { value: "is_not_empty", label: "není prázdné" }];
    case "document":
      return [{ value: "is_not_empty", label: "je přiložen" }, { value: "is_empty", label: "chybí" }, { value: "not_changed_since", label: "nebyl změněn déle než" }];
    default:
      return ["is_empty", "is_not_empty", "equals"].map(op);
  }
}

/** Předvolby času pro datetime operátory (within_past, within_next, not_changed_since) */
export const TIME_PRESETS: Array<{ minutes: number; label: string }> = [
  { minutes: 15, label: "15 min" },
  { minutes: 60, label: "1 h" },
  { minutes: 240, label: "4 h" },
  { minutes: 1440, label: "24 h" },
  { minutes: 4320, label: "3 dny" },
  { minutes: 10080, label: "7 dní" },
  { minutes: 43200, label: "30 dní" },
];

export function formatMinutes(min: number): string {
  if (min < 60) return `${min} min`;
  if (min < 1440) return `${Math.round(min / 60)} h`;
  return `${Math.round(min / 1440)} dní`;
}

/** Pro „je vyšší/nižší než" — pouze absolutní hodnota (porovnání s jiným polem odstraněno). */
export const NUMBER_MODES: Array<{ value: "absolute"; label: string }> = [
  { value: "absolute", label: "absolutní hodnota" },
];

/** Offset jednotky pro relativní data */
export const OFFSET_UNITS: Array<{ value: "min" | "h" | "d" | "w"; label: string; minutes: number }> = [
  { value: "min", label: "minut", minutes: 1 },
  { value: "h", label: "hodin", minutes: 60 },
  { value: "d", label: "dní", minutes: 1440 },
  { value: "w", label: "týdnů", minutes: 10080 },
];

/** Operátory bez pravé hodnoty */
export const NO_VALUE_OPS = new Set([
  "is_empty", "is_not_empty", "is_today", "is_past", "is_future", "is_true", "is_false",
]);

// ============================================================
//  field_state_duration helpers
// ============================================================

export const DURATION_ANCHORS: Array<{ value: DurationAnchorKey; label: string }> = [
  { value: "field_last_update", label: "poslední změna pole" },
  { value: "shipment_created", label: "vytvoření zásilky" },
  { value: "order_created", label: "vytvoření objednávky" },
  { value: "shipment_updated", label: "poslední aktualizace zásilky" },
  { value: "today", label: "dnes" },
  { value: "literal_date", label: "konkrétní datum" },
];

const STATE_OPS_LABEL: Record<StateOperator, string> = {
  any: "jakkoli",
  is_empty: "je prázdné",
  is_not_empty: "je vyplněné",
  equals: "rovná se",
  not_equals: "není",
  is_any_of: "je jedním z",
  is_none_of: "není žádné z",
  is_true: "je ANO",
  is_false: "je NE",
};

export function stateOperatorsForType(type?: FieldType): Array<{ value: StateOperator; label: string }> {
  const base: StateOperator[] = ["any", "is_empty", "is_not_empty"];
  const map = (ops: StateOperator[]) => ops.map((o) => ({ value: o, label: STATE_OPS_LABEL[o] }));
  switch (type) {
    case "enum":
      return map([...base, "equals", "not_equals", "is_any_of", "is_none_of"]);
    case "text":
    case "number":
    case "datetime":
    case "user":
    case "address":
      return map([...base, "equals", "not_equals"]);
    case "boolean":
      return map(["any", "is_true", "is_false"]);
    case "document":
      return map(base);
    default:
      return map(base);
  }
}

export function stateOperatorLabel(op?: StateOperator): string {
  return op ? STATE_OPS_LABEL[op] : "";
}

export function durationAnchorLabel(a?: DurationAnchorKey): string {
  return DURATION_ANCHORS.find((x) => x.value === a)?.label ?? "";
}
