export type Area = "tracking_records" | "route_compliance" | "order_eval" | "unpickup" | "params_price";

export type Priority = "low" | "medium" | "high" | "urgent";
export type TriggerKind = "condition_met" | "schedule" | "manual";

export interface CheckpointType { id: string; name: string; description?: string }

/** Reference na časovou zónu. "local" = odvozeno z cílové země zásilky. */
export type TimezoneRef = "local" | "Europe/Prague" | "Europe/Berlin" | "UTC" | "America/New_York" | string;

// Par-Ser snake_case match (podmnožina ParSerPackageActivityDetailSchema)
export interface CheckpointMatch {
  status?: string[]; status_code?: string[]; status_type?: string[];
  exception_code?: string[];
  location_country_code?: string[]; location_postal_code?: string[]; location_city?: string[]; location_type?: string[];
  latest?: boolean; zip_matches_destination?: boolean; free_text?: string;
  // Čas uvedený na záznamu — buď pevný HH:MM (mode "fixed"), nebo časový odstup od kotvy (mode "offset").
  event_time_of_day?: {
    mode?: "fixed" | "offset";        // default "fixed" pro zpětnou kompatibilitu
    // fixed:
    op?: "before" | "after" | "between" | "eq";
    from?: string;                    // "HH:MM"
    to?: string;                      // "HH:MM" — jen pro op = "between"
    tz?: TimezoneRef;                 // "local" = z cílové země zásilky
    // offset:
    offsetOp?: "within" | "longer_than" | "exact";
    offsetValue?: number;
    offsetUnit?: "min" | "h" | "d" | "bd";
    offsetDirection?: "before" | "after";
    anchorKind?: "checkpoint" | "system_event";
    anchorId?: string;
    anchorLabel?: string;
  };
}

export interface CheckpointCorrectness {
  id: string;
  /** Pevný čas (HH:MM v den kotvy ± N dnů) vs. časový odstup od kotvy. */
  mode?: "fixed" | "offset";          // default "offset" pro zpětnou kompatibilitu
  aspect?: "record_created" | "record_event_time";

  // společné — kotva
  anchorKind: "checkpoint" | "system_event" | "field" | "absolute_time";
  anchorLabel: string;
  anchorCheckpointTypeId?: string;

  // offset varianta (původní pole)
  operator: "within" | "longer_than" | "exact";
  value?: number; unit?: "h" | "d" | "bd";
  specificTime?: string;
  direction?: "before" | "after";

  // fixed varianta
  fixedOp?: "before" | "after" | "eq" | "between";
  fixedTime?: string;
  fixedTimeTo?: string;
  fixedTz?: TimezoneRef;
  fixedDayOffset?: number;
  fixedDayMode?: "calendar" | "business";
  fixedDayDirection?: "before" | "after";
}

export interface Checkpoint {
  id: string; checkpointTypeId: string; note?: string;
  match: CheckpointMatch;
  /** @deprecated nahrazeno sekcí „Kdy se má záznam objevit" (correctness). */
  expectedDurationHours?: number;
  /** @deprecated */
  warnAfterHours?: number;
  /** @deprecated */
  criticalAfterHours?: number;
  correctness: CheckpointCorrectness[];   // prázdné = jen "musí nastat"
}

export interface Segment {
  id: string;
  name: string;                 // „ČR → Paříž"
  description?: string;         // orientace: „Paříž → US hub, pro USA trasy"
  carriers: string[];           // service_provider (CarriersProviders)
  serviceTypes: string[];       // service_type (ServicesTypes: EXPRESS/ECONOMY)
  checkpoints: Checkpoint[];    // uspořádané
}

export interface Route {
  id: string; code: string; name: string; active: boolean;
  carriers: string[]; serviceTypes: string[]; destCountries: string[];
  segmentIds: string[];         // uspořádané odkazy na úseky
  destZone?: string[];          // volitelná jemnější zóna (stát / PSČ prefix)
}

export type Condition =
  | { kind: "field"; fieldId: string; operator: string; value?: string }
  | { kind: "tracking_aggregate"; trackingFieldId: string; valueMode: "same_repeats" | "specific"; expectedValue?: string; count: number; occurrence: "consecutive" | "any" }
  | { kind: "route_compliance"; mode: "checkpoint_type" | "general"; checkpointTypeId?: string; generalCheck?: "unrecognized_location" | "unrecognized_status" };

export type ActionType = "create_vkr" | "send_email" | "set_field" | "change_phase" | "update_vkr" | "add_note" | "request_field_from_operator";
export interface Action {
  id: string; type: ActionType;
  runWhenRouteCondition?: "fulfilled" | "not_fulfilled";
  title?: string; body?: string; fieldId?: string; value?: string; priority?: Priority;
  vkrText?: string; // Text věci k řešení (volitelný popis akce pro operátora)
}

export interface Rule {
  id: string; code: string; name: string; area: Area; active: boolean; priority: Priority;
  description?: string;
  trigger: { kind: TriggerKind; label: string };
  conditions: Condition[];
  actions: Action[];
  // Volitelný snapshot UI stavu z RuleCreatorPage, slouží k prefillu při editaci.
  uiState?: Record<string, unknown>;
}

export interface SampleActivity { status?: string; status_code?: string; location_city?: string; location_country_code?: string; location_postal_code?: string; latest?: boolean; status_datetime?: string }
export interface SampleShipment {
  id: string; label: string;
  carrier: string; service_type: string; country_import: string; state: string;
  dest_postal_code?: string; etd?: string; eta?: string;
  activities: SampleActivity[];
}
