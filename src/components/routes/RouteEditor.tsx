import { useState } from "react";
import { MapPin, Truck } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { useRoutes, useCheckpointTypes } from "@/lib/model/store";
import { cn } from "@/lib/utils";
import { CoverageEditor } from "./CoverageEditor";
import { RouteMap } from "./RouteMap";

export function RouteEditor() {
  const route = useRoutes()[0];
  const checkpointTypes = useCheckpointTypes();
  const [activeIndex, setActiveIndex] = useState(0);

  // Build a map from checkpointTypeId → name for quick lookup
  const ctMap = new Map(checkpointTypes.map((ct) => [ct.id, ct.name]));

  // Resolve milestone labels from the route's checkpoints
  const labels: string[] = route.checkpoints.map(
    (cp) => ctMap.get(cp.checkpointTypeId) ?? cp.checkpointTypeId
  );

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

          {/* Task 10: CheckpointWizard for active milestone goes here */}
        </div>
      </div>
    </div>
  );
}
