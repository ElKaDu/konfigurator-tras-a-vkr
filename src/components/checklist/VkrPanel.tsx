import type { ReactNode } from "react";
import { useChecklistVkrs, useChecklistItems, checklistVkrStore, checklistItemsStore } from "@/lib/checklist/store";
import { templateById } from "@/lib/checklist/store";
import { formatKontaktDateTime } from "@/lib/checklist/derived";
import { Button } from "@/components/ui/button";

export function VkrPanel() {
  const vkrs = useChecklistVkrs();
  const items = useChecklistItems();
  const openCount = vkrs.filter((v) => !v.resolved).length;

  function resolveVkr(vkrId: string, itemId: string) {
    const item = items.find((i) => i.id === itemId);
    checklistVkrStore.resolve(vkrId);
    checklistItemsStore.update(itemId, {
      state: "resolved_found",
      resolvedAt: new Date().toISOString(),
      resolvedBy: "E. Kadubcová",
      finding: item?.finding ?? item?.resolution ?? "Dodáno / vyřízeno.",
    });
  }

  return (
    <div className="rounded-lg border border-border bg-card p-3.5">
      <p className="mb-0.5 text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">
        Věci k řešení na checklistu
      </p>
      <p className="mb-2.5 text-[11px] text-muted-foreground">
        {openCount} otevřené (sledování) · {2 + vkrs.filter((v) => v.resolved).length} vyřešené (2 Krok 1 mock + sledování)
      </p>
      <div className="flex flex-col gap-2">
        <VkrRow dotClass="bg-success" title="Přiřazení objednávky — volný zákazník" meta="#4471-A · Krok 1 · mock · vyřešeno 9:38" muted />
        <VkrRow dotClass="bg-success" title="Čeká na zaplacení" meta="#4471-C · Krok 1 · mock · vyřešeno 9:42" muted />
        {vkrs.map((v) => {
          const item = items.find((i) => i.id === v.itemId);
          const tpl = item ? templateById(item.templateId) : undefined;
          return (
            <VkrRow
              key={v.id}
              dotClass={v.resolved ? "bg-success" : "bg-info"}
              title={v.title}
              meta={`${v.id} · vytvořeno ze sledování · termín ${formatKontaktDateTime(v.dueAt)}${tpl ? " · " + tpl.title : ""}`}
              muted={v.resolved}
              action={
                !v.resolved && item ? (
                  <Button size="sm" variant="outline" onClick={() => resolveVkr(v.id, item.id)}>
                    ✓ Vyřešit
                  </Button>
                ) : undefined
              }
            />
          );
        })}
      </div>
    </div>
  );
}

function VkrRow({
  dotClass,
  title,
  meta,
  muted,
  action,
}: {
  dotClass: string;
  title: string;
  meta: string;
  muted?: boolean;
  action?: ReactNode;
}) {
  return (
    <div className="flex gap-2">
      <span className={`mt-1.5 size-2 shrink-0 rounded-full ${dotClass}`} />
      <div className="min-w-0 flex-1">
        <div className={`text-[12.5px] font-semibold ${muted ? "text-muted-foreground font-medium" : ""}`}>{title}</div>
        <div className="mt-0.5 text-[11px] text-muted-foreground">{meta}</div>
        {action && <div className="mt-1.5">{action}</div>}
      </div>
    </div>
  );
}
