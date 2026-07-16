import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { A as AppHeader, c as cn, b as useCheckpointTypes } from "./store-CVlU6jxP.mjs";
import { A as AreaBadge } from "./AreaBadge-Ebk6lwha.mjs";
import { d as Route$1 } from "./router-D8haT4Dw.mjs";
import "../_libs/sonner.mjs";
import { m as Pencil, o as Clock, F as Funnel, Z as Zap, C as ChevronDown, I as Info, f as CircleCheck, e as TriangleAlert, P as Plus } from "../_libs/lucide-react.mjs";
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
function SectionCard({
  icon: Icon,
  title,
  subtitle,
  aside,
  children
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-background p-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 pb-2.5 mb-3 border-b border-border", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "size-[18px] text-muted-foreground" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium", children: title }),
      subtitle && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: subtitle }),
      aside && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ml-auto", children: aside })
    ] }),
    children
  ] });
}
function PlainToken({
  children,
  chevron
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-0.5 font-medium text-foreground", children: [
    children,
    chevron && /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { size: 14, className: "text-muted-foreground" })
  ] });
}
const ACTION_LABELS = {
  create_vkr: "Vytvořit VkŘ",
  send_email: "Odeslat e-mail",
  set_field: "Změnit hodnotu pole",
  change_phase: "Změnit fázi zásilky",
  update_vkr: "Upravit existující VkŘ",
  add_note: "Přidat poznámku",
  request_field_from_operator: "Požádat operátora o vyplnění pole"
};
function ActionRow({ type }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(PlainToken, { chevron: true, children: ACTION_LABELS[type] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "s názvem" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(PlainToken, { children: [
      "„… · ",
      "{{shipment_number}}",
      '"'
    ] })
  ] });
}
function AddActionAffordance() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 text-sm text-primary cursor-pointer mt-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 14 }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "přidat akci" })
  ] });
}
function ActionsEditor({ area }) {
  if (area === "route_compliance") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-md border border-border p-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { size: 15, className: "text-emerald-600" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium", children: "Když proběhl správně" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(AddActionAffordance, {})
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-md border border-border p-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { size: 15, className: "text-destructive" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium", children: "Když neproběhl správně" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(ActionRow, { type: "create_vkr" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(AddActionAffordance, {})
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(ActionRow, { type: "create_vkr" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AddActionAffordance, {})
  ] });
}
function TrackingAggregateEditor() {
  const [mode, setMode] = reactExports.useState("same_repeats");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "inline-flex rounded-full border border-border p-0.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          onClick: () => setMode("same_repeats"),
          className: cn(
            "rounded-full px-3 py-1 text-xs transition-colors",
            mode === "same_repeats" ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:text-foreground"
          ),
          children: "stejná hodnota se opakuje"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          onClick: () => setMode("specific"),
          className: cn(
            "rounded-full px-3 py-1 text-xs transition-colors",
            mode === "specific" ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:text-foreground"
          ),
          children: "konkrétní = …"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-base leading-[2.2] text-foreground", children: [
      "Když se stejná hodnota pole",
      " ",
      /* @__PURE__ */ jsxRuntimeExports.jsx(PlainToken, { chevron: true, children: "Město záznamu" }),
      mode === "specific" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        " ",
        "=",
        " ",
        /* @__PURE__ */ jsxRuntimeExports.jsx(PlainToken, { chevron: true, children: "hodnota" })
      ] }),
      " ",
      "objeví na více než ",
      /* @__PURE__ */ jsxRuntimeExports.jsx(PlainToken, { children: "3" }),
      " ",
      /* @__PURE__ */ jsxRuntimeExports.jsx(PlainToken, { chevron: true, children: "po sobě jdoucích" }),
      " záznamech."
    ] })
  ] });
}
function RouteComplianceEditor() {
  const checkpointTypes = useCheckpointTypes();
  const defaultCt = checkpointTypes.find((ct) => ct.name === "Příchod na clení") ?? checkpointTypes[0];
  const [selectedId, setSelectedId] = reactExports.useState(defaultCt?.id ?? "");
  checkpointTypes.find((ct) => ct.id === selectedId)?.name ?? defaultCt?.name ?? "milník";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-base leading-[2.2] text-foreground", children: [
      "Na trase zásilky sleduj milník",
      " ",
      /* @__PURE__ */ jsxRuntimeExports.jsx(PlainToken, { chevron: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "select",
        {
          value: selectedId,
          onChange: (e) => setSelectedId(e.target.value),
          className: "bg-transparent outline-none cursor-pointer font-medium text-foreground",
          "aria-label": "Vybrat milník",
          children: checkpointTypes.map((ct) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: ct.id, children: ct.name }, ct.id))
        }
      ) }),
      "."
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "flex items-center gap-1.5 text-xs text-muted-foreground mt-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { size: 14, className: "shrink-0" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: 'Co znamená „proběhnout správně", je definováno na trase u tohoto milníku.' })
    ] })
  ] });
}
function RuleEditor({ area, name }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-screen w-screen flex-col bg-background text-foreground", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(AppHeader, { current: "rules" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-3xl w-full p-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-lg font-semibold truncate", children: name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { size: 14, className: "text-muted-foreground shrink-0" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 shrink-0 ml-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(AreaBadge, { area }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "· krok 2 ze 2" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 text-xs text-muted-foreground mb-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Priorita Low" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative w-[30px] h-4 rounded-full bg-primary flex items-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute right-0.5 size-3 rounded-full bg-white shadow-sm" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Aktivní" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SectionCard, { icon: Clock, title: "Spouštěč", subtitle: "kdy se vyhodnotí", children: /* @__PURE__ */ jsxRuntimeExports.jsx(PlainToken, { chevron: true, children: "při každé nové tracking události" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SectionCard, { icon: Funnel, title: "Podmínka", children: area === "tracking_records" ? /* @__PURE__ */ jsxRuntimeExports.jsx(TrackingAggregateEditor, {}) : area === "route_compliance" ? /* @__PURE__ */ jsxRuntimeExports.jsx(RouteComplianceEditor, {}) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-muted-foreground", children: "Editor této oblasti se připravuje." }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SectionCard, { icon: Zap, title: "Akce", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ActionsEditor, { area }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mt-5 pt-4 border-t border-border", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Link,
          {
            to: "/rules/new",
            search: { area },
            className: "text-sm text-muted-foreground hover:text-foreground transition-colors",
            children: "← Zpět na oblast"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Link,
            {
              to: "/test",
              className: "flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors",
              children: "Otestovat"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity", children: "Uložit pravidlo" })
        ] })
      ] })
    ] }) })
  ] });
}
function RulesNewEditPage() {
  const search = Route$1.useSearch();
  return /* @__PURE__ */ jsxRuntimeExports.jsx(RuleEditor, { area: search.area, name: search.name || "Nové pravidlo" });
}
export {
  RulesNewEditPage as component
};
