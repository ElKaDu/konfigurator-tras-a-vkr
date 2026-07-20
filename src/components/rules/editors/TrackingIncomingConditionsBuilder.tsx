import { FileText, Plus, X } from "lucide-react";
import {
  TRACKING_FIELDS,
  REPEATABLE_FIELDS,
  isIncomingConditionRow,
  incomingRowKindOf,
  type IncomingRowKind,
} from "@/lib/model/trackingFields";
import type { Condition } from "@/lib/model/types";

function fieldIdOf(row: Condition): string {
  return row.kind === "field" ? row.fieldId : row.kind === "tracking_aggregate" ? row.trackingFieldId : "";
}

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
    const fieldId = fieldIdOf(row);
    if (kind === "is" || kind === "is_not") {
      updateAt(index, {
        kind: "field",
        fieldId,
        operator: kind === "is" ? "je" : "není",
        value: row.kind === "field" ? (row.value ?? "") : "",
      });
    } else {
      const repeatableField = REPEATABLE_FIELDS.some((f) => f.value === fieldId) ? fieldId : REPEATABLE_FIELDS[0].value;
      updateAt(index, {
        kind: "tracking_aggregate",
        trackingFieldId: repeatableField,
        valueMode: "same_repeats",
        durationValue: 24,
        durationUnit: "h",
        continuous: true,
      });
    }
  }

  return (
    <div className="space-y-2">
      {rows.map((row, i) => {
        const kind = incomingRowKindOf(row);
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
                onChange={(e) => changeKind(i, e.target.value as IncomingRowKind)}
                className="rounded border border-border bg-background px-2 py-1.5 text-xs"
              >
                <option value="is">je</option>
                <option value="is_not">není</option>
                <option value="repeats">opakuje se</option>
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
                  Bez konkrétní hodnoty — hlídá, jak dlouho pole nemění hodnotu. Vyhodnocuje se jen při nové
                  tracking události.
                </div>
                <a
                  href="https://claude.ai/code/artifact/2fd59815-c4c2-4d56-b0a6-e777c8b0fbed"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                >
                  <FileText className="size-3" /> Zadání pro implementaci — časové okno
                </a>
                <div className="flex items-center gap-2">
                  <span className="text-xs">hodnota platí už</span>
                  <input
                    type="number"
                    min={1}
                    value={row.durationValue}
                    onChange={(e) => updateAt(i, { ...row, durationValue: Number(e.target.value) })}
                    className="w-16 rounded border border-border bg-background px-2 py-1.5 text-xs text-center"
                  />
                  <select
                    value={row.durationUnit}
                    onChange={(e) => updateAt(i, { ...row, durationUnit: e.target.value as "h" | "d" })}
                    className="rounded border border-border bg-background px-2 py-1.5 text-xs"
                  >
                    <option value="h">hodin</option>
                    <option value="d">dní</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={row.continuous}
                    onChange={(e) => updateAt(i, { ...row, continuous: e.target.checked })}
                  />
                  musí to být nepřerušeně
                  <span className="text-[11px] text-muted-foreground">(vypnuto = sčítá se i s přestávkami)</span>
                </label>

                <div className="border-t border-dashed border-border pt-2 space-y-1.5">
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={!!row.resetOn}
                      onChange={(e) =>
                        updateAt(i, {
                          ...row,
                          resetOn: e.target.checked ? { fieldId: "derivedStatus", operator: "contains", value: "" } : undefined,
                        })
                      }
                    />
                    resetovat časomíru, když se objeví status
                  </label>
                  {row.resetOn && (
                    <div className="flex items-center gap-1.5 pl-6 flex-wrap">
                      <select
                        value={row.resetOn.fieldId}
                        onChange={(e) => updateAt(i, { ...row, resetOn: { ...row.resetOn!, fieldId: e.target.value } })}
                        className="rounded border border-border bg-background px-2 py-1 text-xs"
                      >
                        {TRACKING_FIELDS.map((f) => (
                          <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                      </select>
                      <select
                        value={row.resetOn.operator}
                        onChange={(e) =>
                          updateAt(i, { ...row, resetOn: { ...row.resetOn!, operator: e.target.value as "contains" | "not_contains" } })
                        }
                        className="rounded border border-border bg-background px-2 py-1 text-xs"
                      >
                        <option value="contains">obsahuje</option>
                        <option value="not_contains">neobsahuje</option>
                      </select>
                      <input
                        value={row.resetOn.value}
                        onChange={(e) => updateAt(i, { ...row, resetOn: { ...row.resetOn!, value: e.target.value } })}
                        placeholder="hodnota…"
                        className="flex-1 min-w-[100px] rounded border border-border bg-background px-2 py-1 text-xs"
                      />
                    </div>
                  )}
                  <p className="text-[11px] text-muted-foreground pl-6">
                    Takový záznam pravidlo samo nikdy nespustí a časomíra od něj počítá znovu.
                  </p>
                </div>
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
