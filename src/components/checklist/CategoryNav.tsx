import { useChecklistItems } from "@/lib/checklist/store";
import { categoryCounts } from "@/lib/checklist/derived";

export function CategoryNav() {
  const items = useChecklistItems();
  const counts = categoryCounts(items);

  function scrollTo(category: string) {
    document.getElementById(`cat-${category}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <nav className="rounded-lg border border-border bg-card p-3.5">
      <p className="mb-2.5 text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">
        Kapitoly kontrol
      </p>
      <div className="flex flex-col">
        {counts.map((c) => (
          <button
            key={c.category}
            onClick={() => scrollTo(c.category)}
            className="flex items-baseline justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px] hover:bg-muted"
          >
            <span>{c.label}</span>
            <span className="tabular-nums text-[11.5px] text-muted-foreground">
              {c.resolved}/{c.total}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
