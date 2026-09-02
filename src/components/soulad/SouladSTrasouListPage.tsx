// src/components/soulad/SouladSTrasouListPage.tsx
import { useState } from "react";
import { Plus } from "@/components/ui/icon";
import { useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { DataMenu } from "@/components/common/DataMenu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    <AppShell current="soulad" title="Soulad s trasou" actions={<DataMenu />}>
      <Tabs defaultValue="trasy" className="rounded-md bg-card elevation-2">
        <TabsList className="w-full border-b border-border px-6">
          <TabsTrigger value="trasy">Trasy</TabsTrigger>
          <TabsTrigger value="useky">Úseky</TabsTrigger>
        </TabsList>

        <TabsContent value="trasy" className="mt-0">
          <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-4">
            <div>
              <h2 className="text-h5">Trasy</h2>
              <p className="mt-1 text-[13px] leading-[18px] text-muted-foreground">
                Předepsané trasy a jejich úseky — proti nim se kontroluje soulad zásilky.
              </p>
            </div>
            <button
              onClick={addRoute}
              className="flex shrink-0 items-center gap-1.5 rounded-md border border-primary px-4 py-2 text-[15px] font-medium text-primary transition-colors hover:bg-primary/[0.06]"
            >
              <Plus size={18} /> Nová trasa
            </button>
          </div>
          <div>
            {routes.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-muted-foreground">Zatím žádné trasy.</div>
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
        </TabsContent>

        <TabsContent value="useky" className="mt-0">
          <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-4">
            <div>
              <h2 className="text-h5">Úseky</h2>
              <p className="mt-1 text-[13px] leading-[18px] text-muted-foreground">
                Znovupoužitelné části trasy — jeden úsek může být v několika trasách.
              </p>
            </div>
            <button
              onClick={addSegment}
              className="flex shrink-0 items-center gap-1.5 rounded-md border border-primary px-4 py-2 text-[15px] font-medium text-primary transition-colors hover:bg-primary/[0.06]"
            >
              <Plus size={18} /> Nový úsek
            </button>
          </div>
          <div>
            {segments.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-muted-foreground">Zatím žádné úseky.</div>
            ) : (
              segments.map((seg) => <SegmentRow key={seg.id} segment={seg} />)
            )}
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
