import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { d as useNavigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { a as useSegments, b as useCheckpointTypes, A as AppHeader, s as segmentsStore, c as cn, k as isCheckpointTypeUsed, d as checkpointTypesStore } from "./store-CVlU6jxP.mjs";
import { T as Textarea } from "./textarea-DgXTv_qS.mjs";
import { m as milestoneTypeUsage } from "./routeAssembly-Bh_8WlqS.mjs";
import { T as TRANSPORT_VARIANTS } from "./types-Dll7jDXK.mjs";
import { R as Route$6 } from "./router-D8haT4Dw.mjs";
import { k as ChevronUp, C as ChevronDown, a as ChevronRight, X, S as Search, T as Trash2, P as Plus, n as Calendar, M as MapPin, o as Clock, b as Check } from "../_libs/lucide-react.mjs";
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
const CARRIER_OPTIONS = ["FedEx", "UPS", "DHL", "PPL", "GLS"];
const MATCH_FIELDS = [
  { id: "status", label: "Status" },
  { id: "status_code", label: "Kód statusu" },
  { id: "location_country_code", label: "Země" },
  { id: "location_postal_code", label: "PSČ" },
  { id: "location_city", label: "Město" },
  { id: "location_type", label: "Typ lokace" },
  { id: "exception_code", label: "Kód výjimky" },
  { id: "event_time_of_day", label: "Čas uvedený na záznamu" }
];
const OPERATORS = [
  { id: "eq", label: "=" },
  { id: "contains", label: "obsahuje" },
  { id: "in", label: "je jedním z" },
  { id: "not", label: "není" }
];
const TIMEZONE_OPTIONS = [
  { value: "local", label: "Místní čas", hint: "odvozeno z cílové země zásilky" },
  { value: "Europe/Prague", label: "Europe/Prague" },
  { value: "Europe/Berlin", label: "Europe/Berlin" },
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "America/New_York" }
];
const TIME_UNITS_OFFSET = [
  { id: "min", label: "min" },
  { id: "h", label: "h" },
  { id: "d", label: "dní" },
  { id: "bd", label: "prac. dní" }
];
function SegmentEditorPage({ segmentId, fromRouteId }) {
  const segments = useSegments();
  const checkpointTypes = useCheckpointTypes();
  const segment = segments.find((s) => s.id === segmentId);
  const navigate = useNavigate();
  function handleSaveSegment() {
    toast.success("Úsek uložen");
    if (fromRouteId) navigate({ to: "/trasa/$id", params: { id: fromRouteId } });
    else navigate({ to: "/trasy" });
  }
  const [selectedCheckpointIdx, setSelectedCheckpointIdx] = reactExports.useState(
    segment && segment.checkpoints.length > 0 ? 0 : null
  );
  const [rightPanel, setRightPanel] = reactExports.useState("checkpoint_config");
  const [editingTypeId, setEditingTypeId] = reactExports.useState(null);
  const [libSearch, setLibSearch] = reactExports.useState("");
  const [mounted, setMounted] = reactExports.useState(false);
  reactExports.useEffect(() => setMounted(true), []);
  const usage = milestoneTypeUsage(segments);
  if (!mounted) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-screen w-screen flex-col bg-background text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AppHeader, { current: "routes" }) });
  }
  if (!segment) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-screen w-screen flex-col bg-background text-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(AppHeader, { current: "routes" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-8 text-sm text-muted-foreground", children: "Úsek nenalezen." })
    ] });
  }
  const typeName = (id) => checkpointTypes.find((t) => t.id === id)?.name ?? id;
  const selectedCp = selectedCheckpointIdx !== null ? segment.checkpoints[selectedCheckpointIdx] ?? null : null;
  function addMilestone(checkpointTypeId) {
    const newCp = {
      id: "cp_" + Date.now(),
      checkpointTypeId,
      match: {},
      correctness: []
    };
    const updated = { ...segment, checkpoints: [...segment.checkpoints, newCp] };
    segmentsStore.upsert(updated);
    setSelectedCheckpointIdx(updated.checkpoints.length - 1);
    setRightPanel("checkpoint_config");
  }
  function removeCheckpoint(idx) {
    const updated = { ...segment, checkpoints: segment.checkpoints.filter((_, i) => i !== idx) };
    segmentsStore.upsert(updated);
    setSelectedCheckpointIdx((prev) => prev === null ? null : Math.min(prev, updated.checkpoints.length - 1));
  }
  function updateCheckpoint(idx, cp) {
    const updated = {
      ...segment,
      checkpoints: segment.checkpoints.map((c, i) => i === idx ? cp : c)
    };
    segmentsStore.upsert(updated);
  }
  const filteredTypes = checkpointTypes.filter(
    (t) => !libSearch || t.name.toLowerCase().includes(libSearch.toLowerCase())
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-screen w-screen flex-col bg-background text-foreground", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(AppHeader, { current: "routes" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-1 min-h-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex w-[260px] shrink-0 flex-col border-r border-border", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-y-auto p-4 space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground", children: "Základní info" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs text-muted-foreground mb-1 block", children: "Název úseku" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                value: segment.name,
                onChange: (e) => segmentsStore.upsert({ ...segment, name: e.target.value }),
                className: "w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs text-muted-foreground mb-1 block", children: "Popis (volitelný)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "textarea",
              {
                value: segment.description ?? "",
                onChange: (e) => segmentsStore.upsert({ ...segment, description: e.target.value || void 0 }),
                rows: 3,
                placeholder: "Krátký popis…",
                className: "w-full resize-none rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs text-muted-foreground mb-1 block", children: "Dopravci" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-1.5", children: CARRIER_OPTIONS.map((c) => {
              const selected = segment.carriers.includes(c);
              return /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: () => segmentsStore.upsert({
                    ...segment,
                    carriers: selected ? segment.carriers.filter((x) => x !== c) : [...segment.carriers, c]
                  }),
                  className: cn(
                    "rounded-full px-2.5 py-0.5 text-xs transition-colors border",
                    selected ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted"
                  ),
                  children: c
                },
                c
              );
            }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs text-muted-foreground mb-1 block", children: "Typ služby" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-1.5", children: TRANSPORT_VARIANTS.map((v) => {
              const selected = segment.serviceTypes.includes(v.value);
              return /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: () => segmentsStore.upsert({
                    ...segment,
                    serviceTypes: selected ? segment.serviceTypes.filter((x) => x !== v.value) : [...segment.serviceTypes, v.value]
                  }),
                  className: cn(
                    "rounded-full px-2.5 py-0.5 text-xs transition-colors border",
                    selected ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted"
                  ),
                  children: v.label
                },
                v.value
              );
            }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-border p-4 space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: handleSaveSegment,
              className: "block w-full rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors",
              children: "Uložit úsek"
            }
          ),
          fromRouteId ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            Link,
            {
              to: "/trasa/$id",
              params: { id: fromRouteId },
              className: "block w-full rounded-lg border border-border px-4 py-2 text-center text-sm text-muted-foreground hover:bg-muted transition-colors",
              children: "← Zpět na trasu"
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
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
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3", children: [
          "Milníky úseku (",
          segment.checkpoints.length,
          ")"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5 mb-6", children: [
          segment.checkpoints.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground italic text-center", children: "Zatím žádné milníky." }),
          segment.checkpoints.map((cp, idx) => {
            const name = typeName(cp.checkpointTypeId);
            const matchCount = Object.values(cp.match).filter(
              (v) => v !== void 0 && (Array.isArray(v) ? v.length > 0 : true)
            ).length;
            const isSelected = selectedCheckpointIdx === idx && rightPanel === "checkpoint_config";
            const moveCp = (dir) => {
              const next = [...segment.checkpoints];
              const j = idx + dir;
              if (j < 0 || j >= next.length) return;
              [next[idx], next[j]] = [next[j], next[idx]];
              segmentsStore.upsert({ ...segment, checkpoints: next });
              if (selectedCheckpointIdx === idx) setSelectedCheckpointIdx(j);
              else if (selectedCheckpointIdx === j) setSelectedCheckpointIdx(idx);
            };
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                onClick: () => {
                  setSelectedCheckpointIdx(idx);
                  setRightPanel("checkpoint_config");
                },
                className: cn(
                  "group flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left cursor-pointer transition-colors",
                  isSelected ? "border-primary bg-primary-soft/30 text-primary" : "border-border hover:bg-muted/40"
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
                          moveCp(-1);
                        },
                        className: "text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed",
                        title: "Posunout nahoru",
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronUp, { className: "size-3.5" })
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        disabled: idx === segment.checkpoints.length - 1,
                        onClick: (e) => {
                          e.stopPropagation();
                          moveCp(1);
                        },
                        className: "text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed",
                        title: "Posunout dolů",
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "size-3.5" })
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium truncate", children: name }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground", children: [
                      matchCount,
                      " podmínek"
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "size-4 shrink-0 text-muted-foreground" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      onClick: (e) => {
                        e.stopPropagation();
                        removeCheckpoint(idx);
                      },
                      className: "shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground transition-opacity",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "size-4" })
                    }
                  )
                ]
              },
              cp.id
            );
          })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-t border-border my-4" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2", children: "Přidat milník" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative mb-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              value: libSearch,
              onChange: (e) => setLibSearch(e.target.value),
              placeholder: "Hledat v knihovně…",
              className: "w-full rounded-md border border-border bg-background pl-8 pr-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col gap-1", children: filteredTypes.map((t) => {
          const { used, count } = isCheckpointTypeUsed(t.id);
          const isEditing = rightPanel === "edit_milestone_type" && editingTypeId === t.id;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              role: "button",
              tabIndex: 0,
              onClick: () => {
                setEditingTypeId(t.id);
                setRightPanel("edit_milestone_type");
              },
              onKeyDown: (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setEditingTypeId(t.id);
                  setRightPanel("edit_milestone_type");
                }
              },
              className: cn(
                "group flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition-colors",
                isEditing ? "bg-primary-soft/30 ring-1 ring-primary/30" : "hover:bg-muted/40"
              ),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1 text-sm", children: t.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground", children: [
                  usage.get(t.id) ?? 0,
                  "×"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    onClick: (e) => {
                      e.stopPropagation();
                      addMilestone(t.id);
                    },
                    className: "shrink-0 text-primary hover:text-primary/80 text-xs font-medium",
                    children: "+ přidat"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    disabled: used,
                    onClick: (e) => {
                      e.stopPropagation();
                      checkpointTypesStore.remove(t.id);
                    },
                    title: used ? `Používá se v ${count} ${count === 1 ? "úseku" : "úsecích"}` : "Smazat typ milníku",
                    className: cn(
                      "shrink-0 opacity-0 group-hover:opacity-100 rounded p-0.5 transition-all",
                      used ? "text-muted-foreground/30 cursor-not-allowed" : "text-muted-foreground hover:text-red-500"
                    ),
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "size-3.5" })
                  }
                )
              ]
            },
            t.id
          );
        }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => setRightPanel("new_milestone_type"),
            className: "mt-3 flex w-full items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-primary hover:bg-primary-soft/20 transition-colors",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-4" }),
              " Vytvořit nový typ milníku"
            ]
          }
        )
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex w-[460px] shrink-0 flex-col overflow-y-auto", children: [
        rightPanel === "new_milestone_type" && /* @__PURE__ */ jsxRuntimeExports.jsx(
          NewMilestoneTypeForm,
          {
            onSave: (typeId) => {
              addMilestone(typeId);
            },
            onCancel: () => setRightPanel("checkpoint_config")
          }
        ),
        rightPanel === "edit_milestone_type" && editingTypeId && /* @__PURE__ */ jsxRuntimeExports.jsx(
          EditMilestoneTypeForm,
          {
            type: checkpointTypes.find((t) => t.id === editingTypeId),
            usageCount: usage.get(editingTypeId) ?? 0,
            onDone: () => {
              setRightPanel("checkpoint_config");
              setEditingTypeId(null);
            }
          },
          editingTypeId
        ),
        rightPanel === "checkpoint_config" && selectedCp !== null && selectedCheckpointIdx !== null && /* @__PURE__ */ jsxRuntimeExports.jsx(
          CheckpointConfig,
          {
            cp: selectedCp,
            index: selectedCheckpointIdx,
            label: typeName(selectedCp.checkpointTypeId),
            onChange: (updated) => updateCheckpoint(selectedCheckpointIdx, updated)
          },
          selectedCp.id
        ),
        rightPanel === "checkpoint_config" && selectedCp === null && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground text-center", children: "Vyber milník ze seznamu pro zobrazení konfigurace." })
      ] })
    ] })
  ] });
}
function NewMilestoneTypeForm({ onSave, onCancel }) {
  const [name, setName] = reactExports.useState("");
  const [description, setDescription] = reactExports.useState("");
  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const id = "ct_" + Date.now();
    checkpointTypesStore.upsert({ id, name: trimmed, description: description.trim() || void 0 });
    onSave(id);
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-5 space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-semibold mb-0.5", children: "Nový typ milníku" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "Po uložení se milník automaticky přidá do úseku." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs text-muted-foreground mb-1 block", children: "Název *" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          value: name,
          onChange: (e) => setName(e.target.value),
          placeholder: "Např. Celní odbavení výstupní",
          autoFocus: true,
          className: "w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs text-muted-foreground mb-1 block", children: "Popis (volitelný)" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "textarea",
        {
          value: description,
          onChange: (e) => setDescription(e.target.value),
          rows: 3,
          placeholder: "Krátký popis milníku…",
          className: "w-full resize-none rounded-md border border-border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: handleSave,
          disabled: !name.trim(),
          className: cn(
            "flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            name.trim() ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-muted-foreground cursor-not-allowed"
          ),
          children: "Uložit typ milníku"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: onCancel,
          className: "rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors",
          children: "Zrušit"
        }
      )
    ] })
  ] });
}
function EditMilestoneTypeForm({
  type,
  usageCount,
  onDone
}) {
  const [name, setName] = reactExports.useState(type.name);
  const [description, setDescription] = reactExports.useState(type.description ?? "");
  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    checkpointTypesStore.upsert({ ...type, name: trimmed, description: description.trim() || void 0 });
    onDone();
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-5 space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-semibold mb-0.5", children: "Upravit typ milníku" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: usageCount > 0 ? `Změna se projeví ve všech ${usageCount} úsecích, kde se používá.` : "Tento typ zatím není použit v žádném úseku." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs text-muted-foreground mb-1 block", children: "Název *" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          value: name,
          onChange: (e) => setName(e.target.value),
          autoFocus: true,
          className: "w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs text-muted-foreground mb-1 block", children: "Popis (volitelný)" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "textarea",
        {
          value: description,
          onChange: (e) => setDescription(e.target.value),
          rows: 3,
          placeholder: "Krátký popis milníku…",
          className: "w-full resize-none rounded-md border border-border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: handleSave,
          disabled: !name.trim(),
          className: cn(
            "flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            name.trim() ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-muted-foreground cursor-not-allowed"
          ),
          children: "Uložit změny"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: onDone,
          className: "rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors",
          children: "Zrušit"
        }
      )
    ] })
  ] });
}
const SYS_DATE_OPTIONS = [
  { id: "sys_created", label: "Vytvoření zásilky" },
  { id: "sys_pickup", label: "Vyzvednutí zásilky" },
  { id: "sys_order_created", label: "Vytvoření objednávky" },
  { id: "sys_add", label: "Avizované doručení zákazníkovi (ADD)" },
  { id: "sys_carrier_delivery", label: "Doručení hlášené dopravcem" }
];
function CheckpointConfig({
  cp,
  index,
  label,
  onChange
}) {
  const [matchRows, setMatchRows] = reactExports.useState(() => buildMatchRows(cp));
  function buildMatchRows(cp2) {
    const rows = [];
    for (const [field, value] of Object.entries(cp2.match)) {
      if (value === void 0 || value === null) continue;
      if (Array.isArray(value) && value.length === 0) continue;
      if (field === "event_time_of_day" && typeof value === "object") {
        const etod = value;
        const mode = etod.mode ?? "fixed";
        if (mode === "offset") {
          rows.push({
            id: "mr_" + field,
            field,
            operator: etod.offsetOp ?? "within",
            value: String(etod.offsetValue ?? ""),
            timeMode: "offset",
            offsetValue: etod.offsetValue,
            offsetUnit: etod.offsetUnit ?? "h",
            offsetDirection: etod.offsetDirection ?? "after",
            anchorKind: etod.anchorKind ?? "system_event",
            anchorId: etod.anchorId,
            anchorLabel: etod.anchorLabel
          });
        } else {
          rows.push({
            id: "mr_" + field,
            field,
            operator: "before",
            value: etod.from || "",
            timeMode: "fixed",
            tz: etod.tz ?? "local",
            dayAnchorKind: etod.dayAnchorKind ?? "today",
            dayAnchorId: etod.dayAnchorId,
            dayAnchorLabel: etod.dayAnchorLabel,
            dayOffset: etod.dayOffset ?? 0,
            dayMode: etod.dayMode ?? "calendar",
            dayDirection: etod.dayDirection ?? "after"
          });
        }
        continue;
      }
      rows.push({
        id: "mr_" + field,
        field,
        operator: "eq",
        value: Array.isArray(value) ? value.join(", ") : String(value)
      });
    }
    return rows;
  }
  function applyRows(rows) {
    setMatchRows(rows);
    const match = {};
    for (const row of rows) {
      if (row.field === "latest" || row.field === "zip_matches_destination") {
        match[row.field] = row.value === "true";
      } else if (row.field === "event_time_of_day") {
        if (row.timeMode === "offset") {
          match.event_time_of_day = {
            mode: "offset",
            offsetOp: row.operator,
            offsetValue: row.offsetValue,
            offsetUnit: row.offsetUnit,
            offsetDirection: row.offsetDirection,
            anchorKind: row.anchorKind,
            anchorId: row.anchorId,
            anchorLabel: row.anchorLabel
          };
        } else {
          match.event_time_of_day = {
            mode: "fixed",
            op: "before",
            from: row.value,
            tz: row.tz ?? "local",
            dayAnchorKind: row.dayAnchorKind ?? "today",
            dayAnchorId: row.dayAnchorId,
            dayAnchorLabel: row.dayAnchorLabel,
            dayOffset: row.dayOffset ?? 0,
            dayMode: row.dayMode ?? "calendar",
            dayDirection: row.dayDirection ?? "after"
          };
        }
      } else {
        match[row.field] = row.value.split(",").map((v) => v.trim()).filter(Boolean);
      }
    }
    onChange({ ...cp, match });
  }
  function addRow() {
    applyRows([...matchRows, { id: "mr_" + Date.now(), field: "status", operator: "eq", value: "" }]);
  }
  function removeRow(id) {
    applyRows(matchRows.filter((r) => r.id !== id));
  }
  function updateRow(id, patch) {
    applyRows(matchRows.map((r) => r.id === id ? { ...r, ...patch } : r));
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-5 space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground", children: [
        "Milník ",
        index + 1
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-semibold mt-0.5", children: label })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2", children: "Popis (volitelný)" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Textarea,
        {
          value: cp.note ?? "",
          onChange: (e) => onChange({ ...cp, note: e.target.value || void 0 }),
          placeholder: "Krátká poznámka k nastavení tohoto milníku…",
          rows: 2,
          className: "resize-none text-sm"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-md bg-primary-soft/40 border border-primary/20 px-3 py-1.5 mb-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] font-bold uppercase tracking-wider text-primary", children: "Co musí být na záznamu" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] text-muted-foreground", children: "Match podmínky — jak poznáme, že milník nastal" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col gap-2", children: matchRows.map((row) => {
        const isTime = row.field === "event_time_of_day";
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border bg-background p-2.5 space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] uppercase tracking-wider text-muted-foreground shrink-0", children: "Pole" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "select",
              {
                value: row.field,
                onChange: (e) => {
                  const newField = e.target.value;
                  const switchingToTime = newField === "event_time_of_day";
                  const patch = {
                    field: newField,
                    operator: switchingToTime ? "before" : "eq",
                    value: ""
                  };
                  if (switchingToTime) {
                    patch.timeMode = "fixed";
                    patch.tz = "local";
                  } else {
                    patch.timeMode = void 0;
                  }
                  updateRow(row.id, patch);
                },
                className: "flex-1 rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none",
                children: MATCH_FIELDS.map((f) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: f.id, children: f.label }, f.id))
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => removeRow(row.id), className: "text-muted-foreground hover:text-foreground shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "size-3.5" }) })
          ] }),
          isTime ? /* @__PURE__ */ jsxRuntimeExports.jsx(MatchTimeRow, { row, onChange: (p) => updateRow(row.id, p) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "select",
              {
                value: row.operator,
                onChange: (e) => updateRow(row.id, { operator: e.target.value }),
                className: "rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none",
                children: OPERATORS.map((o) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: o.id, children: o.label }, o.id))
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                value: row.value,
                onChange: (e) => updateRow(row.id, { value: e.target.value }),
                placeholder: "hodnota",
                className: "flex-1 rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none"
              }
            )
          ] })
        ] }, row.id);
      }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: addRow,
          className: "mt-2 flex items-center gap-1 text-xs text-primary hover:underline",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-3" }),
            " přidat podmínku"
          ]
        }
      )
    ] })
  ] });
}
function MatchTimeRow({
  row,
  onChange
}) {
  const mode = row.timeMode ?? "fixed";
  const checkpointTypes = useCheckpointTypes();
  const [dayOpen, setDayOpen] = reactExports.useState(false);
  const [eventOpen, setEventOpen] = reactExports.useState(false);
  const dayRef = reactExports.useRef(null);
  const eventRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    function handleClick(e) {
      if (dayRef.current && !dayRef.current.contains(e.target)) setDayOpen(false);
      if (eventRef.current && !eventRef.current.contains(e.target)) setEventOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);
  const dayKind = row.dayAnchorKind ?? "today";
  const dayOffset = row.dayOffset ?? 0;
  const dayLabel = dayKind === "today" ? "Dnešní den" : row.dayAnchorLabel || "Vyber den…";
  const preview = (() => {
    if (mode === "fixed") {
      if (!row.value) return "";
      const tzLabel = (row.tz ?? "local") === "local" ? "místního času" : row.tz ?? "";
      let dayStr;
      if (dayKind === "today") {
        if (dayOffset === 0) dayStr = "dnes";
        else {
          const dir2 = row.dayDirection === "before" ? "před" : "po";
          const word = dayOffset === 1 ? "den" : dayOffset < 5 ? "dny" : "dní";
          dayStr = `${dayOffset} ${word} ${dir2} dnešku`;
        }
      } else if (row.dayAnchorLabel) {
        if (dayOffset === 0) dayStr = `v den události „${row.dayAnchorLabel}"`;
        else {
          const dir2 = row.dayDirection === "before" ? "před" : "po";
          const modeWord = row.dayMode === "business" ? "prac. " : "";
          const word = dayOffset === 1 ? "den" : dayOffset < 5 ? "dny" : "dní";
          dayStr = `${dayOffset} ${modeWord}${word} ${dir2} události „${row.dayAnchorLabel}"`;
        }
      } else dayStr = "—";
      return `nejpozději ${dayStr} v ${row.value} ${tzLabel}`;
    }
    if (!row.anchorLabel || row.offsetValue == null) return "";
    const dir = row.offsetDirection === "before" ? "před" : "po";
    const unit = row.offsetUnit === "h" ? "hod" : row.offsetUnit === "min" ? "min" : row.offsetUnit === "bd" ? "prac. dní" : "dní";
    return `nejpozději ${row.offsetValue} ${unit} ${dir} události „${row.anchorLabel}"`;
  })();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2.5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] font-medium text-foreground", children: "Musí být nejpozději:" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1 text-xs", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-1.5 cursor-pointer", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "radio",
            checked: mode === "fixed",
            onChange: () => onChange({
              timeMode: "fixed",
              operator: "before",
              value: row.value || "",
              tz: row.tz ?? "local",
              dayAnchorKind: row.dayAnchorKind ?? "today",
              dayAnchorId: row.dayAnchorId,
              dayAnchorLabel: row.dayAnchorLabel,
              dayOffset: row.dayOffset ?? 0,
              dayMode: row.dayMode ?? "calendar",
              dayDirection: row.dayDirection ?? "after"
            }),
            className: "accent-primary"
          }
        ),
        "v konkrétní den a čas"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-1.5 cursor-pointer", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "radio",
            checked: mode === "offset",
            onChange: () => onChange({
              timeMode: "offset",
              operator: "within",
              value: "2",
              offsetValue: 2,
              offsetUnit: "h",
              offsetDirection: "after",
              anchorKind: row.anchorKind ?? "system_event",
              anchorId: row.anchorId ?? "sys_pickup",
              anchorLabel: row.anchorLabel ?? "Vyzvednutí zásilky"
            }),
            className: "accent-primary"
          }
        ),
        "s odstupem od události"
      ] })
    ] }),
    mode === "fixed" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2.5 rounded-md border border-border bg-muted/20 p-2.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "size-3" }),
          " Den"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", ref: dayRef, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              onClick: () => setDayOpen((v) => !v),
              className: "flex w-full items-center justify-between rounded border border-border bg-background px-2 py-1 text-xs hover:bg-muted/30",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: dayLabel }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "size-3" })
              ]
            }
          ),
          dayOpen && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute left-0 top-full z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg overflow-hidden max-h-64 overflow-y-auto", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                onClick: () => {
                  onChange({ dayAnchorKind: "today", dayAnchorId: void 0, dayAnchorLabel: void 0 });
                  setDayOpen(false);
                },
                className: "flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted/50 text-left",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "size-3 text-muted-foreground" }),
                  " Dnešní den"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30 border-y border-border", children: "Milníky této trasy" }),
            checkpointTypes.map((ct) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                onClick: () => {
                  onChange({ dayAnchorKind: "checkpoint", dayAnchorId: ct.id, dayAnchorLabel: ct.name });
                  setDayOpen(false);
                },
                className: "flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted/50 text-left",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "size-3 text-muted-foreground" }),
                  " ",
                  ct.name
                ]
              },
              ct.id
            )),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30 border-y border-border", children: "Klíčová data zásilky" }),
            SYS_DATE_OPTIONS.map((opt) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                onClick: () => {
                  onChange({ dayAnchorKind: "system_event", dayAnchorId: opt.id, dayAnchorLabel: opt.label });
                  setDayOpen(false);
                },
                className: "flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted/50 text-left",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "size-3 text-muted-foreground" }),
                  " ",
                  opt.label
                ]
              },
              opt.id
            ))
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-1.5 mt-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-muted-foreground", children: "Posun:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "number",
              min: 0,
              value: dayOffset,
              onChange: (e) => onChange({ dayOffset: Math.max(0, Number(e.target.value) || 0) }),
              className: "w-12 rounded border border-border bg-background px-1.5 py-0.5 text-xs text-center focus:outline-none"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-muted-foreground", children: "dní" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "select",
            {
              value: row.dayMode ?? "calendar",
              onChange: (e) => onChange({ dayMode: e.target.value }),
              className: "rounded border border-border bg-background px-1.5 py-0.5 text-xs focus:outline-none",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "calendar", children: "kalendářní" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "business", children: "pracovní" })
              ]
            }
          ),
          dayOffset > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "select",
            {
              value: row.dayDirection ?? "after",
              onChange: (e) => onChange({ dayDirection: e.target.value }),
              className: "rounded border border-border bg-background px-1.5 py-0.5 text-xs focus:outline-none",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "after", children: "po" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "before", children: "před" })
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "size-3" }),
          " Čas"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "time",
              value: row.value,
              onChange: (e) => onChange({ value: e.target.value, operator: "before" }),
              className: "rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-muted-foreground ml-1", children: "pásmo" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TimezoneSelect, { value: row.tz ?? "local", onChange: (v) => onChange({ tz: v }) })
        ] })
      ] })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 rounded-md border border-border bg-muted/20 p-2.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "number",
            min: 0,
            value: row.offsetValue ?? "",
            onChange: (e) => onChange({ offsetValue: e.target.value ? Number(e.target.value) : void 0, value: e.target.value }),
            className: "w-14 rounded border border-border bg-background px-2 py-1 text-xs text-center focus:outline-none"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "select",
          {
            value: row.offsetUnit ?? "h",
            onChange: (e) => onChange({ offsetUnit: e.target.value }),
            className: "rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none",
            children: TIME_UNITS_OFFSET.map((u) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: u.id, children: u.label }, u.id))
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "select",
          {
            value: row.offsetDirection ?? "after",
            onChange: (e) => onChange({ offsetDirection: e.target.value }),
            className: "rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "after", children: "po" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "before", children: "před" })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-muted-foreground", children: "události:" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", ref: eventRef, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            onClick: () => setEventOpen((v) => !v),
            className: "flex w-full items-center justify-between rounded border border-border bg-background px-2 py-1 text-xs hover:bg-muted/30",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: row.anchorLabel || "Vyber událost…" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "size-3" })
            ]
          }
        ),
        eventOpen && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute left-0 top-full z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg overflow-hidden max-h-64 overflow-y-auto", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30 border-b border-border", children: "Milníky této trasy" }),
          checkpointTypes.map((ct) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              onClick: () => {
                onChange({ anchorKind: "checkpoint", anchorId: ct.id, anchorLabel: ct.name });
                setEventOpen(false);
              },
              className: "flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted/50 text-left",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "size-3 text-muted-foreground" }),
                " ",
                ct.name
              ]
            },
            ct.id
          )),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30 border-t border-b border-border", children: "Klíčová data zásilky" }),
          SYS_DATE_OPTIONS.map((opt) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              onClick: () => {
                onChange({ anchorKind: "system_event", anchorId: opt.id, anchorLabel: opt.label });
                setEventOpen(false);
              },
              className: "flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted/50 text-left",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "size-3 text-muted-foreground" }),
                " ",
                opt.label
              ]
            },
            opt.id
          ))
        ] })
      ] })
    ] }),
    preview && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-1.5 rounded-md bg-primary/5 border border-primary/20 px-2.5 py-1.5 text-[11px] text-primary leading-snug", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "size-3 shrink-0 mt-0.5" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: preview }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] text-muted-foreground mt-0.5", children: mode === "fixed" ? "Dřívější dny se započítávají automaticky." : "Může spadnout i na jiný den — to je v pořádku." })
      ] })
    ] })
  ] });
}
function TimezoneSelect({ value, onChange }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "select",
    {
      value,
      onChange: (e) => onChange(e.target.value),
      className: "rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none",
      title: value === "local" ? "Odvozeno z cílové země zásilky" : value,
      children: TIMEZONE_OPTIONS.map((tz) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: tz.value, children: tz.label }, tz.value))
    }
  );
}
function UsekEditorRoute() {
  const {
    id
  } = Route$6.useParams();
  const {
    from
  } = Route$6.useSearch();
  return /* @__PURE__ */ jsxRuntimeExports.jsx(SegmentEditorPage, { segmentId: id, fromRouteId: from });
}
export {
  UsekEditorRoute as component
};
