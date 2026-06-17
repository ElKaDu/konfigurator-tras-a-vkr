import { useEffect, useRef, useState } from "react";
import { Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProblemTypes, problemTypesStore, usageCountByRoute, type ProblemType } from "@/lib/routes/problemTypes";
import { useRoutes } from "@/lib/routes/store";

/**
 * Combobox pro výběr nebo vytvoření typu problému ze sdíleného slovníku.
 * Při výběru pošle `onChange(problemType.id)`. Při napsání nového názvu
 * nabídne „+ Vytvořit „...""; po kliknutí typ vytvoří přes `upsertByName`.
 */
export function ProblemTypeCombobox({
  value,
  onChange,
  excludeIds = [],
  placeholder = "Vyber typ problému nebo zadej nový…",
}: {
  value?: string;
  onChange: (id: string) => void;
  excludeIds?: string[];
  placeholder?: string;
}) {
  const types = useProblemTypes();
  const routes = useRoutes();
  const selected = types.find((t) => t.id === value);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const trimmed = input.trim();
  const filtered: ProblemType[] = types.filter((t) =>
    !excludeIds.includes(t.id) &&
    (!trimmed || t.name.toLowerCase().includes(trimmed.toLowerCase())),
  );
  const exactMatch = types.find((t) => t.name.toLowerCase() === trimmed.toLowerCase());
  const canCreate = trimmed.length > 0 && !exactMatch;

  const usageHint = selected ? `existuje na ${usageCountByRoute(selected.id, routes)} ${pluralRoute(usageCountByRoute(selected.id, routes))}` : null;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); setInput(""); }}
        className="flex w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-left text-sm hover:border-primary/40"
      >
        {selected ? (
          <span className="flex items-baseline gap-2">
            <span className="font-medium">{selected.name}</span>
            {usageHint && <span className="text-[11px] text-muted-foreground">· {usageHint}</span>}
          </span>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
        <span className="text-muted-foreground">▾</span>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-[280px] overflow-y-auto rounded-md border border-border bg-background shadow-lg">
          <div className="border-b border-border p-2">
            <input
              autoFocus
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Hledat nebo napsat nový název…"
              className="w-full rounded border border-border bg-background px-2 py-1 text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="py-1">
            {filtered.length === 0 && !canCreate && (
              <div className="px-3 py-2 text-xs italic text-muted-foreground">Žádný typ neodpovídá hledání.</div>
            )}
            {filtered.map((t) => {
              const usage = usageCountByRoute(t.id, routes);
              const isSel = t.id === value;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => { onChange(t.id); setOpen(false); }}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-muted/60",
                    isSel && "bg-primary-soft",
                  )}
                >
                  {isSel ? <Check className="size-3.5 text-primary" /> : <span className="size-3.5" />}
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{t.name}</div>
                    {t.description && <div className="truncate text-[11px] text-muted-foreground">{t.description}</div>}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{usage}× {pluralRoute(usage)}</span>
                </button>
              );
            })}
            {canCreate && (
              <button
                type="button"
                onClick={() => {
                  const created = problemTypesStore.upsertByName(trimmed);
                  onChange(created.id);
                  setOpen(false);
                  setInput("");
                }}
                className="flex w-full items-center gap-2 border-t border-border px-3 py-2 text-left text-sm text-primary hover:bg-primary-soft"
              >
                <Plus className="size-3.5" />
                <span>Vytvořit „<span className="font-medium">{trimmed}</span>"</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function pluralRoute(n: number): string {
  if (n === 1) return "trase";
  if (n >= 2 && n <= 4) return "trasách";
  return "trasách";
}
