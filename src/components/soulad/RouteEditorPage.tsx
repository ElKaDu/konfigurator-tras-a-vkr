import { useState } from "react";
import { ChevronRight, ChevronUp, ChevronDown, X } from "@/components/ui/icon";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useRoutes, useSegments, routesStore, segmentsStore } from "@/lib/model/store";
import { cn } from "@/lib/utils";
import type { Route, Segment } from "@/lib/model/types";
import { TRANSPORT_VARIANTS } from "@/lib/routes/types";
import { COUNTRY_OPTIONS, countryFlag } from "@/lib/routes/countries";
import { AddExistingSegmentPicker } from "./AddExistingSegmentPicker";

const CARRIER_OPTIONS = ["FedEx", "UPS", "DHL", "PPL", "GLS"];

function createBlankSegment(): Segment {
  const id = "seg_" + Date.now();
  return { id, name: "Nový úsek", carriers: [], serviceTypes: [], checkpoints: [] };
}

export function RouteEditorPage({ routeId }: { routeId: string }) {
  const routes = useRoutes();
  const segments = useSegments();
  const navigate = useNavigate();
  const route = routes.find((r) => r.id === routeId) ?? null;
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(
    route?.segmentIds[0] ?? null,
  );

  if (!route) {
    return (
      <AppShell current="soulad" title="Trasa" backTo="/soulad-s-trasou">
        <div className="rounded-md bg-card px-6 py-10 text-center text-sm text-muted-foreground elevation-2">
          Trasa nenalezena.
        </div>
      </AppShell>
    );
  }

  const segMap = new Map(segments.map((s) => [s.id, s]));
  const selectedSegment = selectedSegmentId ? segMap.get(selectedSegmentId) ?? null : null;

  // TypeScript doesn't carry the `!route` early-return narrowing into nested function
  // declarations below — capture a guaranteed-non-null reference for them to close over.
  const currentRoute: Route = route;

  function update(patch: Partial<Route>) {
    routesStore.upsert({ ...currentRoute, ...patch });
  }

  function toggleMulti(arr: string[], val: string): string[] {
    return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
  }

  function addExistingSegment(segmentId: string) {
    update({ segmentIds: [...currentRoute.segmentIds, segmentId] });
  }

  function createAndOpenNewSegment() {
    const segment = createBlankSegment();
    segmentsStore.upsert(segment);
    update({ segmentIds: [...currentRoute.segmentIds, segment.id] });
    navigate({ to: "/soulad-s-trasou/usek/$id", params: { id: segment.id }, search: { from: routeId } });
  }

  return (
    <AppShell current="soulad" title={route.name || "Trasa"} backTo="/soulad-s-trasou" contentLayout="full">
      <div className="flex min-h-0 flex-1">
        {/* LEFT — Pokrytí trasy */}
        <div className="flex w-[280px] shrink-0 flex-col border-r border-border">
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Pokrytí trasy
            </div>
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
                          : "border-border hover:bg-muted",
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
                  {TRANSPORT_VARIANTS.map((v) => (
                    <button
                      key={v.value}
                      onClick={() => update({ serviceTypes: toggleMulti(route.serviceTypes, v.value) })}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                        route.serviceTypes.includes(v.value)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:bg-muted",
                      )}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Cílová země</label>
                <div className="flex flex-wrap gap-1.5">
                  {COUNTRY_OPTIONS.map((c) => (
                    <button
                      key={c.value}
                      title={c.label}
                      onClick={() => update({ destCountries: toggleMulti(route.destCountries, c.value) })}
                      className={cn(
                        "inline-flex h-[26px] items-center gap-1.5 rounded-full border px-2.5 text-xs transition-colors",
                        route.destCountries.includes(c.value)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input text-muted-foreground hover:border-primary hover:text-primary",
                      )}
                    >
                      <span aria-hidden="true">{countryFlag(c.value)}</span>
                      {c.value}
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                = {route.carriers.length * route.serviceTypes.length * route.destCountries.length} kombinací
                pokryto
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Aktivní</span>
                <button
                  onClick={() => update({ active: !route.active })}
                  className={cn(
                    "relative inline-block h-5 w-9 rounded-full transition-colors",
                    route.active ? "bg-primary" : "bg-muted",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 size-4 rounded-full bg-white transition-all shadow",
                      route.active ? "right-0.5" : "left-0.5",
                    )}
                  />
                </button>
              </div>
            </div>
          </div>
          <div className="border-t border-border p-4 space-y-2">
            <button
              onClick={() => {
                toast.success("Trasa uložena");
                navigate({ to: "/soulad-s-trasou" });
              }}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Uložit trasu
            </button>
            <Link
              to="/soulad-s-trasou"
              className="block w-full rounded-lg border border-border px-4 py-2 text-center text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              ← Zpět na trasy
            </Link>
          </div>
        </div>

        {/* MIDDLE — Úseky trasy */}
        <div className="flex flex-1 min-w-0 flex-col border-r border-border">
          <div className="flex-1 overflow-y-auto p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Úseky trasy
            </div>
            <div className="flex flex-col gap-2 mb-4">
              {route.segmentIds.length === 0 && (
                <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground italic text-center">
                  Trasa zatím neobsahuje žádné úseky.
                </div>
              )}
              {route.segmentIds.map((id, idx) => {
                const seg = segMap.get(id);
                const isSelected = selectedSegmentId === id;
                const moveSegment = (dir: -1 | 1) => {
                  const next = [...route.segmentIds];
                  const j = idx + dir;
                  if (j < 0 || j >= next.length) return;
                  [next[idx], next[j]] = [next[j], next[idx]];
                  update({ segmentIds: next });
                };
                return (
                  <div
                    key={id}
                    onClick={() => setSelectedSegmentId(isSelected ? null : id)}
                    className={cn(
                      "group flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left cursor-pointer transition-colors",
                      isSelected ? "border-primary bg-primary-soft/20" : "border-border hover:bg-muted/40",
                    )}
                  >
                    <span className="tabular-nums text-xs text-muted-foreground shrink-0">{idx + 1}</span>
                    <div className="flex flex-col shrink-0">
                      <button
                        disabled={idx === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          moveSegment(-1);
                        }}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronUp className="size-3.5" />
                      </button>
                      <button
                        disabled={idx === route.segmentIds.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          moveSegment(1);
                        }}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronDown className="size-3.5" />
                      </button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{seg?.name ?? id}</div>
                      <div className="text-xs text-muted-foreground">{seg?.checkpoints.length ?? 0} bodů</div>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        update({ segmentIds: route.segmentIds.filter((x) => x !== id) });
                        if (selectedSegmentId === id) setSelectedSegmentId(null);
                      }}
                      className="shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground transition-opacity"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-border my-4" />
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Přidat úsek
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <AddExistingSegmentPicker route={route} segments={segments} onAdd={addExistingSegment} />
              <button
                onClick={createAndOpenNewSegment}
                className="flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-primary hover:bg-primary-soft/20 transition-colors"
              >
                + vytvořit nový úsek →
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT — Náhled vybraného úseku */}
        <div className="flex w-[380px] shrink-0 flex-col overflow-y-auto">
          <div className="p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              {selectedSegment ? `Náhled úseku: ${selectedSegment.name}` : "Náhled úseku"}
            </div>
            {!selectedSegment && (
              <div className="rounded-md bg-muted/30 border border-border px-3 py-2 text-xs text-muted-foreground">
                Klikni na úsek uprostřed pro náhled jeho bodů.
              </div>
            )}
            {selectedSegment && (
              <div className="space-y-2">
                {(() => {
                  const visibleCheckpoints = selectedSegment.checkpoints.filter((cp) => cp.kind !== "dnesni_doruceni");
                  if (visibleCheckpoints.length === 0) {
                    return <div className="text-xs text-muted-foreground italic">Úsek zatím nemá žádné body.</div>;
                  }
                  return visibleCheckpoints.map((cp, i) => {
                    const matchCount = Object.values(cp.match).filter(
                      (v) => v !== undefined && (Array.isArray(v) ? v.length > 0 : true),
                    ).length;
                    return (
                      <div key={cp.id} className="rounded-lg border border-border bg-background p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="tabular-nums text-xs text-muted-foreground">{i + 1}</span>
                          <span className="text-sm font-medium">{cp.note ?? cp.checkpointTypeId}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{matchCount} match podmínek</div>
                      </div>
                    );
                  });
                })()}
                <Link
                  to="/soulad-s-trasou/usek/$id"
                  params={{ id: selectedSegment.id }}
                  search={{ from: routeId }}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors mt-2"
                >
                  Upravit úsek
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
