# Specifikace: Konfigurátor pravidel Věcí k řešení (VkŘ)

**Datum poslední revize:** 2026-06-10
**Status:** Living document — odráží aktuální stav kódu v repu.

> Dokument popisuje **aktuální** datový model a chování aplikace.
> U klíčových rozhodnutí uvádí i krátké **proč** (motivace, alternativy,
> reálné use-case). Strukturní snippety jsou kopírovány 1:1
> z `src/lib/vkr/types.ts` a `src/lib/routes/types.ts` — spec nelže
> o tvaru dat.

---

## 1. Přehled, cíle a slovník

### 1.1 Co aplikace dělá

Aplikace má dvě hlavní sekce v top nav (`AppHeader`):

- **/** **Konfigurátor pravidel** — administrátoři zde definují **pravidla**,
  podle nichž systém vytváří **Věci k řešení (VkŘ)** pro operátory.
- **/trasy** **Trasy zásilek** — operátoři zde definují **obchodní trasy**
  (dopravce × varianta přepravy × cílová země), jejich **checkpointy**
  a **pokročilé podmínky** (kdy je na trase splněna situace, kterou pak využívají pravidla).

Obě sekce jsou propojené přes podmínku `route_compliance` v pravidle —
pravidlo se může opřít o „je tato zásilka v souladu s touto trasou?"
bez toho, aby muselo samo definovat detaily checkpointu.

### 1.2 Slovník pojmů

| Pojem | Co to je | Co to **není** |
|---|---|---|
| **Pravidlo** (`Rule`) | Záznam v Konfigurátoru — Spouštěč + Podmínky + Akce. | Není VkŘ — VkŘ je výstup pravidla. |
| **VkŘ** (`Věc k řešení`) | Strukturovaný task pro operátora vázaný na zásilku. | Není pravidlo — VkŘ vzniká *z* pravidla nebo manuálně. |
| **Spouštěč** (`Trigger`) | Kdy se pravidlo vyhodnotí. 3 typy: `schedule`, `condition_met`, `manual`. | Není podmínka — spouštěč rozhoduje *kdy*, podmínka rozhoduje *zda*. |
| **Trasa** (`Route`) | Pokrytí `carrier × varianta přepravy × cílová země` + seznam checkpointů + pokročilé podmínky. | Trasa nemá PSČ — PSČ jsou na jednotlivých checkpointech. |
| **Checkpoint** | Definice **tvaru konkrétního záznamu v `tracking.activities[]`**, který má na trase nastat. Engine prochází tracking záznamy a hledá ten, který splňuje všechna vyplněná pole `CheckpointMatch` (AND). | Nemá vlastní timing — čas se řeší výhradně v pokročilých podmínkách (sekce 6). |
| **Pokročilá podmínka (na trase)** (`ProblemCondition`) | Pojmenovaná situace na trase (`checkpoint_not_met` / `checkpoint_time_constraint`), na kterou se pravidla odkazují přes `problemTypeId`. | Není podmínka v pravidle — žije v definici trasy. Pravidlo se na ni dotazuje přes `route_compliance`. |
| **`problemType`** | Slovníkový záznam („Možné zpoždění", „Dlouho na clení") sdílený mezi trasami a pravidly. | Není detail logiky — jen pojmenovaný kbelík, do kterého trasy vkládají konkrétní logiku. |

### 1.3 Princip „AI jen při tvorbě, runtime je deterministický"

AI smí asistovat při **vytváření** pravidla (přirozený jazyk → JSON, viz
sekce 11). Při **vyhodnocení** pravidla na zásilce AI nikdy nevstupuje —
evaluator je čistá funkce nad datovým modelem. Důvod: predikovatelnost,
auditovatelnost, žádné „proč mi to dnes nezareagovalo".

---

## 2. Datový model pravidla (`Rule`)

Definice je v `src/lib/vkr/types.ts`. Pole jsou minimalistická záměrně —
co nebylo potřeba pro reálné use-cases, do modelu nevstoupilo.

```ts
export interface Rule {
  id: string;
  code: string;                 // Lidský kód (E10, E11, …) pro orientaci v tabulce
  name: string;
  description?: string;
  active: boolean;
  archivedAt?: string;          // Soft-delete
  folderId: string;             // Složka (A–H podle fáze zásilky)
  priority: number;             // 1 = nejvyšší, pořadí při souběhu

  trigger: Trigger;             // viz 2.2
  conditionGroup: ConditionGroup; // strom AND/OR, viz 3
  actions: Action[];            // sekvenčně, viz 4

  throttleHours?: number;       // Max 1× spustit per zásilka za N hodin
  skipIfPrior?: RuleSkipIfPrior;// viz 2.4
  activeWindow?: { businessDaysOnly: boolean };

  runs30d: number;              // Telemetrie pro tabulku pravidel
  lastRunAt?: string;
  history?: RunLogEntry[];      // Auditní log

  createdAt: string;
  updatedAt: string;
}
```

**Proč žádné `routeIds`:** Pravidlo se k trase neváže přímo, ale přes
podmínku `route_compliance`. To znamená, že jedno pravidlo může pokrýt
desítky tras (skrz `problemTypeId`), aniž bychom je museli vyjmenovat.
Pokud chcete „toto pravidlo jen pro FedEx CZ", přidejte AND podmínku
`carrier = FEDEX AND destination_country = CZ`.

### 2.1 Folder

Složky (`A`–`H`) odpovídají fázím zásilky:

- **A** Vyhodnocení objednávky/zásilky · **B** Vyzvednutí · **C** Průběh přepravy
- **D** Celní řízení · **E** Doručení · **F** Netrackované zásilky
- **G** Finanční parametry · **H** Eskalace

V seedu je naplněna jen složka **E — Doručení** (viz sekce 10).

### 2.2 Spouštěče (3 typy)

```ts
export type TriggerType = "schedule" | "condition_met" | "manual";
```

| Typ | Kdy se vyhodnotí | Typický use-case |
|---|---|---|
| `schedule` | V pevných HH:MM časech podle `Schedule.times[]` + `timezone`. | „Každý den v 8:00 TZ cíle zkontroluj …" |
| `condition_met` | Reaktivně, při každé změně dat zásilky / tracking eventu. | „Hned, jak CP1 doběhne déle než 2 h před CP2 …" |
| `manual` | Jen z UI — operátor klikne „Otestovat / Spustit". | Ad-hoc běh. |

**Proč jen 3:** Většina specializovaných spouštěčů (`field_change`,
`status_change`, `tracking_event`, `shipment_created`, `order_created`,
`vkr_status_change`) je jen speciální případ `condition_met` — engine
je tak jako tak čte ze stejného event busu a porovnává proti podmínkám.
Jeden obecný typ = jednotná semantika throttle, dedup a jedno UI pro
autora pravidla. Konkrétně:

- „Spusť, když pole `phase` přejde na `Celní řízení`" =
  `trigger: condition_met` + podmínka `field_changed_to phase=Celní řízení`.
- „Spusť při vytvoření zásilky" = `condition_met` + podmínka
  `field_state_duration` se `durationAnchor: shipment_created` a
  `durationMinutes: 0`.

### 2.3 `Schedule.times[]` — pole pevných časů s TZ

```ts
export interface ScheduleTimeItem {
  kind: "time_of_day";
  time: string;          // "HH:MM"
  timezone?: TimezoneSpec;
}

export interface Schedule {
  mode: "once" | "daily" | "weekly" | "monthly" | "interval" | "relative_to_field";
  times?: ScheduleTimeItem[];   // Kanonický seznam časů
  timezone?: TimezoneSpec;      // Globální TZ pro `time_of_day` bez vlastní
  // … weekly/monthly/interval rozšíření, viz typ Schedule
}
```

**Proč `times[]` jako homogenní pole pevných časů:** Reálné pravidlo
ze seedu (R3 v 10:00) potřebuje, aby se na různých časech (8:00 → 9:00 →
10:00) chovala stejná logika *jinak*. Místo aby každý čas byl vlastní
pravidlo, je v `times[]` seznam HH:MM a jednotlivé akce mohou cílit přes
`Action.runAtScheduleTime: ["10:00"]`.

**Co tu *není*:** Žádné `relative_to_checkpoint` (typu „+2 h po CP1").
Pro relativní časy slouží trigger `condition_met` + podmínka
`field_state_duration` nad virtuálním datetime polem
`route.checkpoint_fulfilled_at` (s `Condition.routeCheckpointId`).
Důvod: relativní časy nejsou „naplánované" — jsou *reaktivní*. Plánovač
by je nikdy nespouštěl přesně.

### 2.4 `skipIfPrior` — řetězení časových běhů

```ts
export interface RuleSkipIfPrior {
  ruleIds: string[];                       // Pravidla, jejichž outcome se kontroluje
  outcome: "any" | "positive" | "negative"; // Při kterém outcome dnes přeskočit
}
```

**Jak se používá:** Pravidlo R2 (9:00) má `skipIfPrior: { ruleIds: ["rule_today_8h"], outcome: "positive" }`.
Pokud R1 (8:00) dnes pro tuto zásilku **vytvořil pozitivní VkŘ**, R2 se
přeskočí. Pokud R1 dnes neproběhlo nebo skončilo negativně, R2 normálně
proběhne.

**Proč právě takhle:** Sémantiku „čekej, dokud podmínka platí"
modelujeme znovuvyhodnocením pravidla při dalším eventu — ne samostatnou
odloženou úlohou s ETA, cancel-logikou a deduplikací běhů. `skipIfPrior`
je nad tím už jen filtr nad audit logem dnešního dne (jeden SQL dotaz)
a řeší typický řetězec **8:00 → 9:00 → 10:00**, kdy další běh smí
přeskočit, pokud předchozí pravidlo dnes uspělo.

---

## 3. Podmínky (`Condition`)

### 3.1 Struktura stromu

```ts
export interface ConditionGroup {
  id: string;
  operator: "AND" | "OR";
  children: Array<Condition | ConditionGroup>;
}
```

Doporučená maximální zanořenost: **3 úrovně**. Hlubší strom přestává být
v UI čitelný.

### 3.2 `Condition.kind` — 9 kategorií

```ts
kind: "field"            // Pole zásilky (text/number/datetime/enum/boolean/document)
    | "document"         // Dokument přítomný/chybí
    | "tracking"         // Strukturovaná podmínka nad tracking eventy
    | "customer"         // Vlastnosti zákazníka (první zásilka, počet, tagy)
    | "vkr"              // Existence/stav VkŘ na zásilce (anti-spam)
    | "occurrence"       // Čítač výskytů („výjimka 2× za 7 dní")
    | "special"          // Cross-field (PSČ vs země, rozměry, …)
    | "field_state_duration"  // „Pole je ve stavu X déle než N (od kotvy)"
    | "route_compliance" // Most do modulu Tras
```

**Proč `field_state_duration` jako vlastní kind a ne jen operátor:**
Sémantika je výrazně jiná než „equals/contains". Vyhodnocuje se ne nad
*aktuální* hodnotou pole, ale nad **trváním stavu** od kotvy
(`durationAnchor`). Engine to musí počítat z audit logu. Sloučení s
`field` by mělo za následek polovinu `field`-podmínek v UI s šedivými
poli „neaplikuje se".

### 3.3 Operátory podle datového typu

UI dynamicky filtruje operátory podle `FieldDef.type` (viz
`src/lib/vkr/fields/operators.ts`):

| Typ pole | Operátory |
|---|---|
| `text` | `is_empty`, `is_not_empty`, `equals`, `not_equals`, `is_any_of`, `is_none_of`, `contains`, `not_contains`, `starts_with`, `ends_with`, `changed_to`, `changed_from_to`, `not_changed_since` |
| `number` | `is_empty`, `is_not_empty`, `gt`, `gte`, `lt`, `lte`, `between` |
| `datetime` | `is_empty`, `is_not_empty`, `is_today`, `is_past`, `is_future`, `before`, `after`, `is_on_or_before`, `is_on_or_after`, `is_between`, `within_next`, `within_past` |
| `enum` | `is`, `not_equals`, `is_any_of`, `is_none_of`, `changed_to`, `changed_from_to` |
| `boolean` | `is_true`, `is_false` |
| `document` | `is` (s hodnotou `present`/`missing`) |

**Pravá strana porovnání = vždy literál.** Volby „hodnota jiného pole"
a „% jiného pole" v UI nejsou — v uživatelských testech je nikdo nedokázal
smysluplně použít a zvyšovaly chybovost. Když je potřeba porovnat dvě
pole, řeší se to dvojicí podmínek (např. „pole A je vyplněno"
+ `field_state_duration` nad polem B).

### 3.4 Enum pole — `{value, label}`

Enum pole používají `enumOptions: Array<{value, label}>` (helper
`getEnumOptions` v `src/lib/vkr/fields.ts`). V UI se ukazuje **label**,
do podmínky se ukládá **value**. Důvod: stabilní ukládání i při změně
překladu / přejmenování. Příklad — pole `phase`:

```ts
enumOptions: [
  { value: "QUOTATION",         label: "Nabídka" },
  { value: "PICKUP",            label: "Vyzvednutí" },
  { value: "IN_TRANSIT",        label: "Průběh přepravy" },
  { value: "CUSTOMS_CLEARANCE", label: "Celní řízení" },
  { value: "DELIVERY",          label: "Doručení" },
  { value: "INVOICING",         label: "Fakturace" },
]
```

### 3.5 `field_state_duration`

Klíčová podmínka pro „od kdy zásilka stojí ve stavu". Sledované pole
`fieldId` + očekávaný stav (`stateOperator` + `stateValue`) + doba trvání
(`durationMinutes` + `durationAnchor`).

```ts
{
  kind: "field_state_duration",
  fieldId: "route.checkpoint_fulfilled_at",   // Virtuální pole
  routeCheckpointId: "cp_fx_cz_first_phys_scan",
  stateOperator: "is_not_empty",              // CP musí být splněný
  durationDirection: "elapsed",
  durationMinutes: 120,                       // ≥ 2 h
  durationAnchor: "field_last_update",
}
```

Slovo `route.checkpoint_fulfilled_at` je **virtuální datetime pole** —
neukládá se na zásilce, ale engine ho vypočte z prvního tracking eventu,
který matchnul `routeCheckpointId`. `routeCheckpointId` je povinné pro toto pole.

**`DurationAnchorKey`** určuje, od kdy se měří:

| Kotva | Význam |
|---|---|
| `shipment_created` | Od vytvoření zásilky |
| `order_created` | Od vytvoření objednávky |
| `shipment_updated` | Od poslední aktualizace zásilky |
| `field_last_update` | Od poslední změny tohoto pole |
| `field_datetime` | **Není v UI** — datum jiného pole jako referenční bod (důsledek pravidla „pravá strana = literál"). |
| `today` / `literal_date` | Kalendářní referenční bod |

`durationDayMode: business` má smysl jen pro jednotky `days`; UI skrývá
toggle u min/h.

### 3.6 `route_compliance` — most do modulu Tras

```ts
routeCheck?: "advanced_route_condition"  // 1
           | "record_vs_checkpoint"      // 2
           | "general_compliance"        // 3
           | "checkpoint_duration"       // 4
           | "field_value_repeated";     // 5
```

Detail viz sekce 7. Důležité: `problemTypeId` a `generalCheck` jsou **XOR**
— buď konkrétní typ problému ze slovníku, nebo obecná kontrola
(`unrecognized_location` / `unrecognized_status`).

### 3.7 Pole — katalog v modulech

Aby fields.ts nepřerostl, je rozdělen:

- `src/lib/vkr/fields.ts` — **barrel** (re-exporty + `getEnumOptions`).
- `src/lib/vkr/fields/catalog.shipment.ts` — pole entity zásilky (~30,
  zdroj `docs/reference/obchodni-pripad-inputy.md`).
- `src/lib/vkr/fields/catalog.tracking.ts` — kompletní §5 reference
  Par-Ser API (shipment_info, dimension_histories, activities, milestones,
  delivery_times, last_update_location, delivery_info, special_services,
  additional_info, par_ser_available_notifications, photo,
  pickup_tracking_infos). Cesty kopírují schéma: `tracking.activities.status_code`.
- `src/lib/vkr/fields/enums.ts` — slovníky pro enum pole.
- `src/lib/vkr/fields/operators.ts` — mapování typ pole → povolené operátory.
- `src/lib/vkr/fields/schedule.ts` — pole použitelná v `Schedule`.

`FieldDef` **neobsahuje** žádná metadata typu `source` / `updateHint` /
`mockFreshnessMin` / `mockCoverage` — to byly artefakty rané iterace,
které UI nepoužívalo a jen mátly autora pravidla.

**`promised_delivery_at` vs `carrier_announced_delivery_at`** — dvě
samostatná pole, ne jedno „odhadované doručení". `promised_delivery_at`
je **náš slib zákazníkovi** (zásilková pole), `carrier_announced_delivery_at`
je **údaj od dopravce** (tracking). V problémových případech se liší —
fallback pravidlo E13 ze seedu (sekce 10) se na tom rozdílu rozhoduje.

---

## 4. Akce (`Action`)

```ts
export type ActionType =
  | "create_vkr"                // Vytvoř VkŘ
  | "send_email"                // Pošli e-mail
  | "set_field"                 // Nastav hodnotu pole zásilky
  | "change_phase"              // Změň fázi
  | "update_vkr"                // Eskalace existující VkŘ
  | "add_note"                  // Záznam do aktivity logu
  | "request_field_from_operator"; // Požádej operátora o vyplnění pole (chained)
```

### 4.1 `request_field_from_operator`

Nový typ. Vytvoří VkŘ se strukturovaným formulářem („vyplň pole X").
Po vyplnění operátorem se hodnota zapíše na zásilku, což může spustit
**navazující pravidlo** přes trigger `condition_met` (změna hodnoty pole
= event).

Použití typicky v dvojici pravidel:
1. *„Chybí EORI číslo a zásilka jde do celního řízení"* → Akce
   `request_field_from_operator` s `requestFieldId: "eori_number"`.
2. *„EORI bylo vyplněno"* (trigger `condition_met` + podmínka
   `field_changed_to: eori_number is_not_empty`) → Akce „pokračuj
   v procesu" / poslat e-mail / atd.

### 4.2 Větvení akce — `runWhen*`

```ts
runWhenRouteCondition?: "fulfilled" | "not_fulfilled";  // dle outcome route_compliance
runAtScheduleTime?: string[];                            // ["10:00"] — jen pro tyto časy
runWhenField?: Array<{ fieldId; operator; value }>;      // AND filtry nad polem
```

**`runWhenRouteCondition`** — pravidlo má jedinou `route_compliance`
podmínku, ale dvě akce: pozitivní (vytvoř „doručeno včas") při
`fulfilled`, negativní (vytvoř „zpožděno") při `not_fulfilled`. Tím
ušetříme druhé pravidlo s negací podmínky.

**`runAtScheduleTime`** — pravidlo má `Schedule.times[] = ["08:00", "10:00"]`,
ale jedna akce má smysl jen v 10:00 (fallback). Místo dvou pravidel
přidáme `runAtScheduleTime: ["10:00"]`.

**`runWhenField`** — dodatečný filtr akce („pošli e-mail jen když
zákazník je VIP"). Drobnost, která zabrání pětinásobku pravidel.

### 4.3 Šablonové proměnné

V `title` / `description` / `body` / `noteText` lze používat:

```
{{shipment.reference}}      {{shipment.tracking_number}}
{{shipment.carrier}}        {{shipment.destination_country}}
{{shipment.customer_name}}  {{shipment.promised_delivery_at}}
{{shipment.operator}}       {{shipment.phase}}
{{field.[fieldId]}}         {{tracking.exception_text}}
{{today}}                   {{now}}
```

---

## 5. Trasy zásilek (nový modul)

### 5.1 Proč modul existuje

Jeden checkpoint („Destination Facility v cílovém PSČ") platí pro
**desítky pravidel** napříč DPD/UPS/FedEx CZ. Bez sdíleného modelu by
každé pravidlo definovalo stejné checkpointy znovu a kdejaká drobná
změna (např. nový kód lokace) by se musela přepsat na desítkách míst.

Modul Trasy proto vytáhne checkpointy a pokročilé podmínky do samostatné
entity `Route`. Pravidlo se na ně odkazuje přes `route_compliance`
+ `problemTypeId` (pojmenovaný kbelík sdílený mezi trasami).

### 5.2 Datový model

```ts
export interface Route {
  id: ID;
  code: string;            // R-FX-EXP-CZ
  name: string;
  description?: string;
  active: boolean;
  archivedAt?: string;

  // POKRYTÍ — kartézský součin
  carriers: string[];      // ["FEDEX"]
  serviceTypes: string[];  // ["Express"] — z TRANSPORT_VARIANTS
  destCountries: string[]; // ["CZ"]

  checkpoints: Checkpoint[];
  problems?: RouteProblem[];   // viz sekce 6

  parentRouteId?: ID;      // Alternativní cesta, viz 5.5
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

`serviceTypes` = **„Varianta přepravy"** (Express / Economy / Pallet /
Freight z `TRANSPORT_VARIANTS`) — totožné s polem `service_type` zásilky.

### 5.3 Unikátnost pokrytí

Pro každou kombinaci `carrier × varianta × cílová země` smí existovat
**maximálně 1 aktivní hlavní trasa**. Detekce kolizí v UI:
`findSignatureCollisions` v `src/lib/routes/types.ts`. Alternativní cesty
(s `parentRouteId`) jsou z této kontroly vyňaty.

**Proč jen jedna hlavní:** Pokud by jich bylo víc, pravidlo s
`route_compliance` by nevědělo, ke které se odkázat. Jednoznačnost = klíčová
vlastnost pro deterministický evaluator.

### 5.4 Checkpoint & `CheckpointMatch`

Checkpoint NEpopisuje „co se má stát na trase" v abstraktním smyslu.
Popisuje **tvar konkrétního záznamu v `tracking.activities[]`**. Engine
prochází tracking záznamy zásilky jeden po druhém a hledá ten (resp.
nejnovější při `latest = true`), který splňuje **všechna** vyplněná pole
`CheckpointMatch` (AND). Takový záznam je „splněním checkpointu" a teprve
nad ním běží pokročilé podmínky (čas záznamu, doba trvání, …).

```ts
export interface Checkpoint {
  id: ID;
  label: string;
  match: CheckpointMatch;                  // Tvar tracking záznamu
  appliesWhenDestZip?: RouteZipRange[];    // PSČ scénář (volitelně)
  expectedDuration?: {                     // Sdílený slovník prahů
    normal: OffsetSpec;
    critical?: OffsetSpec;
  };
}
```

`CheckpointMatch` pokrývá **výhradně** pole z
`ParSerPackageActivityDetailSchema` (§5.4 referenční schéma)
**bez časových polí**:

`status`, `statusCode`, `statusDescription`, `simplifiedDescription`,
`statusType`, `exceptionCode`, `exceptionDescription`, `locationCity`,
`locationCountry`, `locationCountryCode`, `locationPostalCode`,
`locationProvinceCode`, `locationSlic`, `locationType`, `locationId`,
`ancillaryAction(+Description)`, `ancillaryReason(+Description)`,
`latest` (default true), `zipMatchesDestination`, `eventId`, `freeText`.

**Proč žádné časové pole v `Match`:** Timing není věc checkpointu, je to
věc *pokročilé podmínky na trase* (sekce 6). Checkpoint sám o sobě říká
jen „pokud dorazí tracking záznam s tímto tvarem, považuj ho za splnění
tohoto bodu". Kdy přesně má dorazit = jiná otázka.

**Hodnoty z trackingu nejsou enums.** `observedCatalog.ts` je autocomplete
katalog (volný text). Důvod: každý dopravce má svůj slovník, který se
mění. Tvrdý enum by každý měsíc lámal pravidla.

### 5.5 PSČ scénáře

PSČ se na trasu nevkládá. Místo toho:

- `Checkpoint.appliesWhenDestZip?: RouteZipRange[]` — checkpoint platí
  jen pro zásilky s cílovým PSČ v rozsahu.
- `CheckpointMatch.zipMatchesDestination?: { mode: "exact" | "prefix"; prefixLength? }`
  — checkpoint je splněn jen pokud `locationPostalCode` z eventu = cílové
  PSČ zásilky.

V UI je nad tím vrstva **„PSČ scénářů"** (taby v editoru i detailu trasy)
— grupování checkpointů, které mají stejné `appliesWhenDestZip`. Funkce
`listZipScenarios` v `src/lib/routes/types.ts`.

**Proč ne PSČ na trase:** Většina tras má pro různé PSČ scénáře jen
jiné *poslední* checkpointy (Last Mile depo). Společné checkpointy
(hub, customs) jsou stejné. Duplikovat trasu kvůli PSČ by znamenalo
desítky kopií téhož.

### 5.6 Alternativní cesty (`parentRouteId`)

Samostatný `Route` s vyplněným `parentRouteId`. Musí mít **shodné
pokrytí** s parentem (kontrola v `RouteEditorDialog.tsx`). Slouží pro
„obvyklou trasu" vs „náhradní trasu v případě X".

### 5.7 `expectedDuration` — sdílený slovník prahů

```ts
expectedDuration?: { normal: OffsetSpec; critical?: OffsetSpec }
```

Threshold „normal" / „critical" se používá ve variantě
`checkpoint_duration` route_compliance (sekce 7.4) i v pokročilé podmínce
`state_too_long`. Místo aby každé pravidlo definovalo vlastní prah,
odkazují se na společný slovník na checkpointu.

---

## 6. Pokročilé podmínky na trase

`Route.problems[]` definuje **pojmenované situace na trase** (např.
„Možné zpoždění", „Dlouho na clení"). Pravidlo se na ně odkazuje přes
`problemTypeId` (slovníkový kbelík ze `src/lib/routes/problemTypes.ts`).

Pokročilá podmínka se vždy ptá nad **konkrétním tracking záznamem**,
který splnil daný checkpoint — buď nad faktem, že takový záznam
neexistuje (`checkpoint_not_met`), nebo nad jeho časem
(`checkpoint_time_constraint`). `aspect: record_event_time` čte
timestamp uvnitř toho záznamu (kdy událost fyzicky nastala),
`aspect: record_created` čas, kdy nám tento záznam přišel do systému.

### 6.1 Dva kindy

```ts
export type ProblemCondition =
  | { kind: "checkpoint_not_met"; checkpointId: ID }
  | {
      kind: "checkpoint_time_constraint";
      checkpointId: ID;
      aspect: "record_created" | "record_event_time";
      operator: "within" | "longer_than" | "exact";
      anchor: ConditionAnchor;
    };
```

- **`checkpoint_not_met`** — checkpoint vůbec nebyl splněn (žádný
  matching event neexistuje). Triviální, ale kritická podmínka.
- **`checkpoint_time_constraint`** — záznam splňující checkpoint existuje,
  ale s nesprávným časem vůči kotvě:
  - `aspect: record_created` — kdy *přišel záznam do našeho systému*
  - `aspect: record_event_time` — kdy *fyzicky událost nastala* (timestamp z eventu)
  - `operator: within / longer_than / exact` — vztah k offsetu
  - `anchor` — viz 6.2

**Proč rozlišujeme `record_created` vs `record_event_time`:** Dopravce
hlásí event často s několikahodinovým zpožděním. Když pravidlo říká
„CP2 do 2 h od CP1", má na mysli *fyzickou* dobu mezi událostmi
(`record_event_time`), ne dobu mezi *našimi přijetími* záznamů.
V některých případech ale chceme to druhé („dopravce nám už 8 h
nereportoval"), proto je to volba.

### 6.2 `ConditionAnchor` — 4 typy

```ts
export type ConditionAnchor =
  | { kind: "checkpoint_record";
      offset: OffsetSpec;
      reference: "record_event_time" | "record_created";
      checkpointId: ID; }
  | { kind: "system_event";
      offset: OffsetSpec;
      event: SystemEvent; }
  | { kind: "field_value";
      offset: OffsetSpec;
      direction: "after" | "before";
      fieldId: string; }
  | { kind: "absolute_time";
      time: { hours: number; minutes: number };
      timezone: TimezoneSpec;
      day?: DaySpec; };
```

| Kotva | UI prompt (jak se to čte operátorovi) | Reálný use-case |
|---|---|---|
| `checkpoint_record` | „… od času záznamu / záznamu checkpointu B" | CP2 do 2 h od CP1 |
| `system_event` | „… od vytvoření zásilky / vyzvednutí / …" | Pickup do 24 h od vytvoření objednávky |
| `field_value` | „… od / před hodnotou pole" | Doručení před `promised_delivery_at` |
| `absolute_time` | „… do 9:00 TZ cíle [dne …]" | Ranní kontrola — fixní deadline |

**`SystemEvent`** = `shipment_created`, `shipment_pickup`, `order_created`,
`promised_delivery_at`, `carrier_announced_delivery_at`. Pět hodnot
pokrylo všechny use-cases z konzultací — víc není potřeba.

**`DaySpec`** (volitelný „typ dne" u `absolute_time`):

```ts
type DaySpec =
  | { kind: "fixed_date"; date: string }                                    // 2026-06-15
  | { kind: "relative_field"; fieldId: string; offset?: DayOffset }         // hodnota pole ±N dní
  | { kind: "relative_system"; event: SystemEvent; offset?: DayOffset }     // ±N dní od události
  | { kind: "relative_checkpoint_record"; checkpointId: ID; offset?: DayOffset }
  | { kind: "relative_checkpoint_event_time"; checkpointId: ID; offset?: DayOffset };
```

Příklad: „CP1 musí být do 9:00 TZ cíle **dne, kdy bylo `promised_delivery_at`**" →
`absolute_time` s `time: 9:00` + `day: relative_field("promised_delivery_at", +0 days)`.

### 6.3 Mapování UI promptů z konzultace

Z user-message (Eliška, 9. 6. 2026):

```
Záznam shodující se s checkpointem [A] [byl vytvořen / má na sobě čas]
                                       [do / více než / přesně]

Kotva: záznam checkpointu
  [X] [hod / dní / prac. dní]  od  [času záznamu / záznamu]
  záznamu shodujícího se s checkpointem [B]

Kotva: systémová událost
  [X] [hod / dní / prac. dní]  od  [vytvoření zásilky / vyzvednutí zásilky / …]

Kotva: hodnota v poli
  [X] [hod / dní / prac. dní]  [od / před]  hodnotou pole  [pole]

Kotva: absolutní čas
  [HH:MM]  [TZ]  ([typ dne])
```

Tohle UI 1:1 mapuje na model: první řádek = `kind + aspect + operator`,
následně se vybírá `anchor.kind` a doplní jeho parametry.

### 6.4 Skládání do `RouteProblem`

```ts
export interface RouteProblem {
  problemTypeId: ID;                                  // Slovníkový pojem
  logic: { operator: "AND" | "OR"; items: ProblemCondition[] };
}
```

Trasa může mít více `RouteProblem` — každý s vlastním `problemTypeId`.
Tím se ve stejné trase definuje, kdy je „pt_late_today" splněn (jedna
sada podmínek) a kdy „pt_hub_stuck" (jiná sada).

### 6.5 Nastavení v UI

Pokročilé podmínky se editují v `RouteEditorDialog.tsx` → tab
**„Pokročilé podmínky"** (komponenta `ProblemsEditor`):

1. **„Přidat pokročilou podmínku"** založí nový `RouteProblem`.
2. Pro řádek se vybere `problemTypeId` v `ProblemTypeCombobox` —
   buď existující pojem ze slovníku (sdílený napříč trasami), nebo
   nový pojem založený inline.
3. Pro celou podmínku se zvolí logika `AND` / `OR` mezi dílčími
   položkami.
4. **„Přidat dílčí podmínku"** → výběr kindu:
   - **Checkpoint nebyl splněn** (`checkpoint_not_met`) — vybere se
     checkpoint této trasy. Stačí jediný parametr.
   - **Časová podmínka nad záznamem checkpointu**
     (`checkpoint_time_constraint`):
     1. Checkpoint (z této trasy).
     2. *Aspekt*: „čas záznamu" (event time) / „přijetí záznamu" (created).
     3. *Operátor*: do / více než / přesně.
     4. *Kotva* (`ConditionAnchor.kind`) a její parametry —
        `checkpoint_record` / `system_event` / `field_value` / `absolute_time`
        (+ volitelný `DaySpec`).
5. Jednotky offsetu jsou v UI jen **hod / dní / prac. dní** (minuty
   jsou schované v `UI_UNITS` v `ProblemsEditor.tsx`); režim
   `prac. dní` = `OffsetSpec.dayMode: business`.

Pojmenovaný `problemTypeId` se pak objeví v dropdownu pravidla pod
podmínkou `route_compliance` → varianta `advanced_route_condition`
(sekce 7.1). Tím se trasa a pravidlo „potkají" — pravidlo neví o
detailech, jen řekne „je tento problém splněn?".

```text
Route editor
 └ tab „Pokročilé podmínky" (ProblemsEditor)
    └ + Pokročilá podmínka
        ├ problemType  (ze slovníku / nový)
        ├ AND / OR
        └ + Dílčí podmínka
            ├ checkpoint_not_met
            └ checkpoint_time_constraint
                ├ aspekt   (event time / created)
                ├ operátor (within / longer_than / exact)
                └ anchor   (checkpoint_record | system_event |
                            field_value | absolute_time(+DaySpec))
```

---

## 7. Napojení pravidel na trasu — `route_compliance`

Pět variant. Pravidlo si vybírá tu, která odpovídá tomu, na co chce zareagovat.

### 7.1 `advanced_route_condition` (varianta 1)

Reference do `Route.problems[]` přes `problemTypeId`. Pravidlo neví
o detailech podmínky — jen řekne „je tento problém splněn?".

```ts
{ kind: "route_compliance", routeCheck: "advanced_route_condition",
  problemTypeId: "pt_late_today" }
```

**Kdy ji použít:** Standardní případ — pokročilou logiku spravujete na
trase, pravidlo jen reaguje.

### 7.2 `record_vs_checkpoint` (varianta 2)

„Poslední / jakýkoli záznam × odpovídá / neodpovídá / částečně CP."

```ts
{ kind: "route_compliance", routeCheck: "record_vs_checkpoint",
  checkpointLabel: "Destination Facility",
  recordScope: "last",
  matchMode: "matches" | "not_matches" | "partial",
  partialFields?: ["locationCountryCode", "locationType"]  // jen při partial
}
```

**Kdy:** Ad-hoc kontrola, kterou nechcete promovat do `Route.problems[]`.

### 7.3 `general_compliance` (varianta 3)

Obecná kontrola nezávislá na konkrétním CP:

```ts
{ kind: "route_compliance", routeCheck: "general_compliance",
  generalCheck: "unrecognized_location" | "unrecognized_status" }
```

`unrecognized_location` = tracking ukazuje zásilku v lokaci, kterou
žádný checkpoint trasy nepokrývá → potenciálně doručení na špatné místo.

### 7.4 `checkpoint_duration` (varianta 4)

Doba trvání CP proti sdílenému prahu `Checkpoint.expectedDuration`:

```ts
{ kind: "route_compliance", routeCheck: "checkpoint_duration",
  checkpointLabel: "Hub Praha",
  durationComparator: "gt" | "lt",
  checkpointDurationThreshold: "normal" | "critical" }
```

### 7.5 `field_value_repeated` (varianta 5)

Hodnota tracking pole na > N záznamech:

```ts
{ kind: "route_compliance", routeCheck: "field_value_repeated",
  fieldValueTrackingFieldId: "tracking.activities.status_code",
  fieldValueExpected: "DELIVERY_ATTEMPTED",
  fieldValueCount: 2,
  fieldValueMode: "any" | "consecutive" }
```

Use-case: „Opakovaný neúspěšný pokus o doručení".

### 7.6 `problemTypeId` ↔ `generalCheck` — XOR

V UI je validace: může být vyplněn jen jeden z nich. Pokud nastavíte
`generalCheck`, dropdown `problemTypeId` se vyprázdní a opačně.

---

## 8. UI konfigurátoru

### 8.1 Top nav

`src/components/AppHeader.tsx` — dvě sekce:

- `/` — **Konfigurátor pravidel** (`RulesTable` + `FoldersSidebar` +
  `RuleEditorDialog` + `RuleDetailPanel`).
- `/trasy` — **Trasy zásilek** (`RoutesTable` + `RoutesSidebar` +
  `RouteEditorDialog` + `RouteDetailPanel`).

### 8.2 Editor pravidla

`src/components/vkr/RuleEditorDialog.tsx`. **Modal**, otevírá se shodně
pro vytvoření i editaci (žádné rozdíly UI). Sekce:

1. **Základní informace** — kód, název, popis, složka, priorita,
   aktivní, throttle, `activeWindow` (jen pracovní dny),
   `skipIfPrior`.
2. **Spouštěč** — 3 typy, pro `schedule` editor `times[]` (kombo
   `time_of_day` + TZ).
3. **Podmínky** — strom builderu (`ConditionGroup` rekurzivně).
4. **Akce** — list s `Action.type` selectorem; pro každou akci
   sekce `runWhen*`.

### 8.3 Editor trasy

`src/components/routes/RouteEditorDialog.tsx`. Sekce:

1. **Pokrytí** — multi-select carrier / serviceTypes / destCountries.
   Kolizní upozornění při uložení (`findSignatureCollisions`).
2. **PSČ scénáře (taby)** — UI nad `Checkpoint.appliesWhenDestZip`.
3. **Checkpointy** — list, každý s `CheckpointMatch` builderem
   (žádný timing — viz 5.4).
4. **Pokročilé podmínky** — `ProblemsEditor.tsx`, list `RouteProblem`
   s AND/OR řádky.
5. **Alternativní cesty** — odkaz na vytvoření child route s
   `parentRouteId`.

### 8.4 Lidsky čitelný popis

`src/lib/routes/describe.ts` (a obdoba pro VkŘ podmínky) generuje
textový popis pravidla / trasy / podmínky pro detail panel. Operátor
tak nemusí číst JSON.

---

## 9. Runtime vyhodnocení

### 9.1 Princip

- `schedule` triggery běží přes plánovač (Celery beat) v jednotlivých
  `Schedule.times[]` × cílových TZ.
- `condition_met` triggery běží reaktivně — každá změna dat zásilky
  / příchozí tracking event publikuje event na bus, consumer vyhledá
  pravidla s `kind: condition_met` a vyhodnotí je.
- `manual` se spouští z UI.

Vše asynchronně — nikdy v HTTP request cyklu.

### 9.2 Throttle, dedup, `skipIfPrior`

Před spuštěním pravidla engine kontroluje (v tomto pořadí):

1. `throttleHours` — bylo pravidlo pro tuto zásilku spuštěno v okně?
   Pokud ano → zalog jako `throttled`.
2. `skipIfPrior` — proběhlo dnes některé z `ruleIds` s daným `outcome`?
   Pokud ano → přeskoč.
3. `activeWindow.businessDaysOnly` — je dnes pracovní den (`businessDays.ts`)?

Po vyhodnocení podmínek a spuštění akcí:

4. `deduplicate` na akci `create_vkr` — existuje na zásilce otevřená VkŘ
   se stejným titlem? Pokud ano → `deduplicated`.

### 9.3 Audit log

```ts
export interface RunLogEntry {
  at: string;
  shipmentRef: string;
  conditionsMet: boolean;
  outcome: "vkr_created" | "throttled" | "deduplicated"
         | "condition_false_after_wait" | "error";
  detail?: string;
  /** Auto-populated z tracking eventu, pokud běh přišel z eventu. */
  triggeringEventTimestamp?: string;
}
```

`triggeringEventTimestamp` se plní **automaticky** engine — žádný
toggle v UI. Slouží pro debug („proč se to spustilo přesně teď?").

---

## 10. Seed scénář „Kontrola doručení v den D"

Jediný scénář, který se po prvním načtení nasype do localStorage
(`routes_v13`, `vkr_rules_v13`, `problem_types_v1`). Vyfocuje
**ranní kontrolu avizovaného doručení**.

### 10.1 Trasa `route_fedex_cz_express`

FedEx Express → CZ, dva checkpointy:

| ID | Label | Match |
|---|---|---|
| `cp_fx_cz_first_phys_scan` | První fyzický scan v cílové zemi (FedEx Facility) | `locationCountryCode: ["CZ"]`, `locationType: ["FedEx Facility"]` |
| `cp_fx_cz_dest_facility` | Destination Facility v cílovém PSČ | `locationCountryCode: ["CZ"]`, `locationType: ["Destination Facility"]`, `zipMatchesDestination: { mode: "exact" }` |

Dva problémy v `Route.problems[]`:

- **`pt_late_today`** — CP1 nebyl vytvořen do 9:00 TZ cíle. Anchor
  `absolute_time` s `time: 9:00`, `timezone: destination_country`.
- **`pt_hub_stuck`** — CP2 nedoběhl do 2 h od `record_event_time` CP1.
  Anchor `checkpoint_record` s `offset: 2h`, `reference: record_event_time`,
  `checkpointId: cp_fx_cz_first_phys_scan`.

### 10.2 Čtyři pravidla (folder E)

| Kód | Pravidlo | Spouštěč | Klíč |
|---|---|---|---|
| **E10** | Den D — 8:00: první fyzický scan v cílové zemi | `schedule` 08:00 TZ cíle | `runWhenRouteCondition: fulfilled` → pozitivní VkŘ. Záporný outcome čeká na E11. |
| **E11** | Den D — 9:00: fallback kontrola | `schedule` 09:00 | `skipIfPrior: rule_today_8h outcome=positive` |
| **E12** | Den D — CP2 nedoběhl ≥ 2 h po CP1 | `condition_met` | Reaktivně, `field_state_duration` nad `route.checkpoint_fulfilled_at` CP1 ≥ 120 min + `route_compliance pt_hub_stuck`. Vytváří jak pozitivní (CP2 doběhl), tak negativní (eskalace) VkŘ. |
| **E13** | Den D — 10:00: fallback (fallback na datum dopravce) | `schedule` 10:00 | `skipIfPrior: [E10, E11, E12] outcome=positive`. Přidává podmínku `carrier_announced_delivery_at is_today` jako pojistku. |

**Motivace celého scénáře:** Operátor přijde ráno a chce vědět
„u kterých zásilek dnes hrozí, že nedoručíme včas". Místo aby jedno
pravidlo dělalo všechno (a vyhodilo plno false-positive v 8:00, kdy
zásilka možná teprve dorazila), je rozloženo do tří časových oken
s `skipIfPrior` a doplněno reaktivním E12, které okamžitě eskaluje
„zaseknutí v hubu" bez čekání na další checkpoint.

---

## 11. AI průvodce tvorbou pravidla

### 11.1 Tok

1. **Výběr fáze** (zúžení relevantních polí / triggerů).
2. **Prompt** v přirozeném jazyce.
3. **AI vygeneruje `Rule`** JSON.
4. **Náhled** — vizuální schéma (Spouštěč → Podmínky → Akce),
   textové shrnutí s `fieldId`, max 2 alternativy.
5. **Potvrzení** → otevře se standardní `RuleEditorDialog` s
   předvyplněnými hodnotami.

### 11.2 Systémový prompt pro AI musí obsahovat

- Kompletní katalog polí (z `catalog.shipment.ts` + `catalog.tracking.ts`)
  s `fieldId`, typem a enum hodnotami.
- Kompletní seznam `Condition.kind` + jejich parametrů.
- 3 spouštěče (`schedule`, `condition_met`, `manual`).
- Slovník `problemTypes` pro `route_compliance.problemTypeId`.
- Instrukci: nikdy nevymýšlet `fieldId` mimo katalog; při nejistotě
  vrátit `alternatives` s max 2 variantami.

### 11.3 Rozsah první verze

- ✅ Trigger, podmínky, akce `create_vkr`.
- ✅ Vizuální schéma + textové shrnutí + alternativy.
- ❌ `request_field_from_operator` (komplexní chained scénáře).
- ❌ Tvorba `Route` / `ProblemCondition` (operátor musí ručně).
- ❌ Průběžná konverzace — single-shot.

---

## 12. Otevřené otázky a roadmap

1. **Chained pravidla v UI** — pravidlo A vytvoří VkŘ „doplň pole",
   pravidlo B reaguje na změnu pole. Aktuálně musí operátor vytvořit obě
   ručně. TBD: helper „vytvoř navazující pravidlo" přímo z akce
   `request_field_from_operator`.
2. **Backtest** — zatím jen single-shipment dry-run. Backtest na 30 dní
   historii = druhá verze.
3. **Oprávnění** — Admin / Team Leader / Operátor. Zatím není wired.
4. **Import / export pravidel** — JSON export. Užitečné pro staging → produkce.
5. **Versioning pravidel** — aktuálně se přepisuje. Diskutujeme historii revizí.
6. **Sdílení pokrytí mezi parent/alt routes** — UI by mohlo automaticky
   sdílet `expectedDuration` a `problems[]` mezi parent a children.

---

## 13. Implementační poznámky (kde co v repu žije)

| Co | Soubor |
|---|---|
| Typy pravidla | `src/lib/vkr/types.ts` |
| Storage pravidel (localStorage `vkr_rules_v13`) | `src/lib/vkr/store.ts` |
| Seed pravidla | `src/lib/vkr/mockData.ts` |
| Katalog polí — barrel | `src/lib/vkr/fields.ts` |
| Pole zásilky | `src/lib/vkr/fields/catalog.shipment.ts` |
| Pole tracking (§5) | `src/lib/vkr/fields/catalog.tracking.ts` |
| Enums | `src/lib/vkr/fields/enums.ts` |
| Mapování typ → operátory | `src/lib/vkr/fields/operators.ts` |
| Schedule pole | `src/lib/vkr/fields/schedule.ts` |
| AI suggest (server fn) | `src/lib/vkr/aiSuggest.functions.ts` |
| Typy trasy / checkpointu / pokročilé podmínky | `src/lib/routes/types.ts` |
| Storage tras (localStorage `routes_v13`) | `src/lib/routes/store.ts` |
| Seed trasa | `src/lib/routes/mockData.ts` |
| Slovník `problemTypes` (localStorage `problem_types_v1`) | `src/lib/routes/problemTypes.ts` |
| Observed catalog (autocomplete tracking hodnoty) | `src/lib/routes/observedCatalog.ts` |
| Anchor risk hodnocení | `src/lib/routes/anchorRisk.ts` |
| Pracovní dny | `src/lib/routes/businessDays.ts` |
| Země | `src/lib/routes/countries.ts` |
| Lidsky čitelný popis | `src/lib/routes/describe.ts` |
| UI — pravidla | `src/components/vkr/{RulesTable,FoldersSidebar,RuleEditorDialog,RuleDetailPanel,AIWizard}.tsx` |
| UI — trasy | `src/components/routes/{RoutesTable,RoutesSidebar,RouteEditorDialog,RouteDetailPanel,ProblemsEditor,ProblemTypeCombobox}.tsx` |
| Top nav | `src/components/AppHeader.tsx` |
| Routes (TanStack) | `src/routes/index.tsx`, `src/routes/trasy.tsx` |
| Referenční pole zásilky | `docs/reference/obchodni-pripad-inputy.md` |

**Žádné legacy migrace.** Bump verze klíče v localStorage =
úplný reset seedu při dalším načtení. Historie verzí pro reference:
`vkr_rules_v10` → `v11` → `v12` → `v13` (aktuální).
