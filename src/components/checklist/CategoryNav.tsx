import { useChecklistItems } from "@/lib/checklist/store";
import { categoryCounts } from "@/lib/checklist/derived";
import type { ChecklistCategory } from "@/lib/checklist/types";

export function CategoryNav() {
  const items = useChecklistItems();
  const counts = categoryCounts(items);

  function scrollTo(category: string) {
    document.getElementById(`cat-${category}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /** Skočí na kapitolu a zároveň rozbalí její sekci "Hotovo" v hlavním sloupci. */
  function showDone(category: ChecklistCategory) {
    scrollTo(category);
    window.dispatchEvent(new CustomEvent("checklist:expand-done", { detail: category }));
  }

  return (
    <nav className="rounded-lg border border-border bg-card p-3.5">
      <p className="mb-2.5 text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">
        Kapitoly kontrol
      </p>
      <div className="flex flex-col">
        {counts.map((c) => (
          <div
            key={c.category}
            className="flex items-baseline justify-between gap-2 rounded-md px-2.5 py-1.5 text-[13px] hover:bg-muted"
          >
            <button onClick={() => scrollTo(c.category)} className="text-left">
              {c.label}
            </button>
            {c.resolved > 0 ? (
              <button
                onClick={() => showDone(c.category)}
                className="shrink-0 tabular-nums text-[11.5px] font-semibold text-primary hover:underline"
                title="Zobrazit vyřešené body"
              >
                {c.resolved}/{c.total}
              </button>
            ) : (
              <span className="shrink-0 tabular-nums text-[11.5px] text-muted-foreground">
                {c.resolved}/{c.total}
              </span>
            )}
          </div>
        ))}
      </div>
    </nav>
  );
}
