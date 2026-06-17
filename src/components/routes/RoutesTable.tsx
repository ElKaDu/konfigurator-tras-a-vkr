import { useMemo, useState } from "react";
import { Search, MoreHorizontal, Copy, Pencil, Archive, ArchiveRestore, AlertCircle, MapPin } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Route } from "@/lib/routes/types";
import { getVariants, TRANSPORT_VARIANTS } from "@/lib/routes/types";
import { routesStore, useRoutes } from "@/lib/routes/store";

export function RoutesTable({
  routes,
  title,
  subtitle,
  selectedId,
  onSelect,
  onEdit,
  onAddRoute,
  isArchive,
}: {
  routes: Route[];
  title: string;
  subtitle?: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onEdit: (r: Route) => void;
  onAddRoute: () => void;
  isArchive?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [carrierFilter, setCarrierFilter] = useState("all");
  const [variantFilter, setVariantFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const allRoutesForVariants = useRoutes();

  const allCarriers = useMemo(() => Array.from(new Set(routes.flatMap((r) => r.carriers))).sort(), [routes]);
  const allVariants = useMemo(() => Array.from(new Set(routes.flatMap((r) => r.serviceTypes))).sort(), [routes]);
  const allCountries = useMemo(() => Array.from(new Set(routes.flatMap((r) => r.destCountries))).sort(), [routes]);

  const visible = routes.filter((r) => {
    if (search) {
      const s = search.toLowerCase();
      if (!r.name.toLowerCase().includes(s) && !r.code.toLowerCase().includes(s)) return false;
    }
    if (carrierFilter !== "all" && !r.carriers.includes(carrierFilter)) return false;
    if (variantFilter !== "all" && !r.serviceTypes.includes(variantFilter)) return false;
    if (countryFilter !== "all" && !r.destCountries.includes(countryFilter)) return false;
    return true;
  });

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col">
      <header className="border-b border-border bg-surface px-8 pb-4 pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-semibold tracking-tight">{title}</h2>
            {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {!isArchive && (
            <button
              onClick={onAddRoute}
              className="shrink-0 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              + Nová trasa
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Hledat trasu, kód…"
              className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
            />
          </div>
          <select
            value={carrierFilter}
            onChange={(e) => setCarrierFilter(e.target.value)}
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
          >
            <option value="all">Všichni dopravci</option>
            {allCarriers.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={variantFilter}
            onChange={(e) => setVariantFilter(e.target.value)}
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
          >
            <option value="all">Všechny varianty</option>
            {allVariants.map((v) => {
              const label = TRANSPORT_VARIANTS.find((t) => t.value === v)?.label ?? v;
              return <option key={v} value={v}>{label}</option>;
            })}
          </select>
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
          >
            <option value="all">Všechny cílové země</option>
            {allCountries.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-surface text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <tr className="border-b border-border">
              <th className="w-32 px-8 py-3 text-left">Kód</th>
              <th className="px-3 py-3 text-left">Trasa</th>
              <th className="w-36 px-3 py-3 text-left">Dopravci</th>
              <th className="w-32 px-3 py-3 text-left">Cílové země</th>
              <th className="w-24 px-3 py-3 text-right">Checkpointů</th>
              <th className="w-20 px-3 py-3 text-right">Alt.</th>
              <th className="w-20 px-3 py-3 text-center">Aktivní</th>
              <th className="w-10 px-3 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => {
              const selected = selectedId === r.id;
              return (
                <tr
                  key={r.id}
                  onClick={() => onSelect(r.id)}
                  className={cn(
                    "cursor-pointer border-b border-border transition-colors",
                    selected ? "bg-primary-soft/60" : "hover:bg-muted/40",
                    !r.active && !isArchive && "opacity-60",
                  )}
                >
                  <td className="px-8 py-3 font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{r.code}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-start gap-2">
                      <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <div className="font-medium leading-snug">{r.name}</div>
                        {r.description && <div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{r.description}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      {r.carriers.map((c) => (
                        <span key={c} className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold">{c}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      {r.destCountries.slice(0, 4).map((d) => (
                        <span key={d} className="rounded-md bg-primary-soft px-1.5 py-0.5 font-mono text-[10px] font-semibold text-primary">{d}</span>
                      ))}
                      {r.destCountries.length > 4 && <span className="text-[10px] text-muted-foreground">+{r.destCountries.length - 4}</span>}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-sm tabular-nums">{r.checkpoints.length}</td>
                  <td className="px-3 py-3 text-right font-mono text-sm tabular-nums text-muted-foreground">{getVariants(r.id, allRoutesForVariants).length}</td>
                  <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                    {isArchive ? (
                      <button
                        onClick={() => routesStore.unarchive(r.id)}
                        className="rounded-md border border-border bg-background px-2 py-1 text-[11px] font-medium hover:bg-muted"
                      >
                        Obnovit
                      </button>
                    ) : (
                      <Switch
                        checked={r.active}
                        onCheckedChange={() => routesStore.toggle(r.id)}
                        className="data-[state=checked]:bg-primary"
                      />
                    )}
                  </td>
                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(r)}>
                          <Pencil className="mr-2 size-3.5" /> Upravit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => routesStore.duplicate(r.id)}>
                          <Copy className="mr-2 size-3.5" /> Duplikovat
                        </DropdownMenuItem>
                        {isArchive ? (
                          <DropdownMenuItem onClick={() => routesStore.unarchive(r.id)}>
                            <ArchiveRestore className="mr-2 size-3.5" /> Obnovit z archivu
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => routesStore.archive(r.id)}>
                            <Archive className="mr-2 size-3.5" /> Archivovat
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {visible.length === 0 && (
          <div className="m-8 rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            <AlertCircle className="mx-auto mb-2 size-5 text-muted-foreground/60" />
            Žádná trasa neodpovídá filtru.
          </div>
        )}
      </div>
    </section>
  );
}
