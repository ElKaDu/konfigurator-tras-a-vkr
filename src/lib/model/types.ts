import type { VkrCondition } from "@/lib/vkr/vkrConditionCatalog";

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

/** Rozlišuje generický bod (jedna kontrola, hardcoded Situace "Problém na trase") od
 *  specializovaného typu "Dnešní doručení" (dva navazující scany, ADD brána, D-větvení). */
export type BodKind = "generic" | "dnesni_doruceni";

/** Kdy se má kontrola spustit — buď pevný čas, nebo posun v hodinách od Termínu (CheckpointCorrectness). */
export interface TimeLimit {
  mode: "absolute" | "offset";
  absoluteTime?: string;   // "HH:MM", jen mode "absolute"
  offsetHours?: number;    // posun v hodinách od Termínu, jen mode "offset"
}

/** Jeden fyzický scan uvnitř bodu "Dnešní doručení" — vlastní match + Termín (vlastní čas záznamu). */
export interface DnesniDoruceniScan {
  match: CheckpointMatch;
  deadline: CheckpointCorrectness;
}

/** Nastavení celého bodu "Dnešní doručení" — dva scany + tři časové limity.
 *  D (datum doručení od přepravce) se vyhodnocuje POUZE v konecnyLimitScan1 — viz
 *  docs/superpowers/specs/2026-07-17-dnesni-doruceni-bod-design.md §3.2. */
export interface DnesniDoruceniConfig {
  scan1: DnesniDoruceniScan;
  /** Kontrola 2 — jen u scan1. Posuzuje jen řádnost záznamu, D se tady nekontroluje. */
  limitProRadneZaznamy: TimeLimit;
  /** Kontrola 3 — jen u scan1. Tady se poprvé vyhodnocuje D. */
  konecnyLimitScan1: TimeLimit;
  scan2: DnesniDoruceniScan;
  /** Jednostupňové — jediná kontrola scan2, žádný Limit pro řádné záznamy. */
  konecnyLimitScan2: TimeLimit;
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

  /** NOVÉ — typ bodu, default "generic" pro zpětnou kompatibilitu se stávajícími seed daty. */
  kind?: BodKind;
  /** NOVÉ — jen kind "generic". Jediná kontrola bodu — Nesplněno vede na hardcoded Situaci "Problém na trase". */
  konecnyLimit?: TimeLimit;
  /** NOVÉ — jen kind "dnesni_doruceni". */
  dnesniDoruceni?: DnesniDoruceniConfig;
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
  | {
      kind: "tracking_aggregate";
      trackingFieldId: string;
      valueMode: "specific";
      expectedValue?: string;
      /** "contains" (default) = je, "not_contains" = není. */
      mode?: "contains" | "not_contains";
      /** "recent" = jen poslední záznam. "anywhere" = kdekoliv v historii. */
      scope: "recent" | "anywhere";
    }
  | { kind: "route_compliance"; mode: "checkpoint_type" | "general"; checkpointTypeId?: string; generalCheck?: "unrecognized_location" | "unrecognized_status" };

export type ActionType = "create_vkr" | "send_email" | "set_field" | "change_phase" | "update_vkr" | "add_note" | "request_field_from_operator";
export interface Action {
  id: string; type: ActionType;
  runWhenRouteCondition?: "fulfilled" | "not_fulfilled";
  title?: string; body?: string; fieldId?: string; value?: string; priority?: Priority;
  vkrText?: string; // Text věci k řešení (volitelný popis akce pro operátora)
  /** Pro akce vzniklé z katalogu Akcí (tracking_records) — odkaz na ActionTag. */
  actionTagId?: string;
}

export interface Rule {
  id: string; code: string; name: string; area: Area; priority: Priority;
  description?: string;
  trigger: { kind: TriggerKind; label: string };
  conditions: Condition[];
  actions: Action[];
  // Volitelný snapshot UI stavu z RuleCreatorPage, slouží k prefillu při editaci.
  uiState?: Record<string, unknown>;
  /** Odkaz na Situaci/Závažnost — jen pro klasifikaci a zobrazení. Needitovatelné po založení pravidla. */
  situationId?: string;
  severityId?: string;
}

// ---------------------------------------------------------------------------
// Situace / Závažnost / Akce
// ---------------------------------------------------------------------------

/** Jednoduchý tag z katalogu Akcí — zatím bez vlastního chování (viz spec 3.3). */
export interface ActionTag {
  id: string;
  label: string;
  icon?: string; // lucide icon name
}

/** Jedna akce přiřazená k závažnosti — výchozí text/podmínka pro tento kontext. */
export interface SeverityAction {
  id: string;
  actionTagId: string;
  description?: string;
  condition?: VkrCondition[];
}

/** Úroveň uvnitř Situace — nese výchozí šablonu VkŘ (název/popis VkŘ se propisují z Pravidla, ne odsud). */
export interface Severity {
  id: string;
  name: string;
  priority: Priority;
  actions: SeverityAction[];
}

/** Byznysová kategorie (např. "Nedoručeno"). */
export interface Situation {
  id: string;
  code: string;
  name: string;
  description?: string;
  area: Area;
  severities: Severity[];
}

export interface SampleActivity { status?: string; status_code?: string; location_city?: string; location_country_code?: string; location_postal_code?: string; latest?: boolean; status_datetime?: string }
export interface SampleShipment {
  id: string; label: string;
  carrier: string; service_type: string; country_import: string; state: string;
  dest_postal_code?: string; etd?: string; eta?: string;
  activities: SampleActivity[];
}
