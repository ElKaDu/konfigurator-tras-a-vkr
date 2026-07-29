import { useChecklistItems } from "@/lib/checklist/store";
import { templateById } from "@/lib/checklist/store";
import { CHECKLIST_CATEGORY_ORDER, CHECKLIST_CATEGORY_LABELS } from "@/lib/checklist/types";
import { categoryCounts } from "@/lib/checklist/derived";
import { ChecklistItemRow } from "./ChecklistItemRow";

export function ItemsList() {
  const items = useChecklistItems();
  const counts = categoryCounts(items);

  return (
    <div className="flex flex-col gap-4">
      {CHECKLIST_CATEGORY_ORDER.map((category) => {
        const inCategory = items.filter((i) => templateById(i.templateId)?.category === category);
        const count = counts.find((c) => c.category === category);
        return (
          <section key={category} id={`cat-${category}`} className="rounded-lg border border-border bg-card">
            <div className="flex items-baseline justify-between border-b border-border bg-secondary px-4 py-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wide">{CHECKLIST_CATEGORY_LABELS[category]}</span>
              <span className="tabular-nums text-[11.5px] text-muted-foreground">
                {count?.resolved}/{count?.total}
              </span>
            </div>
            <div className="px-4">
              {inCategory.map((item) => {
                const tpl = templateById(item.templateId);
                if (!tpl) return null;
                return <ChecklistItemRow key={item.id} item={item} template={tpl} />;
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
