import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { g as useRules, A as AppHeader, c as cn, e as rulesStore } from "./store-CVlU6jxP.mjs";
import { D as DataMenu } from "./DataMenu-DXyXTpj0.mjs";
import { A as AreaBadge } from "./AreaBadge-Ebk6lwha.mjs";
import { t as triggerLabel, p as priorityLabel, i as isPriorityHigh } from "./ruleDisplay-CfK4CpDU.mjs";
import { R as Root2, L as List, T as Trigger, C as Content } from "../_libs/radix-ui__react-tabs.mjs";
import { S as Search, k as ChevronUp, C as ChevronDown, T as Trash2, X, l as Sparkles, d as CirclePlay, H as History, m as Pencil } from "../_libs/lucide-react.mjs";
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
const Tabs = Root2;
const TabsList = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  List,
  {
    ref,
    className: cn(
      "inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
      className
    ),
    ...props
  }
));
TabsList.displayName = List.displayName;
const TabsTrigger = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Trigger,
  {
    ref,
    className: cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow",
      className
    ),
    ...props
  }
));
TabsTrigger.displayName = Trigger.displayName;
const TabsContent = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Content,
  {
    ref,
    className: cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    ),
    ...props
  }
));
TabsContent.displayName = Content.displayName;
function SidebarItem({
  label,
  count,
  active,
  onClick
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "button",
    {
      onClick,
      className: cn(
        "flex items-center justify-between rounded-lg px-2.5 py-2 text-sm w-full text-left",
        active ? "bg-primary-soft text-primary font-medium" : "text-foreground hover:bg-muted/60"
      ),
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: label }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "span",
          {
            className: cn(
              "rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
              active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
            ),
            children: count
          }
        )
      ]
    }
  );
}
function RulesList() {
  const rules = useRules();
  const [selection, setSelection] = reactExports.useState({ kind: "all" });
  const [selectedRule, setSelectedRule] = reactExports.useState(null);
  const allCount = rules.length;
  const activeCount = rules.filter((r) => r.active).length;
  const visible = (() => {
    switch (selection.kind) {
      case "all":
        return rules;
      case "active":
        return rules.filter((r) => r.active);
      case "archived":
        return [];
    }
  })();
  const { title, subtitle } = (() => {
    if (selection.kind === "active") return { title: "Pouze aktivní", subtitle: "Pravidla aktuálně vyhodnocovaná runtime evaluátorem." };
    if (selection.kind === "archived") return { title: "Archiv", subtitle: "Archivovaná pravidla. Momentálně žádné záznamy." };
    return { title: "Všechna pravidla", subtitle: "Kompletní katalog pravidel napříč oblastmi." };
  })();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-screen w-screen flex-col bg-background text-foreground", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      AppHeader,
      {
        current: "rules",
        extras: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Link,
            {
              to: "/situace",
              className: "rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors",
              children: "Situace a závažnosti →"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Link,
            {
              to: "/rules/new",
              className: "bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-primary/90",
              children: "+ Nové pravidlo"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DataMenu, {})
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-h-0 flex-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "w-[260px] shrink-0 border-r border-border bg-surface p-2 overflow-y-auto", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1 mt-2", children: "Pravidla" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          SidebarItem,
          {
            label: "Všechna pravidla",
            count: allCount,
            active: selection.kind === "all",
            onClick: () => setSelection({ kind: "all" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          SidebarItem,
          {
            label: "Pouze aktivní",
            count: activeCount,
            active: selection.kind === "active",
            onClick: () => setSelection({ kind: "active" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          SidebarItem,
          {
            label: "Archiv",
            count: 0,
            active: selection.kind === "archived",
            onClick: () => setSelection({ kind: "archived" })
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: cn("flex-1 min-w-0 p-6 overflow-auto", selectedRule && "mr-[460px]"), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-lg font-semibold", children: title }),
          subtitle && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-0.5", children: subtitle })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground mb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { size: 15, className: "shrink-0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Hledat pravidlo, kód…" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col gap-2", children: visible.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground py-8 text-center", children: "Žádná pravidla" }) : visible.map((rule, vIdx) => {
          const canReorder = selection.kind === "all";
          const moveRule = (dir) => {
            const otherVIdx = vIdx + dir;
            if (otherVIdx < 0 || otherVIdx >= visible.length) return;
            const otherId = visible[otherVIdx].id;
            const i = rules.findIndex((r) => r.id === rule.id);
            const j = rules.findIndex((r) => r.id === otherId);
            if (i < 0 || j < 0) return;
            const next = [...rules];
            [next[i], next[j]] = [next[j], next[i]];
            rulesStore.replaceAll(next);
          };
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              onClick: () => setSelectedRule(selectedRule?.id === rule.id ? null : rule),
              className: cn(
                "group flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors hover:bg-muted/40",
                !rule.active && "opacity-60",
                selectedRule?.id === rule.id ? "border-primary bg-primary-soft/20" : "border-border"
              ),
              children: [
                canReorder && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col shrink-0", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      disabled: vIdx === 0,
                      onClick: (e) => {
                        e.stopPropagation();
                        moveRule(-1);
                      },
                      className: "text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed",
                      title: "Posunout nahoru",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronUp, { className: "size-3.5" })
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      disabled: vIdx === visible.length - 1,
                      onClick: (e) => {
                        e.stopPropagation();
                        moveRule(1);
                      },
                      className: "text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed",
                      title: "Posunout dolů",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "size-3.5" })
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-xs text-muted-foreground w-9 shrink-0", children: rule.code }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium truncate", children: rule.name }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-1.5 mt-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(AreaBadge, { area: rule.area }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground", children: triggerLabel(rule.trigger.kind) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "span",
                      {
                        className: cn(
                          "rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold",
                          isPriorityHigh(rule.priority) ? "text-destructive border-destructive/30" : "text-muted-foreground"
                        ),
                        children: priorityLabel(rule.priority)
                      }
                    )
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 shrink-0", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      onClick: (e) => {
                        e.stopPropagation();
                        rulesStore.remove(rule.id);
                        if (selectedRule?.id === rule.id) setSelectedRule(null);
                      },
                      className: "opacity-0 group-hover:opacity-100 rounded p-1 text-muted-foreground hover:text-red-500 transition-all",
                      title: "Smazat pravidlo",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "size-3.5" })
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "span",
                    {
                      className: cn(
                        "size-2 rounded-full",
                        rule.active ? "bg-emerald-500" : "bg-border"
                      )
                    }
                  )
                ] })
              ]
            },
            rule.id
          );
        }) })
      ] })
    ] }),
    selectedRule && /* @__PURE__ */ jsxRuntimeExports.jsx(
      RuleDetailSidebar,
      {
        rule: selectedRule,
        onClose: () => setSelectedRule(null)
      }
    )
  ] });
}
const MOCK_SHIPMENTS_TEST = [
  "BYT-2026-1142 — FedEx Express → DE",
  "BYT-2026-1117 — UPS World → USA",
  "BYT-2026-1099 — FedEx Eco → CH"
];
function RuleDetailSidebar({ rule, onClose }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "fixed right-0 top-14 bottom-0 flex w-[460px] flex-col border-l border-border bg-surface shadow-xl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3 px-5 pt-5 pb-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground", children: rule.code }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mt-1 text-base font-semibold leading-snug", children: rule.name }),
        rule.description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground whitespace-pre-wrap", children: rule.description })
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
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { defaultValue: "summary", className: "flex min-h-0 flex-1 flex-col", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "mx-5 grid w-auto grid-cols-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "summary", className: "text-xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "mr-1 size-3.5" }),
          "Shrnutí"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "test", className: "text-xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CirclePlay, { className: "mr-1 size-3.5" }),
          "Test"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "history", className: "text-xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(History, { className: "mr-1 size-3.5" }),
          "Historie"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-0 flex-1 overflow-y-auto px-5 py-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "summary", className: "mt-0 space-y-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(RuleSummaryTab, { rule }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "test", className: "mt-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(RuleTestTab, { rule }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "history", className: "mt-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground", children: "Žádné záznamy spuštění." }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-border bg-surface p-4 space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Link,
        {
          to: "/rules/$ruleId/edit",
          params: { ruleId: rule.id },
          className: "flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "size-4" }),
            " Upravit pravidlo"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => {
            rulesStore.remove(rule.id);
            onClose();
          },
          className: "flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:border-red-300 hover:text-red-500 transition-colors",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "size-4" }),
            " Smazat pravidlo"
          ]
        }
      )
    ] })
  ] });
}
function SummarySection({ label, children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground", children: label }),
    children
  ] });
}
function RuleSummaryTab({ rule }) {
  const actionTypeLabel = {
    create_vkr: "Vytvořit VkŘ",
    send_email: "Poslat e-mail",
    set_field: "Nastavit pole",
    change_phase: "Změnit fázi",
    add_note: "Přidat poznámku",
    update_vkr: "Aktualizovat VkŘ",
    request_field_from_operator: "Vyžádat pole od operátora"
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(SummarySection, { label: "Oblast", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AreaBadge, { area: rule.area }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(SummarySection, { label: "Spouštěč", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-border bg-background px-3 py-2 text-sm", children: rule.trigger.label }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(SummarySection, { label: "Akce", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: rule.actions.map((a) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border bg-background p-2.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium", children: actionTypeLabel[a.type] ?? a.type }),
        a.runWhenRouteCondition && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn(
          "text-[10px] font-semibold rounded-full px-2 py-0.5",
          a.runWhenRouteCondition === "fulfilled" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        ), children: a.runWhenRouteCondition === "fulfilled" ? "splněno" : "nesplněno" })
      ] }),
      a.title && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5 text-xs text-muted-foreground", children: a.title })
    ] }, a.id)) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(SummarySection, { label: "Priorita", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn(
      "inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold",
      isPriorityHigh(rule.priority) ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground"
    ), children: priorityLabel(rule.priority) }) })
  ] });
}
function RuleTestTab({ rule }) {
  const [selected, setSelected] = reactExports.useState(MOCK_SHIPMENTS_TEST[0]);
  const [result, setResult] = reactExports.useState(null);
  const run = () => {
    const seed = (selected + rule.id).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    setResult({ met: seed % 3 !== 0 });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "Otestuj pravidlo na konkrétní zásilce (dry run — nic se neuloží)." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "select",
      {
        value: selected,
        onChange: (e) => setSelected(e.target.value),
        className: "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm",
        children: MOCK_SHIPMENTS_TEST.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: s, children: s }, s))
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        onClick: run,
        className: "w-full rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90",
        children: "Spustit dry run"
      }
    ),
    result && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn(
      "rounded-lg border p-3 text-sm font-semibold",
      result.met ? "border-green-300 bg-green-50 text-green-700" : "border-red-300 bg-red-50 text-red-700"
    ), children: result.met ? "✓ Podmínky splněny — akce by byla provedena" : "✗ Podmínky nesplněny" })
  ] });
}
const SplitComponent = () => /* @__PURE__ */ jsxRuntimeExports.jsx(RulesList, {});
export {
  SplitComponent as component
};
