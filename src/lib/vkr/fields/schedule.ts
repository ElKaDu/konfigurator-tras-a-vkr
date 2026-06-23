import type { Schedule, Weekday } from "../types";

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  1: "Po", 2: "Út", 3: "St", 4: "Čt", 5: "Pá", 6: "So", 0: "Ne",
};
export const WEEKDAY_LABELS_LONG: Record<Weekday, string> = {
  1: "pondělí", 2: "úterý", 3: "středa", 4: "čtvrtek", 5: "pátek", 6: "sobota", 0: "neděle",
};
export const WEEKDAYS_ORDER: Weekday[] = [1, 2, 3, 4, 5, 6, 0];

export const SCHEDULE_MODE_LABELS: Record<Schedule["mode"], string> = {
  once: "Jednorázově",
  daily: "Denně",
  weekly: "Týdně",
  monthly: "Měsíčně",
  interval: "Každých N minut/hodin",
  relative_to_field: "Relativně k poli",
};

export const NTH_WEEK_LABELS: Record<string, string> = {
  "1": "1.", "2": "2.", "3": "3.", "4": "4.", "-1": "poslední",
};

function fmtDateTime(iso?: string): string {
  if (!iso) return "(nevyplněno)";
  try {
    const d = new Date(iso);
    return d.toLocaleString("cs-CZ", { day: "numeric", month: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch { return iso; }
}
function fmtDate(iso?: string): string {
  if (!iso) return "(nevyplněno)";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("cs-CZ");
  } catch { return iso; }
}

function formatRelativeMs(off: number): string {
  if (off === 0) return "v termínu milníku";
  const abs = Math.abs(off);
  const txt = abs >= 60 && abs % 60 === 0 ? `${abs / 60} h` : `${abs} min`;
  return off < 0 ? `${txt} před termínem milníku` : `${txt} po termínu milníku`;
}

export function describeSchedule(s?: Schedule, fieldLabelFn?: (id?: string) => string, checkpointLabelFn?: (id?: string) => string | undefined): string {
  if (!s) return "";
  const items = s.times ?? [];
  const fixedItems = items.filter((i): i is Extract<typeof i, { kind: "time_of_day" }> => i.kind === "time_of_day");
  const relItems = items.filter((i): i is Extract<typeof i, { kind: "relative_to_milestone_due" }> => i.kind === "relative_to_milestone_due");
  const fixedTimes = fixedItems.map((i) => i.time).sort();
  const relParts = relItems.map((i) => {
    const base = formatRelativeMs(i.offsetMinutes);
    return i.checkpointLabel ? `${base} „${i.checkpointLabel}"` : base;
  });
  const timeParts = [...fixedTimes, ...relParts];
  const time = timeParts.length ? timeParts.join(", ") : "08:00";
  const tz = s.timezone === "destination_country"
    ? " (TZ cílové země)"
    : s.timezone && s.timezone !== "operator"
      ? ` (${s.timezone})`
      : "";
  let core = "";
  switch (s.mode) {
    case "once":
      core = `Jednorázově ${fmtDateTime(s.onceAt)}`;
      break;
    case "daily": {
      const n = s.everyNDays ?? 1;
      const dayMode = s.dayMode === "business" ? " (prac.)" : "";
      core = n === 1 ? `Každý den${dayMode} v ${time}${tz}` : `Každých ${n} dní${dayMode} v ${time}${tz}`;
      break;
    }
    case "weekly": {
      const days = (s.weekdays ?? []).slice().sort((a, b) => WEEKDAYS_ORDER.indexOf(a) - WEEKDAYS_ORDER.indexOf(b));
      const dayLabels = days.length === 0 ? "(žádný den)" : days.map((d) => WEEKDAY_LABELS_LONG[d]).join(", ");
      const n = s.everyNWeeks ?? 1;
      core = n === 1 ? `Každý týden — ${dayLabels} v ${time}${tz}` : `Každých ${n} týdnů — ${dayLabels} v ${time}${tz}`;
      break;
    }
    case "monthly": {
      const n = s.everyNMonths ?? 1;
      const prefix = n === 1 ? "Každý měsíc" : `Každých ${n} měsíců`;
      if (s.monthlyMode === "nth_weekday") {
        const nth = NTH_WEEK_LABELS[String(s.nthWeek ?? 1)] ?? "1.";
        const wd = s.nthWeekday !== undefined ? WEEKDAY_LABELS_LONG[s.nthWeekday] : "(den)";
        core = `${prefix} — ${nth} ${wd} v ${time}${tz}`;
      } else {
        core = `${prefix} — ${s.dayOfMonth ?? 1}. den v ${time}${tz}`;
      }
      break;
    }
    case "interval": {
      const m = s.intervalMinutes ?? 60;
      const txt = m >= 60 && m % 60 === 0 ? `${m / 60} h` : `${m} min`;
      core = `Každých ${txt}`;
      break;
    }
    case "relative_to_field": {
      const baseLabel = fieldLabelFn?.(s.fieldId) ?? s.fieldId ?? "(pole)";
      const cpLabel = s.fieldId === "route.checkpoint_fulfilled_at"
        ? checkpointLabelFn?.(s.routeCheckpointId)
        : undefined;
      const fl = cpLabel ? `${baseLabel} „${cpLabel}"` : baseLabel;
      const off = s.offsetMinutes ?? 0;
      const dir = off < 0 ? "před" : "po";
      const abs = Math.abs(off);
      const txt = abs >= 60 && abs % 60 === 0 ? `${abs / 60} h` : `${abs} min`;
      core = off === 0 ? `Při dosažení ${fl}` : `${txt} ${dir} ${fl}`;
      break;
    }
  }
  const extras: string[] = [];
  if (s.validFrom) extras.push(`platí od ${fmtDate(s.validFrom)}`);
  if (s.validTo) extras.push(`platí do ${fmtDate(s.validTo)}`);
  if (s.endMode === "after_n" && s.endAfterN) extras.push(`konec po ${s.endAfterN} opakováních`);
  if (s.endMode === "on_date" && s.endOnDate) extras.push(`konec ${fmtDate(s.endOnDate)}`);
  return extras.length ? `${core} (${extras.join(", ")})` : core;
}
