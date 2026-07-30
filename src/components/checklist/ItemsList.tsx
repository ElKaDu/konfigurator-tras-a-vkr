import { useEffect, useState } from "react";
import { useChecklistItems } from "@/lib/checklist/store";
import { templateById } from "@/lib/checklist/store";
import { CHECKLIST_CATEGORY_ORDER, CHECKLIST_CATEGORY_LABELS } from "@/lib/checklist/types";
import type { ChecklistCategory, ChecklistItem } from "@/lib/checklist/types";
import { categoryCounts, deriveItemState } from "@/lib/checklist/derived";
import { ChecklistItemRow } from "./ChecklistItemRow";

export function ItemsList() {
  const items = useChecklistItems();
  const counts = categoryCounts(items);

  return (
    <div className="flex flex-col gap-4">
      {CHECKLIST_CATEGORY_ORDER.map((category) => {
        const inCategory = items.filter((i) => templateById(i.templateId)?.category === category);
        const open = inCategory.filter((i) => deriveItemState(i) !== "resolved");
        const done = inCategory.filter((i) => deriveItemState(i) === "resolved");
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
              {open.map((item) => {
                const tpl = templateById(item.templateId);
                if (!tpl) return null;
                return <ChecklistItemRow key={item.id} item={item} template={tpl} />;
              })}
              {done.length > 0 && <DoneDisclosure category={category} items={done} />}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function DoneDisclosure({ category, items }: { category: ChecklistCategory; items: ChecklistItem[] }) {
  const [expanded, setExpanded] = useState(false);

  // Proklik z levého panelu (CategoryNav) rozbalí správnou sekci — komunikace přes window event,
  // ať CategoryNav nemusí vlastnit stav, který patří sem.
  useEffect(() => {
    function onExpand(e: Event) {
      if ((e as CustomEvent<string>).detail === category) setExpanded(true);
    }
    window.addEventListener("checklist:expand-done", onExpand);
    return () => window.removeEventListener("checklist:expand-done", onExpand);
  }, [category]);

  return (
    <div className="py-1.5">
      <button
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        className="w-full rounded-md bg-muted px-2.5 py-1.5 text-left text-[12px] font-bold text-muted-foreground"
      >
        {expanded ? "▾" : "▸"} Hotovo ({items.length})
      </button>
      {expanded && (
        <div className="pl-3">
          {items.map((item) => {
            const tpl = templateById(item.templateId);
            if (!tpl) return null;
            return <ChecklistItemRow key={item.id} item={item} template={tpl} />;
          })}
        </div>
      )}
    </div>
  );
}
