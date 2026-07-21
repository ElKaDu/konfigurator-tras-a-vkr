# Soulad s trasou — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nahradit dosavadní disabled tab „Trasy zásilek" novou stránkou „Soulad s trasou" — tvorba a editace
Tras/Úseků/Bodů, kde má každý bod jeden ze dvou typů (Běžný bod / Dnešní doručení), editovatelné podmínky a
termíny, a needitovatelnou (hardcoded) klasifikaci na Situaci/Závažnost/Akci.

**Architecture:** Čistě frontend prototyp (Vite + TanStack Router + React, in-memory store s localStorage
persistencí — stejný vzor jako zbytek appky). Stará route/segment editace (`RoutesAndSegmentsPage`,
`RouteEditorPage`, `SegmentEditorPage` a jejich pomocné komponenty) se **maže celá** — nahrazuje ji nová
sada komponent postavená přímo podle schváleného wireframu
(`mockups/2026-07-17-soulad-s-trasou-final-wireframe.html`). Editace je jednoduchá formulářová pole (inputy/
selecty), ne vedený wizard.

**Tech Stack:** TypeScript, React 19, TanStack Router, Tailwind CSS v4 + shadcn/radix, lucide-react. Žádný
test runner v tomhle projektu (stejně jako u předchozích pluginů) — verifikace přes `npm run build` a
manuální průchod v dev serveru.

**Zdrojové dokumenty:**
- `docs/superpowers/specs/2026-07-17-dnesni-doruceni-bod-design.md` — kompletní byznysová logika.
- `mockups/2026-07-17-soulad-s-trasou-final-wireframe.html` — schválený vizuál (3 sloupce, hardcoded situace).
- `mockups/2026-07-17-zadani-pro-programatory.html` — vysvětlení flow od nuly.

---

## Důležitý kontext pro inženýra

- Pracuješ ve worktree `.claude/worktrees/situace-zavaznost-akce` (branch `worktree-situace-zavaznost-akce`).
  Než se tahle větev spojí s `main`, uživatelka chce založit git tag/milestone pro případný rollback — to
  NENÍ součást tohoto plánu, jen na to upozorni v závěrečném shrnutí.
- **Situace/Závažnost/Akce se v nové stránce NIKDY needitují v UI.** Který technický výsledek vede na kterou
  Situaci je **natvrdo v kódu** (konstanty, viz Task 3) — žádný dropdown, žádný picker. V UI se jen zobrazuje
  needitovatelná karta (jméno situace + závažnost + seznam akcí), s poznámkou, že reálná appka by tohle měla
  v Django adminu.
- **Situace/kontroly karty se zobrazují hned po výběru typu bodu** — nezávisle na tom, jestli jsou match/
  Termín pole zatím vyplněná. Typ bodu jednoznačně určuje, jaké situace mohou vzniknout.
- **D (datum doručení od přepravce) se u bodu „Dnešní doručení" kontroluje POUZE v Kontrole 3 (Konečný limit
  1. scanu).** Ne v Kontrole 1, ne v Kontrole 2 (Limit pro řádné záznamy) — to bylo opakovaně opravováno
  během designu, viz `docs/superpowers/specs/2026-07-17-dnesni-doruceni-bod-design.md` §3.2.
- **ADD (avizované datum doručení zákazníkovi)** je vstupní brána jen pro bod „Dnešní doručení" — needitovatelné
  v tomhle prototypu (žádná runtime evaluace nikde v appce neexistuje — je to čistě konfigurační prototyp,
  stejně jako `RuleCreatorPage` nikdy nic doopravdy nevyhodnocuje proti reálným datům).
- `CheckpointMatch` už dnes má pole `zip_matches_destination?: boolean` — to je přesně dynamické PSČ porovnání
  potřebné pro 2. scan. **Nepřidávej nové pole**, jen na něj napoj UI (checkbox „shoda se zásilkou").
- `CheckpointCorrectness` už dnes umí to, co potřebujeme pro pole **Termín** (kotva + fixed/offset čas). Nové
  jsou jen `TimeLimit` (pro Limit pro řádné záznamy / Konečný limit — vždy jen "kolik hodin po Termínu, nebo
  pevný čas", žádná kotva navíc) a `DnesniDoruceniConfig`.
- **Kotva pro Termín** (`CheckpointCorrectness.anchorKind`/`anchorLabel`) se vybírá ze tří skupin: systémové
  kotvy (ADD, Vyzvednutí zásilky), a **body právě otevřeného úseku** (primární zdroj — ne všechny body všech
  tras). Viz `AnchorPicker` v Tasku 7.
- **Rozsah editace:** jednoduchá formulářová pole — text input pro match hodnoty (jedna hodnota na pole, ne
  víceprvkový seznam), select pro mode/anchor, `<input type="time">` pro čas, number input pro offset. Žádný
  vedený wizard, žádné našeptávače/duplicate-detection jako měl needpojený `CheckpointWizard.tsx` (smazaný
  v Tasku 1).

---

## Task 1: Smazat starou Trasy/Úsek podstránku, přejmenovat nav

**Files:**
- Delete: `src/components/routes/` (celá složka — `RoutesAndSegmentsPage.tsx`, `RouteEditorPage.tsx`,
  `SegmentEditorPage.tsx`, `RouteEditor.tsx`, `RouteEditorDialog.tsx`, `RouteDetailPanel.tsx`, `RouteMap.tsx`,
  `RoutesSidebar.tsx`, `RoutesTable.tsx`, `SegmentEditor.tsx`, `SegmentsPanel.tsx`, `MilestoneLibrary.tsx`,
  `ProblemTypeCombobox.tsx`, `ProblemsEditor.tsx`, `CoverageEditor.tsx`, `CheckpointWizard.tsx`)
- Delete: `src/lib/model/routeAssembly.ts`
- Delete: `src/routes/trasy.tsx`, `src/routes/trasa.$id.tsx`, `src/routes/usek.$id.tsx`
- Modify: `src/components/AppHeader.tsx`

Ověřeno předem (žádný z těchto souborů se nepoužívá nikde mimo `src/components/routes/` a mimo tři mazané
route soubory — `grep -rl` na každý název komponenty potvrdil 0 externích odkazů).

- [ ] **Step 1: Smazat starou složku komponent a routeAssembly**

```bash
git rm -r src/components/routes/
git rm src/lib/model/routeAssembly.ts
```

- [ ] **Step 2: Smazat staré route soubory**

```bash
git rm src/routes/trasy.tsx src/routes/trasa.\$id.tsx src/routes/usek.\$id.tsx
```

- [ ] **Step 3: Přejmenovat a zapnout nav položku**

Najdi v `src/components/AppHeader.tsx`:
```tsx
export type SectionKey = "rules" | "routes" | "situace";
```
Nahraď:
```tsx
export type SectionKey = "rules" | "soulad" | "situace";
```

Najdi:
```tsx
      <nav className="flex items-center gap-1 text-sm font-medium">
        <NavLink to="/" active={current === "rules"}>Pravidla pro tracking</NavLink>
        <span
          title="Brzy"
          className="rounded-md px-2.5 py-1 text-muted-foreground opacity-50 cursor-not-allowed select-none"
        >
          Trasy zásilek
        </span>
        <NavLink to="/situace" active={current === "situace"}>Situace a závažnosti</NavLink>
      </nav>
```
Nahraď:
```tsx
      <nav className="flex items-center gap-1 text-sm font-medium">
        <NavLink to="/" active={current === "rules"}>Pravidla pro tracking</NavLink>
        <NavLink to="/soulad-s-trasou" active={current === "soulad"}>Soulad s trasou</NavLink>
        <NavLink to="/situace" active={current === "situace"}>Situace a závažnosti</NavLink>
      </nav>
```

- [ ] **Step 4: Ověřit, že build zatím záměrně selže (chybí nová route)**

Run: `npm run build`
Expected: FAIL — TanStack Router generátor si postěžuje na neexistující `/soulad-s-trasou` route. Opraví se
v Tasku 5. Zkontroluj, že chyba zmiňuje jen tohle a nic o smazaných `routes/` komponentách odjinud.

- [ ] **Step 5: Commit**

```bash
git add src/components/AppHeader.tsx
git commit -m "refactor: smazat starou Trasy/Úsek podstránku, přejmenovat nav na Soulad s trasou"
```

---

## Task 2: Datový model — typ bodu, časové limity, Dnešní doručení

**Files:**
- Modify: `src/lib/model/types.ts`

- [ ] **Step 1: Přidat `BodKind`, `TimeLimit`, `DnesniDoruceniScan`, `DnesniDoruceniConfig`**

Najdi v `src/lib/model/types.ts`:
```ts
export interface Checkpoint {
  id: string; checkpointTypeId: string; note?: string;
  match: CheckpointMatch;
  /** @deprecated nahrazeno sekcí „Kdy se má záznam objevit" (correctness). */
  expectedDurationHours?: number;
  /** @deprecated */
  warnAfterHours?: number;
  /** @deprecated */
  criticalAfterHours?: number;
  correctness: CheckpointCorrectness[];   // prázdné = jen "musí nastat"
}
```

Nahraď:
```ts
/** Rozlišuje generický bod (jedna kontrola, hardcoded Situace "Problém na trase") od
 *  specializovaného typu "Dnešní doručení" (dva navazující scany, ADD brána, D-větvení). */
export type BodKind = "generic" | "dnesni_doruceni";

/** Kdy se má kontrola spustit — buď pevný čas, nebo posun v hodinách od Termínu (CheckpointCorrectness). */
export interface TimeLimit {
  mode: "absolute" | "offset";
  absoluteTime?: string;   // "HH:MM", jen mode "absolute"
  offsetHours?: number;    // posun v hodinách od Termínu, jen mode "offset"
}

/** Jeden fyzický scan uvnitř bodu "Dnešní doručení" — vlastní match + Termín (vlastní čas záznamu). */
export interface DnesniDoruceniScan {
  match: CheckpointMatch;
  deadline: CheckpointCorrectness;
}

/** Nastavení celého bodu "Dnešní doručení" — dva scany + tři časové limity.
 *  D (datum doručení od přepravce) se vyhodnocuje POUZE v konecnyLimitScan1 — viz
 *  docs/superpowers/specs/2026-07-17-dnesni-doruceni-bod-design.md §3.2. */
export interface DnesniDoruceniConfig {
  scan1: DnesniDoruceniScan;
  /** Kontrola 2 — jen u scan1. Posuzuje jen řádnost záznamu, D se tady nekontroluje. */
  limitProRadneZaznamy: TimeLimit;
  /** Kontrola 3 — jen u scan1. Tady se poprvé vyhodnocuje D. */
  konecnyLimitScan1: TimeLimit;
  scan2: DnesniDoruceniScan;
  /** Jednostupňové — jediná kontrola scan2, žádný Limit pro řádné záznamy. */
  konecnyLimitScan2: TimeLimit;
}

export interface Checkpoint {
  id: string; checkpointTypeId: string; note?: string;
  match: CheckpointMatch;
  /** @deprecated nahrazeno sekcí „Kdy se má záznam objevit" (correctness). */
  expectedDurationHours?: number;
  /** @deprecated */
  warnAfterHours?: number;
  /** @deprecated */
  criticalAfterHours?: number;
  correctness: CheckpointCorrectness[];   // prázdné = jen "musí nastat"

  /** NOVÉ — typ bodu, default "generic" pro zpětnou kompatibilitu se stávajícími seed daty. */
  kind?: BodKind;
  /** NOVÉ — jen kind "generic". Jediná kontrola bodu — Nesplněno vede na hardcoded Situaci "Problém na trase". */
  konecnyLimit?: TimeLimit;
  /** NOVÉ — jen kind "dnesni_doruceni". */
  dnesniDoruceni?: DnesniDoruceniConfig;
}
```

- [ ] **Step 2: Ověřit, že build stále prochází (jen přidání typů, nic ho nerozbije)**

Run: `npm run build`
Expected: FAIL stále na chybějící `/soulad-s-trasou` route (stejná chyba jako v Tasku 1, Step 4) — potvrď, že
nepřibyla žádná NOVÁ chyba kvůli změně `types.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/model/types.ts
git commit -m "feat(model): typ bodu, časové limity a konfigurace Dnešního doručení"
```

---

## Task 3: Seed data — hardcoded Situace pro Soulad s trasou

**Files:**
- Modify: `src/lib/model/seed.ts`

- [ ] **Step 1: Přidat nové Akce (ActionTag) do katalogu**

Najdi:
```ts
export const ACTION_TAGS: ActionTag[] = [
  { id: "at_call_customer", label: "Zavolat zákazníkovi", icon: "Phone" },
  { id: "at_email_customer", label: "Informovat e-mailem", icon: "Mail" },
  { id: "at_check_carrier", label: "Prověřit u dopravce", icon: "Search" },
  { id: "at_shift_date", label: "Posunout datum doručení", icon: "CalendarClock" },
];
```
Nahraď:
```ts
export const ACTION_TAGS: ActionTag[] = [
  { id: "at_call_customer", label: "Zavolat zákazníkovi", icon: "Phone" },
  { id: "at_email_customer", label: "Informovat e-mailem", icon: "Mail" },
  { id: "at_check_carrier", label: "Prověřit u dopravce", icon: "Search" },
  { id: "at_shift_date", label: "Posunout datum doručení", icon: "CalendarClock" },
  { id: "at_mark_delayed", label: "Zásilka se zpozdí", icon: "AlertTriangle" },
  { id: "at_mark_today", label: "Zásilka dorazí dnes", icon: "CheckCircle2" },
  { id: "at_create_task", label: "Vytvořit věc k řešení", icon: "ListTodo" },
];
```

- [ ] **Step 2: Přidat čtyři nové Situace na konec pole `SITUATIONS`**

Najdi konec pole `SITUATIONS` (poslední `},` před uzavírací `];` pole) a přidej za poslední položku:
```ts
  {
    id: "sit_problem_na_trase",
    code: "SIT-ROUTE-PROBLEM",
    name: "Problém na trase",
    description: "Bod na trase nebyl nalezen do svého Konečného limitu.",
    area: "route_compliance",
    severities: [
      {
        id: "sev_problem_na_trase",
        name: "běžné",
        priority: "medium",
        actions: [
          { id: "sa_problem_na_trase_1", actionTagId: "at_create_task", description: "Řetězec bodů i tak pokračuje na další bod." },
        ],
      },
    ],
  },
  {
    id: "sit_problem_na_trase_pozde",
    code: "SIT-ROUTE-PROBLEM-LATE",
    name: "Problém na trase — záznam se objevil",
    description: "Bod se objevil až po Konečném limitu, jinak splňuje podmínky. Čistě informativní.",
    area: "route_compliance",
    severities: [
      {
        id: "sev_problem_na_trase_pozde",
        name: "informativní",
        priority: "low",
        actions: [
          { id: "sa_problem_na_trase_pozde_1", actionTagId: "at_create_task", description: "Jen informativní — zpoždění se samo vyřešilo." },
        ],
      },
    ],
  },
  {
    id: "sit_zpozdena_zasilka",
    code: "SIT-DELAYED-SHIPMENT",
    name: "Zpožděná zásilka",
    description: "Bod „Dnešní doručení" vyhodnotil, že zásilka dnes nedorazí.",
    area: "route_compliance",
    severities: [
      {
        id: "sev_zpozdena_zasilka",
        name: "kritické",
        priority: "urgent",
        actions: [
          { id: "sa_zpozdena_zasilka_1", actionTagId: "at_mark_delayed", description: "Označit zásilku jako zpožděnou." },
          { id: "sa_zpozdena_zasilka_2", actionTagId: "at_shift_date", description: "Posun avizované datum doručení." },
        ],
      },
    ],
  },
  {
    id: "sit_dnesni_doruceni",
    code: "SIT-DELIVERY-TODAY",
    name: "Dnešní doručení",
    description: "Bod „Dnešní doručení" vyhodnotil, že zásilka dnes dorazí.",
    area: "route_compliance",
    severities: [
      {
        id: "sev_dnesni_doruceni",
        name: "informativní",
        priority: "low",
        actions: [
          { id: "sa_dnesni_doruceni_1", actionTagId: "at_mark_today", description: "Jen informativní." },
        ],
      },
    ],
  },
```

- [ ] **Step 3: Ověřit build**

Run: `npm run build`
Expected: FAIL stále jen na chybějící route (stejné jako předtím).

- [ ] **Step 4: Commit**

```bash
git add src/lib/model/seed.ts
git commit -m "feat(seed): hardcoded situace pro Soulad s trasou (Problém na trase, Zpožděná zásilka, Dnešní doručení)"
```

---

## Task 4: Konstanty hardcoded situací + demo seed body

**Files:**
- Create: `src/lib/model/routeComplianceSituations.ts`
- Modify: `src/lib/model/seed.ts`

- [ ] **Step 1: Vytvořit konstanty s ID hardcoded situací**

```ts
// src/lib/model/routeComplianceSituations.ts

/**
 * Napojení technického výsledku bodu na Situaci je natvrdo v kódu, needitovatelné v UI —
 * viz docs/superpowers/specs/2026-07-17-dnesni-doruceni-bod-design.md §8 a §6.
 * Reálná appka by tohle měla v Django adminu, ne v tomhle prototypu.
 */
export const ROUTE_COMPLIANCE_SITUATIONS = {
  problemNaTrase: { situationId: "sit_problem_na_trase", severityId: "sev_problem_na_trase" },
  problemNaTrasePozde: { situationId: "sit_problem_na_trase_pozde", severityId: "sev_problem_na_trase_pozde" },
  zpozdenaZasilka: { situationId: "sit_zpozdena_zasilka", severityId: "sev_zpozdena_zasilka" },
  dnesniDoruceni: { situationId: "sit_dnesni_doruceni", severityId: "sev_dnesni_doruceni" },
} as const;
```

- [ ] **Step 2: Přidat demo body do existujícího segmentu `seg_cz_lastmile`**

Najdi segment `seg_cz_lastmile` v `src/lib/model/seed.ts` (checkpoints pole). Na konec jeho `checkpoints`
pole přidej dva nové body:

```ts
      {
        id: "cp_odlet_brno_demo",
        checkpointTypeId: "ct_departure",
        note: "Demo bod typu Běžný bod — Odlet Praha/Brno.",
        kind: "generic",
        match: { status: ["Left FedEx origin facility"], location_type: ["ORIGIN_FEDEX_FACILITY"] },
        correctness: [
          {
            id: "corr_odlet_brno_termin",
            aspect: "record_event_time",
            mode: "fixed",
            anchorKind: "system_event",
            anchorLabel: "den vyzvednutí",
            operator: "within",
            fixedOp: "before",
            fixedTime: "22:00",
            fixedTz: "local",
          },
        ],
        konecnyLimit: { mode: "offset", offsetHours: 0 },
      },
      {
        id: "cp_dnesni_doruceni_demo",
        checkpointTypeId: "ct_first_scan",
        note: "Demo bod typu Dnešní doručení — 1./2. fyzický scan v cílové zemi.",
        kind: "dnesni_doruceni",
        match: { status: ["FedEx Facility"], location_type: ["FEDEX_FACILITY"] },
        correctness: [],
        dnesniDoruceni: {
          scan1: {
            match: { location_type: ["FEDEX_FACILITY"] },
            deadline: {
              id: "corr_scan1_termin",
              aspect: "record_event_time",
              mode: "fixed",
              anchorKind: "system_event",
              anchorLabel: "ADD (avizované doručení zákazníkovi)",
              operator: "within",
              fixedOp: "before",
              fixedTime: "08:00",
              fixedTz: "local",
            },
          },
          limitProRadneZaznamy: { mode: "offset", offsetHours: 1 },
          konecnyLimitScan1: { mode: "offset", offsetHours: 2 },
          scan2: {
            match: { location_type: ["DESTINATION_FACILITY"], zip_matches_destination: true },
            deadline: {
              id: "corr_scan2_termin",
              aspect: "record_event_time",
              mode: "offset",
              anchorKind: "checkpoint",
              anchorLabel: "od 1. fyzického scanu",
              anchorCheckpointTypeId: "ct_first_scan",
              operator: "within",
              value: 2,
              unit: "h",
            },
          },
          konecnyLimitScan2: { mode: "offset", offsetHours: 1 },
        },
      },
```

- [ ] **Step 3: Ověřit build**

Run: `npm run build`
Expected: FAIL stále jen na chybějící route. Zkontroluj, že chyba nezmiňuje `seed.ts` ani
`routeComplianceSituations.ts` — pokud ano, oprav typo (nejčastěji chybějící `id` u `CheckpointCorrectness`).

- [ ] **Step 4: Commit**

```bash
git add src/lib/model/routeComplianceSituations.ts src/lib/model/seed.ts
git commit -m "feat(seed): konstanty hardcoded situací + demo body pro Soulad s trasou"
```

---

## Task 5: Nové routy + seznam Trasy → Úseky (s tvorbou)

**Files:**
- Create: `src/routes/soulad-s-trasou.tsx`
- Create: `src/routes/soulad-s-trasou.usek.$id.tsx`
- Create: `src/components/soulad/SouladSTrasouListPage.tsx`

- [ ] **Step 1: Vytvořit seznam stránku (Trasy → Úseky) s tvorbou nové trasy a úseku**

```tsx
// src/components/soulad/SouladSTrasouListPage.tsx
import { Link, useNavigate } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { useRoutes, useSegments, routesStore, segmentsStore } from "@/lib/model/store";
import type { Route, Segment } from "@/lib/model/types";

function createBlankRoute(): Route {
  const id = "route_" + Date.now();
  return { id, code: id, name: "Nová trasa", active: true, carriers: [], serviceTypes: [], destCountries: [], segmentIds: [] };
}

function createBlankSegment(): Segment {
  const id = "seg_" + Date.now();
  return { id, name: "Nový úsek", carriers: [], serviceTypes: [], checkpoints: [] };
}

export function SouladSTrasouListPage() {
  const routes = useRoutes();
  const segments = useSegments();
  const navigate = useNavigate();
  const segMap = new Map(segments.map((s) => [s.id, s]));

  function addRoute() {
    const route = createBlankRoute();
    routesStore.upsert(route);
  }

  function addSegment(routeId: string) {
    const segment = createBlankSegment();
    segmentsStore.upsert(segment);
    const route = routesStore.byId(routeId);
    if (route) routesStore.upsert({ ...route, segmentIds: [...route.segmentIds, segment.id] });
    navigate({ to: "/soulad-s-trasou/usek/$id", params: { id: segment.id } });
  }

  return (
    <div className="flex h-screen w-screen flex-col bg-background text-foreground">
      <AppHeader current="soulad" />
      <div className="flex-1 overflow-y-auto p-8">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-semibold">Soulad s trasou</h1>
          <button onClick={addRoute} className="bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-primary/90">
            + Přidat trasu
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Vyberte úsek trasy — pro každý bod v úseku se konfiguruje typ bodu, podmínky a kontroly.
        </p>
        <div className="flex flex-col gap-6 max-w-2xl">
          {routes.map((route) => (
            <div key={route.id} className="rounded-lg border border-border bg-card">
              <div className="px-4 py-3 border-b border-border">
                <div className="text-sm font-semibold">{route.name}</div>
                <div className="text-xs text-muted-foreground">{route.carriers.join(", ") || "bez dopravce"} · {route.serviceTypes.join(", ") || "bez typu služby"}</div>
              </div>
              <div className="p-2">
                {route.segmentIds.map((segId) => {
                  const seg = segMap.get(segId);
                  if (!seg) return null;
                  return (
                    <Link
                      key={segId}
                      to="/soulad-s-trasou/usek/$id"
                      params={{ id: segId }}
                      className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-muted"
                    >
                      <span>{seg.name}</span>
                      <span className="text-xs text-muted-foreground">{seg.checkpoints.length} bodů</span>
                    </Link>
                  );
                })}
                <button
                  onClick={() => addSegment(route.id)}
                  className="w-full rounded-md border border-dashed border-border px-3 py-2 text-sm text-primary hover:bg-muted mt-1"
                >
                  + Přidat úsek
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Vytvořit route soubory**

```tsx
// src/routes/soulad-s-trasou.tsx
import { createFileRoute } from "@tanstack/react-router";
import { SouladSTrasouListPage } from "@/components/soulad/SouladSTrasouListPage";

export const Route = createFileRoute("/soulad-s-trasou")({
  head: () => ({ meta: [{ title: "Soulad s trasou — Bytorp" }] }),
  component: SouladSTrasouListPage,
});
```

```tsx
// src/routes/soulad-s-trasou.usek.$id.tsx
import { createFileRoute } from "@tanstack/react-router";
import { SouladSTrasouUsekPage } from "@/components/soulad/SouladSTrasouUsekPage";

export const Route = createFileRoute("/soulad-s-trasou/usek/$id")({
  head: () => ({ meta: [{ title: "Úsek — Soulad s trasou — Bytorp" }] }),
  component: UsekRoute,
});

function UsekRoute() {
  const { id } = Route.useParams();
  return <SouladSTrasouUsekPage segmentId={id} />;
}
```

Vytvoř zatím prázdný placeholder pro `SouladSTrasouUsekPage`, aby build prošel — plná implementace je Task 6:

```tsx
// src/components/soulad/SouladSTrasouUsekPage.tsx
export function SouladSTrasouUsekPage({ segmentId }: { segmentId: string }) {
  return <div>TODO: {segmentId}</div>;
}
```

- [ ] **Step 3: Ověřit, že build teď PROJDE**

Run: `npm run build`
Expected: SUCCESS. Pokud selže na TanStack Router generátoru, spusť `npm run dev` na pár vteřin (generuje
`routeTree.gen.ts` automaticky), pak zkus build znovu.

- [ ] **Step 4: Manuální průchod v dev serveru**

Run: `npm run dev`, otevři `/soulad-s-trasou` — potvrď: existující trasy s úseky se zobrazí; „+ Přidat trasu"
přidá novou prázdnou trasu do seznamu; „+ Přidat úsek" u trasy vytvoří úsek a přesměruje na jeho detail
(zatím jen „TODO" placeholder).

- [ ] **Step 5: Commit**

```bash
git add src/routes/soulad-s-trasou.tsx src/routes/soulad-s-trasou.usek.\$id.tsx src/components/soulad/
git commit -m "feat(soulad): routy, seznam Trasy → Úseky, tvorba trasy a úseku"
```

---

## Task 6: Sdílené editory — Anchor, Termín, TimeLimit, Match

**Files:**
- Create: `src/components/soulad/AnchorPicker.tsx`
- Create: `src/components/soulad/TerminEditor.tsx`
- Create: `src/components/soulad/TimeLimitEditor.tsx`
- Create: `src/components/soulad/MatchEditor.tsx`
- Create: `src/lib/model/formatTimeLimit.ts`

Tyhle čtyři editory používá Task 7 (Běžný bod) i Task 8 (Dnešní doručení) — proto samostatný task, ne
duplikace v obou.

- [ ] **Step 1: Sdílený formátovač `TimeLimit`**

```ts
// src/lib/model/formatTimeLimit.ts
import type { TimeLimit } from "./types";

export function formatTimeLimit(limit: TimeLimit): string {
  return limit.mode === "absolute" ? `v ${limit.absoluteTime}` : `${limit.offsetHours} h po Termínu`;
}
```

- [ ] **Step 2: `AnchorPicker` — kotva pro Termín, primárně body aktuálního úseku**

```tsx
// src/components/soulad/AnchorPicker.tsx
import type { CheckpointCorrectness, Segment } from "@/lib/model/types";
import { useCheckpointTypes } from "@/lib/model/store";

type AnchorValue = Pick<CheckpointCorrectness, "anchorKind" | "anchorLabel" | "anchorCheckpointTypeId">;

const SYSTEM_ANCHORS: { label: string }[] = [
  { label: "Avizované doručení zákazníkovi (ADD)" },
  { label: "Vyzvednutí zásilky" },
];

/**
 * Nabízí tři skupiny kotev: systémové (ADD, Vyzvednutí zásilky), a PRIMÁRNĚ body právě
 * otevřeného úseku (segment.checkpoints) — ne všechny body všech tras. Viz "Důležitý kontext" v plánu.
 */
export function AnchorPicker({
  segment,
  currentCheckpointId,
  value,
  onChange,
}: {
  segment: Segment;
  currentCheckpointId?: string;
  value: AnchorValue;
  onChange: (next: AnchorValue) => void;
}) {
  const checkpointTypes = useCheckpointTypes();
  const ctMap = new Map(checkpointTypes.map((ct) => [ct.id, ct.name]));

  return (
    <select
      value={value.anchorKind === "checkpoint" ? `checkpoint:${value.anchorCheckpointTypeId}` : `system:${value.anchorLabel}`}
      onChange={(e) => {
        const raw = e.target.value;
        if (raw.startsWith("system:")) {
          onChange({ anchorKind: "system_event", anchorLabel: raw.slice("system:".length) });
        } else {
          const checkpointTypeId = raw.slice("checkpoint:".length);
          onChange({ anchorKind: "checkpoint", anchorLabel: ctMap.get(checkpointTypeId) ?? checkpointTypeId, anchorCheckpointTypeId: checkpointTypeId });
        }
      }}
      className="rounded border border-border bg-background px-2 py-1 text-xs"
    >
      <optgroup label="Systémové kotvy">
        {SYSTEM_ANCHORS.map((a) => (
          <option key={a.label} value={`system:${a.label}`}>{a.label}</option>
        ))}
      </optgroup>
      <optgroup label="Body tohoto úseku">
        {segment.checkpoints
          .filter((cp) => cp.id !== currentCheckpointId)
          .map((cp) => (
            <option key={cp.id} value={`checkpoint:${cp.checkpointTypeId}`}>
              {cp.note ?? ctMap.get(cp.checkpointTypeId) ?? cp.checkpointTypeId}
            </option>
          ))}
      </optgroup>
    </select>
  );
}
```

- [ ] **Step 3: `TerminEditor` — editovatelný `CheckpointCorrectness` (mode fixed/offset + kotva)**

```tsx
// src/components/soulad/TerminEditor.tsx
import type { CheckpointCorrectness, Segment } from "@/lib/model/types";
import { AnchorPicker } from "./AnchorPicker";

export function TerminEditor({
  segment,
  currentCheckpointId,
  value,
  onChange,
}: {
  segment: Segment;
  currentCheckpointId?: string;
  value: CheckpointCorrectness;
  onChange: (next: CheckpointCorrectness) => void;
}) {
  const isFixed = value.mode !== "offset";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <span className="text-muted-foreground">kotva</span>
        <AnchorPicker
          segment={segment}
          currentCheckpointId={currentCheckpointId}
          value={{ anchorKind: value.anchorKind, anchorLabel: value.anchorLabel, anchorCheckpointTypeId: value.anchorCheckpointTypeId }}
          onChange={(anchor) => onChange({ ...value, ...anchor })}
        />
        <select
          value={value.mode ?? "fixed"}
          onChange={(e) => onChange({ ...value, mode: e.target.value as "fixed" | "offset" })}
          className="rounded border border-border bg-background px-2 py-1 text-xs"
        >
          <option value="fixed">v pevný čas</option>
          <option value="offset">posun v hodinách</option>
        </select>
        {isFixed ? (
          <input
            type="time"
            value={value.fixedTime ?? "08:00"}
            onChange={(e) => onChange({ ...value, fixedTime: e.target.value })}
            className="rounded border border-border bg-background px-2 py-1 text-xs"
          />
        ) : (
          <>
            <input
              type="number"
              min={0}
              value={value.value ?? 0}
              onChange={(e) => onChange({ ...value, value: Math.max(0, Number(e.target.value) || 0) })}
              className="w-16 rounded border border-border bg-background px-2 py-1 text-xs"
            />
            <span className="text-muted-foreground">h</span>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: `TimeLimitEditor` — editovatelný `TimeLimit` (Limit pro řádné záznamy / Konečný limit)**

```tsx
// src/components/soulad/TimeLimitEditor.tsx
import type { TimeLimit } from "@/lib/model/types";

export function TimeLimitEditor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: TimeLimit;
  onChange: (next: TimeLimit) => void;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap text-xs">
      <span className="text-muted-foreground w-40 shrink-0">{label}</span>
      <select
        value={value.mode}
        onChange={(e) => onChange({ ...value, mode: e.target.value as "absolute" | "offset" })}
        className="rounded border border-border bg-background px-2 py-1"
      >
        <option value="offset">posun od Termínu</option>
        <option value="absolute">pevný čas</option>
      </select>
      {value.mode === "absolute" ? (
        <input
          type="time"
          value={value.absoluteTime ?? "09:00"}
          onChange={(e) => onChange({ ...value, absoluteTime: e.target.value })}
          className="rounded border border-border bg-background px-2 py-1"
        />
      ) : (
        <>
          <input
            type="number"
            min={0}
            value={value.offsetHours ?? 0}
            onChange={(e) => onChange({ ...value, offsetHours: Math.max(0, Number(e.target.value) || 0) })}
            className="w-16 rounded border border-border bg-background px-2 py-1"
          />
          <span className="text-muted-foreground">h po Termínu</span>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 5: `MatchEditor` — jednoduchá pole pro `CheckpointMatch`**

```tsx
// src/components/soulad/MatchEditor.tsx
import type { CheckpointMatch } from "@/lib/model/types";

export function MatchEditor({
  value,
  onChange,
  showZipMatchesDestination,
}: {
  value: CheckpointMatch;
  onChange: (next: CheckpointMatch) => void;
  showZipMatchesDestination?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground w-24 shrink-0">Status</span>
        <input
          type="text"
          value={value.status?.[0] ?? ""}
          onChange={(e) => onChange({ ...value, status: e.target.value ? [e.target.value] : undefined })}
          placeholder="např. Left FedEx origin facility"
          className="flex-1 rounded border border-border bg-background px-2 py-1"
        />
      </label>
      <label className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground w-24 shrink-0">Typ lokace</span>
        <input
          type="text"
          value={value.location_type?.[0] ?? ""}
          onChange={(e) => onChange({ ...value, location_type: e.target.value ? [e.target.value] : undefined })}
          placeholder="např. ORIGIN_FEDEX_FACILITY"
          className="flex-1 rounded border border-border bg-background px-2 py-1"
        />
      </label>
      {showZipMatchesDestination && (
        <label className="flex items-center gap-2 text-xs cursor-pointer">
          <input
            type="checkbox"
            checked={value.zip_matches_destination ?? false}
            onChange={(e) => onChange({ ...value, zip_matches_destination: e.target.checked })}
            className="accent-primary"
          />
          <span>PSČ — shoda se zásilkou (1. číslice PSČ místa doručení)</span>
        </label>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Ověřit build**

Run: `npm run build`
Expected: SUCCESS — tyhle komponenty zatím nikdo nepoužívá, ale musí projít samy o sobě typovou kontrolou.

- [ ] **Step 7: Commit**

```bash
git add src/components/soulad/AnchorPicker.tsx src/components/soulad/TerminEditor.tsx src/components/soulad/TimeLimitEditor.tsx src/components/soulad/MatchEditor.tsx src/lib/model/formatTimeLimit.ts
git commit -m "feat(soulad): sdílené editory pro kotvu, Termín, časový limit a match"
```

---

## Task 7: Úsek detail — 3 sloupce, typ bodu, Běžný bod (editovatelné + tvorba bodu)

**Files:**
- Modify: `src/components/soulad/SouladSTrasouUsekPage.tsx`
- Create: `src/components/soulad/BodDetailPanel.tsx`
- Create: `src/components/soulad/SituaceCard.tsx`

- [ ] **Step 1: Vytvořit needitovatelnou kartu Situace/Závažnost/Akce**

```tsx
// src/components/soulad/SituaceCard.tsx
import { useActionTags, useSituations } from "@/lib/model/store";

export function SituaceCard({
  situationId,
  severityId,
  headline,
}: {
  situationId: string;
  severityId: string;
  headline: string;
}) {
  const situations = useSituations();
  const actionTags = useActionTags();
  const situation = situations.find((s) => s.id === situationId);
  const severity = situation?.severities.find((s) => s.id === severityId);

  if (!situation || !severity) {
    return <div className="text-xs text-destructive">Situace „{situationId}" nenalezena v katalogu.</div>;
  }

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="text-xs font-semibold text-muted-foreground mb-2">{headline}</div>
      <div className="mb-2">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1.5">
          Situace <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] normal-case">🔒 needitovatelné</span>
        </div>
        <div className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-1 text-sm font-medium">
          {situation.name}
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">{severity.name}</span>
        </div>
      </div>
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Akce</div>
        <ul className="flex flex-col gap-1">
          {severity.actions.map((a) => {
            const tag = actionTags.find((t) => t.id === a.actionTagId);
            return (
              <li key={a.id} className="flex items-start gap-1.5 text-xs">
                <span className="mt-1 size-1 rounded-full bg-muted-foreground shrink-0" />
                <span>{tag?.label ?? a.actionTagId}{a.description ? ` — ${a.description}` : ""}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Napsat plnou `SouladSTrasouUsekPage` — výběr bodu, tvorba nového bodu, `onUpdate`**

```tsx
// src/components/soulad/SouladSTrasouUsekPage.tsx
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { useSegments, segmentsStore } from "@/lib/model/store";
import { cn } from "@/lib/utils";
import type { Checkpoint, Segment } from "@/lib/model/types";
import { BodDetailPanel } from "./BodDetailPanel";

function createBlankCheckpoint(): Checkpoint {
  return {
    id: "cp_" + Date.now(),
    checkpointTypeId: "ct_first_scan",
    note: "Nový bod",
    kind: "generic",
    match: {},
    correctness: [
      { id: "corr_" + Date.now(), aspect: "record_event_time", mode: "fixed", anchorKind: "system_event", anchorLabel: "Vyzvednutí zásilky", operator: "within", fixedOp: "before", fixedTime: "12:00", fixedTz: "local" },
    ],
    konecnyLimit: { mode: "offset", offsetHours: 0 },
  };
}

export function SouladSTrasouUsekPage({ segmentId }: { segmentId: string }) {
  const segments = useSegments();
  const segment = segments.find((s) => s.id === segmentId) ?? null;
  const [selectedBodId, setSelectedBodId] = useState<string | null>(
    segment?.checkpoints[0]?.id ?? null
  );

  if (!segment) {
    return (
      <div className="flex h-screen w-screen flex-col bg-background text-foreground">
        <AppHeader current="soulad" />
        <div className="p-8 text-sm text-muted-foreground">Úsek nenalezen.</div>
      </div>
    );
  }

  function updateSegment(next: Segment) {
    segmentsStore.upsert(next);
  }

  function updateCheckpoint(updated: Checkpoint) {
    updateSegment({ ...segment!, checkpoints: segment!.checkpoints.map((cp) => (cp.id === updated.id ? updated : cp)) });
  }

  function addCheckpoint() {
    const cp = createBlankCheckpoint();
    updateSegment({ ...segment!, checkpoints: [...segment!.checkpoints, cp] });
    setSelectedBodId(cp.id);
  }

  const selectedBod = segment.checkpoints.find((cp) => cp.id === selectedBodId) ?? null;

  return (
    <div className="flex h-screen w-screen flex-col bg-background text-foreground">
      <AppHeader current="soulad" />
      <div className="border-b border-border bg-surface px-6 py-3 text-sm text-muted-foreground">
        <Link to="/soulad-s-trasou" className="hover:text-foreground">Soulad s trasou</Link>
        <span className="mx-1.5">/</span>
        <span className="text-foreground font-medium">{segment.name}</span>
      </div>
      <div className="flex flex-1 min-h-0">
        <div className="w-[280px] shrink-0 border-r border-border overflow-y-auto p-4">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Body úseku ({segment.checkpoints.length})
          </div>
          <div className="flex flex-col gap-0.5 mb-2">
            {segment.checkpoints.map((cp) => (
              <button
                key={cp.id}
                onClick={() => setSelectedBodId(cp.id)}
                className={cn(
                  "flex items-center justify-between rounded-md px-2.5 py-2 text-left text-sm",
                  cp.id === selectedBodId ? "bg-primary-soft text-primary font-medium" : "hover:bg-muted",
                )}
              >
                <span>{cp.note ?? cp.checkpointTypeId}</span>
                <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                  {cp.kind === "dnesni_doruceni" ? "Dnešní doručení" : "Běžný bod"}
                </span>
              </button>
            ))}
          </div>
          <button
            onClick={addCheckpoint}
            className="w-full rounded-md border border-dashed border-border px-2.5 py-2 text-xs text-primary hover:bg-muted"
          >
            + Přidat bod
          </button>
        </div>
        <div className="flex-1 min-w-0 overflow-y-auto">
          {selectedBod ? (
            <BodDetailPanel segment={segment} checkpoint={selectedBod} onUpdate={updateCheckpoint} />
          ) : (
            <div className="p-8 text-sm text-muted-foreground">Vyberte bod vlevo, nebo přidejte nový.</div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Napsat `BodDetailPanel` — typ-selector klikatelný, editovatelné match/Termín/limit, hardcoded situace**

```tsx
// src/components/soulad/BodDetailPanel.tsx
import type { Checkpoint, Segment } from "@/lib/model/types";
import { ROUTE_COMPLIANCE_SITUATIONS } from "@/lib/model/routeComplianceSituations";
import { formatTimeLimit } from "@/lib/model/formatTimeLimit";
import { SituaceCard } from "./SituaceCard";
import { MatchEditor } from "./MatchEditor";
import { TerminEditor } from "./TerminEditor";
import { TimeLimitEditor } from "./TimeLimitEditor";

export function BodDetailPanel({
  segment,
  checkpoint,
  onUpdate,
}: {
  segment: Segment;
  checkpoint: Checkpoint;
  onUpdate: (next: Checkpoint) => void;
}) {
  const isDnesniDoruceni = checkpoint.kind === "dnesni_doruceni";

  return (
    <div className="p-6 flex flex-col gap-6 max-w-3xl">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Typ bodu</div>
        <div className="inline-flex rounded-md border border-border overflow-hidden text-sm">
          <button
            onClick={() => onUpdate({ ...checkpoint, kind: "generic" })}
            className={isDnesniDoruceni ? "px-3 py-1.5 text-muted-foreground" : "px-3 py-1.5 bg-primary-soft text-primary font-medium"}
          >
            Běžný bod
          </button>
          <button
            onClick={() =>
              onUpdate({
                ...checkpoint,
                kind: "dnesni_doruceni",
                dnesniDoruceni: checkpoint.dnesniDoruceni ?? {
                  scan1: { match: {}, deadline: { id: "corr_" + Date.now() + "_s1", aspect: "record_event_time", mode: "fixed", anchorKind: "system_event", anchorLabel: "ADD (avizované doručení zákazníkovi)", operator: "within", fixedOp: "before", fixedTime: "08:00", fixedTz: "local" } },
                  limitProRadneZaznamy: { mode: "offset", offsetHours: 1 },
                  konecnyLimitScan1: { mode: "offset", offsetHours: 2 },
                  scan2: { match: {}, deadline: { id: "corr_" + Date.now() + "_s2", aspect: "record_event_time", mode: "offset", anchorKind: "checkpoint", anchorLabel: "od 1. fyzického scanu", operator: "within", value: 2, unit: "h" } },
                  konecnyLimitScan2: { mode: "offset", offsetHours: 1 },
                },
              })
            }
            className={isDnesniDoruceni ? "px-3 py-1.5 bg-primary-soft text-primary font-medium" : "px-3 py-1.5 text-muted-foreground"}
          >
            Dnešní doručení
          </button>
        </div>
      </div>

      {isDnesniDoruceni && checkpoint.dnesniDoruceni ? (
        <DnesniDoruceniEditablePanel
          segment={segment}
          checkpointId={checkpoint.id}
          config={checkpoint.dnesniDoruceni}
          onChange={(config) => onUpdate({ ...checkpoint, dnesniDoruceni: config })}
        />
      ) : null}

      {!isDnesniDoruceni && (
        <>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-sm font-semibold mb-3">Co musí být na záznamu</div>
            <MatchEditor value={checkpoint.match} onChange={(match) => onUpdate({ ...checkpoint, match })} />
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-sm font-semibold mb-3">Termín</div>
            <TerminEditor
              segment={segment}
              currentCheckpointId={checkpoint.id}
              value={checkpoint.correctness[0] ?? { id: "corr_" + checkpoint.id, aspect: "record_event_time", mode: "fixed", anchorKind: "system_event", anchorLabel: "Vyzvednutí zásilky", operator: "within", fixedOp: "before", fixedTime: "12:00", fixedTz: "local" }}
              onChange={(corr) => onUpdate({ ...checkpoint, correctness: [corr] })}
            />
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-sm font-semibold mb-3">Konečný limit</div>
            <TimeLimitEditor
              label="Konečný limit"
              value={checkpoint.konecnyLimit ?? { mode: "offset", offsetHours: 0 }}
              onChange={(limit) => onUpdate({ ...checkpoint, konecnyLimit: limit })}
            />
            <div className="text-xs text-muted-foreground mt-2">{formatTimeLimit(checkpoint.konecnyLimit ?? { mode: "offset", offsetHours: 0 })} — jediná kontrola tohoto bodu, žádná vazba na ADD/D.</div>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Situace, které z tohoto bodu mohou vzniknout
            </div>
            <div className="flex flex-col gap-3">
              <div className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
                <b className="text-foreground">Řádně nalezen do Termínu</b> — žádná věc k řešení, řetězec pokračuje na další bod.
              </div>
              <SituaceCard
                headline="Nenalezen do Termínu"
                situationId={ROUTE_COMPLIANCE_SITUATIONS.problemNaTrase.situationId}
                severityId={ROUTE_COMPLIANCE_SITUATIONS.problemNaTrase.severityId}
              />
              <SituaceCard
                headline="Objeví se později (reaktivně, po Konečném limitu)"
                situationId={ROUTE_COMPLIANCE_SITUATIONS.problemNaTrasePozde.situationId}
                severityId={ROUTE_COMPLIANCE_SITUATIONS.problemNaTrasePozde.severityId}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
```

Poznámka: `DnesniDoruceniEditablePanel` se doplní v Tasku 8 — dokud neexistuje, `import` na konci Tasku 8
Step 2 přidá chybějící soubor. Do dokončení Tasku 8 tenhle soubor nekompiluje (očekávané, viz Step 4 níže).

- [ ] **Step 4: Ověřit, že build ZÁMĚRNĚ selže (chybí `DnesniDoruceniEditablePanel`)**

Run: `npm run build`
Expected: FAIL — „Cannot find module './DnesniDoruceniEditablePanel'" nebo obdobná chyba. To je očekávané,
Task 8 ho vytvoří. Zkontroluj, že žádná JINÁ chyba se neobjevila.

- [ ] **Step 5: Commit**

```bash
git add src/components/soulad/SouladSTrasouUsekPage.tsx src/components/soulad/BodDetailPanel.tsx src/components/soulad/SituaceCard.tsx
git commit -m "feat(soulad): detail úseku, tvorba bodu, editovatelný Běžný bod s hardcoded situacemi"
```

---

## Task 8: Bod detail — typ „Dnešní doručení" (editovatelné)

**Files:**
- Create: `src/components/soulad/DnesniDoruceniEditablePanel.tsx`

- [ ] **Step 1: Napsat `DnesniDoruceniEditablePanel`**

```tsx
// src/components/soulad/DnesniDoruceniEditablePanel.tsx
import type { DnesniDoruceniConfig, Segment } from "@/lib/model/types";
import { ROUTE_COMPLIANCE_SITUATIONS } from "@/lib/model/routeComplianceSituations";
import { formatTimeLimit } from "@/lib/model/formatTimeLimit";
import { SituaceCard } from "./SituaceCard";
import { MatchEditor } from "./MatchEditor";
import { TerminEditor } from "./TerminEditor";
import { TimeLimitEditor } from "./TimeLimitEditor";

export function DnesniDoruceniEditablePanel({
  segment,
  checkpointId,
  config,
  onChange,
}: {
  segment: Segment;
  checkpointId: string;
  config: DnesniDoruceniConfig;
  onChange: (next: DnesniDoruceniConfig) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
        Vstupní brána: bod se vyhodnocuje jen když <b className="text-foreground">ADD = dnes</b>. Datum
        doručení od přepravce (D) se poprvé vyhodnocuje až v Konečném limitu 1. scanu.
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="text-sm font-semibold mb-3">1. fyzický scan</div>
        <MatchEditor
          value={config.scan1.match}
          onChange={(match) => onChange({ ...config, scan1: { ...config.scan1, match } })}
        />
        <div className="mt-3">
          <div className="text-xs text-muted-foreground mb-1">Termín (nejpozdější možný vlastní čas)</div>
          <TerminEditor
            segment={segment}
            currentCheckpointId={checkpointId}
            value={config.scan1.deadline}
            onChange={(deadline) => onChange({ ...config, scan1: { ...config.scan1, deadline } })}
          />
        </div>
        <div className="mt-3 flex flex-col gap-2">
          <TimeLimitEditor
            label="Limit pro řádné záznamy"
            value={config.limitProRadneZaznamy}
            onChange={(limit) => onChange({ ...config, limitProRadneZaznamy: limit })}
          />
          <TimeLimitEditor
            label="Konečný limit"
            value={config.konecnyLimitScan1}
            onChange={(limit) => onChange({ ...config, konecnyLimitScan1: limit })}
          />
        </div>
        <div className="mt-3 rounded-md border border-dashed border-border p-2.5 text-xs text-muted-foreground">
          Až do Limitu pro řádné záznamy: žádná VkŘ, ať se řádný záznam objeví, nebo ne. Mezi Limitem pro
          řádné záznamy a Konečným limitem: pořád žádná VkŘ, jen se čeká. D se vyhodnocuje výhradně
          v Konečném limitu — pokud záznam nedorazil vůbec, nebo dorazil a D se posunulo, vzniká „Zpožděná
          zásilka" (viz karty níže).
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="text-sm font-semibold mb-3">2. fyzický scan</div>
        <MatchEditor
          value={config.scan2.match}
          onChange={(match) => onChange({ ...config, scan2: { ...config.scan2, match } })}
          showZipMatchesDestination
        />
        <div className="mt-3">
          <div className="text-xs text-muted-foreground mb-1">Termín (scan1 + posun)</div>
          <TerminEditor
            segment={segment}
            currentCheckpointId={checkpointId}
            value={config.scan2.deadline}
            onChange={(deadline) => onChange({ ...config, scan2: { ...config.scan2, deadline } })}
          />
        </div>
        <div className="mt-3">
          <TimeLimitEditor
            label="Konečný limit"
            value={config.konecnyLimitScan2}
            onChange={(limit) => onChange({ ...config, konecnyLimitScan2: limit })}
          />
        </div>
        <div className="mt-3 rounded-md border border-dashed border-border p-2.5 text-xs text-muted-foreground">
          Jednostupňové, žádný mezistupeň — jde o to, jestli 2. scan řádně dorazil do termínu finální
          kontroly (ne jen jestli dorazil vůbec). Aktuální hodnota: {formatTimeLimit(config.konecnyLimitScan2)}.
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Situace, které z tohoto bodu mohou vzniknout
        </div>
        <div className="flex flex-col gap-3">
          <SituaceCard
            headline="1. i 2. scan v pořádku"
            situationId={ROUTE_COMPLIANCE_SITUATIONS.dnesniDoruceni.situationId}
            severityId={ROUTE_COMPLIANCE_SITUATIONS.dnesniDoruceni.severityId}
          />
          <SituaceCard
            headline="Cokoli z plánu nevyšlo (scan chybí/pozdě, nebo D se posunulo)"
            situationId={ROUTE_COMPLIANCE_SITUATIONS.zpozdenaZasilka.situationId}
            severityId={ROUTE_COMPLIANCE_SITUATIONS.zpozdenaZasilka.severityId}
          />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Napojit import do `BodDetailPanel.tsx`**

Najdi v `BodDetailPanel.tsx`:
```tsx
import { TimeLimitEditor } from "./TimeLimitEditor";
```
Nahraď:
```tsx
import { TimeLimitEditor } from "./TimeLimitEditor";
import { DnesniDoruceniEditablePanel } from "./DnesniDoruceniEditablePanel";
```

Najdi:
```tsx
      {isDnesniDoruceni && checkpoint.dnesniDoruceni ? (
        <DnesniDoruceniEditablePanel
```
(Tenhle blok už v `BodDetailPanel.tsx` z Tasku 7 existuje beze změny — jen teď konečně existuje i soubor,
který importuje.)

- [ ] **Step 3: Ověřit build**

Run: `npm run build`
Expected: SUCCESS.

- [ ] **Step 4: Manuální průchod — editace a tvorba**

Run: `npm run dev`, otevři úsek s `cp_dnesni_doruceni_demo`. Potvrď:
- Přepnutí typu bodu na „Běžný bod" a zpět na „Dnešní doručení" funguje a nemaže rozpracovaná data
  (`dnesniDoruceni` zůstává zachované, protože `BodDetailPanel` používá `checkpoint.dnesniDoruceni ?? {výchozí}`).
- Změna hodnoty v libovolném poli (status, čas, offset) se ihned promítne a přežije refresh stránky
  (localStorage persistence přes `segmentsStore`).
- „+ Přidat bod" v levém sloupci vytvoří nový „Běžný bod", rovnou ho vybere, a karty situací (Nenalezen do
  Termínu / Objeví se později) se zobrazí okamžitě, i než cokoliv vyplníš.
- Kotva v `TerminEditor` nabízí primárně ostatní body aktuálního úseku (ne body z jiných úseků).

- [ ] **Step 5: Commit**

```bash
git add src/components/soulad/DnesniDoruceniEditablePanel.tsx src/components/soulad/BodDetailPanel.tsx
git commit -m "feat(soulad): editovatelný bod typu Dnešní doručení"
```

---

## Mimo rozsah tohoto plánu

- **Vedený wizard s kroky/našeptávačem** (jaký měl needpojený `CheckpointWizard.tsx`) — zvolena jednoduchá
  formulářová pole místo toho, na výslovné přání uživatelky.
- **Kotvy napříč celou trasou** (ne jen aktuálním úsekem) — `AnchorPicker` nabízí jen body aktuálního úseku
  plus systémové kotvy. Cross-úsek kotvení je navazující práce, pokud se ukáže potřeba.
- **Mazání bodu/úseku/trasy** — přidávání je v rozsahu, mazání ne (existující `segmentsStore.remove`/
  `routesStore.remove` API na to už je připravené, jen chybí UI tlačítko).
- **Test/simulátor záložka** (jako má samostatný artefakt `kontrola-na-bodu-trasy.html`) — tenhle prototyp,
  stejně jako `RuleCreatorPage`, nikdy nic doopravdy nevyhodnocuje proti reálným datům, jen konfiguruje.

---

## Task 9: Finální kontrola

- [ ] **Step 1: Kompletní build**

Run: `npm run build`
Expected: SUCCESS, žádné TypeScript chyby.

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: žádné nové chyby oproti stavu před touto prací (pre-existující chyby v needotčených souborech
jsou mimo rozsah).

- [ ] **Step 3: Manuální průchod celého flow**

Run: `npm run dev`. Projdi: `/soulad-s-trasou` → „+ Přidat trasu" → „+ Přidat úsek" → „+ Přidat bod" →
přepnout typ na „Dnešní doručení" → vyplnit pár polí → obnovit stránku (F5) → ověřit, že data přežila.
Zkontroluj i existující demo body (`cp_odlet_brno_demo`, `cp_dnesni_doruceni_demo`) — pořád fungují po všech
změnách datového modelu.

- [ ] **Step 4: Shrnutí pro uživatelku**

Připomeň v závěrečném shrnutí: než se tahle větev spojí s `main`, chtěla založit rollback bod (git tag na
posledním commitu před mergem) — to už je na ní, tenhle plán to neřeší.
