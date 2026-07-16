import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { f as useSampleShipments, g as useRules, A as AppHeader, c as cn } from "./store-CVlU6jxP.mjs";
import { A as AreaBadge } from "./AreaBadge-Ebk6lwha.mjs";
import { d as CirclePlay, e as TriangleAlert, f as CircleCheck } from "../_libs/lucide-react.mjs";
import "../_libs/tanstack__react-router.mjs";
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
function inferBranch(rule) {
  const lc = rule.name.toLowerCase();
  if (lc.includes("neproběhl") || lc.includes("mimo") || lc.includes("zasekla") || lc.includes("opakovaný")) {
    return "not_fulfilled";
  }
  return "fulfilled";
}
function stubLines(rule, shipment, branch) {
  const carrier = [shipment.carrier, shipment.service_type].filter(Boolean).join(" ");
  const dest = shipment.country_import;
  const vkrTitle = rule.actions[0]?.title ?? rule.name;
  if (rule.area === "route_compliance") {
    const lines2 = [
      `Trasa zásilky: ${carrier} → ${dest}`,
      branch === "not_fulfilled" ? `Milník „Příchod na clení": nenastal v očekávaném čase` : `Všechny milníky proběhly ve správném pořadí a čase`
    ];
    if (branch === "not_fulfilled") {
      lines2.push(`Vznikla by VkŘ: „${vkrTitle}"`);
    }
    return lines2;
  }
  if (rule.area === "tracking_records") {
    const city = shipment.activities.find((a) => a.location_city)?.location_city ?? "Leipzig";
    const lines2 = [
      `Tracking: stejná hodnota „${city}" na 3 po sobě jdoucích záznamech`,
      branch === "not_fulfilled" ? `Podmínka splněna → vznikla by VkŘ: „${vkrTitle}"` : `Podmínka splněna → pravidlo proběhlo v pořádku`
    ];
    return lines2;
  }
  const lines = [
    `Zásilka ${shipment.label} (${carrier} → ${dest})`,
    branch === "not_fulfilled" ? `Podmínka pravidla byla vyhodnocena jako nenaplněná` : `Podmínka pravidla byla vyhodnocena jako splněná`
  ];
  if (branch === "not_fulfilled") {
    lines.push(`Vznikla by VkŘ: „${vkrTitle}"`);
  }
  return lines;
}
function OutcomeCard({
  rule,
  shipment
}) {
  const branch = inferBranch(rule);
  const lines = stubLines(rule, shipment, branch);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-background p-5 flex flex-col gap-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 flex-wrap", children: [
      branch === "not_fulfilled" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "span",
        {
          className: cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium",
            "bg-destructive/10 text-destructive"
          ),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { size: 14 }),
            "Odchylka — vznikla by VkŘ"
          ]
        }
      ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "span",
        {
          className: cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium",
            "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          ),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { size: 14 }),
            "V pořádku — žádná VkŘ"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(AreaBadge, { area: rule.area })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "flex flex-col gap-1.5 pl-4 list-disc text-sm text-foreground", children: lines.map((line, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: line }, i)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground border-t border-border pt-3 mt-1", children: "Ukázkový výsledek — skutečné vyhodnocení doplní další fáze." })
  ] });
}
function TestPanel() {
  const shipments = useSampleShipments();
  const rules = useRules();
  const [selectedShipmentId, setSelectedShipmentId] = reactExports.useState(
    shipments[0]?.id ?? ""
  );
  const [selectedRuleId, setSelectedRuleId] = reactExports.useState(
    rules[0]?.id ?? ""
  );
  const [show, setShow] = reactExports.useState(false);
  const selectedShipment = shipments.find((s) => s.id === selectedShipmentId);
  const selectedRule = rules.find((r) => r.id === selectedRuleId);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-screen w-screen flex-col bg-background text-foreground", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(AppHeader, { current: "rules" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-3xl w-full p-6 flex flex-col gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-lg font-semibold", children: "Otestovat pravidlo" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-0.5", children: "Vyber vzorovou zásilku a pravidlo — uvidíš, co by se stalo. (Vyhodnocení je zatím ukázkové.)" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wide", children: "Vzorová zásilka" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "select",
            {
              value: selectedShipmentId,
              onChange: (e) => {
                setSelectedShipmentId(e.target.value);
                setShow(false);
              },
              className: "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm",
              children: shipments.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: s.id, children: s.label }, s.id))
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wide", children: "Pravidlo" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "select",
            {
              value: selectedRuleId,
              onChange: (e) => {
                setSelectedRuleId(e.target.value);
                setShow(false);
              },
              className: "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm",
              children: rules.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: r.id, children: [
                r.code,
                " · ",
                r.name
              ] }, r.id))
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => setShow(true),
          className: "flex items-center gap-1.5 bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium self-start hover:opacity-90 transition-opacity",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CirclePlay, { size: 15 }),
            "Otestovat"
          ]
        }
      ),
      show && selectedRule && selectedShipment && /* @__PURE__ */ jsxRuntimeExports.jsx(OutcomeCard, { rule: selectedRule, shipment: selectedShipment })
    ] }) })
  ] });
}
const SplitComponent = TestPanel;
export {
  SplitComponent as component
};
