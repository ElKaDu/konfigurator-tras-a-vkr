import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { d as useNavigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { u as useRoutes, a as useSegments, b as useCheckpointTypes, A as AppHeader, r as routesStore, c as cn, s as segmentsStore, i as isSegmentUsed } from "./store-CVlU6jxP.mjs";
import { D as DataMenu } from "./DataMenu-DXyXTpj0.mjs";
import { a as assembledCheckpoints } from "./routeAssembly-Bh_8WlqS.mjs";
import { P as Plus, S as Search, X, C as ChevronDown, a as ChevronRight, L as Layers, T as Trash2 } from "../_libs/lucide-react.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/radix-ui__react-dropdown-menu.mjs";
import "../_libs/radix-ui__primitive.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-menu.mjs";
import "../_libs/radix-ui__react-collection.mjs";
import "../_libs/radix-ui__react-direction.mjs";
import "../_libs/@radix-ui/react-dismissable-layer+[...].mjs";
import "../_libs/@radix-ui/react-use-callback-ref+[...].mjs";
import "../_libs/@radix-ui/react-use-escape-keydown+[...].mjs";
import "../_libs/radix-ui__react-focus-guards.mjs";
import "../_libs/radix-ui__react-focus-scope.mjs";
import "../_libs/radix-ui__react-popper.mjs";
import "../_libs/floating-ui__react-dom.mjs";
import "../_libs/floating-ui__dom.mjs";
import "../_libs/floating-ui__core.mjs";
import "../_libs/floating-ui__utils.mjs";
import "../_libs/radix-ui__react-arrow.mjs";
import "../_libs/radix-ui__react-use-size.mjs";
import "../_libs/radix-ui__react-portal.mjs";
import "../_libs/radix-ui__react-presence.mjs";
import "../_libs/radix-ui__react-roving-focus.mjs";
import "../_libs/radix-ui__react-id.mjs";
import "../_libs/aria-hidden.mjs";
import "../_libs/react-remove-scroll.mjs";
import "tslib";
import "../_libs/react-remove-scroll-bar.mjs";
import "../_libs/react-style-singleton.mjs";
import "../_libs/get-nonce.mjs";
import "../_libs/use-sidecar.mjs";
import "../_libs/use-callback-ref.mjs";
function RoutesAndSegmentsPage() {
  const routes = useRoutes();
  const segments = useSegments();
  const checkpointTypes = useCheckpointTypes();
  const [expandedRouteId, setExpandedRouteId] = reactExports.useState(null);
  const [routeFilter, setRouteFilter] = reactExports.useState("");
  const [segmentFilter, setSegmentFilter] = reactExports.useState("");
  const [selectedSegmentId, setSelectedSegmentId] = reactExports.useState(null);
  const navigate = useNavigate();
  const ctMap = reactExports.useMemo(() => new Map(checkpointTypes.map((ct) => [ct.id, ct.name])), [checkpointTypes]);
  const segMap = reactExports.useMemo(() => new Map(segments.map((s) => [s.id, s])), [segments]);
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
  const routeSegmentIds = expandedRoute ? new Set(expandedRoute.segmentIds) : null;
  const filteredSegments = reactExports.useMemo(() => {
    const q = segmentFilter.toLowerCase();
    return segments.filter(
      (s) => !q || s.name.toLowerCase().includes(q) || s.carriers.join(" ").toLowerCase().includes(q)
    );
  }, [segments, segmentFilter]);
  const routeMatchSegments = routeSegmentIds ? filteredSegments.filter((s) => routeSegmentIds.has(s.id)) : [];
  const otherSegments = routeSegmentIds ? filteredSegments.filter((s) => !routeSegmentIds.has(s.id)) : filteredSegments;
  const filteredRoutes = reactExports.useMemo(() => {
    const q = routeFilter.toLowerCase();
    return routes.filter(
      (r) => !q || r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q)
    );
  }, [routes, routeFilter]);
  const selectedSegment = selectedSegmentId ? segMap.get(selectedSegmentId) ?? null : null;
  function handleRouteClick(routeId) {
    if (expandedRouteId === routeId) {
      setExpandedRouteId(null);
    } else {
      setExpandedRouteId(routeId);
    }
  }
  function clearRouteFilter() {
    setExpandedRouteId(null);
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-screen w-screen flex-col bg-background text-foreground", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      AppHeader,
      {
        current: "routes",
        extras: /* @__PURE__ */ jsxRuntimeExports.jsx(DataMenu, {})
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-1 min-h-0 gap-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col min-h-0 w-1/2 border-r border-border", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 px-4 py-3 border-b border-border", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold", children: "Trasy" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: createNewRoute, className: "flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-3.5" }),
            " Nová trasa"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 py-2 border-b border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              value: routeFilter,
              onChange: (e) => setRouteFilter(e.target.value),
              placeholder: "Hledat trasy…",
              className: "w-full rounded-md border border-border bg-background pl-8 pr-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            }
          )
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-y-auto", children: filteredRoutes.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-6 text-center text-sm text-muted-foreground italic", children: "Žádné trasy neodpovídají filtru." }) : filteredRoutes.map((route) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          RouteRow,
          {
            route,
            expanded: expandedRouteId === route.id,
            ctMap,
            segMap,
            onClick: () => handleRouteClick(route.id)
          },
          route.id
        )) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col min-h-0 w-1/2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 px-4 py-3 border-b border-border", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold", children: "Úseky" }),
            expandedRoute && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-medium text-primary", children: [
              expandedRoute.code,
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: clearRouteFilter, className: "ml-0.5 hover:text-primary/60", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "size-3" }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: createNewSegment, className: "flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-3.5" }),
            " Nový úsek"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 py-2 border-b border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              value: segmentFilter,
              onChange: (e) => setSegmentFilter(e.target.value),
              placeholder: "Hledat úseky…",
              className: "w-full rounded-md border border-border bg-background pl-8 pr-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            }
          )
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-y-auto", children: [
          expandedRoute && routeMatchSegments.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            routeMatchSegments.map((seg) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              SegmentRow,
              {
                segment: seg,
                selected: selectedSegmentId === seg.id,
                highlighted: true,
                ctMap,
                onClick: () => setSelectedSegmentId(seg.id === selectedSegmentId ? null : seg.id)
              },
              seg.id
            )),
            otherSegments.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-4 my-2 flex items-center gap-2 text-xs text-muted-foreground", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 h-px bg-border" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "ostatní úseky" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 h-px bg-border" })
            ] })
          ] }),
          (expandedRoute ? otherSegments : filteredSegments).map((seg) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            SegmentRow,
            {
              segment: seg,
              selected: selectedSegmentId === seg.id,
              highlighted: false,
              dimmed: !!expandedRoute,
              ctMap,
              onClick: () => setSelectedSegmentId(seg.id === selectedSegmentId ? null : seg.id)
            },
            seg.id
          )),
          filteredSegments.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-6 text-center text-sm text-muted-foreground italic", children: "Žádné úseky neodpovídají filtru." })
        ] })
      ] })
    ] }),
    selectedSegment && /* @__PURE__ */ jsxRuntimeExports.jsx(
      SegmentDetailSidebar,
      {
        segment: selectedSegment,
        ctMap,
        fromRouteId: expandedRouteId,
        onClose: () => setSelectedSegmentId(null),
        onDelete: () => setSelectedSegmentId(null)
      }
    )
  ] });
}
function RouteRow({
  route,
  expanded,
  ctMap,
  segMap,
  onClick
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-b border-border last:border-b-0", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        onClick,
        className: cn(
          "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50",
          expanded && "bg-primary-soft/30"
        ),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: expanded ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "size-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "size-4" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium truncate", children: route.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "span",
                {
                  className: cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                    route.active ? "bg-success/20 text-success-foreground" : "bg-muted text-muted-foreground"
                  ),
                  children: route.active ? "aktivní" : "neaktivní"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-0.5 text-xs text-muted-foreground", children: [
              route.code,
              " · ",
              route.carriers.join(", "),
              " · ",
              route.destCountries.join(", ")
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "shrink-0 text-xs text-muted-foreground", children: [
            route.segmentIds.length,
            " úseků"
          ] })
        ]
      }
    ),
    expanded && /* @__PURE__ */ jsxRuntimeExports.jsx(RouteExpandedDetail, { route, ctMap, segMap })
  ] });
}
function RouteExpandedDetail({
  route,
  ctMap,
  segMap
}) {
  const allSegments = Array.from(segMap.values());
  const checkpoints = assembledCheckpoints(route, allSegments);
  const milestoneLabels = checkpoints.map((cp) => ctMap.get(cp.checkpointTypeId) ?? cp.checkpointTypeId);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-primary-soft/10 border-t border-primary/10 px-4 py-4 space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3 text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground mb-1", children: "Dopravce" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium", children: route.carriers.join(", ") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground mb-1", children: "Typ služby" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium", children: route.serviceTypes.join(", ") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground mb-1", children: "Cílové země" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium", children: route.destCountries.join(", ") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground mb-1", children: "Pokrytí" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-medium", children: [
          route.carriers.length * route.serviceTypes.length * route.destCountries.length,
          " kombinací"
        ] })
      ] })
    ] }),
    milestoneLabels.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground mb-2", children: "Milníky trasy" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap items-center gap-1.5", children: milestoneLabels.map((label, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
        i > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "size-3 text-muted-foreground" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full border border-border bg-background px-2.5 py-0.5 text-xs font-medium", children: label })
      ] }, i)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 pt-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Link,
        {
          to: "/trasa/$id",
          params: { id: route.id },
          className: "flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors",
          children: "Upravit trasu"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => routesStore.remove(route.id),
          className: "flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-red-300 hover:text-red-500 transition-colors",
          title: "Smazat trasu",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "size-3.5" }),
            " Smazat"
          ]
        }
      )
    ] })
  ] });
}
function SegmentRow({
  segment,
  selected,
  highlighted,
  dimmed,
  ctMap,
  onClick
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "button",
    {
      onClick,
      className: cn(
        "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors border-b border-border last:border-b-0",
        selected && "bg-primary-soft/30",
        highlighted && !selected && "hover:bg-primary-soft/10",
        !highlighted && !selected && "hover:bg-muted/50",
        dimmed && !highlighted && "opacity-50"
      ),
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Layers, { className: "mt-0.5 size-4 shrink-0 text-muted-foreground" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium truncate", children: segment.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-0.5 text-xs text-muted-foreground", children: [
            segment.carriers.join(", "),
            " · ",
            segment.serviceTypes.join(", "),
            " · ",
            segment.checkpoints.length,
            " milníků"
          ] })
        ] })
      ]
    }
  );
}
function SegmentDetailSidebar({
  segment,
  ctMap,
  fromRouteId,
  onClose,
  onDelete
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "fixed right-0 top-14 bottom-0 flex w-[400px] flex-col border-l border-border bg-surface shadow-xl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3 px-5 pt-5 pb-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-medium uppercase tracking-wider text-muted-foreground", children: "Úsek" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mt-1 text-base font-semibold", children: segment.name }),
        segment.description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-sm text-muted-foreground", children: segment.description })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: onClose,
          className: "rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "size-4" })
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-5 pb-3 flex flex-wrap gap-1.5", children: [
      segment.carriers.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium", children: c }, c)),
      segment.serviceTypes.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium", children: t }, t))
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-y-auto px-5 pb-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3", children: [
        "Milníky (",
        segment.checkpoints.length,
        ")"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col gap-3", children: segment.checkpoints.map((cp, i) => {
        const name = ctMap.get(cp.checkpointTypeId) ?? cp.checkpointTypeId;
        const matchFields = Object.entries(cp.match).filter(([, v]) => v !== void 0 && v !== null && (Array.isArray(v) ? v.length > 0 : true)).map(([k, v]) => {
          if (k === "event_time_of_day" && v && typeof v === "object") {
            const etod = v;
            const opLabel = { before: "před", after: "po", between: "mezi", eq: "rovno" };
            const val = etod.op === "between" ? `${etod.from || "?"} – ${etod.to || "?"}` : etod.from || "?";
            return `Čas: ${opLabel[etod.op] ?? etod.op} ${val}`;
          }
          return `${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`;
        });
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border bg-background p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "tabular-nums text-xs font-medium text-muted-foreground", children: i + 1 }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium", children: name })
          ] }),
          matchFields.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] uppercase tracking-wider text-muted-foreground", children: "Match podmínky" }),
            matchFields.map((f) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-foreground/80", children: f }, f))
          ] }),
          (cp.expectedDurationHours || cp.warnAfterHours || cp.criticalAfterHours) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 pt-2 border-t border-border space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] uppercase tracking-wider text-muted-foreground", children: "Trvání" }),
            cp.expectedDurationHours && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 text-xs", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "size-2 rounded-full bg-green-500 shrink-0" }),
              "Očekávané: ",
              cp.expectedDurationHours,
              " h"
            ] }),
            cp.warnAfterHours && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 text-xs", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "size-2 rounded-full bg-amber-500 shrink-0" }),
              "Dlouho po: ",
              cp.warnAfterHours,
              " h"
            ] }),
            cp.criticalAfterHours && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 text-xs", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "size-2 rounded-full bg-red-500 shrink-0" }),
              "Kriticky po: ",
              cp.criticalAfterHours,
              " h"
            ] })
          ] })
        ] }, cp.id);
      }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-border bg-surface p-4 space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Link,
        {
          to: "/usek/$id",
          params: { id: segment.id },
          search: fromRouteId ? { from: fromRouteId } : {},
          className: "flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors",
          children: "Upravit úsek"
        }
      ),
      (() => {
        const { used, count } = isSegmentUsed(segment.id);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            disabled: used,
            onClick: () => {
              segmentsStore.remove(segment.id);
              onDelete();
            },
            title: used ? `Používá se v ${count} ${count === 1 ? "trase" : count < 5 ? "trasách" : "trasách"}` : "Smazat úsek",
            className: cn(
              "flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors",
              used ? "border-border text-muted-foreground/40 cursor-not-allowed" : "border-border text-muted-foreground hover:border-red-300 hover:text-red-500"
            ),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "size-4" }),
              used ? `Nelze smazat — používá se v ${count} ${count === 1 ? "trase" : "trasách"}` : "Smazat úsek"
            ]
          }
        );
      })()
    ] })
  ] });
}
const SplitComponent = RoutesAndSegmentsPage;
export {
  SplitComponent as component
};
