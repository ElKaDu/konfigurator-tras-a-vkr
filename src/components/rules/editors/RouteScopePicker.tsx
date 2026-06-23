import { useMemo, useState } from "react";
import { Plus, X, Search, Route as RouteIcon } from "lucide-react";
import { useRoutes } from "@/lib/model/store";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface RouteScope {
  mode: "all" | "selected";
  routeIds: string[];
  excludedRouteIds?: string[];
}

export function RouteScopePicker({
  value,
  onChange,
  allowExclude = false,
}: {
  value: RouteScope;
  onChange: (next: RouteScope) => void;
  allowExclude?: boolean;
}) {
  const routes = useRoutes();
  const activeRoutes = useMemo(() => routes.filter((r) => r.active), [routes]);
  const [excludeOpen, setExcludeOpen] = useState(
    Boolean(value.excludedRouteIds && value.excludedRouteIds.length > 0),
  );

  function setMode(mode: "all" | "selected") {
    onChange({ ...value, mode });
  }

  function setRouteIds(ids: string[]) {
    onChange({ ...value, routeIds: ids });
  }

  function setExcludedIds(ids: string[]) {
    onChange({ ...value, excludedRouteIds: ids });
  }

  return (
    <div className="rounded-xl border border-border bg-muted/10 p-3 space-y-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Pro které trasy
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <ModeButton
          active={value.mode === "all"}
          label="Všechny aktivní trasy"
          sub={`${activeRoutes.length} trasy`}
          onClick={() => setMode("all")}
        />
        <ModeButton
          active={value.mode === "selected"}
          label="Vybrané trasy"
          sub={
            value.routeIds.length > 0
              ? `${value.routeIds.length} vybráno`
              : "žádná vybrána"
          }
          onClick={() => setMode("selected")}
        />
      </div>

      {value.mode === "selected" && (
        <RouteChipPicker
          allRoutes={activeRoutes}
          selectedIds={value.routeIds}
          onChange={setRouteIds}
          label="Vybrané"
        />
      )}

      {allowExclude && (
        <div>
          {!excludeOpen ? (
            <button
              onClick={() => setExcludeOpen(true)}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
            >
              <Plus className="size-3" /> vyloučit některé trasy
            </button>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Vyloučit trasy
                </div>
                <button
                  onClick={() => {
                    setExcludeOpen(false);
                    setExcludedIds([]);
                  }}
                  className="text-[11px] text-muted-foreground hover:text-foreground"
                >
                  zrušit
                </button>
              </div>
              <RouteChipPicker
                allRoutes={activeRoutes}
                selectedIds={value.excludedRouteIds ?? []}
                onChange={setExcludedIds}
                label="Vyloučeno"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ModeButton({
  active,
  label,
  sub,
  onClick,
}: {
  active: boolean;
  label: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-lg border px-2.5 py-2 text-left transition-colors",
        active
          ? "border-primary bg-primary-soft/30 text-primary"
          : "border-border hover:border-primary/30 text-foreground",
      )}
    >
      <div className="text-xs font-medium">{label}</div>
      <div
        className={cn(
          "text-[10px]",
          active ? "text-primary/70" : "text-muted-foreground",
        )}
      >
        {sub}
      </div>
    </button>
  );
}

function RouteChipPicker({
  allRoutes,
  selectedIds,
  onChange,
  label,
}: {
  allRoutes: { id: string; name: string; code: string }[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = allRoutes.filter((r) =>
    (r.name + " " + r.code).toLowerCase().includes(query.toLowerCase()),
  );

  function toggle(id: string) {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id],
    );
  }

  const selectedRoutes = allRoutes.filter((r) => selectedIds.includes(r.id));

  return (
    <div className="rounded-lg border border-border bg-background p-2 space-y-1.5">
      <div className="flex flex-wrap gap-1">
        {selectedRoutes.length === 0 && (
          <span className="text-[11px] text-muted-foreground italic">
            {label.toLowerCase()}: žádná trasa
          </span>
        )}
        {selectedRoutes.map((r) => (
          <span
            key={r.id}
            className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px]"
          >
            <RouteIcon className="size-3" />
            {r.name}
            <button
              onClick={() => toggle(r.id)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-1 text-[11px] text-primary hover:underline">
            <Plus className="size-3" /> přidat trasu
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-72 p-0 overflow-hidden"
          sideOffset={4}
        >
          <div className="flex items-center gap-1.5 border-b border-border px-2.5 py-1.5">
            <Search className="size-3.5 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Hledat trasu…"
              className="flex-1 bg-transparent text-xs focus:outline-none"
            />
          </div>
          <div className="max-h-64 overflow-y-auto p-1">
            {filtered.length === 0 && (
              <div className="px-2 py-3 text-center text-xs text-muted-foreground">
                Nic nenalezeno
              </div>
            )}
            {filtered.map((r) => {
              const checked = selectedIds.includes(r.id);
              return (
                <button
                  key={r.id}
                  onClick={() => toggle(r.id)}
                  className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-muted/60"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    readOnly
                    className="accent-primary"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{r.name}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {r.code}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export const DEFAULT_ROUTE_SCOPE: RouteScope = {
  mode: "all",
  routeIds: [],
};
