import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { d as useNavigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { h as useSituations, g as useRules, A as AppHeader, c as cn, j as situationsStore } from "./store-CVlU6jxP.mjs";
import { p as priorityLabel, t as triggerLabel, i as isPriorityHigh } from "./ruleDisplay-CfK4CpDU.mjs";
import { P as Plus, S as Search, C as ChevronDown, a as ChevronRight, T as Trash2 } from "../_libs/lucide-react.mjs";
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
function SituationsListPage() {
  const situations = useSituations();
  const rules = useRules();
  const navigate = useNavigate();
  const [query, setQuery] = reactExports.useState("");
  const [expanded, setExpanded] = reactExports.useState(/* @__PURE__ */ new Set());
  function createSituation() {
    const id = "sit_" + Date.now();
    situationsStore.upsert({
      id,
      code: "SIT-" + Math.floor(Math.random() * 9e3 + 1e3),
      name: "Nová situace",
      area: "tracking_records",
      severities: []
    });
    navigate({ to: "/situace/$id", params: { id } });
  }
  function totalUsage(situationId) {
    return rules.filter((r) => r.situationId === situationId).length;
  }
  function rulesForSeverity(severityId) {
    return rules.filter((r) => r.severityId === severityId);
  }
  function toggleExpanded(id) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function matchesQuery(situation) {
    const q = query.trim().toLocaleLowerCase("cs-CZ");
    if (!q) return true;
    if (situation.name.toLocaleLowerCase("cs-CZ").includes(q)) return true;
    return situation.severities.some((s) => s.name.toLocaleLowerCase("cs-CZ").includes(q));
  }
  const visible = situations.filter(matchesQuery);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-screen w-screen flex-col bg-background text-foreground", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(AppHeader, { current: "situace" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-y-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-3xl p-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-lg font-semibold", children: "Situace a závažnosti" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: createSituation,
            className: "flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-3.5" }),
              " Nová situace"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mb-4", children: "Šablony pro věci k řešení — každá situace má stupně závažnosti s výchozím názvem, popisem, prioritou a akcemi." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground mb-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { size: 15, className: "shrink-0" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            value: query,
            onChange: (e) => setQuery(e.target.value),
            placeholder: "Hledat situaci, závažnost…",
            className: "flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col gap-2", children: visible.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground py-8 text-center", children: situations.length === 0 ? "Zatím žádné situace." : "Žádná situace neodpovídá hledání." }) : visible.map((s) => {
        const usage = totalUsage(s.id);
        const isOpen = expanded.has(s.id);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border overflow-hidden", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              onClick: () => toggleExpanded(s.id),
              className: "flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors cursor-pointer",
              children: [
                isOpen ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "size-3.5 shrink-0 text-muted-foreground" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "size-3.5 shrink-0 text-muted-foreground" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium", children: s.name }),
                  s.description && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground mt-0.5", children: s.description })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "shrink-0 text-xs text-muted-foreground", children: [
                  s.severities.length,
                  " ",
                  s.severities.length === 1 ? "závažnost" : "závažnosti"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "shrink-0 text-xs text-muted-foreground", children: [
                  usage,
                  " ",
                  usage === 1 ? "pravidlo" : usage < 5 ? "pravidla" : "pravidel"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Link,
                  {
                    to: "/situace/$id",
                    params: { id: s.id },
                    onClick: (e) => e.stopPropagation(),
                    className: "shrink-0 text-xs text-primary hover:underline",
                    children: "upravit"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    disabled: usage > 0,
                    onClick: (e) => {
                      e.stopPropagation();
                      situationsStore.remove(s.id);
                    },
                    title: usage > 0 ? `Používá se v ${usage} pravidlech` : "Smazat situaci",
                    className: cn(
                      "shrink-0 rounded p-1.5 text-muted-foreground transition-colors",
                      usage > 0 ? "opacity-30 cursor-not-allowed" : "hover:text-red-500"
                    ),
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "size-3.5" })
                  }
                )
              ]
            }
          ),
          isOpen && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-t border-border bg-muted/10 px-4 py-3 space-y-3", children: s.severities.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground italic", children: "Zatím žádné závažnosti." }) : s.severities.map((sev) => {
            const sevRules = rulesForSeverity(sev.id);
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-l-2 border-border pl-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 py-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium", children: sev.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground", children: priorityLabel(sev.priority) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-auto text-[11px] text-muted-foreground", children: [
                  sevRules.length,
                  " ",
                  sevRules.length === 1 ? "pravidlo" : sevRules.length < 5 ? "pravidla" : "pravidel"
                ] })
              ] }),
              sevRules.map((rule) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Link,
                {
                  to: "/rules/$ruleId/edit",
                  params: { ruleId: rule.id },
                  className: "mt-1 flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2 hover:bg-muted/40 transition-colors",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-[11px] text-muted-foreground w-9 shrink-0", children: rule.code }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-medium truncate", children: rule.name }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1.5 mt-1", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground", children: triggerLabel(rule.trigger.kind) }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "span",
                          {
                            className: cn(
                              "rounded-full border border-border px-1.5 py-0.5 text-[10px] font-semibold",
                              isPriorityHigh(rule.priority) ? "text-destructive border-destructive/30" : "text-muted-foreground"
                            ),
                            children: priorityLabel(rule.priority)
                          }
                        )
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("size-2 rounded-full shrink-0", rule.active ? "bg-emerald-500" : "bg-border") })
                  ]
                },
                rule.id
              ))
            ] }, sev.id);
          }) })
        ] }, s.id);
      }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/", className: "mt-6 inline-block text-sm text-muted-foreground hover:text-foreground", children: "← Zpět na pravidla" })
    ] }) })
  ] });
}
const SplitComponent = SituationsListPage;
export {
  SplitComponent as component
};
