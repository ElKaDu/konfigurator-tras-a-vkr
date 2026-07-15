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
