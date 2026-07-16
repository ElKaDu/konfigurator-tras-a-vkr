import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { c as cn } from "./store-CVlU6jxP.mjs";
import { g as Scale, h as PackageX, i as ClipboardCheck, R as Route, j as TextSearch, c as Circle } from "../_libs/lucide-react.mjs";
const AREAS = [
  { id: "tracking_records", label: "Záznamy z trackingu", description: "Analýza přímo nad tracking záznamy — opakování hodnoty, zaseknutí, opakovaný pokus.", icon: "ListSearch", enabled: true, num: 4 },
  { id: "route_compliance", label: "Soulad s předepsanou trasou", description: "Reaguj na milník trasy: proběhl správně, nebo ne.", icon: "Route", enabled: true, num: 5 },
  { id: "order_eval", label: "Vyhodnocení objednávky", description: "Úplnost dat objednávky — doklady, platba, clení, pojištění.", icon: "ClipboardCheck", enabled: false, num: 1 },
  { id: "unpickup", label: "Nevyzvednutá objednávka", description: "Vyzvednutí neproběhlo do termínu.", icon: "PackageOff", enabled: false, num: 2 },
  { id: "params_price", label: "Parametry a cena", description: "Deklarováno vs. tracking — váha, rozměry.", icon: "Scale", enabled: false, num: 3 }
];
const areaById = (id) => AREAS.find((a) => a.id === id);
const AREA_ICONS = {
  ListSearch: TextSearch,
  Route,
  ClipboardCheck,
  PackageOff: PackageX,
  Scale
};
function resolveAreaIcon(name) {
  return AREA_ICONS[name] ?? Circle;
}
function colorFor(area) {
  if (area === "tracking_records") {
    return "bg-teal-500/15 text-teal-700 dark:text-teal-300";
  }
  if (area === "route_compliance") {
    return "bg-primary-soft text-primary";
  }
  return "bg-muted text-muted-foreground";
}
function AreaBadge({ area }) {
  const meta = areaById(area);
  const Icon = resolveAreaIcon(meta.icon);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "span",
    {
      className: cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
        colorFor(area)
      ),
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { size: 13 }),
        meta.label
      ]
    }
  );
}
export {
  AreaBadge as A
};
