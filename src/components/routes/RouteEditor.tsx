import { useState } from "react";
import { Boxes, Layers, MapPin, Truck } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { SectionCard } from "@/components/common/SectionCard";
import {
  useRoutes,
  useCheckpointTypes,
  useSegments,
  routesStore,
  segmentsStore,
} from "@/lib/model/store";
import { cn } from "@/lib/utils";
import {
  assembledCheckpoints,
  eligibleSegments,
  segmentUsageCount,
  validateRouteComposition,
} from "@/lib/model/routeAssembly";
import { CoverageEditor } from "./CoverageEditor";
import { RouteMap } from "./RouteMap";
import { SegmentsPanel } from "./SegmentsPanel";

export function RouteEditor() {
  const routes = useRoutes();
  const route = routes[0];
  const checkpointTypes = useCheckpointTypes();
  const segments = useSegments();
  const [activeIndex, setActiveIndex] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Build a map from checkpointTypeId → name for quick lookup
  const ctMap = new Map(checkpointTypes.map((ct) => [ct.id, ct.name]));

  // Assemble checkpoints from segments in order
  const checkpoints = assembledCheckpoints(route, segments);

  // Resolve milestone labels from the assembled checkpoints
  const labels: string[] = checkpoints.map(
    (cp) => ctMap.get(cp.checkpointTypeId) ?? cp.checkpointTypeId
  );

  // Segments section helpers
  const eligible = eligibleSegments(route, segments);
  const issues = validateRouteComposition(route.segmentIds, segments);

  return (
    <div className="flex h-screen w-screen flex-col bg-background text-foreground">
      <AppHeader current="routes" />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl w-full p-6 flex flex-col gap-4">
          {/* Route header */}
          <div>
            <h1 className="text-lg font-semibold">{route.name}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{route.code}</p>
          </div>

          {/* Coverage section */}
          <SectionCard icon={Truck} title="Pokrytí trasy">
            <CoverageEditor route={route} />
          </SectionCard>

          {/* Segments composition section */}
          <SectionCard icon={Layers} title="Úseky trasy">
            {/* Ordered list of segments on this route */}
            <div className="flex flex-col gap-2">
              {route.segmentIds.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  Trasa zatím neobsahuje žádné úseky.
                </p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {route.segmentIds.map((id) => {
                    const seg = segmentsStore.byId(id);
                    const usageCount = segmentUsageCount(id, routes);
                    return (
                      <div
                        key={id}
                        className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm"
                      >
                        <span className="font-medium">
                          {seg?.name ?? id}
                          <span className="ml-2 text-muted-foreground font-normal">
                            · použito na {usageCount}× trasách
                          </span>
                        </span>
                        <button
                          onClick={() =>
                            routesStore.upsert({
                              ...route,
                              segmentIds: route.segmentIds.filter((x) => x !== id),
                            })
                          }
                          aria-label={`Odebrat úsek ${seg?.name ?? id}`}
                          className="ml-3 shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add segment button and picker */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setPickerOpen((v) => !v)}
                  className="self-start rounded-md border border-dashed border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
                >
                  {pickerOpen ? "Zavřít výběr" : "+ přidat úsek"}
                </button>

                {pickerOpen && (
                  <div className="rounded-md border border-border bg-muted/40 p-2 flex flex-col gap-1">
                    {eligible.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic px-1">
                        Žádné vhodné úseky pro přidání.
                      </p>
                    ) : (
                      eligible.map(({ segment, conflict }) => (
                        <button
                          key={segment.id}
                          disabled={conflict}
                          title={
                            conflict
                              ? "Přináší milník, který už na trase je"
                              : undefined
                          }
                          onClick={() => {
                            if (conflict) return;
                            routesStore.upsert({
                              ...route,
                              segmentIds: [...route.segmentIds, segment.id],
                            });
                            setPickerOpen(false);
                          }}
                          className={cn(
                            "flex items-center justify-between rounded-md px-3 py-2 text-sm text-left transition-colors",
                            conflict
                              ? "opacity-50 cursor-not-allowed text-foreground"
                              : "hover:bg-muted text-foreground cursor-pointer"
                          )}
                        >
                          <span className="font-medium">{segment.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {[...segment.carriers, ...segment.serviceTypes].join(" · ")}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Validation issues */}
              {issues.length > 0 && (
                <div className="flex flex-col gap-1 mt-1">
                  {issues.map((issue, i) => (
                    <p key={i} className="text-sm text-amber-600">
                      ⚠ {issue.message}
                      {ctMap.has(issue.checkpointTypeId) && (
                        <span className="ml-1 text-amber-500">
                          ({ctMap.get(issue.checkpointTypeId)})
                        </span>
                      )}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </SectionCard>

          {/* Milestones + map section */}
          <SectionCard icon={MapPin} title="Milníky trasy">
            {/* Milestone chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              {labels.map((label, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  {/* Chevron separator (not before first) */}
                  {i > 0 && (
                    <svg
                      viewBox="0 0 8 14"
                      className="size-3 text-muted-foreground shrink-0"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 1l6 6-6 6" />
                    </svg>
                  )}
                  <button
                    onClick={() => setActiveIndex(i)}
                    className={cn(
                      "flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium transition-colors",
                      i === activeIndex
                        ? "bg-primary-soft text-primary border-2 border-primary"
                        : "border border-border text-foreground hover:bg-muted"
                    )}
                  >
                    <span className="tabular-nums text-xs opacity-70">{i + 1}</span>
                    <span>{label}</span>
                  </button>
                </div>
              ))}

              {/* Add milestone chip */}
              <div className="flex items-center gap-1.5">
                <svg
                  viewBox="0 0 8 14"
                  className="size-3 text-muted-foreground shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 1l6 6-6 6" />
                </svg>
                <button className="rounded-full border border-dashed border-border px-3 py-1 text-sm text-muted-foreground hover:bg-muted">
                  + milník
                </button>
              </div>
            </div>

            {/* Schematic map */}
            <RouteMap
              labels={labels}
              activeIndex={activeIndex}
              onSelect={setActiveIndex}
            />
          </SectionCard>

          {/* Segment library section */}
          <SectionCard icon={Boxes} title="Knihovna úseků">
            <SegmentsPanel
              defaultCarriers={route.carriers}
              defaultServiceTypes={route.serviceTypes}
            />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
