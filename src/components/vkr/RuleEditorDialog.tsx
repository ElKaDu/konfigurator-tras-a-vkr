import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, X, Clock, Database, Percent, Hash, Link2, Calendar, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { rulesStore } from "@/lib/vkr/store";
import { FIELDS, fieldById, operatorsForType, TRIGGER_LABELS, ACTION_LABELS, TIME_PRESETS, formatMinutes, datetimeFields, SYSTEM_ANCHORS, OFFSET_UNITS, NO_VALUE_OPS, getEnumOptions, stateOperatorsForType, DURATION_ANCHORS, WEEKDAY_LABELS, WEEKDAYS_ORDER, describeSchedule } from "@/lib/vkr/fields";
import { FOLDERS } from "@/lib/vkr/mockData";
import type { Action, Condition, ConditionGroup, Rule, Schedule, ScheduleTimeItem, ScheduleMode, Trigger, Weekday, DayMode, ConditionOperator, CheckpointConditionState } from "@/lib/vkr/types";
import { isGroup } from "@/lib/vkr/types";
import { TimezoneSelect } from "@/components/ui/timezone-select";
import { AIWizard } from "./AIWizard";
import type { AISuggestion } from "@/lib/vkr/aiSuggest.functions";


const uid = () => `id_${Math.random().toString(36).slice(2, 10)}`;

function applySuggestionToDraft(draft: Rule, s: AISuggestion): Rule {
  const folder = FOLDERS.find((f) => f.id === s.folderId);
  return {
    ...draft,
    name: s.name || draft.name,
    description: s.description || draft.description,
    folderId: folder ? s.folderId : draft.folderId,
    priority: s.priority ?? draft.priority,
    code: folder ? `${folder.code}${Math.floor(Math.random() * 90 + 10)}` : draft.code,
    trigger: mapSuggestionTrigger(s.trigger),
    conditionGroup: {
      id: uid(),
      operator: s.conditionGroup.operator,
      children: s.conditionGroup.children.map((c) =>
        "kind" in c
          ? { id: uid(), kind: "field" as const, fieldId: c.fieldId, operator: c.operator as Condition["operator"], value: c.value as Condition["value"] }
          : {
              id: uid(),
              operator: c.operator,
              children: c.children.map((cc) => ({
                id: uid(),
                kind: "field" as const,
                fieldId: cc.fieldId,
                operator: cc.operator as Condition["operator"],
                value: cc.value as Condition["value"],
              })),
            },
      ),
    },
    actions: s.actions.map((a) => ({ id: uid(), ...a } as Action)),
    updatedAt: new Date().toISOString(),
  };
}

export function RuleEditorDialog({
  open,
  rule,
  folderId,
  onClose,
}: {
  open: boolean;
  rule: Rule | null;
  folderId: string;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Rule | null>(null);

  useEffect(() => {
    if (!open) return;
    setDraft(
      rule ?? {
        id: uid(),
        code: "N" + Math.floor(Math.random() * 90 + 10),
        name: "",
        description: "",
        active: true,
        folderId,
        priority: 100,
        trigger: { type: "condition_met" },
        conditionGroup: { id: uid(), operator: "AND", children: [] },
        actions: [{ id: uid(), type: "create_vkr", title: "Nová věc k řešení", priority: "medium", assignMode: "shipment_operator", deduplicate: true }],
        runs30d: 0,
        history: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    );
  }, [open, rule, folderId]);

  if (!draft) return null;

  const save = () => {
    rulesStore.upsert(draft);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden p-0">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle className="text-lg">{rule ? "Upravit pravidlo" : "Nové pravidlo"}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[calc(90vh-130px)] space-y-6 overflow-y-auto px-6 py-5">
          <AIWizard onApply={(s) => setDraft((d) => (d ? applySuggestionToDraft(d, s) : d))} />


          {/* Sekce 1 */}
          <SectionHeader number={1} title="Základní informace" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Název" full>
              <input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className="input"
                placeholder="Např. Chybí plná moc"
              />
            </Field>
            <Field label="Popis" full>
              <textarea
                value={draft.description ?? ""}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                className="input min-h-[60px]"
              />
            </Field>
            <Field label="Aktivní">
              <select
                value={draft.active ? "1" : "0"}
                onChange={(e) => setDraft({ ...draft, active: e.target.value === "1" })}
                className="input"
              >
                <option value="1">Ano</option>
                <option value="0">Ne</option>
              </select>
            </Field>
          </div>


          {/* Sekce 2 — trigger */}
          <SectionHeader number={2} title="Spouštěč" />
          <div className="space-y-3">
            <select
              value={draft.trigger.type}
              onChange={(e) => {
                const type = e.target.value as Trigger["type"];
                setDraft({
                  ...draft,
                  trigger:
                    type === "schedule"
                      ? { type, schedule: draft.trigger.schedule ?? { mode: "daily", times: [{ kind: "time_of_day", time: "08:00" }], everyNDays: 1 } }
                      : { type },
                });
              }}
              className="input"
            >
              {Object.entries(TRIGGER_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>

            {draft.trigger.type === "condition_met" && (
              <div className="rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                Pravidlo se vyhodnotí při každé změně dat — definujte níže <strong className="text-foreground">kdy přesně</strong> se má splnit (sekce Podmínky).
              </div>
            )}

            {draft.trigger.type === "manual" && (
              <div className="rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                Pravidlo spustí operátor ručně tlačítkem. Podmínky se vyhodnotí v okamžiku spuštění.
              </div>
            )}

            {draft.trigger.type === "schedule" && (
              <ScheduleEditor
                schedule={draft.trigger.schedule ?? { mode: "daily", times: [{ kind: "time_of_day", time: "08:00" }], everyNDays: 1 }}
                onChange={(s) => setDraft({ ...draft, trigger: { type: "schedule", schedule: s } })}
              />
            )}
          </div>

          {/* Aktivační okno — toggle „jen pracovní dny" */}
          <ActiveWindowEditor rule={draft} onChange={(patch) => setDraft({ ...draft, ...patch })} />

          {/* Přeskočit běh — užitečné u plánu s více časy během dne / relativních spuštění */}
          <SkipIfPriorEditor rule={draft} onChange={(patch) => setDraft({ ...draft, ...patch })} />


          {/* Sekce 3 — podmínky */}
          <SectionHeader number={3} title="Podmínky" />
          <ConditionBuilder
            group={draft.conditionGroup}
            onChange={(g) => setDraft({ ...draft, conditionGroup: g })}
          />

          {/* Sekce 5 — akce */}
          <SectionHeader number={5} title="Akce" />
          <ActionsEditor
            actions={draft.actions}
            scheduleTimes={(draft.trigger?.schedule?.times ?? []).map((t) => t.time).filter(Boolean)}
            hasRouteCompliance={{
              any: hasRouteComplianceCondition(draft.conditionGroup),
              generalCheck: isGeneralCheckRouteCompliance(draft.conditionGroup),
            }}
            onChange={(a) => setDraft({ ...draft, actions: a })}
          />
        </div>

        <div className="flex items-center justify-between border-t border-border bg-muted/30 px-6 py-3">
          <div className="text-xs text-muted-foreground">
            {draft.actions.length} akce · {countConditions(draft.conditionGroup)} podmínek
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted">
              Zrušit
            </button>
            <button
              onClick={save}
              disabled={!draft.name}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
            >
              Uložit pravidlo
            </button>
          </div>
        </div>

        <style>{`.input{width:100%;border:1px solid hsl(var(--border));background:var(--color-background);border-radius:0.5rem;padding:0.5rem 0.75rem;font-size:0.875rem;outline:none;}
        .input:focus{border-color:var(--color-primary);box-shadow:0 0 0 2px color-mix(in oklab, var(--color-primary) 18%, transparent);}
        `}</style>
      </DialogContent>
    </Dialog>
  );
}

function SectionHeader({ number, title }: { number: number; title: string }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <span className="grid size-6 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{number}</span>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">{title}</h3>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <label className={cn("flex flex-col gap-1", full && "col-span-2")}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function FieldSelect({ value, onChange }: { value?: string; onChange: (id: string) => void }) {
  return (
    <select value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="input">
      <option value="" disabled>Vyberte pole…</option>
      {Array.from(new Set(FIELDS.map((f) => f.category))).map((cat) => (
        <optgroup key={cat} label={cat}>
          {FIELDS.filter((f) => f.category === cat).map((f) => (
            <option key={f.id} value={f.id}>{f.label}</option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

/* ----------- Condition builder ----------- */
function ConditionBuilder({ group, onChange }: { group: ConditionGroup; onChange: (g: ConditionGroup) => void }) {
  return <GroupEditor node={group} onChange={onChange} depth={0} onDelete={null} />;
}

function GroupEditor({
  node,
  onChange,
  onDelete,
  depth,
}: {
  node: ConditionGroup;
  onChange: (g: ConditionGroup) => void;
  onDelete: (() => void) | null;
  depth: number;
}) {
  const update = (children: Array<Condition | ConditionGroup>) => onChange({ ...node, children });

  return (
    <div className={cn("rounded-xl border border-border bg-muted/30 p-3", depth > 0 && "bg-muted/50")}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex rounded-md bg-background p-0.5 text-xs font-semibold">
            {(["AND", "OR"] as const).map((op) => (
              <button
                key={op}
                onClick={() => onChange({ ...node, operator: op })}
                className={cn(
                  "rounded px-3 py-1 transition-colors",
                  node.operator === op ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {op}
              </button>
            ))}
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {node.operator === "AND" ? "Všechny podmínky musí platit" : "Alespoň jedna musí platit"}
          </span>
        </div>
        {onDelete && (
          <button onClick={onDelete} className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>

      <div className="space-y-2">
        {node.children.map((child, i) => {
          const onChildChange = (next: Condition | ConditionGroup) =>
            update(node.children.map((c, idx) => (idx === i ? next : c)));
          const onChildDelete = () => update(node.children.filter((_, idx) => idx !== i));
          if (isGroup(child)) {
            return <GroupEditor key={child.id} node={child} onChange={onChildChange} onDelete={onChildDelete} depth={depth + 1} />;
          }
          return <LeafEditor key={child.id} cond={child} onChange={onChildChange} onDelete={onChildDelete} />;
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={() =>
            update([...node.children, { id: uid(), kind: "field", fieldId: "phase", operator: "equals", value: "" }])
          }
          className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:bg-primary-soft hover:text-primary"
        >
          <Plus className="size-3" /> Podmínka
        </button>
        {/* „Stav po dobu" tlačítko odstraněno z UI — existující instance se nadále editují přes StateDurationEditor. */}
        <button
          onClick={() =>
            update([
              ...node.children,
              {
                id: uid(),
                kind: "route_compliance",
                routeCheck: "advanced_route_condition",
              },
            ])
          }
          className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:bg-primary-soft hover:text-primary"
          title="Soulad s definovanou obchodní trasou"
        >
          <Link2 className="size-3" /> Soulad s trasou
        </button>
        {/* Standalone „Stav checkpointu" — odstraněno; přesunuto do varianty 1 podmínky „Soulad s trasou". */}

        {depth < 2 && (
          <button
            onClick={() => update([...node.children, { id: uid(), operator: "AND", children: [] }])}
            className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:bg-primary-soft hover:text-primary"
          >
            <Plus className="size-3" /> Skupina
          </button>
        )}
      </div>
    </div>
  );
}

function LeafEditor({

  cond,
  onChange,
  onDelete,
}: {
  cond: Condition;
  onChange: (c: Condition) => void;
  onDelete: () => void;
}) {
  if (cond.kind === "field_state_duration") {
    return <StateDurationEditor cond={cond} onChange={onChange} onDelete={onDelete} />;
  }
  if (cond.kind === "route_compliance") {
    return <RouteComplianceEditor cond={cond} onChange={onChange} onDelete={onDelete} />;
  }
  if (cond.kind === "checkpoint") {
    return <CheckpointConditionEditor cond={cond} onChange={onChange} onDelete={onDelete} />;
  }
  const field = fieldById(cond.fieldId);
  const effectiveType = field?.type;
  const ops = operatorsForType(effectiveType);
  const noValue = NO_VALUE_OPS.has(cond.operator ?? "");

  return (
    <div className="rounded-lg border border-border bg-background p-2.5">
      {/* Řádek: pole + operátor + delete */}
      <div className="flex flex-wrap items-center gap-2">
        <FieldSelect value={cond.fieldId} onChange={(id) => {
          const f = fieldById(id);
          const nextOps = operatorsForType(f?.type);
          onChange({ ...cond, fieldId: id, operator: (nextOps[0]?.value as Condition["operator"]) ?? undefined, value: "", valueTo: undefined, valueFrom: undefined, timeMinutes: undefined, numberMode: undefined, compareFieldId: undefined, dateSource: undefined, textSource: undefined, systemAnchor: undefined, offsetMinutes: undefined, offsetDirection: undefined });
        }} />

        <select
          value={cond.operator ?? ""}
          onChange={(e) => onChange({ ...cond, operator: e.target.value as Condition["operator"], value: "", valueTo: undefined, timeMinutes: undefined, dateSource: undefined })}
          className="input max-w-[240px] border-primary/40 font-medium text-primary"
        >
          <option value="" disabled>Operátor…</option>
          {ops.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
        </select>
        <button onClick={onDelete} className="ml-auto rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
          <X className="size-3.5" />
        </button>
      </div>



      {/* Editor hodnoty */}
      {!noValue && field && cond.operator && (
        <div className="mt-2 pl-1">
          <ValueEditor cond={cond} field={field} effectiveType={effectiveType ?? field.type} onChange={onChange} />
        </div>
      )}
    </div>
  );
}

function StateDurationEditor({ cond, onChange, onDelete }: { cond: Condition; onChange: (c: Condition) => void; onDelete: () => void }) {
  const field = fieldById(cond.fieldId);
  const stateOps = stateOperatorsForType(field?.type);
  const stateOp = cond.stateOperator ?? stateOps[0]?.value;
  const needsValue = stateOp === "equals" || stateOp === "not_equals" || stateOp === "is_any_of" || stateOp === "is_none_of";
  const enumOpts = getEnumOptions(field);

  // duration value + unit
  const minutes = cond.durationMinutes ?? 30;
  const unit = minutes % 1440 === 0 ? "d" : minutes % 60 === 0 ? "h" : "min";
  const amount = unit === "d" ? minutes / 1440 : unit === "h" ? minutes / 60 : minutes;
  const setDuration = (a: number, u: "min" | "h" | "d") => {
    const mult = u === "d" ? 1440 : u === "h" ? 60 : 1;
    onChange({ ...cond, durationMinutes: Math.max(0, Math.round(a)) * mult });
  };

  return (
    <div className="rounded-lg border border-primary/30 bg-primary-soft/30 p-2.5">
      <div className="mb-1.5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-primary">
        <Clock className="size-3" /> Stav po dobu
        <button onClick={onDelete} className="ml-auto rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
          <X className="size-3.5" />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FieldSelect
          value={cond.fieldId}
          onChange={(id) => {
            const f = fieldById(id);
            const nextOps = stateOperatorsForType(f?.type);
            onChange({
              ...cond,
              fieldId: id,
              stateOperator: nextOps[0]?.value,
              stateValue: undefined,
              routeCheckpointId: id === "route.checkpoint_fulfilled_at" ? cond.routeCheckpointId : undefined,
            });
          }}
        />
        {cond.fieldId === "route.checkpoint_fulfilled_at" && (
          <RouteCheckpointSelect
            value={cond.routeCheckpointId}
            onChange={(id) => onChange({ ...cond, routeCheckpointId: id })}
          />
        )}
        <select
          value={stateOp ?? ""}
          onChange={(e) =>
            onChange({ ...cond, stateOperator: e.target.value as NonNullable<Condition["stateOperator"]>, stateValue: undefined })
          }
          className="input max-w-[200px] border-primary/40 font-medium text-primary"
        >
          {stateOps.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {needsValue && field && (
          <>
            {enumOpts.length > 0 ? (
              stateOp === "is_any_of" || stateOp === "is_none_of" ? (
                <select
                  multiple
                  value={Array.isArray(cond.stateValue) ? cond.stateValue : []}
                  onChange={(e) =>
                    onChange({ ...cond, stateValue: Array.from(e.target.selectedOptions).map((o) => o.value) })
                  }
                  className="input min-h-[72px] max-w-[260px]"
                >
                  {enumOpts.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  value={typeof cond.stateValue === "string" ? cond.stateValue : ""}
                  onChange={(e) => onChange({ ...cond, stateValue: e.target.value })}
                  className="input max-w-[260px]"
                >
                  <option value="">— vyber —</option>
                  {enumOpts.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              )
            ) : (
              <input
                value={typeof cond.stateValue === "string" ? cond.stateValue : ""}
                onChange={(e) => onChange({ ...cond, stateValue: e.target.value })}
                placeholder="hodnota"
                className="input max-w-[200px]"
              />
            )}
          </>
        )}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-2 text-sm">
        {/* Směr: uplynulo (od kotvy) / zbývá (do kotvy) */}
        <div className="flex rounded-md border border-border bg-background p-0.5 text-[11px] font-medium">
          {([
            { v: "elapsed", label: "uplynulo" },
            { v: "remaining", label: "zbývá" },
          ] as const).map((d) => {
            const cur = cond.durationDirection ?? "elapsed";
            return (
              <button
                key={d.v}
                type="button"
                onClick={() => onChange({ ...cond, durationDirection: d.v })}
                className={cn(
                  "rounded px-2 py-0.5",
                  cur === d.v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {d.label}
              </button>
            );
          })}
        </div>
        <span className="text-muted-foreground">déle než</span>
        <input
          type="number"
          min={0}
          value={amount}
          onChange={(e) => setDuration(Number(e.target.value), unit)}
          className="input w-20 text-right"
        />
        <select value={unit} onChange={(e) => setDuration(amount, e.target.value as "min" | "h" | "d")} className="input max-w-[100px]">
          <option value="min">minut</option>
          <option value="h">hodin</option>
          <option value="d">dní</option>
        </select>
        <span className="text-muted-foreground">
          {(cond.durationDirection ?? "elapsed") === "elapsed" ? "od" : "do"}
        </span>
        <select
          value={cond.durationAnchor ?? "field_last_update"}
          onChange={(e) =>
            onChange({
              ...cond,
              durationAnchor: e.target.value as NonNullable<Condition["durationAnchor"]>,
              anchorFieldId: undefined,
              anchorLiteralDate: undefined,
            })
          }
          className="input max-w-[240px]"
        >
          {DURATION_ANCHORS.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>

        {/* Detail kotvy podle typu */}
        {cond.durationAnchor === "field_datetime" && (
          <select
            value={cond.anchorFieldId ?? ""}
            onChange={(e) => onChange({ ...cond, anchorFieldId: e.target.value })}
            className="input max-w-[240px]"
          >
            <option value="" disabled>vyberte datetime pole…</option>
            {datetimeFields().filter((f) => f.id !== cond.fieldId).map((f) => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </select>
        )}
        {cond.durationAnchor === "literal_date" && (
          <input
            type="datetime-local"
            value={cond.anchorLiteralDate ?? ""}
            onChange={(e) => onChange({ ...cond, anchorLiteralDate: e.target.value })}
            className="input max-w-[220px]"
          />
        )}
      </div>


    </div>
  );
}




function ValueEditor({ cond, field, effectiveType, onChange }: { cond: Condition; field: NonNullable<ReturnType<typeof fieldById>>; effectiveType: string; onChange: (c: Condition) => void }) {
  const op = cond.operator!;

  // --- ENUM hodnoty (jen pokud netáhneme last-updated) ---
  const enumOpts = getEnumOptions(field);
  if (effectiveType === "enum" && enumOpts.length) {
    if (op === "is_any_of" || op === "is_none_of") {
      const selected = Array.isArray(cond.value) ? cond.value : (cond.value ? String(cond.value).split(",").map((s) => s.trim()).filter(Boolean) : []);
      return (
        <div className="flex flex-wrap gap-1.5">
          {enumOpts.map((o) => {
            const on = selected.includes(o.value);
            return (
              <button key={o.value} type="button" onClick={() => onChange({ ...cond, value: on ? selected.filter((x) => x !== o.value) : [...selected, o.value] })}
                className={cn("rounded-full border px-2.5 py-0.5 text-xs", on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/40")}>
                {o.label}
              </button>
            );
          })}
        </div>
      );
    }
    if (op === "changed_from_to") {
      return (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground">z</span>
          <select value={cond.valueFrom ?? ""} onChange={(e) => onChange({ ...cond, valueFrom: e.target.value })} className="input max-w-[220px]">
            <option value="">(jakákoliv)</option>
            {enumOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <span className="text-muted-foreground">na</span>
          <select value={(cond.value as string) ?? ""} onChange={(e) => onChange({ ...cond, value: e.target.value })} className="input max-w-[220px]">
            <option value="" disabled>vyberte…</option>
            {enumOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      );
    }
    return (
      <select value={(cond.value as string) ?? ""} onChange={(e) => onChange({ ...cond, value: e.target.value })} className="input max-w-[280px]">
        <option value="" disabled>vyberte hodnotu…</option>
        {enumOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  }

  // --- DATETIME (vč. naposledy aktualizováno) ---
  if (effectiveType === "datetime") {
    // Relativní (within_next/past, not_changed_since): jen čas v minutách
    if (op === "within_next" || op === "within_past" || op === "not_changed_since") {
      const cur = cond.timeMinutes;
      return (
        <div className="space-y-1.5">
          <div className="flex flex-wrap gap-1.5">
            {TIME_PRESETS.map((p) => (
              <button key={p.minutes} type="button" onClick={() => onChange({ ...cond, timeMinutes: p.minutes })}
                className={cn("rounded-full border px-2.5 py-0.5 text-xs", cur === p.minutes ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/40")}>
                {p.label}
              </button>
            ))}
            <button type="button" onClick={() => onChange({ ...cond, timeMinutes: cur && !TIME_PRESETS.find((p) => p.minutes === cur) ? cur : 30 })}
              className={cn("rounded-full border px-2.5 py-0.5 text-xs", cur && !TIME_PRESETS.find((p) => p.minutes === cur) ? "border-primary bg-primary text-primary-foreground" : "border-dashed border-border bg-background hover:border-primary/40")}>
              vlastní…
            </button>
          </div>
          {cur !== undefined && !TIME_PRESETS.find((p) => p.minutes === cur) && (
            <div className="flex items-center gap-2 text-xs">
              <input type="number" min={1} value={cur} onChange={(e) => onChange({ ...cond, timeMinutes: Math.max(1, Number(e.target.value)) })} className="input max-w-[100px]" />
              <span className="text-muted-foreground">minut · cca {formatMinutes(cur)}</span>
            </div>
          )}
        </div>
      );
    }

    // is_between → dva literál date inputy
    if (op === "is_between") {
      return (
        <div className="flex items-center gap-2 text-xs">
          <input type="datetime-local" value={(cond.value as string) ?? ""} onChange={(e) => onChange({ ...cond, value: e.target.value })} className="input max-w-[210px]" />
          <span className="text-muted-foreground">až</span>
          <input type="datetime-local" value={(cond.valueTo as string) ?? ""} onChange={(e) => onChange({ ...cond, valueTo: e.target.value })} className="input max-w-[210px]" />
        </div>
      );
    }

    // is / before / after / is_on_or_before / is_on_or_after → zdroj hodnoty
    if (op === "is" || op === "before" || op === "after" || op === "is_on_or_before" || op === "is_on_or_after") {
      const src = cond.dateSource ?? "literal";
      const sources: Array<{ value: "literal" | "today" | "system"; label: string; icon: typeof Calendar }> = [
        { value: "literal", label: "konkrétní datum", icon: Calendar },
        { value: "today", label: "dnes (relativně)", icon: Clock },
        { value: "system", label: "systémová událost", icon: Database },
      ];
      return (
        <div className="space-y-1.5">
          <div className="flex flex-wrap gap-1.5">
            {sources.map((s) => {
              const Icon = s.icon;
              return (
                <button key={s.value} type="button"
                  onClick={() => onChange({ ...cond, dateSource: s.value, value: "", valueTo: undefined, compareFieldId: undefined, systemAnchor: undefined, offsetMinutes: undefined, offsetDirection: undefined })}
                  className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs", src === s.value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/40")}>
                  <Icon className="size-3" /> {s.label}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {src === "literal" && (
              <input type="datetime-local" value={(cond.value as string) ?? ""} onChange={(e) => onChange({ ...cond, value: e.target.value })} className="input max-w-[240px]" />
            )}
            {src === "today" && <OffsetEditor cond={cond} onChange={onChange} anchorLabel="dneška" />}
            {src === "system" && (
              <>
                <select value={cond.systemAnchor ?? ""} onChange={(e) => onChange({ ...cond, systemAnchor: e.target.value as Condition["systemAnchor"] })} className="input max-w-[240px]">
                  <option value="" disabled>vyberte událost…</option>
                  {SYSTEM_ANCHORS.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
                </select>
                <OffsetEditor cond={cond} onChange={onChange} anchorLabel="události" optional />
              </>
            )}
          </div>
        </div>
      );
    }
    return null;
  }

  // --- NUMBER ---
  if (effectiveType === "number") {
    if (op === "between") {
      return (
        <div className="flex items-center gap-2 text-xs">
          <input type="number" value={(cond.value as number | string) ?? ""} onChange={(e) => onChange({ ...cond, value: e.target.value })} className="input max-w-[120px]" placeholder="od" />
          <span className="text-muted-foreground">až</span>
          <input type="number" value={(cond.valueTo as number | string) ?? ""} onChange={(e) => onChange({ ...cond, valueTo: e.target.value })} className="input max-w-[120px]" placeholder="do" />
          {field.unit && <span className="font-mono text-muted-foreground">{field.unit}</span>}
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 text-xs">
        <input type="number" value={(cond.value as number | string) ?? ""}
          onChange={(e) => onChange({ ...cond, value: e.target.value })} className="input max-w-[140px]" placeholder="0" />
        {field.unit && <span className="font-mono text-muted-foreground">{field.unit}</span>}
      </div>
    );
  }

  // --- USER (Operátor / přiřazený) ---
  if (effectiveType === "user") {
    return (
      <input value={(cond.value as string) ?? ""} onChange={(e) => onChange({ ...cond, value: e.target.value })} className="input max-w-[260px]" placeholder="jméno / e-mail" />
    );
  }

  // --- TEXT ---
  if (op === "is_any_of" || op === "is_none_of") {
    const arr = Array.isArray(cond.value) ? cond.value.join(", ") : (cond.value ?? "").toString();
    return (
      <input value={arr} onChange={(e) => onChange({ ...cond, value: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
        className="input max-w-[420px]" placeholder="hodnoty oddělené čárkou, např. CZ, SK, PL" />
    );
  }
  if (op === "changed_to" || op === "changed_from_to") {
    return (
      <div className="flex items-center gap-2 text-xs">
        {op === "changed_from_to" && (
          <>
            <span className="text-muted-foreground">z</span>
            <input value={cond.valueFrom ?? ""} onChange={(e) => onChange({ ...cond, valueFrom: e.target.value })} className="input max-w-[160px]" placeholder="(jakákoliv)" />
            <span className="text-muted-foreground">na</span>
          </>
        )}
        <input value={(cond.value as string) ?? ""} onChange={(e) => onChange({ ...cond, value: e.target.value })} className="input max-w-[220px]" placeholder="nová hodnota" />
      </div>
    );
  }
  // equals / not_equals → jen literál (porovnání s jiným polem odstraněno)
  if (op === "equals" || op === "not_equals") {
    return (
      <input value={(cond.value as string) ?? ""} onChange={(e) => onChange({ ...cond, value: e.target.value })} className="input max-w-[320px]" placeholder="hodnota" />
    );
  }
  // contains / not_contains / starts_with / ends_with → prostý text
  return (
    <input value={(cond.value as string) ?? ""} onChange={(e) => onChange({ ...cond, value: e.target.value })} className="input max-w-[320px]" placeholder="hodnota" />
  );
}

/** Editor offsetu (např. "+2 dny po", "1 hodina před") */
function OffsetEditor({ cond, onChange, anchorLabel, optional }: { cond: Condition; onChange: (c: Condition) => void; anchorLabel: string; optional?: boolean }) {
  const minutes = cond.offsetMinutes ?? 0;
  const dir = cond.offsetDirection ?? "after";
  // detekce jednotky
  const unit = (() => {
    if (minutes === 0) return "d";
    if (minutes % 10080 === 0) return "w";
    if (minutes % 1440 === 0) return "d";
    if (minutes % 60 === 0) return "h";
    return "min";
  })();
  const unitDef = OFFSET_UNITS.find((u) => u.value === unit) ?? OFFSET_UNITS[2];
  const n = Math.round(minutes / unitDef.minutes);
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {optional && minutes === 0 && (
        <button type="button" onClick={() => onChange({ ...cond, offsetMinutes: 1440, offsetDirection: "after" })}
          className="rounded-full border border-dashed border-border bg-background px-2.5 py-0.5 text-xs text-muted-foreground hover:border-primary/40 hover:text-primary">
          + offset
        </button>
      )}
      {(!optional || minutes !== 0) && (
        <>
          <select value={dir} onChange={(e) => onChange({ ...cond, offsetDirection: e.target.value as "before" | "after" })} className="input max-w-[110px]">
            <option value="after">po</option>
            <option value="before">před</option>
          </select>
          <input type="number" min={0} value={n} onChange={(e) => onChange({ ...cond, offsetMinutes: Math.max(0, Number(e.target.value)) * unitDef.minutes })} className="input max-w-[80px]" />
          <select value={unit} onChange={(e) => {
            const nu = OFFSET_UNITS.find((u) => u.value === e.target.value)!;
            onChange({ ...cond, offsetMinutes: n * nu.minutes });
          }} className="input max-w-[100px]">
            {OFFSET_UNITS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
          </select>
          <span className="text-muted-foreground">{anchorLabel}</span>
          {optional && (
            <button type="button" onClick={() => onChange({ ...cond, offsetMinutes: 0, offsetDirection: undefined })}
              className="rounded p-0.5 text-muted-foreground hover:text-destructive" title="Zrušit offset">
              <X className="size-3" />
            </button>
          )}
        </>
      )}
    </div>
  );
}

/* Wait editor odstraněn — pravidla nepoužívají waitStep. */


/* ----------- Actions editor ----------- */
function ActionsEditor({ actions, scheduleTimes, hasRouteCompliance, onChange }: { actions: Action[]; scheduleTimes: string[]; hasRouteCompliance: { any: boolean; generalCheck: boolean }; onChange: (a: Action[]) => void }) {
  return (
    <div className="space-y-3">
      {actions.map((a, i) => (
        <ActionEditor
          key={a.id}
          action={a}
          scheduleTimes={scheduleTimes}
          hasRouteCompliance={hasRouteCompliance}
          onChange={(next) => onChange(actions.map((x, idx) => (idx === i ? next : x)))}
          onDelete={() => onChange(actions.filter((_, idx) => idx !== i))}
        />
      ))}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(ACTION_LABELS) as Action["type"][]).map((t) => (
          <button
            key={t}
            onClick={() => onChange([...actions, { id: uid(), type: t, title: ACTION_LABELS[t], priority: "medium", assignMode: "shipment_operator", deduplicate: true }])}
            className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:bg-primary-soft hover:text-primary"
          >
            <Plus className="size-3" /> {ACTION_LABELS[t]}
          </button>
        ))}
      </div>
    </div>
  );
}

function ActionEditor({ action, scheduleTimes, hasRouteCompliance, onChange, onDelete }: { action: Action; scheduleTimes: string[]; hasRouteCompliance: { any: boolean; generalCheck: boolean }; onChange: (a: Action) => void; onDelete: () => void }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="rounded-md bg-primary-soft px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
          {ACTION_LABELS[action.type]}
        </span>
        <button onClick={onDelete} className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
          <Trash2 className="size-3.5" />
        </button>
      </div>

      {action.type === "create_vkr" && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Název VkŘ" full>
            <input value={action.title ?? ""} onChange={(e) => onChange({ ...action, title: e.target.value })} className="input" />
          </Field>
          <Field label="Popis" full>
            <textarea value={action.description ?? ""} onChange={(e) => onChange({ ...action, description: e.target.value })} className="input min-h-[50px]" />
          </Field>
          <Field label="Priorita">
            <select value={action.priority} onChange={(e) => onChange({ ...action, priority: e.target.value as Action["priority"] })} className="input">
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
            </select>
          </Field>
          <Field label="Komu se VkŘ zobrazí (volitelné)" full>
            <select value={action.assignMode ?? "shipment_operator"} onChange={(e) => onChange({ ...action, assignMode: e.target.value as Action["assignMode"] })} className="input">
              <option value="unassigned">Nepřiřazovat (nikomu)</option>
              <option value="shipment_operator">Operátorovi zásilky</option>
              <option value="customer_operator">Operátorovi zákazníka</option>
              <option value="content_specialist">Specialistovi podle obsahu (logika bude doplněna)</option>
              <option value="role">Roli</option>
              <option value="specific_user">Konkrétnímu uživateli</option>
              <option value="round_robin">Round-robin</option>
            </select>
          </Field>

        </div>
      )}

      {action.type === "send_email" && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Příjemce">
            <select value={action.toMode ?? "customer"} onChange={(e) => onChange({ ...action, toMode: e.target.value as Action["toMode"] })} className="input">
              <option value="customer">Zákazník</option>
              <option value="shipment_operator">Operátor zásilky</option>
              <option value="specific_address">Konkrétní adresa</option>
            </select>
          </Field>
          <Field label="Předmět">
            <input value={action.subject ?? ""} onChange={(e) => onChange({ ...action, subject: e.target.value })} className="input" />
          </Field>
          <Field label="Tělo" full>
            <textarea value={action.body ?? ""} onChange={(e) => onChange({ ...action, body: e.target.value })} className="input min-h-[80px]" />
          </Field>
        </div>
      )}

      {action.type === "set_field" && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Pole">
            <FieldSelect value={action.fieldId} onChange={(id) => onChange({ ...action, fieldId: id })} />
          </Field>
          <Field label="Hodnota">
            <input value={action.fieldValue ?? ""} onChange={(e) => onChange({ ...action, fieldValue: e.target.value })} className="input" />
          </Field>
        </div>
      )}

      {action.type === "change_phase" && (
        <Field label="Nová fáze">
          <input value={action.toPhase ?? ""} onChange={(e) => onChange({ ...action, toPhase: e.target.value })} className="input" />
        </Field>
      )}

      {action.type === "update_vkr" && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="VkŘ s názvem obsahujícím">
            <input value={action.vkrNameContains ?? ""} onChange={(e) => onChange({ ...action, vkrNameContains: e.target.value })} className="input" />
          </Field>
          <Field label="Nová priorita">
            <select value={action.newPriority ?? "high"} onChange={(e) => onChange({ ...action, newPriority: e.target.value as Action["newPriority"] })} className="input">
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
            </select>
          </Field>
          <Field label="Komentář" full>
            <input value={action.comment ?? ""} onChange={(e) => onChange({ ...action, comment: e.target.value })} className="input" />
          </Field>
        </div>
      )}

      {action.type === "add_note" && (
        <Field label="Text poznámky" full>
          <textarea value={action.noteText ?? ""} onChange={(e) => onChange({ ...action, noteText: e.target.value })} className="input min-h-[60px]" />
        </Field>
      )}

      {action.type === "request_field_from_operator" && (
        <>
          <Field label="Pole, které má operátor vyplnit">
            <select
              value={action.requestFieldId ?? ""}
              onChange={(e) => onChange({ ...action, requestFieldId: e.target.value || undefined })}
              className="input"
            >
              <option value="" disabled>Vyberte pole…</option>
              {FIELDS.map((f) => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Prosba pro operátora" full>
            <input
              type="text"
              value={action.requestPrompt ?? ""}
              onChange={(e) => onChange({ ...action, requestPrompt: e.target.value })}
              placeholder="Např. Zadej nové avizované datum doručení."
              className="input"
            />
          </Field>
          <Field label="Návazné pravidlo (volitelné — popisně)" full>
            <input
              type="text"
              value={action.nextRuleHint ?? ""}
              onChange={(e) => onChange({ ...action, nextRuleHint: e.target.value })}
              placeholder="Např. „Informovat zákazníka o posunutí ADD"
              className="input"
            />
          </Field>
          <p className="col-span-2 text-[11px] text-muted-foreground">
            Po vyplnění pole se VkŘ uzavře a změna pole spustí navazující pravidla (přes spouštěč „Vždy když je splněna podmínka" nad daným polem).
          </p>
        </>
      )}

      <ActionRefinements action={action} scheduleTimes={scheduleTimes} hasRouteCompliance={hasRouteCompliance} onChange={onChange} />
    </div>
  );
}

function hasRouteComplianceCondition(g: ConditionGroup): boolean {
  for (const c of g.children) {
    if (isGroup(c)) { if (hasRouteComplianceCondition(c)) return true; }
    else if (c.kind === "route_compliance") return true;
  }
  return false;
}

function isGeneralCheckRouteCompliance(g: ConditionGroup): boolean {
  for (const c of g.children) {
    if (isGroup(c)) { if (isGeneralCheckRouteCompliance(c)) return true; }
    else if (c.kind === "route_compliance" && c.generalCheck) return true;
  }
  return false;
}
function ActionRefinements({
  action,
  scheduleTimes,
  hasRouteCompliance,
  onChange,
}: {
  action: Action;
  scheduleTimes: string[];
  hasRouteCompliance: { any: boolean; generalCheck: boolean };
  onChange: (a: Action) => void;
}) {
  const initiallyOpen =
    !!action.runAtScheduleTime?.length ||
    !!(action.runWhenField && action.runWhenField.length) ||
    action.runWhenRouteCondition !== undefined;
  const [open, setOpen] = useState<boolean>(initiallyOpen);
  const showTimePicker = scheduleTimes.length >= 2;
  const showRouteResult = hasRouteCompliance.any;
  const showFieldList = !hasRouteCompliance.generalCheck;
  const fieldConds = action.runWhenField ?? [];

  const updateFieldCond = (i: number, patch: Partial<{ fieldId: string; operator: ConditionOperator; value: string | string[] }>) => {
    const next = fieldConds.map((c, idx) => (idx === i ? { ...c, ...patch } : c));
    onChange({ ...action, runWhenField: next });
  };
  const removeFieldCond = (i: number) => {
    const next = fieldConds.filter((_, idx) => idx !== i);
    onChange({ ...action, runWhenField: next.length ? next : undefined });
  };
  const addFieldCond = () => {
    const next = [...fieldConds, { fieldId: "phase", operator: "equals" as ConditionOperator, value: "" }];
    onChange({ ...action, runWhenField: next });
  };

  return (
    <div className="mt-3 border-t border-border pt-2.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-[11px] font-medium text-muted-foreground hover:text-primary"
      >
        {open ? "− Upřesnění" : "+ Upřesnit"}
      </button>
      {open && (
        <div className="mt-2 space-y-3">
          {/* 1) Spustit jen při čase */}
          {showTimePicker && (
            <div>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Spustit jen při čase
              </div>
              <div className="flex flex-wrap gap-1.5">
                {scheduleTimes.map((t) => {
                  const sel = action.runAtScheduleTime?.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        const set = new Set(action.runAtScheduleTime ?? []);
                        if (sel) set.delete(t); else set.add(t);
                        const arr = [...set].sort();
                        onChange({ ...action, runAtScheduleTime: arr.length ? arr : undefined });
                      }}
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 text-xs",
                        sel ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/40",
                      )}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">Bez výběru = akce běží při všech časech.</p>
            </div>
          )}

          {/* 2) Výsledek podmínky trasy — radio (jen pokud rule má route_compliance) */}
          {showRouteResult && (
            <div>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Výsledek podmínky trasy
              </div>
              <div className="flex flex-wrap gap-1.5">
                {([
                  { v: "fulfilled" as const, label: "splněna" },
                  { v: "not_fulfilled" as const, label: "nesplněna" },
                  { v: undefined as "fulfilled" | "not_fulfilled" | undefined, label: "vždy" },
                ]).map((o) => {
                  const sel = action.runWhenRouteCondition === o.v;
                  return (
                    <button
                      key={String(o.v ?? "any")}
                      type="button"
                      onClick={() => onChange({ ...action, runWhenRouteCondition: o.v })}
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 text-xs",
                        sel ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/40",
                      )}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">Výchozí „splněna". „Vždy" = akce běží bez ohledu na výsledek.</p>
            </div>
          )}

          {/* 3) A zároveň splněna podmínka (AND list) */}
          {showFieldList && (
            <div>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                A zároveň splněna podmínka
              </div>
              <div className="space-y-1.5">
                {fieldConds.map((fc, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-1.5">
                    <FieldSelect
                      value={fc.fieldId}
                      onChange={(id) => updateFieldCond(i, { fieldId: id })}
                    />
                    <select
                      value={fc.operator}
                      onChange={(e) => updateFieldCond(i, { operator: e.target.value as ConditionOperator })}
                      className="rounded border border-border bg-background px-2 py-0.5 text-xs"
                    >
                      {operatorsForType(fieldById(fc.fieldId)?.type).map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <input
                      value={typeof fc.value === "string" ? fc.value : (fc.value ?? []).join(",")}
                      onChange={(e) => updateFieldCond(i, { value: e.target.value })}
                      placeholder="hodnota"
                      className="rounded border border-border bg-background px-2 py-0.5 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => removeFieldCond(i)}
                      className="rounded p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addFieldCond}
                  className="rounded-md border border-dashed border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground hover:border-primary/40 hover:text-primary"
                >
                  + Přidat podmínku
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


function countConditions(g: ConditionGroup): number {
  return g.children.reduce((n, c) => n + (isGroup(c) ? countConditions(c) : 1), 0);
}

/* ----------- Mapping starých AI návrhů na nový shape ----------- */
function mapSuggestionTrigger(t: { type: string; schedule?: { mode?: string; timeOfDay?: string; intervalMinutes?: number; fieldId?: string; offsetMinutes?: number } }): Trigger {
  if (t.type === "schedule" && t.schedule) {
    const mode: ScheduleMode = (["once", "daily", "weekly", "monthly", "interval", "relative_to_field"].includes(t.schedule.mode ?? "")
      ? (t.schedule.mode as ScheduleMode)
      : "daily");
    return {
      type: "schedule",
      schedule: {
        mode,
        times: t.schedule.timeOfDay ? [{ kind: "time_of_day", time: t.schedule.timeOfDay }] : [],
        intervalMinutes: t.schedule.intervalMinutes,
        fieldId: t.schedule.fieldId,
        offsetMinutes: t.schedule.offsetMinutes,
        everyNDays: mode === "daily" ? 1 : undefined,
      },
    };
  }
  if (t.type === "manual") return { type: "manual" };
  // Vše ostatní (field_change, status_change, shipment_created, order_created, tracking_event, vkr_status_change, condition_met)
  // sjednocujeme na condition_met — konkrétní podmínka je v conditionGroup.
  return { type: "condition_met" };
}

/* ----------- Times of day chip input ----------- */
function TimesOfDayInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    if (!/^\d{2}:\d{2}$/.test(draft)) return;
    if (value.includes(draft)) { setDraft(""); return; }
    onChange([...value, draft].sort());
    setDraft("");
  };
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {value.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs font-medium">
          {t}
          <button type="button" onClick={() => onChange(value.filter((x) => x !== t))} className="text-muted-foreground hover:text-destructive">
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        type="time"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="input h-8 w-[110px]"
      />
      <button type="button" onClick={add} className="rounded-md border border-dashed border-border bg-background px-2 py-1 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-primary">
        + přidat čas
      </button>
    </div>
  );
}

/* ----------- Schedule editor (Časovač) ----------- */
function ScheduleEditor({ schedule, onChange }: { schedule: Schedule; onChange: (s: Schedule) => void }) {
  const routes = useRoutes();
  const cpLabel = (id?: string) => {
    if (!id) return undefined;
    for (const r of routes) {
      const cp = r.checkpoints.find((c) => c.id === id);
      if (cp) return cp.label;
    }
    return undefined;
  };
  const patch = (p: Partial<Schedule>) => onChange({ ...schedule, ...p });

  return (
    <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Režim">
          <select
            value={schedule.mode}
            onChange={(e) => {
              const mode = e.target.value as ScheduleMode;
              const defaults: Partial<Schedule> = { mode };
              if (mode === "daily" && !schedule.everyNDays) defaults.everyNDays = 1;
              if (mode === "weekly") { if (!schedule.everyNWeeks) defaults.everyNWeeks = 1; if (!schedule.weekdays?.length) defaults.weekdays = [1]; }
              if (mode === "monthly") {
                if (!schedule.everyNMonths) defaults.everyNMonths = 1;
                if (!schedule.monthlyMode) defaults.monthlyMode = "day_of_month";
                if (!schedule.dayOfMonth) defaults.dayOfMonth = 1;
              }
              if (mode === "interval" && !schedule.intervalMinutes) defaults.intervalMinutes = 60;
              patch(defaults);
            }}
            className="input"
          >
            <option value="once">Jednorázově</option>
            <option value="daily">Opakovaně — denně</option>
            <option value="weekly">Opakovaně — týdně</option>
            <option value="monthly">Opakovaně — měsíčně</option>
            <option value="interval">Každých N minut/hodin</option>
            <option value="relative_to_field">Relativně k poli</option>
          </select>
        </Field>

        {/* Jednorázově */}
        {schedule.mode === "once" && (
          <Field label="Datum a čas">
            <input
              type="datetime-local"
              value={schedule.onceAt ? schedule.onceAt.slice(0, 16) : ""}
              onChange={(e) => patch({ onceAt: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
              className="input"
            />
          </Field>
        )}

        {/* Globální TZ pro opakovaná spouštění */}
        {(schedule.mode === "daily" || schedule.mode === "weekly" || schedule.mode === "monthly") && (
          <Field label="Časové pásmo (default)">
            <TimezoneSelect
              includeOperator
              value={schedule.timezone ?? "operator"}
              onChange={(v) => patch({ timezone: v || undefined })}
              className="input"
            />
          </Field>
        )}
      </div>

      {/* Plán spuštění — jeden heterogenní seznam (pevné časy + relativní offsety) */}
      {(schedule.mode === "daily" || schedule.mode === "weekly" || schedule.mode === "monthly") && (
        <PlanSpusteniEditor
          items={schedule.times ?? []}
          onChange={(arr) => patch({ times: arr })}
        />
      )}


      {/* Denně */}
      {schedule.mode === "daily" && (
        <Field label="Každých N dní">
          <input
            type="number" min={1}
            value={schedule.everyNDays ?? 1}
            onChange={(e) => patch({ everyNDays: Math.max(1, Number(e.target.value)) })}
            className="input"
          />
        </Field>
      )}

      {/* Týdně */}
      {schedule.mode === "weekly" && (
        <>
          <Field label="Každých N týdnů">
            <input
              type="number" min={1}
              value={schedule.everyNWeeks ?? 1}
              onChange={(e) => patch({ everyNWeeks: Math.max(1, Number(e.target.value)) })}
              className="input"
            />
          </Field>
          <Field label="Dny v týdnu" full>
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAYS_ORDER.map((d) => {
                const sel = (schedule.weekdays ?? []).includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      const cur = new Set(schedule.weekdays ?? []);
                      if (cur.has(d)) cur.delete(d); else cur.add(d);
                      patch({ weekdays: Array.from(cur) as Weekday[] });
                    }}
                    className={cn(
                      "h-9 min-w-[42px] rounded-md border px-2 text-xs font-semibold transition-colors",
                      sel
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                    )}
                  >
                    {WEEKDAY_LABELS[d]}
                  </button>
                );
              })}
            </div>
          </Field>
        </>
      )}

      {/* Měsíčně */}
      {schedule.mode === "monthly" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Každých N měsíců">
              <input
                type="number" min={1}
                value={schedule.everyNMonths ?? 1}
                onChange={(e) => patch({ everyNMonths: Math.max(1, Number(e.target.value)) })}
                className="input"
              />
            </Field>
            <Field label="Vzor">
              <select
                value={schedule.monthlyMode ?? "day_of_month"}
                onChange={(e) => patch({ monthlyMode: e.target.value as "day_of_month" | "nth_weekday" })}
                className="input"
              >
                <option value="day_of_month">N-tého dne v měsíci</option>
                <option value="nth_weekday">N-tý den týdne v měsíci</option>
              </select>
            </Field>
          </div>
          {(schedule.monthlyMode ?? "day_of_month") === "day_of_month" ? (
            <Field label="Den v měsíci (1–31, fallback poslední)">
              <input
                type="number" min={1} max={31}
                value={schedule.dayOfMonth ?? 1}
                onChange={(e) => patch({ dayOfMonth: Math.max(1, Math.min(31, Number(e.target.value))) })}
                className="input"
              />
            </Field>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Pořadí">
                <select
                  value={String(schedule.nthWeek ?? 1)}
                  onChange={(e) => patch({ nthWeek: Number(e.target.value) as 1 | 2 | 3 | 4 | -1 })}
                  className="input"
                >
                  <option value="1">1.</option>
                  <option value="2">2.</option>
                  <option value="3">3.</option>
                  <option value="4">4.</option>
                  <option value="-1">poslední</option>
                </select>
              </Field>
              <Field label="Den v týdnu">
                <select
                  value={String(schedule.nthWeekday ?? 1)}
                  onChange={(e) => patch({ nthWeekday: Number(e.target.value) as Weekday })}
                  className="input"
                >
                  {WEEKDAYS_ORDER.map((d) => (
                    <option key={d} value={d}>{WEEKDAY_LABELS[d]}</option>
                  ))}
                </select>
              </Field>
            </div>
          )}
        </div>
      )}

      {/* Interval */}
      {schedule.mode === "interval" && (
        <Field label="Interval (minuty)">
          <input
            type="number" min={1}
            value={schedule.intervalMinutes ?? 60}
            onChange={(e) => patch({ intervalMinutes: Math.max(1, Number(e.target.value)) })}
            className="input"
          />
        </Field>
      )}

      {/* Relativně k poli */}
      {schedule.mode === "relative_to_field" && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Pole (datum/čas)">
            <select
              value={schedule.fieldId ?? ""}
              onChange={(e) => {
                const id = e.target.value || undefined;
                patch({
                  fieldId: id,
                  routeCheckpointId: id === "route.checkpoint_fulfilled_at" ? schedule.routeCheckpointId : undefined,
                });
              }}
              className="input"
            >
              <option value="" disabled>Vyberte pole…</option>
              {datetimeFields().map((f) => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Offset (minuty, záporně = před)">
            <input
              type="number"
              value={schedule.offsetMinutes ?? 0}
              onChange={(e) => patch({ offsetMinutes: Number(e.target.value) })}
              className="input"
            />
          </Field>
          {schedule.fieldId === "route.checkpoint_fulfilled_at" && (
            <Field label="Checkpoint trasy" full>
              <RouteCheckpointSelect
                value={schedule.routeCheckpointId}
                onChange={(id) => patch({ routeCheckpointId: id })}
              />
            </Field>
          )}
        </div>
      )}

      {/* Globální — okno platnosti + konec opakování */}
      {schedule.mode !== "once" && (
        <div className="space-y-3 rounded-lg border border-dashed border-border bg-background/60 p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Okno platnosti a konec opakování (volitelné)
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Platí od">
              <input
                type="date"
                value={schedule.validFrom ? schedule.validFrom.slice(0, 10) : ""}
                onChange={(e) => patch({ validFrom: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                className="input"
              />
            </Field>
            <Field label="Platí do">
              <input
                type="date"
                value={schedule.validTo ? schedule.validTo.slice(0, 10) : ""}
                onChange={(e) => patch({ validTo: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                className="input"
              />
            </Field>
            <Field label="Konec opakování">
              <select
                value={schedule.endMode ?? "never"}
                onChange={(e) => patch({ endMode: e.target.value as "never" | "after_n" | "on_date" })}
                className="input"
              >
                <option value="never">Nikdy</option>
                <option value="after_n">Po N opakováních</option>
                <option value="on_date">K datu</option>
              </select>
            </Field>
            {schedule.endMode === "after_n" && (
              <Field label="Počet opakování">
                <input
                  type="number" min={1}
                  value={schedule.endAfterN ?? 1}
                  onChange={(e) => patch({ endAfterN: Math.max(1, Number(e.target.value)) })}
                  className="input"
                />
              </Field>
            )}
            {schedule.endMode === "on_date" && (
              <Field label="Datum konce">
                <input
                  type="date"
                  value={schedule.endOnDate ? schedule.endOnDate.slice(0, 10) : ""}
                  onChange={(e) => patch({ endOnDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                  className="input"
                />
              </Field>
            )}
          </div>
        </div>
      )}

      <div className="rounded-md bg-primary-soft/60 px-3 py-2 text-xs text-primary">
        {describeSchedule(schedule, (id) => fieldById(id)?.label ?? id ?? "", cpLabel)}
      </div>
    </div>
  );
}

/* ============ Route compliance editor ============ */

import { useRoutes } from "@/lib/routes/store";
import { useProblemTypes } from "@/lib/routes/problemTypes";

/* ============ Route compliance — 5 variant ============ */

import { MATCH_FIELD_LABEL, type CheckpointMatchFieldKey } from "@/lib/routes/types";

const ROUTE_CHECK_VARIANTS: Array<{ value: NonNullable<Condition["routeCheck"]>; label: string; hint: string }> = [
  { value: "advanced_route_condition", label: "Pokročilá podmínka trasy", hint: "Vybraná podmínka ze slovníku pokročilých podmínek trasy." },
  { value: "record_vs_checkpoint", label: "Stav záznamu vůči checkpointu", hint: "Poslední / jakýkoli záznam odpovídá / neodpovídá / částečně odpovídá checkpointu." },
  { value: "general_compliance", label: "Obecná kontrola souladu", hint: "Místo nebo status zásilky není na trase." },
  { value: "checkpoint_duration", label: "Doba trvání checkpointu", hint: "Doba trvání checkpointu je větší/menší než očekávaná doba (standardní / kritický práh)." },
  { value: "field_value_repeated", label: "Hodnota pole na N záznamech", hint: "Hodnota tracking pole = X se vyskytla na > N záznamech." },
];

const MATCH_FIELD_KEYS_ORDER: CheckpointMatchFieldKey[] = [
  "status", "statusCode", "statusDescription", "simplifiedDescription", "statusType",
  "exceptionCode", "exceptionDescription",
  "locationCity", "locationCountry", "locationCountryCode",
  "locationPostalCode", "locationProvinceCode", "locationSlic", "locationType", "locationId",
  "ancillaryAction", "ancillaryActionDescription",
  "ancillaryReason", "ancillaryReasonDescription",
  "latest", "eventId", "zipMatchesDestination", "freeText",
];

function RouteComplianceEditor({ cond, onChange, onDelete }: { cond: Condition; onChange: (c: Condition) => void; onDelete: () => void }) {
  const routes = useRoutes();
  const variant: NonNullable<Condition["routeCheck"]> = cond.routeCheck ?? "advanced_route_condition";

  const cpLabels = useMemo(() => {
    const set = new Set<string>();
    for (const r of routes) {
      if (r.archivedAt) continue;
      for (const cp of r.checkpoints) if (cp.label) set.add(cp.label);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "cs"));
  }, [routes]);

  const trackingFields = useMemo(
    () => FIELDS.filter((f) => f.id.startsWith("tracking.activities.")),
    [],
  );

  const setVariant = (v: NonNullable<Condition["routeCheck"]>) => onChange({ ...cond, routeCheck: v });

  return (
    <div className="rounded-lg border border-primary/30 bg-primary-soft/30 p-2.5">
      <div className="mb-1.5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-primary">
        <Link2 className="size-3" /> Soulad s trasou
        <button onClick={onDelete} className="ml-auto rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
          <X className="size-3.5" />
        </button>
      </div>

      <div className="space-y-2.5">
        <div>
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Typ kontroly</div>
          <select value={variant} onChange={(e) => setVariant(e.target.value as NonNullable<Condition["routeCheck"]>)} className="input">
            {ROUTE_CHECK_VARIANTS.map((v) => (
              <option key={v.value} value={v.value}>{v.label}</option>
            ))}
          </select>
          <div className="mt-1 text-[11px] italic text-muted-foreground">{ROUTE_CHECK_VARIANTS.find((v) => v.value === variant)?.hint}</div>
        </div>

        {/* 1) Pokročilá podmínka trasy */}
        {variant === "advanced_route_condition" && (
          <div className="rounded-md border border-border bg-background/60 p-2">
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Podmínka na trase</div>
            <ProblemTypeSelect
              value={cond.problemTypeId}
              onChange={(id) => onChange({ ...cond, problemTypeId: id || undefined, generalCheck: undefined })}
            />
          </div>
        )}

        {/* 2) Stav záznamu vůči checkpointu */}
        {variant === "record_vs_checkpoint" && (
          <div className="space-y-2 rounded-md border border-border bg-background/60 p-2">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <select
                value={cond.recordScope ?? "last"}
                onChange={(e) => onChange({ ...cond, recordScope: e.target.value as "last" | "any" })}
                className="rounded border border-border bg-background px-2 py-0.5 text-xs"
              >
                <option value="last">Poslední záznam</option>
                <option value="any">Jakýkoli záznam</option>
              </select>
              <select
                value={cond.matchMode ?? "matches"}
                onChange={(e) => onChange({ ...cond, matchMode: e.target.value as "matches" | "not_matches" | "partial" })}
                className="rounded border border-border bg-background px-2 py-0.5 text-xs"
              >
                <option value="matches">odpovídá</option>
                <option value="not_matches">neodpovídá</option>
                <option value="partial">částečně odpovídá</option>
              </select>
              <span className="text-muted-foreground">checkpointu</span>
              <input
                list="rc-cp-labels"
                value={cond.checkpointLabel ?? ""}
                onChange={(e) => onChange({ ...cond, checkpointLabel: e.target.value })}
                placeholder="label checkpointu"
                className="rounded border border-border bg-background px-2 py-0.5 text-xs"
              />
              <datalist id="rc-cp-labels">
                {cpLabels.map((l) => <option key={l} value={l} />)}
              </datalist>
            </div>
            {cond.matchMode === "partial" && (
              <div>
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Shodující se pole</div>
                <div className="flex flex-wrap gap-1.5">
                  {MATCH_FIELD_KEYS_ORDER.map((k) => {
                    const on = (cond.partialFields ?? []).includes(k);
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => {
                          const cur = new Set(cond.partialFields ?? []);
                          if (cur.has(k)) cur.delete(k); else cur.add(k);
                          onChange({ ...cond, partialFields: [...cur] });
                        }}
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[11px]",
                          on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/40",
                        )}
                      >
                        {MATCH_FIELD_LABEL[k]}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3) Obecná kontrola souladu */}
        {variant === "general_compliance" && (
          <div className="rounded-md border border-border bg-background/60 p-2">
            <div className="space-y-1.5 text-xs">
              {([
                { v: "unrecognized_location" as const, label: "Místo zásilky není na trase" },
                { v: "unrecognized_status" as const, label: "Status zásilky není na trase" },
              ]).map((o) => (
                <label key={o.v} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    checked={cond.generalCheck === o.v}
                    onChange={() => onChange({ ...cond, generalCheck: o.v, problemTypeId: undefined })}
                  />
                  <span>{o.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* 4) Doba trvání checkpointu */}
        {variant === "checkpoint_duration" && (
          <div className="space-y-2 rounded-md border border-border bg-background/60 p-2">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-muted-foreground">Doba trvání checkpointu</span>
              <input
                list="rc-cp-labels"
                value={cond.checkpointLabel ?? ""}
                onChange={(e) => onChange({ ...cond, checkpointLabel: e.target.value })}
                placeholder="label checkpointu"
                className="rounded border border-border bg-background px-2 py-0.5 text-xs"
              />
              <datalist id="rc-cp-labels">
                {cpLabels.map((l) => <option key={l} value={l} />)}
              </datalist>
              <span className="text-muted-foreground">je</span>
              <select
                value={cond.durationComparator ?? "gt"}
                onChange={(e) => onChange({ ...cond, durationComparator: e.target.value as "gt" | "lt" })}
                className="rounded border border-border bg-background px-2 py-0.5 text-xs"
              >
                <option value="gt">větší</option>
                <option value="lt">menší</option>
              </select>
              <span className="text-muted-foreground">než očekávaná doba</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Práh:</span>
              {([
                { v: "normal" as const, label: "standardní" },
                { v: "critical" as const, label: "kritický" },
              ]).map((o) => (
                <label key={o.v} className="flex cursor-pointer items-center gap-1.5">
                  <input
                    type="radio"
                    checked={(cond.checkpointDurationThreshold ?? "normal") === o.v}
                    onChange={() => onChange({ ...cond, checkpointDurationThreshold: o.v })}
                  />
                  <span>{o.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* 5) Hodnota pole na N záznamech */}
        {variant === "field_value_repeated" && (
          <div className="space-y-2 rounded-md border border-border bg-background/60 p-2">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-muted-foreground">Hodnota</span>
              <select
                value={cond.fieldValueTrackingFieldId ?? ""}
                onChange={(e) => onChange({ ...cond, fieldValueTrackingFieldId: e.target.value || undefined })}
                className="rounded border border-border bg-background px-2 py-0.5 text-xs max-w-[260px]"
              >
                <option value="" disabled>vyber pole…</option>
                {trackingFields.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
              </select>
              <span className="text-muted-foreground">=</span>
              <input
                value={cond.fieldValueExpected ?? ""}
                onChange={(e) => onChange({ ...cond, fieldValueExpected: e.target.value })}
                placeholder="hodnota"
                className="rounded border border-border bg-background px-2 py-0.5 text-xs"
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-muted-foreground">se vyskytla na více než</span>
              <input
                type="number"
                min={1}
                value={cond.fieldValueCount ?? 2}
                onChange={(e) => onChange({ ...cond, fieldValueCount: Math.max(1, Number(e.target.value)) })}
                className="w-16 rounded border border-border bg-background px-1.5 py-0.5 text-right text-xs"
              />
              <select
                value={cond.fieldValueMode ?? "any"}
                onChange={(e) => onChange({ ...cond, fieldValueMode: e.target.value as "any" | "consecutive" })}
                className="rounded border border-border bg-background px-2 py-0.5 text-xs"
              >
                <option value="any">jakýchkoli</option>
                <option value="consecutive">po sobě jdoucích</option>
              </select>
              <span className="text-muted-foreground">záznamech</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


/* Svátky a pracovní týden — odstraněno; per-checkpoint considerHolidays na trase. */

function ProblemTypeSelect({ value, onChange }: { value: string | undefined; onChange: (id: string) => void }) {
  const types = useProblemTypes();
  return (
    <select value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="input">
      <option value="">(jakýkoli problém na trase)</option>
      {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
    </select>
  );
}

function ProblemTypeOptions() {
  const types = useProblemTypes();
  return (
    <optgroup label="Problémy ze slovníku trasy">
      {types.map((t) => <option key={t.id} value={`pt:${t.id}`}>{t.name}</option>)}
    </optgroup>
  );
}

/* ============ Plán spuštění — jeden heterogenní seznam ============ */

function PlanSpusteniEditor({ items, onChange }: { items: ScheduleTimeItem[]; onChange: (arr: ScheduleTimeItem[]) => void }) {
  const update = (i: number, next: ScheduleTimeItem) =>
    onChange(items.map((it, idx) => idx === i ? next : it));
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const addFixed = () => onChange([...items, { kind: "time_of_day", time: "08:00", timezone: "destination_country" }]);

  return (
    <div className="space-y-2 rounded-lg border border-border bg-background/60 p-3">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Plán spuštění
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={addFixed}
            className="rounded-md border border-dashed border-border bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:border-primary/40 hover:text-primary"
          >
            + Pevný čas
          </button>
        </div>
      </div>

      {items.length === 0 && (
        <div className="text-[11px] italic text-muted-foreground">
          Přidej alespoň jeden pevný čas (např. 08:00 TZ cílové země). Pro spuštění relativně k checkpointu použij trigger „Vždy když je splněna podmínka" + podmínku „Splnění checkpointu" s časovou tolerancí.
        </div>
      )}

      {items.map((it, i) => (
        <div key={i} className="flex flex-wrap items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-xs">
          <span title="Pevný čas" className="text-muted-foreground">⏰</span>
          <span className="text-muted-foreground">v</span>
          <input
            type="time"
            value={it.time}
            onChange={(e) => update(i, { ...it, time: e.target.value })}
            className="rounded border border-border bg-background px-1.5 py-0.5 text-xs"
          />
          <TimezoneSelect
            includeOperator
            value={it.timezone ?? "destination_country"}
            onChange={(v) => update(i, { ...it, timezone: v })}
          />
          <button onClick={() => remove(i)} className="ml-auto rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">×</button>
        </div>
      ))}
    </div>
  );
}


/* ============ Aktivační okno — toggle „jen pracovní dny" ============ */

function ActiveWindowEditor({ rule, onChange }: { rule: Rule; onChange: (patch: Partial<Rule>) => void }) {
  const enabled = rule.activeWindow?.businessDaysOnly === true;
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3">
      <label className="flex cursor-pointer items-start gap-2 text-xs">
        <input
          type="checkbox"
          checked={enabled}
          onChange={() => onChange({ activeWindow: enabled ? undefined : { businessDaysOnly: true } })}
          className="mt-0.5"
        />
        <div>
          <div className="font-semibold text-foreground">Spouštět jen v pracovní dny</div>
          <div className="mt-0.5 text-muted-foreground">
            Pravidlo se v sobotu, neděli a o státních svátcích nevyhodnotí. Užitečné u reaktivních pravidel, která mají vznikat jen v pracovní době.
          </div>
        </div>
      </label>
    </div>
  );
}

/* ============ Skip-if-prior — přeskočit dnešní opakovaný běh ============ */



import { useRules } from "@/lib/vkr/store";

function SkipIfPriorEditor({ rule, onChange }: { rule: Rule; onChange: (patch: Partial<Rule>) => void }) {
  const allRules = useRules();
  const skip = rule.skipIfPrior;
  const enabled = !!skip;
  const candidates = allRules.filter((r) => !r.archivedAt && r.id !== rule.id);

  const toggle = () => {
    if (enabled) onChange({ skipIfPrior: undefined });
    else onChange({ skipIfPrior: { ruleIds: [rule.id], outcome: "positive" } });
  };

  const sel = new Set(skip?.ruleIds ?? []);
  const toggleId = (id: string) => {
    const next = new Set(sel);
    if (next.has(id)) next.delete(id); else next.add(id);
    onChange({ skipIfPrior: { ruleIds: [...next], outcome: skip?.outcome ?? "positive" } });
  };

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3">
      <label className="flex cursor-pointer items-start gap-2 text-xs">
        <input type="checkbox" checked={enabled} onChange={toggle} className="mt-0.5" />
        <div>
          <div className="font-semibold text-foreground">Přeskočit běh, pokud na zásilce dnes už vznikla VkŘ</div>
          <div className="mt-0.5 text-muted-foreground">
            Zabrání duplicitnímu vyhodnocení při více časech v rámci dne nebo relativních spouštěních. Typicky zapnuto pro „kontrola 8:00 / 9:00 / 10:00".
          </div>
        </div>
      </label>
      {enabled && skip && (
        <div className="mt-2.5 space-y-2 pl-6">
          <div>
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Z kterých pravidel</div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => toggleId(rule.id)}
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-xs",
                  sel.has(rule.id) ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/40",
                )}
              >
                ← Tohoto pravidla
              </button>
              {candidates.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => toggleId(r.id)}
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-xs",
                    sel.has(r.id) ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/40",
                  )}
                  title={r.description}
                >
                  {r.code} · {r.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Výsledek, který blokuje další běh</div>
            <div className="flex gap-1.5">
              {([
                { v: "any", label: "Jakýkoli výsledek" },
                { v: "positive", label: "Pozitivní (bez problému)" },
                { v: "negative", label: "Negativní (problém)" },
              ] as const).map((o) => (
                <button
                  key={o.v}
                  type="button"
                  onClick={() => onChange({ skipIfPrior: { ruleIds: skip.ruleIds, outcome: o.v } })}
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-xs",
                    skip.outcome === o.v ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/40",
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============ Splnění checkpointu — výběr CP z trasy ============ */


function RouteCheckpointSelect({ value, onChange }: { value: string | undefined; onChange: (id: string) => void }) {
  const routes = useRoutes();
  const cps = routes
    .filter((r) => !r.archivedAt)
    .flatMap((r) => r.checkpoints.map((cp) => ({ ...cp, routeName: r.name })));
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className="input max-w-[280px]"
      title="Konkrétní checkpoint trasy, jehož splnění se měří"
    >
      <option value="">— vyber checkpoint —</option>
      {cps.map((cp) => (
        <option key={cp.id} value={cp.id}>
          {cp.label} ({cp.routeName})
        </option>
      ))}
    </select>
  );
}

/* ============ Stav checkpointu (label-based, napříč všemi trasami) ============ */

const CHECKPOINT_COND_UNITS: Array<{ value: "minutes" | "hours" | "days"; label: string; minutes: number }> = [
  { value: "minutes", label: "min", minutes: 1 },
  { value: "hours", label: "h", minutes: 60 },
  { value: "days", label: "dní", minutes: 60 * 24 },
];

function CheckpointConditionEditor({
  cond, onChange, onDelete,
}: { cond: Condition; onChange: (c: Condition) => void; onDelete: () => void }) {
  const routes = useRoutes();
  const labels = useMemo(() => {
    const set = new Set<string>();
    for (const r of routes) {
      if (r.archivedAt) continue;
      for (const cp of r.checkpoints) if (cp.label) set.add(cp.label);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "cs"));
  }, [routes]);

  const state = cond.checkpointState ?? "fulfilled";
  const dur = cond.checkpointDuration ?? { value: 30, unit: "minutes" as const };

  return (
    <div className="rounded-lg border border-primary/30 bg-primary-soft/30 p-2.5">
      <div className="mb-1.5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-primary">
        <MapPin className="size-3" /> Stav checkpointu
        <button onClick={onDelete} className="ml-auto rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
          <X className="size-3.5" />
        </button>
      </div>

      <div className="space-y-2.5">
        <div>
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Checkpoint</div>
          <input
            list="checkpoint-labels"
            value={cond.checkpointLabel ?? ""}
            onChange={(e) => onChange({ ...cond, checkpointLabel: e.target.value })}
            placeholder="Název checkpointu (např. Odlet z letiště původu)"
            className="input"
            title="Podmínka se vztahuje na všechny trasy, které checkpoint s tímto názvem obsahují."
          />
          <datalist id="checkpoint-labels">
            {labels.map((l) => <option key={l} value={l} />)}
          </datalist>
          <p className="mt-1 text-[11px] italic text-muted-foreground">
            Match podle labelu napříč všemi trasami zásilky. Pokud zásilka nematchuje žádnou trasu s tímto labelem, vyhodnotí se jako „není splněn".
          </p>
        </div>

        <div>
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Stav</div>
          <div className="space-y-1.5 text-xs">
            {([
              { v: "fulfilled" as const, label: "je splněn" },
              { v: "not_fulfilled" as const, label: "není splněn" },
              { v: "not_updated_for" as const, label: "nebyl aktualizován déle než" },
            ]).map((o) => (
              <label key={o.v} className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={state === o.v}
                  onChange={() => onChange({
                    ...cond,
                    checkpointState: o.v,
                    checkpointDuration: o.v === "not_updated_for" ? dur : undefined,
                  })}
                />
                <span>{o.label}</span>
                {o.v === "not_updated_for" && state === "not_updated_for" && (
                  <span className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={1}
                      value={dur.value}
                      onChange={(e) => onChange({ ...cond, checkpointDuration: { ...dur, value: Math.max(1, Number(e.target.value)) } })}
                      className="w-20 rounded border border-border bg-background px-1.5 py-0.5 text-xs"
                    />
                    <select
                      value={dur.unit}
                      onChange={(e) => onChange({ ...cond, checkpointDuration: { ...dur, unit: e.target.value as "minutes" | "hours" | "days" } })}
                      className="rounded border border-border bg-background px-1.5 py-0.5 text-xs"
                    >
                      {CHECKPOINT_COND_UNITS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
                    </select>
                  </span>
                )}
              </label>
            ))}
          </div>
          {state === "not_updated_for" && (
            <p className="mt-1 text-[11px] italic text-muted-foreground">
              Počítáno od `eventTimestamp` posledního trackingu, který odpovídá matchi checkpointu.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
