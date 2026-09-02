// src/components/soulad/RouteRow.tsx
import { ChevronDown, ChevronRight, Plus, Trash2 } from "@/components/ui/icon";
import { Link } from "@tanstack/react-router";
import { routesStore, segmentsStore } from "@/lib/model/store";
import { cn } from "@/lib/utils";
import type { Route, Segment } from "@/lib/model/types";
import { SegmentRow } from "./SegmentRow";
import { AddExistingSegmentPicker } from "./AddExistingSegmentPicker";

function createBlankSegment(): Segment {
  const id = "seg_" + Date.now();
  return { id, name: "Nový úsek", carriers: [], serviceTypes: [], checkpoints: [] };
}

export function RouteRow({
  route,
  segments,
  expanded,
  onToggle,
}: {
  route: Route;
  segments: Segment[];
  expanded: boolean;
  onToggle: () => void;
}) {
  const segMap = new Map(segments.map((s) => [s.id, s]));

  function addExistingSegment(segmentId: string) {
    routesStore.upsert({ ...route, segmentIds: [...route.segmentIds, segmentId] });
  }

  // Deliberately stays on the dashboard — unlike the route editor's create+attach
  // (Task 9), which navigates to the new segment's own page. Don't "fix" this.
  function createAndAttachSegment() {
    const segment = createBlankSegment();
    segmentsStore.upsert(segment);
    routesStore.upsert({ ...route, segmentIds: [...route.segmentIds, segment.id] });
  }

  return (
    <div className="border-b border-border last:border-b-0">
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={onToggle}
          className="shrink-0 text-muted-foreground hover:text-foreground"
          aria-label={expanded ? "Sbalit trasu" : "Rozbalit trasu"}
        >
          {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link
              to="/soulad-s-trasou/trasa/$id"
              params={{ id: route.id }}
              className="text-sm font-medium underline decoration-dotted underline-offset-2 hover:text-primary truncate"
            >
              {route.name}
            </Link>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                route.active ? "bg-success/20 text-success-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              {route.active ? "aktivní" : "neaktivní"}
            </span>
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {route.code} · {route.carriers.join(", ") || "bez dopravce"} ·{" "}
            {route.destCountries.join(", ") || "bez cílové země"}
          </div>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">{route.segmentIds.length} úseků</span>
      </div>

      {expanded && (
        <div className="bg-primary-soft/10 border-t border-primary/10 px-4 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Dopravce</div>
              <div className="font-medium">{route.carriers.join(", ") || "—"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Typ služby</div>
              <div className="font-medium">{route.serviceTypes.join(", ") || "—"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Cílové země</div>
              <div className="font-medium">{route.destCountries.join(", ") || "—"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Pokrytí</div>
              <div className="font-medium">
                {route.carriers.length * route.serviceTypes.length * route.destCountries.length} kombinací
              </div>
            </div>
          </div>

          {route.segmentIds.length > 0 && (
            <div className="rounded-lg border border-border bg-background overflow-hidden">
              {route.segmentIds.map((segId) => {
                const seg = segMap.get(segId);
                return seg ? <SegmentRow key={segId} segment={seg} fromRouteId={route.id} /> : null;
              })}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <AddExistingSegmentPicker route={route} segments={segments} onAdd={addExistingSegment} />
            <button
              onClick={createAndAttachSegment}
              className="flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-1.5 text-xs text-primary hover:bg-primary-soft/20 transition-colors"
            >
              <Plus className="size-3.5" /> vytvořit nový úsek
            </button>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Link
              to="/soulad-s-trasou/trasa/$id"
              params={{ id: route.id }}
              className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Upravit trasu
            </Link>
            <button
              onClick={() => routesStore.remove(route.id)}
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-red-300 hover:text-red-500 transition-colors"
            >
              <Trash2 className="size-3.5" /> Smazat trasu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
