import { Plus, Trash2, X, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  Checkpoint, RouteProblem, ProblemCondition, ConditionAnchor, DaySpec, DayOffset,
  TimeUnit, DayMode, TimezoneSpec, SystemEvent,
} from "@/lib/routes/types";
import { SYSTEM_EVENT_LABEL } from "@/lib/routes/types";
import { describeProblemCondition, describeZipRanges } from "@/lib/routes/describe";

import { ProblemTypeCombobox } from "./ProblemTypeCombobox";
import { TimezoneSelect } from "@/components/ui/timezone-select";
import { datetimeFields } from "@/lib/vkr/fields";

/** Jednotky v UI: pouze hod / dní / prac. dní (minuty schované). */
const UI_UNITS: Array<{ value: "h" | "d" | "bd"; label: string }> = [
  { value: "h", label: "hod" },
  { value: "d", label: "dní" },
  { value: "bd", label: "prac. dní" },
];

function toUiUnit(unit: TimeUnit, dayMode?: DayMode): "h" | "d" | "bd" {
  if (unit === "days" && dayMode === "business") return "bd";
  if (unit === "days" || unit === "business_days") return unit === "business_days" ? "bd" : "d";
  return "h";
}
function fromUiUnit(u: "h" | "d" | "bd"): { unit: TimeUnit; dayMode?: DayMode } {
  if (u === "h") return { unit: "hours" };
  if (u === "d") return { unit: "days", dayMode: "calendar" };
  return { unit: "days", dayMode: "business" };
}

function newAnchorForKind(kind: ConditionAnchor["kind"], checkpoints: Checkpoint[]): ConditionAnchor {
  if (kind === "checkpoint_record") {
    return {
      kind: "checkpoint_record",
      offset: { value: 2, unit: "hours" },
      reference: "record_event_time",
      checkpointId: checkpoints[0]?.id ?? "",
    };
  }
  if (kind === "system_event") {
    return { kind: "system_event", offset: { value: 1, unit: "hours" }, event: "shipment_pickup" };
  }
  if (kind === "field_value") {
    return { kind: "field_value", offset: { value: 1, unit: "hours" }, direction: "before", fieldId: "" };
  }
  return { kind: "absolute_time", time: { hours: 9, minutes: 0 }, timezone: "destination_country" };
}

export function ProblemsEditor({
  problems,
  checkpoints,
  onChange,
}: {
  problems: RouteProblem[] | undefined;
  checkpoints: Checkpoint[];
  onChange: (next: RouteProblem[]) => void;
}) {
  const list = problems ?? [];

  const update = (idx: number, patch: Partial<RouteProblem>) =>
    onChange(list.map((p, i) => i === idx ? { ...p, ...patch } : p));
  const remove = (idx: number) => onChange(list.filter((_, i) => i !== idx));
  const add = () => onChange([...list, { problemTypeId: "", logic: { operator: "AND", items: [] } }]);

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Definuj „pokročilé podmínky" — situace na trase, které znamenají problém pro VkŘ. Vyber existující podmínku ze slovníku
        (sdílený napříč trasami), nebo si vytvoř novou. Pak přidej dílčí podmínky nad checkpointy této trasy.
      </p>

      {list.map((problem, idx) => {
        const otherIds = list.filter((_, i) => i !== idx).map((p) => p.problemTypeId).filter(Boolean);
        return (
          <div key={idx} className="rounded-xl border border-border bg-muted/30 p-3">
            <div className="mb-2 flex items-start gap-2">
              <div className="flex-1">
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Podmínka na trase
                </div>
                <ProblemTypeCombobox
                  value={problem.problemTypeId || undefined}
                  onChange={(id) => update(idx, { problemTypeId: id })}
                  excludeIds={otherIds}
                />
              </div>
              <button
                onClick={() => remove(idx)}
                className="mt-5 rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                title="Odebrat tuto podmínku na trase"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>

            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Dílčí podmínky se splní, když</span>
              <div className="flex rounded-md border border-border bg-background p-0.5">
                {(["AND", "OR"] as const).map((op) => (
                  <button
                    key={op}
                    type="button"
                    onClick={() => update(idx, { logic: { ...problem.logic, operator: op } })}
                    className={cn(
                      "rounded px-2 py-0.5 font-semibold",
                      problem.logic.operator === op ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {op}
                  </button>
                ))}
              </div>
              <span className="text-muted-foreground">
                {problem.logic.operator === "AND" ? "všechny platí" : "alespoň jedna platí"}
              </span>
            </div>

            <div className="mt-2 space-y-1.5">
              {problem.logic.items.map((item, j) => (
                <ConditionRow
                  key={j}
                  cond={item}
                  checkpoints={checkpoints}
                  onChange={(c) => update(idx, { logic: { ...problem.logic, items: problem.logic.items.map((x, k) => k === j ? c : x) } })}
                  onCopy={() => update(idx, { logic: { ...problem.logic, items: [...problem.logic.items.slice(0, j + 1), { ...item }, ...problem.logic.items.slice(j + 1)] } })}
                  onDelete={() => update(idx, { logic: { ...problem.logic, items: problem.logic.items.filter((_, k) => k !== j) } })}
                />
              ))}
              {problem.logic.items.length === 0 && (
                <div className="rounded border border-dashed border-border p-2 text-center text-[11px] italic text-muted-foreground">
                  Přidej alespoň jednu dílčí podmínku.
                </div>
              )}
            </div>

            <div className="mt-2 flex gap-2">
              <button
                onClick={() => {
                  const firstCp = checkpoints[0];
                  if (!firstCp) return;
                  const c: ProblemCondition = { kind: "checkpoint_not_met", checkpointId: firstCp.id };
                  update(idx, { logic: { ...problem.logic, items: [...problem.logic.items, c] } });
                }}
                disabled={checkpoints.length === 0}
                className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:border-primary/40 hover:text-primary disabled:opacity-50"
              >
                <Plus className="size-3" /> Checkpoint není splněn
              </button>
              <button
                onClick={() => {
                  const firstCp = checkpoints[0];
                  if (!firstCp) return;
                  const c: ProblemCondition = {
                    kind: "checkpoint_time_constraint",
                    checkpointId: firstCp.id,
                    aspect: "record_created",
                    operator: "within",
                    anchor: newAnchorForKind("system_event", checkpoints),
                  };
                  update(idx, { logic: { ...problem.logic, items: [...problem.logic.items, c] } });
                }}
                disabled={checkpoints.length === 0}
                className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:border-primary/40 hover:text-primary disabled:opacity-50"
              >
                <Plus className="size-3" /> Časová podmínka na checkpointu
              </button>
            </div>
          </div>
        );
      })}

      <button
        onClick={add}
        className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:bg-primary-soft hover:text-primary"
      >
        <Plus className="size-3" /> Přidat podmínku na trase
      </button>
    </div>
  );
}

function ConditionRow({
  cond, checkpoints, onChange, onCopy, onDelete,
}: {
  cond: ProblemCondition;
  checkpoints: Checkpoint[];
  onChange: (c: ProblemCondition) => void;
  onCopy: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-md border border-border bg-background p-2">
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-muted-foreground">Záznam shodující se s checkpointem</span>
        <select
          value={cond.checkpointId}
          onChange={(e) => onChange({ ...cond, checkpointId: e.target.value })}
          className="rounded border border-border bg-background px-2 py-0.5 text-xs"
        >
          <option value="" disabled>Vyber checkpoint…</option>
          {checkpoints.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
              {c.appliesWhenDestZip && c.appliesWhenDestZip.length > 0 ? ` [${describeZipRanges(c.appliesWhenDestZip)}]` : ""}
            </option>
          ))}
        </select>

        {cond.kind === "checkpoint_time_constraint" ? (
          <>
            <select
              value={cond.aspect}
              onChange={(e) => onChange({ ...cond, aspect: e.target.value as typeof cond.aspect })}
              className="rounded border border-border bg-background px-2 py-0.5 text-xs"
            >
              <option value="record_created">byl vytvořen</option>
              <option value="record_event_time">má na sobě čas</option>
            </select>
            <select
              value={cond.operator}
              onChange={(e) => onChange({ ...cond, operator: e.target.value as typeof cond.operator })}
              className="rounded border border-border bg-background px-2 py-0.5 text-xs"
            >
              <option value="within">do</option>
              <option value="longer_than">více než</option>
              <option value="exact">přesně</option>
            </select>
          </>
        ) : (
          <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">není splněn</span>
        )}

        <div className="ml-auto flex items-center gap-0.5">
          <button onClick={onCopy} className="rounded p-1 text-muted-foreground hover:bg-muted" title="Kopírovat podmínku">
            <Copy className="size-3" />
          </button>
          <button onClick={onDelete} className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Smazat">
            <X className="size-3" />
          </button>
        </div>
      </div>

      {cond.kind === "checkpoint_time_constraint" && (
        <div className="mt-2 border-t border-dashed border-border pt-2">
          <AnchorEditor
            anchor={cond.anchor}
            checkpoints={checkpoints}
            onChange={(a) => onChange({ ...cond, anchor: a })}
          />
        </div>
      )}

      <div className="mt-1.5 text-[10px] italic text-muted-foreground">
        {describeProblemCondition(cond, checkpoints)}
      </div>
    </div>
  );
}

function AnchorEditor({
  anchor, checkpoints, onChange,
}: {
  anchor: ConditionAnchor;
  checkpoints: Checkpoint[];
  onChange: (a: ConditionAnchor) => void;
}) {
  const kinds: Array<{ v: ConditionAnchor["kind"]; label: string }> = [
    { v: "checkpoint_record", label: "Záznam checkpointu" },
    { v: "system_event", label: "Systémová událost" },
    { v: "field_value", label: "Hodnota v poli" },
    { v: "absolute_time", label: "Absolutní čas" },
  ];

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Kotva:</span>
        {kinds.map((k) => (
          <button
            key={k.v}
            type="button"
            onClick={() => { if (k.v !== anchor.kind) onChange(newAnchorForKind(k.v, checkpoints)); }}
            className={cn(
              "rounded-full border px-2 py-0.5 text-[11px]",
              anchor.kind === k.v ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/40",
            )}
          >
            {k.label}
          </button>
        ))}
      </div>

      {anchor.kind === "checkpoint_record" && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <OffsetInput value={anchor.offset} onChange={(o) => onChange({ ...anchor, offset: o })} />
          <span className="text-muted-foreground">od</span>
          <select
            value={anchor.reference}
            onChange={(e) => onChange({ ...anchor, reference: e.target.value as typeof anchor.reference })}
            className="rounded border border-border bg-background px-2 py-0.5 text-xs"
          >
            <option value="record_event_time">času záznamu</option>
            <option value="record_created">záznamu</option>
          </select>
          <span className="text-muted-foreground">záznamu shodujícího se s checkpointem</span>
          <select
            value={anchor.checkpointId}
            onChange={(e) => onChange({ ...anchor, checkpointId: e.target.value })}
            className="rounded border border-border bg-background px-2 py-0.5 text-xs"
          >
            <option value="" disabled>vyber…</option>
            {checkpoints.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
      )}

      {anchor.kind === "system_event" && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <OffsetInput value={anchor.offset} onChange={(o) => onChange({ ...anchor, offset: o })} />
          <span className="text-muted-foreground">od</span>
          <SystemEventSelect value={anchor.event} onChange={(ev) => onChange({ ...anchor, event: ev })} />
        </div>
      )}

      {anchor.kind === "field_value" && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <OffsetInput value={anchor.offset} onChange={(o) => onChange({ ...anchor, offset: o })} />
          <select
            value={anchor.direction}
            onChange={(e) => onChange({ ...anchor, direction: e.target.value as typeof anchor.direction })}
            className="rounded border border-border bg-background px-2 py-0.5 text-xs"
          >
            <option value="after">od</option>
            <option value="before">před</option>
          </select>
          <span className="text-muted-foreground">hodnoty pole</span>
          <DatetimeFieldSelect value={anchor.fieldId} onChange={(id) => onChange({ ...anchor, fieldId: id })} />
        </div>
      )}

      {anchor.kind === "absolute_time" && (
        <AbsoluteTimeEditor anchor={anchor} checkpoints={checkpoints} onChange={onChange} />
      )}
    </div>
  );
}

function OffsetInput({ value, onChange }: { value: { value: number; unit: TimeUnit; dayMode?: DayMode }; onChange: (o: { value: number; unit: TimeUnit; dayMode?: DayMode }) => void }) {
  const ui = toUiUnit(value.unit, value.dayMode);
  return (
    <>
      <input
        type="number"
        min={0}
        value={value.value}
        onChange={(e) => onChange({ ...value, value: Math.max(0, Number(e.target.value)) })}
        className="w-16 rounded border border-border bg-background px-1.5 py-0.5 text-right text-xs"
      />
      <select
        value={ui}
        onChange={(e) => {
          const next = fromUiUnit(e.target.value as "h" | "d" | "bd");
          onChange({ value: value.value, ...next });
        }}
        className="rounded border border-border bg-background px-2 py-0.5 text-xs"
      >
        {UI_UNITS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
      </select>
    </>
  );
}

function SystemEventSelect({ value, onChange }: { value: SystemEvent; onChange: (e: SystemEvent) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as SystemEvent)}
      className="rounded border border-border bg-background px-2 py-0.5 text-xs"
    >
      {(Object.keys(SYSTEM_EVENT_LABEL) as SystemEvent[]).map((k) => (
        <option key={k} value={k}>{SYSTEM_EVENT_LABEL[k]}</option>
      ))}
    </select>
  );
}

function DatetimeFieldSelect({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const fields = datetimeFields();
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded border border-border bg-background px-2 py-0.5 text-xs max-w-[280px]"
    >
      <option value="" disabled>vyber datetime pole…</option>
      {fields.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
    </select>
  );
}

function AbsoluteTimeEditor({
  anchor, checkpoints, onChange,
}: {
  anchor: Extract<ConditionAnchor, { kind: "absolute_time" }>;
  checkpoints: Checkpoint[];
  onChange: (a: ConditionAnchor) => void;
}) {
  const fmt = (t: { hours: number; minutes: number }) =>
    `${String(t.hours).padStart(2, "0")}:${String(t.minutes).padStart(2, "0")}`;
  const parse = (s: string) => {
    const [h, m] = s.split(":").map(Number);
    return { hours: h || 0, minutes: m || 0 };
  };
  const day = anchor.day;
  const setDay = (d: DaySpec | undefined) => onChange({ ...anchor, day: d });

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <input
          type="time"
          value={fmt(anchor.time)}
          onChange={(e) => onChange({ ...anchor, time: parse(e.target.value) })}
          className="rounded border border-border bg-background px-1.5 py-0.5 text-xs"
        />
        <TimezoneSelect
          includeOperator
          value={anchor.timezone}
          onChange={(tz) => onChange({ ...anchor, timezone: tz })}
        />
        {!day && (
          <button
            type="button"
            onClick={() => setDay({ kind: "fixed_date", date: "" })}
            className="rounded-md border border-dashed border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground hover:border-primary/40 hover:text-primary"
          >
            + dne
          </button>
        )}
        {day && (
          <button
            type="button"
            onClick={() => setDay(undefined)}
            className="rounded p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            title="Odebrat „dne"
          >
            <X className="size-3" />
          </button>
        )}
      </div>
      {day && (
        <div className="rounded border border-dashed border-border bg-muted/30 p-2">
          <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Typ dne</div>
          <DaySpecEditor value={day} checkpoints={checkpoints} onChange={setDay} />
        </div>
      )}
    </div>
  );
}

function DaySpecEditor({
  value, checkpoints, onChange,
}: {
  value: DaySpec;
  checkpoints: Checkpoint[];
  onChange: (d: DaySpec) => void;
}) {
  const setKind = (k: DaySpec["kind"]) => {
    if (k === value.kind) return;
    if (k === "fixed_date") onChange({ kind: "fixed_date", date: "" });
    else if (k === "relative_field") onChange({ kind: "relative_field", fieldId: "" });
    else if (k === "relative_system") onChange({ kind: "relative_system", event: "shipment_pickup" });
    else if (k === "relative_checkpoint_record") onChange({ kind: "relative_checkpoint_record", checkpointId: checkpoints[0]?.id ?? "" });
    else onChange({ kind: "relative_checkpoint_event_time", checkpointId: checkpoints[0]?.id ?? "" });
  };

  const kinds: Array<{ v: DaySpec["kind"]; label: string }> = [
    { v: "fixed_date", label: "Pevný den" },
    { v: "relative_field", label: "Hodnota pole" },
    { v: "relative_system", label: "Systémová událost" },
    { v: "relative_checkpoint_record", label: "Vznik záznamu CP" },
    { v: "relative_checkpoint_event_time", label: "Čas záznamu CP" },
  ];

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        {kinds.map((k) => (
          <button
            key={k.v}
            type="button"
            onClick={() => setKind(k.v)}
            className={cn(
              "rounded-full border px-2 py-0.5 text-[11px]",
              value.kind === k.v ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/40",
            )}
          >
            {k.label}
          </button>
        ))}
      </div>

      {value.kind === "fixed_date" && (
        <input
          type="date"
          value={value.date}
          onChange={(e) => onChange({ ...value, date: e.target.value })}
          className="rounded border border-border bg-background px-2 py-0.5 text-xs"
        />
      )}

      {value.kind === "relative_field" && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <DatetimeFieldSelect value={value.fieldId} onChange={(id) => onChange({ ...value, fieldId: id })} />
          <DayOffsetEditor value={value.offset} onChange={(off) => onChange({ ...value, offset: off })} />
        </div>
      )}

      {value.kind === "relative_system" && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <SystemEventSelect value={value.event} onChange={(ev) => onChange({ ...value, event: ev })} />
          <DayOffsetEditor value={value.offset} onChange={(off) => onChange({ ...value, offset: off })} />
        </div>
      )}

      {(value.kind === "relative_checkpoint_record" || value.kind === "relative_checkpoint_event_time") && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-muted-foreground">záznamu shodujícího se s checkpointem</span>
          <select
            value={value.checkpointId}
            onChange={(e) => onChange({ ...value, checkpointId: e.target.value })}
            className="rounded border border-border bg-background px-2 py-0.5 text-xs"
          >
            <option value="" disabled>vyber…</option>
            {checkpoints.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <DayOffsetEditor value={value.offset} onChange={(off) => onChange({ ...value, offset: off })} />
        </div>
      )}
    </div>
  );
}

function DayOffsetEditor({ value, onChange }: { value?: DayOffset; onChange: (o: DayOffset | undefined) => void }) {
  if (!value) {
    return (
      <button
        type="button"
        onClick={() => onChange({ value: 1, unit: "days", dir: "+" })}
        className="rounded-md border border-dashed border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground hover:border-primary/40 hover:text-primary"
      >
        + offset
      </button>
    );
  }
  return (
    <>
      <select
        value={value.dir}
        onChange={(e) => onChange({ ...value, dir: e.target.value as "+" | "-" })}
        className="rounded border border-border bg-background px-1.5 py-0.5 text-xs"
      >
        <option value="+">+</option>
        <option value="-">−</option>
      </select>
      <input
        type="number"
        min={0}
        value={value.value}
        onChange={(e) => onChange({ ...value, value: Math.max(0, Number(e.target.value)) })}
        className="w-14 rounded border border-border bg-background px-1.5 py-0.5 text-right text-xs"
      />
      <select
        value={value.unit}
        onChange={(e) => onChange({ ...value, unit: e.target.value as DayOffset["unit"] })}
        className="rounded border border-border bg-background px-2 py-0.5 text-xs"
      >
        <option value="days">dní</option>
        <option value="business_days">prac. dní</option>
      </select>
      <button
        type="button"
        onClick={() => onChange(undefined)}
        className="rounded p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        title="Bez offsetu"
      >
        <X className="size-3" />
      </button>
    </>
  );
}
