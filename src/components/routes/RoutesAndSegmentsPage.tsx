import { useState, useMemo } from "react";
import { ChevronDown, ChevronRight, Plus, Search, X, Layers, Trash2 } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { DataMenu } from "@/components/common/DataMenu";
import { useRoutes, useSegments, useCheckpointTypes, routesStore, segmentsStore, isSegmentUsed } from "@/lib/model/store";
import { assembledCheckpoints } from "@/lib/model/routeAssembly";
import { cn } from "@/lib/utils";
import type { Route, Segment } from "@/lib/model/types";

export function RoutesAndSegmentsPage() {
  const routes = useRoutes();
  const segments = useSegments();
  const checkpointTypes = useCheckpointTypes();

  const [expandedRouteId, setExpandedRouteId] = useState<string | null>(null);
  const [routeFilter, setRouteFilter] = useState("");
  const [segmentFilter, setSegmentFilter] = useState("");
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);

  const navigate = useNavigate();
  const ctMap = useMemo(() => new Map(checkpointTypes.map((ct) => [ct.id, ct.name])), [checkpointTypes]);
  const segMap = useMemo(() => new Map(segments.map((s) => [s.id, s])), [segments]);

  function createNewRoute() {
    const id = "route_" + Date.now();
    routesStore.upsert({ id, code: "R-XX-XXX-XX", name: "Nová trasa", active: false, carriers: [], serviceTypes: [], destCountries: [], segmentIds: [] });
    navigate({ to: "/trasa/$id", params: { id } });
  }

  function createNewSegment() {
    const id = "seg_" + Date.now();
    segmentsStore.upsert({ id, name: "Nový úsek", carriers: [], serviceTypes: [], checkpoints: [] });
    navigate({ to: "/usek/$id", params: { id } });
  }

  const expandedRoute = expandedRouteId ? routes.find((r) => r.id === expandedRouteId) ?? null : null;

  // Segments filtered by search and optionally by active route
  const routeSegmentIds = expandedRoute ? new Set(expandedRoute.segmentIds) : null;

  const filteredSegments = useMemo(() => {
    const q = segmentFilter.toLowerCase();
    return segments.filter((s) =>
      !q || s.name.toLowerCase().includes(q) || s.carriers.join(" ").toLowerCase().includes(q)
    );
  }, [segments, segmentFilter]);

  const routeMatchSegments = routeSegmentIds
    ? filteredSegments.filter((s) => routeSegmentIds.has(s.id))
    : [];
  const otherSegments = routeSegmentIds
    ? filteredSegments.filter((s) => !routeSegmentIds.has(s.id))
    : filteredSegments;

  const filteredRoutes = useMemo(() => {
    const q = routeFilter.toLowerCase();
    return routes.filter((r) =>
      !q || r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q)
    );
  }, [routes, routeFilter]);

  const selectedSegment = selectedSegmentId ? segMap.get(selectedSegmentId) ?? null : null;

  function handleRouteClick(routeId: string) {
    if (expandedRouteId === routeId) {
      setExpandedRouteId(null);
    } else {
      setExpandedRouteId(routeId);
    }
  }

  function clearRouteFilter() {
    setExpandedRouteId(null);
  }

  return (
    <div className="flex h-screen w-screen flex-col bg-background text-foreground">
      <AppHeader
        current="routes"
        extras={<DataMenu />}
      />

      <div className="flex flex-1 min-h-0 gap-0">
        {/* LEFT — Routes */}
        <div className="flex flex-col min-h-0 w-1/2 border-r border-border">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold">Trasy</h2>
            <button onClick={createNewRoute} className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              <Plus className="size-3.5" /> Nová trasa
            </button>
          </div>

          {/* Search */}
          <div className="px-4 py-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input
                value={routeFilter}
                onChange={(e) => setRouteFilter(e.target.value)}
                placeholder="Hledat trasy…"
                className="w-full rounded-md border border-border bg-background pl-8 pr-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Routes list */}
          <div className="flex-1 overflow-y-auto">
            {filteredRoutes.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground italic">Žádné trasy neodpovídají filtru.</div>
            ) : (
              filteredRoutes.map((route) => (
                <RouteRow
                  key={route.id}
                  route={route}
                  expanded={expandedRouteId === route.id}
                  ctMap={ctMap}
                  segMap={segMap}
                  onClick={() => handleRouteClick(route.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* RIGHT — Segments */}
        <div className="flex flex-col min-h-0 w-1/2">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">Úseky</h2>
              {expandedRoute && (
                <span className="flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-medium text-primary">
                  {expandedRoute.code}
                  <button onClick={clearRouteFilter} className="ml-0.5 hover:text-primary/60">
                    <X className="size-3" />
                  </button>
                </span>
              )}
            </div>
            <button onClick={createNewSegment} className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              <Plus className="size-3.5" /> Nový úsek
            </button>
          </div>

          {/* Search */}
          <div className="px-4 py-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input
                value={segmentFilter}
                onChange={(e) => setSegmentFilter(e.target.value)}
                placeholder="Hledat úseky…"
                className="w-full rounded-md border border-border bg-background pl-8 pr-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Segments list */}
          <div className="flex-1 overflow-y-auto">
            {expandedRoute && routeMatchSegments.length > 0 && (
              <>
                {routeMatchSegments.map((seg) => (
                  <SegmentRow
                    key={seg.id}
                    segment={seg}
                    selected={selectedSegmentId === seg.id}
                    highlighted
                    ctMap={ctMap}
                    onClick={() => setSelectedSegmentId(seg.id === selectedSegmentId ? null : seg.id)}
                  />
                ))}
                {otherSegments.length > 0 && (
                  <div className="mx-4 my-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="flex-1 h-px bg-border" />
                    <span>ostatní úseky</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                )}
              </>
            )}

            {(expandedRoute ? otherSegments : filteredSegments).map((seg) => (
              <SegmentRow
                key={seg.id}
                segment={seg}
                selected={selectedSegmentId === seg.id}
                highlighted={false}
                dimmed={!!expandedRoute}
                ctMap={ctMap}
                onClick={() => setSelectedSegmentId(seg.id === selectedSegmentId ? null : seg.id)}
              />
            ))}

            {filteredSegments.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground italic">Žádné úseky neodpovídají filtru.</div>
            )}
          </div>
        </div>
      </div>

      {/* Segment detail sidebar */}
      {selectedSegment && (
        <SegmentDetailSidebar
          segment={selectedSegment}
          ctMap={ctMap}
          fromRouteId={expandedRouteId}
          onClose={() => setSelectedSegmentId(null)}
          onDelete={() => setSelectedSegmentId(null)}
        />
      )}
    </div>
  );
}

/* ─── Route Row ──────────────────────────────────────────── */

function RouteRow({
  route, expanded, ctMap, segMap, onClick,
}: {
  route: Route;
  expanded: boolean;
  ctMap: Map<string, string>;
  segMap: Map<string, Segment>;
  onClick: () => void;
}) {
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={onClick}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50",
          expanded && "bg-primary-soft/30"
        )}
      >
        <span className="text-muted-foreground">
          {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">{route.name}</span>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                route.active ? "bg-success/20 text-success-foreground" : "bg-muted text-muted-foreground"
              )}
            >
              {route.active ? "aktivní" : "neaktivní"}
            </span>
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {route.code} · {route.carriers.join(", ")} · {route.destCountries.join(", ")}
          </div>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">{route.segmentIds.length} úseků</span>
      </button>

      {expanded && (
        <RouteExpandedDetail route={route} ctMap={ctMap} segMap={segMap} />
      )}
    </div>
  );
}

function RouteExpandedDetail({
  route, ctMap, segMap,
}: {
  route: Route;
  ctMap: Map<string, string>;
  segMap: Map<string, Segment>;
}) {
  const allSegments = Array.from(segMap.values());
  const checkpoints = assembledCheckpoints(route, allSegments);
  const milestoneLabels = checkpoints.map((cp) => ctMap.get(cp.checkpointTypeId) ?? cp.checkpointTypeId);

  return (
    <div className="bg-primary-soft/10 border-t border-primary/10 px-4 py-4 space-y-4">
      {/* Coverage grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-xs text-muted-foreground mb-1">Dopravce</div>
          <div className="font-medium">{route.carriers.join(", ")}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">Typ služby</div>
          <div className="font-medium">{route.serviceTypes.join(", ")}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">Cílové země</div>
          <div className="font-medium">{route.destCountries.join(", ")}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">Pokrytí</div>
          <div className="font-medium">{route.carriers.length * route.serviceTypes.length * route.destCountries.length} kombinací</div>
        </div>
      </div>

      {/* Milestone chips */}
      {milestoneLabels.length > 0 && (
        <div>
          <div className="text-xs text-muted-foreground mb-2">Milníky trasy</div>
          <div className="flex flex-wrap items-center gap-1.5">
            {milestoneLabels.map((label, i) => (
              <div key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="size-3 text-muted-foreground" />}
                <span className="rounded-full border border-border bg-background px-2.5 py-0.5 text-xs font-medium">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <Link
          to="/trasa/$id"
          params={{ id: route.id }}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Upravit trasu
        </Link>
        <button
          onClick={() => routesStore.remove(route.id)}
          className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-red-300 hover:text-red-500 transition-colors"
          title="Smazat trasu"
        >
          <Trash2 className="size-3.5" /> Smazat
        </button>
      </div>
    </div>
  );
}

/* ─── Segment Row ────────────────────────────────────────── */

function SegmentRow({
  segment, selected, highlighted, dimmed, ctMap, onClick,
}: {
  segment: Segment;
  selected: boolean;
  highlighted: boolean;
  dimmed?: boolean;
  ctMap: Map<string, string>;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors border-b border-border last:border-b-0",
        selected && "bg-primary-soft/30",
        highlighted && !selected && "hover:bg-primary-soft/10",
        !highlighted && !selected && "hover:bg-muted/50",
        dimmed && !highlighted && "opacity-50"
      )}
    >
      <Layers className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{segment.name}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          {segment.carriers.join(", ")} · {segment.serviceTypes.join(", ")} · {segment.checkpoints.length} milníků
        </div>
      </div>
    </button>
  );
}

/* ─── Segment Detail Sidebar ─────────────────────────────── */

function SegmentDetailSidebar({
  segment, ctMap, fromRouteId, onClose, onDelete,
}: {
  segment: Segment;
  ctMap: Map<string, string>;
  fromRouteId: string | null;
  onClose: () => void;
  onDelete: () => void;
}) {
  return (
    <aside className="fixed right-0 top-14 bottom-0 flex w-[400px] flex-col border-l border-border bg-surface shadow-xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Úsek</div>
          <h3 className="mt-1 text-base font-semibold">{segment.name}</h3>
          {segment.description && (
            <p className="mt-0.5 text-sm text-muted-foreground">{segment.description}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Meta */}
      <div className="px-5 pb-3 flex flex-wrap gap-1.5">
        {segment.carriers.map((c) => (
          <span key={c} className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">{c}</span>
        ))}
        {segment.serviceTypes.map((t) => (
          <span key={t} className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">{t}</span>
        ))}
      </div>

      {/* Milestones */}
      <div className="flex-1 overflow-y-auto px-5 pb-5">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Milníky ({segment.checkpoints.length})
        </div>
        <div className="flex flex-col gap-3">
          {segment.checkpoints.map((cp, i) => {
            const name = ctMap.get(cp.checkpointTypeId) ?? cp.checkpointTypeId;
            const matchFields = Object.entries(cp.match)
              .filter(([, v]) => v !== undefined && v !== null && (Array.isArray(v) ? v.length > 0 : true))
              .map(([k, v]) => {
                if (k === "event_time_of_day" && v && typeof v === "object") {
                  const etod = v as { op: string; from: string; to?: string };
                  const opLabel: Record<string, string> = { before: "před", after: "po", between: "mezi", eq: "rovno" };
                  const val = etod.op === "between" ? `${etod.from || "?"} – ${etod.to || "?"}` : etod.from || "?";
                  return `Čas: ${opLabel[etod.op] ?? etod.op} ${val}`;
                }
                return `${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`;
              });
            return (
              <div key={cp.id} className="rounded-lg border border-border bg-background p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="tabular-nums text-xs font-medium text-muted-foreground">{i + 1}</span>
                  <span className="text-sm font-medium">{name}</span>
                </div>
                {matchFields.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Match podmínky</div>
                    {matchFields.map((f) => (
                      <div key={f} className="text-xs text-foreground/80">{f}</div>
                    ))}
                  </div>
                )}
                {(cp.expectedDurationHours || cp.warnAfterHours || cp.criticalAfterHours) && (
                  <div className="mt-2 pt-2 border-t border-border space-y-1">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Trvání</div>
                    {cp.expectedDurationHours && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="size-2 rounded-full bg-green-500 shrink-0" />
                        Očekávané: {cp.expectedDurationHours} h
                      </div>
                    )}
                    {cp.warnAfterHours && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="size-2 rounded-full bg-amber-500 shrink-0" />
                        Dlouho po: {cp.warnAfterHours} h
                      </div>
                    )}
                    {cp.criticalAfterHours && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="size-2 rounded-full bg-red-500 shrink-0" />
                        Kriticky po: {cp.criticalAfterHours} h
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border bg-surface p-4 space-y-2">
        <Link
          to="/usek/$id"
          params={{ id: segment.id }}
          search={fromRouteId ? { from: fromRouteId } : {}}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Upravit úsek
        </Link>
        {(() => {
          const { used, count } = isSegmentUsed(segment.id);
          return (
            <button
              disabled={used}
              onClick={() => { segmentsStore.remove(segment.id); onDelete(); }}
              title={used ? `Používá se v ${count} ${count === 1 ? "trase" : count < 5 ? "trasách" : "trasách"}` : "Smazat úsek"}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors",
                used
                  ? "border-border text-muted-foreground/40 cursor-not-allowed"
                  : "border-border text-muted-foreground hover:border-red-300 hover:text-red-500"
              )}
            >
              <Trash2 className="size-4" />
              {used ? `Nelze smazat — používá se v ${count} ${count === 1 ? "trase" : "trasách"}` : "Smazat úsek"}
            </button>
          );
        })()}
      </div>
    </aside>
  );
}
