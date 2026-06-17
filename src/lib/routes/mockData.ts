import type { Route, Checkpoint, RouteProblem } from "./types";

const now = new Date();
const iso = (offsetMin: number) => new Date(now.getTime() + offsetMin * 60_000).toISOString();

/* ============================================================
 *  Jediný seed-scénář: „Kontrola doručení v den D"
 *  (FedEx Express → CZ). Žádné jiné trasy v DB nejsou.
 * ============================================================ */

export const FEDEX_CZ_CP1_ID = "cp_fx_cz_first_phys_scan";
export const FEDEX_CZ_CP2_ID = "cp_fx_cz_dest_facility";

const checkpoints: Checkpoint[] = [
  {
    id: FEDEX_CZ_CP1_ID,
    label: "První fyzický scan v cílové zemi (FedEx Facility)",
    match: {
      locationCountryCode: ["CZ"],
      locationType: ["FedEx Facility"],
    },
  },
  {
    id: FEDEX_CZ_CP2_ID,
    label: "Destination Facility v cílovém PSČ",
    match: {
      locationCountryCode: ["CZ"],
      locationType: ["Destination Facility"],
      zipMatchesDestination: { mode: "exact" },
    },
  },
];

const problems: RouteProblem[] = [
  {
    // CP1 nebyl vytvořen do 9:00 TZ cílové země — dnešní okno.
    problemTypeId: "pt_late_today",
    logic: {
      operator: "AND",
      items: [
        {
          kind: "checkpoint_time_constraint",
          checkpointId: FEDEX_CZ_CP1_ID,
          aspect: "record_created",
          operator: "within",
          anchor: {
            kind: "absolute_time",
            time: { hours: 9, minutes: 0 },
            timezone: "destination_country",
          },
        },
      ],
    },
  },
  {
    // CP2 nedoběhl do 2 h od záznamu CP1 (čas záznamu).
    problemTypeId: "pt_hub_stuck",
    logic: {
      operator: "AND",
      items: [
        {
          kind: "checkpoint_time_constraint",
          checkpointId: FEDEX_CZ_CP2_ID,
          aspect: "record_created",
          operator: "within",
          anchor: {
            kind: "checkpoint_record",
            offset: { value: 2, unit: "hours" },
            reference: "record_event_time",
            checkpointId: FEDEX_CZ_CP1_ID,
          },
        },
      ],
    },
  },
];

const fedexCzExpress: Route = {
  id: "route_fedex_cz_express",
  code: "R-FX-EXP-CZ",
  name: "FedEx Express — CZ (kontrola doručení v den D)",
  description:
    "Trasa pro modelování ranní kontroly avizovaného doručení. CP1 = první fyzický scan v cílové zemi (FedEx Facility). CP2 = Destination Facility ve správném PSČ.",
  active: true,
  carriers: ["FEDEX"],
  serviceTypes: ["Express"],
  destCountries: ["CZ"],
  checkpoints,
  problems,
  notes:
    "Navázaná pravidla VkŘ: rule_today_8h, rule_today_9h, rule_today_cp2, rule_today_10h.",
  createdAt: iso(-60 * 24 * 2),
  updatedAt: iso(-60 * 30),
};

export const SEED_ROUTES: Route[] = [fedexCzExpress];
