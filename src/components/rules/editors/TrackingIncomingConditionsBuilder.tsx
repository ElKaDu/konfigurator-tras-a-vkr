import { Plus, X } from "@/components/ui/icon";
import { TRACKING_FIELDS, isIncomingConditionRow, incomingRowKindOf, type IncomingRowKind } from "@/lib/model/trackingFields";
import type { Condition } from "@/lib/model/types";

export function TrackingIncomingConditionsBuilder({
  conditions,
  onChange,
}: {
  conditions: Condition[];
  onChange: (next: Condition[]) => void;
}) {
  const rows = conditions.filter(isIncomingConditionRow);

  function updateAt(index: number, next: Condition) {
    const target = rows[index];
    onChange(conditions.map((c) => (c === target ? next : c)));
  }

  function removeAt(index: number) {
    const target = rows[index];
    onChange(conditions.filter((c) => c !== target));
  }

  function addRow() {
    onChange([...conditions, { kind: "field", fieldId: "derivedStatus", operator: "je", value: "" }]);
  }

  function changeKind(index: number, kind: IncomingRowKind) {
    const row = rows[index];
    updateAt(index, { ...row, operator: kind === "is_not" ? "není" : "je" });
  }

  return (
    <div className="space-y-2">
      {rows.map((row, i) => {
        const kind = incomingRowKindOf(row);
        return (
          <div key={i} className="rounded-lg border border-border bg-background p-2.5 space-y-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <select
                value={row.fieldId}
                onChange={(e) => updateAt(i, { ...row, fieldId: e.target.value })}
                className="rounded border border-border bg-background px-2 py-1.5 text-[13px]"
              >
                {TRACKING_FIELDS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
              <select
                value={kind}
                onChange={(e) => changeKind(i, e.target.value as IncomingRowKind)}
                className="rounded border border-border bg-background px-2 py-1.5 text-[13px]"
              >
                <option value="is">je</option>
                <option value="is_not">není</option>
              </select>
              <button onClick={() => removeAt(i)} className="ml-auto text-muted-foreground hover:text-foreground">
                <X className="size-3.5" />
              </button>
            </div>

            <input
              value={row.value ?? ""}
              onChange={(e) => updateAt(i, { ...row, value: e.target.value })}
              placeholder="hodnota…"
              className="w-full rounded border border-border bg-background px-2 py-1.5 text-[13px]"
            />
          </div>
        );
      })}

      <button
        onClick={addRow}
        className="flex items-center gap-1 rounded-lg border border-dashed border-border px-3 py-1.5 text-[13px] text-muted-foreground hover:border-primary hover:text-primary"
      >
        <Plus className="size-3" /> přidat podmínku
      </button>
    </div>
  );
}
