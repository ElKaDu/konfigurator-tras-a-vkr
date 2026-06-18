export type Area = "tracking_records" | "route_compliance" | "order_eval" | "unpickup" | "params_price";

export type Priority = "low" | "medium" | "high" | "urgent";
export type TriggerKind = "condition_met" | "schedule" | "manual";

export interface CheckpointType { id: string; name: string; description?: string }

// Par-Ser snake_case match (podmnožina ParSerPackageActivityDetailSchema)
export interface CheckpointMatch {
  status?: string[]; status_code?: string[]; status_type?: string[];
  exception_code?: string[];
  location_country_code?: string[]; location_postal_code?: string[]; location_city?: string[]; location_type?: string[];
  latest?: boolean; zip_matches_destination?: boolean; free_text?: string;
}

export interface CheckpointCorrectness {
  id: string;
  aspect?: "record_created" | "record_event_time";
  operator: "within" | "longer_than" | "exact";
  // zjednodušená kotva pro mockup (Plán B sjednotí na TimeAnchor)
  anchorKind: "checkpoint" | "system_event" | "field" | "absolute_time";
  anchorLabel: string;            // lidský popis pro mockup
  value?: number; unit?: "h" | "d" | "bd";
  anchorCheckpointTypeId?: string; // id typu milníku, na který kotva ukazuje
  specificTime?: string;           // HH:MM — upřesnění času, jen pokud unit = d/bd
}

export interface Checkpoint {
  id: string; checkpointTypeId: string; note?: string;
  match: CheckpointMatch;
  expectedDurationHours?: number;
  warnAfterHours?: number;
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
}

export interface Rule {
  id: string; code: string; name: string; area: Area; active: boolean; priority: Priority;
  trigger: { kind: TriggerKind; label: string };
  conditions: Condition[];
  actions: Action[];
}

export interface SampleActivity { status?: string; status_code?: string; location_city?: string; location_country_code?: string; location_postal_code?: string; latest?: boolean; status_datetime?: string }
export interface SampleShipment {
  id: string; label: string;
  carrier: string; service_type: string; country_import: string; state: string;
  dest_postal_code?: string; etd?: string; eta?: string;
  activities: SampleActivity[];
}
