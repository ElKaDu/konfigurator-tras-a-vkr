import { useChecklistVkrs, useChecklistItems, checklistVkrStore, checklistItemsStore, templateById } from "@/lib/checklist/store";
import { formatKontaktDateTime } from "@/lib/checklist/derived";
import type { ChecklistVkr } from "@/lib/checklist/types";
import { Button } from "@/components/ui/button";

export function VkrCards() {
  const vkrs = useChecklistVkrs();
  const items = useChecklistItems();

  if (vkrs.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">Věci k řešení</p>
      {vkrs.map((vkr) => {
        const item = items.find((i) => i.id === vkr.itemId);
        const tpl = item ? templateById(item.templateId) : undefined;
        return (
          <div key={vkr.id} id={`vkr-${vkr.id}`} className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-baseline justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[12.5px] font-bold">{vkr.title}</div>
                <div className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                  {tpl?.title ?? "—"}
                </div>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  vkr.resolved
                    ? "bg-success/15 text-success-foreground"
                    : "bg-warning/15 text-warning-foreground"
                }`}
              >
                {vkr.resolved ? "vyřešeno" : "sledování"}
              </span>
            </div>

            <div className="mt-2 rounded-md bg-muted px-2.5 py-2">
              <div className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                Řešení k dosledování
              </div>
              <div className="font-mono text-[11px]">{item?.resolutionValue ?? "—"}</div>
            </div>

            <div className="mt-2 text-[10.5px] text-muted-foreground">
              termín {formatKontaktDateTime(vkr.dueAt)}
            </div>

            {!vkr.resolved && item && (
              <Button
                size="sm"
                variant="outline"
                className="mt-2 w-full"
                onClick={() => resolveVkr(vkr, item.id)}
              >
                ✓ Vyřešit
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Odbavení VkŘ zároveň uzavírá navázanou položku — stejná logika, jakou měl dřív VkrPanel. */
function resolveVkr(vkr: ChecklistVkr, itemId: string) {
  checklistVkrStore.resolve(vkr.id);
  checklistItemsStore.update(itemId, {
    manuallyResolved: true,
    resolvedAt: new Date().toISOString(),
    resolvedBy: "E. Kadubcová",
  });
}
