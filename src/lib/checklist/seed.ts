import type { ChecklistItem, ChecklistItemTemplate, ChecklistVkr, Kontakt } from "./types";

export const CHECKLIST_ITEM_TEMPLATES: ChecklistItemTemplate[] = [
  // --- Kategorie 1 — Obsah zásilky z hlediska přípustnosti ---
  {
    id: "tpl_neprip_zbozi",
    category: "obsah",
    order: 1,
    title: "Kontrola nepřípustného zboží dle přepravce",
    description:
      "Ověřuje, jestli zadaný obsah zásilky neobsahuje zboží, které konkrétní přepravce nepřepravuje nebo přepravuje jen za zvláštních podmínek (zbraně a makety, kazitelné potraviny, peníze apod.).",
    context: [
      { label: "Zadaný obsah", value: "kosmetika, drobné dárky" },
      { label: "Přepravce", value: "DHL Express" },
      { label: "Odkud → kam", value: "Praha, CZ → Berlín, DE" },
      { label: "Hodnota", value: "4 200 Kč · pojištěno 300 Kč" },
    ],
    findingOptions: ["Neobsahuje nepřípustné zboží", "Obsahuje nepřípustné zboží"],
    resolutionOptions: [
      "Nakonec v pořádku",
      "Věc vyndána zákazníkem, přeprava pokračuje",
      "Přeprava zrušena",
      "Nepřiznané poslání (schováno)",
    ],
  },
  {
    id: "tpl_dg",
    category: "obsah",
    order: 2,
    title: "Kontrola DG v závislosti na typu přepravy",
    description:
      "Ověřuje, jestli zadaný obsah nepředstavuje nebezpečné zboží (DG) vzhledem ke zvolené variantě přepravy — např. zda „kosmetika“ neznamená parfémy, „barva“ hořlavinu.",
    context: [
      { label: "Zadaný obsah", value: "kosmetika, drobné dárky" },
      { label: "Kategorie zboží", value: "Běžné zboží" },
      { label: "Varianta přepravy", value: "Express letecky" },
    ],
    findingOptions: ["Není DG", "Je nebo může být DG"],
    resolutionOptions: [
      "Přeprava standardně v DG režimu",
      "Věc vyndána, přeprava pokračuje standardně",
      "Přeprava zrušena",
      "Nepřiznané poslání",
    ],
  },
  {
    id: "tpl_dokumenty",
    category: "obsah",
    order: 3,
    title: "Ověření, že se jedná o dokumenty",
    description:
      "Ověřuje, jestli zásilka, kterou zákazník při zadání označil jako „pouze dokumenty“, skutečně dokumenty obsahuje.",
    context: [
      { label: "Typ zásilky", value: "Balíky — ne Dokumenty" },
      { label: "Zadaný obsah", value: "kosmetika, drobné dárky" },
    ],
    findingOptions: ["Potvrzeno", "Nejde (jen) o dokumenty"],
    resolutionOptions: ["Ověřeno"],
  },
  {
    id: "tpl_cleni_prijemce",
    category: "obsah",
    order: 4,
    title: "Kontrola přípustnosti pro clení v zemi příjemce",
    description:
      "Ověřuje, jestli zadaný obsah projde celním řízením v cílové zemi bez speciálních podmínek nebo přímé nepřípustnosti. Platí jen mimo EU.",
    context: [
      { label: "Cílová země", value: "Švýcarsko — mimo EU" },
      { label: "Zadaný obsah", value: "kosmetika, drobné dárky" },
    ],
    findingOptions: ["Přípustné", "Nepřípustné nebo vyžaduje speciální podmínky"],
    resolutionOptions: ["Nakonec v pořádku", "Věc vyndána", "Přeprava zrušena", "Nepřiznané poslání"],
  },

  // --- Kategorie 2 — Obsah zásilky z pohledu vhodného zabalení ---
  {
    id: "tpl_zabaleni",
    category: "zabaleni",
    order: 1,
    title: "Kontrola vhodnosti zabalení",
    description:
      "Ověřuje, jestli obsah zásilky (křehké, citlivé zboží) není zabalený nevhodně vzhledem ke své povaze, rozměrům a hmotnosti.",
    context: [
      { label: "Kategorie zboží", value: "Běžné zboží" },
      { label: "Rozměry", value: "30 × 20 × 15 cm" },
      { label: "Hmotnost", value: "1,2 kg" },
    ],
    findingOptions: ["Zabalení je vhodné", "Zabalení není vhodné"],
    resolutionOptions: ["Nakonec v pořádku", "Zákazník přebalí"],
  },

  // --- Kategorie 3 — Hodnota zboží, naše odpovědnost a pojištění ---
  {
    id: "tpl_hodnota_chyba",
    category: "hodnota",
    order: 1,
    title: "Kontrola, zda hodnota není zapsána chybně",
    description:
      "Ověřuje, jestli zadaná hodnota zboží neobsahuje řádovou chybu (např. 40 Kč místo 40 000 Kč) vzhledem k obsahu a hmotnosti zásilky.",
    context: [
      { label: "Hodnota", value: "6 800 Kč" },
      { label: "Hodnota na kus", value: "≈ 3 400 Kč" },
    ],
    findingOptions: ["Chyba v částce"],
    resolutionOptions: ["Hodnota potvrzena", "Hodnota opravena"],
  },
  {
    id: "tpl_hodnota_odpovednost",
    category: "hodnota",
    order: 2,
    title: "Kontrola hodnoty zboží a jeho pojištění",
    description:
      "Ověřuje, jestli hodnota zásilky odpovídá naší odpovědnosti a stavu pojištění — problém je hodnota o 20 %+ nad odpovědností bez pojištění, nebo naopak zbytečné pojištění u nízké hodnoty.",
    context: [
      { label: "Hodnota zásilky", value: "6 800 Kč" },
      { label: "Naše odpovědnost", value: "5 500 Kč · dle hmotnosti" },
      { label: "Pojištění", value: "ne" },
    ],
    findingOptions: [
      "V pořádku",
      "Hodnota o 20 %+ převyšuje odpovědnost, nepojištěno",
      "Hodnota nízká, pojištění se nevyplatí",
    ],
    resolutionOptions: ["Pojištěno", "Necháváme bez pojištění", "Pojištění zrušeno", "Necháváme jak je"],
  },
  {
    id: "tpl_pojistitelnost",
    category: "hodnota",
    order: 3,
    title: "Kontrola splnění podmínek pro pojištění",
    description: "Ověřuje, jestli je konkrétní komodita standardně pojistitelná v plném rozsahu, nebo jen s omezením.",
    context: [
      { label: "Kategorie zboží", value: "Běžné zboží" },
      { label: "Pojistná částka", value: "6 800 Kč" },
    ],
    findingOptions: ["Pojistitelná jen v omezeném rozsahu"],
    resolutionOptions: ["Pojištění v omezeném rozsahu ponecháno", "Pojištění zrušeno"],
  },
  {
    id: "tpl_ponizeni_hodnoty",
    category: "hodnota",
    order: 4,
    title: "Posouzení možnosti ponížení hodnoty kvůli clení",
    description:
      "Ověřuje, jestli lze z pohledu vývozce hodnotu zásilky snížit tak, aby to pomohlo s clením v cílové zemi, a jestli je to uvěřitelné vzhledem k povaze zboží. Platí jen mimo EU.",
    context: [
      { label: "Cílová země", value: "Švýcarsko — mimo EU" },
      { label: "Typ vývozce", value: "Fyzická osoba" },
    ],
    findingOptions: ["Možné ponížit", "Není možné ponížit"],
    resolutionOptions: [],
  },

  // --- Kategorie 4 — Dokumentace zásilky (jen mimo EU) ---
  {
    id: "tpl_celni_faktura",
    category: "dokumentace",
    order: 1,
    title: "Kontrola celní faktury",
    description: "Ověřuje, jestli zákazníkem dodaná celní faktura obsahuje všechny předepsané náležitosti.",
    context: [
      { label: "Cílová země", value: "Švýcarsko — mimo EU" },
      { label: "Stav faktury", value: "nedodána" },
    ],
    findingOptions: ["Není v pořádku", "Není vůbec"],
    resolutionOptions: ["Fakturu upraví zákazník", "Fakturu dodá zákazník", "Fakturu vytvoříme my"],
  },
  {
    id: "tpl_puvod",
    category: "dokumentace",
    order: 2,
    title: "Prokázání původu",
    description:
      "Ověřuje, jestli je na celní faktuře uvedená věta o původu zboží ve správném znění, případně jestli je vyřízená speciální náležitost vyžadovaná cílovou zemí (EUR1 nad 6 000 EUR, A.TR do Turecka, EORI do GB). Platí jen u zboží s EU původem.",
    context: [
      { label: "Cílová země", value: "Švýcarsko — mimo EU" },
      { label: "Hodnota", value: "6 800 Kč" },
    ],
    findingOptions: [
      "Chybí věta o původu / špatné znění",
      "Vyžaduje EUR1 / A.TR / speciální znění a není vyřízeno",
    ],
    resolutionOptions: ["Věta opravena", "Čekáme na vyřízení", "Vyřídíme my"],
  },
  {
    id: "tpl_zpusob_celeni",
    category: "dokumentace",
    order: 3,
    title: "Určení způsobu exportního clení",
    description:
      "Určuje, jaký způsob exportního celního odbavení je pro danou zásilku nutný, resp. vhodný.",
    context: [
      { label: "Hodnota", value: "6 800 Kč" },
      { label: "Cílová země", value: "Švýcarsko — mimo EU" },
    ],
    findingOptions: [],
    resolutionOptions: [],
  },
  {
    id: "tpl_eori",
    category: "dokumentace",
    order: 4,
    title: "Kontrola EORI vývozce",
    description: "Ověřuje, jestli má zákazník jako vývozce přidělené EORI číslo, nutné pro plnohodnotné celní odbavení. Platí jen při plnohodnotném clení.",
    context: [
      { label: "Cílová země", value: "Švýcarsko — mimo EU" },
      { label: "EORI zákazníka", value: "nenalezeno" },
    ],
    findingOptions: ["Má EORI", "Nemá EORI"],
    resolutionOptions: ["Nakonec v pořádku", "Čekáme na vyřízení"],
  },
  {
    id: "tpl_plna_moc",
    category: "dokumentace",
    order: 5,
    title: "Kontrola plné moci pro celní odbavení",
    description: "Ověřuje, jestli máme řádně vyplněnou a podepsanou plnou moc na exportní celní odbavení. Platí jen při plnohodnotném clení.",
    context: [{ label: "Cílová země", value: "Švýcarsko — mimo EU" }],
    findingOptions: ["Chybí", "Není v pořádku"],
    resolutionOptions: ["Čekáme na dodání"],
  },

  // --- Kategorie 5 — Adresy a kontaktní údaje ---
  {
    id: "tpl_adresy",
    category: "adresy",
    order: 1,
    title: "Kontrola adres vyzvednutí a doručení",
    description: "Ověřuje, jestli u adresy vyzvednutí i doručení souhlasí stát, PSČ a ulice (včetně čísla popisného, kde je relevantní).",
    context: [
      { label: "Adresa vyzvednutí", value: "Praha, CZ" },
      { label: "Adresa doručení", value: "Berlín, DE" },
    ],
    findingOptions: ["Chyba v adrese"],
    resolutionOptions: ["Adresa opravena"],
  },
  {
    id: "tpl_telefony",
    category: "adresy",
    order: 2,
    title: "Kontrola telefonních čísel",
    description: "Ověřuje, jestli telefonní čísla příjemce a odesílatele mají správný formát a předvolbu.",
    context: [
      { label: "Telefon odesílatele", value: "+420 777 123 456" },
      { label: "Telefon příjemce", value: "+49 30 1234567" },
    ],
    findingOptions: ["Chyba (předvolba, formát)"],
    resolutionOptions: ["Číslo opraveno"],
  },

  // --- Kategorie 6 — Doba doručení, resp. vyzvednutí ---
  {
    id: "tpl_doba_doruceni_web",
    category: "doba_doruceni",
    order: 1,
    title: "Kontrola avizované doby doručení — chyba na webu",
    description: "Ověřuje, jestli avizovaná doba doručení odpovídá realitě, nebo jde o chybu na webu Poslisnadno.cz.",
    context: [
      { label: "Avizovaná doba", value: "1 pracovní den" },
      { label: "Cílová oblast", value: "Berlín, DE" },
    ],
    findingOptions: ["Chyba na webu"],
    resolutionOptions: ["Opravit interní údaj"],
  },
  {
    id: "tpl_doba_doruceni_oblast",
    category: "doba_doruceni",
    order: 2,
    title: "Kontrola avizované doby doručení — speciální oblast",
    description: "Ověřuje, jestli cílová oblast není speciální oblastí s delší dobou doručení (např. Kanárské ostrovy).",
    context: [{ label: "Cílová oblast", value: "Berlín, DE" }],
    findingOptions: ["Oblast s dlouhou dobou doručení"],
    resolutionOptions: ["Zákazník informován", "Domluvit se na pozdějším datu"],
  },
  {
    id: "tpl_vyzvednuti_dnes",
    category: "doba_doruceni",
    order: 3,
    title: "Posouzení možnosti vyzvednutí ještě dnes",
    description: "Ověřuje, jestli by šlo — navzdory tomu, že web kvůli rezervě nabídl až další pracovní den — ještě dnes vyzvednutí stihnout.",
    context: [
      { label: "Vytvořeno", value: "dnes 8:20" },
      { label: "Cut-off přepravce", value: "16:00" },
    ],
    findingOptions: ["Lze stihnout dnes"],
    resolutionOptions: ["Vyzvednutí posunuto na dnes", "Ponechán původní termín"],
  },

  // --- Kategorie 7 — Finanční hodnoty ---
  {
    id: "tpl_doplatek",
    category: "financni",
    order: 1,
    title: "Kontrola rizika doplatku",
    description: "Ověřuje, jestli rozměry a hmotnost zásilky nejsou blízko hranici vyššího cenového pásma s rizikem doplatku.",
    context: [
      { label: "Rozměry", value: "30 × 20 × 15 cm" },
      { label: "Hmotnost", value: "1,2 kg" },
    ],
    findingOptions: ["Riziko doplatku"],
    resolutionOptions: ["Zákazník informován a souhlasí", "Zákazník upraví zásilku"],
  },
  {
    id: "tpl_nakupni_cena",
    category: "financni",
    order: 2,
    title: "Kontrola nákupní ceny vůči BG",
    description:
      "Ověřuje nákupní cenu na BG, že se výrazně neliší. Tolerance: 0–1 000 Kč max 100 Kč, 1 001–3 000 Kč 10 %, 3 001 Kč a víc 5 %.",
    context: [
      { label: "Nákupní cena", value: "6 800 Kč" },
      { label: "Cena dle BG", value: "6 200 Kč" },
    ],
    findingOptions: ["Mimo toleranci"],
    resolutionOptions: [],
  },

  // --- Kategorie 8 — Celkové zhodnocení ---
  {
    id: "tpl_celkove_zhodnoceni",
    category: "celkove",
    order: 1,
    title: "Celkové zhodnocení s odstupem",
    description:
      "Poslední, finální pohled na celou objednávku „s odstupem“ — jestli neobsahuje individuální chyby nebo nejasnosti, které předchozí kontroly nezachytily.",
    context: [{ label: "Ostatní kontroly", value: "viz kapitoly kontrol výše" }],
    findingOptions: [],
    resolutionOptions: [],
  },
];

/** Prázdno — checklist startuje jako čerstvá, nedotčená objednávka, ne s ilustračními daty. */
export const CHECKLIST_KONTAKTY: Kontakt[] = [];

/** Prázdno — viz CHECKLIST_KONTAKTY výše. */
export const CHECKLIST_VKRS: ChecklistVkr[] = [];

export const CHECKLIST_ITEMS: ChecklistItem[] = CHECKLIST_ITEM_TEMPLATES.map((tpl) => ({
  id: `item_${tpl.id.replace(/^tpl_/, "")}`,
  templateId: tpl.id,
  findingIsSuspicion: false,
  resolutionNeedsConfirm: false,
  manuallyResolved: false,
}));
