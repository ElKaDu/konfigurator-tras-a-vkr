import { Plus, X } from "lucide-react";

export type TrackingTimeSpec =
  | {
      mode: "absolute";
      day: { kind: "fixed_date" | "relative_field" | "relative_system" | "relative_checkpoint"; ref?: string; date?: string };
      time: string; // HH:MM
      tz: "destination" | "origin" | "fixed";
    }
  | {
      mode: "since_previous";
      offset: { value: number; unit: "min" | "h" | "d"; dir: "longer_than" | "within" };
    }
  | {
      mode: "since_matching";
      offset: { value: number; unit: "min" | "h" | "d"; dir: "longer_than" | "within" };
      anchorConditions: { id: string; field: string; operator: string; value: string }[];
    };

export const DEFAULT_TIME_SPEC: TrackingTimeSpec = {
  mode: "absolute",
  day: { kind: "fixed_date", date: "" },
  time: "10:00",
  tz: "destination",
};

const MODE_LABELS: { id: TrackingTimeSpec["mode"]; label: string }[] = [
  { id: "absolute", label: "Konkrétní čas" },
  { id: "since_previous", label: "Odstup od minulého záznamu" },
  { id: "since_matching", label: "Odstup od záznamu splňujícího podmínky" },
];

const DAY_KIND_LABELS: { id: string; label: string }[] = [
  { id: "fixed_date", label: "Pevné datum" },
  { id: "relative_field", label: "Relativně k poli zásilky" },
  { id: "relative_system", label: "Relativně k systémové události" },
  { id: "relative_checkpoint", label: "Relativně k checkpointu" },
];

const TRACKING_FIELDS_MINI = ["derivedStatus", "exceptionCode", "city", "countryCode", "locationId", "eventType"];
const OPS_MINI = ["je jedním z", "není žádným z", "obsahuje"];

export function TrackingTimeValueEditor({
  value,
  onChange,
}: {
  value: TrackingTimeSpec;
  onChange: (v: TrackingTimeSpec) => void;
}) {
  return (
    <div className="w-full rounded-lg border border-border bg-muted/30 p-2.5 space-y-2.5">
      <div className="flex flex-wrap gap-1">
        {MODE_LABELS.map((m) => {
          const active = value.mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onChange(switchMode(m.id, value))}
              className={
                "rounded border px-2 py-1 text-[11px] transition-colors " +
                (active
                  ? "border-primary bg-primary-soft/40 text-primary font-medium"
                  : "border-border bg-background text-muted-foreground hover:text-foreground")
              }
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {value.mode === "absolute" && <AbsoluteEditor value={value} onChange={onChange} />}
      {value.mode === "since_previous" && <OffsetEditor value={value} onChange={onChange} />}
      {value.mode === "since_matching" && <SinceMatchingEditor value={value} onChange={onChange} />}
    </div>
  );
}

function switchMode(mode: TrackingTimeSpec["mode"], prev: TrackingTimeSpec): TrackingTimeSpec {
  if (mode === prev.mode) return prev;
  if (mode === "absolute") return DEFAULT_TIME_SPEC;
  if (mode === "since_previous") return { mode, offset: { value: 2, unit: "h", dir: "longer_than" } };
  return { mode: "since_matching", offset: { value: 2, unit: "h", dir: "longer_than" }, anchorConditions: [{ id: "ac_" + Date.now(), field: "derivedStatus", operator: "je jedním z", value: "" }] };
}

function AbsoluteEditor({ value, onChange }: { value: Extract<TrackingTimeSpec, { mode: "absolute" }>; onChange: (v: TrackingTimeSpec) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] text-muted-foreground">Den:</span>
        <select
          value={value.day.kind}
          onChange={(e) => onChange({ ...value, day: { ...value.day, kind: e.target.value as never } })}
          className="rounded border border-border bg-background px-2 py-1 text-xs"
        >
          {DAY_KIND_LABELS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
        </select>
        {value.day.kind === "fixed_date" ? (
          <input
            type="date"
            value={value.day.date ?? ""}
            onChange={(e) => onChange({ ...value, day: { ...value.day, date: e.target.value } })}
            className="rounded border border-border bg-background px-2 py-1 text-xs"
          />
        ) : (
          <input
            value={value.day.ref ?? ""}
            onChange={(e) => onChange({ ...value, day: { ...value.day, ref: e.target.value } })}
            placeholder={value.day.kind === "relative_checkpoint" ? "CP …" : "pole / událost"}
            className="rounded border border-border bg-background px-2 py-1 text-xs min-w-[140px]"
          />
        )}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] text-muted-foreground">Čas:</span>
        <input
          type="time"
          value={value.time}
          onChange={(e) => onChange({ ...value, time: e.target.value })}
          className="rounded border border-border bg-background px-2 py-1 text-xs"
        />
        <select
          value={value.tz}
          onChange={(e) => onChange({ ...value, tz: e.target.value as never })}
          className="rounded border border-border bg-background px-2 py-1 text-xs"
        >
          <option value="destination">TZ cíle</option>
          <option value="origin">TZ odesílatele</option>
          <option value="fixed">Pevná TZ</option>
        </select>
      </div>
    </div>
  );
}

function OffsetEditor({ value, onChange }: { value: Extract<TrackingTimeSpec, { mode: "since_previous" }>; onChange: (v: TrackingTimeSpec) => void }) {
  const o = value.offset;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <select
        value={o.dir}
        onChange={(e) => onChange({ ...value, offset: { ...o, dir: e.target.value as never } })}
        className="rounded border border-border bg-background px-2 py-1 text-xs"
      >
        <option value="longer_than">déle než</option>
        <option value="within">do</option>
      </select>
      <input
        type="number"
        min={0}
        value={o.value}
        onChange={(e) => onChange({ ...value, offset: { ...o, value: Number(e.target.value) || 0 } })}
        className="w-16 rounded border border-border bg-background px-2 py-1 text-xs"
      />
      <select
        value={o.unit}
        onChange={(e) => onChange({ ...value, offset: { ...o, unit: e.target.value as never } })}
        className="rounded border border-border bg-background px-2 py-1 text-xs"
      >
        <option value="min">min</option>
        <option value="h">hod</option>
        <option value="d">dnů</option>
      </select>
      <span className="text-[11px] text-muted-foreground">od minulého záznamu</span>
    </div>
  );
}

function SinceMatchingEditor({ value, onChange }: { value: Extract<TrackingTimeSpec, { mode: "since_matching" }>; onChange: (v: TrackingTimeSpec) => void }) {
  const o = value.offset;
  function updateAnchor(id: string, patch: Partial<{ field: string; operator: string; value: string }>) {
    onChange({ ...value, anchorConditions: value.anchorConditions.map((r) => r.id === id ? { ...r, ...patch } : r) });
  }
  function addAnchor() {
    onChange({ ...value, anchorConditions: [...value.anchorConditions, { id: "ac_" + Date.now(), field: "derivedStatus", operator: "je jedním z", value: "" }] });
  }
  function removeAnchor(id: string) {
    if (value.anchorConditions.length <= 1) return;
    onChange({ ...value, anchorConditions: value.anchorConditions.filter((r) => r.id !== id) });
  }
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <select
          value={o.dir}
          onChange={(e) => onChange({ ...value, offset: { ...o, dir: e.target.value as never } })}
          className="rounded border border-border bg-background px-2 py-1 text-xs"
        >
          <option value="longer_than">déle než</option>
          <option value="within">do</option>
        </select>
        <input
          type="number"
          min={0}
          value={o.value}
          onChange={(e) => onChange({ ...value, offset: { ...o, value: Number(e.target.value) || 0 } })}
          className="w-16 rounded border border-border bg-background px-2 py-1 text-xs"
        />
        <select
          value={o.unit}
          onChange={(e) => onChange({ ...value, offset: { ...o, unit: e.target.value as never } })}
          className="rounded border border-border bg-background px-2 py-1 text-xs"
        >
          <option value="min">min</option>
          <option value="h">hod</option>
          <option value="d">dnů</option>
        </select>
        <span className="text-[11px] text-muted-foreground">od záznamu, který splňuje:</span>
      </div>
      <div className="rounded border border-dashed border-border bg-background p-2 space-y-1.5">
        {value.anchorConditions.map((row, idx) => (
          <div key={row.id}>
            {idx > 0 && (
              <div className="text-[10px] text-muted-foreground my-1">A</div>
            )}
            <div className="flex items-center gap-1.5 flex-wrap">
              <select
                value={row.field}
                onChange={(e) => updateAnchor(row.id, { field: e.target.value })}
                className="rounded border border-border bg-background px-2 py-1 text-xs"
              >
                {TRACKING_FIELDS_MINI.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
              <select
                value={row.operator}
                onChange={(e) => updateAnchor(row.id, { operator: e.target.value })}
                className="rounded border border-border bg-background px-2 py-1 text-xs"
              >
                {OPS_MINI.map((op) => <option key={op}>{op}</option>)}
              </select>
              <input
                value={row.value}
                onChange={(e) => updateAnchor(row.id, { value: e.target.value })}
                placeholder="hodnota…"
                className="flex-1 min-w-[100px] rounded border border-border bg-background px-2 py-1 text-xs"
              />
              <button
                onClick={() => removeAnchor(row.id)}
                disabled={value.anchorConditions.length <= 1}
                className="text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
        <button
          onClick={addAnchor}
          className="flex items-center gap-1 rounded border border-dashed border-border px-2 py-1 text-[11px] text-muted-foreground hover:border-primary hover:text-primary"
        >
          <Plus className="size-3" /> přidat podmínku
        </button>
      </div>
    </div>
  );
}
