import { Plus, X } from "lucide-react";
import { TRACKING_FIELDS, REPEATABLE_FIELDS, isTrackingConditionRow, rowKindOf, type RowKind } from "@/lib/model/trackingFields";
import { cn } from "@/lib/utils";
import type { Condition } from "@/lib/model/types";

/** row.kind narrows to "field" | "tracking_aggregate" | "route_compliance" (Condition is a 3-way union) —
 * route_compliance never actually reaches these rows (filtered out by isTrackingConditionRow), but TS
 * doesn't know that from a plain boolean filter, so every access checks row.kind inline. */
function fieldIdOf(row: Condition): string {
  if (row.kind === "field") return row.fieldId;
  if (row.kind === "tracking_aggregate") return row.trackingFieldId;
  return "";
}

export function TrackingConditionsBuilder({
  conditions,
  onChange,
  allowCurrentRecord,
}: {
  conditions: Condition[];
  onChange: (next: Condition[]) => void;
  /** false when Spouštěč = Časovač — jen "bylo v historii" dává smysl (žádný "právě příchozí" záznam). */
  allowCurrentRecord: boolean;
}) {
  const rows = conditions
    .filter(isTrackingConditionRow)
    .filter((c) => allowCurrentRecord || rowKindOf(c) === "history");

  function updateAt(index: number, next: Condition) {
    const target = rows[index];
    onChange(conditions.map((c) => (c === target ? next : c)));
  }

  function removeAt(index: number) {
    const target = rows[index];
    onChange(conditions.filter((c) => c !== target));
  }

  function addRow() {
    const next: Condition = allowCurrentRecord
      ? { kind: "field", fieldId: "derivedStatus", operator: "je", value: "" }
      : { kind: "tracking_aggregate", trackingFieldId: "derivedStatus", valueMode: "specific", expectedValue: "", mode: "contains", count: 1, occurrence: "any" };
    onChange([...conditions, next]);
  }

  function changeKind(index: number, kind: RowKind) {
    const row = rows[index];
    const fieldId = fieldIdOf(row);
    if (kind === "is" || kind === "is_not") {
      updateAt(index, { kind: "field", fieldId, operator: kind === "is" ? "je" : "není", value: row.kind === "field" ? (row.value ?? "") : "" });
    } else if (kind === "repeats") {
      const repeatableField = REPEATABLE_FIELDS.some((f) => f.value === fieldId) ? fieldId : REPEATABLE_FIELDS[0].value;
      updateAt(index, { kind: "tracking_aggregate", trackingFieldId: repeatableField, valueMode: "same_repeats", count: 4, occurrence: "consecutive" });
    } else {
      updateAt(index, { kind: "tracking_aggregate", trackingFieldId: fieldId, valueMode: "specific", expectedValue: "", mode: "contains", count: 1, occurrence: "any" });
    }
  }

  return (
    <div className="space-y-2">
      {rows.map((row, i) => {
        const kind = rowKindOf(row);
        const fieldOptions = kind === "repeats" ? REPEATABLE_FIELDS : TRACKING_FIELDS;
        return (
          <div key={i} className="rounded-lg border border-border bg-background p-2.5 space-y-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <select
                value={fieldIdOf(row)}
                onChange={(e) => {
                  if (row.kind === "field") updateAt(i, { ...row, fieldId: e.target.value });
                  else if (row.kind === "tracking_aggregate") updateAt(i, { ...row, trackingFieldId: e.target.value });
                }}
                className="rounded border border-border bg-background px-2 py-1.5 text-xs"
              >
                {fieldOptions.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
              <select
                value={kind}
                onChange={(e) => changeKind(i, e.target.value as RowKind)}
                className="rounded border border-border bg-background px-2 py-1.5 text-xs"
              >
                <option value="is">je</option>
                <option value="is_not">není</option>
                {allowCurrentRecord && <option value="repeats">opakuje se</option>}
                <option value="history">bylo v historii</option>
              </select>
              <button onClick={() => removeAt(i)} className="ml-auto text-muted-foreground hover:text-foreground">
                <X className="size-3.5" />
              </button>
            </div>

            {(kind === "is" || kind === "is_not") && row.kind === "field" && (
              <input
                value={row.value ?? ""}
                onChange={(e) => updateAt(i, { ...row, value: e.target.value })}
                placeholder="hodnota…"
                className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs"
              />
            )}

            {kind === "repeats" && row.kind === "tracking_aggregate" && (
              <div className="space-y-2">
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

            {kind === "history" && row.kind === "tracking_aggregate" && (
              <div className="space-y-2">
                <div className="flex gap-1">
                  <button
                    onClick={() => updateAt(i, { ...row, mode: "contains" })}
                    className={cn("rounded-md px-2 py-1 text-[11px] font-medium", (row.mode ?? "contains") === "contains" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}
                  >
                    je
                  </button>
                  <button
                    onClick={() => updateAt(i, { ...row, mode: "not_contains" })}
                    className={cn("rounded-md px-2 py-1 text-[11px] font-medium", row.mode === "not_contains" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}
                  >
                    není
                  </button>
                </div>
                <input
                  value={row.expectedValue ?? ""}
                  onChange={(e) => updateAt(i, { ...row, expectedValue: e.target.value })}
                  placeholder="hodnota…"
                  className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs"
                />
                <div className="flex items-center gap-4 text-xs flex-wrap">
                  <label className="flex items-center gap-1.5">
                    <input type="radio" checked={row.count <= 1} onChange={() => updateAt(i, { ...row, count: 1 })} />
                    v posledním záznamu
                  </label>
                  <label className={cn("flex items-center gap-1.5", row.count <= 1 && "opacity-40")}>
                    <input type="radio" checked={row.count > 1} onChange={() => updateAt(i, { ...row, count: Math.max(2, row.count) })} />
                    v posledních
                    <input
                      type="number"
                      min={2}
                      disabled={row.count <= 1}
                      value={row.count > 1 ? row.count : 2}
                      onChange={(e) => updateAt(i, { ...row, count: Math.max(2, Number(e.target.value)) })}
                      className="w-14 rounded border border-border bg-background px-1.5 py-1 text-xs text-center"
                    />
                    záznamech
                  </label>
                </div>
                <label className={cn("flex items-center gap-2 text-xs", row.count <= 1 && "opacity-40")}>
                  <input
                    type="checkbox"
                    disabled={row.count <= 1}
                    checked={row.occurrence === "consecutive"}
                    onChange={(e) => updateAt(i, { ...row, occurrence: e.target.checked ? "consecutive" : "any" })}
                  />
                  musí být nepřerušeně
                </label>
              </div>
            )}
          </div>
        );
      })}

      <button
        onClick={addRow}
        className="flex items-center gap-1 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary"
      >
        <Plus className="size-3" /> přidat podmínku
      </button>
    </div>
  );
}
