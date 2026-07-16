import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { d as useNavigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { u as useRoutes, a as useSegments, b as useCheckpointTypes, A as AppHeader, c as cn, r as routesStore, s as segmentsStore } from "./store-CVlU6jxP.mjs";
import { e as eligibleSegments, v as validateRouteComposition, a as assembledCheckpoints } from "./routeAssembly-Bh_8WlqS.mjs";
import { T as TRANSPORT_VARIANTS } from "./types-Dll7jDXK.mjs";
import { a as Route$5 } from "./router-D8haT4Dw.mjs";
import { k as ChevronUp, C as ChevronDown, a as ChevronRight, X, e as TriangleAlert, I as Info } from "../_libs/lucide-react.mjs";
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
import "../_libs/tanstack__query-core.mjs";
import "../_libs/tanstack__react-query.mjs";
const COUNTRY_OPTIONS = [
  { value: "CZ", label: "Česko" },
  { value: "SK", label: "Slovensko" },
  { value: "DE", label: "Německo" },
  { value: "AT", label: "Rakousko" },
  { value: "PL", label: "Polsko" },
  { value: "HU", label: "Maďarsko" },
  { value: "FR", label: "Francie" },
  { value: "BE", label: "Belgie" },
  { value: "NL", label: "Nizozemsko" },
  { value: "IT", label: "Itálie" },
  { value: "ES", label: "Španělsko" },
  { value: "PT", label: "Portugalsko" },
  { value: "CH", label: "Švýcarsko" },
  { value: "GB", label: "Velká Británie" },
  { value: "IE", label: "Irsko" },
  { value: "DK", label: "Dánsko" },
  { value: "SE", label: "Švédsko" },
  { value: "NO", label: "Norsko" },
  { value: "FI", label: "Finsko" },
  { value: "RO", label: "Rumunsko" },
  { value: "BG", label: "Bulharsko" },
  { value: "GR", label: "Řecko" },
  { value: "HR", label: "Chorvatsko" },
  { value: "SI", label: "Slovinsko" },
  { value: "EE", label: "Estonsko" },
  { value: "LV", label: "Lotyšsko" },
  { value: "LT", label: "Litva" },
  { value: "US", label: "USA" },
  { value: "CA", label: "Kanada" },
  { value: "MX", label: "Mexiko" },
  { value: "BR", label: "Brazílie" },
  { value: "CN", label: "Čína" },
  { value: "JP", label: "Japonsko" },
  { value: "KR", label: "Jižní Korea" },
  { value: "IN", label: "Indie" },
  { value: "AU", label: "Austrálie" },
  { value: "AE", label: "SAE" },
  { value: "TR", label: "Turecko" }
];
const CARRIER_OPTIONS = ["FedEx", "UPS", "DHL", "PPL", "GLS"];
function RouteEditorPage({ routeId }) {
  const routes = useRoutes();
  const segments = useSegments();
  const checkpointTypes = useCheckpointTypes();
  const navigate = useNavigate();
  const route = routes.find((r) => r.id === routeId) ?? routes[0] ?? null;
  const [selectedSegmentId, setSelectedSegmentId] = reactExports.useState(
    route?.segmentIds[0] ?? null
  );
  const [pickerOpen, setPickerOpen] = reactExports.useState(false);
  function createAndOpenNewSegment() {
    const id = "seg_" + Date.now();
    segmentsStore.upsert({ id, name: "Nový úsek", carriers: [], serviceTypes: [], checkpoints: [] });
    navigate({ to: "/usek/$id", params: { id }, search: { from: routeId } });
  }
  const ctMap = reactExports.useMemo(() => new Map(checkpointTypes.map((ct) => [ct.id, ct.name])), [checkpointTypes]);
  const segMap = reactExports.useMemo(() => new Map(segments.map((s) => [s.id, s])), [segments]);
  if (!route) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-screen w-screen flex-col bg-background text-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(AppHeader, { current: "routes" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-8 text-sm text-muted-foreground", children: "Trasa nenalezena." })
    ] });
  }
  const eligible = eligibleSegments(route, segments);
  const issues = validateRouteComposition(route.segmentIds, segments);
  const selectedSegment = selectedSegmentId ? segMap.get(selectedSegmentId) ?? null : null;
  const allSegmentCheckpoints = assembledCheckpoints(route, segments);
  const routeMilestones = allSegmentCheckpoints.map((cp) => ({
    name: ctMap.get(cp.checkpointTypeId) ?? cp.checkpointTypeId,
    cp
  }));
  function update(patch) {
    routesStore.upsert({ ...route, ...patch });
  }
  function toggleMulti(arr, val) {
    return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-screen w-screen flex-col bg-background text-foreground", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(AppHeader, { current: "routes" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-1 min-h-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex w-[280px] shrink-0 flex-col border-r border-border", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-y-auto p-4 space-y-5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3", children: "Pokrytí trasy" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs text-muted-foreground mb-1.5 block", children: "Název trasy" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  value: route.name,
                  onChange: (e) => update({ name: e.target.value }),
                  className: "w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs text-muted-foreground mb-1.5 block", children: "Kód trasy" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  value: route.code,
                  onChange: (e) => update({ code: e.target.value }),
                  placeholder: "R-XX-XXX-XX",
                  className: "w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs text-muted-foreground mb-1.5 block", children: "Dopravce" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-1.5", children: CARRIER_OPTIONS.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: () => update({ carriers: toggleMulti(route.carriers, c) }),
                  className: cn(
                    "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                    route.carriers.includes(c) ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
                  ),
                  children: c
                },
                c
              )) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs text-muted-foreground mb-1.5 block", children: "Typ služby" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-1.5", children: TRANSPORT_VARIANTS.map((v) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: () => update({ serviceTypes: toggleMulti(route.serviceTypes, v.value) }),
                  className: cn(
                    "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                    route.serviceTypes.includes(v.value) ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
                  ),
                  children: v.label
                },
                v.value
              )) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs text-muted-foreground mb-1.5 block", children: "Cílová země" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-1.5", children: COUNTRY_OPTIONS.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  title: c.label,
                  onClick: () => update({ destCountries: toggleMulti(route.destCountries, c.value) }),
                  className: cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors",
                    route.destCountries.includes(c.value) ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
                  ),
                  children: c.value
                },
                c.value
              )) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground", children: [
              "= ",
              route.carriers.length * route.serviceTypes.length * route.destCountries.length,
              " kombinací pokryto"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "Aktivní" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: () => update({ active: !route.active }),
                  className: cn(
                    "relative inline-block h-5 w-9 rounded-full transition-colors",
                    route.active ? "bg-primary" : "bg-muted"
                  ),
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn(
                    "absolute top-0.5 size-4 rounded-full bg-white transition-all shadow",
                    route.active ? "right-0.5" : "left-0.5"
                  ) })
                }
              )
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-border p-4 space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => {
                toast.success("Trasa uložena");
                navigate({ to: "/trasy" });
              },
              className: "w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors",
              children: "Uložit trasu"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Link,
            {
              to: "/trasy",
              className: "block w-full rounded-lg border border-border px-4 py-2 text-center text-sm text-muted-foreground hover:bg-muted transition-colors",
              children: "← Zpět na trasy"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-1 min-w-0 flex-col border-r border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-y-auto p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3", children: "Úseky trasy" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2 mb-4", children: [
          route.segmentIds.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground italic text-center", children: "Trasa zatím neobsahuje žádné úseky." }),
          route.segmentIds.map((id, idx) => {
            const seg = segMap.get(id);
            const isSelected = selectedSegmentId === id;
            const moveSegment = (dir) => {
              const next = [...route.segmentIds];
              const j = idx + dir;
              if (j < 0 || j >= next.length) return;
              [next[idx], next[j]] = [next[j], next[idx]];
              routesStore.upsert({ ...route, segmentIds: next });
            };
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                onClick: () => setSelectedSegmentId(isSelected ? null : id),
                className: cn(
                  "group flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left cursor-pointer transition-colors",
                  isSelected ? "border-primary bg-primary-soft/20" : "border-border hover:bg-muted/40"
                ),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "tabular-nums text-xs text-muted-foreground shrink-0", children: idx + 1 }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col shrink-0", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        disabled: idx === 0,
                        onClick: (e) => {
                          e.stopPropagation();
                          moveSegment(-1);
                        },
                        className: "text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed",
                        title: "Posunout nahoru",
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronUp, { className: "size-3.5" })
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        disabled: idx === route.segmentIds.length - 1,
                        onClick: (e) => {
                          e.stopPropagation();
                          moveSegment(1);
                        },
                        className: "text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed",
                        title: "Posunout dolů",
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "size-3.5" })
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium truncate", children: seg?.name ?? id }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground", children: [
                      seg?.checkpoints.length ?? 0,
                      " milníků"
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "size-4 shrink-0 text-muted-foreground" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      onClick: (e) => {
                        e.stopPropagation();
                        routesStore.upsert({ ...route, segmentIds: route.segmentIds.filter((x) => x !== id) });
                        if (selectedSegmentId === id) setSelectedSegmentId(null);
                      },
                      className: "shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground transition-opacity",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "size-4" })
                    }
                  )
                ]
              },
              id
            );
          })
        ] }),
        issues.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-4 space-y-1", children: issues.map((issue) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs text-amber-600", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "size-3.5 shrink-0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: issue.message })
        ] }, issue.kind + "_" + issue.checkpointTypeId)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-t border-border my-4" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2", children: "Přidat úsek" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => setPickerOpen((v) => !v),
            className: "mb-2 flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-primary hover:bg-primary-soft/20 transition-colors",
            children: "+ vybrat z knihovny úseků"
          }
        ),
        pickerOpen && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-border bg-muted/20 p-2 space-y-1", children: eligible.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-muted-foreground italic px-2", children: "Žádné vhodné úseky." }) : eligible.map(({ segment, conflict }) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            disabled: conflict,
            onClick: () => {
              if (conflict) return;
              routesStore.upsert({ ...route, segmentIds: [...route.segmentIds, segment.id] });
              setPickerOpen(false);
            },
            className: cn(
              "w-full flex items-center justify-between rounded-md px-3 py-2 text-sm text-left transition-colors",
              conflict ? "opacity-50 cursor-not-allowed" : "hover:bg-muted cursor-pointer"
            ),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: segment.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: segment.carriers.join(", ") })
            ]
          },
          segment.id
        )) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: createAndOpenNewSegment,
            className: "mt-2 flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-primary hover:bg-primary-soft/20 transition-colors",
            children: "+ vytvořit nový úsek →"
          }
        )
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex w-[420px] shrink-0 flex-col overflow-y-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3", children: selectedSegment ? `Milníky úseku: ${selectedSegment.name}` : "Milníky trasy (celkem)" }),
        !selectedSegment && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap items-center gap-1.5 mb-4", children: routeMilestones.map((m, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
            i > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "size-3 text-muted-foreground" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full border border-border bg-background px-2.5 py-0.5 text-xs font-medium", children: m.name })
          ] }, i)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-md bg-muted/30 border border-border px-3 py-2 text-xs text-muted-foreground flex items-start gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "size-3.5 shrink-0 mt-0.5" }),
            "Kliknutím na úsek v středním sloupci zobrazíš jeho milníky. Milníky se konfigurují v editoru úseku."
          ] })
        ] }),
        selectedSegment && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          selectedSegment.checkpoints.map((cp, i) => {
            const name = ctMap.get(cp.checkpointTypeId) ?? cp.checkpointTypeId;
            const matchCount = Object.values(cp.match).filter(
              (v) => v !== void 0 && (Array.isArray(v) ? v.length > 0 : true)
            ).length;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border bg-background p-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "tabular-nums text-xs text-muted-foreground", children: i + 1 }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium", children: name })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground", children: [
                matchCount,
                " match podmínek"
              ] }),
              (cp.expectedDurationHours || cp.warnAfterHours || cp.criticalAfterHours) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex flex-wrap gap-2 text-[11px]", children: [
                cp.expectedDurationHours && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "size-2 rounded-full bg-green-500" }),
                  cp.expectedDurationHours,
                  " h"
                ] }),
                cp.warnAfterHours && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "size-2 rounded-full bg-amber-500" }),
                  cp.warnAfterHours,
                  " h"
                ] }),
                cp.criticalAfterHours && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "size-2 rounded-full bg-red-500" }),
                  cp.criticalAfterHours,
                  " h"
                ] })
              ] })
            ] }, cp.id);
          }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Link,
            {
              to: "/usek/$id",
              params: { id: selectedSegment.id },
              search: { from: routeId },
              className: "flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors mt-2",
              children: "Upravit úsek"
            }
          )
        ] })
      ] }) })
    ] })
  ] });
}
function TraseEditorRoute() {
  const {
    id
  } = Route$5.useParams();
  return /* @__PURE__ */ jsxRuntimeExports.jsx(RouteEditorPage, { routeId: id });
}
export {
  TraseEditorRoute as component
};
