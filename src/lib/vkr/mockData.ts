import type { Folder, Rule } from "./types";

/* ============================================================
 *  Jediný seed-scénář: „Kontrola doručení v den D" (FedEx Express CZ)
 *  4 pravidla nad trasou route_fedex_cz_express.
 * ============================================================ */

export const FOLDERS: Folder[] = [
  {
    id: "E",
    code: "E",
    name: "Doručení",
    description: "Pravidla kontrolující termín a stav doručení.",
  },
];

const uid = (() => {
  let i = 0;
  return () => `id_${++i}_${Math.random().toString(36).slice(2, 7)}`;
})();

const now = new Date();
const iso = (offsetMin: number) => new Date(now.getTime() + offsetMin * 60_000).toISOString();

export const SEED_RULES: Rule[] = [
  {
    id: "rule_today_8h",
    code: "E10",
    folderId: "E",
    name: "Den D — 8:00: první fyzický scan v cílové zemi",
    description:
      "V 8:00 TZ cíle: má-li zásilka avizované doručení dnes a první fyzický scan v cílové zemi není (s deadline 9:00 dnes), čekáme na 9:00. Pokud je → pozitivní VkŘ.",
    active: true,
    priority: 5,
    trigger: {
      type: "schedule",
      schedule: {
        mode: "daily",
        times: [{ kind: "time_of_day", time: "08:00", timezone: "destination_country" }],
        timezone: "destination_country",
        everyNDays: 1,
      },
    },
    conditionGroup: {
      id: uid(),
      operator: "AND",
      children: [
        { id: uid(), kind: "field", fieldId: "promised_delivery_at", operator: "is_today" },
        {
          id: uid(),
          kind: "route_compliance",
          routeCheck: "advanced_route_condition",
          problemTypeId: "pt_late_today",
        },
      ],
    },
    actions: [
      {
        id: uid(),
        type: "create_vkr",
        title: "Předpoklad dnešního doručení — {{shipment.reference}}",
        description: "První fyzický scan v cílové zemi proběhl včas, sledujeme dál.",
        priority: "low",
        assignMode: "shipment_operator",
        deduplicate: true,
        runWhenRouteCondition: "fulfilled",
      },
    ],
    throttleHours: 24,
    runs30d: 0,
    createdAt: iso(-60 * 24 * 3),
    updatedAt: iso(-60 * 30),
  },
  {
    id: "rule_today_9h",
    code: "E11",
    folderId: "E",
    name: "Den D — 9:00: fallback kontrola prvního scanu",
    description:
      "V 9:00 dokontroluje zásilky, kterým v 8:00 ještě nedoběhl scan. Pokud nyní doběhl → pozitivní VkŘ. Pokud stále chybí, R3 v 10:00 doplní fallback na datum přepravce.",
    active: true,
    priority: 5,
    trigger: {
      type: "schedule",
      schedule: {
        mode: "daily",
        times: [{ kind: "time_of_day", time: "09:00", timezone: "destination_country" }],
        timezone: "destination_country",
        everyNDays: 1,
      },
    },
    skipIfPrior: { ruleIds: ["rule_today_8h"], outcome: "positive" },
    conditionGroup: {
      id: uid(),
      operator: "AND",
      children: [
        { id: uid(), kind: "field", fieldId: "promised_delivery_at", operator: "is_today" },
        {
          id: uid(),
          kind: "route_compliance",
          routeCheck: "advanced_route_condition",
          problemTypeId: "pt_late_today",
        },
      ],
    },
    actions: [
      {
        id: uid(),
        type: "create_vkr",
        title: "Předpoklad dnešního doručení — {{shipment.reference}}",
        priority: "low",
        assignMode: "shipment_operator",
        deduplicate: true,
        runWhenRouteCondition: "fulfilled",
      },
    ],
    throttleHours: 24,
    runs30d: 0,
    createdAt: iso(-60 * 24 * 3),
    updatedAt: iso(-60 * 30),
  },
  {
    id: "rule_today_cp2",
    code: "E12",
    folderId: "E",
    name: "Den D — Destination Facility nedoběhl ≥ 2 h po prvním scanu",
    description:
      "Reaktivně po každém tracking eventu testuje: pokud CP1 (první fyzický scan) byl splněn před ≥ 2 hodinami a CP2 (Destination Facility) chybí, eskaluje.",
    active: true,
    priority: 5,
    trigger: {
      type: "condition_met",
    },
    skipIfPrior: { ruleIds: ["rule_today_cp2"], outcome: "positive" },
    conditionGroup: {
      id: uid(),
      operator: "AND",
      children: [
        { id: uid(), kind: "field", fieldId: "promised_delivery_at", operator: "is_today" },
        {
          id: uid(),
          kind: "field_state_duration",
          fieldId: "route.checkpoint_fulfilled_at",
          routeCheckpointId: "cp_fx_cz_first_phys_scan",
          stateOperator: "is_not_empty",
          durationDirection: "elapsed",
          durationMinutes: 120,
          durationAnchor: "field_last_update",
        },
        {
          id: uid(),
          kind: "route_compliance",
          routeCheck: "advanced_route_condition",
          problemTypeId: "pt_hub_stuck",
        },
      ],
    },
    actions: [
      {
        id: uid(),
        type: "create_vkr",
        title: "Předpoklad dnešního doručení — {{shipment.reference}}",
        priority: "low",
        assignMode: "shipment_operator",
        deduplicate: true,
        runWhenRouteCondition: "fulfilled",
      },
      {
        id: uid(),
        type: "create_vkr",
        title: "Zpožděná zásilka — {{shipment.reference}}",
        description:
          "Destination Facility nedoběhl ani do +2h od prvního fyzického scanu — eskalace.",
        priority: "high",
        assignMode: "shipment_operator",
        deduplicate: true,
        runWhenRouteCondition: "not_fulfilled",
      },
    ],
    throttleHours: 0,
    activeWindow: { businessDaysOnly: true },
    runs30d: 0,
    createdAt: iso(-60 * 24 * 3),
    updatedAt: iso(-60 * 30),

  },
  {
    id: "rule_today_10h",
    code: "E13",
    folderId: "E",
    name: "Den D — 10:00: fallback (chybí scan → datum od přepravce)",
    description:
      "V 10:00 fallback pro zásilky, kde stále chybí první fyzický scan v cílové zemi. Pokud doběhl mezitím a přepravce hlásí dnešní doručení → pozitivní VkŘ; jinak zpožděná zásilka.",
    active: true,
    priority: 5,
    trigger: {
      type: "schedule",
      schedule: {
        mode: "daily",
        times: [{ kind: "time_of_day", time: "10:00", timezone: "destination_country" }],
        timezone: "destination_country",
        everyNDays: 1,
      },
    },
    skipIfPrior: {
      ruleIds: ["rule_today_8h", "rule_today_9h", "rule_today_cp2"],
      outcome: "positive",
    },
    conditionGroup: {
      id: uid(),
      operator: "AND",
      children: [
        { id: uid(), kind: "field", fieldId: "promised_delivery_at", operator: "is_today" },
        { id: uid(), kind: "field", fieldId: "carrier_announced_delivery_at", operator: "is_today" },
        {
          id: uid(),
          kind: "route_compliance",
          routeCheck: "advanced_route_condition",
          problemTypeId: "pt_late_today",
        },
      ],
    },
    actions: [
      {
        id: uid(),
        type: "create_vkr",
        title: "Předpoklad dnešního doručení — {{shipment.reference}}",
        description: "Scan dorazil opožděně, přepravce stále hlásí dnes.",
        priority: "low",
        assignMode: "shipment_operator",
        deduplicate: true,
        runWhenRouteCondition: "fulfilled",
      },
      {
        id: uid(),
        type: "create_vkr",
        title: "Zpožděná zásilka — {{shipment.reference}}",
        description: "V 10:00 stále chybí první fyzický scan v cílové zemi.",
        priority: "high",
        assignMode: "shipment_operator",
        deduplicate: true,
        runWhenRouteCondition: "not_fulfilled",
      },
    ],
    throttleHours: 24,
    runs30d: 0,
    createdAt: iso(-60 * 24 * 3),
    updatedAt: iso(-60 * 30),
  },
];
