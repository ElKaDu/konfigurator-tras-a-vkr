import { Plus, X } from "lucide-react";
import { TRACKING_FIELDS, REPEATABLE_FIELDS, SIMPLE_OPERATORS } from "@/lib/model/trackingFields";
import { cn } from "@/lib/utils";
import type { Condition } from "@/lib/model/types";

function isBlock1Condition(c: Condition): boolean {
  return c.kind === "field" || (c.kind === "tracking_aggregate" && c.valueMode === "same_repeats");
}

export function CurrentRecordConditionsBuilder({
  conditions,
  onChange,
}: {
  conditions: Condition[];
  onChange: (next: Condition[]) => void;
}) {
  const rows = conditions.filter(isBlock1Condition);

  function updateAt(index: number, next: Condition) {
    const target = rows[index];
    onChange(conditions.map((c) => (c === target ? next : c)));
  }

  function removeAt(index: number) {
    const target = rows[index];
    onChange(conditions.filter((c) => c !== target));
  }

  function addShoda() {
    onChange([...conditions, { kind: "field", fieldId: "derivedStatus", operator: "je", value: "" }]);
  }

  function addOpakujeSe() {
    onChange([
      ...conditions,
      { kind: "tracking_aggregate", trackingFieldId: "city", valueMode: "same_repeats", count: 4, occurrence: "consecutive" },
    ]);
  }

  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div key={i} className="rounded-lg border border-border bg-background p-2.5 space-y-2">
          <div className="flex gap-1">
            <button
              onClick={() => updateAt(i, { kind: "field", fieldId: "derivedStatus", operator: "je", value: "" })}
              className={cn("rounded-md px-2 py-1 text-[11px] font-medium", row.kind === "field" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}
            >
              Shoda hodnoty
            </button>
            <button
              onClick={() => updateAt(i, { kind: "tracking_aggregate", trackingFieldId: "city", valueMode: "same_repeats", count: 4, occurrence: "consecutive" })}
              className={cn("rounded-md px-2 py-1 text-[11px] font-medium", row.kind === "tracking_aggregate" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}
            >
              Opakuje se
            </button>
            <button onClick={() => removeAt(i)} className="ml-auto text-muted-foreground hover:text-foreground">
              <X className="size-3.5" />
            </button>
          </div>

          {row.kind === "field" && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <select
                value={row.fieldId}
                onChange={(e) => updateAt(i, { ...row, fieldId: e.target.value })}
                className="rounded border border-border bg-background px-2 py-1.5 text-xs"
              >
                {TRACKING_FIELDS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
              <select
                value={row.operator}
                onChange={(e) => updateAt(i, { ...row, operator: e.target.value })}
                className="rounded border border-border bg-background px-2 py-1.5 text-xs"
              >
                {SIMPLE_OPERATORS.map((op) => (
                  <option key={op}>{op}</option>
                ))}
              </select>
              <input
                value={row.value ?? ""}
                onChange={(e) => updateAt(i, { ...row, value: e.target.value })}
                placeholder="hodnota…"
                className="flex-1 min-w-[100px] rounded border border-border bg-background px-2 py-1.5 text-xs"
              />
            </div>
          )}

          {row.kind === "tracking_aggregate" && (
            <div className="space-y-2">
              <select
                value={row.trackingFieldId}
                onChange={(e) => updateAt(i, { ...row, trackingFieldId: e.target.value })}
                className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs"
              >
                {REPEATABLE_FIELDS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
              <div className="text-[11px] text-muted-foreground">
                Bez konkrétní hodnoty — hlídá, že stejná hodnota se opakuje, počítaje v to i tento nový záznam.
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={2}
                  value={row.count}
                  onChange={(e) => updateAt(i, { ...row, count: Number(e.target.value) })}
                  className="w-16 rounded border border-border bg-background px-2 py-1.5 text-xs text-center"
                />
                <span className="text-xs text-muted-foreground">po sobě jdoucích záznamů</span>
              </div>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={row.occurrence === "consecutive"}
                  onChange={(e) => updateAt(i, { ...row, occurrence: e.target.checked ? "consecutive" : "any" })}
                />
                musí být nepřerušeně
              </label>
            </div>
          )}
        </div>
      ))}

      <div className="flex gap-2">
        <button
          onClick={addShoda}
          className="flex items-center gap-1 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary"
        >
          <Plus className="size-3" /> Shoda hodnoty
        </button>
        <button
          onClick={addOpakujeSe}
          className="flex items-center gap-1 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary"
        >
          <Plus className="size-3" /> Opakuje se
        </button>
      </div>
    </div>
  );
}
