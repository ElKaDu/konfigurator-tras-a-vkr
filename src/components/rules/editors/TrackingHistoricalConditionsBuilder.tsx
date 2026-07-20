import { Plus, X } from "lucide-react";
import { TRACKING_FIELDS, isHistoricalConditionRow } from "@/lib/model/trackingFields";
import { cn } from "@/lib/utils";
import type { Condition } from "@/lib/model/types";

export function TrackingHistoricalConditionsBuilder({
  conditions,
  onChange,
}: {
  conditions: Condition[];
  onChange: (next: Condition[]) => void;
}) {
  const rows = conditions.filter(isHistoricalConditionRow);

  function updateAt(index: number, next: Condition) {
    const target = rows[index];
    onChange(conditions.map((c) => (c === target ? next : c)));
  }

  function removeAt(index: number) {
    const target = rows[index];
    onChange(conditions.filter((c) => c !== target));
  }

  function addRow() {
    onChange([
      ...conditions,
      {
        kind: "tracking_aggregate",
        trackingFieldId: "derivedStatus",
        valueMode: "specific",
        expectedValue: "",
        mode: "contains",
        count: 1,
        countOperator: "eq",
        occurrence: "any",
        scope: "recent",
      },
    ]);
  }

  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div key={i} className="rounded-lg border border-border bg-background p-2.5 space-y-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <select
              value={row.trackingFieldId}
              onChange={(e) => updateAt(i, { ...row, trackingFieldId: e.target.value })}
              className="rounded border border-border bg-background px-2 py-1.5 text-xs"
            >
              {TRACKING_FIELDS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
            <div className="flex gap-1">
              <button
                onClick={() => updateAt(i, { ...row, mode: "contains" })}
                className={cn(
                  "rounded-md px-2 py-1 text-[11px] font-medium",
                  (row.mode ?? "contains") === "contains" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}
              >
                je
              </button>
              <button
                onClick={() => updateAt(i, { ...row, mode: "not_contains" })}
                className={cn(
                  "rounded-md px-2 py-1 text-[11px] font-medium",
                  row.mode === "not_contains" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}
              >
                není
              </button>
            </div>
            <button onClick={() => removeAt(i)} className="ml-auto text-muted-foreground hover:text-foreground">
              <X className="size-3.5" />
            </button>
          </div>

          <input
            value={row.expectedValue ?? ""}
            onChange={(e) => updateAt(i, { ...row, expectedValue: e.target.value })}
            placeholder="hodnota…"
            className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs"
          />

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">počet záznamů</span>
            <select
              value={row.countOperator}
              onChange={(e) => updateAt(i, { ...row, countOperator: e.target.value as typeof row.countOperator })}
              className="rounded border border-border bg-background px-2 py-1.5 text-xs"
            >
              <option value="gt">větší než</option>
              <option value="lt">menší než</option>
              <option value="eq">rovno</option>
              <option value="any">nerozhoduje</option>
            </select>
            <input
              type="number"
              min={1}
              disabled={row.countOperator === "any"}
              value={row.count}
              onChange={(e) => updateAt(i, { ...row, count: Number(e.target.value) })}
              className="w-16 rounded border border-border bg-background px-2 py-1.5 text-xs text-center disabled:opacity-40"
            />
          </div>

          <div className="flex items-center gap-4 text-xs flex-wrap">
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={row.scope === "recent"}
                onChange={(e) => updateAt(i, { ...row, scope: e.target.checked ? "recent" : "anywhere" })}
              />
              jde o poslední záznamy
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={row.occurrence === "consecutive"}
                onChange={(e) => updateAt(i, { ...row, occurrence: e.target.checked ? "consecutive" : "any" })}
              />
              musí být za sebou
            </label>
          </div>
        </div>
      ))}

      <button
        onClick={addRow}
        className="flex items-center gap-1 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary"
      >
        <Plus className="size-3" /> přidat podmínku
      </button>
    </div>
  );
}
