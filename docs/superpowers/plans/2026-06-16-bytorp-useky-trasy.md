# Úseky (segments) — skladba tras · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trasa se skládá ze znovupoužitelných **úseků** (`Segment`) sdílených odkazem; kotva časové podmínky míří na **typ milníku** a řeší se přes složenou trasu; podpis se opraví z `transport_type` na **službu** (`service_type`).

**Architecture:** Kanonický model je `src/lib/model/` (typy + `makeStore` store + seed). Přidáme entitu `Segment`, `Route` přestane držet `checkpoints` a bude držet `segmentIds`. Veškerá skládací/validační logika je čistá funkce v novém `routeAssembly.ts`. UI (`SegmentEditor`, `MilestoneLibrary`, úprava `RouteEditor`/`CheckpointWizard`) tyto čisté funkce konzumuje. Layout přebírá z mockupů ve `docs/superpowers/specs/mockups/`.

**Tech Stack:** Vite + React + TypeScript + TanStack Router, Tailwind, localStorage. **Bez testů** → každý krok ověřuje `npm run build` (tsc), `npm run lint` a vizuální kontrola v `npm run dev` preview.

**Spec:** `docs/superpowers/specs/2026-06-16-bytorp-useky-trasy-design.md`

---

## File Structure

**Nové soubory:**
- `src/lib/model/routeAssembly.ts` — čisté funkce: složení trasy z úseků, počty použití, závislosti úseku, validace skladby, výběr vhodných úseků.
- `src/components/routes/MilestoneLibrary.tsx` — levá knihovna typů milníků (počet použití + „nový milník" psaním).
- `src/components/routes/SegmentEditor.tsx` — editor jednoho úseku (jméno, popis, podpis, checkpointy + knihovna).
- `src/components/routes/SegmentsPanel.tsx` — seznam úseků na stránce Trasy + otevření editoru úseku.

**Měněné soubory:**
- `src/lib/model/types.ts` — `Segment`; `Route` (`checkpoints`→`segmentIds`, `transportTypes`→`serviceTypes`, +`destZone?`); `CheckpointCorrectness` (+`anchorCheckpointTypeId?`); `SampleShipment` (`transport_type`→`service_type`).
- `src/lib/model/store.ts` — segments store (`useSegments`, `segmentsStore`).
- `src/lib/model/seed.ts` — `SEGMENTS`; `ROUTES` přes `segmentIds`; rename polí; vzorové zásilky `service_type`.
- `src/components/routes/CoverageEditor.tsx` — `transportTypes`→`serviceTypes`, label, + volitelná cílová zóna.
- `src/components/routes/RouteEditor.tsx` — milníky ze složené trasy; sekce „Úseky" (skládání, filtr, validace, „použito na N trasách").
- `src/components/routes/CheckpointWizard.tsx` — kotva „od milníku" = výběr **typu** (`anchorCheckpointTypeId`).
- `src/components/test/TestPanel.tsx` — `transport_type`→`service_type`; čte složenou trasu místo `route.checkpoints`.
- `src/routes/trasy.tsx` — vedle editoru trasy zobrazí `SegmentsPanel`.

---

## Task 1: Rename transport → service (podpis = služba)

Samostatný, build zůstává zelený. Žádná změna struktury, jen názvy + hodnoty.

**Files:**
- Modify: `src/lib/model/types.ts:35` (Route), `:61` (SampleShipment)
- Modify: `src/lib/model/seed.ts:29` a další `transportTypes`, `:215`/`:264` a další `transport_type`
- Modify: `src/components/routes/CoverageEditor.tsx:56,68,69`
- Modify: `src/components/test/TestPanel.tsx:35`

- [ ] **Step 1: types.ts — přejmenovat pole**

V `Route` změň `transportTypes: string[]` → `serviceTypes: string[]`.
V `SampleShipment` změň `transport_type: string` → `service_type: string`.

- [ ] **Step 2: seed.ts — přejmenovat klíče a hodnoty**

Všechny výskyty `transportTypes:` → `serviceTypes:`, hodnoty převeď na `ServicesTypes`: `"AIR"`/`"Express"`/`"Pallet"`/`"Freight"` → `"ECONOMY"` nebo `"EXPRESS"` (u stávajících tras zvol `"ECONOMY"`). Všechny `transport_type:` u vzorových zásilek → `service_type:` se stejnou logikou hodnot.

- [ ] **Step 3: CoverageEditor.tsx — pole + label**

Na řádcích používajících `route.transportTypes` přejmenuj na `route.serviceTypes`. Label `"Varianta přepravy (transport_type)"` → `"Služba (service_type)"`. Seznam voleb nastav na `["EXPRESS", "ECONOMY"]`.

- [ ] **Step 4: TestPanel.tsx — matching**

Na řádku 35 `shipment.transport_type` → `shipment.service_type`.

- [ ] **Step 5: Ověř + commit**

```bash
npm run build && npm run lint
```
Expected: build i lint projdou (žádný zbylý `transportType`/`transport_type` mimo `src/lib/routes/` legacy).
```bash
grep -rn "transportType\|transport_type" src | grep -v "lib/routes/"
```
Expected: prázdné.
```bash
git add src/lib/model/types.ts src/lib/model/seed.ts src/components/routes/CoverageEditor.tsx src/components/test/TestPanel.tsx
git commit -m "refactor(model): podpis trasy = služba (service_type), ne transport_type"
```

---

## Task 2: Typy pro úseky a kotvu na typ

Aditivní změny typů — build zůstává zelený (nová pole jsou volitelná / nové typy nepoužité).

**Files:**
- Modify: `src/lib/model/types.ts`

- [ ] **Step 1: Přidat `Segment`, upravit `Route`, `CheckpointCorrectness`**

Do `types.ts`:

```ts
export interface Segment {
  id: string;
  name: string;                 // „ČR → Paříž"
  description?: string;         // orientace: „Paříž → US hub, pro USA trasy"
  carriers: string[];           // service_provider (CarriersProviders)
  serviceTypes: string[];       // service_type (ServicesTypes: EXPRESS/ECONOMY)
  checkpoints: Checkpoint[];    // uspořádané
}
```

V `CheckpointCorrectness` přidej pole (u `anchorKind === "checkpoint"` drží typ milníku, na který kotva míří):

```ts
  anchorCheckpointTypeId?: string;
```

V `Route` nahraď `checkpoints: Checkpoint[];` za:

```ts
  segmentIds: string[];         // uspořádané odkazy na úseky
  destZone?: string[];          // volitelná jemnější zóna (stát / PSČ prefix)
```

> Poznámka: odstranění `checkpoints` z `Route` rozbije seed/komponenty — ty se opraví v Tasku 4. Mezi Taskem 2 a 4 nebude build zelený; commit Tasku 2 udělej až po build-checku v Tasku 4, NEBO doplň `checkpoints` dočasně ponech a odeber v Tasku 4. **Zvolený postup:** v Tasku 2 `checkpoints` zatím PONECH a jen přidej `segmentIds`/`destZone`/`Segment`/`anchorCheckpointTypeId` (vše aditivní). `checkpoints` z `Route` se odebere až v Tasku 4.

Tedy v Tasku 2 do `Route` POUZE PŘIDEJ `segmentIds: string[];` a `destZone?: string[];`, `checkpoints` ponech.

- [ ] **Step 2: Ověř + commit**

```bash
npm run build && npm run lint
```
Expected: projde (vše aditivní). `segmentIds` zatím nikdo nečte.
```bash
git add src/lib/model/types.ts
git commit -m "feat(model): typy Segment, Route.segmentIds/destZone, kotva na typ milníku"
```

---

## Task 3: Čisté funkce skladby trasy (`routeAssembly.ts`)

**Files:**
- Create: `src/lib/model/routeAssembly.ts`

- [ ] **Step 1: Napsat helpery**

```ts
import type { Route, Segment, Checkpoint } from "./types";

/** Složená trasa = zřetězení checkpointů úseků v pořadí segmentIds. */
export function assembledCheckpoints(route: Route, segments: Segment[]): Checkpoint[] {
  const byId = new Map(segments.map((s) => [s.id, s]));
  return route.segmentIds.flatMap((id) => byId.get(id)?.checkpoints ?? []);
}

/** Kolik tras úsek používá (pro „použito na N trasách"). */
export function segmentUsageCount(segmentId: string, routes: Route[]): number {
  return routes.filter((r) => r.segmentIds.includes(segmentId)).length;
}

/** Počet použití každého typu milníku napříč všemi úseky. */
export function milestoneTypeUsage(segments: Segment[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const s of segments)
    for (const cp of s.checkpoints)
      m.set(cp.checkpointTypeId, (m.get(cp.checkpointTypeId) ?? 0) + 1);
  return m;
}

/** Typy milníků, na které kotvy úseku míří, ale úsek je sám nepřináší. */
export function segmentDependencies(segment: Segment): string[] {
  const own = new Set(segment.checkpoints.map((cp) => cp.checkpointTypeId));
  const deps = new Set<string>();
  for (const cp of segment.checkpoints)
    for (const c of cp.correctness)
      if (c.anchorKind === "checkpoint" && c.anchorCheckpointTypeId && !own.has(c.anchorCheckpointTypeId))
        deps.add(c.anchorCheckpointTypeId);
  return [...deps];
}

export interface CompositionIssue {
  kind: "duplicate_type" | "anchor_missing" | "anchor_order";
  checkpointTypeId: string;
  message: string;
}

/** Validace složené trasy: unikátnost typu + kotvy (přítomnost a pořadí). */
export function validateRouteComposition(segmentIds: string[], segments: Segment[]): CompositionIssue[] {
  const byId = new Map(segments.map((s) => [s.id, s]));
  const ordered = segmentIds.map((id) => byId.get(id)).filter(Boolean) as Segment[];
  const issues: CompositionIssue[] = [];

  const typeFirstPos = new Map<string, number>();
  const typeCount = new Map<string, number>();
  let pos = 0;
  for (const seg of ordered)
    for (const cp of seg.checkpoints) {
      typeCount.set(cp.checkpointTypeId, (typeCount.get(cp.checkpointTypeId) ?? 0) + 1);
      if (!typeFirstPos.has(cp.checkpointTypeId)) typeFirstPos.set(cp.checkpointTypeId, pos);
      pos++;
    }

  for (const [t, n] of typeCount)
    if (n > 1) issues.push({ kind: "duplicate_type", checkpointTypeId: t, message: `Milník je na trase ${n}×` });

  pos = 0;
  for (const seg of ordered)
    for (const cp of seg.checkpoints) {
      for (const c of cp.correctness)
        if (c.anchorKind === "checkpoint" && c.anchorCheckpointTypeId) {
          const target = c.anchorCheckpointTypeId;
          if (!typeFirstPos.has(target))
            issues.push({ kind: "anchor_missing", checkpointTypeId: target, message: "Kotva míří na milník, který na trase není" });
          else if (typeFirstPos.get(target)! >= pos)
            issues.push({ kind: "anchor_order", checkpointTypeId: target, message: "Kotvený milník není na trase dříve" });
        }
      pos++;
    }

  return issues;
}

/** Vhodné úseky pro přidání: shoda podpisu; `conflict=true` = přinesl by už přítomný typ. */
export function eligibleSegments(
  route: Pick<Route, "carriers" | "serviceTypes" | "segmentIds">,
  segments: Segment[],
): { segment: Segment; conflict: boolean }[] {
  const byId = new Map(segments.map((s) => [s.id, s]));
  const present = new Set(
    route.segmentIds.flatMap((id) => byId.get(id)?.checkpoints.map((c) => c.checkpointTypeId) ?? []),
  );
  const sigOk = (s: Segment) =>
    s.carriers.some((c) => route.carriers.includes(c)) &&
    s.serviceTypes.some((t) => route.serviceTypes.includes(t));
  return segments
    .filter((s) => sigOk(s) && !route.segmentIds.includes(s.id))
    .map((s) => ({ segment: s, conflict: s.checkpoints.some((c) => present.has(c.checkpointTypeId)) }));
}
```

- [ ] **Step 2: Ověř + commit**

```bash
npm run build && npm run lint
```
Expected: projde (čistý modul, zatím nepoužitý).
```bash
git add src/lib/model/routeAssembly.ts
git commit -m "feat(model): čisté funkce skladby trasy z úseků + validace"
```

---

## Task 4: Migrace Route na úseky — store + seed + konzumenti

Toto je „přepínací" task: `Route.checkpoints` se odebere, vše se přepojí na úseky. Build je zelený až na konci.

**Files:**
- Modify: `src/lib/model/types.ts` (odebrat `checkpoints` z `Route`)
- Modify: `src/lib/model/store.ts` (segments store)
- Modify: `src/lib/model/seed.ts` (`SEGMENTS`, `ROUTES.segmentIds`)
- Modify: `src/components/routes/RouteEditor.tsx` (assembled checkpoints)
- Modify: `src/components/test/TestPanel.tsx` (assembled checkpoints)

- [ ] **Step 1: store.ts — segments store**

Do importu ze `"./seed"` přidej `SEGMENTS`. Do importu typů přidej `Segment`. Pod CheckpointTypes store přidej:

```ts
import type { /* …stávající… */ Segment } from "./types";
// v importu ze "./seed" přidej SEGMENTS

const _segments = makeStore<Segment>(SEGMENTS);

export function useSegments(): Segment[] {
  return _segments.useItems();
}

export const segmentsStore = {
  all: (): Segment[] => _segments.getState(),
  byId: (id: string): Segment | undefined =>
    _segments.getState().find((s) => s.id === id),
  upsert(seg: Segment): void {
    const cur = _segments.getState();
    const idx = cur.findIndex((s) => s.id === seg.id);
    _segments.setState(idx >= 0 ? cur.map((s) => (s.id === seg.id ? seg : s)) : [...cur, seg]);
  },
  reset(): void {
    _segments.setState([..._segments.seed]);
  },
};
```

- [ ] **Step 2: seed.ts — vytvořit `SEGMENTS`, přepojit `ROUTES`**

Přidej export `SEGMENTS: Segment[]` (import `Segment` z `./types`). Rozsekej stávající checkpointy první trasy do úseků a vytvoř ukázku sdílení. Minimálně:

```ts
export const SEGMENTS: Segment[] = [
  {
    id: "seg_cz_arrival",
    name: "ČR → Příchod na clení",
    description: "Sdílený vstup do CZ — společný pro FedEx Air trasy.",
    carriers: ["FedEx"],
    serviceTypes: ["ECONOMY"],
    checkpoints: [
      /* sem přesuň cp_departure a cp_customs z původní route_fx_air_cz;
         u cp_customs.correctness[0] nastav anchorCheckpointTypeId: "ct_departure" */
    ],
  },
  {
    id: "seg_cz_lastmile",
    name: "Příchod na clení → Doručeno",
    description: "Poslední míle v CZ.",
    carriers: ["FedEx"],
    serviceTypes: ["ECONOMY"],
    checkpoints: [ /* cp_first_scan, cp_dest_facility, cp_delivered */ ],
  },
];
```

V `ROUTES` u `route_fx_air_cz` odeber `checkpoints: [...]` a přidej `segmentIds: ["seg_cz_arrival", "seg_cz_lastmile"]`. Stejně u dalších tras. U `cp_customs` přesunutého do `seg_cz_arrival` doplň `anchorCheckpointTypeId: "ct_departure"` k existující correctness (kotva „od Odlet ze země odeslání").

- [ ] **Step 3: types.ts — odebrat `checkpoints` z `Route`**

Z `Route` smaž řádek `checkpoints: Checkpoint[];` (zůstává `segmentIds`).

- [ ] **Step 4: RouteEditor.tsx — složená trasa**

Nahraď čtení `route.checkpoints`:

```ts
import { useRoutes, useCheckpointTypes, useSegments } from "@/lib/model/store";
import { assembledCheckpoints } from "@/lib/model/routeAssembly";
// …
const segments = useSegments();
const checkpoints = assembledCheckpoints(route, segments);
const labels: string[] = checkpoints.map(
  (cp) => ctMap.get(cp.checkpointTypeId) ?? cp.checkpointTypeId,
);
```
(Všude dál `route.checkpoints` → `checkpoints`.)

- [ ] **Step 5: TestPanel.tsx — složená trasa**

Kde TestPanel čte `route.checkpoints`, použij `assembledCheckpoints(route, segmentsStore.all())` (import z `routeAssembly` + `segmentsStore` ze store).

- [ ] **Step 6: Ověř + commit**

```bash
npm run build && npm run lint
```
Expected: projde. V `npm run dev` se trasa `FedEx Air — CZ` zobrazí se stejnými milníky jako dřív (teď složená ze 2 úseků).
```bash
git add src/lib/model/types.ts src/lib/model/store.ts src/lib/model/seed.ts src/components/routes/RouteEditor.tsx src/components/test/TestPanel.tsx
git commit -m "feat(model): Route se skládá z úseků (segmentIds); konzumenti přes assembledCheckpoints"
```

---

## Task 5: Knihovna milníků (`MilestoneLibrary`)

Layout dle `docs/superpowers/specs/mockups/2026-06-16-usek-editor.html` (levý sloupec).

**Files:**
- Create: `src/components/routes/MilestoneLibrary.tsx`

- [ ] **Step 1: Komponenta**

```tsx
import { useCheckpointTypes, useSegments } from "@/lib/model/store";
import { milestoneTypeUsage } from "@/lib/model/routeAssembly";
import { checkpointTypesStore } from "@/lib/model/store";
import { useState } from "react";

export function MilestoneLibrary({ onPick }: { onPick: (checkpointTypeId: string) => void }) {
  const types = useCheckpointTypes();
  const usage = milestoneTypeUsage(useSegments());
  const [draft, setDraft] = useState("");

  function createType() {
    const name = draft.trim();
    if (!name) return;
    const id = "ct_" + Date.now();
    checkpointTypesStore.upsert({ id, name });
    onPick(id);
    setDraft("");
  }

  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm font-medium text-muted-foreground mb-1">Knihovna milníků</p>
      {types.map((t) => (
        <button key={t.id} onClick={() => onPick(t.id)}
          className="flex items-center justify-between rounded-md px-2.5 py-2 text-sm hover:bg-muted">
          <span>{t.name}</span>
          <span className="text-xs text-muted-foreground">{usage.get(t.id) ?? 0}×</span>
        </button>
      ))}
      <div className="flex gap-1.5 mt-1">
        <input value={draft} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && createType()}
          placeholder="Nový milník…" className="flex-1 rounded-md border border-border px-2 py-1 text-sm" />
        <button onClick={createType} className="rounded-md border border-border px-2 text-sm text-primary">+</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Ověř + commit**

```bash
npm run build && npm run lint
git add src/components/routes/MilestoneLibrary.tsx
git commit -m "feat(routes): knihovna milníků s počtem použití a založením psaním"
```

---

## Task 6: Editor úseku (`SegmentEditor`)

Layout dle mockupu (pravý sloupec): hlavička (jméno + podpis + popis), sled checkpointů, „sdílený · N" odznak, kotva = `z jiného úseku` token, závislosti úseku.

**Files:**
- Create: `src/components/routes/SegmentEditor.tsx`

- [ ] **Step 1: Komponenta**

Vstup `segment: Segment`. Renderuje:
- Hlavičku: editovatelné `name`, řádek podpisu `carriers · serviceTypes`, `description` (textarea, prázdný stav = „+ popis").
- Knihovnu `MilestoneLibrary` vlevo; `onPick(typeId)` přidá nový `Checkpoint` `{ id, checkpointTypeId: typeId, match: {}, correctness: [] }` do `segment.checkpoints` a uloží `segmentsStore.upsert(next)`.
- Sled checkpointů: každý ukáže název typu (z `useCheckpointTypes`), a pokud `milestoneTypeUsage(segments).get(typeId)! > 1` → odznak „sdílený · N".
- Pod checkpointy `segmentDependencies(segment)` → seznam „očekává dříve na trase: …".

Klíčový handler:
```tsx
function addMilestone(checkpointTypeId: string) {
  const cp = { id: "cp_" + Date.now(), checkpointTypeId, match: {}, correctness: [] };
  segmentsStore.upsert({ ...segment, checkpoints: [...segment.checkpoints, cp] });
}
```
Pro vykreslení jednotlivého checkpointu deleguj na `CheckpointWizard` (Task 7) předáním checkpointu a `onChange` zpět do `segmentsStore.upsert`.

- [ ] **Step 2: Ověř + commit**

```bash
npm run build && npm run lint
git add src/components/routes/SegmentEditor.tsx
git commit -m "feat(routes): editor úseku s knihovnou milníků a závislostmi"
```

---

## Task 7: Kotva na typ milníku (`CheckpointWizard`)

Dnes kotva = `anchorKind: "checkpoint"` + volný `anchorLabel`. Změň „od milníku" na **výběr typu** z `useCheckpointTypes`, zapiš `anchorCheckpointTypeId` a odvozený `anchorLabel`.

**Files:**
- Modify: `src/components/routes/CheckpointWizard.tsx`

- [ ] **Step 1: Najít sekci kotvy**

V `CheckpointWizard.tsx` najdi, kde se nastavuje `correctness[].anchorKind`/`anchorLabel` (krok „Jak má správně proběhnout?" / „od …").

- [ ] **Step 2: Dropdown typů pro `anchorKind === "checkpoint"`**

Když je `anchorKind === "checkpoint"`, místo volného textu vykresli select naplněný `useCheckpointTypes()`:
```tsx
<select
  value={corr.anchorCheckpointTypeId ?? ""}
  onChange={(e) => {
    const id = e.target.value;
    const name = checkpointTypes.find((t) => t.id === id)?.name ?? "";
    update({ ...corr, anchorCheckpointTypeId: id, anchorLabel: `od milníku ${name}` });
  }}
>
  <option value="" disabled>vyber milník…</option>
  {checkpointTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
</select>
```
(`update` = stávající mechanismus zápisu correctness; `checkpointTypes` z `useCheckpointTypes()`.)

- [ ] **Step 3: Ověř + commit**

```bash
npm run build && npm run lint
```
Expected: v preview krok 3 nabízí výběr typu milníku; uložení zapíše `anchorCheckpointTypeId`.
```bash
git add src/components/routes/CheckpointWizard.tsx
git commit -m "feat(routes): kotva časové podmínky míří na typ milníku"
```

---

## Task 8: Skládání trasy z úseků (`RouteEditor` + `SegmentsPanel`)

**Files:**
- Create: `src/components/routes/SegmentsPanel.tsx`
- Modify: `src/components/routes/RouteEditor.tsx`
- Modify: `src/routes/trasy.tsx`

- [ ] **Step 1: Sekce „Úseky" v RouteEditoru**

Pod „Pokrytí trasy" přidej `SectionCard icon={Route} title="Úseky trasy"`:
- Seznam `route.segmentIds` → název úseku (`segmentsStore.byId`) + `segmentUsageCount(id, routes)` jako „použito na N trasách". Tlačítko odebrat.
- „+ přidat úsek": rozbalí `eligibleSegments(route, segments)`; položky s `conflict` zašedlé a neklikací (tooltip „přináší milník, který už na trase je").
- Pod seznamem `validateRouteComposition(route.segmentIds, segments)` → výpis issues (duplicita / chybějící kotva / pořadí) jako varování.

Handler přidání:
```tsx
function addSegment(segId: string) {
  routesStore.upsert({ ...route, segmentIds: [...route.segmentIds, segId] });
}
```

- [ ] **Step 2: `SegmentsPanel` — knihovna úseků na stránce Trasy**

Komponenta vypíše `useSegments()` (název, podpis, popis), klik otevře `SegmentEditor` pro daný úsek; tlačítko „+ nový úsek" založí prázdný `Segment` (`carriers`/`serviceTypes` předvyplněné z aktuální trasy) a otevře jeho editor.

- [ ] **Step 3: trasy.tsx — zobrazit panel**

Vedle `RouteEditor` vykresli `SegmentsPanel` (např. jako spodní sekce nebo druhý tab). Zachovej jednoduchost stránky (16 řádků dnes).

- [ ] **Step 4: Ověř + commit**

```bash
npm run build && npm run lint
```
Expected: v preview jde k trase přidat úsek z filtrované knihovny; kolidující úsek je zašedlý; validační hlášky se ukazují; u úseku je „použito na N trasách".
```bash
git add src/components/routes/SegmentsPanel.tsx src/components/routes/RouteEditor.tsx src/routes/trasy.tsx
git commit -m "feat(routes): skládání trasy z úseků s filtrem a validací"
```

---

## Task 9: Cílová zóna na trase + úklid

**Files:**
- Modify: `src/components/routes/CoverageEditor.tsx`
- Delete: `docs/superpowers/specs/mockups/*` (statické mockupy — UI je teď v prototypu)

- [ ] **Step 1: Volitelná zóna v CoverageEditoru**

Pod cílové země přidej volitelný vstup „Jemnější cíl (stát / PSČ)" zapisující `route.destZone` (string[]). Prázdný stav = bez zóny (žádný checkbox). Ulož přes `routesStore.upsert`.

- [ ] **Step 2: Odebrat statické mockupy**

```bash
git rm docs/superpowers/specs/mockups/2026-06-16-usek-editor.html \
       docs/superpowers/specs/mockups/2026-06-16-zaznam-match-kotva.svg \
       docs/superpowers/specs/mockups/2026-06-16-trasa-sled-useku.svg
```

- [ ] **Step 3: Ověř + commit**

```bash
npm run build && npm run lint
git add -A
git commit -m "feat(routes): volitelná cílová zóna; úklid statických mockupů"
```

---

## Self-Review (vyplněno při psaní plánu)

- **Spec coverage:** §3 rename → Task 1. §4.1 Segment → Task 2. §4.2 Route segmentIds/destZone → Task 2+4+9. §4.3 match na výskytu → drženo (match už je na Checkpoint). §4.4 kotva na typ + závislosti → Task 2+3+7. §5 skládání + filtr + sdílení → Task 8. §6 validace (unikátnost, kotvy) → Task 3+8. §7 runtime/assembled → Task 4 (TestPanel). §8 UX (knihovna, editor úseku) → Task 5+6. §9 seed → Task 4.
- **Placeholder scan:** kódové kroky modelu/helperů mají úplný kód; UI kroky (Task 5–9) dávají load-bearing kód + handlery a layout odkazují na committnutý mockup. Žádné „TBD".
- **Type consistency:** `assembledCheckpoints`, `eligibleSegments`, `validateRouteComposition`, `segmentUsageCount`, `milestoneTypeUsage`, `segmentDependencies` užity konzistentně napříč Task 3/4/6/8. `anchorCheckpointTypeId` zaveden v Task 2, zapsán v Task 7, čten v Task 3.

---

## Otevřené (mimo tento plán, ze spec §11)
- `service_code` jemnější vrstva, pořadí výskytu (typ 2×), fork/odpojení úseku.
