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
    findingOptions: ["V pořádku, žádná závada", "Obsahuje powerbanku / Li-ion baterii", "Obsahuje jinou nepřípustnou položku"],
    resolutionOptions: ["Zákazník věc vyndal, přeprava pokračuje", "Přeprava zrušena", "Nepřiznané poslání"],
    canTrackForMonitoring: false,
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
    findingOptions: ["V pořádku, neobsahuje nebezpečné látky", "Podezření na nebezpečnou látku (hořlavina, parfém apod.)"],
    resolutionOptions: ["Věc vyndána, přeprava pokračuje standardně", "Přeprava zrušena", "Nepřiznané poslání"],
    canTrackForMonitoring: false,
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
    findingOptions: ["Potvrzeno, jsou to dokumenty", "Nejedná se jen o dokumenty"],
    resolutionOptions: ["Přeřazeno na balík", "Sazba potvrzena jako dokumenty"],
    canTrackForMonitoring: false,
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
    findingOptions: ["Hodnota převyšuje limit odpovědnosti", "V pořádku, v rámci limitu"],
    resolutionOptions: ["Pojištěno", "Necháváme bez pojištění"],
    canTrackForMonitoring: false,
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
    findingOptions: ["Komodita pojistitelná jen v omezeném rozsahu", "Komodita plně pojistitelná"],
    resolutionOptions: ["Pojištění v omezeném rozsahu ponecháno", "Pojištění zrušeno, peníze vráceny"],
    canTrackForMonitoring: false,
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
    findingOptions: ["Podezření na řádovou chybu v zadané hodnotě", "Hodnota odpovídá"],
    resolutionOptions: ["Hodnota potvrzena", "Hodnota opravena"],
    canTrackForMonitoring: false,
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
    findingOptions: ["Faktura nedodána", "Faktura dodána, ale s chybou", "V pořádku"],
    resolutionOptions: ["Faktura upravena se zákazníkem", "Fakturu vytvoříme my", "Čekáme na dodání"],
    canTrackForMonitoring: true,
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
    findingOptions: ["EORI chybí nebo neplatné", "EORI v pořádku"],
    resolutionOptions: ["Čekáme na vyřízení", "Klient EORI doplnil"],
    canTrackForMonitoring: true,
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
    findingValue: "Obsahovalo powerbanku (Li-ion).",
    findingIsSuspicion: false,
    resolutionValue: "Zákazník věc vyndal, přeprava pokračuje — potvrzeno e-mailem.",
    resolutionNeedsConfirm: false,
    manuallyResolved: true,
    resolvedAt: nextNoon(0, 10, 12),
    resolvedBy: "E. Kadubcová",
  },
  {
    id: "item_dg",
    templateId: "tpl_dg",
    findingIsSuspicion: false,
    resolutionNeedsConfirm: false,
    manuallyResolved: false,
  },
  {
    id: "item_dokumenty",
    templateId: "tpl_dokumenty",
    findingIsSuspicion: false,
    resolutionNeedsConfirm: false,
    manuallyResolved: false,
  },
  {
    id: "item_hodnota_odpovednost",
    templateId: "tpl_hodnota_odpovednost",
    findingValue: "Hodnota převyšuje limit odpovědnosti.",
    findingIsSuspicion: false,
    resolutionNeedsConfirm: true,
    manuallyResolved: false,
    kontaktId: "kontakt_1",
  },
  {
    id: "item_pojistitelnost",
    templateId: "tpl_pojistitelnost",
    findingValue: "Komodita pojistitelná jen v omezeném rozsahu.",
    findingIsSuspicion: false,
    resolutionNeedsConfirm: true,
    manuallyResolved: false,
    kontaktId: "kontakt_1",
  },
  {
    id: "item_hodnota_chyba",
    templateId: "tpl_hodnota_chyba",
    findingIsSuspicion: false,
    resolutionNeedsConfirm: false,
    manuallyResolved: false,
  },
  {
    id: "item_celni_faktura",
    templateId: "tpl_celni_faktura",
    findingValue: "Faktura nedodána.",
    findingIsSuspicion: false,
    resolutionValue: "Čekáme na dodání",
    resolutionNeedsConfirm: false,
    manuallyResolved: false,
    trackingVkrId: "vkr_celni_faktura",
  },
  {
    id: "item_eori",
    templateId: "tpl_eori",
    findingValue: "EORI chybí nebo neplatné.",
    findingIsSuspicion: false,
    resolutionValue: "Čekáme na vyřízení",
    resolutionNeedsConfirm: false,
    manuallyResolved: false,
  },
];

/** Pomocná funkce pro čitelná seed data — "zítra/pozítří v HH:MM", bez závislosti na knihovně. */
function nextNoon(daysFromNow: number, hour: number, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}
