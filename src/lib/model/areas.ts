import type { Area } from "./types";
export const AREAS: { id: Area; label: string; description: string; icon: string; enabled: boolean }[] = [
  { id: "tracking_records", label: "Záznamy z trackingu", description: "Analýza přímo nad tracking záznamy — opakování hodnoty, zaseknutí, opakovaný pokus.", icon: "ListSearch", enabled: true },
  { id: "route_compliance", label: "Soulad s předepsanou trasou", description: "Reaguj na milník trasy: proběhl správně, nebo ne.", icon: "Route", enabled: true },
  { id: "order_eval", label: "Vyhodnocení objednávky", description: "Úplnost dat objednávky — doklady, platba, clení, pojištění.", icon: "ClipboardCheck", enabled: false },
  { id: "unpickup", label: "Nevyzvednutá objednávka", description: "Vyzvednutí neproběhlo do termínu.", icon: "PackageOff", enabled: false },
  { id: "params_price", label: "Parametry a cena", description: "Deklarováno vs. tracking — váha, rozměry.", icon: "Scale", enabled: false },
];
export const areaById = (id: Area) => AREAS.find(a => a.id === id)!;
