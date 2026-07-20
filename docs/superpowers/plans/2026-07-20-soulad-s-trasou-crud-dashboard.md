# Soulad s trasou — CRUD dashboard, editor trasy, drobné opravy — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for
> tracking.

**Goal:** Vrátit do stránky „Soulad s trasou" funkčnost z `main` (dvousloupcový dashboard Trasy/Úseky,
editor trasy, mazání s ochranou, znovupoužití úseků napříč trasami), rozšířenou o novou úroveň — body
uvnitř úseku — a bez oživování katalogu typů milníků, plus dvě drobné opravy současné verze.

**Architecture:** Čistě frontend prototyp (Vite + TanStack Router + React 19, in-memory store s
localStorage persistencí — beze změny existujícího vzoru). Nic v `BodDetailPanel`, `KontrolyPanel`
(kromě §… přejmenování), `TerminEditor`, `TimeLimitEditor`, `MatchEditor`, `AnchorPicker`, `SituaceCard`,
`DnesniDoruceniEditablePanel`, `SegmentMetaEditor` se neupravuje — tenhle plán jen doplňuje dashboard,
editor trasy a mazání okolo nich.

**Tech Stack:** TypeScript, React 19, TanStack Router (file-based routing, `routeTree.gen.ts` generovaný
Vite pluginem), Tailwind CSS v4, lucide-react, sonner (toast). Žádný test runner v projektu — verifikace
přes `npm run build`, `npm run lint` a manuální průchod v `npm run dev`.

**Zdrojový dokument:** `docs/superpowers/specs/2026-07-20-soulad-s-trasou-crud-dashboard-design.md` (v
hlavním repu, ne v tomhle worktree — specs se commitují do `main`, plány zůstávají ve worktree).

---

## Důležitý kontext pro inženýra

- Pracuješ ve worktree `.claude/worktrees/situace-zavaznost-akce` (branch `worktree-situace-zavaznost-akce`).
  Všechny cesty v tomhle plánu jsou relativní k tomuhle worktree, ne k hlavnímu repu.
- **TanStack Router je typovaný.** `Link to="/soulad-s-trasou/trasa/$id"` se typově zkontroluje proti
  vygenerovanému `src/routeTree.gen.ts` — pokud route ještě neexistuje, `npm run build` selže na typové
  chybě. Proto se route soubor `soulad-s-trasou_.trasa.$id.tsx` zakládá **hned v Tasku 3** (s dočasným
  minimálním obsahem), než na něj začnou odkazovat komponenty v pozdějších taskách. Pokud build hlásí
  chybu o neexistující routě, spusť na pár vteřin `npm run dev` (vygeneruje `routeTree.gen.ts`) a zkus
  build znovu.
- **Soubor `soulad-s-trasou_.usek.$id.tsx`** (s podtržítkem před `.usek`) je správný název — TanStack
  Router `_` escape notace, aby stránka úseku neděla layout z `soulad-s-trasou.tsx`. Skutečná URL cesta je
  `/soulad-s-trasou/usek/$id` (bez podtržítka) — to je hodnota, kterou používáš v `to=`/`params=` na
  `Link`/`navigate`.
- **Žádné potvrzovací dialogy** u mazání trasy/úseku/bodu — jedna akce, jeden klik, stejná konvence jako
  `main` (`routesStore.remove`/`segmentsStore.remove` přímo v `onClick`).
- **`isSegmentUsed`** (ochrana proti smazání použitého úseku) už existuje v `src/lib/model/store.ts` — jen
  se na ni napojují nová tlačítka mazání, nepíše se znovu.

---

## Task 1: Oprava Mermaid diagramů v zadání pro programátory

**Files:**
- Modify: `package.json`, `package-lock.json` (přes `npm install`)
- Create: `public/vendor/mermaid.min.js` (zkopírováno z `node_modules`)
- Modify: `public/zadani-pro-programatory.html`

- [ ] **Step 1: Nainstalovat mermaid jako závislost**

```bash
npm install mermaid
```

- [ ] **Step 2: Zjistit přesný název UMD/min bundlu a zkopírovat ho jako statické vendor aktivum**

```bash
ls node_modules/mermaid/dist/mermaid*.js
mkdir -p public/vendor
cp node_modules/mermaid/dist/mermaid.min.js public/vendor/mermaid.min.js
```

Pokud `ls` ukáže jiný název souboru (např. bez `.min`), použij ten a uprav i `<script src>` v dalším kroku
podle skutečného názvu.

- [ ] **Step 3: Načíst Mermaid a inicializovat ho na konci `public/zadani-pro-programatory.html`**

Soubor je bezhlavičkový HTML fragment (bez `<!DOCTYPE>`/`<html>`/`<body>`), takže script stačí připojit na
úplný konec souboru, za poslední `</footer>`:

Najdi konec souboru:
```html
  <footer>
    Needimplementováno. Tento dokument je zadání k implementaci, ne popis hotového stavu.
  </footer>

</div>
```

Přidej za `</div>`:
```html

<script src="/vendor/mermaid.min.js"></script>
<script>
  mermaid.initialize({ startOnLoad: true, theme: "neutral" });
</script>
```

- [ ] **Step 4: Ověřit vizuálně**

Run: `npm run dev`, otevři `http://localhost:5173/zadani-pro-programatory.html` (nebo port, který dev
server vypíše). Potvrď: oba flowcharty (u „Běžný bod" a u „Dnešní doručení") se vykreslí jako diagramy, ne
jako syrový text `flowchart TD ...`.

- [ ] **Step 5: Ověřit, že produkční build zahrne vendor soubor**

```bash
npm run build
ls dist/vendor/mermaid.min.js
```

Expected: SUCCESS, soubor existuje (Vite kopíruje `public/` do kořene výstupu beze změny).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json public/vendor/mermaid.min.js public/zadani-pro-programatory.html
git commit -m "fix(soulad): opravit nevykreslující se Mermaid diagramy v zadání pro programátory"
```

---

## Task 2: Sdílená eligibilita úseků pro trasu

**Files:**
- Create: `src/lib/model/routeEligibility.ts`

- [ ] **Step 1: Napsat `eligibleSegments`**

```ts
// src/lib/model/routeEligibility.ts
import type { Route, Segment } from "./types";

/**
 * Úseky, které lze přidat na trasu: aspoň jeden společný dopravce A aspoň jeden společný
 * typ služby, a ještě nejsou na trase připojené. Bez kontroly na duplicitní typ milníku —
 * checkpointType je dnes vestigiální (natvrdo "ct_first_scan" u nových bodů), viz
 * docs/superpowers/specs/2026-07-20-soulad-s-trasou-crud-dashboard-design.md §1.
 */
export function eligibleSegments(
  route: Pick<Route, "carriers" | "serviceTypes" | "segmentIds">,
  segments: Segment[],
): Segment[] {
  const sigOk = (s: Segment) =>
    s.carriers.some((c) => route.carriers.includes(c)) &&
    s.serviceTypes.some((t) => route.serviceTypes.includes(t));
  return segments.filter((s) => sigOk(s) && !route.segmentIds.includes(s.id));
}
```

- [ ] **Step 2: Ověřit build**

Run: `npm run build`
Expected: SUCCESS (nový needpojený modul, nic ho zatím nepoužívá).

- [ ] **Step 3: Commit**

```bash
git add src/lib/model/routeEligibility.ts
git commit -m "feat(soulad): eligibleSegments — shoda úseku s podpisem trasy"
```

---

## Task 3: Routy — placeholder editoru trasy + `validateSearch` na stránce úseku

Obě routovací změny patří do jednoho tasku, protože na ně komponenty z pozdějších tasků (Task 6
`SegmentRow`, Task 7 `RouteRow`) budou hned odkazovat — `search={{ from: ... }}` na `Link` míří na
`/soulad-s-trasou/usek/$id`, což vyžaduje, aby ta route měla `validateSearch` už teď, jinak TypeScript
odmítne neznámou `search` property při buildu v Tasku 6.

**Files:**
- Create: `src/routes/soulad-s-trasou_.trasa.$id.tsx`
- Create: `src/components/soulad/RouteEditorPage.tsx` (dočasný placeholder — plná verze v Tasku 9)
- Modify: `src/routes/soulad-s-trasou_.usek.$id.tsx`

- [ ] **Step 1: Vytvořit dočasný placeholder `RouteEditorPage`**

```tsx
// src/components/soulad/RouteEditorPage.tsx
export function RouteEditorPage({ routeId }: { routeId: string }) {
  return <div>TODO: editor trasy {routeId}</div>;
}
```

- [ ] **Step 2: Vytvořit route soubor pro editor trasy**

```tsx
// src/routes/soulad-s-trasou_.trasa.$id.tsx
import { createFileRoute } from "@tanstack/react-router";
import { RouteEditorPage } from "@/components/soulad/RouteEditorPage";

export const Route = createFileRoute("/soulad-s-trasou_/trasa/$id")({
  head: () => ({ meta: [{ title: "Úprava trasy — Soulad s trasou — Bytorp" }] }),
  component: TrasaEditorRoute,
});

function TrasaEditorRoute() {
  const { id } = Route.useParams();
  return <RouteEditorPage routeId={id} />;
}
```

- [ ] **Step 3: Doplnit `validateSearch` do route souboru stránky úseku**

Samotná stránka (`SouladSTrasouUsekPage`) zatím `fromRouteId` neumí použít — to přijde až v Tasku 10.
Tady jde jen o to, aby `search.from` prošel typovou kontrolou už teď.

Najdi `src/routes/soulad-s-trasou_.usek.$id.tsx`:
```tsx
import { createFileRoute } from "@tanstack/react-router";
import { SouladSTrasouUsekPage } from "@/components/soulad/SouladSTrasouUsekPage";

export const Route = createFileRoute("/soulad-s-trasou_/usek/$id")({
  head: () => ({ meta: [{ title: "Úsek — Soulad s trasou — Bytorp" }] }),
  component: UsekRoute,
});

function UsekRoute() {
  const { id } = Route.useParams();
  return <SouladSTrasouUsekPage segmentId={id} />;
}
```

Nahraď celý obsah:
```tsx
import { createFileRoute } from "@tanstack/react-router";
import { SouladSTrasouUsekPage } from "@/components/soulad/SouladSTrasouUsekPage";

export const Route = createFileRoute("/soulad-s-trasou_/usek/$id")({
  head: () => ({ meta: [{ title: "Úsek — Soulad s trasou — Bytorp" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    from: (search.from as string | undefined) ?? undefined,
  }),
  component: UsekRoute,
});

function UsekRoute() {
  const { id } = Route.useParams();
  return <SouladSTrasouUsekPage segmentId={id} />;
}
```

`SouladSTrasouUsekPage` zatím nepřijímá `fromRouteId` prop (přidá se v Tasku 10) — `Route.useSearch()` se
sem zapojí taky až tam. Tenhle krok jen zpřístupní `search.from` typovému systému pro `Link`y z dalších
tasků.

- [ ] **Step 4: Vygenerovat routeTree a ověřit build**

```bash
npm run dev &
sleep 3
kill %1
npm run build
```

Expected: SUCCESS, `src/routeTree.gen.ts` teď obsahuje `/soulad-s-trasou/trasa/$id` a `search` schema pro
`/soulad-s-trasou/usek/$id`.

- [ ] **Step 5: Manuálně ověřit**

Run: `npm run dev`, otevři `/soulad-s-trasou/trasa/route_1` (libovolné ID) v prohlížeči — potvrď, že se
zobrazí „TODO: editor trasy route_1" bez pádu aplikace. Otevři i existující úsek (`/soulad-s-trasou/usek/...`)
— chování je beze změny (fromRouteId se zatím nikde nepoužívá).

- [ ] **Step 6: Commit**

```bash
git add src/routes/soulad-s-trasou_.trasa.\$id.tsx src/components/soulad/RouteEditorPage.tsx src/routes/soulad-s-trasou_.usek.\$id.tsx src/routeTree.gen.ts
git commit -m "feat(soulad): route /soulad-s-trasou/trasa/\$id (placeholder) + search.from na stránce úseku"
```

---

## Task 4: `AddExistingSegmentPicker` — sdílený picker eligible úseků

**Files:**
- Create: `src/components/soulad/AddExistingSegmentPicker.tsx`

- [ ] **Step 1: Napsat komponentu**

```tsx
// src/components/soulad/AddExistingSegmentPicker.tsx
import { useState } from "react";
import { Plus } from "lucide-react";
import { eligibleSegments } from "@/lib/model/routeEligibility";
import type { Route, Segment } from "@/lib/model/types";

export function AddExistingSegmentPicker({
  route,
  segments,
  onAdd,
}: {
  route: Pick<Route, "carriers" | "serviceTypes" | "segmentIds">;
  segments: Segment[];
  onAdd: (segmentId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const eligible = eligibleSegments(route, segments);

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-1.5 text-xs text-primary hover:bg-primary-soft/20 transition-colors"
      >
        <Plus className="size-3.5" /> přidat existující úsek
      </button>
      {open && (
        <div className="mt-1.5 rounded-md border border-border bg-muted/20 p-1.5 space-y-0.5 max-w-sm">
          {eligible.length === 0 ? (
            <div className="px-2 py-1.5 text-xs text-muted-foreground italic">
              Žádné vhodné úseky (podle dopravce a typu služby trasy).
            </div>
          ) : (
            eligible.map((segment) => (
              <button
                key={segment.id}
                onClick={() => {
                  onAdd(segment.id);
                  setOpen(false);
                }}
                className="w-full flex items-center justify-between rounded px-2 py-1.5 text-xs text-left hover:bg-muted transition-colors"
              >
                <span className="font-medium">{segment.name}</span>
                <span className="text-muted-foreground">{segment.carriers.join(", ")}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Ověřit build**

Run: `npm run build`
Expected: SUCCESS.

- [ ] **Step 3: Commit**

```bash
git add src/components/soulad/AddExistingSegmentPicker.tsx
git commit -m "feat(soulad): AddExistingSegmentPicker — sdílený výběr existujícího úseku pro trasu"
```

---

## Task 5: `BodRow` — needitovatelný řádek bodu ve vnořeném seznamu

**Files:**
- Create: `src/components/soulad/BodRow.tsx`

- [ ] **Step 1: Napsat komponentu**

```tsx
// src/components/soulad/BodRow.tsx
import type { Checkpoint } from "@/lib/model/types";

export function BodRow({ checkpoint }: { checkpoint: Checkpoint }) {
  return (
    <div className="flex items-center justify-between py-1 pl-[26px] pr-2 text-xs text-muted-foreground">
      <span className="truncate">{checkpoint.note ?? checkpoint.checkpointTypeId}</span>
      <span className="shrink-0 text-[10px] ml-2">
        {checkpoint.kind === "dnesni_doruceni" ? "Dnešní doručení" : "Běžný bod"}
      </span>
    </div>
  );
}
```

- [ ] **Step 2: Ověřit build**

Run: `npm run build`
Expected: SUCCESS.

- [ ] **Step 3: Commit**

```bash
git add src/components/soulad/BodRow.tsx
git commit -m "feat(soulad): BodRow — needitovatelný řádek bodu ve vnořeném seznamu"
```

---

## Task 6: `SegmentRow` — řádek úseku s rozbalením na body, navigací a mazáním

**Files:**
- Create: `src/components/soulad/SegmentRow.tsx`

- [ ] **Step 1: Napsat komponentu**

```tsx
// src/components/soulad/SegmentRow.tsx
import { useState } from "react";
import { ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { isSegmentUsed, segmentsStore } from "@/lib/model/store";
import { cn } from "@/lib/utils";
import type { Segment } from "@/lib/model/types";
import { BodRow } from "./BodRow";

export function SegmentRow({
  segment,
  fromRouteId,
  highlighted,
}: {
  segment: Segment;
  fromRouteId?: string;
  highlighted?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const { used, count } = isSegmentUsed(segment.id);

  return (
    <div className={cn("border-t border-border first:border-t-0", highlighted && "bg-primary-soft/10")}>
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 text-muted-foreground hover:text-foreground"
          aria-label={expanded ? "Sbalit body" : "Rozbalit body"}
        >
          {expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
        </button>
        <Link
          to="/soulad-s-trasou/usek/$id"
          params={{ id: segment.id }}
          search={fromRouteId ? { from: fromRouteId } : undefined}
          className="flex-1 min-w-0 text-sm font-medium underline decoration-dotted underline-offset-2 hover:text-primary truncate"
        >
          {segment.name}
        </Link>
        <span className="shrink-0 text-xs text-muted-foreground">{segment.checkpoints.length} bodů</span>
        <button
          disabled={used}
          onClick={() => segmentsStore.remove(segment.id)}
          title={used ? `Používá se v ${count} ${count === 1 ? "trase" : "trasách"}` : "Smazat úsek"}
          className={cn(
            "shrink-0 rounded p-1 transition-colors",
            used ? "text-muted-foreground/30 cursor-not-allowed" : "text-muted-foreground hover:text-red-500",
          )}
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
      {expanded && (
        <div className="pb-2">
          {segment.checkpoints.length === 0 ? (
            <div className="pl-[26px] pr-2 text-xs text-muted-foreground italic">Zatím žádné body.</div>
          ) : (
            segment.checkpoints.map((cp) => <BodRow key={cp.id} checkpoint={cp} />)
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Ověřit build**

Run: `npm run build`
Expected: SUCCESS (`to="/soulad-s-trasou/usek/$id"` už existuje jako route od začátku).

- [ ] **Step 3: Commit**

```bash
git add src/components/soulad/SegmentRow.tsx
git commit -m "feat(soulad): SegmentRow — řádek úseku s vnořenými body, navigací a mazáním"
```

---

## Task 7: `RouteRow` — řádek trasy s vnořenými úseky, přidáním a mazáním

**Files:**
- Create: `src/components/soulad/RouteRow.tsx`

- [ ] **Step 1: Napsat komponentu**

```tsx
// src/components/soulad/RouteRow.tsx
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { routesStore, segmentsStore } from "@/lib/model/store";
import { cn } from "@/lib/utils";
import type { Route, Segment } from "@/lib/model/types";
import { SegmentRow } from "./SegmentRow";
import { AddExistingSegmentPicker } from "./AddExistingSegmentPicker";

function createBlankSegment(): Segment {
  const id = "seg_" + Date.now();
  return { id, name: "Nový úsek", carriers: [], serviceTypes: [], checkpoints: [] };
}

export function RouteRow({
  route,
  segments,
  expanded,
  onToggle,
}: {
  route: Route;
  segments: Segment[];
  expanded: boolean;
  onToggle: () => void;
}) {
  const segMap = new Map(segments.map((s) => [s.id, s]));

  function addExistingSegment(segmentId: string) {
    routesStore.upsert({ ...route, segmentIds: [...route.segmentIds, segmentId] });
  }

  function createAndAttachSegment() {
    const segment = createBlankSegment();
    segmentsStore.upsert(segment);
    routesStore.upsert({ ...route, segmentIds: [...route.segmentIds, segment.id] });
  }

  return (
    <div className="border-b border-border last:border-b-0">
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={onToggle}
          className="shrink-0 text-muted-foreground hover:text-foreground"
          aria-label={expanded ? "Sbalit trasu" : "Rozbalit trasu"}
        >
          {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link
              to="/soulad-s-trasou/trasa/$id"
              params={{ id: route.id }}
              className="text-sm font-medium underline decoration-dotted underline-offset-2 hover:text-primary truncate"
            >
              {route.name}
            </Link>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                route.active ? "bg-success/20 text-success-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              {route.active ? "aktivní" : "neaktivní"}
            </span>
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {route.code} · {route.carriers.join(", ") || "bez dopravce"} ·{" "}
            {route.destCountries.join(", ") || "bez cílové země"}
          </div>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">{route.segmentIds.length} úseků</span>
      </div>

      {expanded && (
        <div className="bg-primary-soft/10 border-t border-primary/10 px-4 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Dopravce</div>
              <div className="font-medium">{route.carriers.join(", ") || "—"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Typ služby</div>
              <div className="font-medium">{route.serviceTypes.join(", ") || "—"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Cílové země</div>
              <div className="font-medium">{route.destCountries.join(", ") || "—"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Pokrytí</div>
              <div className="font-medium">
                {route.carriers.length * route.serviceTypes.length * route.destCountries.length} kombinací
              </div>
            </div>
          </div>

          {route.segmentIds.length > 0 && (
            <div className="rounded-lg border border-border bg-background overflow-hidden">
              {route.segmentIds.map((segId) => {
                const seg = segMap.get(segId);
                return seg ? <SegmentRow key={segId} segment={seg} fromRouteId={route.id} /> : null;
              })}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <AddExistingSegmentPicker route={route} segments={segments} onAdd={addExistingSegment} />
            <button
              onClick={createAndAttachSegment}
              className="flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-1.5 text-xs text-primary hover:bg-primary-soft/20 transition-colors"
            >
              <Plus className="size-3.5" /> vytvořit nový úsek
            </button>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Link
              to="/soulad-s-trasou/trasa/$id"
              params={{ id: route.id }}
              className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Upravit trasu
            </Link>
            <button
              onClick={() => routesStore.remove(route.id)}
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-red-300 hover:text-red-500 transition-colors"
            >
              <Trash2 className="size-3.5" /> Smazat trasu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

Poznámka: „vytvořit nový úsek" tady **nenaviguje pryč** — vytvoří a připojí úsek, uživatel zůstává na
dashboardu (liší se od stejné akce v editoru trasy, Task 9, kde navigace pryč dává smysl).

- [ ] **Step 2: Ověřit build**

Run: `npm run build`
Expected: SUCCESS.

- [ ] **Step 3: Commit**

```bash
git add src/components/soulad/RouteRow.tsx
git commit -m "feat(soulad): RouteRow — řádek trasy s vnořenými úseky, přidáním a mazáním"
```

---

## Task 8: Dashboard `/soulad-s-trasou` — dvousloupcový layout

**Files:**
- Modify: `src/components/soulad/SouladSTrasouListPage.tsx` (kompletní přepis)

- [ ] **Step 1: Přepsat stránku**

```tsx
// src/components/soulad/SouladSTrasouListPage.tsx
import { useState } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { DataMenu } from "@/components/common/DataMenu";
import { useRoutes, useSegments, routesStore, segmentsStore } from "@/lib/model/store";
import type { Route, Segment } from "@/lib/model/types";
import { RouteRow } from "./RouteRow";
import { SegmentRow } from "./SegmentRow";

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
  const [expandedRouteId, setExpandedRouteId] = useState<string | null>(null);

  const expandedRoute = expandedRouteId ? routes.find((r) => r.id === expandedRouteId) ?? null : null;
  const routeSegmentIds = expandedRoute ? new Set(expandedRoute.segmentIds) : null;
  const highlightedSegments = routeSegmentIds ? segments.filter((s) => routeSegmentIds.has(s.id)) : [];
  const otherSegments = routeSegmentIds ? segments.filter((s) => !routeSegmentIds.has(s.id)) : segments;

  function addRoute() {
    const route = createBlankRoute();
    routesStore.upsert(route);
    navigate({ to: "/soulad-s-trasou/trasa/$id", params: { id: route.id } });
  }

  function addSegment() {
    const segment = createBlankSegment();
    segmentsStore.upsert(segment);
    navigate({ to: "/soulad-s-trasou/usek/$id", params: { id: segment.id } });
  }

  return (
    <div className="flex h-screen w-screen flex-col bg-background text-foreground">
      <AppHeader current="soulad" extras={<DataMenu />} />
      <div className="flex flex-1 min-h-0 gap-0">
        {/* LEFT — Trasy */}
        <div className="flex flex-col min-h-0 w-1/2 border-r border-border">
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold">Trasy</h2>
            <button
              onClick={addRoute}
              className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="size-3.5" /> Nová trasa
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {routes.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground italic">Zatím žádné trasy.</div>
            ) : (
              routes.map((route) => (
                <RouteRow
                  key={route.id}
                  route={route}
                  segments={segments}
                  expanded={expandedRouteId === route.id}
                  onToggle={() => setExpandedRouteId(expandedRouteId === route.id ? null : route.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* RIGHT — Úseky */}
        <div className="flex flex-col min-h-0 w-1/2">
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold">Úseky</h2>
            <button
              onClick={addSegment}
              className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="size-3.5" /> Nový úsek
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {segments.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground italic">Zatím žádné úseky.</div>
            ) : (
              <>
                {highlightedSegments.map((seg) => (
                  <SegmentRow key={seg.id} segment={seg} fromRouteId={expandedRoute?.id} highlighted />
                ))}
                {expandedRoute && highlightedSegments.length > 0 && otherSegments.length > 0 && (
                  <div className="mx-4 my-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="flex-1 h-px bg-border" />
                    <span>ostatní úseky</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                )}
                {otherSegments.map((seg) => (
                  <SegmentRow key={seg.id} segment={seg} />
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Ověřit build**

Run: `npm run build`
Expected: SUCCESS.

- [ ] **Step 3: Manuální průchod**

Run: `npm run dev`, otevři `/soulad-s-trasou`. Potvrď:
- Vlevo seznam tras, vpravo seznam úseků.
- Klik na šipku u trasy rozbalí detail (coverage grid + vnořené úseky); klik na název trasy naviguje na
  `/soulad-s-trasou/trasa/$id` (zatím TODO placeholder).
- V rozbaleném úseku uvnitř trasy funguje vlastní šipka na body.
- „+ přidat existující úsek" nabídne jen úseky se shodným dopravcem/typem služby; po výběru se úsek objeví
  ve vnořeném seznamu, **bez opuštění stránky**.
- „+ vytvořit nový úsek" v rozbalené trase vytvoří a připojí úsek, **zůstane na dashboardu**.
- Vpravo se po rozbalení trasy úseky té trasy zvýrazní nahoře nad oddělovačem „ostatní úseky".
- „+ Nový úsek" vpravo nahoře vytvoří nepřipojený úsek a **naviguje** na jeho stránku.
- „Smazat trasu" vždy funguje; „Smazat úsek" je disabled s tooltipem, když je úsek použit na trase.

- [ ] **Step 4: Commit**

```bash
git add src/components/soulad/SouladSTrasouListPage.tsx
git commit -m "feat(soulad): dvousloupcový dashboard Trasy/Úseky s vnořenými body"
```

---

## Task 9: Plná `RouteEditorPage` — editor trasy (3 sloupce)

**Files:**
- Modify: `src/components/soulad/RouteEditorPage.tsx` (nahradit placeholder z Tasku 3)

- [ ] **Step 1: Napsat plnou komponentu**

```tsx
// src/components/soulad/RouteEditorPage.tsx
import { useState } from "react";
import { ChevronRight, ChevronUp, ChevronDown, X } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { useRoutes, useSegments, routesStore, segmentsStore } from "@/lib/model/store";
import { cn } from "@/lib/utils";
import type { Route, Segment } from "@/lib/model/types";
import { TRANSPORT_VARIANTS } from "@/lib/routes/types";
import { COUNTRY_OPTIONS } from "@/lib/routes/countries";
import { AddExistingSegmentPicker } from "./AddExistingSegmentPicker";

const CARRIER_OPTIONS = ["FedEx", "UPS", "DHL", "PPL", "GLS"];

function createBlankSegment(): Segment {
  const id = "seg_" + Date.now();
  return { id, name: "Nový úsek", carriers: [], serviceTypes: [], checkpoints: [] };
}

export function RouteEditorPage({ routeId }: { routeId: string }) {
  const routes = useRoutes();
  const segments = useSegments();
  const navigate = useNavigate();
  const route = routes.find((r) => r.id === routeId) ?? null;
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(
    route?.segmentIds[0] ?? null,
  );

  if (!route) {
    return (
      <div className="flex h-screen w-screen flex-col bg-background text-foreground">
        <AppHeader current="soulad" />
        <div className="p-8 text-sm text-muted-foreground">Trasa nenalezena.</div>
      </div>
    );
  }

  const segMap = new Map(segments.map((s) => [s.id, s]));
  const selectedSegment = selectedSegmentId ? segMap.get(selectedSegmentId) ?? null : null;

  function update(patch: Partial<Route>) {
    routesStore.upsert({ ...route, ...patch });
  }

  function toggleMulti(arr: string[], val: string): string[] {
    return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
  }

  function addExistingSegment(segmentId: string) {
    update({ segmentIds: [...route.segmentIds, segmentId] });
  }

  function createAndOpenNewSegment() {
    const segment = createBlankSegment();
    segmentsStore.upsert(segment);
    update({ segmentIds: [...route.segmentIds, segment.id] });
    navigate({ to: "/soulad-s-trasou/usek/$id", params: { id: segment.id }, search: { from: routeId } });
  }

  return (
    <div className="flex h-screen w-screen flex-col bg-background text-foreground">
      <AppHeader current="soulad" />
      <div className="flex flex-1 min-h-0">
        {/* LEFT — Pokrytí trasy */}
        <div className="flex w-[280px] shrink-0 flex-col border-r border-border">
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Pokrytí trasy
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Název trasy</label>
                <input
                  value={route.name}
                  onChange={(e) => update({ name: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Kód trasy</label>
                <input
                  value={route.code}
                  onChange={(e) => update({ code: e.target.value })}
                  placeholder="R-XX-XXX-XX"
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Dopravce</label>
                <div className="flex flex-wrap gap-1.5">
                  {CARRIER_OPTIONS.map((c) => (
                    <button
                      key={c}
                      onClick={() => update({ carriers: toggleMulti(route.carriers, c) })}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                        route.carriers.includes(c)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:bg-muted",
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Typ služby</label>
                <div className="flex flex-wrap gap-1.5">
                  {TRANSPORT_VARIANTS.map((v) => (
                    <button
                      key={v.value}
                      onClick={() => update({ serviceTypes: toggleMulti(route.serviceTypes, v.value) })}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                        route.serviceTypes.includes(v.value)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:bg-muted",
                      )}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Cílová země</label>
                <div className="flex flex-wrap gap-1.5">
                  {COUNTRY_OPTIONS.map((c) => (
                    <button
                      key={c.value}
                      title={c.label}
                      onClick={() => update({ destCountries: toggleMulti(route.destCountries, c.value) })}
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors",
                        route.destCountries.includes(c.value)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:bg-muted",
                      )}
                    >
                      {c.value}
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                = {route.carriers.length * route.serviceTypes.length * route.destCountries.length} kombinací
                pokryto
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Aktivní</span>
                <button
                  onClick={() => update({ active: !route.active })}
                  className={cn(
                    "relative inline-block h-5 w-9 rounded-full transition-colors",
                    route.active ? "bg-primary" : "bg-muted",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 size-4 rounded-full bg-white transition-all shadow",
                      route.active ? "right-0.5" : "left-0.5",
                    )}
                  />
                </button>
              </div>
            </div>
          </div>
          <div className="border-t border-border p-4 space-y-2">
            <button
              onClick={() => {
                toast.success("Trasa uložena");
                navigate({ to: "/soulad-s-trasou" });
              }}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Uložit trasu
            </button>
            <Link
              to="/soulad-s-trasou"
              className="block w-full rounded-lg border border-border px-4 py-2 text-center text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              ← Zpět na trasy
            </Link>
          </div>
        </div>

        {/* MIDDLE — Úseky trasy */}
        <div className="flex flex-1 min-w-0 flex-col border-r border-border">
          <div className="flex-1 overflow-y-auto p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Úseky trasy
            </div>
            <div className="flex flex-col gap-2 mb-4">
              {route.segmentIds.length === 0 && (
                <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground italic text-center">
                  Trasa zatím neobsahuje žádné úseky.
                </div>
              )}
              {route.segmentIds.map((id, idx) => {
                const seg = segMap.get(id);
                const isSelected = selectedSegmentId === id;
                const moveSegment = (dir: -1 | 1) => {
                  const next = [...route.segmentIds];
                  const j = idx + dir;
                  if (j < 0 || j >= next.length) return;
                  [next[idx], next[j]] = [next[j], next[idx]];
                  update({ segmentIds: next });
                };
                return (
                  <div
                    key={id}
                    onClick={() => setSelectedSegmentId(isSelected ? null : id)}
                    className={cn(
                      "group flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left cursor-pointer transition-colors",
                      isSelected ? "border-primary bg-primary-soft/20" : "border-border hover:bg-muted/40",
                    )}
                  >
                    <span className="tabular-nums text-xs text-muted-foreground shrink-0">{idx + 1}</span>
                    <div className="flex flex-col shrink-0">
                      <button
                        disabled={idx === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          moveSegment(-1);
                        }}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronUp className="size-3.5" />
                      </button>
                      <button
                        disabled={idx === route.segmentIds.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          moveSegment(1);
                        }}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronDown className="size-3.5" />
                      </button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{seg?.name ?? id}</div>
                      <div className="text-xs text-muted-foreground">{seg?.checkpoints.length ?? 0} bodů</div>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        update({ segmentIds: route.segmentIds.filter((x) => x !== id) });
                        if (selectedSegmentId === id) setSelectedSegmentId(null);
                      }}
                      className="shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground transition-opacity"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-border my-4" />
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Přidat úsek
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <AddExistingSegmentPicker route={route} segments={segments} onAdd={addExistingSegment} />
              <button
                onClick={createAndOpenNewSegment}
                className="flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-primary hover:bg-primary-soft/20 transition-colors"
              >
                + vytvořit nový úsek →
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT — Náhled vybraného úseku */}
        <div className="flex w-[380px] shrink-0 flex-col overflow-y-auto">
          <div className="p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              {selectedSegment ? `Náhled úseku: ${selectedSegment.name}` : "Náhled úseku"}
            </div>
            {!selectedSegment && (
              <div className="rounded-md bg-muted/30 border border-border px-3 py-2 text-xs text-muted-foreground">
                Klikni na úsek uprostřed pro náhled jeho bodů.
              </div>
            )}
            {selectedSegment && (
              <div className="space-y-2">
                {selectedSegment.checkpoints.length === 0 && (
                  <div className="text-xs text-muted-foreground italic">Úsek zatím nemá žádné body.</div>
                )}
                {selectedSegment.checkpoints.map((cp, i) => {
                  const matchCount = Object.values(cp.match).filter(
                    (v) => v !== undefined && (Array.isArray(v) ? v.length > 0 : true),
                  ).length;
                  return (
                    <div key={cp.id} className="rounded-lg border border-border bg-background p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="tabular-nums text-xs text-muted-foreground">{i + 1}</span>
                        <span className="text-sm font-medium">{cp.note ?? cp.checkpointTypeId}</span>
                        <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {cp.kind === "dnesni_doruceni" ? "Dnešní doručení" : "Běžný bod"}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">{matchCount} match podmínek</div>
                    </div>
                  );
                })}
                <Link
                  to="/soulad-s-trasou/usek/$id"
                  params={{ id: selectedSegment.id }}
                  search={{ from: routeId }}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors mt-2"
                >
                  Upravit úsek
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Ověřit build**

Run: `npm run build`
Expected: SUCCESS.

- [ ] **Step 3: Manuální průchod**

Run: `npm run dev`, otevři trasu z dashboardu přes „Upravit trasu". Potvrď:
- Vlevo jde měnit název, kód, dopravce/typ služby/cílovou zemi (pilulky), přepínač Aktivní; „= N kombinací
  pokryto" se přepočítává.
- Uprostřed jde měnit pořadí úseků, odebrat úsek z trasy (×), přidat existující (jen eligible) i vytvořit
  nový (naviguje na stránku úseku a zpátky přes „← Zpět na trasu" funguje).
- Vpravo po kliknutí na úsek uprostřed vidíš needitovatelný náhled jeho bodů (jméno + odznak typu + počet
  match podmínek) a „Upravit úsek" vede na plnou stránku úseku.
- „Uložit trasu" ukáže toast a vrátí na dashboard.

- [ ] **Step 4: Commit**

```bash
git add src/components/soulad/RouteEditorPage.tsx
git commit -m "feat(soulad): plný editor trasy — pokrytí, seřazení úseků, náhled bodů"
```

---

## Task 10: Mazání v `SouladSTrasouUsekPage` + `fromRouteId`

**Files:**
- Modify: `src/components/soulad/SouladSTrasouUsekPage.tsx`
- Modify: `src/routes/soulad-s-trasou_.usek.$id.tsx`

- [ ] **Step 1: Napojit `Route.useSearch()` v route souboru (schema tam už je z Tasku 3)**

Najdi v `src/routes/soulad-s-trasou_.usek.$id.tsx`:
```tsx
function UsekRoute() {
  const { id } = Route.useParams();
  return <SouladSTrasouUsekPage segmentId={id} />;
}
```

Nahraď:
```tsx
function UsekRoute() {
  const { id } = Route.useParams();
  const { from } = Route.useSearch();
  return <SouladSTrasouUsekPage segmentId={id} fromRouteId={from} />;
}
```

- [ ] **Step 2: Doplnit mazání úseku, mazání bodu a `fromRouteId` do `SouladSTrasouUsekPage.tsx`**

Nahraď celý obsah `src/components/soulad/SouladSTrasouUsekPage.tsx`:

```tsx
import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { useSegments, segmentsStore, isSegmentUsed } from "@/lib/model/store";
import { cn } from "@/lib/utils";
import type { Checkpoint, Segment } from "@/lib/model/types";
import { defaultVyzvednutiTermin } from "@/lib/model/defaults";
import { BodDetailPanel } from "./BodDetailPanel";
import { KontrolyPanel } from "./KontrolyPanel";
import { SegmentMetaEditor } from "./SegmentMetaEditor";

function createBlankCheckpoint(): Checkpoint {
  return {
    id: "cp_" + Date.now(),
    checkpointTypeId: "ct_first_scan",
    note: "Nový bod",
    kind: "generic",
    match: {},
    correctness: [defaultVyzvednutiTermin("corr_" + Date.now())],
    konecnyLimit: { mode: "offset", offsetHours: 0 },
  };
}

export function SouladSTrasouUsekPage({
  segmentId,
  fromRouteId,
}: {
  segmentId: string;
  fromRouteId?: string;
}) {
  const segments = useSegments();
  const segment = segments.find((s) => s.id === segmentId) ?? null;
  const navigate = useNavigate();
  const [selectedBodId, setSelectedBodId] = useState<string | null>(
    segment?.checkpoints[0]?.id ?? null,
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

  function removeCheckpoint(id: string) {
    const next = segment!.checkpoints.filter((cp) => cp.id !== id);
    updateSegment({ ...segment!, checkpoints: next });
    setSelectedBodId((prev) => (prev === id ? next[0]?.id ?? null : prev));
  }

  function deleteSegment() {
    segmentsStore.remove(segment!.id);
    if (fromRouteId) navigate({ to: "/soulad-s-trasou/trasa/$id", params: { id: fromRouteId } });
    else navigate({ to: "/soulad-s-trasou" });
  }

  const selectedBod = segment.checkpoints.find((cp) => cp.id === selectedBodId) ?? null;
  const { used, count } = isSegmentUsed(segment.id);

  return (
    <div className="flex h-screen w-screen flex-col bg-background text-foreground">
      <AppHeader current="soulad" />
      <div className="border-b border-border bg-surface px-6 py-3 text-sm text-muted-foreground flex items-center justify-between">
        <div>
          <Link to="/soulad-s-trasou" className="hover:text-foreground">Soulad s trasou</Link>
          {fromRouteId && (
            <>
              <span className="mx-1.5">/</span>
              <Link to="/soulad-s-trasou/trasa/$id" params={{ id: fromRouteId }} className="hover:text-foreground">
                trasa
              </Link>
            </>
          )}
          <span className="mx-1.5">/</span>
          <span className="text-foreground font-medium">{segment.name}</span>
        </div>
        <button
          disabled={used}
          onClick={deleteSegment}
          title={used ? `Používá se v ${count} ${count === 1 ? "trase" : "trasách"}` : "Smazat úsek"}
          className={cn(
            "flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors",
            used
              ? "border-border text-muted-foreground/40 cursor-not-allowed"
              : "border-border text-muted-foreground hover:border-red-300 hover:text-red-500",
          )}
        >
          <Trash2 className="size-3.5" />
          {used ? `Nelze smazat — používá se v ${count} ${count === 1 ? "trase" : "trasách"}` : "Smazat úsek"}
        </button>
      </div>
      <div className="flex flex-1 min-h-0">
        <div className="w-[300px] shrink-0 border-r border-border overflow-y-auto p-4">
          <SegmentMetaEditor segment={segment} onUpdate={updateSegment} />

          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Body úseku ({segment.checkpoints.length})
          </div>
          <div className="relative flex flex-col gap-0.5 mb-2">
            <div className="absolute left-[15px] top-3.5 bottom-3.5 w-px bg-border" />
            {segment.checkpoints.map((cp) => {
              const isSelected = cp.id === selectedBodId;
              return (
                <div
                  key={cp.id}
                  className={cn(
                    "group relative flex items-center gap-2.5 rounded-md pl-2.5 pr-1.5 py-2 text-sm",
                    isSelected ? "bg-primary-soft text-primary font-medium" : "hover:bg-muted",
                  )}
                >
                  <button
                    onClick={() => setSelectedBodId(cp.id)}
                    className="flex flex-1 min-w-0 items-center gap-2.5 text-left"
                  >
                    <span
                      className={cn(
                        "z-10 size-2.5 shrink-0 rounded-full",
                        isSelected ? "bg-primary ring-4 ring-primary-soft" : "bg-muted-foreground/40",
                      )}
                    />
                    <span className="flex-1 min-w-0 truncate">{cp.note ?? cp.checkpointTypeId}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {cp.kind === "dnesni_doruceni" ? "Dnešní doručení" : "Běžný bod"}
                    </span>
                  </button>
                  <button
                    onClick={() => removeCheckpoint(cp.id)}
                    title="Smazat bod"
                    className="shrink-0 rounded p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
          <button
            onClick={addCheckpoint}
            className="w-full rounded-md border border-dashed border-border px-2.5 py-2 text-xs text-primary hover:bg-muted"
          >
            + Přidat bod
          </button>
        </div>
        <div className="w-[460px] shrink-0 border-r border-border overflow-y-auto">
          {selectedBod ? (
            <BodDetailPanel segment={segment} checkpoint={selectedBod} onUpdate={updateCheckpoint} />
          ) : (
            <div className="p-8 text-sm text-muted-foreground">Vyberte bod vlevo, nebo přidejte nový.</div>
          )}
        </div>
        <div className="flex-1 min-w-0 overflow-y-auto bg-muted/40 p-6">
          {selectedBod ? (
            <KontrolyPanel checkpoint={selectedBod} />
          ) : (
            <div className="text-sm text-muted-foreground">Vyberte bod vlevo.</div>
          )}
        </div>
      </div>
    </div>
  );
}
```

Změny oproti dřívějšímu obsahu: `fromRouteId` prop, breadcrumb odkaz na trasu když je `fromRouteId`
vyplněné, tlačítko „Smazat úsek" v hlavičce (guard přes `isSegmentUsed`), mazací ikonka u každého bodu
(`removeCheckpoint`), prostřední sloupec rozšířen z `w-[380px]` na `w-[460px]` (§8.1 zadání). Nic uvnitř
`BodDetailPanel`/`KontrolyPanel`/`SegmentMetaEditor` se nemění.

- [ ] **Step 3: Ověřit build**

Run: `npm run build`
Expected: SUCCESS.

- [ ] **Step 4: Manuální průchod**

Run: `npm run dev`. Otevři úsek přímo z dashboardu (bez `from`) — potvrď: breadcrumb je jen „Soulad s
trasou / [název úseku]", „Smazat úsek" po smazání vrátí na `/soulad-s-trasou`. Pak otevři úsek z editoru
trasy (přes „Upravit úsek", `from` vyplněné) — breadcrumb má navíc „/ trasa /", smazání vrátí na
`/soulad-s-trasou/trasa/$id`. Zkus smazat bod ikonkou — zmizí ze seznamu, `BodDetailPanel` se přepne na
další bod nebo na prázdný stav. Zkus smazat úsek, který je použit na trase — tlačítko je disabled
s tooltipem.

- [ ] **Step 5: Commit**

```bash
git add src/components/soulad/SouladSTrasouUsekPage.tsx src/routes/soulad-s-trasou_.usek.\$id.tsx
git commit -m "feat(soulad): mazání úseku a bodu, návaznost na trasu (fromRouteId), širší sloupec"
```

---

## Task 11: `KontrolyPanel` — přejmenování a tlumenější vzhled

**Files:**
- Modify: `src/components/soulad/KontrolyPanel.tsx`

- [ ] **Step 1: Přejmenovat nadpis a přidat odznak „jen náhled"**

Najdi:
```tsx
  return (
    <div className="flex flex-col gap-3.5">
      <div className="text-sm font-semibold">Plán spuštění</div>
```

Nahraď:
```tsx
  return (
    <div className="flex flex-col gap-3.5 opacity-90">
      <div className="flex items-center gap-2">
        <div className="text-sm font-semibold text-muted-foreground">Jak to bude fungovat</div>
        <span className="rounded-full border border-dashed border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          jen náhled
        </span>
      </div>
```

- [ ] **Step 2: Ověřit build**

Run: `npm run build`
Expected: SUCCESS.

- [ ] **Step 3: Manuální ověření vzhledu**

Run: `npm run dev`, otevři libovolný bod na stránce úseku. Potvrď: pravý sloupec má nadpis „Jak to bude
fungovat" s odznakem „jen náhled" a celkově tlumenější/needitovatelný dojem oproti prostřednímu sloupci.

- [ ] **Step 4: Commit**

```bash
git add src/components/soulad/KontrolyPanel.tsx
git commit -m "style(soulad): přejmenovat 'Plán spuštění' na 'Jak to bude fungovat', tlumenější vzhled"
```

---

## Task 12: Finální kontrola

- [ ] **Step 1: Kompletní build**

Run: `npm run build`
Expected: SUCCESS, žádné TypeScript chyby.

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: žádné nové chyby oproti stavu před touto prací (pre-existující chyby v needotčených souborech
jsou mimo rozsah).

- [ ] **Step 3: Manuální průchod celého flow**

Run: `npm run dev`. Projdi:
1. `/soulad-s-trasou` → „+ Nová trasa" → naviguje na editor trasy.
2. V editoru vyplň pokrytí, přidej existující i nový úsek, přesuň jejich pořadí, otevři náhled bodů,
   „Uložit trasu" → vrátí na dashboard.
3. Na dashboardu rozbal trasu → vidíš vnořené úseky i jejich body → „+ přidat existující úsek" i
   „+ vytvořit nový úsek" fungují a zůstávají na dashboardu.
4. Vpravo v seznamu úseků zkus smazat úsek použitý na trase (disabled) a nepoužitý (projde).
5. Otevři úsek, smaž bod, přidej bod, smaž celý úsek (respektuje ochranu), zkontroluj širší prostřední
   sloupec a přejmenovaný/ztlumený pravý sloupec.
6. Otevři `/zadani-pro-programatory.html` — obě mermaid schémata se vykreslí.
7. Obnov stránku (F5) po každém kroku — potvrď, že localStorage persistence funguje beze změny (žádná
   nová verze klíče, žádný reset).

- [ ] **Step 4: Shrnutí pro uživatelku**

V závěrečném shrnutí připomeň: než se tahle větev spojí s `main`, uživatelka dřív zmiňovala založení
git tagu/milestone pro případný rollback (viz `docs/superpowers/plans/2026-07-19-soulad-s-trasou.md`) —
tenhle plán to neřeší, je to na ní.
