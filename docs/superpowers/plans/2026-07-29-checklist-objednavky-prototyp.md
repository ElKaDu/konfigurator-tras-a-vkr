# Checklist objednávky — interaktivní prototyp — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Postavit interaktivní prototyp stránky Checklist na obchodním případu (Krok 2), kde operátor reálně
prochází kontroly, hlásí nálezy, rozlišuje jistý problém od podezření, plánuje kontakt se zákazníkem/přepravcem
a zakládá věci k řešení pro sledování — se zbytkem appky (Krok 1, dashboard, odpočet limitu) jen naznačeným.

**Architecture:** Nový, samostatný datový model (`src/lib/checklist/`) po vzoru existujícího `makeStore<T>()`
patternu z `src/lib/model/store.ts` — bez závislosti na Rule/Situation/Condition enginu, protože jsme se
rozhodli, že v1 checklistu nemá žádné automatické vyhodnocování. Jedna hardcoded objednávka, žádný routing
podle ID. Nová sekce v `AppHeader`, samostatná pod `/checklist`.

**Tech Stack:** TanStack Start + React + TanStack Router (file-based), Tailwind s existujícími CSS proměnnými
(`src/styles.css`), shadcn/ui primitivy (`src/components/ui/*`), lucide-react ikony. Bez testovacího frameworku
— repo žádný nemá (`npm test` neexistuje), takže každý task se ověřuje ručně v dev serveru místo psaní testů;
kroky "spusť a ověř" popisují přesně, co v prohlížeči zkontrolovat.

---

## Kontext pro engineera bez znalosti repa

- Store pattern: `makeStore<T extends { id: string }>(seed, storageKey?)` vrací `{ getState, setState, useItems, seed }`.
  Kolem něj se staví `xStore = { all, byId, upsert, remove, ... }` objekt a `useX()` hook pro komponenty.
  Viz `src/lib/model/store.ts` — okopíruj tenhle pattern, neresetuj ho.
- Cesty (routes) jsou tenké — `createFileRoute("/cesta")({ component: PageComponent })`, veškerá logika žije
  v `src/components/<domena>/XPage.tsx`. Viz `src/routes/situace.tsx`.
- `AppHeader` (`src/components/AppHeader.tsx`) má union type `SectionKey` a natvrdo tři `NavLink`. Nová sekce
  = nová hodnota do `SectionKey` + nový `NavLink` řádek.
- Design tokeny (`src/styles.css`): `bg-card`, `text-muted-foreground`, `border-border` (Tailwind zkráceně jen
  `border`), `bg-primary-soft` + `text-accent-foreground` (světlá fialová dvojice), `bg-success`/`text-success-foreground`/
  obdoba `bg-success/10`, stejně `warning`, `destructive`, `info`. Žádné inline barvy, žádné oklch natvrdo v kódu.
- `cn(...)` z `@/lib/utils` pro skládání classNames (clsx + tailwind-merge).
- Datum/čas: žádná knihovna na formátování v tomhle prototypu není potřeba — používej `Intl.DateTimeFormat("cs-CZ", …)` ad hoc, nebo prostý string, dokonce natvrdo předpřipravené labely v seed datech, kde to stačí.

---

### Task 1: Datový model — typy

**Files:**
- Create: `src/lib/checklist/types.ts`

- [ ] **Step 1: Napiš typy**

```ts
// src/lib/checklist/types.ts

export type ChecklistCategory = "obsah" | "hodnota" | "dokumentace";

export const CHECKLIST_CATEGORY_ORDER: ChecklistCategory[] = ["obsah", "hodnota", "dokumentace"];

export const CHECKLIST_CATEGORY_LABELS: Record<ChecklistCategory, string> = {
  obsah: "Obsah zásilky — přípustnost",
  hodnota: "Hodnota, odpovědnost, pojištění",
  dokumentace: "Dokumentace",
};

/** Pět stavů položky checklistu — viz docs/superpowers/specs (checklist krok2 analýza). */
export type ChecklistItemState =
  | "open"
  | "resolved_ok"
  | "resolved_found"
  | "waiting_contact"
  | "waiting_delivery";

export interface ContextField {
  label: string;
  value: string;
}

/** Šablona kontroly — konfiguruje se jednou, kopíruje se do instance na objednávce. */
export interface ChecklistItemTemplate {
  id: string;
  category: ChecklistCategory;
  order: number;
  title: string;
  description: string;
  context: ContextField[];
  /** Nabízené možnosti řešení (rychlé volby v resolution formuláři, doplnitelné volným textem). */
  resolutionOptions: string[];
}

/** Instance kontroly na konkrétní objednávce. */
export interface ChecklistItem {
  id: string;
  templateId: string;
  state: ChecklistItemState;
  finding?: string;
  resolution?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  /** Vyplněno, když state === "waiting_contact". */
  kontaktId?: string;
  /** Vyplněno, když state === "waiting_delivery" a operátor založil VkŘ pro sledování. */
  vkrId?: string;
}

export type KontaktType = "customer" | "carrier";
export type KontaktStatus = "planned" | "done";

/** Naplánovaná domluva — jedna událost, víc navázaných položek checklistu. */
export interface Kontakt {
  id: string;
  type: KontaktType;
  /** ISO datetime string, např. "2026-07-30T10:00:00". */
  scheduledAt: string;
  note?: string;
  status: KontaktStatus;
  linkedItemIds: string[];
}

/** VkŘ vytvořená ze sledování jedné konkrétní položky (stav waiting_delivery). */
export interface ChecklistVkr {
  id: string;
  title: string;
  itemId: string;
  /** ISO datetime string. */
  dueAt: string;
  createdAt: string;
  resolved: boolean;
}
```

- [ ] **Step 2: Ověř, že soubor projde typovou kontrolou**

Run: `npx tsc --noEmit 2>&1 | grep checklist`
Expected: žádný výstup (žádné nové chyby v `src/lib/checklist/`)

- [ ] **Step 3: Commit**

```bash
git add src/lib/checklist/types.ts
git commit -m "feat(checklist): add data model types"
```

---

### Task 2: Seed data

**Files:**
- Create: `src/lib/checklist/seed.ts`

Reálný scénář ze schváleného wireframu (`mockups/2026-07-29-checklist-stavy-kontakt-wireframe.html`): objednávka
#OP-2026-04471, tři kategorie, osm položek pokrývajících všech pět stavů.

- [ ] **Step 1: Napiš seed data**

```ts
// src/lib/checklist/seed.ts
import type { ChecklistItem, ChecklistItemTemplate, ChecklistVkr, Kontakt } from "./types";

export const CHECKLIST_ITEM_TEMPLATES: ChecklistItemTemplate[] = [
  {
    id: "tpl_neprip_zbozi",
    category: "obsah",
    order: 1,
    title: "Kontrola nepřípustného zboží dle přepravce",
    description: "Zbraně a makety, kazitelné potraviny, peníze apod. dle podmínek přepravce.",
    context: [
      { label: "Zadaný obsah", value: "kosmetika, drobné dárky" },
      { label: "Přepravce", value: "DHL Express" },
      { label: "Odkud → kam", value: "Praha, CZ → Berlín, DE" },
      { label: "Hodnota", value: "4 200 Kč · pojištěno 300 Kč" },
    ],
    resolutionOptions: [
      "Zákazník věc vyndal, přeprava pokračuje",
      "Přeprava zrušena",
      "Nepřiznané poslání",
    ],
  },
  {
    id: "tpl_dg",
    category: "obsah",
    order: 2,
    title: "Vyhodnocení obsahu z pohledu DG",
    description: "Např. zda „kosmetika“ neznamená parfémy, „barva“ hořlavinu.",
    context: [
      { label: "Zadaný obsah", value: "kosmetika, drobné dárky" },
      { label: "Kategorie zboží", value: "Běžné zboží" },
      { label: "Varianta přepravy", value: "Express letecky" },
    ],
    resolutionOptions: ["Věc vyndána, přeprava pokračuje standardně", "Přeprava zrušena", "Nepřiznané poslání"],
  },
  {
    id: "tpl_dokumenty",
    category: "obsah",
    order: 3,
    title: "Ověření, že se jedná o dokumenty",
    description: "Potvrzení, že obsah jsou opravdu jen dokumenty.",
    context: [
      { label: "Typ zásilky", value: "Balíky — ne Dokumenty" },
      { label: "Zadaný obsah", value: "kosmetika, drobné dárky" },
    ],
    resolutionOptions: ["Potvrzeno, jsou to dokumenty"],
  },
  {
    id: "tpl_hodnota_odpovednost",
    category: "hodnota",
    order: 1,
    title: "Kontrola hodnoty vůči naší odpovědnosti",
    description: "Hodnota 6 800 Kč o 24 % převyšuje naši odpovědnost 5 500 Kč, nepojištěno.",
    context: [
      { label: "Hodnota zásilky", value: "6 800 Kč" },
      { label: "Naše odpovědnost", value: "5 500 Kč · dle hmotnosti" },
      { label: "Pojištění", value: "ne" },
    ],
    resolutionOptions: ["Pojištěno", "Necháváme bez pojištění"],
  },
  {
    id: "tpl_pojistitelnost",
    category: "hodnota",
    order: 2,
    title: "Kontrola splnění podmínek pro pojištění",
    description: "Komodita je pojistitelná jen v omezeném rozsahu.",
    context: [
      { label: "Kategorie zboží", value: "Běžné zboží" },
      { label: "Pojistná částka", value: "6 800 Kč" },
      { label: "Rozsah", value: "Omezený" },
    ],
    resolutionOptions: ["Pojištění v omezeném rozsahu ponecháno", "Pojištění zrušeno, peníze vráceny"],
  },
  {
    id: "tpl_hodnota_chyba",
    category: "hodnota",
    order: 3,
    title: "Kontrola chybně zadané hodnoty",
    description: "Řádová chyba při zadání — např. 40,- místo 40.000,-.",
    context: [
      { label: "Hodnota", value: "6 800 Kč" },
      { label: "Hodnota na kus", value: "≈ 3 400 Kč" },
    ],
    resolutionOptions: ["Hodnota potvrzena", "Hodnota opravena"],
  },
  {
    id: "tpl_celni_faktura",
    category: "dokumentace",
    order: 1,
    title: "Kontrola celní faktury",
    description: "Faktura zatím nebyla dodána — zákazník vyzván, čekáme na doručení.",
    context: [
      { label: "Cílová země", value: "Švýcarsko — mimo EU" },
      { label: "Stav faktury", value: "nedodána" },
    ],
    resolutionOptions: ["Faktura upravena se zákazníkem", "Fakturu vytvoříme my", "Čekáme na dodání"],
  },
  {
    id: "tpl_eori",
    category: "dokumentace",
    order: 2,
    title: "Kontrola EORI vývozce",
    description: "Zákazník nemá EORI, vyzván k vyřízení.",
    context: [
      { label: "Cílová země", value: "Švýcarsko — mimo EU" },
      { label: "EORI zákazníka", value: "nenalezeno" },
    ],
    resolutionOptions: ["Čekáme na vyřízení"],
  },
];

export const CHECKLIST_KONTAKTY: Kontakt[] = [
  {
    id: "kontakt_1",
    type: "customer",
    scheduledAt: nextNoon(1, 10),
    note: "Nabídka pojištění + omezený rozsah pojistitelnosti.",
    status: "planned",
    linkedItemIds: ["item_hodnota_odpovednost", "item_pojistitelnost"],
  },
];

export const CHECKLIST_VKRS: ChecklistVkr[] = [
  {
    id: "vkr_celni_faktura",
    title: "Sledovat dodání celní faktury",
    itemId: "item_celni_faktura",
    dueAt: nextNoon(2, 12),
    createdAt: nextNoon(0, 9),
    resolved: false,
  },
];

export const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: "item_neprip_zbozi",
    templateId: "tpl_neprip_zbozi",
    state: "resolved_found",
    finding: "Obsahovalo powerbanku (Li-ion).",
    resolution: "Zákazník věc vyndal, přeprava pokračuje — potvrzeno e-mailem.",
    resolvedAt: nextNoon(0, 10, 12),
    resolvedBy: "E. Kadubcová",
  },
  { id: "item_dg", templateId: "tpl_dg", state: "open" },
  { id: "item_dokumenty", templateId: "tpl_dokumenty", state: "open" },
  {
    id: "item_hodnota_odpovednost",
    templateId: "tpl_hodnota_odpovednost",
    state: "waiting_contact",
    kontaktId: "kontakt_1",
  },
  {
    id: "item_pojistitelnost",
    templateId: "tpl_pojistitelnost",
    state: "waiting_contact",
    kontaktId: "kontakt_1",
  },
  { id: "item_hodnota_chyba", templateId: "tpl_hodnota_chyba", state: "open" },
  {
    id: "item_celni_faktura",
    templateId: "tpl_celni_faktura",
    state: "waiting_delivery",
    resolution: "Čekáme na dodání",
    vkrId: "vkr_celni_faktura",
  },
  { id: "item_eori", templateId: "tpl_eori", state: "waiting_delivery", resolution: "Čekáme na vyřízení" },
];

/** Pomocná funkce pro čitelná seed data — "zítra/pozítří v HH:MM", bez závislosti na knihovně. */
function nextNoon(daysFromNow: number, hour: number, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}
```

- [ ] **Step 2: Ověř typovou kontrolu**

Run: `npx tsc --noEmit 2>&1 | grep checklist`
Expected: žádný výstup

- [ ] **Step 3: Commit**

```bash
git add src/lib/checklist/seed.ts
git commit -m "feat(checklist): add seed data for order #OP-2026-04471"
```

---

### Task 3: Store

**Files:**
- Create: `src/lib/checklist/store.ts`

- [ ] **Step 1: Napiš store podle patternu z `src/lib/model/store.ts`**

```ts
// src/lib/checklist/store.ts
import { useEffect, useState } from "react";
import type { ChecklistItem, ChecklistItemTemplate, ChecklistVkr, Kontakt } from "./types";
import { CHECKLIST_ITEMS, CHECKLIST_ITEM_TEMPLATES, CHECKLIST_KONTAKTY, CHECKLIST_VKRS } from "./seed";

type Listener = () => void;

function makeStore<T extends { id: string }>(seed: readonly T[], storageKey: string) {
  function loadInitial(): T[] {
    if (typeof window === "undefined") return [...seed];
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return [...seed];
      const parsed = JSON.parse(raw) as T[];
      return Array.isArray(parsed) ? parsed : [...seed];
    } catch {
      return [...seed];
    }
  }

  let state: T[] = [...seed];
  let hydrated = false;
  const listeners = new Set<Listener>();

  function ensureHydrated() {
    if (hydrated || typeof window === "undefined") return;
    state = loadInitial();
    hydrated = true;
  }

  function persist() {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(storageKey, JSON.stringify(state));
      } catch {
        /* ignore quota */
      }
    }
  }

  function notify() {
    listeners.forEach((l) => l());
  }

  function getState(): T[] {
    ensureHydrated();
    return state;
  }

  function setState(next: T[]): void {
    state = next;
    persist();
    notify();
  }

  function useItems(): T[] {
    const [, force] = useState(0);
    useEffect(() => {
      ensureHydrated();
      force((n) => n + 1);
      const l = () => force((n) => n + 1);
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    }, []);
    return state;
  }

  return { getState, setState, useItems, seed };
}

// ---------------------------------------------------------------------------
// Templates — read-only v tomto prototypu
// ---------------------------------------------------------------------------

export function useChecklistItemTemplates(): ChecklistItemTemplate[] {
  return CHECKLIST_ITEM_TEMPLATES;
}

export function templateById(id: string): ChecklistItemTemplate | undefined {
  return CHECKLIST_ITEM_TEMPLATES.find((t) => t.id === id);
}

// ---------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------

const _items = makeStore<ChecklistItem>(CHECKLIST_ITEMS, "checklist_items_v1");

export function useChecklistItems(): ChecklistItem[] {
  return _items.useItems();
}

export const checklistItemsStore = {
  all: (): ChecklistItem[] => _items.getState(),
  byId: (id: string): ChecklistItem | undefined => _items.getState().find((i) => i.id === id),
  update(id: string, patch: Partial<ChecklistItem>): void {
    const cur = _items.getState();
    _items.setState(cur.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  },
  reset(): void {
    _items.setState([..._items.seed]);
  },
};

// ---------------------------------------------------------------------------
// Kontakty
// ---------------------------------------------------------------------------

const _kontakty = makeStore<Kontakt>(CHECKLIST_KONTAKTY, "checklist_kontakty_v1");

export function useKontakty(): Kontakt[] {
  return _kontakty.useItems();
}

export const kontaktyStore = {
  all: (): Kontakt[] => _kontakty.getState(),
  byId: (id: string): Kontakt | undefined => _kontakty.getState().find((k) => k.id === id),
  create(kontakt: Kontakt): void {
    _kontakty.setState([..._kontakty.getState(), kontakt]);
  },
  update(id: string, patch: Partial<Kontakt>): void {
    const cur = _kontakty.getState();
    _kontakty.setState(cur.map((k) => (k.id === id ? { ...k, ...patch } : k)));
  },
  reset(): void {
    _kontakty.setState([..._kontakty.seed]);
  },
};

// ---------------------------------------------------------------------------
// VkŘ vzniklé ze sledování
// ---------------------------------------------------------------------------

const _vkrs = makeStore<ChecklistVkr>(CHECKLIST_VKRS, "checklist_vkrs_v1");

export function useChecklistVkrs(): ChecklistVkr[] {
  return _vkrs.useItems();
}

export const checklistVkrStore = {
  all: (): ChecklistVkr[] => _vkrs.getState(),
  create(vkr: ChecklistVkr): void {
    _vkrs.setState([..._vkrs.getState(), vkr]);
  },
  /** Postupné odbavení — označí VkŘ za vyřešenou. Nemění navázanou ChecklistItem; to dělá volající
   *  (viz VkrPanel), protože store nesmí znát detaily druhé domény sám od sebe. */
  resolve(id: string): void {
    const cur = _vkrs.getState();
    _vkrs.setState(cur.map((v) => (v.id === id ? { ...v, resolved: true } : v)));
  },
  reset(): void {
    _vkrs.setState([..._vkrs.seed]);
  },
};

/** Resetuje všechny tři stores na seed stav — použij pro tlačítko "Vrátit prototyp na začátek". */
export function resetChecklistPrototype(): void {
  checklistItemsStore.reset();
  kontaktyStore.reset();
  checklistVkrStore.reset();
}
```

- [ ] **Step 2: Ověř typovou kontrolu**

Run: `npx tsc --noEmit 2>&1 | grep checklist`
Expected: žádný výstup

- [ ] **Step 3: Commit**

```bash
git add src/lib/checklist/store.ts
git commit -m "feat(checklist): add stores for items, kontakty, vkr"
```

---

### Task 4: Route, AppHeader vstup, stránkový shell

**Files:**
- Create: `src/routes/checklist.tsx`
- Create: `src/components/checklist/ChecklistPage.tsx`
- Modify: `src/components/AppHeader.tsx`

- [ ] **Step 1: Přidej sekci do AppHeaderu**

V `src/components/AppHeader.tsx` uprav `SectionKey` a přidej `NavLink`:

```ts
export type SectionKey = "rules" | "soulad" | "situace" | "checklist";
```

A do `<nav>` za poslední `NavLink` přidej:

```tsx
<NavLink to="/checklist" active={current === "checklist"}>Checklist objednávky</NavLink>
```

- [ ] **Step 2: Vytvoř route**

```tsx
// src/routes/checklist.tsx
import { createFileRoute } from "@tanstack/react-router";
import { ChecklistPage } from "@/components/checklist/ChecklistPage";

export const Route = createFileRoute("/checklist")({
  head: () => ({
    meta: [
      { title: "Checklist objednávky — Bytorp" },
      { name: "description", content: "Vyhodnocení a kontrola objednávky, Krok 2." },
    ],
  }),
  component: ChecklistPage,
});
```

- [ ] **Step 3: Vytvoř stránkový shell — topbar, banner, Krok 1 mockup placeholder, dvousloupcový layout**

```tsx
// src/components/checklist/ChecklistPage.tsx
import { AppHeader } from "@/components/AppHeader";
import { Krok1Mock } from "./Krok1Mock";
import { CategoryNav } from "./CategoryNav";
import { ItemsList } from "./ItemsList";
import { ShrnutiNalezuPanel } from "./ShrnutiNalezuPanel";
import { VkrPanel } from "./VkrPanel";
import { KontaktWidget } from "./KontaktWidget";
import { useChecklistItems, resetChecklistPrototype } from "@/lib/checklist/store";
import { computeChecklistStatus } from "@/lib/checklist/derived";
import { RotateCcw } from "lucide-react";

export function ChecklistPage() {
  const items = useChecklistItems();
  const status = computeChecklistStatus(items);

  return (
    <div className="flex h-screen w-screen flex-col bg-background text-foreground">
      <AppHeader
        current="checklist"
        extras={
          <button
            onClick={resetChecklistPrototype}
            className="flex items-center gap-1.5 rounded-md border border-input px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted"
          >
            <RotateCcw className="size-3.5" /> Reset prototypu
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-6 py-5">
          <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
            Obchodní případy / Objednávky / <span className="font-medium text-foreground">#OP-2026-04471</span>
          </div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-semibold">Objednávka #OP-2026-04471</h1>
            <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-[11px] font-semibold text-accent-foreground">
              Objednávka · Vyhodnocení a kontrola
            </span>
            <span className={statusPillClass(status.kind)}>{status.label}</span>
          </div>

          <div className="mb-4 rounded-lg border border-primary bg-primary-soft px-4 py-2.5 text-xs text-accent-foreground">
            <b>Prototyp checklistu.</b> Krok 1 níže je jen náhled (needituje se). Zbytek — položky, kontext,
            nálezy, kontakty, věci k řešení — je plně funkční, ukládá se do localStorage.
          </div>

          <div className="mb-4 flex flex-wrap items-stretch gap-3">
            <div className="flex flex-1 min-w-[220px] items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
              <div>
                <div className="text-xl font-bold tabular-nums text-warning-foreground">2:40</div>
                <div className="text-[11px] text-muted-foreground">
                  do limitu zpracování <span className="opacity-70">(mock — nepočítá se)</span>
                </div>
              </div>
            </div>
            <KontaktWidget />
            <div className="flex flex-1 min-w-[190px] items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
              <div className="flex-1">
                <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                  <span>Krok 2</span>
                  <span className="tabular-nums text-foreground">
                    {status.resolvedCount} / {status.totalCount}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-success"
                    style={{ width: `${status.progressPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <Krok1Mock />

          <div className="grid grid-cols-[260px_minmax(0,1fr)] items-start gap-4">
            <aside className="sticky top-4 flex flex-col gap-3">
              <CategoryNav />
              <ShrnutiNalezuPanel />
              <VkrPanel />
            </aside>
            <main>
              <ItemsList />
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

function statusPillClass(kind: "in_progress" | "waiting_contact" | "overdue" | "done"): string {
  const base = "rounded-full px-2.5 py-0.5 text-[11px] font-semibold";
  if (kind === "waiting_contact") return `${base} bg-warning/15 text-warning-foreground`;
  if (kind === "overdue") return `${base} bg-destructive/15 text-destructive`;
  if (kind === "done") return `${base} bg-success/15 text-success-foreground`;
  return `${base} bg-muted text-muted-foreground`;
}
```

Tenhle soubor odkazuje na komponenty a `computeChecklistStatus`, které vzniknou v dalších tascích — do té doby
`tsc` bude hlásit chybějící moduly, což je v pořádku, dokončí se to v Tasku 9.

- [ ] **Step 4: Commit**

```bash
git add src/routes/checklist.tsx src/components/checklist/ChecklistPage.tsx src/components/AppHeader.tsx
git commit -m "feat(checklist): add route, nav entry, page shell"
```

---

### Task 5: Krok 1 — statický mockup

**Files:**
- Create: `src/components/checklist/Krok1Mock.tsx`

Čistě statická komponenta, žádný state, žádné napojení na store — přesně jak bylo domluveno (Krok 1 je mockup).

- [ ] **Step 1: Napiš komponentu**

```tsx
// src/components/checklist/Krok1Mock.tsx
import { Phone } from "lucide-react";

/**
 * Krok 1 (Oprávněnost zpracovat objednávku) je v tomto prototypu jen náhled — needituje se, nereaguje na
 * store. Skutečná logika (VkŘ pro přiřazení zákazníka a expertizu) je mimo rozsah tohoto prototypu.
 */
export function Krok1Mock() {
  return (
    <details className="mb-4 rounded-lg border border-border bg-card" open={false}>
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm">
        <span className="text-muted-foreground">▶</span>
        <b>Krok 1 · Oprávněnost zpracovat objednávku</b>
        <span className="rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-semibold text-success-foreground">
          vyřešeno 2/2
        </span>
        <span className="ml-auto text-xs text-muted-foreground">proběhlo před přiřazením — jen náhled</span>
      </summary>
      <div className="space-y-2 border-t border-border px-4 py-3 text-sm">
        <div className="flex gap-2">
          <span className="mt-0.5 flex size-4 items-center justify-center rounded bg-success text-[10px] text-success-foreground">
            ✓
          </span>
          <div>
            <div className="font-medium">Kontrola přiřazení zákazníka</div>
            <div className="text-xs text-muted-foreground">
              Volný zákazník — vyřešeno přiřazením 9:38. <span className="opacity-70">VkŘ #4471-A</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <span className="mt-0.5 flex size-4 items-center justify-center rounded bg-success text-[10px] text-success-foreground">
            ✓
          </span>
          <div>
            <div className="font-medium">Kontrola potřebné expertizy</div>
            <div className="text-xs text-muted-foreground">
              Pravidlo nenašlo shodu — VkŘ nevzniklo, splněno automaticky.
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          <Phone className="size-3.5 shrink-0" />
          Náhled dashboardu operátorů (před přiřazením) a skutečný VkŘ mechanismus jsou mimo rozsah tohoto
          prototypu — viz mockups/2026-07-29-prirazeni-stavy-wireframe.html.
        </div>
      </div>
    </details>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/checklist/Krok1Mock.tsx
git commit -m "feat(checklist): add static Krok 1 mockup"
```

---

### Task 6: Odvozené hodnoty — kategorie counts, status objednávky, shrnutí

**Files:**
- Create: `src/lib/checklist/derived.ts`

Jeden soubor pro všechny "computed" funkce nad store daty — žádná komponenta si nepočítá vlastní verzi téhož.

- [ ] **Step 1: Napiš odvozené funkce**

```ts
// src/lib/checklist/derived.ts
import type { ChecklistCategory, ChecklistItem, Kontakt } from "./types";
import { CHECKLIST_CATEGORY_ORDER, CHECKLIST_CATEGORY_LABELS } from "./types";
import { templateById } from "./store";
import { kontaktyStore } from "./store";

export function isResolved(item: ChecklistItem): boolean {
  return item.state === "resolved_ok" || item.state === "resolved_found";
}

export interface CategoryCount {
  category: ChecklistCategory;
  label: string;
  resolved: number;
  total: number;
}

export function categoryCounts(items: ChecklistItem[]): CategoryCount[] {
  return CHECKLIST_CATEGORY_ORDER.map((category) => {
    const inCategory = items.filter((i) => templateById(i.templateId)?.category === category);
    return {
      category,
      label: CHECKLIST_CATEGORY_LABELS[category],
      resolved: inCategory.filter(isResolved).length,
      total: inCategory.length,
    };
  });
}

export type ChecklistStatusKind = "in_progress" | "waiting_contact" | "overdue" | "done";

export interface ChecklistStatus {
  kind: ChecklistStatusKind;
  label: string;
  resolvedCount: number;
  totalCount: number;
  progressPct: number;
}

export function computeChecklistStatus(items: ChecklistItem[]): ChecklistStatus {
  const resolvedCount = items.filter(isResolved).length;
  const totalCount = items.length;
  const progressPct = totalCount === 0 ? 0 : Math.round((resolvedCount / totalCount) * 100);

  if (resolvedCount === totalCount) {
    return { kind: "done", label: "Hotovo", resolvedCount, totalCount, progressPct };
  }

  const plannedKontakty = kontaktyStore.all().filter((k: Kontakt) => k.status === "planned");
  if (plannedKontakty.length > 0) {
    const now = Date.now();
    const overdue = plannedKontakty.some((k) => new Date(k.scheduledAt).getTime() < now);
    if (overdue) {
      return { kind: "overdue", label: "⏱ Po termínu kontaktu", resolvedCount, totalCount, progressPct };
    }
    return { kind: "waiting_contact", label: "⏱ Čeká na kontakt", resolvedCount, totalCount, progressPct };
  }

  return { kind: "in_progress", label: "V průběhu", resolvedCount, totalCount, progressPct };
}

export function findingsSummary(items: ChecklistItem[]): ChecklistItem[] {
  return items.filter((i) => i.state === "resolved_found");
}

export function nextPlannedKontakt(kontakty: Kontakt[]): Kontakt | undefined {
  return kontakty
    .filter((k) => k.status === "planned")
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0];
}

export function formatKontaktDateTime(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" }).format(d);
}
```

- [ ] **Step 2: Ověř typovou kontrolu**

Run: `npx tsc --noEmit 2>&1 | grep checklist`
Expected: chyby by měly zmizet z `ChecklistPage.tsx` ohledně `computeChecklistStatus` (ostatní komponenty ještě
chybí — vzniknou v dalších taskách, to je v pořádku)

- [ ] **Step 3: Commit**

```bash
git add src/lib/checklist/derived.ts
git commit -m "feat(checklist): add derived status/counts/summary helpers"
```

---

### Task 7: Levý sloupec — kapitoly, shrnutí nálezů, věci k řešení

**Files:**
- Create: `src/components/checklist/CategoryNav.tsx`
- Create: `src/components/checklist/ShrnutiNalezuPanel.tsx`
- Create: `src/components/checklist/VkrPanel.tsx`

- [ ] **Step 1: CategoryNav — scroll-to-kotva, počty se čtou ze store**

```tsx
// src/components/checklist/CategoryNav.tsx
import { useChecklistItems } from "@/lib/checklist/store";
import { categoryCounts } from "@/lib/checklist/derived";

export function CategoryNav() {
  const items = useChecklistItems();
  const counts = categoryCounts(items);

  function scrollTo(category: string) {
    document.getElementById(`cat-${category}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <nav className="rounded-lg border border-border bg-card p-3.5">
      <p className="mb-2.5 text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">
        Kapitoly kontrol
      </p>
      <div className="flex flex-col">
        {counts.map((c) => (
          <button
            key={c.category}
            onClick={() => scrollTo(c.category)}
            className="flex items-baseline justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px] hover:bg-muted"
          >
            <span>{c.label}</span>
            <span className="tabular-nums text-[11.5px] text-muted-foreground">
              {c.resolved}/{c.total}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: ShrnutiNalezuPanel — filtrovaný pohled na resolved_found**

```tsx
// src/components/checklist/ShrnutiNalezuPanel.tsx
import { useChecklistItems } from "@/lib/checklist/store";
import { findingsSummary } from "@/lib/checklist/derived";
import { templateById } from "@/lib/checklist/store";

export function ShrnutiNalezuPanel() {
  const items = useChecklistItems();
  const findings = findingsSummary(items);

  if (findings.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-3.5">
      <p className="mb-0.5 text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">
        Shrnutí nálezů
      </p>
      <p className="mb-2.5 text-[11px] text-muted-foreground">co nebylo v pořádku a jak se to vyřešilo</p>
      <div className="flex flex-col gap-2.5">
        {findings.map((item) => {
          const tpl = templateById(item.templateId);
          return (
            <div key={item.id} className="border-b border-border pb-2.5 last:border-0 last:pb-0">
              <div className="text-[12.5px] font-semibold">{tpl?.title}</div>
              <div className="mt-0.5 text-[11.5px] text-success-foreground">
                <b>Nález:</b> {item.finding}
              </div>
              <div className="text-[11.5px] text-success-foreground">
                <b>Řešení:</b> {item.resolution}
              </div>
              <div className="mt-0.5 text-[10.5px] text-muted-foreground">
                vyřešil{item.resolvedBy ? "a " + item.resolvedBy : "a"}
                {item.resolvedAt ? ", " + new Date(item.resolvedAt).toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" }) : ""}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: VkrPanel — statické Krok-1 řádky (mock) + reálné VkŘ ze sledování, s postupným odbavením**

Odbavení VkŘ musí zároveň uzavřít navázanou položku checklistu (VYŘEŠENO · S NÁLEZEM) — proto se šablona
i položka dohledávají přes `useChecklistItems()`, ne přes string manipulaci s ID.

```tsx
// src/components/checklist/VkrPanel.tsx
import type { ReactNode } from "react";
import { useChecklistVkrs, useChecklistItems, checklistVkrStore, checklistItemsStore } from "@/lib/checklist/store";
import { templateById } from "@/lib/checklist/store";
import { formatKontaktDateTime } from "@/lib/checklist/derived";
import { Button } from "@/components/ui/button";

export function VkrPanel() {
  const vkrs = useChecklistVkrs();
  const items = useChecklistItems();
  const openCount = vkrs.filter((v) => !v.resolved).length;

  function resolveVkr(vkrId: string, itemId: string) {
    const item = items.find((i) => i.id === itemId);
    checklistVkrStore.resolve(vkrId);
    checklistItemsStore.update(itemId, {
      state: "resolved_found",
      resolvedAt: new Date().toISOString(),
      resolvedBy: "E. Kadubcová",
      finding: item?.finding ?? item?.resolution ?? "Dodáno / vyřízeno.",
    });
  }

  return (
    <div className="rounded-lg border border-border bg-card p-3.5">
      <p className="mb-0.5 text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">
        Věci k řešení na checklistu
      </p>
      <p className="mb-2.5 text-[11px] text-muted-foreground">
        {openCount} otevřené (sledování) · {2 + vkrs.filter((v) => v.resolved).length} vyřešené (2 Krok 1 mock + sledování)
      </p>
      <div className="flex flex-col gap-2">
        <VkrRow dotClass="bg-success" title="Přiřazení objednávky — volný zákazník" meta="#4471-A · Krok 1 · mock · vyřešeno 9:38" muted />
        <VkrRow dotClass="bg-success" title="Čeká na zaplacení" meta="#4471-C · Krok 1 · mock · vyřešeno 9:42" muted />
        {vkrs.map((v) => {
          const item = items.find((i) => i.id === v.itemId);
          const tpl = item ? templateById(item.templateId) : undefined;
          return (
            <VkrRow
              key={v.id}
              dotClass={v.resolved ? "bg-success" : "bg-info"}
              title={v.title}
              meta={`${v.id} · vytvořeno ze sledování · termín ${formatKontaktDateTime(v.dueAt)}${tpl ? " · " + tpl.title : ""}`}
              muted={v.resolved}
              action={
                !v.resolved && item ? (
                  <Button size="sm" variant="outline" onClick={() => resolveVkr(v.id, item.id)}>
                    ✓ Vyřešit
                  </Button>
                ) : undefined
              }
            />
          );
        })}
      </div>
    </div>
  );
}

function VkrRow({
  dotClass,
  title,
  meta,
  muted,
  action,
}: {
  dotClass: string;
  title: string;
  meta: string;
  muted?: boolean;
  action?: ReactNode;
}) {
  return (
    <div className="flex gap-2">
      <span className={`mt-1.5 size-2 shrink-0 rounded-full ${dotClass}`} />
      <div className="min-w-0 flex-1">
        <div className={`text-[12.5px] font-semibold ${muted ? "text-muted-foreground font-medium" : ""}`}>{title}</div>
        <div className="mt-0.5 text-[11px] text-muted-foreground">{meta}</div>
        {action && <div className="mt-1.5">{action}</div>}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Ověř v prohlížeči, že levý sloupec vykresluje bez pádu**

Run: `npm run dev`
Otevři `http://localhost:3000/checklist` (nebo port, který Vite vypíše).
Expected: stránka se načte (i když `ItemsList` a `KontaktWidget` ještě nejsou hotové — dojde k chybě
"module not found", to je očekávané, dokončí se v Tasku 8–9). Zkontroluj v konzoli, že chyba je přesně
o chybějících modulech `ItemsList`/`KontaktWidget`, ne o něčem jiném.

- [ ] **Step 5: Commit**

```bash
git add src/components/checklist/CategoryNav.tsx src/components/checklist/ShrnutiNalezuPanel.tsx src/components/checklist/VkrPanel.tsx
git commit -m "feat(checklist): add left column panels (nav, findings, vkr)"
```

---

### Task 8: Položka checklistu — kontext, stavy, formulář vyřešení

**Files:**
- Create: `src/components/checklist/ItemContext.tsx`
- Create: `src/components/checklist/ItemResolutionForm.tsx`
- Create: `src/components/checklist/ChecklistItemRow.tsx`
- Create: `src/components/checklist/ItemsList.tsx`

Tohle je jádro prototypu — funkční zobrazení kontextu, vyřešení, výběr nálezu, označení podezření.

- [ ] **Step 1: ItemContext — inline kontext v boxu kontroly (klik na položku ho otevře/zavře)**

```tsx
// src/components/checklist/ItemContext.tsx
import type { ContextField } from "@/lib/checklist/types";

export function ItemContext({ title, fields }: { title: string; fields: ContextField[] }) {
  return (
    <div className="mt-2.5 rounded-r-lg border border-l-4 border-border border-l-primary bg-background p-3">
      <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        Kontext ze zásilky pro
      </p>
      <h4 className="mb-2.5 text-[13px] font-semibold">{title}</h4>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {fields.map((f) => (
          <div key={f.label}>
            <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{f.label}</div>
            <div className="text-[12.5px]">{f.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: ItemResolutionForm — nález / OK / podezření / čeká na dodání, ve dvou režimech**

```tsx
// src/components/checklist/ItemResolutionForm.tsx
import { useState } from "react";
import type { ChecklistItemTemplate } from "@/lib/checklist/types";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export type ResolutionOutcome =
  | { kind: "ok" }
  | { kind: "found"; finding: string; resolution: string }
  | { kind: "found_waiting_delivery"; finding: string; resolution: string }
  | { kind: "needs_contact"; finding: string };

export function ItemResolutionForm({
  template,
  mode,
  onSubmit,
  onCancel,
}: {
  template: ChecklistItemTemplate;
  /** "initial" = první průchod (nabízí podezření → kontakt). "after_contact" = po proběhlém callu
   *  (nabízí "pořád nejasné → nový kontakt" místo podezření). */
  mode: "initial" | "after_contact";
  onSubmit: (outcome: ResolutionOutcome) => void;
  onCancel: () => void;
}) {
  const [reporting, setReporting] = useState(false);
  const [finding, setFinding] = useState("");
  const [resolution, setResolution] = useState(template.resolutionOptions[0] ?? "");
  const [isSuspicion, setIsSuspicion] = useState(false);
  const [waitingDelivery, setWaitingDelivery] = useState(false);

  if (!reporting) {
    return (
      <div className="mt-2.5 flex gap-2">
        <Button size="sm" onClick={() => onSubmit({ kind: "ok" })}>
          ✓ V pořádku
        </Button>
        <Button size="sm" variant="outline" onClick={() => setReporting(true)}>
          ⚠ Nahlásit nález
        </Button>
        {mode === "after_contact" && (
          <Button size="sm" variant="outline" onClick={() => onSubmit({ kind: "needs_contact", finding: "" })}>
            📞 Pořád nejasné — další kontakt
          </Button>
        )}
      </div>
    );
  }

  function submit() {
    if (mode === "initial" && isSuspicion) {
      onSubmit({ kind: "needs_contact", finding });
      return;
    }
    if (waitingDelivery) {
      onSubmit({ kind: "found_waiting_delivery", finding, resolution });
      return;
    }
    onSubmit({ kind: "found", finding, resolution });
  }

  const submitLabel =
    mode === "initial" && isSuspicion
      ? "Naplánovat kontakt"
      : waitingDelivery
        ? "Uložit — čeká na dodání"
        : "Uzavřít nález";

  return (
    <div className="mt-2.5 rounded-lg border border-border bg-background p-3">
      <label className="mb-2 block text-xs font-medium text-muted-foreground">Co je špatně (nález)</label>
      <Textarea value={finding} onChange={(e) => setFinding(e.target.value)} rows={2} className="mb-3" />

      <label className="mb-2 block text-xs font-medium text-muted-foreground">Řešení</label>
      <select
        value={resolution}
        onChange={(e) => setResolution(e.target.value)}
        className="mb-3 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
      >
        {template.resolutionOptions.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>

      {mode === "initial" && (
        <label className="mb-2 flex items-center gap-2 text-xs">
          <input type="checkbox" checked={isSuspicion} onChange={(e) => setIsSuspicion(e.target.checked)} />
          Jde jen o podezření — potřebuji to nejdřív probrat s klientem
        </label>
      )}

      {!isSuspicion && (
        <label className="mb-3 flex items-center gap-2 text-xs">
          <input type="checkbox" checked={waitingDelivery} onChange={(e) => setWaitingDelivery(e.target.checked)} />
          Řešení čeká na dodání něčeho (dokument, registrace)
        </label>
      )}

      <div className="flex gap-2">
        <Button size="sm" onClick={submit} disabled={!finding.trim()}>
          {submitLabel}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Zrušit
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: ChecklistItemRow — spojuje vše dohromady, jedna komponenta pro všech pět stavů**

```tsx
// src/components/checklist/ChecklistItemRow.tsx
import { useState } from "react";
import type { ChecklistItem, ChecklistItemTemplate } from "@/lib/checklist/types";
import { checklistItemsStore, checklistVkrStore } from "@/lib/checklist/store";
import { kontaktyStore, useKontakty } from "@/lib/checklist/store";
import { formatKontaktDateTime } from "@/lib/checklist/derived";
import { ItemContext } from "./ItemContext";
import { ItemResolutionForm, type ResolutionOutcome } from "./ItemResolutionForm";
import { KontaktSchedulerDialog } from "./KontaktSchedulerDialog";
import { Button } from "@/components/ui/button";

export function ChecklistItemRow({ item, template }: { item: ChecklistItem; template: ChecklistItemTemplate }) {
  const [showContext, setShowContext] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [scheduling, setScheduling] = useState<{ preselectedItemId: string } | null>(null);
  const kontakty = useKontakty();
  const linkedKontakt = item.kontaktId ? kontakty.find((k) => k.id === item.kontaktId) : undefined;

  function handleOutcome(outcome: ResolutionOutcome) {
    setResolving(false);
    if (outcome.kind === "ok") {
      checklistItemsStore.update(item.id, { state: "resolved_ok", resolvedAt: new Date().toISOString(), resolvedBy: "E. Kadubcová" });
      return;
    }
    if (outcome.kind === "found") {
      checklistItemsStore.update(item.id, {
        state: "resolved_found",
        finding: outcome.finding,
        resolution: outcome.resolution,
        resolvedAt: new Date().toISOString(),
        resolvedBy: "E. Kadubcová",
      });
      return;
    }
    if (outcome.kind === "found_waiting_delivery") {
      checklistItemsStore.update(item.id, {
        state: "waiting_delivery",
        finding: outcome.finding,
        resolution: outcome.resolution,
      });
      return;
    }
    // needs_contact — otevři scheduler, item se propojí na Kontakt po submitu dialogu
    setScheduling({ preselectedItemId: item.id });
  }

  function createSledovaniVkr() {
    const id = "vkr_" + Date.now();
    const due = new Date();
    due.setDate(due.getDate() + 2);
    checklistVkrStore.create({
      id,
      title: `Sledovat: ${template.title}`,
      itemId: item.id,
      dueAt: due.toISOString(),
      createdAt: new Date().toISOString(),
      resolved: false,
    });
    checklistItemsStore.update(item.id, { vkrId: id });
  }

  function markKontaktDone() {
    if (!linkedKontakt) return;
    kontaktyStore.update(linkedKontakt.id, { status: "done" });
  }

  const isDone = item.state === "resolved_ok" || item.state === "resolved_found";
  const afterContactResolvable = item.state === "waiting_contact" && linkedKontakt?.status === "done";

  return (
    <div className="border-b border-border py-3 last:border-0">
      <div className="flex gap-2.5">
        <StateIcon state={item.state} />
        <div className="min-w-0 flex-1">
          <button
            onClick={() => setShowContext((s) => !s)}
            className="flex flex-wrap items-center gap-2 text-left"
          >
            <span className={`text-[13.5px] font-semibold ${isDone ? "text-muted-foreground font-medium" : ""}`}>
              {template.title}
            </span>
            <StateTag state={item.state} />
          </button>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">{template.description}</p>

          {isDone && item.state === "resolved_found" && (
            <p className="mt-1 text-[11.5px] text-success-foreground">
              <b>Nález:</b> {item.finding} <b>Řešení:</b> {item.resolution}
            </p>
          )}

          {item.state === "waiting_contact" && linkedKontakt && (
            <p className="mt-1 text-[11.5px] text-muted-foreground">
              Navázáno na Kontakt {formatKontaktDateTime(linkedKontakt.scheduledAt)} ({linkedKontakt.status === "done" ? "proběhl" : "naplánováno"}).
              {linkedKontakt.status === "planned" && (
                <button onClick={markKontaktDone} className="ml-1.5 text-primary underline">
                  označit jako proběhlý
                </button>
              )}
            </p>
          )}

          {item.state === "waiting_delivery" && (
            <div className="mt-1.5">
              {item.vkrId ? (
                <p className="text-[11.5px] text-muted-foreground">
                  Sledování má VkŘ — viz panel „Věci k řešení na checklistu“.
                </p>
              ) : (
                <button onClick={createSledovaniVkr} className="rounded-md border border-dashed border-input px-2.5 py-1 text-[12px] font-medium text-primary">
                  + Vytvořit věc k řešení pro sledování
                </button>
              )}
            </div>
          )}

          {showContext && <ItemContext title={template.title} fields={template.context} />}

          {item.state === "open" && !resolving && (
            <div className="mt-2.5">
              <Button size="sm" onClick={() => setResolving(true)}>
                Vyhodnotit
              </Button>
            </div>
          )}
          {item.state === "open" && resolving && (
            <ItemResolutionForm template={template} mode="initial" onSubmit={handleOutcome} onCancel={() => setResolving(false)} />
          )}

          {afterContactResolvable && !resolving && (
            <div className="mt-2.5">
              <Button size="sm" onClick={() => setResolving(true)}>
                Vyhodnotit po kontaktu
              </Button>
            </div>
          )}
          {afterContactResolvable && resolving && (
            <ItemResolutionForm template={template} mode="after_contact" onSubmit={handleOutcome} onCancel={() => setResolving(false)} />
          )}
        </div>
      </div>

      {scheduling && (
        <KontaktSchedulerDialog
          preselectedItemIds={[scheduling.preselectedItemId]}
          onClose={() => setScheduling(null)}
        />
      )}
    </div>
  );
}

function StateIcon({ state }: { state: ChecklistItem["state"] }) {
  const base = "mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border text-[10px]";
  if (state === "resolved_ok" || state === "resolved_found") return <span className={`${base} border-success bg-success text-success-foreground`}>✓</span>;
  if (state === "waiting_contact") return <span className={`${base} border-warning bg-warning/15 text-warning-foreground`}>📞</span>;
  if (state === "waiting_delivery") return <span className={`${base} border-info bg-info/15 text-info-foreground`}>⏳</span>;
  return <span className={`${base} border-input bg-transparent`} />;
}

function StateTag({ state }: { state: ChecklistItem["state"] }) {
  const map: Record<ChecklistItem["state"], { label: string; cls: string } | null> = {
    open: null,
    resolved_ok: { label: "vyřešeno", cls: "bg-success/15 text-success-foreground" },
    resolved_found: { label: "vyřešeno · s nálezem", cls: "bg-success/15 text-success-foreground" },
    waiting_contact: { label: "čeká na kontakt", cls: "bg-warning/15 text-warning-foreground" },
    waiting_delivery: { label: "čeká na dodání", cls: "bg-info/15 text-info-foreground" },
  };
  const t = map[state];
  if (!t) return null;
  return <span className={`rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide ${t.cls}`}>{t.label}</span>;
}
```

- [ ] **Step 4: ItemsList — seskupí položky podle kategorie, vykreslí sekce s kotvou pro CategoryNav**

```tsx
// src/components/checklist/ItemsList.tsx
import { useChecklistItems } from "@/lib/checklist/store";
import { templateById } from "@/lib/checklist/store";
import { CHECKLIST_CATEGORY_ORDER, CHECKLIST_CATEGORY_LABELS } from "@/lib/checklist/types";
import { categoryCounts } from "@/lib/checklist/derived";
import { ChecklistItemRow } from "./ChecklistItemRow";

export function ItemsList() {
  const items = useChecklistItems();
  const counts = categoryCounts(items);

  return (
    <div className="flex flex-col gap-4">
      {CHECKLIST_CATEGORY_ORDER.map((category) => {
        const inCategory = items.filter((i) => templateById(i.templateId)?.category === category);
        const count = counts.find((c) => c.category === category);
        return (
          <section key={category} id={`cat-${category}`} className="rounded-lg border border-border bg-card">
            <div className="flex items-baseline justify-between border-b border-border bg-secondary px-4 py-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wide">{CHECKLIST_CATEGORY_LABELS[category]}</span>
              <span className="tabular-nums text-[11.5px] text-muted-foreground">
                {count?.resolved}/{count?.total}
              </span>
            </div>
            <div className="px-4">
              {inCategory.map((item) => {
                const tpl = templateById(item.templateId);
                if (!tpl) return null;
                return <ChecklistItemRow key={item.id} item={item} template={tpl} />;
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/checklist/ItemContext.tsx src/components/checklist/ItemResolutionForm.tsx src/components/checklist/ChecklistItemRow.tsx src/components/checklist/ItemsList.tsx
git commit -m "feat(checklist): add item context, resolution form, item row, items list"
```

(Tenhle task ještě neprojde typovou kontrolou čistě — `KontaktSchedulerDialog` vzniká v Tasku 9. To je
očekávané, dokonči Task 9 před finálním ověřením.)

---

### Task 9: Kontakt — widget, plánování, propojení s položkami

**Files:**
- Create: `src/components/checklist/KontaktSchedulerDialog.tsx`
- Create: `src/components/checklist/KontaktWidget.tsx`

- [ ] **Step 1: KontaktSchedulerDialog — vytvoří nový Kontakt, propojí vybrané položky**

```tsx
// src/components/checklist/KontaktSchedulerDialog.tsx
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useChecklistItems, checklistItemsStore, kontaktyStore } from "@/lib/checklist/store";
import { templateById } from "@/lib/checklist/store";
import type { KontaktType } from "@/lib/checklist/types";

export function KontaktSchedulerDialog({
  preselectedItemIds,
  onClose,
}: {
  preselectedItemIds: string[];
  onClose: () => void;
}) {
  const items = useChecklistItems();
  const selectable = items.filter(
    (i) => i.state === "open" || (i.state === "waiting_contact" && preselectedItemIds.includes(i.id))
  );

  const [type, setType] = useState<KontaktType>("customer");
  const [scheduledAt, setScheduledAt] = useState(defaultDateTimeLocal());
  const [note, setNote] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set(preselectedItemIds));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function submit() {
    const id = "kontakt_" + Date.now();
    kontaktyStore.create({
      id,
      type,
      scheduledAt: new Date(scheduledAt).toISOString(),
      note: note || undefined,
      status: "planned",
      linkedItemIds: [...selected],
    });
    selected.forEach((itemId) => {
      checklistItemsStore.update(itemId, { state: "waiting_contact", kontaktId: id });
    });
    onClose();
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Naplánovat kontakt</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Typ</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as KontaktType)}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            >
              <option value="customer">Zákazník</option>
              <option value="carrier">Přepravce</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Termín</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Poznámka</label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Co se bude probírat…" />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Navázané položky</label>
            <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-md border border-border p-2">
              {selectable.length === 0 && (
                <p className="px-1 py-2 text-xs text-muted-foreground">Žádné otevřené položky k výběru.</p>
              )}
              {selectable.map((i) => {
                const tpl = templateById(i.templateId);
                return (
                  <label key={i.id} className="flex items-center gap-2 rounded px-1.5 py-1 text-[13px] hover:bg-muted">
                    <input type="checkbox" checked={selected.has(i.id)} onChange={() => toggle(i.id)} />
                    {tpl?.title}
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Zrušit
          </Button>
          <Button onClick={submit} disabled={selected.size === 0}>
            Naplánovat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function defaultDateTimeLocal(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
```

- [ ] **Step 2: KontaktWidget — vedle limitu, ukazuje nejbližší naplánovaný Kontakt nebo CTA na založení nového**

```tsx
// src/components/checklist/KontaktWidget.tsx
import { useState } from "react";
import { Phone } from "lucide-react";
import { useKontakty } from "@/lib/checklist/store";
import { nextPlannedKontakt, formatKontaktDateTime } from "@/lib/checklist/derived";
import { templateById } from "@/lib/checklist/store";
import { useChecklistItems } from "@/lib/checklist/store";
import { KontaktSchedulerDialog } from "./KontaktSchedulerDialog";

export function KontaktWidget() {
  const kontakty = useKontakty();
  const items = useChecklistItems();
  const [scheduling, setScheduling] = useState(false);
  const next = nextPlannedKontakt(kontakty);

  if (!next) {
    return (
      <>
        <button
          onClick={() => setScheduling(true)}
          className="flex flex-1 min-w-[220px] items-center gap-3 rounded-lg border border-dashed border-input bg-card px-4 py-3 text-left hover:bg-muted"
        >
          <Phone className="size-5 shrink-0 text-muted-foreground" />
          <div>
            <div className="text-[13px] font-semibold">Naplánovat kontakt</div>
            <div className="text-[11px] text-muted-foreground">žádný zatím naplánovaný</div>
          </div>
        </button>
        {scheduling && <KontaktSchedulerDialog preselectedItemIds={[]} onClose={() => setScheduling(false)} />}
      </>
    );
  }

  const linkedTitles = next.linkedItemIds
    .map((id) => items.find((i) => i.id === id))
    .filter((i): i is NonNullable<typeof i> => !!i)
    .map((i) => templateById(i.templateId)?.title)
    .filter(Boolean);

  return (
    <div className="flex flex-1 min-w-[220px] items-center gap-3 rounded-lg border border-info bg-info/10 px-4 py-3">
      <Phone className="size-5 shrink-0 text-info-foreground" />
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold text-info-foreground">
          Kontakt naplánován — {formatKontaktDateTime(next.scheduledAt)}
        </div>
        <div className="truncate text-[11px] text-muted-foreground">
          {next.type === "customer" ? "Zákazník" : "Přepravce"} · {linkedTitles.length} položky: {linkedTitles.join(", ")}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Ověř kompletní typovou kontrolu**

Run: `npx tsc --noEmit 2>&1 | grep checklist`
Expected: žádný výstup

- [ ] **Step 4: Commit**

```bash
git add src/components/checklist/KontaktSchedulerDialog.tsx src/components/checklist/KontaktWidget.tsx
git commit -m "feat(checklist): add kontakt scheduler dialog and widget"
```

---

### Task 10: End-to-end ruční ověření v prohlížeči

**Files:** žádné nové — jen ověření hotového prototypu.

- [ ] **Step 1: Spusť dev server**

Run: `npm run dev`
Otevři vypsanou URL, naviguj na `/checklist` (nebo klikni na "Checklist objednávky" v horním menu).

- [ ] **Step 2: Ověř výchozí stav**

Expected v prohlížeči:
- Status pill nahoře ukazuje "⏱ Čeká na kontakt" (protože seed má naplánovaný Kontakt "zítra").
- Progress "1 / 8".
- Krok 1 sbalený, needitovatelný.
- Kategorie "Obsah": 1 položka vyřešená s nálezem (powerbanka), 2 otevřené.
- Kategorie "Hodnota": 2 položky "čeká na kontakt" s odkazem na stejný Kontakt, 1 otevřená.
- Kategorie "Dokumentace": 2 položky "čeká na dodání" — jedna má VkŘ (bez tlačítka), druhá má tlačítko
  "+ Vytvořit věc k řešení pro sledování".
- Widget Kontaktu nahoře ukazuje "Kontakt naplánován" se dvěma položkami.

- [ ] **Step 3: Ověř tok "vyřešit otevřenou položku, jistý problém"**

V kategorii Obsah klikni na "Vyhodnotit" u "Vyhodnocení obsahu z pohledu DG" → "⚠ Nahlásit nález" → vyplň nález,
zvol řešení, NEZAŠKRTÁVEJ "jde jen o podezření" → "Uzavřít nález".
Expected: položka se změní na zelenou fajfku, tag "vyřešeno · s nálezem", text nálezu/řešení se objeví pod
popisem, a nová položka se objeví v panelu "Shrnutí nálezů" vlevo. Progress se zvýší.

- [ ] **Step 4: Ověř tok "podezření → naplánovat kontakt"**

U "Ověření, že se jedná o dokumenty" klikni "Vyhodnotit" → "Nahlásit nález" → vyplň nález → zaškrtni "jde jen
o podezření" → klikni "Naplánovat kontakt". V dialogu zvol termín, potvrď.
Expected: položka přejde na stav "čeká na kontakt", widget Kontaktu (pokud jsi vytvořila nový, ne přidala do
existujícího) ukáže nejbližší podle termínu, položka v seznamu ukazuje odkaz na Kontakt.

- [ ] **Step 5: Ověř tok "kontakt proběhl → dořešení"**

Rozbal widget Kontaktu / u položky "čeká na kontakt" klikni "označit jako proběhlý".
Expected: obě navázané položky nabídnou tlačítko "Vyhodnotit po kontaktu" místo prostého čekání. Klikni na
něj u jedné položky, zvol "✓ V pořádku".
Expected: položka přejde na "vyřešeno", zbývající navázaná položka pořád čeká na vyhodnocení.

- [ ] **Step 6: Ověř tok "vytvořit VkŘ pro sledování" a její postupné odbavení**

U "Kontrola EORI vývozce" (stav čeká na dodání, bez VkŘ) klikni "+ Vytvořit věc k řešení pro sledování".
Expected: tlačítko zmizí, v panelu "Věci k řešení na checklistu" vlevo přibude nový řádek s termínem za 2 dny
a tlačítkem "✓ Vyřešit". Klikni na "✓ Vyřešit".
Expected: řádek VkŘ zešedne (vyřešeno), počet "otevřené" se snižuje o 1 a "vyřešené" se zvyšuje o 1; položka
"Kontrola EORI vývozce" v checklistu se sama změní na "vyřešeno · s nálezem" a objeví se v panelu "Shrnutí
nálezů" — to je ta smyčka "sledování dokončeno → checklist se uzavře", kterou jsme navrhovali ve stavovém
diagramu.

- [ ] **Step 7: Ověř reset**

Klikni "Reset prototypu" v horní liště.
Expected: všechno se vrátí do výchozího seed stavu ze Step 2 (i po refreshi stránky — ověř `localStorage` v
DevTools, klíče `checklist_items_v1`, `checklist_kontakty_v1`, `checklist_vkrs_v1` by měly zmizet/vrátit se na seed).

- [ ] **Step 8: Ověř, že hlavní app zůstala nedotčená**

Naviguj na `/`, `/soulad-s-trasou`, `/situace` — musí fungovat úplně stejně jako před touhle prací.

- [ ] **Step 9: Finální commit**

```bash
git add -A
git status
git commit -m "feat(checklist): interactive prototype complete" --allow-empty
```

(`--allow-empty` jen pro případ, že poslední ověřovací krok nic nezměnil — pokud `git status` ukazuje
nezacommitované změny z předchozích tasků, commitni je normálně bez `--allow-empty`.)

---

## Mimo rozsah tohoto plánu (mock / needitovatelné)

Přesně podle domluvy s uživatelkou:

- Krok 1 (Task 5) — statický náhled, žádná logika.
- Odpočet na zpracování — natvrdo "2:40", žádný pracovně-denní výpočet.
- Podmínka viditelnosti kategorie (EU/mimo EU) — v tomto prototypu se neřeší vůbec, žádná kategorie se
  nefiltruje. Pokud bude potřeba demonstrovat, patří to do samostatného navazujícího plánu.
- Zákaznická výjimka ("už nekontrolovat") — není v tomto plánu.
- Celkové zhodnocení + přechod objednávky do stavu Zpracování — není v tomto plánu.
- Dashboard / seznam více objednávek — jedna hardcoded objednávka, žádný přehled.
- Domluva s přepravcem jako odlišné chování — pole `type: "carrier"` v Kontaktu existuje, ale nemá jiné
  chování než `"customer"` (otevřená otázka z analýzy, ne rozhodnutí).
