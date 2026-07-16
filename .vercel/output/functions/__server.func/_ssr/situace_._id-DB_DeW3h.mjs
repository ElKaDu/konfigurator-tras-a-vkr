import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { d as useNavigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { h as useSituations, A as AppHeader, l as severityUsageCount, j as situationsStore, m as useActionTags, c as cn } from "./store-CVlU6jxP.mjs";
import { A as ActionTagPicker } from "./ActionTagPicker-ClAME-lt.mjs";
import { b as Route$4 } from "./router-D8haT4Dw.mjs";
import "../_libs/sonner.mjs";
import { T as Trash2 } from "../_libs/lucide-react.mjs";
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
import "../_libs/radix-ui__react-popover.mjs";
import "../_libs/radix-ui__primitive.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/@radix-ui/react-dismissable-layer+[...].mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/@radix-ui/react-use-callback-ref+[...].mjs";
import "../_libs/@radix-ui/react-use-escape-keydown+[...].mjs";
import "../_libs/radix-ui__react-focus-guards.mjs";
import "../_libs/radix-ui__react-focus-scope.mjs";
import "../_libs/radix-ui__react-id.mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/radix-ui__react-popper.mjs";
import "../_libs/floating-ui__react-dom.mjs";
import "../_libs/floating-ui__dom.mjs";
import "../_libs/floating-ui__core.mjs";
import "../_libs/floating-ui__utils.mjs";
import "../_libs/radix-ui__react-arrow.mjs";
import "../_libs/radix-ui__react-use-size.mjs";
import "../_libs/radix-ui__react-portal.mjs";
import "../_libs/radix-ui__react-presence.mjs";
import "../_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "../_libs/aria-hidden.mjs";
import "../_libs/react-remove-scroll.mjs";
import "tslib";
import "../_libs/react-remove-scroll-bar.mjs";
import "../_libs/react-style-singleton.mjs";
import "../_libs/get-nonce.mjs";
import "../_libs/use-sidecar.mjs";
import "../_libs/use-callback-ref.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/tanstack__react-query.mjs";
function SeverityCard({
  severity,
  situationId,
  usageCount,
  onChange,
  onRemove
}) {
  const actionTags = useActionTags();
  const tagLabel = (id) => actionTags.find((t) => t.id === id)?.label ?? id;
  function updateAction(actionId, patch) {
    onChange({
      ...severity,
      actions: severity.actions.map((a) => a.id === actionId ? { ...a, ...patch } : a)
    });
  }
  function removeAction(actionId) {
    onChange({ ...severity, actions: severity.actions.filter((a) => a.id !== actionId) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-background p-4 space-y-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          value: severity.name,
          onChange: (e) => onChange({ ...severity, name: e.target.value }),
          className: "flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm font-medium"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          disabled: usageCount > 0,
          onClick: onRemove,
          title: usageCount > 0 ? `Používá se v ${usageCount} pravidlech` : "Smazat závažnost",
          className: cn(
            "rounded-md p-1.5 text-muted-foreground transition-colors",
            usageCount > 0 ? "opacity-30 cursor-not-allowed" : "hover:text-red-500"
          ),
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "size-4" })
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs text-muted-foreground mb-1 block", children: "Priorita" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "select",
        {
          value: severity.priority,
          onChange: (e) => onChange({ ...severity, priority: e.target.value }),
          className: "rounded-md border border-border bg-background px-2.5 py-1.5 text-sm",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "low", children: "LOW" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "medium", children: "MEDIUM" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "high", children: "HIGH" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "urgent", children: "URGENT" })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2", children: "Přiřazené akce" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: severity.actions.map((a) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border bg-muted/20 p-2.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary", children: tagLabel(a.actionTagId) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => removeAction(a.id), className: "text-muted-foreground hover:text-red-500 text-xs", children: "Odebrat" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "textarea",
          {
            value: a.description ?? "",
            onChange: (e) => updateAction(a.id, { description: e.target.value }),
            placeholder: "Výchozí text pro operátora…",
            rows: 2,
            className: "w-full rounded border border-border bg-background px-2 py-1.5 text-xs resize-none"
          }
        )
      ] }, a.id)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        ActionTagPicker,
        {
          excludeIds: severity.actions.map((a) => a.actionTagId),
          onPick: (tag) => onChange({
            ...severity,
            actions: [...severity.actions, { id: "sa_" + Date.now(), actionTagId: tag.id, description: "" }]
          })
        }
      ) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between pt-2 border-t border-border", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground", children: [
        usageCount,
        " ",
        usageCount === 1 ? "pravidlo" : usageCount < 5 ? "pravidla" : "pravidel"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Link,
        {
          to: "/rules/new",
          search: { situationId, severityId: severity.id },
          className: "rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90",
          children: "+ Pravidlo pro tuto závažnost"
        }
      )
    ] })
  ] });
}
function SituationEditorPage({ situationId }) {
  const situations = useSituations();
  const navigate = useNavigate();
  const situation = situations.find((s) => s.id === situationId);
  if (!situation) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-screen w-screen flex-col bg-background text-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(AppHeader, { current: "situace" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 text-sm text-muted-foreground", children: [
        "Situace nenalezena. ",
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/situace", className: "text-primary underline", children: "Zpět na seznam" })
      ] })
    ] });
  }
  function updateSeverity(next) {
    if (!situation) return;
    situationsStore.upsert({
      ...situation,
      severities: situation.severities.map((s) => s.id === next.id ? next : s)
    });
  }
  function removeSeverity(severityId) {
    if (!situation) return;
    situationsStore.upsert({
      ...situation,
      severities: situation.severities.filter((s) => s.id !== severityId)
    });
  }
  function addSeverity() {
    if (!situation) return;
    const newSeverity = {
      id: "sev_" + Date.now(),
      name: "Nová závažnost",
      priority: "medium",
      actions: []
    };
    situationsStore.upsert({ ...situation, severities: [...situation.severities, newSeverity] });
  }
  const totalUsage = situation.severities.reduce((sum, s) => sum + severityUsageCount(s.id), 0);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-screen w-screen flex-col bg-background text-foreground", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(AppHeader, { current: "situace" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-y-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-2xl p-6 space-y-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/situace", className: "text-xs text-muted-foreground hover:text-foreground", children: "← Zpět na situace" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            value: situation.name,
            onChange: (e) => situationsStore.upsert({ ...situation, name: e.target.value }),
            className: "flex-1 rounded-md border border-border bg-background px-3 py-2 text-lg font-semibold"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            disabled: totalUsage > 0,
            onClick: () => {
              situationsStore.remove(situation.id);
              navigate({ to: "/situace" });
            },
            title: totalUsage > 0 ? `Používá se v ${totalUsage} pravidlech` : "Smazat situaci",
            className: "rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:border-red-300 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "size-4" }),
              " Smazat"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "textarea",
        {
          value: situation.description ?? "",
          onChange: (e) => situationsStore.upsert({ ...situation, description: e.target.value }),
          placeholder: "Popis situace…",
          rows: 2,
          className: "w-full rounded-md border border-border bg-background px-3 py-2 text-sm resize-none"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2", children: [
          "Závažnosti (",
          situation.severities.length,
          ")"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: situation.severities.map((sev) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          SeverityCard,
          {
            severity: sev,
            situationId: situation.id,
            usageCount: severityUsageCount(sev.id),
            onChange: updateSeverity,
            onRemove: () => removeSeverity(sev.id)
          },
          sev.id
        )) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: addSeverity,
            className: "mt-3 w-full rounded-lg border border-dashed border-border py-2 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors",
            children: "+ Přidat závažnost"
          }
        )
      ] })
    ] }) })
  ] });
}
function SituaceEditorRoute() {
  const {
    id
  } = Route$4.useParams();
  return /* @__PURE__ */ jsxRuntimeExports.jsx(SituationEditorPage, { situationId: id });
}
export {
  SituaceEditorRoute as component
};
