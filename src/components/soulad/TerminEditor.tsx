import type { CheckpointCorrectness, Segment } from "@/lib/model/types";
import { AnchorPicker } from "./AnchorPicker";

const TIMEZONE_OPTIONS: { value: string; label: string }[] = [
  { value: "local", label: "Místní čas" },
  { value: "Europe/Prague", label: "Europe/Prague" },
  { value: "Europe/Berlin", label: "Europe/Berlin" },
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "America/New_York" },
];

function dnySlovo(n: number): string {
  if (n === 1) return "den";
  if (n >= 2 && n <= 4) return "dny";
  return "dní";
}

function fixedPreview(params: {
  anchorLabel: string;
  dayOffset: number;
  dayMode: "calendar" | "business";
  dayDirection: "before" | "after";
  time: string;
  tz: string;
}): string {
  const { anchorLabel, dayOffset, dayMode, dayDirection, time, tz } = params;
  const dayStr =
    dayOffset === 0
      ? `v den události „${anchorLabel}"`
      : `${dayOffset} ${dayMode === "business" ? "prac. " : ""}${dnySlovo(dayOffset)} ${dayDirection === "before" ? "před" : "po"} události „${anchorLabel}"`;
  return `nejpozději ${dayStr} v ${time} ${tz === "local" ? "místního času" : tz}`;
}

function offsetPreview(params: {
  anchorLabel: string;
  value: number;
  unit: "h" | "d" | "bd";
  direction: "before" | "after";
}): string {
  const { anchorLabel, value, unit, direction } = params;
  const unitLabel = unit === "d" ? "dní" : unit === "bd" ? "prac. dní" : "h";
  const dir = direction === "before" ? "před" : "po";
  return `nejpozději ${value} ${unitLabel} ${dir} události „${anchorLabel}"`;
}

export function TerminEditor({
  segment,
  currentCheckpointId,
  value,
  onChange,
}: {
  segment: Segment;
  currentCheckpointId?: string;
  value: CheckpointCorrectness;
  onChange: (next: CheckpointCorrectness) => void;
}) {
  const isFixed = value.mode !== "offset";
  const anchor = { anchorKind: value.anchorKind, anchorLabel: value.anchorLabel, anchorCheckpointTypeId: value.anchorCheckpointTypeId };

  // Jediné místo, kde se odvozují výchozí hodnoty — čtou z nich jak ovládací prvky, tak náhledová věta,
  // aby se nemohly rozejít (viz code review k TerminEditoru v2).
  const fixedDayOffset = value.fixedDayOffset ?? 0;
  const fixedDayMode = value.fixedDayMode ?? "calendar";
  const fixedDayDirection = value.fixedDayDirection ?? "after";
  const fixedTime = value.fixedTime ?? "08:00";
  const fixedTz = value.fixedTz ?? "local";
  const unit = value.unit ?? "h";
  const direction = value.direction ?? "after";
  const offsetValue = value.value ?? 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm font-semibold">Vlastní čas záznamu musí být nejpozději do</div>

      <div className="flex flex-col gap-1.5 text-xs">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="radio"
            checked={isFixed}
            onChange={() => onChange({ ...value, mode: "fixed" })}
            className="accent-primary"
          />
          v konkrétní den a čas
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="radio"
            checked={!isFixed}
            onChange={() => onChange({ ...value, mode: "offset" })}
            className="accent-primary"
          />
          s odstupem od události
        </label>
      </div>

      {isFixed ? (
        <div className="flex flex-col gap-3 rounded-md border border-border bg-muted/20 p-3">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Den</div>
            <AnchorPicker
              segment={segment}
              currentCheckpointId={currentCheckpointId}
              value={anchor}
              onChange={(next) => onChange({ ...value, ...next })}
            />
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              <span className="text-[10px] text-muted-foreground">Posun:</span>
              <input
                type="number"
                min={0}
                value={fixedDayOffset}
                onChange={(e) => onChange({ ...value, fixedDayOffset: Math.max(0, Number(e.target.value) || 0) })}
                className="w-14 rounded border border-border bg-background px-1.5 py-1 text-xs"
              />
              <span className="text-[10px] text-muted-foreground">dní</span>
              <select
                aria-label="typ dne posunu"
                value={fixedDayMode}
                onChange={(e) => onChange({ ...value, fixedDayMode: e.target.value as "calendar" | "business" })}
                className="rounded border border-border bg-background px-1.5 py-1 text-xs"
              >
                <option value="calendar">kalendářní</option>
                <option value="business">pracovní</option>
              </select>
              {fixedDayOffset > 0 && (
                <select
                  aria-label="směr posunu dne"
                  value={fixedDayDirection}
                  onChange={(e) => onChange({ ...value, fixedDayDirection: e.target.value as "before" | "after" })}
                  className="rounded border border-border bg-background px-1.5 py-1 text-xs"
                >
                  <option value="after">po</option>
                  <option value="before">před</option>
                </select>
              )}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Čas</div>
            <div className="flex flex-wrap items-center gap-1.5">
              <input
                type="time"
                aria-label="pevný čas"
                value={fixedTime}
                onChange={(e) => onChange({ ...value, fixedTime: e.target.value })}
                className="rounded border border-border bg-background px-2 py-1 text-xs"
              />
              <span className="text-[10px] text-muted-foreground">pásmo</span>
              <select
                aria-label="časové pásmo"
                value={fixedTz}
                onChange={(e) => onChange({ ...value, fixedTz: e.target.value })}
                className="rounded border border-border bg-background px-2 py-1 text-xs"
              >
                {TIMEZONE_OPTIONS.map((tz) => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 rounded-md border border-border bg-muted/20 p-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <input
              type="number"
              min={0}
              value={offsetValue}
              onChange={(e) => onChange({ ...value, value: Math.max(0, Number(e.target.value) || 0) })}
              className="w-14 rounded border border-border bg-background px-2 py-1 text-xs"
            />
            <select
              aria-label="jednotka posunu"
              value={unit}
              onChange={(e) => onChange({ ...value, unit: e.target.value as "h" | "d" | "bd" })}
              className="rounded border border-border bg-background px-2 py-1 text-xs"
            >
              <option value="h">h</option>
              <option value="d">dní</option>
              <option value="bd">prac. dní</option>
            </select>
            <select
              aria-label="směr posunu"
              value={direction}
              onChange={(e) => onChange({ ...value, direction: e.target.value as "before" | "after" })}
              className="rounded border border-border bg-background px-2 py-1 text-xs"
            >
              <option value="after">po</option>
              <option value="before">před</option>
            </select>
            <span className="text-[10px] text-muted-foreground">události:</span>
          </div>
          <AnchorPicker
            segment={segment}
            currentCheckpointId={currentCheckpointId}
            value={anchor}
            onChange={(next) => onChange({ ...value, ...next })}
          />
        </div>
      )}

      {value.anchorLabel && (
        <div className="flex items-start gap-1.5 rounded-md bg-primary-soft border border-primary/20 px-2.5 py-2 text-xs text-primary">
          <span className="mt-0.5">✓</span>
          <div>
            <div>
              {isFixed
                ? fixedPreview({
                    anchorLabel: value.anchorLabel,
                    dayOffset: fixedDayOffset,
                    dayMode: fixedDayMode,
                    dayDirection: fixedDayDirection,
                    time: fixedTime,
                    tz: fixedTz,
                  })
                : offsetPreview({
                    anchorLabel: value.anchorLabel,
                    value: offsetValue,
                    unit,
                    direction,
                  })}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {isFixed ? "Dřívější dny se započítávají automaticky." : "Může spadnout i na jiný den — to je v pořádku."}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
