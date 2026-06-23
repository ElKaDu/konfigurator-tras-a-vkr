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
| **Typ problému** (`ProblemType`) | Sdílený slovník pojmenovaných problémových situací (např. „Dlouho na clení") — definuje se jednou, odkazuje se z editoru trasy i z editoru pravidla. |

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

Nastavení **co musí být na záznamu** (AND podmínky nad tracking poli):

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

**Do budoucna:** Plánujeme přidat podmínky nad historií trackingu — „zásilka musí mít v historii status X před tímto záznamem".

#### Konfigurace situace `no_movement` — Zásilka bez pohybu

- Doba bez pohybu: číslo + jednotka (`h` / `d` / `bd`).
- Toggle: Ignorovat dobu na celním řízení (`ignoreClearance`).
- Systém nemá přirozený spouštěč — kontroluje se periodicky (typicky 2× denně).

**Do budoucna:** Odladíme podle produkčního chování. Plánujeme přidat podmínky zásilky specifické pro tuto situaci.

#### Konfigurace situace `stuck_location` — Zásilka zaseknutá na místě

- Počet po sobě jdoucích záznamů ze stejného místa: číslo.
- Shoda místa podle: `locationId` / `city` / `countryCode`.
- Volitelné: filter tracking záznamu co se do série počítá (pole + operátor + hodnota).
- Záznamy bez lokace (Label created apod.) se přeskakují.

**Do budoucna:** Zvážíme, zda situace `no_movement` a `stuck_location` sloučit nebo ponechat oddělené, a upřesníme chování podle produkce.

#### Podmínka zásilky — sdílená pro všechny tracking situace

V prostředním sloupci je sekce **Podmínka zásilky** — pravidlo se uplatní jen pro zásilky odpovídající těmto podmínkám. Využívá `VkrConditionsBuilder` (viz sekce 6).

#### Akce pro oblast `tracking_records`

Pouze jedna větev: **Podmínka splněna**. Akce se nerozdělují na splněno/nesplněno.

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

Akce: **dvě větve** — „Podmínka splněna" (`runWhenRouteCondition: fulfilled`) a „Podmínka nesplněna" (`runWhenRouteCondition: not_fulfilled`).

#### Výběr tras (`RouteScopePicker`)

Zobrazuje se pro všechny aktivní situace. Omezí pravidlo jen na vybrané trasy (výchozí = všechny trasy). Pro `missed_milestone` je navíc možnost trasy vyjmout (exclude).

#### Podmínky zásilky (`VkrConditionsBuilder`)

Zobrazuje se v prostředním sloupci pro všechny aktivní situace. Viz sekce 6.

#### Situace `delivery_day` — Kontrola v den doručení

Konfigurace:
1. **Výběr milníku** — radio-list typů milníků z `checkpointTypesStore`. Pravidlo sleduje tento milník na trase zásilky.
2. **Plán spuštění** — viz sekce 5.
3. Info: kontrola proběhne pouze v den, kdy carrier avizuje doručení. Pokud předchozí kontrola v daném dni uspěla, pozdější se přeskočí.

#### Situace `unexpected_location` — Zásilka v neočekávané lokaci

Podmínka je nastavena automaticky. Systém při každém příchozím tracking záznamu zkontroluje, zda země nebo lokace odpovídá některému bodu na standardní trase zásilky.

#### Situace `missed_milestone` — Kontrola splnění milníku

Konfigurace:
1. **Výběr tras** (`RouteScopePicker`) — s možností exclude.
2. **Výběr typu milníku** (`MilestoneTypePicker`) — systém sleduje tento typ milníku na trase zásilky.
3. Info: jakmile uplyne deadline a zásilka nemá platný tracking záznam, podmínka se splní. Deadliny nastavuješ v editoru trasy.

**Do budoucna:** Plán spuštění pro `missed_milestone` přidáme analogicky jako u `delivery_day`.

---

## 5. Plán spuštění (`ScheduleEditor`)

Plán spuštění určuje, **kdy se odešle VkŘ**. Systém může zásilku průběžně kontrolovat (spouštěč), ale VkŘ se odešle až v čase definovaném plánem.

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

### 5.2 Pravidlo přeskočení

Jakmile milník proběhne v pořádku, žádné pozdější časy z plánu spuštění v daném dni VkŘ neodešlou. Tím se zamezí situaci, kdy zásilka splní milník mezi první a druhou kontrolou a druhá kontrola by znovu odeslala „splněno".

### 5.3 Příklad: dvě kontroly pro 1. fyzický scan

Milník „1. Fyzický scan v cílové zemi" má deadline `event_time_of_day: after 08:00` (termín = 8:00 v den doručení).

- **Kontrola 1** — `time_of_day: 08:00` — zjistí, zda zásilka milník splnila.
- **Kontrola 2** — `relative_to_milestone_due: after 1h` = 9:00 — zachytí záznamy, které dorazily do systému se zpožděním, ale mají na sobě `event_time` 8:00 (zásilka prošla včas, scan se jen pozdě propsal). Vyhodnocuje se `event_time`, ne čas příchodu záznamu.

### 5.4 Otevřená otázka: více kontrol pro stejný milník — jedno vs. dvě pravidla

Pokud má pravidlo více položek v plánu spuštění (více běhů), přeskočení při úspěchu probíhá automaticky v rámci jednoho pravidla.

Pokud jsou dvě kontroly nastaveny jako **dvě samostatná pravidla** pro stejný milník, lze přeskočení druhého pravidla nastavit přes `skipConditions` — pokud první pravidlo dnes dopadlo pozitivně, druhé se přeskočí. V situaci `delivery_day` by šlo toto přeskočení nastavit automaticky.

Alternativní přístup: vždy nastavovat více kontrol jako jedno pravidlo a výběr, kterého běhu se daná akce týká, řešit v akci samotné (např. `runAtScheduleTime`). **Toto ještě dořešíme.**

---

## 6. Podmínky zásilky (`VkrConditionsBuilder`)

Podmínky zásilky (`VkrCondition[]`) filtrují zásilky, pro které se pravidlo nebo konkrétní akce uplatní.

Využívají se na dvou místech:
1. **Na úrovni pravidla** — v prostředním sloupci pod konfigurací situace (platí pro celé pravidlo).
2. **Na úrovni akce** — každá akce má sekci „Podmínky zásilky" v pravém sloupci (platí jen pro tuto akci; ukládáno do `uiState.fulfilledActions[].shipmentConditions`).

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

**Příklad:** „DD - Kontrola 2 FedEx Facility — doručení přepravce je dnes" má podmínku `carrier_announced_delivery_at is_today`.

**Příklad:** „DD - Kontrola 2 FedEx Facility — datum doručení není dnes" má podmínku `carrier_announced_delivery_at is_tomorrow`.

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
  problems?: RouteProblem[];   // pokročilé podmínky
  parentRouteId?: ID;          // pro varianty trasy
  createdAt: string; updatedAt: string;
}
```
Tento model nemá segmenty — milníky jsou přímo na trase. Přibývají: **archivace**, **varianty trasy** (`parentRouteId`), **pokročilé podmínky** (`RouteProblem`). Export dat (`bytorp-export`) aktuálně stále exportuje Segment-based strukturu.

### 7.2 Varianty trasy (`parentRouteId`)

Trasa může mít varianty — sub-trasy propojené přes `parentRouteId` (v novém modelu). Varianty se používají pro PSČ-specifické větve nebo jiné odchylky. Kolize signatur (`carrier × serviceType × cílová země`) se kontrolují jen u hlavních tras, ne u variant.

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

**Doba trvání** se nenastavuje přímo na milníku (deprecated pole). Místo toho se vyjádří porovnáním dvou milníků — deadline druhého milníku je kotven na první. Příklad: „celní odbavení" a „celní odbavení dokončeno" s deadline do 3 h od prvního.

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

**Klíčová sémantika:** Correctness definuje **deadline** — milník musí nastat nejpozději do daného data/času. Pokud se matching tracking záznam objeví dříve (i jiný den, jiný čas) — milník je splněn. Vyhodnocuje se `event_time` záznamu, ne čas příchodu do systému.

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

### 7.7 Pokročilé podmínky trasy (`RouteProblem`, `ProblemType`)

V novém modelu (`routes/types.ts`) má trasa pole `problems?: RouteProblem[]`. Jde o pojmenované pokročilé podmínky odkazující do sdíleného slovníku `ProblemType`.

```ts
interface RouteProblem {
  problemTypeId: ID;
  logic: { operator: "AND" | "OR"; items: ProblemCondition[] };
}

type ProblemCondition =
  | { kind: "checkpoint_not_met"; checkpointId: ID }
  | { kind: "checkpoint_time_constraint"; checkpointId: ID; aspect: ...; operator: ...; anchor: ConditionAnchor };
```

Slovník `ProblemType` (`src/lib/routes/problemTypes.ts`) je uložen v localStorage. Seed obsahuje: „Možné zpoždění zásilky v den doručení", „Dlouho na clení", „Uvíznutí v hubu", „Doručení na špatné místo". Operátor je definuje jednou a pak je vybírá jak v editoru trasy, tak v editoru pravidla VkŘ.

### 7.8 PSČ scénáře na milnících (`appliesWhenDestZip`) — vize

V novém modelu může mít checkpoint podmínku PSČ:

```ts
appliesWhenDestZip?: RouteZipRange[];
// RouteZipRange: { country, prefix?, from?, to? }
// Příklady: "CZ 1xx" (Praha prefix), "US 38000–39999"
```

Checkpoint platí jen pro zásilky s cílovým PSČ odpovídajícím rozsahu. **V aktuálním prototypu tato funkce není dostupná — jde o vizi do budoucna.**

---

## 8. Přeskočení pravidla (`skipConditions`)

Pravidlo může být přeskočeno na základě výsledku jiného pravidla (ukládáno do `uiState.skipConditions`):

```ts
{ ruleId: string; outcome: "positive" | "negative" | "any" }[]
```

Pokud pravidlo s `ruleId` dnes vyhodnotilo zásilku jako `positive` (nebo `negative`), aktuální pravidlo se přeskočí.

Ve VkŘ modelu (`vkr/types.ts`) je strukturovanější: `skipIfPrior: { ruleIds: string[]; outcome: "any"|"positive"|"negative" }`.

**Příklad:** „DD - Kontrola 2 FedEx Facility" přeskočí, pokud „DD - Kontrola 1 FedEx Facility" dnes vyhodnotila zásilku jako pozitivní.

---

## 9. Storage

### 9.1 In-memory store (konfigurátor pravidel)

Pravidla konfigurátoru, trasy, úseky a typy milníků jsou uloženy **výhradně v paměti**. Žádná persistence mezi reloady. Seed je v `src/lib/model/seed.ts`.

Stores (`src/lib/model/store.ts`):
- `rulesStore` — `Rule[]` (z `model/types.ts`)
- `routesStore` — `Route[]`
- `segmentsStore` — `Segment[]`
- `checkpointTypesStore` — `CheckpointType[]`
- `sampleShipmentsStore` — `SampleShipment[]` (read-only)

### 9.2 localStorage (VkŘ pravidla a typy problémů)

- **VkŘ pravidla** — `src/lib/vkr/store.ts`, klíč `vkr_rules_v13`, migrace ze starších verzí (`v10`–`v12`).
- **Typy problémů** — `src/lib/routes/problemTypes.ts`, klíč `problem_types_v1`.

### 9.3 Log spuštění pravidel (`RunLogEntry`)

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

### 9.4 Export dat (`bytorp-export`)

Tlačítko „Export" generuje JSON (`src/lib/dataExport.ts`):

```json
{
  "kind": "bytorp-export", "version": "v1", "exportedAt": "...",
  "routes": [...], "segments": [...], "checkpointTypes": [...], "rules": [...]
}
```

Export stále používá Segment-based strukturu (starý model).

---

## 10. Navigace (TanStack Router)

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

## 11. Implementační mapa (kde co žije)

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
| Nový datový model trasy (Route, Checkpoint, ProblemCondition) | `src/lib/routes/types.ts` |
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

## 12. Poznámky a věci k dořešení

### 12.1 Milníky — deadline vs. doba trvání

Původní pole `expectedDurationHours`, `warnAfterHours`, `criticalAfterHours` jsou deprecated. Nová sémantika:
- **Deadline** (mode: fixed): milník musí nastat do daného ČASU v daný DEN. Vyhodnocuje se `event_time`, ne čas příchodu záznamu.
- **Vztah dvou milníků** (mode: offset, kotva = jiný checkpoint): nahrazuje „dobu trvání". Příklad: od celního odbavení do celního odbavení dokončeno musí být max. 3 hodiny.

### 12.2 Více kontrol pro stejný milník — jedno nebo dvě pravidla

Viz sekce 5.4. Toto je otevřená otázka, kterou ještě dořešíme.

### 12.3 Plán spuštění pro situaci `missed_milestone`

Zatím existuje jen pro `delivery_day`. Plánujeme přidat i pro `missed_milestone` — logika by byla identická.

### 12.4 Pokročilý spouštěč

Tlačítko „Pokročilé" u spouštěče je disabled mockup. Po zpřístupnění půjde ručně upravit typ spouštěče (plán / podmínka / manuální).

### 12.5 Podmínky nad historií trackingu

Pro situaci `tracking_event` plánujeme přidat třetí vrstvu podmínek: co musí být v předchozích záznamech trackingu (před příchozím záznamem).

### 12.6 AI asistent pro tvorbu pravidel (vize)

Do budoucna plánujeme AI asistenta (`AIWizard`), který umožní popsat textově, co chce uživatel řešit, a AI navrhne název, popis a nastavení pravidla. Implementace v kódu existuje (`src/components/vkr/AIWizard.tsx`), ale v aktuálním prototypu není viditelná — jde o vizi do budoucna.

### 12.7 Nový model trasy — postupné zavádění

Nový model (`routes/types.ts`) bez segmentů, s variantami, archivací a pokročilými podmínkami se postupně zavádí. Export dat zatím používá starý model.

### 12.8 Rizikové kotvy

`anchorRisk.ts` obsahuje seznam polí, jejichž hodnotu mění sám operátor nebo pravidla VkŘ (`promised_delivery_at`, `today_delivery_check_state` atd.). Pokud uživatel zvolí takové pole jako kotvu, editor zobrazí varování před možným cyklem.
