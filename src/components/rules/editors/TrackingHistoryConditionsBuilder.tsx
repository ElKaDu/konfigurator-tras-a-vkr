import { Plus, X } from "lucide-react";
import { TRACKING_FIELDS } from "@/lib/model/trackingFields";
import { cn } from "@/lib/utils";
import type { Condition } from "@/lib/model/types";

function isBlock2Condition(c: Condition): boolean {
  return c.kind === "tracking_aggregate" && c.valueMode === "specific";
}

export function TrackingHistoryConditionsBuilder({
  conditions,
  onChange,
}: {
  conditions: Condition[];
  onChange: (next: Condition[]) => void;
}) {
  const rows = conditions.filter(isBlock2Condition);

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
      { kind: "tracking_aggregate", trackingFieldId: "derivedStatus", valueMode: "specific", expectedValue: "", mode: "contains", count: 1, occurrence: "any" },
    ]);
  }

  return (
    <div className="space-y-2">
      {rows.map((row, i) => {
        if (row.kind !== "tracking_aggregate") return null;
        const scopeIsLast = row.count <= 1;
        return (
          <div key={i} className="rounded-lg border border-border bg-background p-2.5 space-y-2">
            <div className="flex gap-1">
              <button
                onClick={() => updateAt(i, { ...row, mode: "contains" })}
                className={cn("rounded-md px-2 py-1 text-[11px] font-medium", (row.mode ?? "contains") === "contains" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}
              >
                Obsahuje
              </button>
              <button
                onClick={() => updateAt(i, { ...row, mode: "not_contains" })}
                className={cn("rounded-md px-2 py-1 text-[11px] font-medium", row.mode === "not_contains" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}
              >
                Neobsahuje
              </button>
              <button onClick={() => removeAt(i)} className="ml-auto text-muted-foreground hover:text-foreground">
                <X className="size-3.5" />
              </button>
            </div>

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
              <input
                value={row.expectedValue ?? ""}
                onChange={(e) => updateAt(i, { ...row, expectedValue: e.target.value })}
                placeholder="hodnota…"
                className="flex-1 min-w-[100px] rounded border border-border bg-background px-2 py-1.5 text-xs"
              />
            </div>

            <div className="flex items-center gap-4 text-xs pl-1 flex-wrap">
              <label className="flex items-center gap-1.5">
                <input type="radio" checked={scopeIsLast} onChange={() => updateAt(i, { ...row, count: 1 })} />
                V posledním záznamu
              </label>
              <label className="flex items-center gap-1.5">
                <input type="radio" checked={!scopeIsLast} onChange={() => updateAt(i, { ...row, count: Math.max(2, row.count) })} />
                V posledních
                <input
                  type="number"
                  min={2}
                  value={!scopeIsLast ? row.count : 2}
                  onChange={(e) => updateAt(i, { ...row, count: Math.max(2, Number(e.target.value)) })}
                  className="w-14 rounded border border-border bg-background px-1.5 py-1 text-xs text-center"
                />
                záznamech
              </label>
            </div>

            <label className={cn("flex items-center gap-2 pl-1 text-xs", scopeIsLast && "opacity-40")}>
              <input
                type="checkbox"
                disabled={scopeIsLast}
                checked={row.occurrence === "consecutive"}
                onChange={(e) => updateAt(i, { ...row, occurrence: e.target.checked ? "consecutive" : "any" })}
              />
              musí být nepřerušeně
            </label>
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
