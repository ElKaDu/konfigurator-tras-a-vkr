import { MapPin, Archive, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Route } from "@/lib/routes/types";

export type RouteSelection =
  | { kind: "all" }
  | { kind: "active" }
  | { kind: "archived" }
  | { kind: "carrier"; carrier: string };

export function RoutesSidebar({
  routes,
  selection,
  onSelect,
}: {
  routes: Route[];
  selection: RouteSelection;
  onSelect: (s: RouteSelection) => void;
}) {
  const total = routes.filter((r) => !r.archivedAt).length;
  const active = routes.filter((r) => r.active && !r.archivedAt).length;
  const archived = routes.filter((r) => !!r.archivedAt).length;

  const byCarrier = new Map<string, number>();
  for (const r of routes) {
    if (r.archivedAt) continue;
    for (const c of r.carriers) byCarrier.set(c, (byCarrier.get(c) ?? 0) + 1);
  }

  return (
    <aside className="flex h-full w-[260px] shrink-0 flex-col border-r border-border bg-surface">
      <div className="px-4 pt-5 pb-3">
        <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Trasy</div>
      </div>

      <nav className="px-2">
        <Item label="Všechny trasy" count={total} active={selection.kind === "all"} onClick={() => onSelect({ kind: "all" })} />
        <Item label="Pouze aktivní" count={active} active={selection.kind === "active"} onClick={() => onSelect({ kind: "active" })} />
        <Item label="Archiv" count={archived} active={selection.kind === "archived"} onClick={() => onSelect({ kind: "archived" })} icon={Archive} />
      </nav>

      <div className="mt-4 flex items-center justify-between px-4 pb-2">
        <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Podle dopravce</div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {[...byCarrier.entries()].sort((a, b) => b[1] - a[1]).map(([carrier, count]) => {
          const isActive = selection.kind === "carrier" && selection.carrier === carrier;
          return (
            <button
              key={carrier}
              onClick={() => onSelect({ kind: "carrier", carrier })}
              className={cn(
                "flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left transition-colors",
                isActive ? "bg-primary-soft text-primary" : "text-foreground hover:bg-muted/60",
              )}
            >
              <MapPin className={cn("mt-0.5 size-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{carrier}</div>
              </div>
              <span className={cn(
                "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                isActive ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
              )}>
                {count}
              </span>
            </button>
          );
        })}
        {byCarrier.size === 0 && (
          <div className="px-2 py-2 text-xs italic text-muted-foreground">Zatím žádní dopravci.</div>
        )}
      </div>
    </aside>
  );
}

function Item({ label, count, active, onClick, icon: Icon }: { label: string; count: number; active: boolean; onClick: () => void; icon?: typeof Archive }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
        active ? "bg-primary-soft text-primary" : "text-foreground hover:bg-muted/60",
      )}
    >
      <span className="flex items-center gap-2">
        {Icon && <Icon className="size-4 text-muted-foreground" />}
        {label}
      </span>
      <span className={cn(
        "rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
        active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
      )}>
        {count}
      </span>
    </button>
  );
}
