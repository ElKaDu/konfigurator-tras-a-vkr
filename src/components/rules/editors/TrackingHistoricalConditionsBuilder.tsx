import { Plus, X } from "lucide-react";
import { TRACKING_FIELDS, isHistoricalConditionRow } from "@/lib/model/trackingFields";
import { cn } from "@/lib/utils";
import type { Condition } from "@/lib/model/types";

export function TrackingHistoricalConditionsBuilder({
  conditions,
  onChange,
  triggerType,
}: {
  conditions: Condition[];
  onChange: (next: Condition[]) => void;
  triggerType?: "automatic" | "timer";
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
            <select
              value={row.mode ?? "contains"}
              onChange={(e) => updateAt(i, { ...row, mode: e.target.value as "contains" | "not_contains" })}
              className="rounded border border-border bg-background px-2 py-1.5 text-xs"
            >
              <option value="contains">je</option>
              <option value="not_contains">není</option>
            </select>
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

          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Kde hledat
            </div>
            <div className="inline-flex gap-1 rounded-lg bg-muted/40 p-1">
              <button
                onClick={() => updateAt(i, { ...row, scope: "recent" })}
                className={cn(
                  "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
                  row.scope === "recent" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {triggerType === "automatic" ? "Jen předchozí záznam" : "Jen aktuální záznam"}
              </button>
              <button
                onClick={() => updateAt(i, { ...row, scope: "anywhere" })}
                className={cn(
                  "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
                  row.scope === "anywhere" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                kdekoliv v historii
              </button>
            </div>
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
