# Specifikace: Konfigurátor pravidel

**Datum poslední revize:** 2026-06-18
**Status:** Living document — odráží aktuální stav kódu v repu.

> Dokument popisuje **aktuální** datový model a chování aplikace.
> Strukturní snippety jsou kopírovány 1:1 z `src/lib/model/types.ts`
> a dalších zdrojových souborů — spec nelže o tvaru dat.

---

## 1. Přehled a slovník

### 1.1 Co aplikace dělá

Aplikace má dvě hlavní sekce v top nav (`AppHeader`):

- **`/`** **Konfigurátor pravidel** — seznam existujících pravidel + tvorba nových přes wizard `RuleCreatorPage`.
- **`/trasy`** **Trasy zásilek** — definice tras (`Route`) se seznamem úseků (`Segment`) a jejich checkpointů.

Nové pravidlo se tvoří průvodcem (`/rules/new` → `/rules/new/edit`):
1. **Výběr oblasti** (`RuleCreatorPage`) — oblast určuje druh situace, na kterou pravidlo reaguje.
2. **Konfigurace** — třísloupcový layout: vlevo situační karty, uprostřed nastavení pravidla + config situace, vpravo akce.

### 1.2 Slovník pojmů

| Pojem | Co to je |
|---|---|
| **Oblast** (`Area`) | Kategorie pravidla — určuje typ situace a dostupné podmínky. |
| **Pravidlo** (`Rule`) | Název + priorita + aktivní + trigger + podmínky + akce. |
| **Trasa** (`Route`) | Pokrytí `carrier × serviceType × cílová země` + seznam segmentů. |
| **Úsek** (`Segment`) | Část trasy se seřazenými checkpointy a jejich časovými podmínkami. |
| **Checkpoint** | Jeden bod na úseku — definice tvaru tracking záznamu + časová správnost. |
| **Správnost** (`CheckpointCorrectness`) | Časová podmínka: checkpoint musí nastat do/za N hod/dní od předchozí události. |

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
| `order_eval` | Vyhodnocení objednávky | ❌ |
| `unpickup` | Nevyzvednutá objednávka | ❌ |
| `params_price` | Parametry a cena | ❌ |

Každá oblast má `icon` (název Lucide ikony), `label`, `description` a `num` (pořadové číslo pro UI).

---

## 3. Datový model pravidla (`Rule`)

Definováno v `src/lib/model/types.ts`.

```ts
export type Priority = "low" | "medium" | "high" | "urgent";
export type TriggerKind = "condition_met" | "schedule" | "manual";

export interface Rule {
  id: string;
  code: string;
  name: string;
  area: Area;
  active: boolean;
  priority: Priority;
  trigger: { kind: TriggerKind; label: string };
  conditions: Condition[];
  actions: Action[];
}
```

### 3.1 Podmínky (`Condition`)

```ts
export type Condition =
  | { kind: "field"; fieldId: string; operator: string; value?: string }
  | { kind: "tracking_aggregate";
      trackingFieldId: string;
      valueMode: "same_repeats" | "specific";
      expectedValue?: string;
      count: number;
      occurrence: "consecutive" | "any" }
  | { kind: "route_compliance";
      mode: "checkpoint_type" | "general";
      checkpointTypeId?: string;
      generalCheck?: "unrecognized_location" | "unrecognized_status" };
```

### 3.2 Akce (`Action`)

```ts
export type ActionType =
  | "create_vkr" | "send_email" | "set_field" | "change_phase"
  | "update_vkr" | "add_note" | "request_field_from_operator";

export interface Action {
  id: string;
  type: ActionType;
  runWhenRouteCondition?: "fulfilled" | "not_fulfilled";
  title?: string; body?: string; fieldId?: string; value?: string;
  priority?: Priority;
}
```

---

## 4. Tvorba pravidla — wizard (`RuleCreatorPage`)

### 4.1 Tok uživatele

```
/ (RulesList)
  → /rules/new  (RuleCreatorPage — výběr oblasti + konfigurace situace)
    → /rules/new/edit  (RuleEditor — finální editor)
```

### 4.2 Oblast `tracking_records` — Záznamy z trackingu

Tři situační karty (Lucide ikony):

| ID | Ikona | Label | Trigger |
|---|---|---|---|
| `tracking_event` | `Radio` | Přišel konkrétní tracking záznam | Reaktivní — při každém novém záznamu |
| `no_movement` | `PauseCircle` | Zásilka bez pohybu po stanovenou dobu | Časový plán — kontroluje periodicky |
| `stuck_location` | `LocateFixed` | Zásilka zaseknutá na jednom místě | Reaktivní — při každém novém záznamu |

Konfigurace situace (`tracking_event`):
- Podmínky nad tracking poli (builder řádků): pole + operátor + hodnota.
- Dostupná tracking pole: `eventType`, `derivedStatus`, `derivedStatusCode`, `eventDescription`, `exceptionCode`, `exceptionDescription`, `locationType`, `locationId`, `city`, `countryCode`, `postalCode`, `deliveryAttempts`, `eventTime`.

Konfigurace situace (`no_movement`):
- Doba klidu: číslo + jednotka (hod / dní / prac. dní).
- Přeskočit, pokud dopravce potvrdil vyřešení: checkbox `ignoreClearance`.

Konfigurace situace (`stuck_location`):
- Počet záznamů z jednoho místa: číslo + režim shody (`locationId` / `city` / `countryCode`).
- Zahrnout / vyloučit konkrétní lokace: multiselect.

Akce: **jediná větev** „Podmínka splněna" (akce se nerozdělují na splněno/nesplněno).

### 4.3 Oblast `route_compliance` — Soulad s předepsanou trasou

Pět situačních karet:

| ID | Trigger |
|---|---|
| `delivery_day` | Časový plán (schedule) |
| `unexpected_location` | Reaktivní (condition_met) |
| `missed_milestone` | Reaktivní (condition_met) |
| `too_long` | Periodická kontrola |
| `other` | Manuální / vlastní |

Akce: **dvě větve** — „Splněno" (`runWhenRouteCondition: fulfilled`) a „Nesplněno" (`runWhenRouteCondition: not_fulfilled`).

### 4.4 Nastavení pravidla (meta)

Zobrazuje se **v horní části středního sloupce** pro obě oblasti:
- Název pravidla (text input)
- Priorita (`low` / `medium` / `high` / `urgent`)
- Aktivní (toggle)

---

## 5. Trasy (`Route`) a úseky (`Segment`)

Definováno v `src/lib/model/types.ts` a editováno přes `/trasy` → `RoutesAndSegmentsPage` → `SegmentEditorPage`.

### 5.1 Trasa

```ts
export interface Route {
  id: string; code: string; name: string; active: boolean;
  carriers: string[];
  serviceTypes: string[];
  destCountries: string[];
  segmentIds: string[];       // uspořádané odkazy na úseky
  destZone?: string[];        // volitelná jemnější zóna (stát / PSČ prefix)
}
```

### 5.2 Úsek (`Segment`)

```ts
export interface Segment {
  id: string;
  name: string;               // „ČR → Paříž"
  description?: string;
  carriers: string[];
  serviceTypes: string[];
  checkpoints: Checkpoint[];  // uspořádané
}
```

### 5.3 Checkpoint

```ts
export interface CheckpointType { id: string; name: string; description?: string }

export interface CheckpointMatch {
  status?: string[]; status_code?: string[]; status_type?: string[];
  exception_code?: string[];
  location_country_code?: string[]; location_postal_code?: string[];
  location_city?: string[]; location_type?: string[];
  latest?: boolean; zip_matches_destination?: boolean; free_text?: string;
}

export interface Checkpoint {
  id: string;
  checkpointTypeId: string;
  note?: string;
  match: CheckpointMatch;
  expectedDurationHours?: number;
  warnAfterHours?: number;
  criticalAfterHours?: number;
  correctness: CheckpointCorrectness[];   // prázdné = jen „musí nastat"
}
```

`CheckpointMatch` pokrývá pole z Par-Ser `activities[]` záznamu (status, kódy, lokace). **Bez časových polí** — timing řeší `CheckpointCorrectness`.

### 5.4 Správnost checkpointu (`CheckpointCorrectness`)

Časová podmínka: checkpoint musí nastat do/za N hod/dní od **předchozí události** (milník nebo systémová data).

```ts
export interface CheckpointCorrectness {
  id: string;
  aspect?: "record_created" | "record_event_time";
  operator: "within" | "longer_than" | "exact";
  anchorKind: "checkpoint" | "system_event" | "field" | "absolute_time";
  anchorLabel: string;              // lidský popis pro UI
  value?: number;
  unit?: "h" | "d" | "bd";
  anchorCheckpointTypeId?: string;  // id milníku (kotva)
  specificTime?: string;            // HH:MM — upřesnění času, jen pokud unit = d/bd
}
```

**UI v `SegmentEditorPage` (`CorrectnessRuleCard`):**

1. **Předchozí událost** — dropdown ve dvou skupinách:
   - *Milník trasy* — typy checkpointů z `checkpointTypesStore`
   - *Systémová data* — `sys_created`, `sys_pickup`, `sys_order_created`, `sys_add`, `sys_carrier_delivery`
2. **Časový odstup** — toggle **hodiny | dny**:
   - Operator select (`do` / `déle než` / `přesně`) + číslo + kontextový label
   - Pokud dny: volitelný time input „Nejpozději v HH:MM" (uložen do `specificTime`)
3. **Souhrn** — pill s výsledným textem (např. „do 2 dní od Vyzvednutí zásilky · nejpozději 22:00")

---

## 6. Storage a seed

Data jsou uložena **výhradně v paměti** (in-memory store). Žádný localStorage, žádná persistence mezi reloady. Seed je pevně daný v `src/lib/model/seed.ts`.

Stores (`src/lib/model/store.ts`):
- `rulesStore` — `Rule[]`
- `routesStore` — `Route[]`
- `segmentsStore` — `Segment[]`
- `checkpointTypesStore` — `CheckpointType[]`
- `sampleShipmentsStore` — `SampleShipment[]` (read-only)

Každý store má `getState()`, `setState()`, `useItems()` (React hook), `upsert()`, `remove()`, `reset()`.

---

## 7. Navigace (TanStack Router)

| Cesta | Komponenta | Co dělá |
|---|---|---|
| `/` | `RulesList` | Tabulka pravidel |
| `/rules/new` | layout | Průvodce tvorbou pravidla |
| `/rules/new/` | `RuleCreatorPage` | Výběr oblasti + konfigurace situace |
| `/rules/new/edit` | `RuleEditor` | Finální editor pravidla |
| `/trasy` | `RoutesAndSegmentsPage` | Seznam tras a úseků |
| `/trasa/$id` | `RouteEditorPage` | Editor konkrétní trasy |
| `/usek/$id` | `SegmentEditorPage` | Editor úseku s checkpointy a správností |

---

## 8. Implementační mapa (kde co žije)

| Co | Soubor |
|---|---|
| Datové typy (Rule, Route, Segment, Checkpoint…) | `src/lib/model/types.ts` |
| Oblasti (AREAS, areaById) | `src/lib/model/areas.ts` |
| In-memory stores | `src/lib/model/store.ts` |
| Seed data | `src/lib/model/seed.ts` |
| Ikony oblastí | `src/components/common/areaIcons.tsx` |
| Výběr oblasti + konfigurace situace | `src/components/rules/RuleCreatorPage.tsx` |
| Finální editor pravidla | `src/components/rules/RuleEditor.tsx` |
| Seznam pravidel | `src/components/rules/RulesList.tsx` |
| Trasy + úseky (přehled) | `src/components/routes/RoutesAndSegmentsPage.tsx` |
| Editor úseku (checkpointy, správnost) | `src/components/routes/SegmentEditorPage.tsx` |
| Editor trasy | `src/components/routes/RouteEditorPage.tsx` |
| Top nav | `src/components/AppHeader.tsx` |
