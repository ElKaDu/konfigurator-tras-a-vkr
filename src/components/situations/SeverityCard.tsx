import { Trash2 } from "@/components/ui/icon";
import { ActionTagPicker } from "./ActionTagPicker";
import { useActionTags } from "@/lib/model/store";
import { cn } from "@/lib/utils";
import type { Priority, Severity } from "@/lib/model/types";

export function SeverityCard({
  severity,
  usageCount,
  onChange,
  onRemove,
}: {
  severity: Severity;
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
    <div className="space-y-3.5 rounded-md bg-card p-5 elevation-2">
      <div className="flex items-center gap-2">
        <input
          value={severity.name}
          onChange={(e) => onChange({ ...severity, name: e.target.value })}
          className="h-[42px] w-full rounded-md border border-input bg-card px-3.5 text-sm outline-none transition-colors focus:border-primary flex-1 font-medium"
        />
        <button
          disabled={usageCount > 0}
          onClick={onRemove}
          title={usageCount > 0 ? `Používá se v ${usageCount} pravidlech` : "Smazat závažnost"}
          className={cn(
            "grid size-[34px] shrink-0 place-items-center rounded-md text-muted-foreground transition-colors",
            usageCount > 0 ? "cursor-not-allowed opacity-30" : "hover:bg-destructive/10 hover:text-destructive"
          )}
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div>
        <label className="text-overline mb-1.5 block">Priorita</label>
        <select
          value={severity.priority}
          onChange={(e) => onChange({ ...severity, priority: e.target.value as Priority })}
          className="h-[42px] rounded-md border border-input bg-card px-3 text-sm outline-none transition-colors focus:border-primary"
        >
          <option value="low">Nízká</option>
          <option value="medium">Vyšší</option>
          <option value="high">Vysoká</option>
          <option value="urgent">Urgentní</option>
        </select>
      </div>

      <div>
        <div className="text-overline mb-2">Přiřazené akce</div>
        <div className="space-y-2">
          {severity.actions.map((a) => (
            <div key={a.id} className="rounded-md border border-border bg-muted/50 p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="inline-flex h-6 items-center rounded-full bg-primary-soft px-2.5 text-[13px] font-medium leading-5 text-accent-foreground">
                  {tagLabel(a.actionTagId)}
                </span>
                <button onClick={() => removeAction(a.id)} className="text-[13px] text-muted-foreground transition-colors hover:text-destructive">
                  Odebrat
                </button>
              </div>
              <textarea
                value={a.description ?? ""}
                onChange={(e) => updateAction(a.id, { description: e.target.value })}
                placeholder="Výchozí text pro operátora…"
                rows={2}
                className="w-full resize-none rounded-md border border-input bg-card px-3 py-2 text-[13px] outline-none transition-colors focus:border-primary"
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

      <div className="border-t border-border pt-3 text-[13px] text-muted-foreground">
        {usageCount} {usageCount === 1 ? "pravidlo" : usageCount < 5 ? "pravidla" : "pravidel"}
      </div>
    </div>
  );
}
