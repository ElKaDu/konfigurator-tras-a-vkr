# Specifikace: Konfigurátor pravidel

**Datum poslední revize:** 2026-06-23
**Status:** Living document — odráží aktuální stav kódu v repu.

> Dokument popisuje **aktuální** datový model a chování aplikace.
> Strukturní snippety jsou kopírovány 1:1 ze zdrojových souborů — spec nelže o tvaru dat.

---

## 1. Přehled a slovník

### 1.1 Co aplikace dělá

Aplikace má dvě hlavní sekce v top nav (`AppHeader`):

- **`/`** **Konfigurátor pravidel** — seznam existujících pravidel + tvorba nových přes průvodce.
- **`/trasy`** **Trasy zásilek** — definice tras (`Route`) se seznamem úseků (`Segment`), milníků a jejich časových podmínek.

Nové pravidlo se tvoří průvodcem (`/rules/new`) v třísloupcovém layoutu:
- **vlevo** — výběr oblasti a situace
- **uprostřed** — nastavení pravidla + konfigurace situace
- **vpravo** — akce

### 1.2 Slovník pojmů

| Pojem | Co to je |
|---|---|
| **Oblast** (`Area`) | Kategorie pravidla — určuje typ situace a dostupné podmínky. |
| **Pravidlo** (`Rule`) | Název + priorita + aktivní + spouštěč + podmínky zásilky + akce. V aplikaci existují dva odlišné Rule modely — viz sekce 3. |
| **Trasa** (`Route`) | Pokrytí `carrier × serviceType × cílová země` + uspořádaný seznam úseků. |
| **Úsek** (`Segment`) | Část trasy se seřazenými milníky. |
| **Milník** (`Checkpoint`) | Bod na úseku — definuje „co se musí v trackingu objevit" (Match) a deadline (Correctness). |
| **Deadline milníku** (`CheckpointCorrectness`) | Časová podmínka: milník musí nastat nejpozději do daného data/času vůči jiné události. Pokud se stane dříve — je to OK. |
| **Spouštěč** (`Trigger`) | Kdy systém pravidlo vyhodnotí — nastaveno automaticky dle situace, v UI zobrazen jako locked řádek. |
| **Plán spuštění** (`ScheduleItems`) | Kdy se odešle VkŘ — seznam časových položek (pevný čas nebo offset od termínu milníku). |
| **Podmínka zásilky** (`VkrCondition`) | Filtr zásilek v pravidle nebo v akci — VkŘ se odešle jen pro zásilky splňující podmínku. |
| **Složka** (`Folder`) | Organizační jednotka — pravidla VkŘ jsou řazena do složek. |

---

## 2. Oblasti (`Area`)

Definováno v `src/lib/model/areas.ts`.

```ts
export type Area = "tracking_records" | "route_compliance" | "order_eval" | "unpickup" | "params_price";
```

| ID | Label | Enabled |
|---|---|---|
| `tracking_records` | Záznamy z trackingu | ✅ |
| `route_compliance` | Soulad s předepsanou trasou | ✅ |
| `order_eval` | Vyhodnocení objednávky | ❌ brzy |
| `unpickup` | Nevyzvednutá objednávka | ❌ brzy |
| `params_price` | Parametry a cena | ❌ brzy |

---

## 3. Datové modely pravidla — dva paralelní systémy

V aplikaci existují **dva odlišné Rule modely**. Je důležité je neplézt.

### 3.1 Konfigurátor pravidel (`src/lib/model/types.ts`)

Jednodušší model používaný průvodcem `RuleCreatorPage`. Ukládá se do **in-memory store** (`rulesStore`).

```ts
export interface Rule {
  id: string; code: string; name: string; area: Area; active: boolean; priority: Priority;
  description?: string;
  trigger: { kind: TriggerKind; label: string };
  conditions: Condition[];
  actions: Action[];
  uiState?: Record<string, unknown>;  // snapshot UI stavu pro prefill při editaci
}
```

`conditions[]` se v aktuálním průvodci nevyužívají jako primární logika — konfigurace situace se ukládá do `uiState`. Podmínky zásilky (`VkrCondition[]`) se ukládají také do `uiState`.

`Action` v tomto modelu:

```ts
export interface Action {
  id: string; type: ActionType;
  runWhenRouteCondition?: "fulfilled" | "not_fulfilled";
  title?: string;
  vkrText?: string;   // text věci k řešení (popis pro operátora)
  body?: string; fieldId?: string; value?: string; priority?: Priority;
}
```

### 3.2 VkŘ pravidla (`src/lib/vkr/types.ts`)

Bohatší model používaný sekcí VkŘ (`src/components/vkr/`). Ukládá se do **localStorage** (`vkr_rules_v13`) včetně migrace ze starších verzí.

```ts
export interface Rule {
  id: string; code: string; name: string; description?: string;
  active: boolean; archivedAt?: string;
  folderId: string;
  priority: number;
  trigger: Trigger;
  conditionGroup: ConditionGroup;
  actions: Action[];
  throttleHours?: number;
  skipIfPrior?: RuleSkipIfPrior;
  activeWindow?: RuleActiveWindow;
  runs30d: number; lastRunAt?: string;
  history?: RunLogEntry[];
  createdAt: string; updatedAt: string;
}
```

Tento model má navíc:
- **`folderId`** — pravidla patří do složek
- **`archivedAt`** — archivace (víc než jen deaktivace)
- **`throttleHours`** — pravidlo se nespustí víckrát než jednou za N hodin pro stejnou zásilku
- **`skipIfPrior`** — přeskočení na základě výsledku jiného pravidla (`{ ruleIds, outcome: "any"|"positive"|"negative" }`)
- **`activeWindow`** — aktivační okno (`{ businessDaysOnly: boolean }`)
- **`runs30d`, `lastRunAt`, `history`** — log spuštění (viz sekce 9)
- **`conditionGroup`** — podmínky jako strom (AND/OR skupiny), ne flat pole

`Action` v tomto modelu je bohatší:

```ts
export interface Action {
  id: string; type: ActionType;
  title?: string; description?: string; priority?: Priority;
  assignMode?: "shipment_operator" | "specific_user" | "role" | "round_robin" | ...;
  deduplicate?: boolean;
  runWhenRouteCondition?: "fulfilled" | "not_fulfilled";
  runAtScheduleTime?: string[];   // spustit jen při vybraných časech z plánu
  runWhenField?: Array<{ fieldId; operator; value }>;  // podmínky zásilky per-akce
  // ... další pole pro email, poznámku, set_field atd.
}
```

---

## 4. Tvorba pravidla — průvodce (`RuleCreatorPage`)

### 4.1 Tok uživatele

```
/ (RulesList)
  → /rules/new        (layout)
      → /rules/new/   (RuleCreatorPage — výběr oblasti + konfigurace + akce)
```

Editace existujícího pravidla: `/rules/$ruleId/edit` — stejná komponenta s prefill z `uiState`.

Uložením se pravidlo zapíše do `rulesStore` a uživatel je přesměrován na `/`.

### 4.2 Oblast `tracking_records` — Záznamy z trackingu

Tři situační karty:

| ID | Ikona | Label | Spouštěč |
|---|---|---|---|
| `tracking_event` | Radio | Přišel konkrétní tracking záznam | Reaktivní — při každém novém záznamu |
| `no_movement` | PauseCircle | Zásilka bez pohybu po stanovenou dobu | Časový plán — kontroluje periodicky |
| `stuck_location` | LocateFixed | Zásilka zaseknutá na jednom místě | Reaktivní — při každém novém záznamu |

**Spouštěč** se zobrazuje jako zamčený řádek v prostředním sloupci. Vedle je tlačítko „Pokročilé" (zatím disabled mockup — plánujeme zpřístupnit pro ruční úpravu triggeru).

#### Konfigurace situace `tracking_event` — Přišel konkrétní tracking záznam

Nastavuje se **co musí splňovat posuzovaný záznam** (AND podmínky nad tracking poli):

| Pole | Label |
|---|---|
| `derivedStatus` | Odvozený status |
| `derivedStatusCode` | Kód odvozeného statusu |
| `eventType` | Typ záznamu |
| `eventDescription` | Popis události |
| `exceptionCode` | Kód výjimky |
| `exceptionDescription` | Popis výjimky |
| `locationType` | Typ místa |
| `locationId` | ID místa |
| `city` | Město |
| `countryCode` | Kód země |
| `postalCode` | PSČ |
| `deliveryAttempts` | Počet pokusů o doručení |
| `eventTime` | Čas záznamu |

Pro `eventTime` je k dispozici `TrackingTimeValueEditor` — výběr pevného času nebo offsetu od kotvy.

Více podmínek = AND. Pro alternativy (status A nebo B) se zadají do jednoho pole oddělené čárkou.

Dále lze nastavit **podmínku zásilky** — pravidlo se uplatní jen pro zásilky odpovídající těmto podmínkám (pole zásilky, ne tracking záznamu).

**Do budoucna:** Plánujeme přidat třetí vrstvu — podmínky nad **historií trackingu**: co musí být v předchozích záznamech, než přišel tento. Například „zásilka musí mít v historii status X před tímto záznamem".

Akce: pouze jedna větev — **Podmínka splněna**.

#### Konfigurace situace `no_movement` — Zásilka bez pohybu po stanovenou dobu

- Doba bez pohybu: číslo + jednotka (`h` / `d` / `bd`).
- Toggle: Ignorovat dobu na celním řízení (`ignoreClearance`) — stav celního řízení se do doby klidu nezapočítává.
- Podmínka zásilky (sdílená).
- Systém nemá přirozený spouštěč — kontroluje se periodicky (typicky 2× denně).

Akce: pouze jedna větev — **Podmínka splněna**.

#### Konfigurace situace `stuck_location` — Zásilka zaseknutá na jednom místě

- Počet po sobě jdoucích záznamů ze stejného místa: číslo.
- Shoda místa podle: `locationId` / `city` / `countryCode`.
- Volitelné: filter tracking záznamu, který se do série počítá (pole + operátor + hodnota).
- Záznamy bez lokace (Label created apod.) se přeskakují.
- Podmínka zásilky (sdílená).

Akce: pouze jedna větev — **Podmínka splněna**.

**Do budoucna:** Situace `no_movement` a `stuck_location` odladíme podle produkčního chování. Zvážíme, zda situace sloučit nebo ponechat oddělené, případně jinak přizpůsobit. V obou situacích plánujeme upřesnit, jaké podmínky zásilky a podmínky nad historií trackingu dávají smysl.

---

### 4.3 Oblast `route_compliance` — Soulad s předepsanou trasou

Čtyři situační karty (situace `other` je disabled):

| ID | Ikona | Label | Spouštěč |
|---|---|---|---|
| `delivery_day` | Clock | Kontrola v den doručení | Časový plán (schedule) |
| `unexpected_location` | MapPin | Zásilka v neočekávané lokaci | Reaktivní (condition_met) |
| `missed_milestone` | AlertTriangle | Kontrola splnění milníku | Reaktivní — při překročení limitu milníku |
| `other` | Zap | Jiná situace | — (disabled) |

**Spouštěč** — zamčený řádek + disabled tlačítko „Pokročilé" (stejné jako u tracking_records).

Akce: **dvě větve** — „Podmínka splněna" (`runWhenRouteCondition: fulfilled`) a „Podmínka nesplněna" (`runWhenRouteCondition: not_fulfilled`). Každá akce může mít navíc vlastní podmínky zásilky — akce se spustí jen pro zásilky splňující tyto podmínky.

#### Výběr tras (`RouteScopePicker`)

Zobrazuje se pro všechny aktivní situace. Omezí pravidlo jen na vybrané trasy (výchozí = všechny trasy). Pro `missed_milestone` je navíc možnost trasy vyjmout (exclude).

#### Podmínky zásilky (`VkrConditionsBuilder`)

Zobrazuje se v prostředním sloupci pro všechny aktivní situace. Pravidlo se uplatní jen pro zásilky splňující tyto podmínky. Viz sekce 6.

#### Situace `delivery_day` — Kontrola v den doručení

Konfigurace:
1. **Výběr milníku** — radio-list typů milníků z `checkpointTypesStore`. Pravidlo sleduje tento milník na trase zásilky.
2. **Podmínky zásilky** — volitelné filtrování zásilek (např. jen zásilky, kde carrier avizuje doručení dnes).
3. **Plán spuštění** — viz sekce 5.

Info: kontrola proběhne pouze v den, kdy carrier avizuje doručení. Pokud předchozí kontrola v daném dni uspěla, pozdější se přeskočí.

**Příklad — dvě kontroly pro 1. fyzický scan:**

Milník „1. Fyzický scan v cílové zemi" má deadline 8:00 v den doručení. Pravidlo má dvě položky v plánu spuštění:

- **Kontrola v 8:00** — spouštěč kontroluje zásilky průběžně (např. každých 10 minut), ale VkŘ se odesílá až v 8:00. Zjistí, zda zásilka milník splnila.
- **Kontrola v 9:00** (= 1 h po termínu milníku) — zachytí záznamy, které dorazily do systému se zpožděním, ale mají na sobě `event_time` 8:00. Zásilka fyzicky prošla včas, scan se jen pozdě propsal. Vyhodnocuje se čas uvedený na záznamu, ne čas kdy záznam dorazil do systému.

Pokud první kontrola v 8:00 dopadla úspěšně (milník splněn), druhá kontrola v 9:00 VkŘ neodešle — přeskočí se automaticky.

**Příklad — podmínky zásilky pro pravidlo:**

Pravidlo „DD - Kontrola 2 FedEx Facility — doručení přepravce je dnes" má podmínku zásilky `carrier_announced_delivery_at is_today` — spustí se jen tehdy, když carrier avizuje doručení na dnešek.

Pravidlo „DD - Kontrola 2 FedEx Facility — datum doručení není dnes" má podmínku `carrier_announced_delivery_at is_tomorrow` — reaguje, když doručení je naplánováno na zítra.

#### Situace `unexpected_location` — Zásilka v neočekávané lokaci

Podmínka je nastavena automaticky. Systém při každém příchozím tracking záznamu zkontroluje, zda země nebo lokace odpovídá některému bodu na standardní trase zásilky.

#### Situace `missed_milestone` — Kontrola splnění milníku

Konfigurace:
1. **Výběr tras** (`RouteScopePicker`) — s možností exclude.
2. **Výběr typu milníku** (`MilestoneTypePicker`) — systém sleduje tento typ milníku na trase zásilky.
3. **Podmínky zásilky** — volitelné filtrování zásilek.
4. Info: jakmile uplyne deadline a zásilka nemá platný tracking záznam, podmínka se splní. Deadliny nastavuješ v editoru trasy.

**Do budoucna:** Plán spuštění pro `missed_milestone` přidáme analogicky jako u `delivery_day` — kontrola v pevný čas nebo relativně k termínu sledovaného milníku.

---

## 5. Plán spuštění (`ScheduleEditor`)

Plán spuštění určuje, **kdy se odešle VkŘ**. Spouštěč může zásilky kontrolovat průběžně (např. každých 10 minut), ale VkŘ se odešle až v čase z plánu spuštění.

Plán je seznam položek (`ScheduleItem[]`) — lze přidat více položek různých typů.

### 5.1 Typy položek plánu

```ts
type ScheduleItem =
  | {
      kind: "time_of_day";
      time: string;               // "HH:MM"
      tzMode: "destination" | "fixed";
      tz?: string;                // jen pro tzMode="fixed"
    }
  | {
      kind: "relative_to_milestone_due";
      position: "before" | "at" | "after";
      amount: number;
      unit: "min" | "h";
    };
```

**`time_of_day`** — pevný denní čas. Výběr TZ: cílová země zásilky nebo konkrétní timezone.

**`relative_to_milestone_due`** — offset od termínu milníku:
- `before` — N min/h před termínem
- `at` — přesně v termínu milníku
- `after` — N min/h po termínu

**Termín milníku** = pole `event_time_of_day` (mode: fixed) v Match podmínkách checkpointu daného typu na úseku, kterým zásilka prochází. Pokud má úsek víc časových podmínek, jako termín se bere „nejpozději do". Pokud milník nemá `event_time_of_day`, úseky s tímto milníkem se pro relativní plán přeskočí.

### 5.2 Pravidlo přeskočení při úspěchu

Jakmile milník proběhne v pořádku, žádné pozdější časy z plánu spuštění v daném dni VkŘ neodešlou. Tím se zamezí situaci, kdy zásilka splní milník mezi první a druhou kontrolou a druhá kontrola by znovu odeslala „splněno".

### 5.3 Otevřená otázka: více kontrol — jedno nebo dvě pravidla

Pokud má pravidlo více položek v plánu spuštění (více běhů), přeskočení při úspěchu probíhá automaticky v rámci jednoho pravidla.

Pokud jsou dvě kontroly nastaveny jako **dvě samostatná pravidla** pro stejný milník, přeskočení druhého pravidla při úspěchu prvního lze nastavit přes `skipIfPrior` (VkŘ model) nebo `skipConditions` (uiState). V situaci `delivery_day` by šlo toto přeskočení nastavit automaticky.

Alternativní přístup: vždy nastavovat více kontrol jako jedno pravidlo a výběr, které akce se týkají kterého běhu, řešit přímo v akcích (např. `runAtScheduleTime`). **Toto ještě dořešíme.**

---

## 6. Podmínky zásilky (`VkrConditionsBuilder`)

Podmínky zásilky (`VkrCondition[]`) filtrují zásilky, pro které se pravidlo nebo konkrétní akce uplatní.

Využívají se na dvou místech:
1. **Na úrovni pravidla** — v prostředním sloupci pod konfigurací situace (platí pro celé pravidlo).
2. **Na úrovni akce** — každá akce má sekci „Podmínky zásilky" v pravém sloupci (platí jen pro tuto akci; ukládáno do `uiState`).

```ts
interface VkrCondition {
  id: string;
  fieldId: string;
  operator: string;    // "is_today" | "is_tomorrow" | "within_days" | ...
  value: string;
}
```

Dostupná pole jsou všechna pole zásilky (katalog z `src/lib/vkr/fields/catalog.shipment.ts`). Příklady:
- `carrier_announced_delivery_at` — datum doručení hlášené dopravcem (`is_today`, `is_tomorrow`, `within_days`)
- `customer.tenure` — zákazník (`is` / `is_not`, hodnoty: `new`, `longterm`)

---

## 7. Trasy (`Route`), úseky (`Segment`) a milníky (`Checkpoint`)

### 7.1 Dva modely trasy

V repozitáři existují dva modely:

**Aktuální (aktivní) model** — `src/lib/model/types.ts`:
```ts
export interface Route {
  id: string; code: string; name: string; active: boolean;
  carriers: string[]; serviceTypes: string[]; destCountries: string[];
  segmentIds: string[];    // uspořádané odkazy na úseky
  destZone?: string[];
}
```
Trasa odkazuje na úseky přes `segmentIds`. Milníky jsou na úsecích.

**Nový model (připravený, postupně zaváděný)** — `src/lib/routes/types.ts`:
```ts
export interface Route {
  id: string; code: string; name: string; description?: string;
  active: boolean; archivedAt?: string;
  carriers: string[]; serviceTypes: string[]; destCountries: string[];
  checkpoints: Checkpoint[];   // milníky přímo na trase, žádné segmenty
  parentRouteId?: ID;          // pro varianty trasy
  createdAt: string; updatedAt: string;
}
```
Tento model nemá segmenty — milníky jsou přímo na trase. Přibývají: archivace, varianty trasy (`parentRouteId`). Export dat (`bytorp-export`) aktuálně stále exportuje Segment-based strukturu.

### 7.2 Varianty trasy (`parentRouteId`) — vize

Trasa může mít varianty — sub-trasy propojené přes `parentRouteId` (v novém modelu). Kolize signatur (`carrier × serviceType × cílová země`) se kontrolují jen u hlavních tras, ne u variant. **V aktuálním prototypu varianty nejsou dostupné.**

### 7.3 Úsek (`Segment`) — aktuální model

```ts
export interface Segment {
  id: string;
  name: string;
  description?: string;
  carriers: string[];
  serviceTypes: string[];
  checkpoints: Checkpoint[];
}
```

### 7.4 Checkpoint (milník) — aktuální model

```ts
export interface Checkpoint {
  id: string;
  checkpointTypeId: string;
  note?: string;
  match: CheckpointMatch;
  correctness: CheckpointCorrectness[];   // prázdné = jen "musí nastat"

  // @deprecated — nahrazeno correctness:
  expectedDurationHours?: number;
  warnAfterHours?: number;
  criticalAfterHours?: number;
}
```

**Doba trvání** se nenastavuje přímo na milníku (deprecated pole). Místo toho se vyjádří porovnáním dvou milníků — deadline druhého milníku je kotven na první. Příklad: milník „celní odbavení" a milník „celní odbavení dokončeno" s deadline do 3 h od prvního.

### 7.5 `CheckpointMatch` — co se musí v trackingu objevit

Definuje podmínky nad tracking záznamem (všechna pole = AND).

**Aktuální model** (`model/types.ts`, snake_case):

Základní pole: `status`, `status_code`, `status_type`, `exception_code`, `location_country_code`, `location_postal_code`, `location_city`, `location_type`, `latest`, `zip_matches_destination`, `free_text`.

**Nový model** (`routes/types.ts`, camelCase) přidává:
`statusDescription`, `simplifiedDescription`, `locationCountry`, `locationProvinceCode`, `locationSlic`, `locationId`, `ancillaryAction`, `ancillaryReason`, `ancillaryActionDescription`, `ancillaryReasonDescription`, `eventId`, `zipMatchesDestination` (s `mode: "exact"|"prefix"`).

**Speciální pole `event_time_of_day`** (aktuální model) — čas uvedený na záznamu:

```ts
event_time_of_day?: {
  mode?: "fixed" | "offset";

  // fixed — pevný HH:MM:
  op?: "before" | "after" | "between" | "eq";
  from?: string;   // "HH:MM"
  to?: string;     // pro op = "between"
  tz?: TimezoneRef;

  // offset — časový odstup od kotvy:
  offsetOp?: "within" | "longer_than" | "exact";
  offsetValue?: number;
  offsetUnit?: "min" | "h" | "d" | "bd";
  offsetDirection?: "before" | "after";
  anchorKind?: "checkpoint" | "system_event";
  anchorId?: string;
  anchorLabel?: string;
};
```

`event_time_of_day` (mode: fixed) slouží zároveň jako **termín milníku** pro plán spuštění (`relative_to_milestone_due`).

### 7.6 `CheckpointCorrectness` — deadline milníku

**Klíčová sémantika:** Correctness definuje **deadline** — milník musí nastat nejpozději do daného data/času. Pokud se matching tracking záznam objeví dříve (i jiný den, jiný čas) — milník je splněn. Vyhodnocuje se `event_time` záznamu, ne čas příchodu do systému. To, kdy záznam reálně dorazil, se vyhodnocuje na pravidle (plán spuštění), ne na milníku.

```ts
export interface CheckpointCorrectness {
  id: string;
  mode?: "fixed" | "offset";    // default "offset" pro zpětnou kompatibilitu

  // kotva — společná pro oba módy
  anchorKind: "checkpoint" | "system_event" | "field" | "absolute_time";
  anchorLabel: string;
  anchorCheckpointTypeId?: string;

  // === OFFSET varianta ===
  // Milník musí nastat do/za N hod/dní od kotvy.
  operator: "within" | "longer_than" | "exact";
  value?: number; unit?: "h" | "d" | "bd";
  specificTime?: string;    // "HH:MM" — upřesnění, pokud unit = d/bd

  // === FIXED varianta ===
  // Pevný čas (HH:MM) v den kotvy ± N dní.
  fixedOp?: "before" | "after" | "eq" | "between";
  fixedTime?: string;       // "HH:MM"
  fixedTimeTo?: string;     // pro op = "between"
  fixedTz?: TimezoneRef;
  fixedDayOffset?: number;  // počet dní před/po kotevním dni
  fixedDayMode?: "calendar" | "business";
  fixedDayDirection?: "before" | "after";
}
```

**Mode `fixed`:** Kotva určuje **den** (ne čas). `fixedTime` určuje čas v tento den. `fixedDayOffset: 0` = ten samý den jako kotva.

**Příklad — fixed:** Milník „1. Fyzický scan v cílové zemi" má deadline: kotva = `sys_add` (avizované doručení zákazníkovi), `fixedOp: "after"`, `fixedTime: "09:00"`, `fixedDayOffset: 0`. Deadline = nejpozději 9:00 v den ADD. Pokud zásilka projde milníkem kdykoliv předtím (i den dřív), je to v pořádku.

**Příklad — offset / vztah dvou milníků:** Milník „celní odbavení dokončeno" má deadline: kotva = checkpoint „celní odbavení", `operator: "within"`, `value: 3`, `unit: "h"`. Deadline = do 3 hodin od záznamu celního odbavení. Toto nahrazuje dřívější pole „doba trvání" — vyjadřuje se porovnáním dvou milníků vůči sobě.

**Systémové události (kotvy) — aktuální model:**

| ID v datech | Label |
|---|---|
| `sys_pickup` | Vyzvednutí zásilky |
| `sys_add` | Avizované doručení zákazníkovi (ADD) |
| `sys_created` | Vytvoření zásilky |
| `sys_order_created` | Vytvoření objednávky |
| `sys_carrier_delivery` | Doručení hlášené dopravcem |

**Systémové události — nový model** (`routes/types.ts`, jiné klíče):

| ID | Label |
|---|---|
| `shipment_pickup` | Vyzvednutí zásilky |
| `carrier_announced_delivery_at` | Doručení hlášené dopravcem |
| `shipment_created` | Vytvoření zásilky |
| `order_created` | Vytvoření objednávky |
| `promised_delivery_at` | Avizované doručení zákazníkovi |

---

## 8. Storage

### 8.1 In-memory store (konfigurátor pravidel)

Pravidla konfigurátoru, trasy, úseky a typy milníků jsou uloženy **výhradně v paměti**. Žádná persistence mezi reloady. Seed je v `src/lib/model/seed.ts`.

Stores (`src/lib/model/store.ts`):
- `rulesStore` — `Rule[]` (z `model/types.ts`)
- `routesStore` — `Route[]`
- `segmentsStore` — `Segment[]`
- `checkpointTypesStore` — `CheckpointType[]`
- `sampleShipmentsStore` — `SampleShipment[]` (read-only)

### 8.2 localStorage (VkŘ pravidla a typy problémů)

- **VkŘ pravidla** — `src/lib/vkr/store.ts`, klíč `vkr_rules_v13`, migrace ze starších verzí (`v10`–`v12`).
- **Typy problémů** — `src/lib/routes/problemTypes.ts`, klíč `problem_types_v1`.

### 8.3 Log spuštění pravidel (`RunLogEntry`)

VkŘ pravidla (model `vkr/types.ts`) mají:
- `runs30d: number` — počet spuštění za 30 dní
- `lastRunAt?: string` — čas posledního spuštění
- `history?: RunLogEntry[]` — záznamy běhů

```ts
interface RunLogEntry {
  at: string; shipmentRef: string; conditionsMet: boolean;
  outcome: "vkr_created" | "throttled" | "deduplicated" | "condition_false_after_wait" | "error";
  detail?: string;
  triggeringEventTimestamp?: string;
}
```

### 8.4 Export dat (`bytorp-export`)

Tlačítko „Export" generuje JSON (`src/lib/dataExport.ts`):

```json
{
  "kind": "bytorp-export", "version": "v1", "exportedAt": "...",
  "routes": [...], "segments": [...], "checkpointTypes": [...], "rules": [...]
}
```

Export stále používá Segment-based strukturu (starý model).

---

## 9. Navigace (TanStack Router)

| Cesta | Co dělá |
|---|---|
| `/` | Tabulka pravidel (`RulesList`) |
| `/rules/new` | Layout průvodce |
| `/rules/new/` | Průvodce tvorbou pravidla (`RuleCreatorPage`) |
| `/rules/$ruleId/edit` | Editace existujícího pravidla (`RuleCreatorPage` s prefill) |
| `/trasy` | Seznam tras a úseků (`RoutesAndSegmentsPage`) |
| `/trasa/$id` | Editor konkrétní trasy (`RouteEditorPage`) |
| `/usek/$id` | Editor úseku s milníky a deadlines (`SegmentEditorPage`) |
| `/test` | Testovací panel (`TestPanel`) |

---

## 10. Implementační mapa (kde co žije)

### Konfigurátor pravidel

| Co | Soubor |
|---|---|
| Datové typy — Rule, Segment, Checkpoint, Action (starý model) | `src/lib/model/types.ts` |
| Oblasti (AREAS) | `src/lib/model/areas.ts` |
| In-memory stores | `src/lib/model/store.ts` |
| Seed data | `src/lib/model/seed.ts` |
| Export dat (bytorp-export) | `src/lib/dataExport.ts` |
| Průvodce tvorbou/editací pravidla | `src/components/rules/RuleCreatorPage.tsx` |
| Editor plánu spuštění | `src/components/rules/editors/ScheduleEditor.tsx` |
| Picker výběru tras | `src/components/rules/editors/RouteScopePicker.tsx` |
| Picker typu milníku | `src/components/rules/editors/MilestoneTypePicker.tsx` |
| Builder podmínek zásilky | `src/components/rules/editors/VkrConditionsBuilder.tsx` |
| Editor podmínek trackingu + čas záznamu | `src/components/rules/editors/TrackingTimeValueEditor.tsx` |
| Soulad s trasou — select milníku | `src/components/rules/editors/RouteComplianceEditor.tsx` |
| Seznam pravidel | `src/components/rules/RulesList.tsx` |
| Ikony oblastí | `src/components/common/areaIcons.ts` |

### Trasy a úseky

| Co | Soubor |
|---|---|
| Nový datový model trasy (Route, Checkpoint) | `src/lib/routes/types.ts` |
| Store tras (nový model) | `src/lib/routes/store.ts` |
| Sdílený slovník typů problémů | `src/lib/routes/problemTypes.ts` |
| Katalog pozorovaných hodnot (autocomplete) | `src/lib/routes/observedCatalog.ts` |
| Varování před rizikovými kotvami | `src/lib/routes/anchorRisk.ts` |
| Popis trasy/checkpointu v textu | `src/lib/routes/describe.ts` |
| Výpočty pracovních dní | `src/lib/routes/businessDays.ts` |
| Katalog zemí | `src/lib/routes/countries.ts` |
| Mock data tras | `src/lib/routes/mockData.ts` |
| Trasy + úseky (přehled) | `src/components/routes/RoutesAndSegmentsPage.tsx` |
| Editor trasy | `src/components/routes/RouteEditorPage.tsx` |
| Editor pokrytí trasy (carriers, countries) | `src/components/routes/CoverageEditor.tsx` |
| Editor pokročilých podmínek trasy | `src/components/routes/ProblemsEditor.tsx` |
| Vizualizace trasy (mapa milníků) | `src/components/routes/RouteMap.tsx` |
| Knihovna typů milníků | `src/components/routes/MilestoneLibrary.tsx` |
| Editor úseku (milníky, deadlines) | `src/components/routes/SegmentEditorPage.tsx` |
| Wizard tvorby milníku | `src/components/routes/CheckpointWizard.tsx` |

### VkŘ pravidla

| Co | Soubor |
|---|---|
| Datové typy VkŘ — Rule, Trigger, Schedule, Condition, Action (bohatý model) | `src/lib/vkr/types.ts` |
| Store VkŘ pravidel (localStorage) | `src/lib/vkr/store.ts` |
| Katalog polí zásilky pro podmínky | `src/lib/vkr/fields/catalog.shipment.ts` |
| Katalog tracking polí | `src/lib/vkr/fields/catalog.tracking.ts` |
| Plán spuštění — typy a enum | `src/lib/vkr/fields/schedule.ts` |
| Mock data VkŘ pravidel | `src/lib/vkr/mockData.ts` |
| Tabulka VkŘ pravidel | `src/components/vkr/RulesTable.tsx` |
| Sidebar složek | `src/components/vkr/FoldersSidebar.tsx` |
| Detail pravidla (read-only panel) | `src/components/vkr/RuleDetailPanel.tsx` |
| Dialog editace pravidla | `src/components/vkr/RuleEditorDialog.tsx` |

---

## 11. Poznámky a věci k dořešení

### 11.1 Milníky — deadline vs. doba trvání

Původní pole `expectedDurationHours`, `warnAfterHours`, `criticalAfterHours` jsou deprecated. Nová sémantika:
- **Deadline** (mode: fixed): milník musí nastat do daného ČASU v daný DEN. Vyhodnocuje se `event_time` na záznamu, ne čas příchodu záznamu do systému.
- **Vztah dvou milníků** (mode: offset, kotva = jiný checkpoint): nahrazuje „dobu trvání".

### 11.2 Více kontrol pro stejný milník — jedno nebo dvě pravidla

Viz sekce 5.3. Toto je otevřená otázka, kterou ještě dořešíme.

### 11.3 Plán spuštění pro situaci `missed_milestone`

Zatím existuje jen pro `delivery_day`. Plánujeme přidat i pro `missed_milestone` — logika by byla identická.

### 11.4 Pokročilý spouštěč

Tlačítko „Pokročilé" u spouštěče je disabled mockup. Po zpřístupnění půjde ručně upravit typ spouštěče (plán / podmínka / manuální).

### 11.5 Podmínky nad historií trackingu

Pro situaci `tracking_event` plánujeme přidat podmínky nad historií trackingu — co musí být v předchozích záznamech, než přišel aktuální záznam.

### 11.6 PSČ jako kritérium přiřazení trasy (vize)

Nyní se trasa nastavuje pro určité cílové **země** (carrier × serviceType × cílová země). Do budoucna plánujeme umožnit nastavit trasu i pro konkrétní **PSČ nebo rozsahy PSČ**. Zásilky budou primárně párovány s trasou podle PSČ — pokud se najde shoda, použije se tato trasa. Pokud ne, systém spadne zpět na párování podle země.

### 11.7 AI asistent pro tvorbu pravidel (vize)

Do budoucna plánujeme AI asistenta, který umožní popsat textově, co chce uživatel řešit, a AI navrhne název, popis a nastavení pravidla. Implementace v kódu existuje (`src/components/vkr/AIWizard.tsx`), ale v aktuálním prototypu není viditelná.

### 11.8 Nový model trasy — postupné zavádění

Nový model (`routes/types.ts`) bez segmentů, s archivací a variantami se postupně zavádí. Export dat zatím používá starý model.

### 11.9 Rizikové kotvy

`anchorRisk.ts` obsahuje seznam polí, jejichž hodnotu mění sám operátor nebo pravidla VkŘ (`promised_delivery_at`, `today_delivery_check_state` atd.). Pokud uživatel zvolí takové pole jako kotvu, editor zobrazí varování před možným cyklem.
