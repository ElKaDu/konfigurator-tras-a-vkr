# Spec: Redesign konfigurátoru — modul oblastí, checkpoint type a dry-run evaluator

**Datum:** 2026-06-15
**Status:** Návrh k revizi
**Repo:** `Prototype Builder` (Vite + TanStack + React, localStorage prototyp)

> Prototyp je **modul ve stávající Bytorp aplikaci** (`/Users/abcdef/Projects/bytorp`).
> Datový model Zásilky a trackingu se váže na reálné schéma (viz §3), nevymýšlí se.

---

## 1. Cíl a rozsah

### 1.1 Co stavíme
Redesign konfigurátoru pravidel a modulu Tras tak, aby:
- uživatel nejdřív vybral **oblast** a konfiguroval v přizpůsobeném, jednodušším UI;
- podmínky trasy se nastavovaly **přímo na checkpointech** přes pojmenované **milníky (`checkpointType`)** a definovaly **„jak má správně proběhnout"** (ne „co je problém");
- bylo možné pravidlo **dry-run otestovat** nad editovatelnou vzorovou zásilkou.

### 1.2 V rozsahu (v1)
- Oblasti pravidel: **④ Záznamy z trackingu** a **⑤ Soulad s předepsanou trasou** + sdílený shell výběru oblasti.
- Redesign Tras (checkpoint type, podmínky na checkpointu, nový editor s mapou a průvodcem).
- Zjednodušení datového modelu (mrtvý kód, `route_compliance`).
- Dry-run evaluator + editovatelné vzorové zásilky + test panel.

### 1.3 Mimo rozsah (odloženo)
- Oblasti ① Vyhodnocení objednávky, ② Nevyzvednutá objednávka, ③ Parametry a cena (enum hodnoty připravit, editory nestavět).
- Reálný runtime (schedule, throttle, dedup, `skipIfPrior`) — evaluator vyhodnocuje „teď".
- Tentativní „vlastní podmínka v pravidle bez časového očekávání na trase" (bod 6 z diskuse).
- Migrace dat — používá se reset + nový seed.

---

## 2. Architektura

Klientský prototyp, žádný backend. Přibývá vrstva evaluátoru.

```
data (types + stores + seed)  ->  evaluator (čistá fn)  ->  describe (lidský popis)  ->  UI
```

- **Evaluator** je deterministická čistá funkce; AI do vyhodnocení nevstupuje.
- Vše drženo v `localStorage`; změna modelu = **bump verze klíče** (`*_v14`) = reset na nový seed.

---

## 3. Vazba na reálnou aplikaci

Zdroj pravdy: `/Users/abcdef/Projects/bytorp/bytorp-frontend/client/types.gen.ts`.

- **Zásilka = `ShipmentDetailSchema`** (zasílatelský model): `transport_type` (SEA/AIR/ROAD/RAIL/SPECIAL), `country_export`, `country_import`, `state` (NEW/IN_TRANSPORT/DELIVERED/CANCELLED), `etd`, `eta`, `weight`, `incoterm`, `goods_category`, `contact_*`. Dopravci UPS/FedEx (Par-Ser).
- **Tracking = `ParSerPackageDetailSchema.activities[]`** = `ParSerPackageActivityDetailSchema`: `status`, `status_code`, `status_description`, `status_simplified_description`, `status_type`, `exception_code`, `exception_description`, `latest`, `location_city/country/country_code/slic/id/type/postal_code/province_code`. Mapuje 1:1 na `CheckpointMatch` (sjednotit názvy na snake_case).
- **Podpis trasy = `carrier × transport_type × country_import`.**
- **Číselník polí Zásilky = kurátorovaná podmnožina** reálné `ShipmentDetailSchema` + Par-Ser activity polí — jen co potřebují oblasti ④+⑤. Žádný vymyšlený katalog.

---

## 4. Datový model

### 4.1 Trasy (`lib/routes/types.ts`)
```ts
// Slovník MILNÍKŮ (nahrazuje ProblemType / problemTypes store)
interface CheckpointType { id; name; description?; createdAt; updatedAt }

// Podmínka "jak má správně proběhnout" (0..N na checkpointu, spojené implicitním AND)
interface CheckpointCorrectness {
  id;
  aspect?: "record_created" | "record_event_time";   // default record_event_time; co se měří na záznamu TOHOTO checkpointu
  operator: "within" | "longer_than" | "exact";      // UI: do / více než / přesně
  anchor: TimeAnchor;                                 // viz §4.1.1 (3 typy kotvy)
}

interface Checkpoint {
  id;
  checkpointTypeId;          // NAHRAZUJE volný label
  note?;                     // volitelná poznámka
  match: CheckpointMatch;    // Par-Ser snake_case, beze změny logiky
  appliesWhenDestZip?: RouteZipRange[];
  expectedDuration?: { normal: Duration; critical?: Duration };
  correctness?: CheckpointCorrectness[];   // prázdné = jen "musí nastat"
}

interface Route {
  id; code; name; description?; active; archivedAt?;
  carriers: string[];        // UPS/FedEx
  transportTypes: string[];  // SEA/AIR/ROAD/... (NAHRAZUJE serviceTypes)
  destCountries: string[];   // country_import
  checkpoints: Checkpoint[];
  parentRouteId?; notes?; createdAt; updatedAt;
  // problems: ODSTRANĚNO (RouteProblem zaniká)
}
```
Pravidla:
- „Nastal" není konfigurovatelná podmínka — checkpoint na trase MÁ nastat (baseline). Nenastání = automaticky odchylka.
- Jeden `checkpointType` smí být na trase max 1× (validace unikátnosti).
- Zaniká `RouteProblem`, `ProblemCondition` jako samostatný objekt; jejich časová logika se přesouvá do `Checkpoint.correctness[]`.
- `TimeAnchor` (v `correctness[].anchor`) je definovaný v **§4.1.1** (3 typy kotvy, revize 2026-06-15). `Duration` zůstává do **fáze 5** dnešní `OffsetSpec`; sjednocení v §4.4.
- Vztah `expectedDuration` × `correctness[]`: `expectedDuration` je pojmenovaný práh doby trvání v checkpointu (normal/critical); `correctness[]` pokrývá ukotvená očekávání „do kdy" (`within/longer_than/exact` vůči kotvě). „Checkpoint trval moc dlouho" = `correctness` s `operator: longer_than` (kotva na vlastní záznam), volitelně odkazem na práh `expectedDuration`.

### 4.1.1 Kotva časové podmínky (`TimeAnchor`) — revize 2026-06-15

Kotva má **3 typy** (sjednocení dřívějších 4):
```ts
type TimeAnchor =
  // 1) od záznamu JINÉHO milníku téže trasy
  | { kind: "checkpoint"; checkpointId: ID;
      reference: "record_event_time" | "record_created"; offset: Duration }
  // 2) od DATA UDÁLOSTI — sjednocuje dřívější system_event + field_value do jednoho seznamu
  | { kind: "date_event"; sourceId: string; offset: Duration }
  // 3) v konkrétní ČAS daného DNE
  | { kind: "absolute_time"; time: { hours: number; minutes: number };
      timezone: TimezoneSpec; day: DaySpec };
```

Rozhodnutí:
- **`date_event` („od data události") sjednocuje `system_event` + `field_value`.** Uživatel vybírá z **jednoho dropdownu**, kde jsou pohromadě:
  - **systémová událost** — reálně už jen **„Vytvoření zásilky"** (`shipment_created`);
  - **datum-pole** zásilky (pole, jejichž hodnota je datum): „Vyzvednutí zásilky", „Vytvoření objednávky", „Avizované doručení zákazníkovi (ADD)", „Doručení hlášené dopravcem", … Dřívější „systémové události" kromě vytvoření zásilky se překlápějí sem (reálně jsou to hodnoty polí).
  - Uživatel neřeší rozdíl „systémová událost vs. pole" — vidí jen seznam „dat".
- **`checkpoint` („od jiného checkpointu")** zůstává — odkaz na záznam jiného milníku trasy + `reference` (čas události / přijetí záznamu).
- **`absolute_time` („v konkrétní čas")** zůstává a v UI se prezentuje jako **„má nastat v konkrétní čas …(vyplň)… a den …(vyplň)…"**: čas (HH:MM + TZ) + **`DaySpec`** (zachovány všechny varianty: pevné datum / hodnota pole / systémová událost / vznik záznamu CP / čas záznamu CP, + offset). `DaySpec` se nabízí **jen** u absolutního času.
- **Aspekt** (`record_created` / `record_event_time`) beze změny — měří se nad záznamem subjektového checkpointu.

Mentální model: uživatel volí mezi **3 kotvami**; u relativních (`checkpoint`/`date_event`) jen vyplní offset + zdroj z jednoho seznamu; absolutní čas má vlastní tvar věty (čas + den).

### 4.2 Pravidla (`lib/vkr/types.ts`)
```ts
type Area =
  | "tracking_records"   // ④ — editor v1
  | "route_compliance"   // ⑤ — editor v1
  | "order_eval" | "unpickup" | "params_price";  // ①②③ — odloženo

type ConditionKind = "field" | "field_state_duration" | "route_compliance" | "tracking_aggregate";

interface RouteComplianceCondition {           // ⑤
  kind: "route_compliance";
  mode: "checkpoint_type" | "general";
  checkpointTypeId?: string;                    // mode=checkpoint_type
  generalCheck?: "unrecognized_location" | "unrecognized_status"; // mode=general
}

interface TrackingAggregateCondition {         // ④ (nahrazuje route_compliance v5)
  kind: "tracking_aggregate";
  trackingFieldId: string;                      // Par-Ser activity pole (např. location_city)
  valueMode: "same_repeats" | "specific";       // "stejná hodnota se opakuje" vs "= X"
  expectedValue?: string;                       // valueMode=specific
  count: number;                                // > N
  occurrence: "consecutive" | "any";
}

interface Rule {
  id; code; name; description?; active; archivedAt?;
  area: Area;                 // NAHRAZUJE folderId
  priority; trigger; conditionGroup; actions;   // ConditionGroup AND/OR ZŮSTÁVÁ
  // ... runs30d/history/timestamps beze změny
}
```
- `route_compliance` výstup je `fulfilled / not_fulfilled` → větvení akcí přes existující `Action.runWhenRouteCondition`.
- Oblast nahrazuje `Folder` (Folder, FoldersSidebar sekce složek, `onAddFolder` se odstraní).

### 4.3 Mrtvý kód ke smazání
- `Condition.kind`: pryč `document/tracking/customer/vkr/occurrence/special/checkpoint` (nikde se nevytváří).
- `checkpoint` standalone kind + `CheckpointConditionState` + `Condition.checkpointState`/`checkpointDuration`.
- Nepoužitý typ `TimingAnchor`.
- `CheckpointMatchFieldKey` × `CheckpointMatchFieldKeyVkr` → sloučit do jednoho sdíleného typu.
- Bonus: rozbít `Condition` na diskriminovanou unii (`FieldCondition | StateDurationCondition | RouteComplianceCondition | TrackingAggregateCondition`).

### 4.4 Sjednocení časových typů — FÁZE 5 (oddělitelná)
Jeden `Duration { value; unit; dayMode }`, jeden `TimeAnchor` (sjednocuje `SystemAnchorKey`/`DurationAnchorKey`/`SystemEvent`/`DaySpec`), jeden `ValueSource = literal | field | system`. Nasaditelné samostatně, po stabilizaci ④+⑤.

---

## 5. Evaluator (dry-run)

```ts
evaluateRule(rule, shipment, routes, checkpointTypes, now): RuleOutcome
interface RuleOutcome {
  conditionsMet: boolean;
  routeBranch?: "fulfilled" | "not_fulfilled";
  firedActions: Action[];
  createdVkr?: { title; description };
  explanation: string;     // lidský popis "proč"
}
```
Vyhodnocení (rule-level `ConditionGroup` AND/OR):
- **`route_compliance` (⑤):** spočti podpis zásilky (`carrier × transport_type × country_import`) → najdi aktivní trasu → checkpoint daného `checkpointType` → **splněn?** (existuje záznam v `activities[]` splňující `match`, respektuj `latest`) → vyhodnoť `correctness[]` (časová očekávání vůči kotvě) → `fulfilled / not_fulfilled`.
- **`tracking_aggregate` (④):** projdi `activities[]`, spočítej výskyty dle `valueMode`/`count`/`occurrence`.
- **`field`:** nad (podmnožinou) polí zásilky.
- **`field_state_duration`:** zachováno pro úplnost (kotva, doba).
Rozsah v1: **bez** schedule/throttle/dedup/`skipIfPrior` — vyhodnocuje se „teď". Výstup akce v1 = `create_vkr` (+ větvení fulfilled/not).

`lib/eval/evaluate.ts` (logika) + `lib/eval/describe.ts` (lidský popis výstupu).

---

## 6. Vzorové zásilky

`lib/shipments/` (nové): typy + store + seed.
```ts
interface SampleShipment {
  id; label;
  carrier; transport_type; country_import; country_export?;
  state; etd?; eta?; weight?;
  destPostalCode?;                         // pro zipMatchesDestination
  activities: ParSerActivity[];            // tracking (snake_case dle Par-Ser)
}
```
Editovatelné v UI (test panel) — umožní testovat různé scénáře. Tvar zrcadlí podmnožinu `ShipmentDetailSchema` + `ParSerPackageActivityDetailSchema`.

---

## 7. UI

Dle uložených konvencí: primární tlačítka ve fialové, jedna primární akce/obrazovku, podmínky v lidské řeči (věta s žetony), vertikální průvodce, volitelnost = prázdný stav (ne checkbox), chytré návrhy.

- **Editor trasy** (`components/routes/`): pokrytí (dopravce × transport_type × cílová země pilulkami) → milníky → schematická **mapa s body** (`RouteMap`) → **vertikální průvodce checkpointem** (`CheckpointWizard`): krok 1 vyber/​**vytvoř** checkpointType, krok 2 „jak poznáme, že nastal" (match v řeči), krok 3 volitelné „jak má správně proběhnout". Odstranit `ProblemsEditor`.
- **Konfigurátor pravidel** (`components/vkr/`): nový 1. krok `AreaPicker`; editor **④** (tracking agregace), editor **⑤** (vyber checkpointType → fulfilled/not). Refactor `RuleEditorDialog`, odstranit sekci složek v sidebaru (členění podle oblastí).
- **Test panel** (`components/test/TestPanel`): vyber/uprav vzorovou zásilku → „Otestovat" → `RuleOutcome` + lidský popis.

---

## 8. Seed a reset
Nový seed (`*_v14`): `checkpointTypes`, trasy s typovanými checkpointy, pravidla v oblastech ④/⑤, vzorové zásilky. Bump verze = reset, žádná migrace.

---

## 9. Fáze implementace
1. **Datový model + mrtvý kód** (§4.1–4.3).
2. **Trasy** — checkpointType, podmínky na checkpointu, nový editor (coverage, mapa, průvodce).
3. **Evaluator + vzorové zásilky + test panel** (§5, §6).
4. **Oblasti ④ + ⑤** — area picker, editory, napojení na evaluator.
5. **(oddělitelně) Sjednocení časových typů** (§4.4).

---

## 10. Soubory (orientačně)
- Mění: `lib/routes/{types,store,mockData}.ts`, `lib/vkr/{types,store,mockData,fields/*}.ts`, `components/routes/RouteEditorDialog.tsx`, `components/vkr/RuleEditorDialog.tsx`, sidebar.
- Přidává: `lib/routes/checkpointTypes.ts` (rename z problemTypes), `lib/eval/{evaluate,describe}.ts`, `lib/shipments/{types,store,mockData}.ts`, `components/routes/{CheckpointWizard,RouteMap}.tsx`, `components/vkr/AreaPicker.tsx`, `components/test/TestPanel.tsx`.
- Odstraňuje: `components/routes/ProblemsEditor.tsx`, sekci složek ve `FoldersSidebar`.

---

## 11. Otevřené / odložené body
- Tentativní bod 6 (rule-level vlastní podmínka bez čas. očekávání na trase) — po v1.
- Oblasti ①②③ — enum připraven, editory později.
- Schedule/throttle/dedup/`skipIfPrior` v evaluátoru — později.
