import type {
  CheckpointType,
  Route,
  Rule,
  SampleShipment,
  Segment,
} from "./types";

// ---------------------------------------------------------------------------
// Checkpoint Types
// ---------------------------------------------------------------------------
export const CHECKPOINT_TYPES: CheckpointType[] = [
  { id: "ct_departure",     name: "Odlet ze země odeslání",  description: "Zásilka odletěla ze země původu." },
  { id: "ct_customs",       name: "Příchod na clení",         description: "Zásilka dorazila na celnici v cílové zemi." },
  { id: "ct_first_scan",    name: "První scan v cíli",        description: "První scan zásilky po průjezdu celnicí." },
  { id: "ct_dest_facility", name: "Destination Facility",    description: "Zásilka přijata na cílovém depu." },
  { id: "ct_delivered",     name: "Doručeno",                 description: "Zásilka předána příjemci." },
];

// ---------------------------------------------------------------------------
// Segments
// ---------------------------------------------------------------------------
export const SEGMENTS: Segment[] = [
  {
    id: "seg_cz_arrival",
    name: "ČR → Příchod na clení",
    description: "Sdílený vstup do CZ.",
    carriers: ["FedEx"],
    serviceTypes: ["ECONOMY"],
    checkpoints: [
      {
        id: "cp_departure",
        checkpointTypeId: "ct_departure",
        note: "Odlet z letiště původu.",
        match: {
          status: ["Picked up", "Departed FedEx location"],
          latest: false,
        },
        correctness: [],
      },
      {
        id: "cp_customs",
        checkpointTypeId: "ct_customs",
        note: "Celní odbavení v CZ.",
        match: {
          status: ["In customs"],
          location_country_code: ["CZ"],
          latest: true,
        },
        correctness: [
          {
            id: "corr_customs_within_2h",
            aspect: "record_event_time",
            operator: "within",
            anchorKind: "checkpoint",
            anchorLabel: "od milníku Odlet ze země odeslání",
            anchorCheckpointTypeId: "ct_departure",
            value: 2,
            unit: "h",
          },
        ],
      },
    ],
  },
  {
    id: "seg_cz_lastmile",
    name: "Příchod na clení → Doručeno",
    description: "Poslední míle v CZ.",
    carriers: ["FedEx"],
    serviceTypes: ["ECONOMY"],
    checkpoints: [
      {
        id: "cp_first_scan",
        checkpointTypeId: "ct_first_scan",
        note: "První scan po celnici.",
        match: {
          status: ["At local FedEx facility"],
          location_country_code: ["CZ"],
          latest: false,
        },
        correctness: [],
      },
      {
        id: "cp_dest_facility",
        checkpointTypeId: "ct_dest_facility",
        note: "Cílové depo v ČR.",
        match: {
          location_type: ["Destination Facility"],
          location_country_code: ["CZ"],
          zip_matches_destination: true,
        },
        correctness: [],
      },
      {
        id: "cp_delivered",
        checkpointTypeId: "ct_delivered",
        note: "Doručení příjemci.",
        match: {
          status: ["Delivered"],
          latest: true,
        },
        correctness: [],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
export const ROUTES: Route[] = [
  {
    id: "route_fx_air_cz",
    code: "R-FX-AIR-CZ",
    name: "FedEx Air — CZ",
    active: true,
    carriers: ["FedEx"],
    serviceTypes: ["ECONOMY"],
    destCountries: ["CZ"],
    segmentIds: ["seg_cz_arrival", "seg_cz_lastmile"],
  },
];

// ---------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------
export const RULES: Rule[] = [
  {
    id: "rule_r10",
    code: "R10",
    name: "Příchod na clení neproběhl správně",
    area: "route_compliance",
    active: true,
    priority: "high",
    trigger: { kind: "condition_met", label: "při každé nové tracking události" },
    conditions: [
      {
        kind: "route_compliance",
        mode: "checkpoint_type",
        checkpointTypeId: "ct_customs",
      },
    ],
    actions: [
      {
        id: "act_r10_vkr",
        type: "create_vkr",
        runWhenRouteCondition: "not_fulfilled",
        title: "Clení v prodlení · {{shipment_number}}",
        priority: "high",
      },
    ],
  },
  {
    id: "rule_t01",
    code: "T01",
    name: "Zásilka se zasekla na jednom místě",
    area: "tracking_records",
    active: true,
    priority: "low",
    trigger: { kind: "condition_met", label: "při každé nové tracking události" },
    conditions: [
      {
        kind: "tracking_aggregate",
        trackingFieldId: "location_city",
        valueMode: "same_repeats",
        count: 3,
        occurrence: "consecutive",
      },
    ],
    actions: [
      {
        id: "act_t01_vkr",
        type: "create_vkr",
        title: "Zaseklá zásilka · {{shipment_number}}",
        priority: "low",
      },
    ],
  },
  {
    id: "rule_r11",
    code: "R11",
    name: "Doručeno mimo předepsanou trasu",
    area: "route_compliance",
    active: true,
    priority: "medium",
    trigger: { kind: "condition_met", label: "při každé nové tracking události" },
    conditions: [
      {
        kind: "route_compliance",
        mode: "general",
        generalCheck: "unrecognized_location",
      },
    ],
    actions: [
      {
        id: "act_r11_vkr",
        type: "create_vkr",
        title: "Mimo trasu · {{shipment_number}}",
        priority: "medium",
      },
    ],
  },
  {
    id: "rule_t02",
    code: "T02",
    name: "Opakovaný pokus o doručení",
    area: "tracking_records",
    active: false,
    priority: "low",
    trigger: { kind: "condition_met", label: "při každé nové tracking události" },
    conditions: [
      {
        kind: "tracking_aggregate",
        trackingFieldId: "status_code",
        valueMode: "specific",
        expectedValue: "DELIVERY_ATTEMPTED",
        count: 2,
        occurrence: "any",
      },
    ],
    actions: [
      {
        id: "act_t02_vkr",
        type: "create_vkr",
        title: "Opakovaný pokus · {{shipment_number}}",
        priority: "low",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Sample Shipments
// ---------------------------------------------------------------------------
export const SAMPLE_SHIPMENTS: SampleShipment[] = [
  {
    id: "ship_1",
    label: "FedEx Air → Praha (clení)",
    carrier: "FedEx",
    service_type: "ECONOMY",
    country_import: "CZ",
    state: "IN_TRANSPORT",
    dest_postal_code: "11000",
    etd: "2026-06-13T08:00:00Z",
    eta: "2026-06-16T18:00:00Z",
    activities: [
      {
        status: "Picked up",
        status_code: "PU",
        location_city: "Shanghai",
        location_country_code: "CN",
        location_postal_code: "200120",
        latest: false,
        status_datetime: "2026-06-13T07:45:00Z",
      },
      {
        status: "Departed FedEx location",
        status_code: "DP",
        location_city: "Shanghai",
        location_country_code: "CN",
        location_postal_code: "200120",
        latest: false,
        status_datetime: "2026-06-13T09:30:00Z",
      },
      {
        status: "In customs",
        status_code: "CC",
        location_city: "Praha",
        location_country_code: "CZ",
        location_postal_code: "16000",
        latest: false,
        status_datetime: "2026-06-14T06:10:00Z",
      },
      {
        status: "At local FedEx facility",
        status_code: "AF",
        location_city: "Praha",
        location_country_code: "CZ",
        location_postal_code: "19000",
        latest: true,
        status_datetime: "2026-06-14T10:55:00Z",
      },
    ],
  },
  {
    id: "ship_2",
    label: "FedEx Air → Brno (zaseklá zásilka)",
    carrier: "FedEx",
    service_type: "ECONOMY",
    country_import: "CZ",
    state: "IN_TRANSPORT",
    dest_postal_code: "60200",
    etd: "2026-06-10T10:00:00Z",
    eta: "2026-06-14T18:00:00Z",
    activities: [
      {
        status: "Picked up",
        status_code: "PU",
        location_city: "Hong Kong",
        location_country_code: "HK",
        location_postal_code: "999077",
        latest: false,
        status_datetime: "2026-06-10T09:00:00Z",
      },
      {
        status: "Departed FedEx location",
        status_code: "DP",
        location_city: "Hong Kong",
        location_country_code: "HK",
        location_postal_code: "999077",
        latest: false,
        status_datetime: "2026-06-10T11:20:00Z",
      },
      // Three consecutive events at the same city — triggers T01
      {
        status: "In transit",
        status_code: "IT",
        location_city: "Leipzig",
        location_country_code: "DE",
        location_postal_code: "04435",
        latest: false,
        status_datetime: "2026-06-11T14:00:00Z",
      },
      {
        status: "In transit",
        status_code: "IT",
        location_city: "Leipzig",
        location_country_code: "DE",
        location_postal_code: "04435",
        latest: false,
        status_datetime: "2026-06-12T08:30:00Z",
      },
      {
        status: "In transit",
        status_code: "IT",
        location_city: "Leipzig",
        location_country_code: "DE",
        location_postal_code: "04435",
        latest: true,
        status_datetime: "2026-06-13T09:15:00Z",
      },
    ],
  },
];
