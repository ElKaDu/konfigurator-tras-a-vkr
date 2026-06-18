import type { Area } from "./types";

// Canonical circled numbers ①–⑤ matching the spec-defined area numbering.
export const CIRCLED = ["①", "②", "③", "④", "⑤"] as const;

export const AREAS: { id: Area; label: string; description: string; icon: string; enabled: boolean; num: number }[] = [
  { id: "tracking_records", label: "Záznamy z trackingu", description: "Analýza přímo nad tracking záznamy — opakování hodnoty, zaseknutí, opakovaný pokus.", icon: "ListSearch", enabled: true, num: 4 },
  { id: "route_compliance", label: "Soulad s předepsanou trasou", description: "Reaguj na milník trasy: proběhl správně, nebo ne.", icon: "Route", enabled: true, num: 5 },
  { id: "order_eval", label: "Vyhodnocení objednávky", description: "Úplnost dat objednávky — doklady, platba, clení, pojištění.", icon: "ClipboardCheck", enabled: false, num: 1 },
  { id: "unpickup", label: "Nevyzvednutá objednávka", description: "Vyzvednutí neproběhlo do termínu.", icon: "PackageOff", enabled: false, num: 2 },
  { id: "params_price", label: "Parametry a cena", description: "Deklarováno vs. tracking — váha, rozměry.", icon: "Scale", enabled: false, num: 3 },
];
export const areaById = (id: Area) => AREAS.find(a => a.id === id)!;
