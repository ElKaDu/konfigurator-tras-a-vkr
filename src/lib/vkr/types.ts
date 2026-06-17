import type { TimezoneSpec, OffsetSpec } from "@/lib/routes/types";
export type { TimezoneSpec } from "@/lib/routes/types";

/** Kotva časového bodu (sdílený pojem mezi pravidly a problémovými podmínkami). */
export type TimingAnchor =
  | { kind: "shipment_created" }
  | { kind: "pickup_done" }
  | { kind: "checkpoint_fulfilled_at"; checkpointId: string };

export type FieldType = "text" | "number" | "datetime" | "enum" | "boolean" | "document" | "user" | "address";

export interface FieldDef {
  id: string;
  label: string;
  type: FieldType;
  category: string;
  enumValues?: string[];
  enumOptions?: Array<{ value: string; label: string }>;
  autocomplete?: boolean;
  unit?: string;
}

export type TriggerType = "schedule" | "condition_met" | "manual";

export type ScheduleMode = "once" | "daily" | "weekly" | "monthly" | "interval" | "relative_to_field";

export type MonthlyMode = "day_of_month" | "nth_weekday";
export type ScheduleEndMode = "never" | "after_n" | "on_date";
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type NthWeek = 1 | 2 | 3 | 4 | -1;

export type DayMode = "calendar" | "business";

/** Položka Plánu spuštění — pouze pevný denní čas.
 *  (Relativní offsety od checkpointu se řeší přes `condition_met` trigger
 *  + `field_state_duration` podmínku nad polem „Splnění checkpointu".) */
export interface ScheduleTimeItem {
  kind: "time_of_day";
  time: string; // "HH:MM"
  timezone?: TimezoneSpec;
}

export interface Schedule {
  mode: ScheduleMode;
  /** Kanonický seznam časových položek (pevné časy + relativní offsety na stejné úrovni). */
  times?: ScheduleTimeItem[];
  /** Globální TZ (přebírá se pro `time_of_day` položky bez vlastní TZ). */
  timezone?: TimezoneSpec;
  onceAt?: string;
  everyNDays?: number;
  /** `business` má smysl jen pro `days`-úrovňové opakování. */
  dayMode?: DayMode;
  everyNWeeks?: number;
  weekdays?: Weekday[];
  monthlyMode?: MonthlyMode;
  dayOfMonth?: number;
  nthWeek?: NthWeek;
  nthWeekday?: Weekday;
  everyNMonths?: number;
  intervalMinutes?: number;
  fieldId?: string;
  offsetMinutes?: number;
  /** Pro relative_to_field s polem `route.checkpoint_fulfilled_at` — který CP trasy se měří. */
  routeCheckpointId?: string;
  validFrom?: string;
  validTo?: string;
  endMode?: ScheduleEndMode;
  endAfterN?: number;
  endOnDate?: string;
}

export interface Trigger {
  type: TriggerType;
  schedule?: Schedule;
}

export type ConditionOperator =
  | "is_empty" | "is_not_empty"
  | "equals" | "not_equals" | "is_any_of" | "is_none_of"
  | "contains" | "not_contains" | "starts_with" | "ends_with"
  | "changed_to" | "changed_from_to" | "not_changed_since"
  | "gt" | "gte" | "lt" | "lte" | "between" | "compare_field"
  | "is" | "is_today" | "is_past" | "is_future"
  | "before" | "after" | "is_on_or_before" | "is_on_or_after" | "is_between"
  | "within_next" | "within_past"
  | "is_true" | "is_false";

export type SystemAnchorKey = "shipment_created" | "shipment_updated" | "order_created";
export type DateValueSource = "literal" | "today" | "field" | "system";
export type TextValueSource = "literal" | "field";

export type DurationAnchorKey =
  | "shipment_created" | "order_created" | "shipment_updated"
  | "field_last_update" | "field_datetime" | "today" | "literal_date";

export type StateOperator =
  | "any" | "is_empty" | "is_not_empty"
  | "equals" | "not_equals" | "is_any_of" | "is_none_of"
  | "is_true" | "is_false";

export type DurationDirection = "elapsed" | "remaining";

export type CheckpointConditionState =
  | "fulfilled"
  | "not_fulfilled"
  | "not_updated_for";

/** Varianta dropdownu „Soulad s trasou" v podmínce `route_compliance`. */
export type RouteCheckVariant =
  | "advanced_route_condition"   // 1 — výběr z Route.problems[]
  | "record_vs_checkpoint"       // 2 — Poslední/Jakýkoli záznam × odpovídá/neodpovídá/částečně
  | "general_compliance"         // 3 — Místo / status zásilky není na trase
  | "checkpoint_duration"        // 4 — Doba trvání CP > / < očekávaná
  | "field_value_repeated";      // 5 — Hodnota pole na > N záznamech

/** Pole `CheckpointMatch`, na která lze odkazovat ve VkŘ — duplicitně tu kvůli izolaci modulů. */
export type CheckpointMatchFieldKeyVkr =
  | "status" | "statusCode" | "statusDescription" | "simplifiedDescription" | "statusType"
  | "exceptionCode" | "exceptionDescription"
  | "locationCity" | "locationCountry" | "locationCountryCode"
  | "locationPostalCode" | "locationProvinceCode"
  | "locationSlic" | "locationType" | "locationId"
  | "ancillaryAction" | "ancillaryActionDescription"
  | "ancillaryReason" | "ancillaryReasonDescription"
  | "latest" | "eventId" | "zipMatchesDestination" | "freeText";


export interface Condition {
  id: string;
  kind: "field" | "document" | "tracking" | "customer" | "vkr" | "occurrence" | "special" | "field_state_duration" | "route_compliance" | "checkpoint";
  fieldId?: string;
  operator?: ConditionOperator;
  value?: string | number | boolean | string[];
  valueTo?: string | number;
  presetLabel?: string;
  presetKey?: string;
  numberMode?: "absolute" | "percent" | "field";
  compareFieldId?: string;
  timeMinutes?: number;
  /** Kalendářní vs. pracovní dny pro `within_*` / `not_changed_since`. */
  timeDayMode?: DayMode;
  valueFrom?: string;
  dateSource?: DateValueSource;
  textSource?: TextValueSource;
  systemAnchor?: SystemAnchorKey;
  offsetMinutes?: number;
  offsetDirection?: "before" | "after";
  /* === field_state_duration === */
  stateOperator?: StateOperator;
  stateValue?: string | string[];
  durationMinutes?: number;
  durationAnchor?: DurationAnchorKey;
  /** `business` = pracovní dny pro durationMinutes / unit `days`. */
  durationDayMode?: DayMode;
  anchorFieldId?: string;
  anchorLiteralDate?: string;
  durationDirection?: DurationDirection;
  /** Pro virtuální datetime pole `route.checkpoint_fulfilled_at` — odkaz na CP trasy. */
  routeCheckpointId?: string;
  /* === route_compliance === */
  /** Vybraná varianta. Default = "advanced_route_condition". */
  routeCheck?: RouteCheckVariant;
  /** Vybraná „Podmínka na trase" ze slovníku `problemTypes`. */
  problemTypeId?: string;
  /** Obecná kontrola souladu (vzájemně se vylučuje s `problemTypeId`). */
  generalCheck?: "unrecognized_location" | "unrecognized_status";
  /** Label checkpointu pro varianty 2 a 4. */
  checkpointLabel?: string;
  /** Rozsah pro variantu 2 (record_vs_checkpoint). */
  recordScope?: "last" | "any";
  /** Shoda pro variantu 2. */
  matchMode?: "matches" | "not_matches" | "partial";
  /** Pole pro variantu 2 — při `partial`. */
  partialFields?: CheckpointMatchFieldKeyVkr[];
  /** Porovnání u varianty 4 (doba trvání CP). */
  durationComparator?: "gt" | "lt";
  /** Sdílený práh `Checkpoint.expectedDuration[normal|critical]` pro variantu 4. */
  checkpointDurationThreshold?: "normal" | "critical";
  /** ID tracking pole pro variantu 5. */
  fieldValueTrackingFieldId?: string;
  /** Očekávaná hodnota pole pro variantu 5. */
  fieldValueExpected?: string;
  /** Počet záznamů (více než) pro variantu 5. */
  fieldValueCount?: number;
  /** Režim shody pro variantu 5. */
  fieldValueMode?: "any" | "consecutive";
  /* === checkpoint (standalone — deprecated, ponecháno jen kvůli typům) === */
  checkpointState?: CheckpointConditionState;
  checkpointDuration?: OffsetSpec;
}


export interface ConditionGroup {
  id: string;
  operator: "AND" | "OR";
  children: Array<Condition | ConditionGroup>;
}

export const isGroup = (n: Condition | ConditionGroup): n is ConditionGroup =>
  (n as ConditionGroup).children !== undefined;

export type ActionType = "create_vkr" | "send_email" | "set_field" | "change_phase" | "update_vkr" | "add_note" | "request_field_from_operator";

export type Priority = "low" | "medium" | "high" | "urgent";

/** Větvení akce podle vyhodnocení `route_compliance` podmínky. undefined = vždy. */
export type ActionRouteConditionResult = "fulfilled" | "not_fulfilled";

export interface Action {
  id: string;
  type: ActionType;
  title?: string;
  description?: string;
  priority?: Priority;
  assignMode?: "shipment_operator" | "specific_user" | "role" | "round_robin" | "customer_operator" | "content_specialist" | "unassigned";
  assignValue?: string;
  deduplicate?: boolean;
  toMode?: "shipment_operator" | "customer" | "specific_address" | "role";
  toValue?: string;
  subject?: string;
  body?: string;
  sendAsDraft?: boolean;
  fieldId?: string;
  fieldValue?: string;
  toPhase?: string;
  vkrNameContains?: string;
  newPriority?: Priority;
  comment?: string;
  noteText?: string;
  requestFieldId?: string;
  requestPrompt?: string;
  nextRuleHint?: string;
  /** Větvení akce podle vyhodnocení `route_compliance` podmínky. undefined = spustit vždy. */
  runWhenRouteCondition?: ActionRouteConditionResult;
  /** Akci spustit jen při některém z uvedených HH:MM časů z Plánu spuštění (≥ 2 časy). */
  runAtScheduleTime?: string[];
  /** Akci spustit jen pokud zároveň platí AND seznam podmínek nad polem zásilky. */
  runWhenField?: Array<{ fieldId: string; operator: ConditionOperator; value: string | string[] }>;
}

export interface Folder {
  id: string;
  code: string;
  name: string;
  description?: string;
}

export interface RunLogEntry {
  at: string;
  shipmentRef: string;
  conditionsMet: boolean;
  outcome: "vkr_created" | "throttled" | "deduplicated" | "condition_false_after_wait" | "error";
  detail?: string;
  /** Timestamp tracking eventu, který spustil běh (jen pokud běh přišel z eventu / route_compliance). */
  triggeringEventTimestamp?: string;
}

export interface RuleSkipIfPrior {
  ruleIds: string[];
  outcome: "any" | "positive" | "negative";
}

/** Volitelné aktivační okno pravidla — zatím jen toggle „jen pracovní dny". */
export interface RuleActiveWindow {
  businessDaysOnly: boolean;
}

export interface Rule {
  id: string;
  code: string;
  name: string;
  description?: string;
  active: boolean;
  archivedAt?: string;
  folderId: string;
  priority: number;
  trigger: Trigger;
  conditionGroup: ConditionGroup;
  actions: Action[];
  throttleHours?: number;
  skipIfPrior?: RuleSkipIfPrior;
  /** Volitelné aktivační okno (zatím jen „jen pracovní dny"). */
  activeWindow?: RuleActiveWindow;
  runs30d: number;
  lastRunAt?: string;
  history?: RunLogEntry[];
  createdAt: string;
  updatedAt: string;
}

