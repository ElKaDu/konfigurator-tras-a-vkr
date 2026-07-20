// src/components/soulad/SouladSTrasouListPage.tsx
import { useState } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { DataMenu } from "@/components/common/DataMenu";
import { useRoutes, useSegments, routesStore, segmentsStore } from "@/lib/model/store";
import type { Route, Segment } from "@/lib/model/types";
import { RouteRow } from "./RouteRow";
import { SegmentRow } from "./SegmentRow";

function createBlankRoute(): Route {
  const id = "route_" + Date.now();
  return { id, code: id, name: "Nová trasa", active: true, carriers: [], serviceTypes: [], destCountries: [], segmentIds: [] };
}

function createBlankSegment(): Segment {
  const id = "seg_" + Date.now();
  return { id, name: "Nový úsek", carriers: [], serviceTypes: [], checkpoints: [] };
}

export function SouladSTrasouListPage() {
  const routes = useRoutes();
  const segments = useSegments();
  const navigate = useNavigate();
  const [expandedRouteId, setExpandedRouteId] = useState<string | null>(null);

  const expandedRoute = expandedRouteId ? routes.find((r) => r.id === expandedRouteId) ?? null : null;
  const routeSegmentIds = expandedRoute ? new Set(expandedRoute.segmentIds) : null;
  const highlightedSegments = routeSegmentIds ? segments.filter((s) => routeSegmentIds.has(s.id)) : [];
  const otherSegments = routeSegmentIds ? segments.filter((s) => !routeSegmentIds.has(s.id)) : segments;

  function addRoute() {
    const route = createBlankRoute();
    routesStore.upsert(route);
    navigate({ to: "/soulad-s-trasou/trasa/$id", params: { id: route.id } });
  }

  function addSegment() {
    const segment = createBlankSegment();
    segmentsStore.upsert(segment);
    navigate({ to: "/soulad-s-trasou/usek/$id", params: { id: segment.id } });
  }

  return (
    <div className="flex h-screen w-screen flex-col bg-background text-foreground">
      <AppHeader current="soulad" extras={<DataMenu />} />
      <div className="flex flex-1 min-h-0 gap-0">
        {/* LEFT — Trasy */}
        <div className="flex flex-col min-h-0 w-1/2 border-r border-border">
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold">Trasy</h2>
            <button
              onClick={addRoute}
              className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="size-3.5" /> Nová trasa
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {routes.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground italic">Zatím žádné trasy.</div>
            ) : (
              routes.map((route) => (
                <RouteRow
                  key={route.id}
                  route={route}
                  segments={segments}
                  expanded={expandedRouteId === route.id}
                  onToggle={() => setExpandedRouteId(expandedRouteId === route.id ? null : route.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* RIGHT — Úseky */}
        <div className="flex flex-col min-h-0 w-1/2">
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold">Úseky</h2>
            <button
              onClick={addSegment}
              className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="size-3.5" /> Nový úsek
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {segments.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground italic">Zatím žádné úseky.</div>
            ) : (
              <>
                {highlightedSegments.map((seg) => (
                  <SegmentRow key={seg.id} segment={seg} fromRouteId={expandedRoute?.id} highlighted />
                ))}
                {expandedRoute && highlightedSegments.length > 0 && otherSegments.length > 0 && (
                  <div className="mx-4 my-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="flex-1 h-px bg-border" />
                    <span>ostatní úseky</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                )}
                {otherSegments.map((seg) => (
                  <SegmentRow key={seg.id} segment={seg} />
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
