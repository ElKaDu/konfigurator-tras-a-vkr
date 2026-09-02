import { Trash2 } from "@/components/ui/icon";
import { Link } from "@tanstack/react-router";
import { ActionTagPicker } from "./ActionTagPicker";
import { useActionTags } from "@/lib/model/store";
import { cn } from "@/lib/utils";
import type { Priority, Severity } from "@/lib/model/types";

export function SeverityCard({
  severity,
  situationId,
  usageCount,
  onChange,
  onRemove,
}: {
  severity: Severity;
  situationId: string;
  usageCount: number;
  onChange: (next: Severity) => void;
  onRemove: () => void;
}) {
  const actionTags = useActionTags();
  const tagLabel = (id: string) => actionTags.find((t) => t.id === id)?.label ?? id;

  function updateAction(actionId: string, patch: Partial<Severity["actions"][number]>) {
    onChange({
      ...severity,
      actions: severity.actions.map((a) => (a.id === actionId ? { ...a, ...patch } : a)),
    });
  }

  function removeAction(actionId: string) {
    onChange({ ...severity, actions: severity.actions.filter((a) => a.id !== actionId) });
  }

  return (
    <div className="rounded-xl border border-border bg-background p-4 space-y-3">
      <div className="flex items-center gap-2">
        <input
          value={severity.name}
          onChange={(e) => onChange({ ...severity, name: e.target.value })}
          className="flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm font-medium"
        />
        <button
          disabled={usageCount > 0}
          onClick={onRemove}
          title={usageCount > 0 ? `Používá se v ${usageCount} pravidlech` : "Smazat závažnost"}
          className={cn(
            "rounded-md p-1.5 text-muted-foreground transition-colors",
            usageCount > 0 ? "opacity-30 cursor-not-allowed" : "hover:text-red-500"
          )}
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Priorita</label>
        <select
          value={severity.priority}
          onChange={(e) => onChange({ ...severity, priority: e.target.value as Priority })}
          className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm"
        >
          <option value="low">Nízká</option>
          <option value="medium">Vyšší</option>
          <option value="high">Vysoká</option>
          <option value="urgent">Urgentní</option>
        </select>
      </div>

      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Přiřazené akce
        </div>
        <div className="space-y-2">
          {severity.actions.map((a) => (
            <div key={a.id} className="rounded-lg border border-border bg-muted/20 p-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary">
                  {tagLabel(a.actionTagId)}
                </span>
                <button onClick={() => removeAction(a.id)} className="text-muted-foreground hover:text-red-500 text-xs">
                  Odebrat
                </button>
              </div>
              <textarea
                value={a.description ?? ""}
                onChange={(e) => updateAction(a.id, { description: e.target.value })}
                placeholder="Výchozí text pro operátora…"
                rows={2}
                className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs resize-none"
              />
            </div>
          ))}
        </div>
        <div className="mt-2">
          <ActionTagPicker
            excludeIds={severity.actions.map((a) => a.actionTagId)}
            onPick={(tag) =>
              onChange({
                ...severity,
                actions: [...severity.actions, { id: "sa_" + Date.now(), actionTagId: tag.id, description: "" }],
              })
            }
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <span className="text-xs text-muted-foreground">
          {usageCount} {usageCount === 1 ? "pravidlo" : usageCount < 5 ? "pravidla" : "pravidel"}
        </span>
        <Link
          to="/rules/new"
          search={{ situationId, severityId: severity.id }}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          + Pravidlo pro tuto závažnost
        </Link>
      </div>
    </div>
  );
}
