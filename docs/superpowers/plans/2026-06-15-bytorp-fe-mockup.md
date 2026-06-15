# Bytorp FE mockup (UX scaffold) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Postavit klikací FE scaffold (reálné React komponenty + navigace, fake/statická data, žádný evaluator) pro všechny obrazovky redesignu, aby šlo odladit UX před stavbou logiky.

**Architecture:** Nové cílové-modelové typy + statický seed + jednoduché in-memory stores (vzor stávajícího `store.ts`). Obrazovky se staví na nich. Evaluator a editovatelné vzorové zásilky jsou MIMO (Plán B) — test panel zobrazuje stubovaný výsledek. Vizuální zdroj pravdy = schválené mockupy z brainstormingu; styling přes **stávající Tailwind tokeny** (`bg-surface`, `bg-background`, `text-primary`, `bg-primary`, `primary-soft`, `border-border`) → bílé pozadí + fialový brand. Plný funkční rozsah (např. všechny `ActionType`) se v UI **vystaví** (stub), reálné chování dořeší Plán B.

**Tech Stack:** Vite, TanStack Start/Router (file-based `src/routes`), React 19, Tailwind v4, shadcn/Radix UI (`src/components/ui`), lucide-react.

**Verifikace:** Projekt nemá test runner a tohle je UX scaffold → každý úkol se ověřuje přes dev server + preview (render + proklik), ne unit testy. Dev server: `npm run dev` na `:8080`.

> Spec: `docs/superpowers/specs/2026-06-15-bytorp-modul-redesign-design.md`. Tento plán pokrývá jen UI vrstvu (Plán A).

---

## File structure (co se vytvoří)

- `src/lib/model/types.ts` — cílové-modelové typy pro UI (Area, CheckpointType, Checkpoint, Route, Rule, podmínky, Action, SampleShipment).
- `src/lib/model/seed.ts` — statický fake seed.
- `src/lib/model/store.ts` — in-memory stores (rules, routes, checkpointTypes, sampleShipments) dle vzoru `src/lib/vkr/store.ts`.
- `src/lib/model/areas.ts` — definice 5 oblastí (label, popis, ikona, enabled).
- `src/components/common/PlainToken.tsx` — „žeton" do věty v lidské řeči.
- `src/components/common/SectionCard.tsx` — karta sekce s hlavičkou (ikona + název).
- `src/components/common/AreaBadge.tsx` — badge oblasti.
- `src/components/rules/RulesList.tsx`, `AreaPicker.tsx`, `RuleEditor.tsx`, `editors/RouteComplianceEditor.tsx` (⑤), `editors/TrackingAggregateEditor.tsx` (④), `ActionsEditor.tsx`.
- `src/components/routes/RouteEditor.tsx`, `CheckpointWizard.tsx`, `RouteMap.tsx`, `CoverageEditor.tsx`.
- `src/components/test/TestPanel.tsx` — shell „Otestovat" (stub výsledek).
- Routy: úprava `src/routes/index.tsx` (seznam pravidel), `src/routes/trasy.tsx` (seznam tras), nová `src/routes/test.tsx`.

> Staré `src/lib/vkr/*` a `src/lib/routes/*` zůstávají v repu, ale nové obrazovky je nepoužívají (Plán B je nahradí/odstraní). Seed reset = bez migrace.

---

## Task 1: Model typy (fake-data shapes)

**Files:**
- Create: `src/lib/model/types.ts`

- [ ] **Step 1: Napsat typy**

```ts
export type Area = "tracking_records" | "route_compliance" | "order_eval" | "unpickup" | "params_price";

export type Priority = "low" | "medium" | "high" | "urgent";
export type TriggerKind = "condition_met" | "schedule" | "manual";

export interface CheckpointType { id: string; name: string; description?: string }

// Par-Ser snake_case match (podmnožina ParSerPackageActivityDetailSchema)
export interface CheckpointMatch {
  status?: string[]; status_code?: string[]; status_type?: string[];
  exception_code?: string[];
  location_country_code?: string[]; location_postal_code?: string[]; location_type?: string[];
  latest?: boolean; zip_matches_destination?: boolean; free_text?: string;
}

export interface CheckpointCorrectness {
  id: string;
  aspect?: "record_created" | "record_event_time";
  operator: "within" | "longer_than" | "exact";
  // zjednodušená kotva pro mockup (Plán B sjednotí na TimeAnchor)
  anchorKind: "checkpoint" | "system_event" | "field" | "absolute_time";
  anchorLabel: string;            // lidský popis pro mockup
  value?: number; unit?: "h" | "d" | "bd";
}

export interface Checkpoint {
  id: string; checkpointTypeId: string; note?: string;
  match: CheckpointMatch;
  expectedDurationLabel?: string;
  correctness: CheckpointCorrectness[];   // prázdné = jen "musí nastat"
}

export interface Route {
  id: string; code: string; name: string; active: boolean;
  carriers: string[]; transportTypes: string[]; destCountries: string[];
  checkpoints: Checkpoint[];
}

export type Condition =
  | { kind: "field"; fieldId: string; operator: string; value?: string }
  | { kind: "tracking_aggregate"; trackingFieldId: string; valueMode: "same_repeats" | "specific"; expectedValue?: string; count: number; occurrence: "consecutive" | "any" }
  | { kind: "route_compliance"; mode: "checkpoint_type" | "general"; checkpointTypeId?: string; generalCheck?: "unrecognized_location" | "unrecognized_status" };

export type ActionType = "create_vkr" | "send_email" | "set_field" | "change_phase" | "update_vkr" | "add_note" | "request_field_from_operator";
export interface Action {
  id: string; type: ActionType;
  runWhenRouteCondition?: "fulfilled" | "not_fulfilled";
  title?: string; body?: string; fieldId?: string; value?: string; priority?: Priority;
}

export interface Rule {
  id: string; code: string; name: string; area: Area; active: boolean; priority: Priority;
  trigger: { kind: TriggerKind; label: string };
  conditions: Condition[];
  actions: Action[];
}

export interface SampleActivity { status?: string; status_code?: string; location_city?: string; location_country_code?: string; location_postal_code?: string; latest?: boolean; status_datetime?: string }
export interface SampleShipment {
  id: string; label: string;
  carrier: string; transport_type: string; country_import: string; state: string;
  dest_postal_code?: string; etd?: string; eta?: string;
  activities: SampleActivity[];
}
```

- [ ] **Step 2: Verify build** — Run `npm run dev`; expected: server starts bez TS chyb (`/tmp` log clean). Commit.

```bash
git add src/lib/model/types.ts && git commit -m "feat(model): target-model UI types for FE mockup"
```

---

## Task 2: Oblasti + statický seed

**Files:**
- Create: `src/lib/model/areas.ts`, `src/lib/model/seed.ts`

- [ ] **Step 1: `areas.ts`**

```ts
import type { Area } from "./types";
export const AREAS: { id: Area; label: string; description: string; icon: string; enabled: boolean }[] = [
  { id: "tracking_records", label: "Záznamy z trackingu", description: "Analýza přímo nad tracking záznamy — opakování hodnoty, zaseknutí, opakovaný pokus.", icon: "ListSearch", enabled: true },
  { id: "route_compliance", label: "Soulad s předepsanou trasou", description: "Reaguj na milník trasy: proběhl správně, nebo ne.", icon: "Route", enabled: true },
  { id: "order_eval", label: "Vyhodnocení objednávky", description: "Úplnost dat objednávky — doklady, platba, clení, pojištění.", icon: "ClipboardCheck", enabled: false },
  { id: "unpickup", label: "Nevyzvednutá objednávka", description: "Vyzvednutí neproběhlo do termínu.", icon: "PackageOff", enabled: false },
  { id: "params_price", label: "Parametry a cena", description: "Deklarováno vs. tracking — váha, rozměry.", icon: "Scale", enabled: false },
];
export const areaById = (id: Area) => AREAS.find(a => a.id === id)!;
```

- [ ] **Step 2: `seed.ts`** — statická data pro UI (checkpointTypes, jedna trasa s typovanými checkpointy, ~4 pravidla v ④/⑤, ~2 vzorové zásilky). Napsat plné objekty dle typů z Tasku 1 (milníky: „Odlet ze země odeslání", „Příchod na clení", „První scan v cíli", „Destination Facility", „Doručeno"; pravidla R10 „Příchod na clení neproběhl správně" ⑤, T01 „Zásilka se zasekla na jednom místě" ④, R11, T02; vzorové zásilky FedEx/AIR/CZ s `activities[]`).

- [ ] **Step 3: Verify + commit**

```bash
git add src/lib/model/areas.ts src/lib/model/seed.ts && git commit -m "feat(model): areas + static seed for FE mockup"
```

---

## Task 3: In-memory stores

**Files:**
- Create: `src/lib/model/store.ts`
- Reference: `src/lib/vkr/store.ts` (vzor `useRules`/listeners)

- [ ] **Step 1:** Implementovat dle vzoru `vkr/store.ts` čtyři hooky/stores nad seedem: `useRules()/rulesStore`, `useRoutes()/routesStore`, `useCheckpointTypes()`, `useSampleShipments()`. Pro mockup stačí in-memory (bez localStorage), s `upsert`/`all`/`byId` a `reset`.

- [ ] **Step 2: Verify + commit**

```bash
git add src/lib/model/store.ts && git commit -m "feat(model): in-memory stores over seed"
```

---

## Task 4: Sdílené UI primitivy

**Files:**
- Create: `src/components/common/PlainToken.tsx`, `SectionCard.tsx`, `AreaBadge.tsx`

- [ ] **Step 1: `PlainToken.tsx`** — žeton do věty (vyplněný, hodnota `font-medium`, šipka tlumená). Třídy: `inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-0.5 font-medium`. Props: `children`, `chevron?: boolean`.

- [ ] **Step 2: `SectionCard.tsx`** — karta sekce: `rounded-xl border border-border bg-background p-4`; hlavička `flex items-center gap-2 pb-2.5 mb-3 border-b border-border` s `icon` (lucide), `title` (`text-sm font-medium`), volitelný `aside` vpravo. Props: `icon`, `title`, `subtitle?`, `aside?`, `children`.

- [ ] **Step 3: `AreaBadge.tsx`** — badge oblasti: malé pill s ikonou + labelem; ④ teal odstín, ⑤ purple (`primary-soft`/`text-primary`), ostatní neutrální. Props: `area`.

- [ ] **Step 4: Verify + commit**

```bash
git add src/components/common && git commit -m "feat(ui): shared primitives — PlainToken, SectionCard, AreaBadge"
```

---

## Task 5: Seznam pravidel (route `/`)

**Files:**
- Modify: `src/routes/index.tsx`
- Create: `src/components/rules/RulesList.tsx`

**Design:** dle mockupu „Seznam pravidel" — sidebar „Pravidla" (Všechna/Aktivní/Archiv) + „Oblasti" (④⑤ s počty, ①②③ ztlumené „brzy"); vpravo seznam řádků pravidel (kód, název, `AreaBadge`, spouštěč chip, priorita, stav). Primární „+ Nové pravidlo" (`bg-primary text-primary-foreground`) → naviguje na `/rules/new` (Task 6).

- [ ] **Step 1:** Napsat `RulesList.tsx` konzumující `useRules()`, `AREAS`, filtr podle vybrané oblasti (lokální state). Použít `AppHeader current="rules"`.
- [ ] **Step 2:** Napojit v `src/routes/index.tsx` (`createFileRoute("/")`).
- [ ] **Step 3: Verify** — `preview_start`; navigovat `/`; `preview_snapshot` ověřit sidebar s „Oblasti" + řádky pravidel; `preview_screenshot`.
- [ ] **Step 4: Commit**

```bash
git add src/routes/index.tsx src/components/rules/RulesList.tsx && git commit -m "feat(rules): rules list with areas sidebar"
```

---

## Task 6: Nové pravidlo — výběr oblasti (route `/rules/new`)

**Files:**
- Create: `src/routes/rules.new.tsx`, `src/components/rules/AreaPicker.tsx`

**Design:** dle mockupu „výběr oblasti" — 5 karet (④⑤ klikací, ①②③ `opacity-60` + „připravujeme"). **Navíc pole „Název pravidla"** (rozhodnutí: pojmenování v kroku 1). Předvýběr oblasti z query (`?area=`) když uživatel přišel z oblasti v sidebaru. „Pokračovat" → `/rules/new/edit?area=...&name=...`.

- [ ] **Step 1:** `AreaPicker.tsx` — grid `repeat(auto-fit,minmax(200px,1fr))`, karty z `AREAS`, input názvu nahoře, předvybraná oblast zvýrazněná (`border-2 border-primary`).
- [ ] **Step 2:** Route `rules.new.tsx`, čte `area` z search params (TanStack `validateSearch`).
- [ ] **Step 3: Verify** — navigovat `/rules/new` a `/rules/new?area=tracking_records` (ověřit předvýběr); screenshot.
- [ ] **Step 4: Commit**

```bash
git add src/routes/rules.new.tsx src/components/rules/AreaPicker.tsx && git commit -m "feat(rules): area picker step with rule name + preselect"
```

---

## Task 7: Editor pravidla — shell + sekce (route `/rules/new/edit`)

**Files:**
- Create: `src/routes/rules.new.edit.tsx`, `src/components/rules/RuleEditor.tsx`, `src/components/rules/ActionsEditor.tsx`

**Design:** dle finálního mockupu „oddělené sekce" — tichý titulek (název) + minimalizované priorita/stav; tři `SectionCard`: **Spouštěč** (ikona Clock), **Podmínka** (ikona Filter; obsah dle oblasti — Task 8), **Akce** (ikona Bolt). Patička: „← Zpět na oblast", „Otestovat" (→ `/test`), „Uložit pravidlo" (`bg-primary`).

- [ ] **Step 1:** `RuleEditor.tsx` — přijímá `area`+`name`; vykreslí 3 `SectionCard`. Spouštěč = `PlainToken` (label dle oblasti, ④ „při každé nové tracking události"). Podmínka = delegace na editor oblasti (Task 8). Akce = `ActionsEditor`.
- [ ] **Step 2:** `ActionsEditor.tsx` — **vystavit celý `ActionType` set** v dropdownu (create_vkr/send_email/set_field/change_phase/update_vkr/add_note/request_field_from_operator) + pro ⑤ přepínač větve `runWhenRouteCondition` (fulfilled/not). Hodnoty stubované přes `PlainToken`. „+ přidat akci".
- [ ] **Step 3:** Route `rules.new.edit.tsx`.
- [ ] **Step 4: Verify** — navigovat z area pickeru „Pokračovat"; ověřit 3 oddělené sekce + dropdown akcí se všemi typy; screenshot.
- [ ] **Step 5: Commit**

```bash
git add src/routes/rules.new.edit.tsx src/components/rules/RuleEditor.tsx src/components/rules/ActionsEditor.tsx && git commit -m "feat(rules): rule editor shell with separated sections + full action set"
```

---

## Task 8: Editory podmínky pro ④ a ⑤

**Files:**
- Create: `src/components/rules/editors/TrackingAggregateEditor.tsx` (④), `src/components/rules/editors/RouteComplianceEditor.tsx` (⑤)

- [ ] **Step 1: `TrackingAggregateEditor.tsx`** (④) — segmentový přepínač režimu („stejná hodnota se opakuje" / „konkrétní = …") v hlavičce sekce; věta v lidské řeči s `PlainToken` (pole = Par-Ser tracking pole, count, consecutive/any). Hero text `text-base leading-[2.4]`.
- [ ] **Step 2: `RouteComplianceEditor.tsx`** (⑤) — věta „Na trase zásilky sleduj milník [checkpointType]" (`PlainToken` z `useCheckpointTypes()`); info řádek „Definice ‚správně' je na trase". (Akce se větví v `ActionsEditor`.)
- [ ] **Step 3:** Zapojit do `RuleEditor` přepínačem podle `area`.
- [ ] **Step 4: Verify** — projít obě oblasti (`?area=tracking_records` i `route_compliance`), ověřit odlišný obsah Podmínky; screenshoty obou.
- [ ] **Step 5: Commit**

```bash
git add src/components/rules/editors && git commit -m "feat(rules): area-tailored condition editors (tracking_aggregate, route_compliance)"
```

---

## Task 9: Editor trasy — pokrytí + milníky + mapa (route `/trasy`)

**Files:**
- Modify: `src/routes/trasy.tsx`
- Create: `src/components/routes/RouteEditor.tsx`, `CoverageEditor.tsx`, `RouteMap.tsx`

**Design:** dle mockupu „celé nastavení trasy" — `CoverageEditor` (dopravce × transport_type × cílová země pilulkami), milníky jako sled chipů, pod nimi `RouteMap` (SVG schematická trasa s body, aktivní milník zvýrazněný). Klik na bod/chip vybere milník (→ Task 10).

- [ ] **Step 1: `RouteMap.tsx`** — SVG dle mockupu (casing + purple polyline + číslované piny + popisky), props `milestones`, `activeIndex`, `onSelect`.
- [ ] **Step 2: `CoverageEditor.tsx`** — tři skupiny pilulek (multi-select), hodnoty stub.
- [ ] **Step 3: `RouteEditor.tsx`** — složí pokrytí + milníky + mapu; lokální `activeMilestoneId`.
- [ ] **Step 4:** Napojit `trasy.tsx`.
- [ ] **Step 5: Verify** — navigovat `/trasy`; ověřit pokrytí + mapu s 5 body; klik na bod mění aktivní; screenshot.
- [ ] **Step 6: Commit**

```bash
git add src/routes/trasy.tsx src/components/routes/RouteEditor.tsx src/components/routes/CoverageEditor.tsx src/components/routes/RouteMap.tsx && git commit -m "feat(routes): route editor with coverage, milestones and schematic map"
```

---

## Task 10: Průvodce checkpointem (vertikální)

**Files:**
- Create: `src/components/routes/CheckpointWizard.tsx`
- Modify: `src/components/routes/RouteEditor.tsx` (zobrazit pod mapou pro aktivní milník)

**Design:** dle finálního mockupu „vertikální vzdušný průvodce" — svislá osa s čísly; krok 1 (vyber/​**vytvoř** checkpointType) sbalený po vyplnění; krok 2 „Jak poznáme, že nastal?" (match v lidské řeči, `PlainToken`); krok 3 „Jak má správně proběhnout?" — **prázdný stav „+ přidat časové očekávání"** (žádný checkbox). Návrh dle CP stejného typu (žárovkový pruh). Jediné primární „Uložit milník" ve fialové; „← Zpět na trasu".

- [ ] **Step 1:** Napsat `CheckpointWizard.tsx` (props: milestone, checkpointTypes, onSave). Kroky jako řádky s `position:relative` osou.
- [ ] **Step 2:** Vložit do `RouteEditor` pod mapu pro `activeMilestone`.
- [ ] **Step 3: Verify** — `/trasy`, vybrat milník, ověřit 3 vertikální kroky + prázdný krok 3 + „Uložit milník" fialové; screenshot.
- [ ] **Step 4: Commit**

```bash
git add src/components/routes/CheckpointWizard.tsx src/components/routes/RouteEditor.tsx && git commit -m "feat(routes): vertical checkpoint setup wizard"
```

---

## Task 11: Test panel „Otestovat" (shell, stub výsledek) — route `/test`

**Files:**
- Create: `src/routes/test.tsx`, `src/components/test/TestPanel.tsx`

**Design:** vyber vzorovou zásilku (`useSampleShipments()`) + vyber pravidlo → tlačítko „Otestovat" → **stubovaný `RuleOutcome`** (checkpointy splněny/ne, fulfilled/not, jaká VkŘ by vznikla) + lidský popis. (Reálné vyhodnocení = Plán B; tady jen statický ukázkový výsledek.)

- [ ] **Step 1:** `TestPanel.tsx` — výběr zásilky a pravidla, výsledková karta (stub) s `AreaBadge` a popisem.
- [ ] **Step 2:** Route `test.tsx` + odkaz z `RuleEditor` „Otestovat".
- [ ] **Step 3: Verify** — `/test`, vybrat zásilku+pravidlo, „Otestovat" → výsledková karta; screenshot.
- [ ] **Step 4: Commit**

```bash
git add src/routes/test.tsx src/components/test/TestPanel.tsx && git commit -m "feat(test): Otestovat panel shell with stubbed outcome"
```

---

## Task 12: Konzistenční průchod

- [ ] **Step 1:** Projít všechny obrazovky v preview na různých šířkách (`preview_resize`), sjednotit: bílé pozadí (`bg-background`/`bg-surface`), fialová jen pro primární akce, hlavičky sekcí (ikona + název) konzistentní i v editoru ⑤ a v průvodci, minimalizovaná priorita/stav, jednotné `PlainToken`.
- [ ] **Step 2:** Opravit odchylky inline.
- [ ] **Step 3: Verify** — screenshoty seznam pravidel, area picker, editor ④, editor ⑤, editor trasy, test panel.
- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "polish: visual consistency pass across mockup screens"
```

---

## Mimo rozsah (Plán B)
Dry-run evaluator (`evaluateRule`), editovatelné vzorové zásilky, reálné napojení test panelu, plné chování akcí/podmínek, datový model s validacemi/migrací, sjednocení časových typů (`Duration`/`TimeAnchor`/`ValueSource`).
