import { useState } from "react";
import { Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useActionTags, actionTagsStore } from "@/lib/model/store";
import type { ActionTag } from "@/lib/model/types";

export function ActionTagPicker({
  excludeIds,
  onPick,
}: {
  excludeIds: string[];
  onPick: (tag: ActionTag) => void;
}) {
  const tags = useActionTags();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const available = tags.filter((t) => !excludeIds.includes(t.id));
  const filtered = available.filter((t) => t.label.toLowerCase().includes(query.toLowerCase()));
  const exactMatch = tags.some((t) => t.label.toLowerCase() === query.trim().toLowerCase());

  function pick(tag: ActionTag) {
    onPick(tag);
    setOpen(false);
    setQuery("");
  }

  function createAndPick() {
    const label = query.trim();
    if (!label) return;
    const tag: ActionTag = { id: "at_" + Date.now(), label };
    actionTagsStore.upsert(tag);
    pick(tag);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 rounded-lg border border-dashed border-border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors">
          <Plus className="size-3.5" /> Přidat akci
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-0 overflow-hidden" sideOffset={4}>
        <div className="border-b border-border px-2.5 py-1.5">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Hledat nebo vytvořit akci…"
            className="w-full bg-transparent text-xs focus:outline-none"
          />
        </div>
        <div className="max-h-56 overflow-y-auto p-1">
          {filtered.map((tag) => (
            <button
              key={tag.id}
              onClick={() => pick(tag)}
              className="w-full rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted/60"
            >
              {tag.label}
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="px-2 py-3 text-center text-xs text-muted-foreground">Nic nenalezeno</div>
          )}
          {query.trim() && !exactMatch && (
            <button
              onClick={createAndPick}
              className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-primary hover:bg-primary-soft/40"
            >
              <Plus className="size-3" /> Vytvořit „{query.trim()}"
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
