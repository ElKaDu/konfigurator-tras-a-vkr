import type {
  ActionTag,
  CheckpointType,
  Route,
  Rule,
  SampleShipment,
  Segment,
  Situation,
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
  { id: "ct_hub_arrival",   name: "Přílet do přestupního hubu", description: "Zásilka dorazila do přestupního leteckého hubu." },
  { id: "ct_hub_departure", name: "Odlet z přestupního hubu",   description: "Zásilka odletěla z přestupního leteckého hubu." },
  { id: "ct_dest_hub_arrival", name: "Přílet do cílového hubu", description: "Zásilka dorazila do cílového hubu v zemi doručení." },
];

// ---------------------------------------------------------------------------
// Action Tags (katalog Akcí)
// ---------------------------------------------------------------------------
export const ACTION_TAGS: ActionTag[] = [
  { id: "at_call_customer", label: "Zavolat zákazníkovi", icon: "Phone" },
  { id: "at_email_customer", label: "Informovat e-mailem", icon: "Mail" },
  { id: "at_check_carrier", label: "Prověřit u dopravce", icon: "Search" },
  { id: "at_shift_date", label: "Posunout datum doručení", icon: "CalendarClock" },
  { id: "at_mark_delayed", label: "Zásilka se zpozdí", icon: "AlertTriangle" },
  { id: "at_mark_today", label: "Zásilka dorazí dnes", icon: "CheckCircle2" },
  { id: "at_create_task", label: "Vytvořit věc k řešení", icon: "ListTodo" },
];

// ---------------------------------------------------------------------------
// Situace (viz spec bod 7)
// ---------------------------------------------------------------------------
export const SITUATIONS: Situation[] = [
  {
    id: "sit_undelivered",
    code: "SIT-UNDELIVERED",
    name: "Nedoručeno",
    description: "Zásilka byla doručována, ale příjemce nebyl zastižen.",
    area: "tracking_records",
    severities: [
      {
        id: "sev_undelivered_normal",
        name: "běžné",
        priority: "low",
        actions: [
          { id: "sa_undelivered_normal_1", actionTagId: "at_email_customer", description: "Informuj zákazníka o neúspěšném pokusu a domluv nový termín." },
        ],
      },
      {
        id: "sev_undelivered_problem",
        name: "problémové",
        priority: "medium",
        actions: [
          { id: "sa_undelivered_problem_1", actionTagId: "at_email_customer", description: "Informuj zákazníka o druhém neúspěšném pokusu." },
          { id: "sa_undelivered_problem_2", actionTagId: "at_check_carrier", description: "Ověř u dopravce důvod opakovaného nedoručení." },
        ],
      },
      {
        id: "sev_undelivered_critical",
        name: "kritické",
        priority: "high",
        actions: [
          { id: "sa_undelivered_critical_1", actionTagId: "at_call_customer", description: "Zavolej zákazníkovi, domluv individuální doručení." },
          { id: "sa_undelivered_critical_2", actionTagId: "at_check_carrier", description: "Ověř u dopravce, proč se opakovaně nedaří doručit." },
        ],
      },
    ],
  },
  {
    id: "sit_damage",
    code: "SIT-DAMAGE",
    name: "Poškození zásilky",
    description: "Tracking hlásí zjištěné poškození zásilky.",
    area: "tracking_records",
    severities: [
      {
        id: "sev_damage_default",
        name: "zjištěno poškození",
        priority: "high",
        actions: [
          { id: "sa_damage_1", actionTagId: "at_call_customer", description: "Informuj zákazníka o poškození a domluv další postup (výměna/reklamace)." },
        ],
      },
    ],
  },
  {
    id: "sit_transport_issue",
    code: "SIT-TRANSPORT",
    name: "Problém v přepravě",
    description: "Zásilka vykazuje známky problému v přepravě.",
    area: "tracking_records",
    severities: [
      {
        id: "sev_transport_possible",
        name: "možný problém",
        priority: "low",
        actions: [
          { id: "sa_transport_possible_1", actionTagId: "at_check_carrier", description: "Ověř kontext statusu (místo, čas) a rozhodni, zda jde o skutečný problém." },
        ],
      },
      {
        id: "sev_transport_stuck",
        name: "zaseknutá na místě",
        priority: "medium",
        actions: [
          { id: "sa_transport_stuck_1", actionTagId: "at_check_carrier", description: "Ověř u dopravce, proč se zásilka nehýbe." },
        ],
      },
      {
        id: "sev_transport_lost_suspect",
        name: "podezření na ztrátu",
        priority: "high",
        actions: [
          { id: "sa_lost_1", actionTagId: "at_check_carrier", description: "Zahaj šetření ztráty u dopravce." },
          { id: "sa_lost_2", actionTagId: "at_call_customer", description: "Informuj zákazníka o možném zpoždění." },
        ],
      },
    ],
  },
  {
    id: "sit_zpozdena_zasilka",
    code: "SIT-DELAYED-SHIPMENT",
    name: "Zpožděná zásilka",
    description: "Bod „Dnešní doručení“ vyhodnotil, že zásilka dnes nedorazí.",
    area: "route_compliance",
    severities: [
      {
        id: "sev_zpozdena_zasilka",
        name: "kritické",
        priority: "urgent",
        actions: [
          { id: "sa_zpozdena_zasilka_1", actionTagId: "at_mark_delayed", description: "Označit zásilku jako zpožděnou." },
          { id: "sa_zpozdena_zasilka_2", actionTagId: "at_shift_date", description: "Posuň avizované datum doručení." },
        ],
      },
    ],
  },
  {
    id: "sit_return_to_sender",
    code: "SIT-RETURN-TO-SENDER",
    name: "Zásilka se vrací odesílateli",
    description: "Tracking hlásí, že se zásilka vrací zpět odesílateli.",
    area: "tracking_records",
    severities: [
      {
        id: "sev_return_to_sender",
        name: "běžné",
        priority: "medium",
        actions: [
          { id: "sa_return_to_sender_1", actionTagId: "at_check_carrier", description: "Ověř u dopravce důvod vrácení a informuj odesílatele." },
        ],
      },
    ],
  },
  {
    id: "sit_dangerous_goods",
    code: "SIT-DANGEROUS-GOODS",
    name: "Zásilka zastavena — nebezpečné zboží",
    description: "Tracking hlásí zastavení zásilky kvůli zjištěnému nebezpečnému zboží.",
    area: "tracking_records",
    severities: [
      {
        id: "sev_dangerous_goods",
        name: "běžné",
        priority: "high",
        actions: [
          { id: "sa_dangerous_goods_1", actionTagId: "at_check_carrier", description: "Ověř u dopravce povahu zásilky a další postup (celní/bezpečnostní řízení)." },
        ],
      },
    ],
  },
  {
    id: "sit_long_no_movement",
    code: "SIT-LONG-NO-MOVEMENT",
    name: "Zásilka dlouho bez pohybu",
    description: "Zásilce dlouho nepřišel žádný nový tracking záznam (mimo administrativní statusy jako clení).",
    area: "tracking_records",
    severities: [
      {
        id: "sev_long_no_movement",
        name: "běžné",
        priority: "medium",
        actions: [
          { id: "sa_long_no_movement_1", actionTagId: "at_check_carrier", description: "Ověř u dopravce, kde se zásilka nachází a proč dlouho nepřišel nový záznam." },
        ],
      },
    ],
  },
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
    serviceTypes: ["Economy"],
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
    serviceTypes: ["Economy"],
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
      {
        id: "cp_odlet_brno_demo",
        checkpointTypeId: "ct_departure",
        note: "Demo bod typu Běžný bod — Odlet Praha/Brno.",
        kind: "generic",
        match: { status: ["Left FedEx origin facility"], location_type: ["ORIGIN_FEDEX_FACILITY"] },
        correctness: [
          {
            id: "corr_odlet_brno_termin",
            aspect: "record_event_time",
            mode: "fixed",
            anchorKind: "system_event",
            anchorLabel: "den vyzvednutí",
            operator: "within",
            fixedOp: "before",
            fixedTime: "22:00",
            fixedTz: "local",
          },
        ],
        konecnyLimit: { mode: "offset", offsetHours: 0 },
      },
      {
        id: "cp_dnesni_doruceni_demo",
        checkpointTypeId: "ct_first_scan",
        note: "Demo bod typu Dnešní doručení — 1./2. fyzický scan v cílové zemi.",
        kind: "dnesni_doruceni",
        match: { status: ["FedEx Facility"], location_type: ["FEDEX_FACILITY"] },
        correctness: [],
        dnesniDoruceni: {
          scan1: {
            match: { location_type: ["FEDEX_FACILITY"] },
            deadline: {
              id: "corr_scan1_termin",
              aspect: "record_event_time",
              mode: "fixed",
              anchorKind: "system_event",
              anchorLabel: "ADD (avizované doručení zákazníkovi)",
              operator: "within",
              fixedOp: "before",
              fixedTime: "08:00",
              fixedTz: "local",
            },
          },
          limitProRadneZaznamy: { mode: "offset", offsetHours: 1 },
          konecnyLimitScan1: { mode: "offset", offsetHours: 2 },
          scan2: {
            match: { location_type: ["DESTINATION_FACILITY"], zip_matches_destination: true },
            deadline: {
              id: "corr_scan2_termin",
              aspect: "record_event_time",
              mode: "offset",
              anchorKind: "checkpoint",
              anchorLabel: "od 1. fyzického scanu",
              anchorCheckpointTypeId: "ct_first_scan",
              operator: "within",
              value: 2,
              unit: "h",
            },
          },
          konecnyLimitScan2: { mode: "offset", offsetHours: 1 },
        },
      },
    ],
  },
  {
    id: "seg_usa_pickup",
    name: "Praha/Brno → Paříž",
    description: "Vyzvednutí v ČR, let do přestupního hubu Paříž/CDG. Podle TRASA-05/06 ze zadání.",
    carriers: ["FedEx"],
    serviceTypes: ["Economy"],
    checkpoints: [
      {
        id: "cp_usa_odlet_praha_brno",
        checkpointTypeId: "ct_departure",
        note: "TRASA-05 — odlet z odesílacího FedEx terminálu. ID místa je nutné upřesnit dle číselníku dopravce (v zadání jen placeholder „ABCD“).",
        kind: "generic",
        match: { status: ["Left FedEx origin facility"], location_type: ["ORIGIN_FEDEX_FACILITY"] },
        correctness: [
          {
            id: "corr_usa_odlet_termin",
            aspect: "record_event_time",
            mode: "fixed",
            anchorKind: "system_event",
            anchorLabel: "Vyzvednutí zásilky",
            operator: "within",
            fixedOp: "before",
            fixedTime: "22:00",
            fixedTz: "Europe/Prague",
          },
        ],
        konecnyLimit: { mode: "offset", offsetHours: 0 },
      },
      {
        id: "cp_usa_prilet_paris_hub",
        checkpointTypeId: "ct_hub_arrival",
        note: "TRASA-06 — přílet do přestupního hubu Paříž/CDG (ID místa: CDG_HUB). D+1 = +1 pracovní den od vyzvednutí; alternativně lze kotvit vůči checkpointu „odlet z místa odeslání“.",
        kind: "generic",
        match: { status: ["Arrived at hub"], location_type: ["FEDEX_HUB"] },
        correctness: [
          {
            id: "corr_usa_prilet_paris_termin",
            aspect: "record_event_time",
            mode: "fixed",
            anchorKind: "system_event",
            anchorLabel: "Vyzvednutí zásilky",
            operator: "within",
            fixedOp: "before",
            fixedTime: "03:00",
            fixedTz: "Europe/Prague",
            fixedDayOffset: 1,
            fixedDayMode: "business",
            fixedDayDirection: "after",
          },
        ],
        konecnyLimit: { mode: "offset", offsetHours: 0 },
      },
    ],
  },
  {
    id: "seg_usa_paris_to_usa",
    name: "Paříž → USA",
    description: "Odlet z přestupního hubu Paříž/CDG, přílet do cílového hubu v USA a doručení. Podle TRASA-07/08 a bodu Dnešní doručení ze zadání.",
    carriers: ["FedEx"],
    serviceTypes: ["Economy"],
    checkpoints: [
      {
        id: "cp_usa_odlet_paris_hub",
        checkpointTypeId: "ct_hub_departure",
        note: "TRASA-07 — odlet z přestupního hubu Paříž/CDG (ID místa: CDG_HUB). Navazuje na předchozí checkpoint (přílet do hubu) — lze řešit i kotvou vůči jeho záznamu + offset.",
        kind: "generic",
        match: { status: ["Departed from hub"], location_type: ["FEDEX_HUB"] },
        correctness: [
          {
            id: "corr_usa_odlet_paris_termin",
            aspect: "record_event_time",
            mode: "fixed",
            anchorKind: "system_event",
            anchorLabel: "Vyzvednutí zásilky",
            operator: "within",
            fixedOp: "before",
            fixedTime: "06:00",
            fixedTz: "Europe/Prague",
            fixedDayOffset: 1,
            fixedDayMode: "business",
            fixedDayDirection: "after",
          },
        ],
        konecnyLimit: { mode: "offset", offsetHours: 0 },
      },
      {
        id: "cp_usa_prilet_dest_hub",
        checkpointTypeId: "ct_dest_hub_arrival",
        note: "TRASA-08 — přílet do cílového hubu v USA. ID místa je jedno z: EWR_HUB, MEM_HUB, CVG_HUB (více povolených hodnot). Deadline je v EST (America/New_York), ne CET jako u předchozích kroků.",
        kind: "generic",
        match: { status: ["Arrived at destination hub"] },
        correctness: [
          {
            id: "corr_usa_prilet_dest_termin",
            aspect: "record_event_time",
            mode: "fixed",
            anchorKind: "system_event",
            anchorLabel: "Vyzvednutí zásilky",
            operator: "within",
            fixedOp: "before",
            fixedTime: "08:00",
            fixedTz: "America/New_York",
            fixedDayOffset: 1,
            fixedDayMode: "business",
            fixedDayDirection: "after",
          },
        ],
        konecnyLimit: { mode: "offset", offsetHours: 0 },
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
export const ROUTES: Route[] = [
  {
    id: "route_fx_air_us",
    code: "R-FX-AIR-US",
    name: "FedEx Air — USA (přes Paříž)",
    active: true,
    carriers: ["FedEx"],
    serviceTypes: ["Economy"],
    destCountries: ["US"],
    segmentIds: ["seg_usa_pickup", "seg_usa_paris_to_usa"],
  },
];

// ---------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------
export const RULES: Rule[] = [
  {
    id: "rule_t03",
    code: "T03",
    name: "Zásilka na první pokus nedoručena",
    area: "tracking_records",
    priority: "low",
    trigger: { kind: "condition_met", label: "Reaktivní — při každém novém tracking záznamu" },
    conditions: [
      { kind: "field", fieldId: "derivedStatus", operator: "je", value: "Delivery Attempted, Customer Not Available, Business Closed" },
      { kind: "field", fieldId: "deliveryAttempts", operator: "je", value: "1" },
    ],
    situationId: "sit_undelivered",
    severityId: "sev_undelivered_normal",
    actions: [
      { id: "sa_1784665806892", type: "create_vkr", title: "Zásilka na první pokus nedoručena", actionTagId: "at_call_customer" },
    ],
    uiState: {
      selectedSituationId: "sit_undelivered",
      selectedSeverityId: "sev_undelivered_normal",
      triggerType: "automatic",
      trackingConditions: [
        { kind: "field", fieldId: "derivedStatus", operator: "je", value: "Delivery Attempted, Customer Not Available, Business Closed" },
        { kind: "field", fieldId: "deliveryAttempts", operator: "je", value: "1" },
      ],
      noMovementDuration: 72,
      noMovementUnit: "h",
      severityActions: [
        { id: "sa_1784665806892", actionTagId: "at_call_customer", enabled: true, description: "" },
      ],
      vkrConditions: [],
    },
  },
  {
    id: "rule_t04",
    code: "T04",
    name: "Nedoručeno na druhý pokus",
    area: "tracking_records",
    priority: "medium",
    trigger: { kind: "condition_met", label: "Reaktivní — při každém novém tracking záznamu" },
    conditions: [
      { kind: "field", fieldId: "derivedStatus", operator: "je", value: "Delivery Attempted, Customer Not Available, Business Closed" },
      { kind: "field", fieldId: "deliveryAttempts", operator: "je", value: "2" },
    ],
    situationId: "sit_undelivered",
    severityId: "sev_undelivered_problem",
    actions: [],
    uiState: {
      selectedSituationId: "sit_undelivered",
      selectedSeverityId: "sev_undelivered_problem",
      triggerType: "automatic",
      trackingConditions: [
        { kind: "field", fieldId: "derivedStatus", operator: "je", value: "Delivery Attempted, Customer Not Available, Business Closed" },
        { kind: "field", fieldId: "deliveryAttempts", operator: "je", value: "2" },
      ],
      noMovementDuration: 72,
      noMovementUnit: "h",
      severityActions: [],
      vkrConditions: [],
    },
  },
  {
    id: "rule_t05",
    code: "T05",
    name: "Nedoručeno na 3. pokus",
    area: "tracking_records",
    priority: "high",
    trigger: { kind: "condition_met", label: "Reaktivní — při každém novém tracking záznamu" },
    conditions: [
      { kind: "field", fieldId: "derivedStatus", operator: "je", value: "Delivery Attempted nebo Customer Not Available or Business Closed" },
      { kind: "field", fieldId: "deliveryAttempts", operator: "je", value: "3" },
    ],
    situationId: "sit_undelivered",
    severityId: "sev_undelivered_critical",
    actions: [
      { id: "sa_1784665925424", type: "create_vkr", title: "Nedoručeno na 3. pokus", actionTagId: "at_call_customer" },
      { id: "sa_1784665927574", type: "create_vkr", title: "Nedoručeno na 3. pokus", actionTagId: "at_check_carrier" },
    ],
    uiState: {
      selectedSituationId: "sit_undelivered",
      selectedSeverityId: "sev_undelivered_critical",
      triggerType: "automatic",
      trackingConditions: [
        { kind: "field", fieldId: "derivedStatus", operator: "je", value: "Delivery Attempted nebo Customer Not Available or Business Closed" },
        { kind: "field", fieldId: "deliveryAttempts", operator: "je", value: "3" },
      ],
      noMovementDuration: 72,
      noMovementUnit: "h",
      severityActions: [
        { id: "sa_1784665925424", actionTagId: "at_call_customer", enabled: true, description: "" },
        { id: "sa_1784665927574", actionTagId: "at_check_carrier", enabled: true, description: "" },
      ],
      vkrConditions: [],
    },
  },
  {
    id: "rule_t06",
    code: "T06",
    name: "Poškození zásilky",
    area: "tracking_records",
    priority: "high",
    trigger: { kind: "condition_met", label: "Reaktivní — při každém novém tracking záznamu" },
    conditions: [
      { kind: "field", fieldId: "derivedStatus", operator: "je", value: "Package damaged" },
    ],
    situationId: "sit_damage",
    severityId: "sev_damage_default",
    actions: [],
    uiState: {
      selectedSituationId: "sit_damage",
      selectedSeverityId: "sev_damage_default",
      triggerType: "automatic",
      trackingConditions: [
        { kind: "field", fieldId: "derivedStatus", operator: "je", value: "Package damaged" },
      ],
      noMovementDuration: 72,
      noMovementUnit: "h",
      severityActions: [],
      vkrConditions: [],
    },
  },
  {
    id: "rule_t07",
    code: "T07",
    name: "Zásilka se vrací odesílateli",
    area: "tracking_records",
    priority: "medium",
    trigger: { kind: "condition_met", label: "Reaktivní — při každém novém tracking záznamu" },
    conditions: [
      { kind: "field", fieldId: "derivedStatus", operator: "je", value: "Return to sender" },
    ],
    situationId: "sit_return_to_sender",
    severityId: "sev_return_to_sender",
    actions: [],
    uiState: {
      selectedSituationId: "sit_return_to_sender",
      selectedSeverityId: "sev_return_to_sender",
      triggerType: "automatic",
      trackingConditions: [
        { kind: "field", fieldId: "derivedStatus", operator: "je", value: "Return to sender" },
      ],
      noMovementDuration: 72,
      noMovementUnit: "h",
      severityActions: [],
      vkrConditions: [],
    },
  },
  {
    id: "rule_t08",
    code: "T08",
    name: "Zásilka zastavena — nebezpečné zboží",
    description: "Text statusu je příklad — přesná hodnota od dopravce potřeba ověřit.",
    area: "tracking_records",
    priority: "high",
    trigger: { kind: "condition_met", label: "Reaktivní — při každém novém tracking záznamu" },
    conditions: [
      { kind: "field", fieldId: "derivedStatus", operator: "je", value: "Held - dangerous goods identified" },
    ],
    situationId: "sit_dangerous_goods",
    severityId: "sev_dangerous_goods",
    actions: [],
    uiState: {
      selectedSituationId: "sit_dangerous_goods",
      selectedSeverityId: "sev_dangerous_goods",
      triggerType: "automatic",
      trackingConditions: [
        { kind: "field", fieldId: "derivedStatus", operator: "je", value: "Held - dangerous goods identified" },
      ],
      noMovementDuration: 72,
      noMovementUnit: "h",
      severityActions: [],
      vkrConditions: [],
    },
  },
  {
    id: "rule_t09",
    code: "T09",
    name: "Zásilka dlouho bez pohybu",
    area: "tracking_records",
    priority: "medium",
    trigger: { kind: "schedule", label: "Časový plán — kontroluje periodicky" },
    conditions: [],
    situationId: "sit_long_no_movement",
    severityId: "sev_long_no_movement",
    actions: [],
    uiState: {
      selectedSituationId: "sit_long_no_movement",
      selectedSeverityId: "sev_long_no_movement",
      triggerType: "timer",
      trackingConditions: [],
      noMovementDuration: 48,
      noMovementUnit: "h",
      severityActions: [],
      vkrConditions: [],
    },
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
