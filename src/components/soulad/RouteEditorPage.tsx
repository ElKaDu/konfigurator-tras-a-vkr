import { useState } from "react";
import { ChevronRight, ChevronUp, ChevronDown, X, Info } from "@/components/ui/icon";
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
    <AppShell current="soulad" title={route.name || "Trasa"} backTo="/soulad-s-trasou">
      {/* Náhled úseku nese nejvíc textu, proto je nejširší. */}
      <div className="grid items-start gap-5 xl:grid-cols-[340px_320px_minmax(0,1fr)]">
        {/* POKRYTÍ TRASY */}
        <div className="flex flex-col gap-5">
          <div className="rounded-md bg-card px-6 py-5 elevation-2">
            <div className="text-overline mb-4">Pokrytí trasy</div>

            <label className="mb-1.5 block text-[13px] text-muted-foreground">Název trasy</label>
            <input
              value={route.name}
              onChange={(e) => update({ name: e.target.value })}
              className="h-[42px] w-full rounded-md border border-input bg-card px-3.5 text-sm outline-none transition-colors focus:border-primary"
            />

            <label className="mb-1.5 mt-4 block text-[13px] text-muted-foreground">Kód trasy</label>
            <input
              value={route.code}
              onChange={(e) => update({ code: e.target.value })}
              placeholder="R-XX-XXX-XX"
              className="h-[42px] w-full rounded-md border border-input bg-card px-3.5 font-mono text-sm outline-none transition-colors focus:border-primary"
            />

            <label className="mb-1.5 mt-4 block text-[13px] text-muted-foreground">Dopravce</label>
            <div className="flex flex-wrap gap-1.5">
              {CARRIER_OPTIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => update({ carriers: toggleMulti(route.carriers, c) })}
                  className={cn(
                    "inline-flex h-[30px] items-center rounded-full border px-3 text-[13px] transition-colors",
                    route.carriers.includes(c)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input text-muted-foreground hover:border-primary hover:text-primary",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>

            <label className="mb-1.5 mt-4 block text-[13px] text-muted-foreground">Typ služby</label>
            <div className="flex flex-wrap gap-1.5">
              {TRANSPORT_VARIANTS.map((v) => (
                <button
                  key={v.value}
                  onClick={() => update({ serviceTypes: toggleMulti(route.serviceTypes, v.value) })}
                  className={cn(
                    "inline-flex h-[30px] items-center rounded-full border px-3 text-[13px] transition-colors",
                    route.serviceTypes.includes(v.value)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input text-muted-foreground hover:border-primary hover:text-primary",
                  )}
                >
                  {v.label}
                </button>
              ))}
            </div>

            {/* Zemí je přes třicet — stejný vzor jako VSelect s chipy v aplikaci, ne mřížka. */}
            <label className="mb-1.5 mt-4 block text-[13px] text-muted-foreground">Cílová země</label>
            <div className="rounded-md border border-input bg-card px-2.5 py-2">
              {route.destCountries.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {route.destCountries.map((code) => {
                    const c = COUNTRY_OPTIONS.find((o) => o.value === code);
                    return (
                      <span
                        key={code}
                        title={c?.label ?? code}
                        className="inline-flex h-6 items-center gap-1.5 rounded-full bg-primary-soft px-2.5 text-[13px] font-medium leading-5 text-accent-foreground"
                      >
                        <span aria-hidden="true">{countryFlag(code)}</span>
                        {code}
                        <button
                          onClick={() => update({ destCountries: route.destCountries.filter((x) => x !== code) })}
                          className="text-accent-foreground/60 transition-colors hover:text-destructive"
                          title="Odebrat zemi"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
              <select
                value=""
                onChange={(e) => {
                  if (!e.target.value) return;
                  update({ destCountries: [...route.destCountries, e.target.value] });
                }}
                className="w-full bg-transparent text-sm text-muted-foreground outline-none"
              >
                <option value="">
                  {route.destCountries.length === 0 ? "Vyber cílové země…" : "Přidat další zemi…"}
                </option>
                {COUNTRY_OPTIONS.filter((c) => !route.destCountries.includes(c.value)).map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label} ({c.value})
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-md bg-info/10 px-3 py-2.5 text-[13px] leading-[19px] text-info-foreground">
              <Info size={16} className="mt-px shrink-0" />
              <span>
                = {route.carriers.length * route.serviceTypes.length * route.destCountries.length} kombinací pokryto
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm">Aktivní</span>
              <button
                onClick={() => update({ active: !route.active })}
                className={cn(
                  "relative inline-block h-[22px] w-[38px] rounded-full transition-colors",
                  route.active ? "bg-primary" : "bg-foreground/20",
                )}
              >
                <span
                  className={cn(
                    "absolute top-[3px] size-4 rounded-full bg-white shadow transition-all",
                    route.active ? "right-[3px]" : "left-[3px]",
                  )}
                />
              </button>
            </div>
          </div>

          <button
            onClick={() => {
              toast.success("Trasa uložena");
              navigate({ to: "/soulad-s-trasou" });
            }}
            className="w-full rounded-md bg-primary px-4 py-2.5 text-[15px] font-medium text-primary-foreground elevation-1 transition-colors hover:bg-[#7E4EE6]"
          >
            Uložit trasu
          </button>
        </div>

        {/* ÚSEKY TRASY */}
        <div className="rounded-md bg-card px-6 py-5 elevation-2">
          <div className="text-overline mb-3">Úseky trasy</div>
          <div className="mb-4 flex flex-col gap-2">
            {route.segmentIds.length === 0 && (
              <div className="rounded-md border border-dashed border-input p-4 text-center text-sm text-muted-foreground">
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
                    "group flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2.5 text-left transition-colors",
                    isSelected ? "border-primary bg-primary-soft" : "border-border hover:bg-muted/60",
                  )}
                >
                  <span className="shrink-0 text-[13px] tabular-nums text-muted-foreground">{idx + 1}</span>
                  <div className="flex shrink-0 flex-col">
                    <button
                      disabled={idx === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        moveSegment(-1);
                      }}
                      className="text-muted-foreground hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      disabled={idx === route.segmentIds.length - 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        moveSegment(1);
                      }}
                      className="text-muted-foreground hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{seg?.name ?? id}</div>
                    <div className="text-[13px] text-muted-foreground">{seg?.checkpoints.length ?? 0} bodů</div>
                  </div>
                  <ChevronRight size={16} className="shrink-0 text-muted-foreground" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      update({ segmentIds: route.segmentIds.filter((x) => x !== id) });
                      if (selectedSegmentId === id) setSelectedSegmentId(null);
                    }}
                    className="shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                  >
                    <X size={16} />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="text-overline mb-2 border-t border-border pt-4">Přidat úsek</div>
          <div className="flex flex-wrap items-center gap-2">
            <AddExistingSegmentPicker route={route} segments={segments} onAdd={addExistingSegment} />
            <button
              onClick={createAndOpenNewSegment}
              className="flex items-center gap-1.5 rounded-md bg-primary-soft px-3.5 py-2 text-[13px] font-medium text-accent-foreground transition-colors hover:bg-[#E4DBF5]"
            >
              + vytvořit nový úsek
            </button>
          </div>
        </div>

        {/* NÁHLED ÚSEKU */}
        <div className="rounded-md bg-card px-6 py-5 elevation-2">
          <div className="text-overline mb-3">
            {selectedSegment ? `Náhled úseku: ${selectedSegment.name}` : "Náhled úseku"}
          </div>
          {!selectedSegment && (
            <div className="rounded-md border border-dashed border-input px-3 py-2.5 text-[13px] text-muted-foreground">
              Klikni na úsek uprostřed pro náhled jeho bodů.
            </div>
          )}
          {selectedSegment && (
            <div className="space-y-2.5">
              {(() => {
                const visibleCheckpoints = selectedSegment.checkpoints.filter((cp) => cp.kind !== "dnesni_doruceni");
                if (visibleCheckpoints.length === 0) {
                  return <div className="text-[13px] text-muted-foreground">Úsek zatím nemá žádné body.</div>;
                }
                return visibleCheckpoints.map((cp, i) => {
                  const matchCount = Object.values(cp.match).filter(
                    (v) => v !== undefined && (Array.isArray(v) ? v.length > 0 : true),
                  ).length;
                  return (
                    <div key={cp.id} className="flex gap-3 rounded-md border border-border bg-muted/50 p-3.5">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary-soft text-[12px] font-semibold text-accent-foreground">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="text-[13px] leading-[19px]">{cp.note ?? cp.checkpointTypeId}</div>
                        <div className="mt-1 text-[12px] text-muted-foreground">{matchCount} match podmínek</div>
                      </div>
                    </div>
                  );
                });
              })()}
              <Link
                to="/soulad-s-trasou/usek/$id"
                params={{ id: selectedSegment.id }}
                search={{ from: routeId }}
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-[15px] font-medium text-primary-foreground elevation-1 transition-colors hover:bg-[#7E4EE6]"
              >
                Upravit úsek
              </Link>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
