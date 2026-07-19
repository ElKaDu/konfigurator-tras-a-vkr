import { Link, useNavigate } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { useRoutes, useSegments, routesStore, segmentsStore } from "@/lib/model/store";
import type { Route, Segment } from "@/lib/model/types";

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
  const segMap = new Map(segments.map((s) => [s.id, s]));

  function addRoute() {
    const route = createBlankRoute();
    routesStore.upsert(route);
  }

  function addSegment(routeId: string) {
    const segment = createBlankSegment();
    segmentsStore.upsert(segment);
    const route = routesStore.byId(routeId);
    if (route) routesStore.upsert({ ...route, segmentIds: [...route.segmentIds, segment.id] });
    navigate({ to: "/soulad-s-trasou/usek/$id", params: { id: segment.id } });
  }

  return (
    <div className="flex h-screen w-screen flex-col bg-background text-foreground">
      <AppHeader current="soulad" />
      <div className="flex-1 overflow-y-auto p-8">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-semibold">Soulad s trasou</h1>
          <button onClick={addRoute} className="bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-primary/90">
            + Přidat trasu
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Vyberte úsek trasy — pro každý bod v úseku se konfiguruje typ bodu, podmínky a kontroly.
        </p>
        <div className="flex flex-col gap-6 max-w-2xl">
          {routes.map((route) => (
            <div key={route.id} className="rounded-lg border border-border bg-card">
              <div className="px-4 py-3 border-b border-border">
                <div className="text-sm font-semibold">{route.name}</div>
                <div className="text-xs text-muted-foreground">{route.carriers.join(", ") || "bez dopravce"} · {route.serviceTypes.join(", ") || "bez typu služby"}</div>
              </div>
              <div className="p-2">
                {route.segmentIds.map((segId) => {
                  const seg = segMap.get(segId);
                  if (!seg) return null;
                  return (
                    <Link
                      key={segId}
                      to="/soulad-s-trasou/usek/$id"
                      params={{ id: segId }}
                      className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-muted"
                    >
                      <span>{seg.name}</span>
                      <span className="text-xs text-muted-foreground">{seg.checkpoints.length} bodů</span>
                    </Link>
                  );
                })}
                <button
                  onClick={() => addSegment(route.id)}
                  className="w-full rounded-md border border-dashed border-border px-3 py-2 text-sm text-primary hover:bg-muted mt-1"
                >
                  + Přidat úsek
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
