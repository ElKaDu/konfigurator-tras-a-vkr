/**
 * Pomocné funkce pro popis trasy / checkpointu / pokročilých podmínek lidsky čitelně.
 */
import type {
  Checkpoint, Route, RouteZipRange,
  ProblemCondition, ConditionAnchor, DaySpec, OffsetSpec, CheckpointMatchFieldKey,
} from "@/lib/routes/types";
import { MATCH_FIELD_LABEL, SYSTEM_EVENT_LABEL } from "@/lib/routes/types";
import { findLabel, OBSERVED_CATALOG, type ObservedField } from "@/lib/routes/observedCatalog";

const UNIT_CS: Record<string, string> = {
  minutes: "min",
  hours: "h",
  days: "dní",
  business_days: "prac. dní",
};

function fmtOffset(o: OffsetSpec): string {
  const unit = UNIT_CS[o.unit] ?? o.unit;
  const suffix = o.dayMode === "business" && o.unit === "days" ? " (prac.)" : "";
  return `${o.value} ${unit}${suffix}`;
}

function tzLabel(tz?: string): string {
  if (!tz || tz === "destination_country") return " (TZ cílové země)";
  if (tz === "operator") return " (TZ operátora)";
  return ` (${tz})`;
}

const MATCH_LABEL: Record<string, { label: string; field?: ObservedField }> = {
  status: { label: "status", field: "status" },
  statusCode: { label: "status code", field: "statusCode" },
  statusDescription: { label: "popis statusu" },
  simplifiedDescription: { label: "zjednodušený popis" },
  statusType: { label: "typ statusu", field: "statusType" },
  exceptionCode: { label: "kód výjimky", field: "exceptionCode" },
  exceptionDescription: { label: "popis výjimky" },
  locationCity: { label: "město", field: "locationCity" },
  locationCountry: { label: "země", field: "locationCountry" },
  locationCountryCode: { label: "kód země", field: "locationCountryCode" },
  locationPostalCode: { label: "PSČ", field: "locationPostalCode" },
  locationProvinceCode: { label: "kraj/stát", field: "locationProvinceCode" },
  locationSlic: { label: "SLIC", field: "locationSlic" },
  locationType: { label: "typ lokace", field: "locationType" },
  locationId: { label: "ID lokace", field: "locationId" },
  ancillaryAction: { label: "ancillary akce", field: "ancillaryAction" },
  ancillaryActionDescription: { label: "popis ancillary akce" },
  ancillaryReason: { label: "ancillary důvod", field: "ancillaryReason" },
  ancillaryReasonDescription: { label: "popis ancillary důvodu" },
  eventId: { label: "event ID" },
  freeText: { label: "fulltext" },
};

export function describeMatchInline(m: Checkpoint["match"]): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(m)) {
    if (k === "zipMatchesDestination" || k === "latest") continue;
    if (!v || (Array.isArray(v) && v.length === 0)) continue;
    const def = MATCH_LABEL[k];
    if (!def) continue;
    if (Array.isArray(v)) {
      const items = v.map((val) => {
        const lbl = def.field ? findLabel(def.field, val) : undefined;
        return lbl ? `${val} (${lbl})` : val;
      });
      parts.push(`${def.label}: ${items.join(" / ")}`);
    } else {
      parts.push(`${def.label}: „${v}"`);
    }
  }
  if (m.zipMatchesDestination) parts.push("PSČ = cílové PSČ zásilky");
  if (m.latest === false) parts.push("i historické záznamy");
  return parts.length === 0 ? "(bez podmínky)" : parts.join(" • ");
}

export function isMatchEmpty(m: Checkpoint["match"]): boolean {
  return Object.values(m).every((v) => !v || (Array.isArray(v) && v.length === 0));
}

export function getObservedOptions(field: ObservedField) {
  return OBSERVED_CATALOG[field];
}

export function describeZipRanges(zips: RouteZipRange[] | undefined): string {
  if (!zips || zips.length === 0) return "";
  return zips
    .map((z) => {
      const range = z.prefix ?? `${z.from ?? ""}–${z.to ?? ""}`;
      return `${z.country} ${range}`.trim();
    })
    .join(", ");
}

export function routeSummary(r: Route): string {
  return `${r.carriers.join(", ")} · ${r.serviceTypes.join(", ")} · ${r.destCountries.join(", ")} · ${r.checkpoints.length} checkpointů`;
}

/* ============ Pokročilé podmínky ============ */

export function describeMatchField(f: CheckpointMatchFieldKey): string {
  return MATCH_FIELD_LABEL[f] ?? f;
}

function fmtTime(t: { hours: number; minutes: number }): string {
  return `${String(t.hours).padStart(2, "0")}:${String(t.minutes).padStart(2, "0")}`;
}

function fmtDayOffset(off?: { value: number; unit: "days" | "business_days"; dir: "+" | "-" }): string {
  if (!off || off.value === 0) return "";
  const u = off.unit === "business_days" ? "prac. dní" : "dní";
  return ` ${off.dir}${off.value} ${u}`;
}

function describeDaySpec(d: DaySpec, checkpoints: Checkpoint[]): string {
  if (d.kind === "fixed_date") return d.date || "(datum nevyplněno)";
  if (d.kind === "relative_field") return `pole „${d.fieldId || "?"}"${fmtDayOffset(d.offset)}`;
  if (d.kind === "relative_system") return `${SYSTEM_EVENT_LABEL[d.event]}${fmtDayOffset(d.offset)}`;
  const cp = checkpoints.find((c) => c.id === d.checkpointId);
  const lbl = cp ? `„${cp.label}"` : "(neznámý checkpoint)";
  const ref = d.kind === "relative_checkpoint_event_time" ? "času záznamu" : "vzniku záznamu";
  return `${ref} ${lbl}${fmtDayOffset(d.offset)}`;
}

function describeAnchor(a: ConditionAnchor, checkpoints: Checkpoint[]): string {
  if (a.kind === "checkpoint_record") {
    const cp = checkpoints.find((c) => c.id === a.checkpointId);
    const cpLbl = cp ? `„${cp.label}"` : "(neznámý checkpoint)";
    const ref = a.reference === "record_event_time" ? "času záznamu" : "záznamu";
    return `${fmtOffset(a.offset)} od ${ref} ${cpLbl}`;
  }
  if (a.kind === "system_event") {
    return `${fmtOffset(a.offset)} od ${SYSTEM_EVENT_LABEL[a.event]}`;
  }
  if (a.kind === "field_value") {
    const dir = a.direction === "before" ? "před" : "od";
    return `${fmtOffset(a.offset)} ${dir} hodnoty pole „${a.fieldId || "?"}"`;
  }
  const dayPart = a.day ? `, dne ${describeDaySpec(a.day, checkpoints)}` : "";
  return `${fmtTime(a.time)}${tzLabel(a.timezone)}${dayPart}`;
}

const ASPECT_LABEL = {
  record_created: "byl vytvořen",
  record_event_time: "má na sobě čas",
} as const;

const OPERATOR_LABEL = {
  within: "do",
  longer_than: "více než",
  exact: "přesně",
} as const;

export function describeProblemCondition(c: ProblemCondition, checkpoints: Checkpoint[]): string {
  const cp = checkpoints.find((x) => x.id === c.checkpointId);
  const cpLbl = cp ? `„${cp.label}"` : "(neznámý checkpoint)";
  if (c.kind === "checkpoint_not_met") {
    return `Checkpoint ${cpLbl} není splněn`;
  }
  return `Záznam shodující se s ${cpLbl} ${ASPECT_LABEL[c.aspect]} ${OPERATOR_LABEL[c.operator]} ${describeAnchor(c.anchor, checkpoints)}`;
}
