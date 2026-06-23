/**
 * Katalog dostupných polí pro „Podmínky věci k řešení".
 * Data-driven — přidání nové podmínky = nový záznam v `VKR_CONDITION_CATALOG`.
 */

export type VkrOperator = {
  id: string;
  label: string;
  /** Pokud true, hodnota se zadává inputem; jinak žádná hodnota nebo enum. */
  needsValue?: boolean;
  /** Pokud je definováno, hodnota je enum select. */
  valueOptions?: { value: string; label: string }[];
  /** Typ inputu, pokud `needsValue` true. */
  valueType?: "number" | "text";
  valuePlaceholder?: string;
  valueSuffix?: string;
};

export type VkrConditionFieldDef = {
  id: string;
  label: string;
  category: string;
  description?: string;
  operators: VkrOperator[];
  /** Speciální editor hodnoty místo generického inputu. */
  customValueEditor?: "tracking_time";
};

export const VKR_CONDITION_CATALOG: VkrConditionFieldDef[] = [
  {
    id: "carrier_announced_delivery_at",
    label: "Datum doručení dopravce",
    category: "Zásilka",
    description: "Datum doručení hlášené dopravcem v trackingu",
    operators: [
      { id: "is_today", label: "je dnes" },
      { id: "is_tomorrow", label: "je zítra" },
      {
        id: "within_days",
        label: "v rozmezí … dnů",
        needsValue: true,
        valueType: "number",
        valuePlaceholder: "3",
        valueSuffix: "dnů",
      },
    ],
  },
  {
    id: "customer.tenure",
    label: "Stálost zákazníka",
    category: "Zákazník",
    description: "Nový vs. dlouhodobý zákazník",
    operators: [
      {
        id: "is",
        label: "je",
        valueOptions: [
          { value: "new", label: "nový" },
          { value: "longterm", label: "dlouhodobý" },
        ],
      },
      {
        id: "is_not",
        label: "není",
        valueOptions: [
          { value: "new", label: "nový" },
          { value: "longterm", label: "dlouhodobý" },
        ],
      },
    ],
  },
];

// ---- Kategorie „Historie trackingu" ------------------------------------------------
// Sémantika: každá podmínka se vyhodnocuje NEZÁVISLE — „existuje záznam v historii,
// který splňuje X". Více podmínek (AND) NEvyžaduje, aby šlo o tentýž záznam.
// Operátory zrcadlí TRACKING_OPERATORS z TrackingConditionBuilder.

const HIST_CAT = "Historie trackingu";

const TEXT_OPS: VkrOperator[] = [
  { id: "je jedním z", label: "je jedním z", needsValue: true, valueType: "text", valuePlaceholder: "hodnota, hodnota…" },
  { id: "není žádným z", label: "není žádným z", needsValue: true, valueType: "text", valuePlaceholder: "hodnota, hodnota…" },
  { id: "je", label: "je", needsValue: true, valueType: "text", valuePlaceholder: "hodnota" },
  { id: "není", label: "není", needsValue: true, valueType: "text", valuePlaceholder: "hodnota" },
  { id: "obsahuje", label: "obsahuje", needsValue: true, valueType: "text", valuePlaceholder: "podřetězec" },
];

const NUMBER_OPS: VkrOperator[] = [
  { id: "je", label: "je", needsValue: true, valueType: "number", valuePlaceholder: "0" },
  { id: "je větší než", label: "je větší než", needsValue: true, valueType: "number", valuePlaceholder: "0" },
  { id: "je menší nebo rovno", label: "je menší nebo rovno", needsValue: true, valueType: "number", valuePlaceholder: "0" },
];

function histText(id: string, label: string): VkrConditionFieldDef {
  return { id: `tracking_history.${id}`, label, category: HIST_CAT, operators: TEXT_OPS };
}

VKR_CONDITION_CATALOG.push(
  histText("derivedStatus", "Status"),
  histText("derivedStatusCode", "Kód statusu"),
  histText("eventType", "Typ záznamu"),
  histText("eventDescription", "Popis události"),
  histText("exceptionCode", "Kód výjimky"),
  histText("exceptionDescription", "Popis výjimky"),
  histText("locationType", "Typ místa"),
  histText("locationId", "ID místa"),
  histText("city", "Město"),
  histText("countryCode", "Země"),
  histText("postalCode", "PSČ"),
  {
    id: "tracking_history.deliveryAttempts",
    label: "Počet pokusů o doručení",
    category: HIST_CAT,
    operators: NUMBER_OPS,
  },
  {
    id: "tracking_history.eventTime",
    label: "Čas záznamu",
    category: HIST_CAT,
    customValueEditor: "tracking_time",
    operators: [{ id: "matches", label: "odpovídá", needsValue: true, valueType: "text" }],
  },
);


export function findVkrField(id: string): VkrConditionFieldDef | undefined {
  return VKR_CONDITION_CATALOG.find((f) => f.id === id);
}

export function findVkrOperator(
  fieldId: string,
  operatorId: string,
): VkrOperator | undefined {
  return findVkrField(fieldId)?.operators.find((o) => o.id === operatorId);
}

export interface VkrCondition {
  id: string;
  fieldId: string;
  operator: string;
  value?: string;
}
