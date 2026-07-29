import type { ChecklistItem, ChecklistItemTemplate, ChecklistVkr, Kontakt } from "./types";

export const CHECKLIST_ITEM_TEMPLATES: ChecklistItemTemplate[] = [
  {
    id: "tpl_neprip_zbozi",
    category: "obsah",
    order: 1,
    title: "Kontrola nepřípustného zboží dle přepravce",
    description: "Zbraně a makety, kazitelné potraviny, peníze apod. dle podmínek přepravce.",
    context: [
      { label: "Zadaný obsah", value: "kosmetika, drobné dárky" },
      { label: "Přepravce", value: "DHL Express" },
      { label: "Odkud → kam", value: "Praha, CZ → Berlín, DE" },
      { label: "Hodnota", value: "4 200 Kč · pojištěno 300 Kč" },
    ],
    resolutionOptions: [
      "Zákazník věc vyndal, přeprava pokračuje",
      "Přeprava zrušena",
      "Nepřiznané poslání",
    ],
  },
  {
    id: "tpl_dg",
    category: "obsah",
    order: 2,
    title: "Vyhodnocení obsahu z pohledu DG",
    description: "Např. zda „kosmetika“ neznamená parfémy, „barva“ hořlavinu.",
    context: [
      { label: "Zadaný obsah", value: "kosmetika, drobné dárky" },
      { label: "Kategorie zboží", value: "Běžné zboží" },
      { label: "Varianta přepravy", value: "Express letecky" },
    ],
    resolutionOptions: ["Věc vyndána, přeprava pokračuje standardně", "Přeprava zrušena", "Nepřiznané poslání"],
  },
  {
    id: "tpl_dokumenty",
    category: "obsah",
    order: 3,
    title: "Ověření, že se jedná o dokumenty",
    description: "Potvrzení, že obsah jsou opravdu jen dokumenty.",
    context: [
      { label: "Typ zásilky", value: "Balíky — ne Dokumenty" },
      { label: "Zadaný obsah", value: "kosmetika, drobné dárky" },
    ],
    resolutionOptions: ["Potvrzeno, jsou to dokumenty"],
  },
  {
    id: "tpl_hodnota_odpovednost",
    category: "hodnota",
    order: 1,
    title: "Kontrola hodnoty vůči naší odpovědnosti",
    description: "Hodnota 6 800 Kč o 24 % převyšuje naši odpovědnost 5 500 Kč, nepojištěno.",
    context: [
      { label: "Hodnota zásilky", value: "6 800 Kč" },
      { label: "Naše odpovědnost", value: "5 500 Kč · dle hmotnosti" },
      { label: "Pojištění", value: "ne" },
    ],
    resolutionOptions: ["Pojištěno", "Necháváme bez pojištění"],
  },
  {
    id: "tpl_pojistitelnost",
    category: "hodnota",
    order: 2,
    title: "Kontrola splnění podmínek pro pojištění",
    description: "Komodita je pojistitelná jen v omezeném rozsahu.",
    context: [
      { label: "Kategorie zboží", value: "Běžné zboží" },
      { label: "Pojistná částka", value: "6 800 Kč" },
      { label: "Rozsah", value: "Omezený" },
    ],
    resolutionOptions: ["Pojištění v omezeném rozsahu ponecháno", "Pojištění zrušeno, peníze vráceny"],
  },
  {
    id: "tpl_hodnota_chyba",
    category: "hodnota",
    order: 3,
    title: "Kontrola chybně zadané hodnoty",
    description: "Řádová chyba při zadání — např. 40,- místo 40.000,-.",
    context: [
      { label: "Hodnota", value: "6 800 Kč" },
      { label: "Hodnota na kus", value: "≈ 3 400 Kč" },
    ],
    resolutionOptions: ["Hodnota potvrzena", "Hodnota opravena"],
  },
  {
    id: "tpl_celni_faktura",
    category: "dokumentace",
    order: 1,
    title: "Kontrola celní faktury",
    description: "Faktura zatím nebyla dodána — zákazník vyzván, čekáme na doručení.",
    context: [
      { label: "Cílová země", value: "Švýcarsko — mimo EU" },
      { label: "Stav faktury", value: "nedodána" },
    ],
    resolutionOptions: ["Faktura upravena se zákazníkem", "Fakturu vytvoříme my", "Čekáme na dodání"],
  },
  {
    id: "tpl_eori",
    category: "dokumentace",
    order: 2,
    title: "Kontrola EORI vývozce",
    description: "Zákazník nemá EORI, vyzván k vyřízení.",
    context: [
      { label: "Cílová země", value: "Švýcarsko — mimo EU" },
      { label: "EORI zákazníka", value: "nenalezeno" },
    ],
    resolutionOptions: ["Čekáme na vyřízení"],
  },
];

export const CHECKLIST_KONTAKTY: Kontakt[] = [
  {
    id: "kontakt_1",
    type: "customer",
    scheduledAt: nextNoon(1, 10),
    note: "Nabídka pojištění + omezený rozsah pojistitelnosti.",
    status: "planned",
    linkedItemIds: ["item_hodnota_odpovednost", "item_pojistitelnost"],
  },
];

export const CHECKLIST_VKRS: ChecklistVkr[] = [
  {
    id: "vkr_celni_faktura",
    title: "Sledovat dodání celní faktury",
    itemId: "item_celni_faktura",
    dueAt: nextNoon(2, 12),
    createdAt: nextNoon(0, 9),
    resolved: false,
  },
];

export const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: "item_neprip_zbozi",
    templateId: "tpl_neprip_zbozi",
    state: "resolved_found",
    finding: "Obsahovalo powerbanku (Li-ion).",
    resolution: "Zákazník věc vyndal, přeprava pokračuje — potvrzeno e-mailem.",
    resolvedAt: nextNoon(0, 10, 12),
    resolvedBy: "E. Kadubcová",
  },
  { id: "item_dg", templateId: "tpl_dg", state: "open" },
  { id: "item_dokumenty", templateId: "tpl_dokumenty", state: "open" },
  {
    id: "item_hodnota_odpovednost",
    templateId: "tpl_hodnota_odpovednost",
    state: "waiting_contact",
    kontaktId: "kontakt_1",
  },
  {
    id: "item_pojistitelnost",
    templateId: "tpl_pojistitelnost",
    state: "waiting_contact",
    kontaktId: "kontakt_1",
  },
  { id: "item_hodnota_chyba", templateId: "tpl_hodnota_chyba", state: "open" },
  {
    id: "item_celni_faktura",
    templateId: "tpl_celni_faktura",
    state: "waiting_delivery",
    resolution: "Čekáme na dodání",
    vkrId: "vkr_celni_faktura",
  },
  { id: "item_eori", templateId: "tpl_eori", state: "waiting_delivery", resolution: "Čekáme na vyřízení" },
];

/** Pomocná funkce pro čitelná seed data — "zítra/pozítří v HH:MM", bez závislosti na knihovně. */
function nextNoon(daysFromNow: number, hour: number, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}
