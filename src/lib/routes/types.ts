/**
 * Datový model obchodních tras + podpůrné typy pro checkpointy a pokročilé
 * podmínky na trase.
 *
 * Klíčová modelová rozhodnutí:
 *  - Trasa = pokrytí carrier × varianta přepravy × cílová země. PSČ NENÍ na trase.
 *  - PSČ se nastavuje na jednotlivých checkpointech.
 *  - Checkpoint NEMÁ `timing` ani „čas záznamu" — definuje jen „CO se musí stát" (Match).
 *  - Pokročilé podmínky na trase jsou jen 2 kindy:
 *      - `checkpoint_not_met` — checkpoint nebyl splněn
 *      - `checkpoint_time_constraint` — časová podmínka nad záznamem checkpointu,
 *        kotvená na záznam jiného checkpointu / systémovou událost /
 *        hodnotu pole / absolutní čas (volitelně „dne" s DaySpec).
 *  - `OffsetSpec` v UI nabízí pouze hod / dní / prac. dní.
 */

export type ID = string;

/** Co se musí v tracking eventu objevit, aby byl checkpoint splněn. Všechna pole = AND.
 *  Pokrývá `ParSerPackageActivityDetailSchema` BEZ časových polí — čas záznamu
 *  je vázán výhradně na pokročilé podmínky trasy. */
export interface CheckpointMatch {
  status?: string[];
  statusCode?: string[];
  statusDescription?: string;        // contains
  simplifiedDescription?: string;    // contains
  statusType?: string[];

  exceptionCode?: string[];
  exceptionDescription?: string;     // contains

  locationCity?: string[];
  locationCountry?: string[];
  locationCountryCode?: string[];
  locationPostalCode?: string[];
  locationProvinceCode?: string[];
  locationSlic?: string[];
  locationType?: string[];
  locationId?: string[];

  ancillaryAction?: string[];
  ancillaryActionDescription?: string;
  ancillaryReason?: string[];
  ancillaryReasonDescription?: string;

  /** Pouze aktuální aktivita (`latest = true`). Default v UI je true. */
  latest?: boolean;

  eventId?: string[];
  /** Shoda PSČ s cílovým PSČ zásilky (plná nebo prefix N číslic). */
  zipMatchesDestination?: { mode: "exact" | "prefix"; prefixLength?: number };
  freeText?: string;                 // fulltext nad celým eventem
}

/** Klíče polí z `CheckpointMatch`, na které lze odkazovat napříč UI. */
export type CheckpointMatchFieldKey =
  | "status" | "statusCode" | "statusDescription" | "simplifiedDescription" | "statusType"
  | "exceptionCode" | "exceptionDescription"
  | "locationCity" | "locationCountry" | "locationCountryCode"
  | "locationPostalCode" | "locationProvinceCode"
  | "locationSlic" | "locationType" | "locationId"
  | "ancillaryAction" | "ancillaryActionDescription"
  | "ancillaryReason" | "ancillaryReasonDescription"
  | "latest"
  | "eventId" | "zipMatchesDestination" | "freeText";


export type TimeUnit = "minutes" | "hours" | "days" | "business_days";
export type DayMode = "calendar" | "business";

/** Časový offset s explicitním kalendářním režimem. */
export interface OffsetSpec {
  value: number;
  unit: TimeUnit;
  /** Kalendářní vs. pracovní dny. */
  dayMode?: DayMode;
}

/** Sdílený typ pro výběr časové zóny napříč aplikací. */
export type TimezoneSpec =
  | "destination_country"
  | "current_location"
  | "UTC"
  | "operator"
  | string;

/** @deprecated alias zachovaný kvůli kompatibilitě. */
export type TimeZoneRef = TimezoneSpec;

export interface RouteZipRange {
  country: string;
  prefix?: string;
  from?: string;
  to?: string;
}

export function zipRangeKey(z: RouteZipRange): string {
  return `${z.country}|${z.prefix ?? ""}|${z.from ?? ""}|${z.to ?? ""}`;
}
export function zipRangesKey(zs: RouteZipRange[] | undefined): string {
  if (!zs || zs.length === 0) return "__ANY__";
  return [...zs].map(zipRangeKey).sort().join(";");
}
export function zipRangeLabel(z: RouteZipRange): string {
  if (z.prefix) return `${z.country} ${z.prefix}xx`;
  if (z.from || z.to) return `${z.country} ${z.from ?? ""}–${z.to ?? ""}`;
  return z.country;
}
export function zipRangesLabel(zs: RouteZipRange[] | undefined): string {
  if (!zs || zs.length === 0) return "Bez PSČ omezení";
  return zs.map(zipRangeLabel).join(" / ");
}

/** Checkpoint definuje jen „CO se musí stát" — žádný vlastní timing.
 *  `expectedDuration` je sdílený slovník prahů pro VkŘ pravidla. */
export interface Checkpoint {
  id: ID;
  label: string;
  match: CheckpointMatch;
  appliesWhenDestZip?: RouteZipRange[];
  /** Očekávaná doba trvání pobytu v checkpointu. */
  expectedDuration?: { normal: OffsetSpec; critical?: OffsetSpec };
}

/* ============================================================
 *  Pokročilé podmínky na trase
 * ============================================================ */

/** Systémové události použitelné jako kotva. */
export type SystemEvent =
  | "shipment_created"
  | "shipment_pickup"
  | "order_created"
  | "promised_delivery_at"
  | "carrier_announced_delivery_at";

export const SYSTEM_EVENT_LABEL: Record<SystemEvent, string> = {
  shipment_created: "vytvoření zásilky",
  shipment_pickup: "vyzvednutí zásilky",
  order_created: "vytvoření objednávky",
  promised_delivery_at: "avizované doručení zákazníkovi",
  carrier_announced_delivery_at: "doručení hlášené dopravcem",
};

/** Offset pro DaySpec (jen denní jednotky). */
export interface DayOffset {
  value: number;
  unit: "days" | "business_days";
  dir: "+" | "-";
}

/** „Typ dne" pro absolutní čas. */
export type DaySpec =
  | { kind: "fixed_date"; date: string } // YYYY-MM-DD
  | { kind: "relative_field"; fieldId: string; offset?: DayOffset }
  | { kind: "relative_system"; event: SystemEvent; offset?: DayOffset }
  | { kind: "relative_checkpoint_record"; checkpointId: ID; offset?: DayOffset }
  | { kind: "relative_checkpoint_event_time"; checkpointId: ID; offset?: DayOffset };

/** Kotva časové podmínky. */
export type ConditionAnchor =
  | {
      kind: "checkpoint_record";
      offset: OffsetSpec;
      /** „čas záznamu" (event time) vs „záznam" (created at) druhého checkpointu. */
      reference: "record_event_time" | "record_created";
      checkpointId: ID;
    }
  | { kind: "system_event"; offset: OffsetSpec; event: SystemEvent }
  | {
      kind: "field_value";
      offset: OffsetSpec;
      direction: "after" | "before";
      fieldId: string;
    }
  | {
      kind: "absolute_time";
      time: { hours: number; minutes: number };
      timezone: TimezoneSpec;
      day?: DaySpec;
    };

export type ProblemCondition =
  /** Checkpoint vůbec nebyl splněn. */
  | { kind: "checkpoint_not_met"; checkpointId: ID }
  /** Časová podmínka nad záznamem checkpointu A vůči kotvě. */
  | {
      kind: "checkpoint_time_constraint";
      checkpointId: ID;
      /** Co se sleduje: čas vytvoření záznamu / čas, který má sám na sobě. */
      aspect: "record_created" | "record_event_time";
      /** Vztah: do / více než / přesně. */
      operator: "within" | "longer_than" | "exact";
      anchor: ConditionAnchor;
    };

/** Instance pokročilé podmínky na konkrétní trase. */
export interface RouteProblem {
  problemTypeId: ID;
  logic: { operator: "AND" | "OR"; items: ProblemCondition[] };
}

export interface Route {
  id: ID;
  code: string;
  name: string;
  description?: string;
  active: boolean;
  archivedAt?: string;
  carriers: string[];
  serviceTypes: string[];
  destCountries: string[];
  checkpoints: Checkpoint[];
  /** Pojmenované pokročilé podmínky odkazující do slovníku `problemTypes`. */
  problems?: RouteProblem[];
  parentRouteId?: ID;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/** Varianty přepravy. */
export const TRANSPORT_VARIANTS = [
  { value: "Express", label: "Express" },
  { value: "Economy", label: "Economy" },
  { value: "Pallet", label: "Pallet" },
  { value: "Freight", label: "Freight" },
];

export interface RouteSignature {
  carrier: string;
  serviceType: string;
  destCountry: string;
}

export function expandSignatures(r: Pick<Route, "carriers" | "serviceTypes" | "destCountries">): RouteSignature[] {
  const out: RouteSignature[] = [];
  for (const c of r.carriers) for (const s of r.serviceTypes) for (const d of r.destCountries) {
    out.push({ carrier: c, serviceType: s, destCountry: d });
  }
  return out;
}

export function signatureKey(s: RouteSignature) {
  return `${s.carrier}|${s.serviceType}|${s.destCountry}`;
}

export function findSignatureCollisions(
  candidate: Pick<Route, "carriers" | "serviceTypes" | "destCountries"> & { parentRouteId?: ID },
  others: Route[],
  ignoreId?: ID,
): Array<{ route: Route; signature: RouteSignature }> {
  if (candidate.parentRouteId) return [];
  const candKeys = new Map(expandSignatures(candidate).map((s) => [signatureKey(s), s]));
  const collisions: Array<{ route: Route; signature: RouteSignature }> = [];
  for (const r of others) {
    if (ignoreId && r.id === ignoreId) continue;
    if (r.archivedAt) continue;
    if (r.parentRouteId) continue;
    for (const s of expandSignatures(r)) {
      const k = signatureKey(s);
      if (candKeys.has(k)) collisions.push({ route: r, signature: s });
    }
  }
  return collisions;
}

export function getVariants(parentId: ID, all: Route[]): Route[] {
  return all.filter((r) => r.parentRouteId === parentId && !r.archivedAt);
}

export function getMainRoutes(all: Route[]): Route[] {
  return all.filter((r) => !r.parentRouteId);
}

export interface ZipScenario {
  key: string;
  label: string;
  ranges: RouteZipRange[] | undefined;
}
export function listZipScenarios(checkpoints: Checkpoint[]): ZipScenario[] {
  const seen = new Map<string, ZipScenario>();
  seen.set("__ANY__", { key: "__ANY__", label: "Bez PSČ omezení", ranges: undefined });
  for (const cp of checkpoints) {
    const k = zipRangesKey(cp.appliesWhenDestZip);
    if (k === "__ANY__") continue;
    if (!seen.has(k)) seen.set(k, { key: k, label: zipRangesLabel(cp.appliesWhenDestZip), ranges: cp.appliesWhenDestZip });
  }
  return [...seen.values()];
}

/** Labely pro pole z `CheckpointMatch` — používá UI a `describe`. */
export const MATCH_FIELD_LABEL: Record<CheckpointMatchFieldKey, string> = {
  status: "Status",
  statusCode: "Status code",
  statusDescription: "Popis statusu",
  simplifiedDescription: "Zjednodušený popis",
  statusType: "Typ statusu",
  exceptionCode: "Exception code",
  exceptionDescription: "Popis výjimky",
  locationCity: "Město",
  locationCountry: "Země (název)",
  locationCountryCode: "Kód země (ISO2)",
  locationPostalCode: "PSČ lokace",
  locationProvinceCode: "Kraj / stát",
  locationSlic: "Hub SLIC",
  locationType: "Typ lokace",
  locationId: "ID lokace",
  ancillaryAction: "Ancillary — akce",
  ancillaryActionDescription: "Ancillary — popis akce",
  ancillaryReason: "Ancillary — důvod",
  ancillaryReasonDescription: "Ancillary — popis důvodu",
  latest: "Pouze aktuální (latest)",
  eventId: "Event ID",
  zipMatchesDestination: "PSČ = cílové PSČ",
  freeText: "Fulltext",
};

/** Která pole má daný `CheckpointMatch` vyplněná. */
export function filledMatchFields(m: CheckpointMatch): CheckpointMatchFieldKey[] {
  const out: CheckpointMatchFieldKey[] = [];
  const has = (v: unknown) => Array.isArray(v) ? v.length > 0 : v !== undefined && v !== "" && v !== null;
  const keys: CheckpointMatchFieldKey[] = [
    "status", "statusCode", "statusDescription", "simplifiedDescription", "statusType",
    "exceptionCode", "exceptionDescription",
    "locationCity", "locationCountry", "locationCountryCode",
    "locationPostalCode", "locationProvinceCode",
    "locationSlic", "locationType", "locationId",
    "ancillaryAction", "ancillaryActionDescription",
    "ancillaryReason", "ancillaryReasonDescription",
    "eventId", "freeText",
  ];
  for (const k of keys) {
    if (has((m as Record<string, unknown>)[k])) out.push(k);
  }
  if (m.latest !== undefined) out.push("latest");
  if (m.zipMatchesDestination) out.push("zipMatchesDestination");
  return out;
}
