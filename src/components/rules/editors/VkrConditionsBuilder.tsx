import { useState } from "react";
import { Plus, X, Info, Search } from "lucide-react";
import {
  VKR_CONDITION_CATALOG,
  findVkrField,
  findVkrOperator,
  type VkrCondition,
  type VkrConditionFieldDef,
} from "@/lib/vkr/vkrConditionCatalog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { TrackingTimeValueEditor, DEFAULT_TIME_SPEC, type TrackingTimeSpec } from "./TrackingTimeValueEditor";

function parseTimeSpec(value: string | undefined): TrackingTimeSpec {
  if (!value) return DEFAULT_TIME_SPEC;
  try { return JSON.parse(value) as TrackingTimeSpec; } catch { return DEFAULT_TIME_SPEC; }
}

export function VkrConditionsBuilder({
  conditions,
  onChange,
  title,
  emptyText,
}: {
  conditions: VkrCondition[];
  onChange: (next: VkrCondition[]) => void;
  title?: string;
  emptyText?: string;
}) {
  function addCondition(field: VkrConditionFieldDef) {
    const firstOp = field.operators[0];
    const defaultValue = firstOp?.valueOptions?.[0]?.value ?? "";
    onChange([
      ...conditions,
      {
        id: "vc_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
        fieldId: field.id,
        operator: firstOp?.id ?? "",
        value: defaultValue,
      },
    ]);
  }

  function updateCondition(id: string, patch: Partial<VkrCondition>) {
    onChange(conditions.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function removeCondition(id: string) {
    onChange(conditions.filter((c) => c.id !== id));
  }

  return (
    <div className="rounded-xl border border-border bg-muted/10 p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title ?? "Podmínky zásilky"}
        </div>
      </div>

      {conditions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-background px-3 py-3 text-xs text-muted-foreground italic">
          {emptyText ?? "Žádné podmínky — akce se spustí vždy, když nastane spouštěč."}
        </div>
      ) : (
        <div className="space-y-1.5">
          {conditions.map((c) => (
            <ConditionRow
              key={c.id}
              condition={c}
              onUpdate={(patch) => updateCondition(c.id, patch)}
              onRemove={() => removeCondition(c.id)}
            />
          ))}
        </div>
      )}

      <AddConditionButton
        usedFieldIds={conditions.map((c) => c.fieldId)}
        onPick={addCondition}
      />

      <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground leading-snug pt-0.5">
        <Info size={11} className="mt-0.5 shrink-0" />
        <span>Když nejsou splněny, VkŘ se nevytvoří a akce se nespustí.</span>
      </div>
    </div>
  );
}

function ConditionRow({
  condition,
  onUpdate,
  onRemove,
}: {
  condition: VkrCondition;
  onUpdate: (patch: Partial<VkrCondition>) => void;
  onRemove: () => void;
}) {
  const field = findVkrField(condition.fieldId);
  const operator = findVkrOperator(condition.fieldId, condition.operator);

  if (!field) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-background p-2 text-xs text-destructive flex items-center justify-between">
        <span>Neznámé pole: {condition.fieldId}</span>
        <button onClick={onRemove}>
          <X className="size-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-background p-2.5">
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs font-medium text-foreground">{field.label}</span>
        {field.customValueEditor !== "tracking_time" && (
        <select
          value={condition.operator}
          onChange={(e) => {
            const newOp = findVkrOperator(field.id, e.target.value);
            const defaultValue = newOp?.valueOptions?.[0]?.value ?? "";
            onUpdate({ operator: e.target.value, value: defaultValue });
          }}
          className="rounded border border-border bg-background px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
        >
          {field.operators.map((op) => (
            <option key={op.id} value={op.id}>
              {op.label}
            </option>
          ))}
        </select>
        )}

        {field.customValueEditor === "tracking_time" && (
          <div className="flex-1 min-w-[260px]">
            <TrackingTimeValueEditor
              value={parseTimeSpec(condition.value)}
              onChange={(v) => onUpdate({ value: JSON.stringify(v) })}
            />
          </div>
        )}
        {field.customValueEditor !== "tracking_time" && operator?.valueOptions && (
          <select
            value={condition.value ?? ""}
            onChange={(e) => onUpdate({ value: e.target.value })}
            className="rounded border border-border bg-background px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
          >
            {operator.valueOptions.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
        )}

        {field.customValueEditor !== "tracking_time" && operator?.needsValue && (
          <div className="flex items-center gap-1">
            <input
              type={operator.valueType ?? "text"}
              min={operator.valueType === "number" ? 1 : undefined}
              value={condition.value ?? ""}
              placeholder={operator.valuePlaceholder}
              onChange={(e) => onUpdate({ value: e.target.value })}
              className="flex-1 min-w-[120px] rounded border border-border bg-background px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
            {operator.valueSuffix && (
              <span className="text-[11px] text-muted-foreground">
                {operator.valueSuffix}
              </span>
            )}
          </div>
        )}

        <button
          onClick={onRemove}
          className="ml-auto text-muted-foreground hover:text-foreground"
          title="Odstranit podmínku"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

function AddConditionButton({
  usedFieldIds,
  onPick,
}: {
  usedFieldIds: string[];
  onPick: (field: VkrConditionFieldDef) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = VKR_CONDITION_CATALOG.filter((f) =>
    (f.label + " " + f.category + " " + (f.description ?? ""))
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  const grouped = filtered.reduce<Record<string, VkrConditionFieldDef[]>>(
    (acc, f) => {
      (acc[f.category] ??= []).push(f);
      return acc;
    },
    {},
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 rounded-lg border border-dashed border-border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors">
          <Plus className="size-3.5" /> Přidat podmínku
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-72 p-0 overflow-hidden"
        sideOffset={4}
      >
        <div className="flex items-center gap-1.5 border-b border-border px-2.5 py-1.5">
          <Search className="size-3.5 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Hledat podmínku…"
            className="flex-1 bg-transparent text-xs focus:outline-none"
          />
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          {Object.keys(grouped).length === 0 && (
            <div className="px-2 py-3 text-center text-xs text-muted-foreground">
              Nic nenalezeno
            </div>
          )}
          {Object.entries(grouped).map(([category, fields]) => (
            <div key={category} className="mb-1.5 last:mb-0">
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {category}
              </div>
              {fields.map((f) => {
                const isUsed = usedFieldIds.includes(f.id);
                return (
                  <button
                    key={f.id}
                    onClick={() => {
                      onPick(f);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={cn(
                      "w-full rounded-md px-2 py-1.5 text-left hover:bg-muted/60",
                      isUsed && "opacity-60",
                    )}
                  >
                    <div className="text-xs font-medium flex items-center gap-1.5">
                      {f.label}
                      {isUsed && (
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
                          již přidáno
                        </span>
                      )}
                    </div>
                    {f.description && (
                      <div className="text-[10px] text-muted-foreground leading-snug">
                        {f.description}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
