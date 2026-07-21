# Design: Tracking podmínky — časové okno pro „opakuje se" a rozdělení na dva boxy

**Datum:** 2026-07-19
**Status:** Design dokončen a schválen (včetně vizuálních náhledů). Čeká na finální review uživatele před
přechodem na implementační plán.

> Navazuje na `docs/superpowers/specs/2026-07-16-situace-podminky-uprava-design.md` §4 (implementováno) —
> tento dokument popisuje **úpravy** té funkcionality po prvním použití prototypu, konkrétně: přepracování
> režimu „opakuje se" a rozdělení jednotného řádku podmínek na dva samostatné boxy podle toho, jestli se
> týkají právě příchozího záznamu, nebo historie.

---

## 1. Kontext

Pravidlo `T01 — Zásilka se zasekla na jednom místě` (oblast `tracking_records`, Situace `SIT-TRANSPORT` /
závažnost „zaseknutá na místě") má rozpoznat zásilku, která přestala fyzicky postupovat, i když tracking dál
chodí ze stejného místa. Editor podmínek (`TrackingConditionsBuilder.tsx`) dnes nabízí u jednoho řádku volbu
**je / není / opakuje se / bylo v historii**. Po prvním použití prototypu vyplynuly dvě věci k doladění:

1. Režim **„opakuje se"** počítal počet záznamů, ne čas — neodpovídalo to zadání klienta (viz §2).
2. Rozdělení na **jeden řádek se čtyřmi volbami** je matoucí — „bylo v historii" je koncepčně jiná otázka
   (co platilo v minulosti) než „je/není/opakuje se" (co platí o právě příchozím záznamu). Lepší je oddělit
   je do dvou samostatných bloků.

---

## 2. Zadání od klienta (shrnutí)

> „Statusy u kterých se posuzují minulé statusy z pohledu místa a času... Řeší např. zejména, když se
> zásilka zasekne na jednom místě a zůstane tam. A další den vyskočí nový status z toho samého místa...
> Je nutné vyloučit zásilky na clení, u kterých je běžné, že jsou delší čas na jednom místě."

Plné znění zadání, zdůvodnění každého rozhodnutí, časové osy pro hraniční případy a mermaid flowchart
vyhodnocení jsou v samostatném dokumentu pro programátory — viz §9 Reference. Tenhle spec dokument shrnuje
jen **výsledný tvar** k zapsání do implementačního plánu.

---

## 3. „Opakuje se" — časové okno místo počtu záznamů

**Beze změny:** výběr pole (ID místa / Město / Kód země — `REPEATABLE_FIELDS`), existence režimu „opakuje
se" jako takového, dostupnost jen při spouštěči `Automaticky` (nikdy při `Časovač` — podmínka potřebuje
„právě příchozí" záznam).

**Nové tělo podmínky** (nahrazuje `count` + `occurrence`):

| Prvek | Popis |
|---|---|
| `hodnota platí už [N] [hodin/dní]` | Časový práh. Vyhodnocuje se jen při novém tracking záznamu, který tuhle hodnotu potvrzuje. |
| přepínač „musí to být nepřerušeně" (výchozí zapnuto) | **Zapnuto** — časomíra se resetuje při jakékoli změně hodnoty pole. **Vypnuto** — sčítá se celková doba na této hodnotě napříč historií, i s přestávkami. |
| „resetovat časomíru, když se objeví status" (pole + operátor `obsahuje`/`neobsahuje` + hodnota) | Vyloučení podle statusu (typicky clení). Takový záznam pravidlo samo nikdy nespustí — jen posune reset bod na svůj čas. Není to filtr „ignoruj záznam", je to **posun počátku série**. |

Přesné odvození (proč časové okno, proč reset bod místo vyloučení celé série, chování při přerušení
hodnoty) je zdokumentováno s časovými osami v `mockups/2026-07-19-tracking-opakuje-se-zadani.html`.

### Datový model

`Condition`, varianta `kind: "tracking_aggregate"`, `valueMode: "same_repeats"` — pole `count` a
`occurrence` se nahrazují:

- `durationValue: number` — číselná hodnota prahu.
- `durationUnit: "h" | "d"` — jednotka.
- `continuous: boolean` — nahrazuje `occurrence`. `true` = nepřerušeně, `false` = souhrnně.
- `resetOn?: { fieldId: string; operator: "contains" | "not_contains"; value: string }` — volitelné.

Pro `valueMode: "specific"` (viz §5, „bylo v historii"/historický box) zůstávají pole beze změny až na
úpravu popsanou v §5.

---

## 4. Rozdělení na dva boxy

Místo jednoho řádku se čtyřmi volbami (je/není/opakuje se/bylo v historii) budou **dva samostatné bloky**:

- **„Podmínky pro příchozí záznam"** — volby **je / není / opakuje se**. Týká se jen právě příchozího
  (nového) tracking záznamu.
- **„Podmínky pro historické záznamy"** — nahrazuje dnešní „bylo v historii", viz §5.

### Viditelnost podle spouštěče

| Spouštěč | Zobrazené boxy |
|---|---|
| ⚡ Automaticky | Oba boxy vedle sebe. |
| 🕐 Časovač | Jen „Podmínky pro historické záznamy" — box „příchozí záznam" se vůbec nezobrazí (žádný nový záznam u časovače neexistuje). |

Oba boxy (a všechny jejich řádky) se kombinují přes **AND** — VkŘ vznikne, jen když platí úplně všechno
naráz.

---

## 5. Box „Podmínky pro historické záznamy"

Jeden řádek:

| Prvek | Popis |
|---|---|
| pole (libovolné z `TRACKING_FIELDS`) | Co se sleduje. |
| je / není | Zda historie danou hodnotu obsahuje/neobsahuje. |
| hodnota | Text k porovnání. |
| **počet záznamů** — operátor `větší než / menší než / rovno / nerozhoduje` + číslo (neaktivní při „nerozhoduje") | Nahrazuje dřívější plán zvláštního přepínače „číslo / poslední záznam bez čísla" — operátor „nerozhoduje" pokrývá stejný případ jednodušeji. |
| checkbox „jde o poslední záznamy" | Omezuje okno na posledních N záznamů (na rozdíl od kdekoliv v historii). |
| checkbox „musí být za sebou" | Záznamy musí být bezprostředně po sobě, ne roztroušené. |

**Víc řádků** jde přidat přes „+ přidat podmínku" — kombinují se přes AND. Tohle mimo jiné řeší **vyloučení
administrativních statusů** (např. clení) jako druhý řádek: `Odvozený status` `není` `In customs`, operátor
počtu `nerozhoduje`, „jde o poslední záznamy" zapnuto — bez potřeby zvláštního vylučovacího mechanismu navíc.
Pokud pravidlo má „status není X" a reálná zásilka status X v prohlíženém okně má, zásilka se pravidlem
nezachytí.

### Datový model

`valueMode: "specific"` větev typu `tracking_aggregate` — `count`/`occurrence` zůstávají, ale `count`
získává operátor:

- `countOperator: "gt" | "lt" | "eq" | "any"` — nové pole. `"any"` = „nerozhoduje" (číslo se stane neaktivním).
- `count: number` — aktivní jen mimo `countOperator: "any"`.
- `occurrence: "consecutive" | "any"` — beze změny, odpovídá „musí být za sebou".
- (nové) `scope: "recent" | "anywhere"` — odpovídá checkboxu „jde o poslední záznamy" (dnes implicitně vždy
  „recent" přes `count`; potřeba explicitní pole, aby šlo vypnout).

---

## 6. Mimo scope / otevřené otázky

- **Rozdílné prahy Express/Economy** — vědomě neřešeno formálním „rozsahem pravidla" (Pravidlo nemá
  `carriers`/`serviceTypes` na rozdíl od Trasy/Úseku). Řešení: dvě samostatná pravidla + podmínka „Typ
  služby je …" v boxu „příchozí záznam". Pole **„Typ služby" zatím chybí** v `TRACKING_FIELDS` — potřeba
  přidat, než půjde tahle varianta použít.
- **Interval spouštěče Časovač** — dnes `{ kind: "schedule", label: "Časový plán — kontroluje periodicky" }`,
  bez UI pro nastavení frekvence (`RuleCreatorPage.tsx:233-234`). Nepotřebné pro tenhle dokument, ale
  poznamenáno jako gap, kdyby se řešila přesná periodicita.
- **„Nový záznam musí přijít do N hodin" (možná ztráta zásilky)** — časová (ne počet-based) podmínka nad
  historickým boxem. Vědomě mimo scope — zůstává řešeno konceptem „opakuje se" (u `Automaticky`) + časovače,
  bez zvláštního hodinového pole v historickém boxu.
- **Konkrétní hodnota prahu pro T01** (kolik hodin/dní) — mechanismus je hotový, konkrétní číslo je na
  doladění s byznysem při migraci seed dat (`rule_t01` v `seed.ts` má dnes `count: 3, occurrence:
  "consecutive"`, potřeba přepsat na nový tvar).

---

## 7. Reference

- `mockups/2026-07-19-tracking-opakuje-se-zadani.html` (publikováno jako Artifact) — plné zdůvodnění
  mechanismu „opakuje se" s časovými osami pro všechny hraniční případy. **Tenhle dokument se dál nemění** —
  zůstává jako vysvětlení jen pro „opakuje se", rozdělení na dva boxy (§4–5) tam není.
- `docs/superpowers/specs/2026-07-16-situace-podminky-uprava-design.md` §4 — původní sjednocení řádku, které
  tenhle dokument upravuje.
- `src/components/rules/editors/TrackingConditionsBuilder.tsx` — komponenta, která se mění.
- `src/lib/model/trackingFields.ts` — katalog polí, `REPEATABLE_FIELDS`, `rowKindOf`.
- `src/lib/model/types.ts` — typ `Condition`, varianta `tracking_aggregate`.
- `src/lib/model/seed.ts` — `rule_t01`, ukázková data k migraci.

---

## 8. Co zbývá

Design je hotový — mechanismus „opakuje se" i rozdělení na dva boxy jsou probrané a schválené včetně
vizuálních náhledů. Zbývá:

- **Spec self-review a finální schválení** od uživatele.
- Přechod na implementační plán (`writing-plans`).
