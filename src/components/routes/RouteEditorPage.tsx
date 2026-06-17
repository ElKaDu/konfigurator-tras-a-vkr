import { useState, useMemo } from "react";
import { ChevronRight, X, AlertTriangle, Info } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { useRoutes, useSegments, useCheckpointTypes, routesStore, segmentsStore } from "@/lib/model/store";
import { assembledCheckpoints, eligibleSegments, validateRouteComposition } from "@/lib/model/routeAssembly";
import { cn } from "@/lib/utils";
import type { Route } from "@/lib/model/types";

const CARRIER_OPTIONS = ["FedEx", "UPS", "DHL", "PPL", "GLS"];
const SERVICE_OPTIONS = ["EXPRESS", "ECONOMY", "STANDARD"];
const COUNTRY_OPTIONS = ["CZ", "SK", "DE", "AT", "PL", "HU", "RO", "FR", "IT", "ES"];

export function RouteEditorPage({ routeId }: { routeId: string }) {
  const routes = useRoutes();
  const segments = useSegments();
  const checkpointTypes = useCheckpointTypes();

  const navigate = useNavigate();
  const route = routes.find((r) => r.id === routeId) ?? routes[0] ?? null;
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(
    route?.segmentIds[0] ?? null
  );
  const [pickerOpen, setPickerOpen] = useState(false);

  function createAndOpenNewSegment() {
    const id = "seg_" + Date.now();
    segmentsStore.upsert({ id, name: "Nový úsek", carriers: [], serviceTypes: [], checkpoints: [] });
    navigate({ to: "/usek/$id", params: { id } });
  }

  const ctMap = useMemo(() => new Map(checkpointTypes.map((ct) => [ct.id, ct.name])), [checkpointTypes]);
  const segMap = useMemo(() => new Map(segments.map((s) => [s.id, s])), [segments]);

  if (!route) {
    return (
      <div className="flex h-screen w-screen flex-col bg-background text-foreground">
        <AppHeader current="routes" />
        <div className="p-8 text-sm text-muted-foreground">Trasa nenalezena.</div>
      </div>
    );
  }

  const eligible = eligibleSegments(route, segments);
  const issues = validateRouteComposition(route.segmentIds, segments);

  // Right column: milestones of selected segment (read-only)
  const selectedSegment = selectedSegmentId ? segMap.get(selectedSegmentId) ?? null : null;

  const allSegmentCheckpoints = assembledCheckpoints(route, segments);
  const routeMilestones = allSegmentCheckpoints.map((cp) => ({
    name: ctMap.get(cp.checkpointTypeId) ?? cp.checkpointTypeId,
    cp,
  }));

  function update(patch: Partial<Route>) {
    routesStore.upsert({ ...route, ...patch });
  }

  function toggleMulti(arr: string[], val: string): string[] {
    return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
  }

  return (
    <div className="flex h-screen w-screen flex-col bg-background text-foreground">
      <AppHeader current="routes" />

      <div className="flex flex-1 min-h-0">
        {/* LEFT — Pokrytí */}
        <div className="flex w-[280px] shrink-0 flex-col border-r border-border">
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Pokrytí trasy</div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Název trasy</label>
                  <input
                    value={route.name}
                    onChange={(e) => update({ name: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Kód trasy</label>
                  <input
                    value={route.code}
                    onChange={(e) => update({ code: e.target.value })}
                    placeholder="R-XX-XXX-XX"
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Dopravce</label>
                  <div className="flex flex-wrap gap-1.5">
                    {CARRIER_OPTIONS.map((c) => (
                      <button
                        key={c}
                        onClick={() => update({ carriers: toggleMulti(route.carriers, c) })}
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                          route.carriers.includes(c)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border hover:bg-muted"
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Typ služby</label>
                  <div className="flex flex-wrap gap-1.5">
                    {SERVICE_OPTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => update({ serviceTypes: toggleMulti(route.serviceTypes, s) })}
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                          route.serviceTypes.includes(s)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border hover:bg-muted"
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Cílová země</label>
                  <div className="flex flex-wrap gap-1.5">
                    {COUNTRY_OPTIONS.map((c) => (
                      <button
                        key={c}
                        onClick={() => update({ destCountries: toggleMulti(route.destCountries, c) })}
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors",
                          route.destCountries.includes(c)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border hover:bg-muted"
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  = {route.carriers.length * route.serviceTypes.length * route.destCountries.length} kombinací pokryto
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Aktivní</span>
                  <button
                    onClick={() => update({ active: !route.active })}
                    className={cn(
                      "relative inline-block h-5 w-9 rounded-full transition-colors",
                      route.active ? "bg-primary" : "bg-muted"
                    )}
                  >
                    <span className={cn(
                      "absolute top-0.5 size-4 rounded-full bg-white transition-all shadow",
                      route.active ? "right-0.5" : "left-0.5"
                    )} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border p-4 space-y-2">
            <button className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              Uložit trasu
            </button>
            <Link
              to="/trasy"
              className="block w-full rounded-lg border border-border px-4 py-2 text-center text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              ← Zpět na trasy
            </Link>
          </div>
        </div>

        {/* MIDDLE — Úseky trasy */}
        <div className="flex flex-1 min-w-0 flex-col border-r border-border">
          <div className="flex-1 overflow-y-auto p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Úseky trasy</div>

            {/* Ordered list */}
            <div className="flex flex-col gap-2 mb-4">
              {route.segmentIds.length === 0 && (
                <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground italic text-center">
                  Trasa zatím neobsahuje žádné úseky.
                </div>
              )}
              {route.segmentIds.map((id, idx) => {
                const seg = segMap.get(id);
                const isSelected = selectedSegmentId === id;
                return (
                  <button
                    key={id}
                    onClick={() => setSelectedSegmentId(isSelected ? null : id)}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                      isSelected ? "border-primary bg-primary-soft/20" : "border-border hover:bg-muted/40"
                    )}
                  >
                    <span className="tabular-nums text-xs text-muted-foreground shrink-0">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{seg?.name ?? id}</div>
                      <div className="text-xs text-muted-foreground">{seg?.checkpoints.length ?? 0} milníků</div>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        routesStore.upsert({ ...route, segmentIds: route.segmentIds.filter((x) => x !== id) });
                        if (selectedSegmentId === id) setSelectedSegmentId(null);
                      }}
                      className="shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground transition-opacity"
                    >
                      <X className="size-4" />
                    </button>
                  </button>
                );
              })}
            </div>

            {/* Validation issues */}
            {issues.length > 0 && (
              <div className="mb-4 space-y-1">
                {issues.map((issue) => (
                  <div key={issue.kind + "_" + issue.checkpointTypeId} className="flex items-center gap-2 text-xs text-amber-600">
                    <AlertTriangle className="size-3.5 shrink-0" />
                    <span>{issue.message}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Separator */}
            <div className="border-t border-border my-4" />

            {/* Add segment */}
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Přidat úsek</div>

            <button
              onClick={() => setPickerOpen((v) => !v)}
              className="mb-2 flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-primary hover:bg-primary-soft/20 transition-colors"
            >
              + vybrat z knihovny úseků
            </button>

            {pickerOpen && (
              <div className="rounded-lg border border-border bg-muted/20 p-2 space-y-1">
                {eligible.length === 0 ? (
                  <div className="text-sm text-muted-foreground italic px-2">Žádné vhodné úseky.</div>
                ) : (
                  eligible.map(({ segment, conflict }) => (
                    <button
                      key={segment.id}
                      disabled={conflict}
                      onClick={() => {
                        if (conflict) return;
                        routesStore.upsert({ ...route, segmentIds: [...route.segmentIds, segment.id] });
                        setPickerOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between rounded-md px-3 py-2 text-sm text-left transition-colors",
                        conflict ? "opacity-50 cursor-not-allowed" : "hover:bg-muted cursor-pointer"
                      )}
                    >
                      <span className="font-medium">{segment.name}</span>
                      <span className="text-xs text-muted-foreground">{segment.carriers.join(", ")}</span>
                    </button>
                  ))
                )}
              </div>
            )}

            <button
              onClick={createAndOpenNewSegment}
              className="mt-2 flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-primary hover:bg-primary-soft/20 transition-colors"
            >
              + vytvořit nový úsek →
            </button>
          </div>
        </div>

        {/* RIGHT — Milníky (read-only) */}
        <div className="flex w-[320px] shrink-0 flex-col overflow-y-auto">
          <div className="p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              {selectedSegment ? `Milníky úseku: ${selectedSegment.name}` : "Milníky trasy (celkem)"}
            </div>

            {!selectedSegment && (
              <>
                <div className="flex flex-wrap items-center gap-1.5 mb-4">
                  {routeMilestones.map((m, i) => (
                    <div key={i} className="flex items-center gap-1">
                      {i > 0 && <ChevronRight className="size-3 text-muted-foreground" />}
                      <span className="rounded-full border border-border bg-background px-2.5 py-0.5 text-xs font-medium">
                        {m.name}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="rounded-md bg-muted/30 border border-border px-3 py-2 text-xs text-muted-foreground flex items-start gap-2">
                  <Info className="size-3.5 shrink-0 mt-0.5" />
                  Kliknutím na úsek v středním sloupci zobrazíš jeho milníky. Milníky se konfigurují v editoru úseku.
                </div>
              </>
            )}

            {selectedSegment && (
              <div className="space-y-2">
                {selectedSegment.checkpoints.map((cp, i) => {
                  const name = ctMap.get(cp.checkpointTypeId) ?? cp.checkpointTypeId;
                  const matchCount = Object.values(cp.match).filter((v) =>
                    v !== undefined && (Array.isArray(v) ? v.length > 0 : true)
                  ).length;
                  return (
                    <div key={cp.id} className="rounded-lg border border-border bg-background p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="tabular-nums text-xs text-muted-foreground">{i + 1}</span>
                        <span className="text-sm font-medium">{name}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{matchCount} match podmínek</div>
                      {(cp.expectedDurationHours || cp.warnAfterHours || cp.criticalAfterHours) && (
                        <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                          {cp.expectedDurationHours && (
                            <span className="flex items-center gap-1">
                              <span className="size-2 rounded-full bg-green-500" />
                              {cp.expectedDurationHours} h
                            </span>
                          )}
                          {cp.warnAfterHours && (
                            <span className="flex items-center gap-1">
                              <span className="size-2 rounded-full bg-amber-500" />
                              {cp.warnAfterHours} h
                            </span>
                          )}
                          {cp.criticalAfterHours && (
                            <span className="flex items-center gap-1">
                              <span className="size-2 rounded-full bg-red-500" />
                              {cp.criticalAfterHours} h
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                <Link
                  to="/usek/$id"
                  params={{ id: selectedSegment.id }}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors mt-2"
                >
                  Upravit úsek
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
