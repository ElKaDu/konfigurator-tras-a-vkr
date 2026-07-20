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

function fixedPreview(value: CheckpointCorrectness): string {
  const dayOffset = value.fixedDayOffset ?? 0;
  const dayStr =
    dayOffset === 0
      ? `v den události „${value.anchorLabel}"`
      : `${dayOffset} ${value.fixedDayMode === "business" ? "prac. " : ""}${dnySlovo(dayOffset)} ${value.fixedDayDirection === "before" ? "před" : "po"} události „${value.anchorLabel}"`;
  const tz = value.fixedTz ?? "local";
  return `nejpozději ${dayStr} v ${value.fixedTime ?? "08:00"} ${tz === "local" ? "místního času" : tz}`;
}

function offsetPreview(value: CheckpointCorrectness): string {
  const unitLabel = value.unit === "d" ? "dní" : value.unit === "bd" ? "prac. dní" : "h";
  const dir = value.direction === "before" ? "před" : "po";
  return `nejpozději ${value.value ?? 0} ${unitLabel} ${dir} události „${value.anchorLabel}"`;
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
                value={value.fixedDayOffset ?? 0}
                onChange={(e) => onChange({ ...value, fixedDayOffset: Math.max(0, Number(e.target.value) || 0) })}
                className="w-14 rounded border border-border bg-background px-1.5 py-1 text-xs"
              />
              <span className="text-[10px] text-muted-foreground">dní</span>
              <select
                aria-label="typ dne posunu"
                value={value.fixedDayMode ?? "calendar"}
                onChange={(e) => onChange({ ...value, fixedDayMode: e.target.value as "calendar" | "business" })}
                className="rounded border border-border bg-background px-1.5 py-1 text-xs"
              >
                <option value="calendar">kalendářní</option>
                <option value="business">pracovní</option>
              </select>
              {(value.fixedDayOffset ?? 0) > 0 && (
                <select
                  aria-label="směr posunu dne"
                  value={value.fixedDayDirection ?? "after"}
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
                value={value.fixedTime ?? "08:00"}
                onChange={(e) => onChange({ ...value, fixedTime: e.target.value })}
                className="rounded border border-border bg-background px-2 py-1 text-xs"
              />
              <span className="text-[10px] text-muted-foreground">pásmo</span>
              <select
                aria-label="časové pásmo"
                value={value.fixedTz ?? "local"}
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
              value={value.value ?? 0}
              onChange={(e) => onChange({ ...value, value: Math.max(0, Number(e.target.value) || 0) })}
              className="w-14 rounded border border-border bg-background px-2 py-1 text-xs"
            />
            <select
              aria-label="jednotka posunu"
              value={value.unit ?? "h"}
              onChange={(e) => onChange({ ...value, unit: e.target.value as "h" | "d" | "bd" })}
              className="rounded border border-border bg-background px-2 py-1 text-xs"
            >
              <option value="h">h</option>
              <option value="d">dní</option>
              <option value="bd">prac. dní</option>
            </select>
            <select
              aria-label="směr posunu"
              value={value.direction ?? "after"}
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
            <div>{isFixed ? fixedPreview(value) : offsetPreview(value)}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {isFixed ? "Dřívější dny se započítávají automaticky." : "Může spadnout i na jiný den — to je v pořádku."}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
