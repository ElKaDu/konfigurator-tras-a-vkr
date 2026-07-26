# Navigace, Situace a podmínky trackingu — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Přejmenovat a zjednodušit navigaci (tracking-only konfigurátor, Situace v top nav, Trasy disabled), odebrat wizard pro "Soulad s předepsanou trasou" (nahradí ho budoucí "Kontrola na bodu", needimplementováno teď), odebrat `vkrTitle`/`vkrDescription` ze Závažnosti, sloučit dva bloky podmínek trackingu do jednoho sjednoceného řádku, a přepracovat seznam Situací (hledání + rozbalovací strom s detailem pravidel).

**Architecture:** Čistě frontend prototyp (Vite + TanStack Router + React, in-memory store). Žádné nové entity — jen úpravy existujícího `RuleCreatorPage.tsx` (odebrání route_compliance větve), `Severity`/seed dat (odebrání 2 polí), nová sjednocená verze condition builderu (nahrazuje dva existující), a přepracování `SituationsListPage.tsx`.

**Tech Stack:** TypeScript, React 19, TanStack Router, Tailwind CSS v4 + shadcn/radix, lucide-react. Žádný test runner (viz předchozí pláy) — verifikace přes `npm run build` + manuální průchod v dev serveru.

---

## Important context for the engineer

- Pracuješ v existujícím git worktree `/Users/abcdef/Downloads/konfigurator-tras-a-vkr/.claude/worktrees/situace-zavaznost-akce` (branch `worktree-situace-zavaznost-akce`), navazuješ na už implementovanou funkcionalitu Situace/Závažnost/Akce pro `tracking_records`.
- **Trasy/"Kontrola na bodu" (sub-projekt 2) se v tomto plánu NEIMPLEMENTUJE.** Tlačítko "Trasy zásilek" v top nav se jen vizuálně deaktivuje (viz Task 1) — routa `/trasy` a její stránky (`RoutesAndSegmentsPage`, `RouteEditorPage`, `SegmentEditorPage`) zůstávají v kódu beze změny, jen se do nich přes nav nedá kliknout.
- **Wizard pro "Soulad s předepsanou trasou" (`route_compliance`) se ruší úplně** (Task 6). Existující seed pravidla `R10`/`R11` (area `route_compliance`) zůstanou v seznamu Pravidel viditelná a needitovatelná přes wizard mimo obecná meta pole (název/popis/priorita/aktivní) — jejich `trigger`/`conditions`/`actions` se při uložení beze změny zachovají (read-only pass-through, viz Task 6 Step 6).
- `src/components/rules/AreaPicker.tsx`, `src/components/rules/RuleEditor.tsx`, `src/routes/rules.new.edit.tsx` jsou už dnes mrtvý kód (potvrzeno v předchozím plánu) — **nedotýkat se jich**, mimo rozsah.
- `src/components/rules/editors/RouteScopePicker.tsx` a `src/components/rules/editors/MilestoneTypePicker.tsx` po Task 6 ztratí jediného volajícího (`RuleCreatorPage.tsx`) a stanou se mrtvým kódem — **ponechat beze změny**, mazání souborů je mimo rozsah tohoto plánu (může se řešit později spolu s "Kontrola na bodu").
- `src/components/rules/editors/ScheduleEditor.tsx` a `src/components/rules/editors/TrackingTimeValueEditor.tsx` **zůstávají** — používá je i `src/components/vkr/RuleEditorDialog.tsx` / `VkrConditionsBuilder.tsx`, mimo `RuleCreatorPage.tsx`.

---

## Task 1: `AppHeader` — přejmenování, Situace do nav, Trasy disabled

**Files:**
- Modify: `src/components/AppHeader.tsx`

- [ ] **Step 1: Rozšířit `SectionKey` a upravit navigaci**

Find:
```tsx
export type SectionKey = "rules" | "routes";

export function AppHeader({
  current,
  extras,
}: {
  current: SectionKey;
  extras?: React.ReactNode;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-surface px-6">
      <div className="flex items-center gap-2">
        <div className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground">
          <svg viewBox="0 0 24 24" fill="none" className="size-4" stroke="currentColor" strokeWidth="2.5">
            <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
          </svg>
        </div>
        <span className="text-lg font-semibold tracking-tight">By<span className="text-primary">torp</span></span>
      </div>
      <div className="h-5 w-px bg-border" />
      <nav className="flex items-center gap-1 text-sm font-medium">
        <NavLink to="/" active={current === "rules"}>Konfigurátor pravidel</NavLink>
        <NavLink to="/trasy" active={current === "routes"}>Trasy zásilek</NavLink>
      </nav>
```

Replace with:
```tsx
export type SectionKey = "rules" | "routes" | "situace";

export function AppHeader({
  current,
  extras,
}: {
  current: SectionKey;
  extras?: React.ReactNode;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-surface px-6">
      <div className="flex items-center gap-2">
        <div className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground">
          <svg viewBox="0 0 24 24" fill="none" className="size-4" stroke="currentColor" strokeWidth="2.5">
            <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
          </svg>
        </div>
        <span className="text-lg font-semibold tracking-tight">By<span className="text-primary">torp</span></span>
      </div>
      <div className="h-5 w-px bg-border" />
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

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: Fails — `RulesList.tsx`, `RuleCreatorPage.tsx`, `SituationsListPage.tsx`, `SituationEditorPage.tsx` still pass `current="rules"` for the situace pages (fine, unrelated) and nothing references `/trasy` NavLink removal directly, so this alone should actually succeed. If it fails, confirm the only errors are pre-existing ones already known from prior work (unrelated `RoutesAndSegmentsPage.tsx`/`RuleEditor.tsx`/`RulesList.tsx` search-param typing issues) — nothing new caused by this step.

- [ ] **Step 3: Commit**

```bash
git add src/components/AppHeader.tsx
git commit -m "feat: rename nav to Pravidla pro tracking, add Situace nav item, disable Trasy"
```

---

## Task 2: Point Situace pages at the new nav item

**Files:**
- Modify: `src/components/situations/SituationsListPage.tsx:30`
- Modify: `src/components/situations/SituationEditorPage.tsx:16,54`

- [ ] **Step 1: Update `current` prop**

In `src/components/situations/SituationsListPage.tsx`, find:
```tsx
      <AppHeader current="rules" />
```
Replace with:
```tsx
      <AppHeader current="situace" />
```

In `src/components/situations/SituationEditorPage.tsx`, there are **two** occurrences (one in the "not found" early-return branch, one in the main render) — change **both** from `current="rules"` to `current="situace"`.

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: Succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/situations/SituationsListPage.tsx src/components/situations/SituationEditorPage.tsx
git commit -m "feat: highlight Situace a závažnosti as its own nav section"
```

---

## Task 3: Remove the "Oblasti" sidebar filter from `RulesList`

**Files:**
- Modify: `src/components/rules/RulesList.tsx`

- [ ] **Step 1: Simplify the `Selection` type — drop the `area` variant**

Find:
```tsx
type Selection =
  | { kind: "all" }
  | { kind: "active" }
  | { kind: "archived" }
  | { kind: "area"; area: Area };
```

Replace with:
```tsx
type Selection =
  | { kind: "all" }
  | { kind: "active" }
  | { kind: "archived" };
```

- [ ] **Step 2: Remove now-unused imports**

Find:
```tsx
import { AREAS, CIRCLED } from "@/lib/model/areas";
```
Delete this line entirely (`AreaBadge` import on the line above stays — it's still used per-row).

Find:
```tsx
import type { Area, Rule } from "@/lib/model/types";
```
Replace with:
```tsx
import type { Rule } from "@/lib/model/types";
```

Find (top of file, right after the imports):
```tsx
// Sidebar area list sorted by spec-defined canonical number (AREAS.num).
const SORTED_AREAS = [...AREAS].sort((a, b) => a.num - b.num);
```
Delete this whole block (2 lines including comment).

- [ ] **Step 3: Simplify `visible` and the title/subtitle derivation**

Find:
```tsx
  const visible = (() => {
    switch (selection.kind) {
      case "all":      return rules;
      case "active":   return rules.filter((r) => r.active);
      case "archived": return [];
      case "area":     return rules.filter((r) => r.area === selection.area);
    }
  })();

  const { title, subtitle } = (() => {
    if (selection.kind === "active")   return { title: "Pouze aktivní", subtitle: "Pravidla aktuálně vyhodnocovaná runtime evaluátorem." };
    if (selection.kind === "archived") return { title: "Archiv",        subtitle: "Archivovaná pravidla. Momentálně žádné záznamy." };
    if (selection.kind === "area") {
      const meta = AREAS.find((a) => a.id === selection.area);
      return { title: meta?.label ?? selection.area, subtitle: meta?.description };
    }
    return { title: "Všechna pravidla", subtitle: "Kompletní katalog pravidel napříč oblastmi." };
  })();
```

Replace with:
```tsx
  const visible = (() => {
    switch (selection.kind) {
      case "all":      return rules;
      case "active":   return rules.filter((r) => r.active);
      case "archived": return [];
    }
  })();

  const { title, subtitle } = (() => {
    if (selection.kind === "active")   return { title: "Pouze aktivní", subtitle: "Pravidla aktuálně vyhodnocovaná runtime evaluátorem." };
    if (selection.kind === "archived") return { title: "Archiv",        subtitle: "Archivovaná pravidla. Momentálně žádné záznamy." };
    return { title: "Všechna pravidla", subtitle: "Kompletní katalog pravidel napříč oblastmi." };
  })();
```

- [ ] **Step 4: Remove the "Oblasti" sidebar section**

Find:
```tsx
          {/* Group: Oblasti */}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1 mt-4">
            Oblasti
          </div>

          {SORTED_AREAS.map((meta) => {
            const { id } = meta;
            const circled = CIRCLED[meta.num - 1];
            const count   = rules.filter((r) => r.area === id).length;
            const isActive = selection.kind === "area" && selection.area === id;
            const disabled = !meta.enabled;

            return (
              <button
                key={id}
                disabled={disabled}
                onClick={disabled ? undefined : () => setSelection({ kind: "area", area: id })}
                className={cn(
                  "flex items-center justify-between rounded-lg px-2.5 py-2 text-sm w-full text-left",
                  isActive
                    ? "bg-primary-soft text-primary font-medium"
                    : "text-foreground hover:bg-muted/60",
                  disabled && "opacity-60 cursor-default",
                )}
              >
                <span>
                  {circled} {meta.label}
                </span>
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                    isActive
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {disabled ? "brzy" : count}
                </span>
              </button>
            );
          })}
        </aside>
```

Replace with:
```tsx
        </aside>
```

- [ ] **Step 5: Simplify `canReorder` and the "+ Nové pravidlo" link's dead `search` prop**

Find:
```tsx
                const canReorder = selection.kind === "all" || selection.kind === "area";
```
Replace with:
```tsx
                const canReorder = selection.kind === "all";
```

Find:
```tsx
            <Link
              to="/rules/new"
              search={{ area: selection.kind === "area" ? selection.area : undefined }}
              className="bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-primary/90"
            >
              + Nové pravidlo
            </Link>
```
Replace with:
```tsx
            <Link
              to="/rules/new"
              className="bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-primary/90"
            >
              + Nové pravidlo
            </Link>
```

- [ ] **Step 6: Verify it compiles**

Run: `npm run build`
Expected: Succeeds. `npx tsc --noEmit` should now show **one fewer** pre-existing error than before (the `RulesList.tsx` search-param mismatch tied to the removed `search={{area}}` prop resolves itself) — confirm no new errors appear.

- [ ] **Step 7: Commit**

```bash
git add src/components/rules/RulesList.tsx
git commit -m "refactor: remove Oblasti sidebar filter from RulesList"
```

---

## Task 4: `Severity` — remove `vkrTitle`/`vkrDescription` (data model)

**Files:**
- Modify: `src/lib/model/types.ts`

- [ ] **Step 1: Remove the two fields**

Find:
```ts
/** Úroveň uvnitř Situace — nese výchozí šablonu VkŘ. */
export interface Severity {
  id: string;
  name: string;
  vkrTitle: string;
  vkrDescription?: string;
  priority: Priority;
  actions: SeverityAction[];
}
```

Replace with:
```ts
/** Úroveň uvnitř Situace — nese výchozí šablonu VkŘ (název/popis VkŘ se propisují z Pravidla, ne odsud). */
export interface Severity {
  id: string;
  name: string;
  priority: Priority;
  actions: SeverityAction[];
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: **Fails** — `src/lib/model/seed.ts`, `src/components/situations/SeverityCard.tsx`, `src/components/rules/RuleCreatorPage.tsx` all still reference `vkrTitle`/`vkrDescription`. That's expected; fixed in Tasks 5-7.

- [ ] **Step 3: Commit**

```bash
git add src/lib/model/types.ts
git commit -m "refactor: remove vkrTitle/vkrDescription from Severity (WIP, callers follow)"
```

---

## Task 5: Seed data — drop `vkrTitle`/`vkrDescription`

**Files:**
- Modify: `src/lib/model/seed.ts`

- [ ] **Step 1: Remove the two fields from all 7 seeded severities**

Find each occurrence (there are 7, one per severity) and delete the `vkrTitle`/`vkrDescription` lines. For example:

Find:
```ts
      {
        id: "sev_undelivered_normal",
        name: "běžné",
        vkrTitle: "Nedoručeno — informovat zákazníka",
        vkrDescription: "Zásilka byla doručována, příjemce nebyl zastižen (1. pokus).",
        priority: "low",
```
Replace with:
```ts
      {
        id: "sev_undelivered_normal",
        name: "běžné",
        priority: "low",
```

Repeat the same `vkrTitle`/`vkrDescription` line removal (keeping `name`/`priority` and everything else unchanged) for these 6 remaining severities, identified by their `id`:
- `sev_undelivered_problem` ("Nedoručeno — prověřit důvod" / "Druhý neúspěšný pokus o doručení.")
- `sev_undelivered_critical` ("Nedoručeno — telefonicky řešit" / "Třetí a další neúspěšný pokus o doručení.")
- `sev_damage_default` ("Poškození zásilky — kontaktovat zákazníka" / "Tracking hlásí poškození zásilky.")
- `sev_transport_possible` ("Možný problém v přepravě — prověřit" / "Status signalizuje možný problém, je potřeba ověřit kontext (místo/čas vzniku).")
- `sev_transport_stuck` ("Zásilka zaseknutá na jednom místě" / "Několik po sobě jdoucích záznamů ze stejného místa — zásilka se fyzicky nepohybuje.")
- `sev_transport_lost_suspect` ("Podezření na ztrátu zásilky" / "Zásilka nemá nový tracking záznam déle, než je pro tuto trasu obvyklé.")

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: Still fails — `SeverityCard.tsx` and `RuleCreatorPage.tsx` remain (Tasks 6-7). Confirm no error mentions `seed.ts` anymore.

- [ ] **Step 3: Commit**

```bash
git add src/lib/model/seed.ts
git commit -m "refactor: drop vkrTitle/vkrDescription from seeded severities"
```

---

## Task 6: `SeverityCard` — remove the Název/Popis VkŘ inputs

**Files:**
- Modify: `src/components/situations/SeverityCard.tsx`

- [ ] **Step 1: Delete the two input blocks**

Find:
```tsx
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Název VkŘ (výchozí)</label>
        <input
          value={severity.vkrTitle}
          onChange={(e) => onChange({ ...severity, vkrTitle: e.target.value })}
          className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm"
        />
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Popis VkŘ (výchozí)</label>
        <textarea
          value={severity.vkrDescription ?? ""}
          onChange={(e) => onChange({ ...severity, vkrDescription: e.target.value })}
          rows={2}
          className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm resize-none"
        />
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Priorita</label>
```

Replace with:
```tsx
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Priorita</label>
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: Still fails on `RuleCreatorPage.tsx` (Task 7). Confirm no error mentions `SeverityCard.tsx` anymore.

- [ ] **Step 3: Commit**

```bash
git add src/components/situations/SeverityCard.tsx
git commit -m "refactor: remove Název/Popis VkŘ inputs from SeverityCard"
```

---

## Task 7: `RuleCreatorPage` — remove route_compliance entirely + oblast pill bar

**Files:**
- Modify: `src/components/rules/RuleCreatorPage.tsx`

This is the biggest task — it removes everything specific to the `route_compliance` wizard (situation cards, milestone/schedule configs, fulfilled/not-fulfilled action branches) and the oblast pill bar, and fixes `applySeverityTemplate` now that `Severity` no longer has `vkrTitle`/`vkrDescription`.

- [ ] **Step 1: Trim imports**

Find:
```tsx
import { useEffect, useMemo, useState } from "react";
import { Lock, Clock, MapPin, AlertTriangle, Zap, ChevronDown, ChevronUp, Plus, X, Settings2 } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { Textarea } from "@/components/ui/textarea";
import { AREAS } from "@/lib/model/areas";
import { resolveAreaIcon } from "@/components/common/areaIcons";
import { useSegments, useCheckpointTypes, useRules, rulesStore, useSituations, situationsStore, useActionTags } from "@/lib/model/store";
import { cn } from "@/lib/utils";
import type { Area, Priority, ActionType, Rule, Situation, Severity, Condition } from "@/lib/model/types";
import { TRACKING_FIELDS, TRACKING_OPERATORS } from "@/lib/model/trackingFields";
import { ScheduleEditor, type ScheduleItem } from "@/components/rules/editors/ScheduleEditor";
import { VkrConditionsBuilder } from "@/components/rules/editors/VkrConditionsBuilder";
import type { VkrCondition } from "@/lib/vkr/vkrConditionCatalog";
import { RouteScopePicker, DEFAULT_ROUTE_SCOPE, type RouteScope } from "@/components/rules/editors/RouteScopePicker";
import { MilestoneTypePicker } from "@/components/rules/editors/MilestoneTypePicker";
import { TrackingTimeValueEditor, DEFAULT_TIME_SPEC, type TrackingTimeSpec } from "@/components/rules/editors/TrackingTimeValueEditor";
import { CurrentRecordConditionsBuilder } from "@/components/rules/editors/CurrentRecordConditionsBuilder";
import { TrackingHistoryConditionsBuilder } from "@/components/rules/editors/TrackingHistoryConditionsBuilder";
import { ActionTagPicker } from "@/components/situations/ActionTagPicker";
```

Replace with:
```tsx
import { useEffect, useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { Textarea } from "@/components/ui/textarea";
import { useRules, rulesStore, useSituations, useActionTags } from "@/lib/model/store";
import { cn } from "@/lib/utils";
import type { Area, Priority, ActionType, Rule, Situation, Severity, Condition } from "@/lib/model/types";
import { VkrConditionsBuilder } from "@/components/rules/editors/VkrConditionsBuilder";
import type { VkrCondition } from "@/lib/vkr/vkrConditionCatalog";
import { TrackingConditionsBuilder } from "@/components/rules/editors/TrackingConditionsBuilder";
import { ActionTagPicker } from "@/components/situations/ActionTagPicker";
```

(`TrackingConditionsBuilder` doesn't exist yet — that's Task 8, done right after this one. `npm run build` will fail on that missing import until Task 8 lands; that's expected, same pattern as the original Situace/Závažnost/Akce plan.)

- [ ] **Step 2: Delete route_compliance-only types, constants and helpers**

Find (near the top, right after the imports):
```tsx
type RouteUiSituation = "delivery_day" | "unexpected_location" | "missed_milestone" | "other";
type CheckInterval = "30min" | "1h" | "2h" | "6h";
type ThresholdLevel = "warn" | "critical";


type TrackingTriggerType = "automatic" | "timer";
interface TrackingConditionRow { id: string; field: string; operator: string; value: string; timeSpec?: TrackingTimeSpec; }

const SITUATION_CARDS: {
  id: RouteUiSituation;
  icon: React.ReactNode;
  label: string;
  trigger: string;
  disabled?: boolean;
}[] = [
  {
    id: "delivery_day",
    icon: <Clock className="size-4" />,
    label: "Kontrola v den doručení",
    trigger: "Časový plán (schedule)",
  },
  {
    id: "unexpected_location",
    icon: <MapPin className="size-4" />,
    label: "Zásilka v neočekávané lokaci",
    trigger: "Reaktivní (condition_met)",
  },
  {
    id: "missed_milestone",
    icon: <AlertTriangle className="size-4" />,
    label: "Kontrola splnění milníku",
    trigger: "Reaktivní (condition_met)",
  },
  {
    id: "other",
    icon: <Zap className="size-4" />,
    label: "Jiná situace",
    trigger: "—",
    disabled: true,
  },
];
```

Replace with:
```tsx
type TrackingTriggerType = "automatic" | "timer";
```

- [ ] **Step 3: Delete `BranchAction` and its helpers**

Find:
```tsx
interface BranchAction {
  id: string;
  type: string;
  title: string;
  vkrText?: string;
  /** Podmínky zásilky — akce se spustí jen pokud platí AND seznam. */
  shipmentConditions?: VkrCondition[];
}

interface SeverityActionRow {
```
Replace with:
```tsx
interface SeverityActionRow {
```

Find:
```tsx
const DEFAULT_TRACKING_CONDITIONS: TrackingConditionRow[] = [
  { id: "tc_1", field: "derivedStatus", operator: "je jedním z", value: "" },
];

const DEFAULT_NOT_FULFILLED_ACTIONS: BranchAction[] = [
  { id: "act_1", type: "create_vkr", title: "Soulad s trasou — nesplněno · {{shipment.reference}}" },
];

function cloneActions(actions: BranchAction[]): BranchAction[] {
  return actions.map((a) => ({ ...a }));
}

function toBranchAction(action: Rule["actions"][number]): BranchAction {
  return { id: action.id, type: action.type, title: action.title ?? "", vkrText: action.vkrText };
}

function routeCheckpointFromRule(rule?: Rule): string | undefined {
  const condition = rule?.conditions.find((c) => c.kind === "route_compliance" && c.mode === "checkpoint_type");
  return condition?.kind === "route_compliance" ? condition.checkpointTypeId : undefined;
}

function inferRouteSituation(rule?: Rule): RouteUiSituation | null {
  if (!rule || rule.area !== "route_compliance") return null;
  const name = rule.name.toLocaleLowerCase("cs-CZ");
  const triggerLabel = rule.trigger.label.toLocaleLowerCase("cs-CZ");
  const general = rule.conditions.find((c) => c.kind === "route_compliance" && c.mode === "general");
  if (general?.kind === "route_compliance" && general.generalCheck === "unrecognized_location") return "unexpected_location";
  if (name.includes("den doručení") || name.includes("doručení v den") || triggerLabel.includes("den doručení")) return "delivery_day";
  if (name.includes("dlouho") || triggerLabel.includes("interval") || triggerLabel.includes("každých")) return "missed_milestone";
  return "missed_milestone";
}

function inferTriggerType(rule?: Rule): TrackingTriggerType {
```
Replace with:
```tsx
function inferTriggerType(rule?: Rule): TrackingTriggerType {
```

- [ ] **Step 4: Simplify `RuleCreatorUiState` — drop route_compliance-only fields**

Find:
```tsx
interface RuleCreatorUiState {
  selectedSituation: RouteUiSituation | null;
  selectedSituationId: string | null;
  selectedSeverityId: string | null;
  triggerType: TrackingTriggerType;
  currentRecordConditions: Condition[];
  historyConditions: Condition[];
  noMovementDuration: number;
  noMovementUnit: "h" | "d" | "bd";
  severityActions: SeverityActionRow[];
  deliveryMilestone: string;
  checkTimes: string[];
  scheduleItems: ScheduleItem[];
  vkrConditions: VkrCondition[];
  routeScope: RouteScope;
  missedMilestoneType?: string;
  
  tooLongMilestone: string;
  tooLongThreshold: ThresholdLevel;
  checkInterval: CheckInterval;
  fulfilledActions: BranchAction[];
  notFulfilledActions: BranchAction[];
}
```

Replace with:
```tsx
interface RuleCreatorUiState {
  selectedSituationId: string | null;
  selectedSeverityId: string | null;
  triggerType: TrackingTriggerType;
  trackingConditions: Condition[];
  noMovementDuration: number;
  noMovementUnit: "h" | "d" | "bd";
  severityActions: SeverityActionRow[];
  vkrConditions: VkrCondition[];
}
```

(`currentRecordConditions`/`historyConditions` merge into a single `trackingConditions` array — see Task 8. All route_compliance-only fields — `selectedSituation`, `deliveryMilestone`, `checkTimes`, `scheduleItems`, `routeScope`, `missedMilestoneType`, `tooLongMilestone`, `tooLongThreshold`, `checkInterval`, `fulfilledActions`, `notFulfilledActions` — are gone.)

- [ ] **Step 5: Rewrite `getInitialFormState`**

Find the whole function:
```tsx
function getInitialFormState(rule?: Rule): RuleCreatorInitialState {
  const ui = (rule?.uiState ?? {}) as Partial<RuleCreatorUiState>;
  const fulfilledFromRule = rule?.actions.filter((a) => a.runWhenRouteCondition === "fulfilled").map(toBranchAction) ?? [];
  const notFulfilledFromRule = rule?.actions.filter((a) => a.runWhenRouteCondition !== "fulfilled").map(toBranchAction) ?? [];
  const checkpointId = routeCheckpointFromRule(rule);

  return {
    selectedArea: rule?.area ?? "route_compliance",
    ruleName: rule?.name ?? "",
    ruleDescription: rule?.description ?? "",
    priority: rule?.priority ?? "medium",
    active: rule?.active ?? true,
    selectedSituation: ui.selectedSituation ?? inferRouteSituation(rule),
    selectedSituationId: ui.selectedSituationId ?? rule?.situationId ?? null,
    selectedSeverityId: ui.selectedSeverityId ?? rule?.severityId ?? null,
    triggerType: ui.triggerType ?? inferTriggerType(rule),
    currentRecordConditions: ui.currentRecordConditions ?? currentRecordConditionsFromRule(rule),
    historyConditions: ui.historyConditions ?? historyConditionsFromRule(rule),
    noMovementDuration: ui.noMovementDuration ?? 72,
    noMovementUnit: ui.noMovementUnit ?? "h",
    severityActions: ui.severityActions ?? severityActionRowsFromRule(rule),
    deliveryMilestone: ui.deliveryMilestone ?? checkpointId ?? "ct_first_scan",
    checkTimes: ui.checkTimes ?? ["08:00", "10:00"],
    scheduleItems: (ui.scheduleItems as ScheduleItem[] | undefined) ?? [
      { id: "s_t1", kind: "time_of_day", time: "08:00", tzMode: "destination" },
      { id: "s_t2", kind: "time_of_day", time: "09:00", tzMode: "destination" },
    ],
    vkrConditions: (ui.vkrConditions as VkrCondition[] | undefined) ?? convertLegacyVkrConditions(ui),
    routeScope: (ui.routeScope as RouteScope | undefined) ?? { ...DEFAULT_ROUTE_SCOPE },
    missedMilestoneType: ui.missedMilestoneType ?? checkpointId,
    
    tooLongMilestone: ui.tooLongMilestone ?? checkpointId ?? "",
    tooLongThreshold: ui.tooLongThreshold ?? "warn",
    checkInterval: ui.checkInterval ?? "1h",
    fulfilledActions: ui.fulfilledActions ?? fulfilledFromRule,
    notFulfilledActions: ui.notFulfilledActions ?? (notFulfilledFromRule.length > 0 ? notFulfilledFromRule : cloneActions(DEFAULT_NOT_FULFILLED_ACTIONS)),
  };
}
```

Replace with:
```tsx
function getInitialFormState(rule?: Rule): RuleCreatorInitialState {
  const ui = (rule?.uiState ?? {}) as Partial<RuleCreatorUiState>;

  return {
    selectedArea: rule?.area ?? "tracking_records",
    ruleName: rule?.name ?? "",
    ruleDescription: rule?.description ?? "",
    priority: rule?.priority ?? "medium",
    active: rule?.active ?? true,
    selectedSituationId: ui.selectedSituationId ?? rule?.situationId ?? null,
    selectedSeverityId: ui.selectedSeverityId ?? rule?.severityId ?? null,
    triggerType: ui.triggerType ?? inferTriggerType(rule),
    trackingConditions: ui.trackingConditions ?? trackingConditionsFromRule(rule),
    noMovementDuration: ui.noMovementDuration ?? 72,
    noMovementUnit: ui.noMovementUnit ?? "h",
    severityActions: ui.severityActions ?? severityActionRowsFromRule(rule),
    vkrConditions: (ui.vkrConditions as VkrCondition[] | undefined) ?? [],
  };
}
```

Note the default `selectedArea` flips from `"route_compliance"` to `"tracking_records"` — there's no more oblast picker, so every *new* rule is a tracking rule. Existing non-tracking rules (`R10`/`R11`) still open with their real `rule.area` when edited.

Also replace the two condition-splitting helper functions right above it — find:
```tsx
function currentRecordConditionsFromRule(rule?: Rule): Condition[] {
  if (!rule) return [];
  return rule.conditions.filter(
    (c) => c.kind === "field" || (c.kind === "tracking_aggregate" && c.valueMode === "same_repeats")
  );
}

function historyConditionsFromRule(rule?: Rule): Condition[] {
  if (!rule) return [];
  return rule.conditions.filter((c) => c.kind === "tracking_aggregate" && c.valueMode === "specific");
}
```
Replace with:
```tsx
function trackingConditionsFromRule(rule?: Rule): Condition[] {
  if (!rule) return [];
  return rule.conditions.filter((c) => c.kind === "field" || c.kind === "tracking_aggregate");
}
```

Also delete the now-legacy VkŘ-condition migration helper — find (near the bottom of the file, under `/* ─── Migrace starých VkŘ podmínek ──────────────────────── */`):
```tsx
type LegacyCarrierDate = { enabled: boolean; operator: "is_today" | "is_tomorrow" | "within_days"; days?: number };
type LegacyCustomer = { enabled: boolean; operator: "is" | "is_not"; value: "new" | "longterm" };

function convertLegacyVkrConditions(ui: Partial<RuleCreatorUiState> & {
  vkrConditionCarrierDate?: LegacyCarrierDate;
  vkrConditionCustomer?: LegacyCustomer;
}): VkrCondition[] {
  const out: VkrCondition[] = [];
  const cd = ui.vkrConditionCarrierDate;
  if (cd?.enabled) {
    out.push({
      id: "vc_legacy_carrier",
      fieldId: "carrier_announced_delivery_at",
      operator: cd.operator,
      value: cd.operator === "within_days" ? String(cd.days ?? 3) : "",
    });
  }
  const cu = ui.vkrConditionCustomer;
  if (cu?.enabled) {
    out.push({
      id: "vc_legacy_customer",
      fieldId: "customer.tenure",
      operator: cu.operator,
      value: cu.value,
    });
  }
  return out;
}
```
Delete this whole block, including the `/* ─── Migrace starých VkŘ podmínek ──────────────────────── */` comment header above it — it was only reachable from the deleted `routeScope`/legacy-condition defaulting in `getInitialFormState`, and had no other caller.

- [ ] **Step 6: Rewrite the component's state — drop route_compliance-only state, merge condition state**

Find:
```tsx
  const [selectedArea, setSelectedArea] = useState<Area>(
    initialState.selectedArea
  );
  const [selectedSituation, setSelectedSituation] = useState<RouteUiSituation | null>(
    initialState.selectedSituation
  );

  // Tracking records state
  const [selectedSituationId, setSelectedSituationId] = useState<string | null>(initialState.selectedSituationId);
  const [selectedSeverityId, setSelectedSeverityId] = useState<string | null>(initialState.selectedSeverityId);
  const [triggerType, setTriggerType] = useState<TrackingTriggerType>(initialState.triggerType);
  const [currentRecordConditions, setCurrentRecordConditions] = useState<Condition[]>(initialState.currentRecordConditions);
  const [historyConditions, setHistoryConditions] = useState<Condition[]>(initialState.historyConditions);
  const [noMovementDuration, setNoMovementDuration] = useState(initialState.noMovementDuration);
  const [noMovementUnit, setNoMovementUnit] = useState<"h" | "d" | "bd">(initialState.noMovementUnit);
  const [severityActions, setSeverityActions] = useState<SeverityActionRow[]>(initialState.severityActions);
  const [ruleName, setRuleName] = useState(initialState.ruleName);
  const [ruleDescription, setRuleDescription] = useState(initialState.ruleDescription);
  const [priority, setPriority] = useState<Priority>(initialState.priority);
  const [active, setActive] = useState(initialState.active);

  // Situation-specific state
  const [deliveryMilestone, setDeliveryMilestone] = useState(initialState.deliveryMilestone);
  const [checkTimes, setCheckTimes] = useState<string[]>(initialState.checkTimes);
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>(initialState.scheduleItems);
  const [vkrConditions, setVkrConditions] = useState<VkrCondition[]>(initialState.vkrConditions);
  const [routeScope, setRouteScope] = useState<RouteScope>(initialState.routeScope);
  const [missedMilestoneType, setMissedMilestoneType] = useState<string | undefined>(initialState.missedMilestoneType);
  
  const [tooLongMilestone, setTooLongMilestone] = useState(initialState.tooLongMilestone);
  const [tooLongThreshold, setTooLongThreshold] = useState<ThresholdLevel>(initialState.tooLongThreshold);
  const [checkInterval, setCheckInterval] = useState<CheckInterval>(initialState.checkInterval);

  // Actions
  const [fulfilledActions, setFulfilledActions] = useState<BranchAction[]>(
    initialState.fulfilledActions
  );
  const [notFulfilledActions, setNotFulfilledActions] = useState<BranchAction[]>(
    initialState.notFulfilledActions
  );
  const [advancedOpen, setAdvancedOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setSelectedArea(initialState.selectedArea);
    setSelectedSituation(initialState.selectedSituation);
    setSelectedSituationId(initialState.selectedSituationId);
    setSelectedSeverityId(initialState.selectedSeverityId);
    setTriggerType(initialState.triggerType);
    setCurrentRecordConditions(initialState.currentRecordConditions);
    setHistoryConditions(initialState.historyConditions);
    setNoMovementDuration(initialState.noMovementDuration);
    setNoMovementUnit(initialState.noMovementUnit);
    setSeverityActions(initialState.severityActions);
    setRuleName(initialState.ruleName);
    setRuleDescription(initialState.ruleDescription);
    setPriority(initialState.priority);
    setActive(initialState.active);
    setDeliveryMilestone(initialState.deliveryMilestone);
    setCheckTimes(initialState.checkTimes);
    setScheduleItems(initialState.scheduleItems);
    setVkrConditions(initialState.vkrConditions);
    setRouteScope(initialState.routeScope);
    setMissedMilestoneType(initialState.missedMilestoneType);
    
    setTooLongMilestone(initialState.tooLongMilestone);
    setTooLongThreshold(initialState.tooLongThreshold);
    setCheckInterval(initialState.checkInterval);
    setFulfilledActions(initialState.fulfilledActions);
    setNotFulfilledActions(initialState.notFulfilledActions);
  }, [initialState]);

  // Milestones with thresholds (for "too_long" situation)
  const milestonesWithThresholds = segments
    .flatMap((s) => s.checkpoints)
    .filter((cp) => cp.warnAfterHours || cp.criticalAfterHours)
    .map((cp) => ({
      id: cp.id,
      label: checkpointTypes.find((ct) => ct.id === cp.checkpointTypeId)?.name ?? cp.checkpointTypeId,
      warnAfterHours: cp.warnAfterHours,
      criticalAfterHours: cp.criticalAfterHours,
    }));

  function addAction(branch: "fulfilled" | "not_fulfilled") {
    const newAction: BranchAction = { id: "act_" + Date.now(), type: "create_vkr", title: "" };
    if (branch === "fulfilled") setFulfilledActions((prev) => [...prev, newAction]);
    else setNotFulfilledActions((prev) => [...prev, newAction]);
  }

  function removeAction(branch: "fulfilled" | "not_fulfilled", id: string) {
    if (branch === "fulfilled") setFulfilledActions((prev) => prev.filter((a) => a.id !== id));
    else setNotFulfilledActions((prev) => prev.filter((a) => a.id !== id));
  }

  function toggleTime(t: string) {
    setCheckTimes((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  }

  const isRouteCompliance = selectedArea === "route_compliance";
  const isTrackingRecords = selectedArea === "tracking_records";
```

Replace with:
```tsx
  const [selectedArea] = useState<Area>(initialState.selectedArea);

  // Tracking records state
  const [selectedSituationId, setSelectedSituationId] = useState<string | null>(initialState.selectedSituationId);
  const [selectedSeverityId, setSelectedSeverityId] = useState<string | null>(initialState.selectedSeverityId);
  const [triggerType, setTriggerType] = useState<TrackingTriggerType>(initialState.triggerType);
  const [trackingConditions, setTrackingConditions] = useState<Condition[]>(initialState.trackingConditions);
  const [noMovementDuration, setNoMovementDuration] = useState(initialState.noMovementDuration);
  const [noMovementUnit, setNoMovementUnit] = useState<"h" | "d" | "bd">(initialState.noMovementUnit);
  const [severityActions, setSeverityActions] = useState<SeverityActionRow[]>(initialState.severityActions);
  const [ruleName, setRuleName] = useState(initialState.ruleName);
  const [ruleDescription, setRuleDescription] = useState(initialState.ruleDescription);
  const [priority, setPriority] = useState<Priority>(initialState.priority);
  const [active, setActive] = useState(initialState.active);
  const [vkrConditions, setVkrConditions] = useState<VkrCondition[]>(initialState.vkrConditions);

  useEffect(() => {
    setSelectedSituationId(initialState.selectedSituationId);
    setSelectedSeverityId(initialState.selectedSeverityId);
    setTriggerType(initialState.triggerType);
    setTrackingConditions(initialState.trackingConditions);
    setNoMovementDuration(initialState.noMovementDuration);
    setNoMovementUnit(initialState.noMovementUnit);
    setSeverityActions(initialState.severityActions);
    setRuleName(initialState.ruleName);
    setRuleDescription(initialState.ruleDescription);
    setPriority(initialState.priority);
    setActive(initialState.active);
    setVkrConditions(initialState.vkrConditions);
  }, [initialState]);

  const isTrackingRecords = selectedArea === "tracking_records";
```

(`selectedArea` is now set once from `initialState` and never changed by the user — there's no more oblast picker. `segments`/`checkpointTypes` hooks at the top of the component become unused after this — remove them too, see Step 7.)

- [ ] **Step 7: Remove now-unused `segments`/`checkpointTypes` hooks**

Find:
```tsx
  const segments = useSegments();
  const checkpointTypes = useCheckpointTypes();
  const rules = useRules();
```
Replace with:
```tsx
  const rules = useRules();
```

- [ ] **Step 8: Update `applySeverityTemplate` — no more `vkrTitle`/`vkrDescription`**

Find:
```tsx
  function applySeverityTemplate(severity: Severity) {
    setRuleName(severity.vkrTitle);
    setRuleDescription(severity.vkrDescription ?? "");
    setPriority(severity.priority);
    setSeverityActions(
      severity.actions.map((a) => ({ id: a.id, actionTagId: a.actionTagId, enabled: true, description: a.description ?? "" }))
    );
  }
```
Replace with:
```tsx
  function applySeverityTemplate(severity: Severity) {
    setPriority(severity.priority);
    setSeverityActions(
      severity.actions.map((a) => ({ id: a.id, actionTagId: a.actionTagId, enabled: true, description: a.description ?? "" }))
    );
  }
```

(Název/popis pravidla se už nepředvyplňují ze závažnosti — uživatel je vyplňuje sám, per `2026-07-16-situace-podminky-uprava-design.md` §3.)

- [ ] **Step 9: Remove the oblast pill bar and rewrite the top-level JSX wrapper**

Find:
```tsx
  return (
    <div className="flex h-screen w-screen flex-col bg-background text-foreground">
      <AppHeader current="rules" />

      {/* OBLAST — vodorovná lišta */}
      <div className="flex items-center gap-1.5 border-b border-border bg-muted/20 px-4 py-2 overflow-x-auto">
        {AREAS.map((area) => {
          const Icon = resolveAreaIcon(area.icon);
          const isSelected = selectedArea === area.id;
          if (!area.enabled) {
            return (
              <div
                key={area.id}
                className="flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs opacity-40 cursor-not-allowed"
              >
                <Icon className="size-3.5 text-muted-foreground" />
                <span className="text-muted-foreground whitespace-nowrap">{area.label}</span>
                <span className="text-[10px] text-muted-foreground">brzy</span>
              </div>
            );
          }
          return (
            <button
              key={area.id}
              onClick={() => { setSelectedArea(area.id); setSelectedSituation(null); }}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
                isSelected ? "bg-primary-soft text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-3.5" />
              {area.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-1 min-h-0">
        {/* LEFT COLUMN — Situace + Závažnost (tracking) / Situace (route_compliance) */}
        <div className="flex w-[260px] shrink-0 flex-col border-r border-border">
```

Replace with:
```tsx
  return (
    <div className="flex h-screen w-screen flex-col bg-background text-foreground">
      <AppHeader current="rules" />

      <div className="flex flex-1 min-h-0">
        {/* LEFT COLUMN — Situace + Závažnost */}
        <div className="flex w-[260px] shrink-0 flex-col border-r border-border">
```

- [ ] **Step 10: Delete the route_compliance branch of the left column**

Find:
```tsx
            {/* Situace (only for route_compliance) */}
            {isRouteCompliance && (
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Situace</div>
                <div className="flex flex-col gap-1.5">
                  {SITUATION_CARDS.map((card) => {
                    const isSelected = selectedSituation === card.id;
                    if (card.disabled) {
                      return (
                        <div
                          key={card.id}
                          className="flex items-start gap-2.5 rounded-lg border border-border px-3 py-2.5 opacity-40 cursor-not-allowed"
                        >
                          <span className="mt-0.5 text-muted-foreground">{card.icon}</span>
                          <div>
                            <div className="text-xs font-medium text-muted-foreground">{card.label}</div>
                            <div className="text-[10px] text-muted-foreground">nedostupné</div>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <button
                        key={card.id}
                        onClick={() => setSelectedSituation(card.id)}
                        className={cn(
                          "flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors",
                          isSelected
                            ? "border-primary bg-primary-soft/40 text-primary"
                            : "border-border hover:border-primary/30 hover:bg-muted/30 text-foreground"
                        )}
                      >
                        <span className={cn("mt-0.5", isSelected ? "text-primary" : "text-muted-foreground")}>{card.icon}</span>
                        <div>
                          <div className="text-xs font-medium">{card.label}</div>
                          <div className={cn("text-[10px]", isSelected ? "text-primary/70" : "text-muted-foreground")}>{card.trigger}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
```
Replace with:
```tsx
          </div>
```

- [ ] **Step 11: Delete `!isRouteCompliance &&` from the "no area configured" placeholder, and delete the whole route_compliance middle-column branch**

Find:
```tsx
            {!isRouteCompliance && !isTrackingRecords && (
              <div className="rounded-xl border border-dashed border-border p-8 text-center">
                <div className="text-sm text-muted-foreground">
                  Konfigurace podmínek pro tuto oblast bude přidána později.
                </div>
              </div>
            )}
```
Replace with:
```tsx
            {!isTrackingRecords && (
              <div className="rounded-xl border border-dashed border-border p-8 text-center">
                <div className="text-sm text-muted-foreground">
                  Konfigurace podmínek pro tuto oblast bude přidána později.
                </div>
              </div>
            )}
```

Find (the `route_compliance` middle-column branch, right after the tracking_records JSX which Task 8 rewrites separately):
```tsx
            {isRouteCompliance && !selectedSituation && (
              <div className="rounded-xl border border-dashed border-border p-8 text-center">
                <div className="text-sm text-muted-foreground">
                  Vyber situaci v levém sloupci.
                </div>
              </div>
            )}

            {isRouteCompliance && selectedSituation && (
              <>
                {/* Locked trigger + Pokročilé mockup */}
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                  <Lock className="size-3.5 text-muted-foreground shrink-0" />
                  <div className="text-sm text-muted-foreground flex-1 min-w-0">
                    <span className="font-medium text-foreground">Spouštěč:</span> {triggerLabel}
                  </div>
                  <button
                    disabled
                    title="Brzy: ruční úprava triggeru (plán, podmínka, manuální)."
                    className="flex items-center gap-1 rounded-md border border-dashed border-border px-2 py-1 text-[11px] text-muted-foreground opacity-60 cursor-not-allowed"
                  >
                    <Settings2 className="size-3" /> Pokročilé
                  </button>
                </div>

                {/* Situation-specific config */}
                {selectedSituation === "delivery_day" && (
                  <>
                    <RouteScopePicker value={routeScope} onChange={setRouteScope} />
                    <DeliveryDayConfig
                      milestone={deliveryMilestone}
                      onMilestoneChange={setDeliveryMilestone}
                      scheduleItems={scheduleItems}
                      onScheduleItems={setScheduleItems}
                      checkpointTypes={checkpointTypes}
                    />
                  </>
                )}

                {selectedSituation === "unexpected_location" && (
                  <>
                    <RouteScopePicker value={routeScope} onChange={setRouteScope} />
                    <AutoSummary text="Podmínka je nastavena automaticky. Systém při každém příchozím tracking záznamu zkontroluje, zda země nebo lokace odpovídá některému bodu na standardní trase zásilky." />
                  </>
                )}

                {selectedSituation === "missed_milestone" && (
                  <>
                    <RouteScopePicker value={routeScope} onChange={setRouteScope} allowExclude />
                    <MilestoneTypePicker value={missedMilestoneType} onChange={setMissedMilestoneType} />
                    <AutoSummary text="Podmínka je nastavena automaticky. Systém sleduje vybraný typ milníku na trase zásilky. Jakmile uplyne časový limit a zásilka nemá platný tracking záznam, podmínka se splní. Časové limity nastavuješ v editoru trasy." />
                  </>
                )}

                {/* Podmínky věci k řešení (v prostředním sloupci) */}
                <VkrConditionsBuilder
                  conditions={vkrConditions}
                  onChange={setVkrConditions}
                />
              </>
            )}


          </div>
        </div>
```
Replace with:
```tsx
          </div>
        </div>
```

- [ ] **Step 12: Delete the route_compliance branch of the right column (Akce)**

Find:
```tsx
            {isRouteCompliance && (
              <>
                <ActionBranch
                  label="Podmínka splněna"
                  variant="fulfilled"
                  actions={fulfilledActions}
                  advancedOpen={advancedOpen}
                  onToggleAdvanced={(id) => setAdvancedOpen((p) => ({ ...p, [id]: !p[id] }))}
                  onAdd={() => addAction("fulfilled")}
                  onRemove={(id) => removeAction("fulfilled", id)}
                  onChangeType={(id, type) =>
                    setFulfilledActions((prev) => prev.map((a) => a.id === id ? { ...a, type } : a))
                  }
                  onChangeTitle={(id, title) =>
                    setFulfilledActions((prev) => prev.map((a) => a.id === id ? { ...a, title } : a))
                  }
                  onChangeVkrText={(id, vkrText) =>
                    setFulfilledActions((prev) => prev.map((a) => a.id === id ? { ...a, vkrText } : a))
                  }
                  onChangeShipmentConditions={(id, shipmentConditions) =>
                    setFulfilledActions((prev) => prev.map((a) => a.id === id ? { ...a, shipmentConditions } : a))
                  }
                />
                <ActionBranch
                  label="Podmínka nesplněna"
                  variant="not_fulfilled"
                  actions={notFulfilledActions}
                  advancedOpen={advancedOpen}
                  onToggleAdvanced={(id) => setAdvancedOpen((p) => ({ ...p, [id]: !p[id] }))}
                  onAdd={() => addAction("not_fulfilled")}
                  onRemove={(id) => removeAction("not_fulfilled", id)}
                  onChangeType={(id, type) =>
                    setNotFulfilledActions((prev) => prev.map((a) => a.id === id ? { ...a, type } : a))
                  }
                  onChangeTitle={(id, title) =>
                    setNotFulfilledActions((prev) => prev.map((a) => a.id === id ? { ...a, title } : a))
                  }
                  onChangeVkrText={(id, vkrText) =>
                    setNotFulfilledActions((prev) => prev.map((a) => a.id === id ? { ...a, vkrText } : a))
                  }
                  onChangeShipmentConditions={(id, shipmentConditions) =>
                    setNotFulfilledActions((prev) => prev.map((a) => a.id === id ? { ...a, shipmentConditions } : a))
                  }
                />
              </>
            )}

            {isTrackingRecords && (
```
Replace with:
```tsx
            {isTrackingRecords && (
```

Find:
```tsx
            {!isRouteCompliance && !isTrackingRecords && (
              <div className="rounded-xl border border-dashed border-border p-8 text-center">
                <div className="text-sm text-muted-foreground">Nejdříve vyber oblast vlevo.</div>
              </div>
            )}
```
Replace with:
```tsx
            {!isTrackingRecords && (
              <div className="rounded-xl border border-dashed border-border p-8 text-center">
                <div className="text-sm text-muted-foreground">Pro tuto oblast se akce nekonfigurují přes wizard.</div>
              </div>
            )}
```

- [ ] **Step 13: Delete the now-orphaned `ACTION_TYPES`, `DeliveryDayConfig`, `TooLongConfig`, `AutoSummary`, `ActionBranch` and `getTriggerLabel`**

These have no remaining callers after Steps 9-12. Each is uniquely identified below by its exact opening line — delete from that line down to (and including) its matching closing `}` (each is a top-level `const`/`function` declaration, so the matching brace is the one that brings the nesting back to zero — use your editor's bracket-matching to find it precisely).

1. Find the line `const ACTION_TYPES = [` — delete that `const` declaration through its closing `];`.
2. Find the line `function DeliveryDayConfig({` — delete that function, **and** the comment line immediately above it, `/* ─── Situation configs ──────────────────────────────────── */` (nothing else sits under that header once this is gone).
3. Find the line `function TooLongConfig({` — delete that function (already dead code before this plan — confirm via `grep -n "TooLongConfig" src/components/rules/RuleCreatorPage.tsx` that the only remaining match is this declaration itself before deleting).
4. Find the line `function AutoSummary({ text }: { text: string }) {` — delete that function.
5. Find the line `function ActionBranch({` — delete that function, **and** the comment line immediately above it, `/* ─── Action Branch ──────────────────────────────────────── */`.
6. Find the line `function getTriggerLabel(situation: RouteUiSituation | null, interval: CheckInterval): string {` — delete that function. The comment header above it, `/* ─── Helpers ────────────────────────────────────────────── */`, should **stay** — `convertLegacyVkrConditions` no longer exists (deleted in Step 5) but check with `grep -n "^function\|^/\* ───" src/components/rules/RuleCreatorPage.tsx` after this step whether anything else still sits under that header; if the file ends right after `getTriggerLabel`'s deletion, delete the header too.

- [ ] **Step 14: Update the Save button handler — read-only pass-through for non-tracking rules**

Find:
```tsx
                rulesStore.upsert({
                  id,
                  code,
                  name: ruleName,
                  description: ruleDescription || undefined,
                  area: selectedArea,
                  active,
                  priority: priority as Priority,
                  trigger: isTrackingRecords ? trackingTrigger : { kind: "condition_met", label: triggerLabel },
                  conditions: isTrackingRecords ? trackingConditionsOut : [],
                  situationId: isTrackingRecords ? selectedSituationId ?? undefined : undefined,
                  severityId: isTrackingRecords ? selectedSeverityId ?? undefined : undefined,
                  actions: isTrackingRecords
                    ? trackingActionsOut
                    : [...fulfilledActions, ...notFulfilledActions].map((a) => ({
                        id: a.id,
                        type: a.type as ActionType,
                        title: a.title,
                        vkrText: a.vkrText,
                        runWhenRouteCondition: fulfilledActions.includes(a) ? "fulfilled" : "not_fulfilled",
                      })),
                  uiState: {
                    selectedSituation,
                    selectedSituationId,
                    selectedSeverityId,
                    triggerType,
                    currentRecordConditions,
                    historyConditions,
                    deliveryMilestone,
                    checkTimes,
                    scheduleItems,
                    vkrConditions,
                    routeScope,
                    missedMilestoneType,
                    tooLongMilestone,
                    tooLongThreshold,
                    checkInterval,
                    noMovementDuration,
                    noMovementUnit,
                    severityActions,
                    fulfilledActions,
                    notFulfilledActions,
                  },
                });
```

Replace with:
```tsx
                rulesStore.upsert({
                  id,
                  code,
                  name: ruleName,
                  description: ruleDescription || undefined,
                  area: selectedArea,
                  active,
                  priority: priority as Priority,
                  trigger: isTrackingRecords ? trackingTrigger : (existingRule?.trigger ?? { kind: "condition_met", label: "—" }),
                  conditions: isTrackingRecords ? trackingConditionsOut : (existingRule?.conditions ?? []),
                  situationId: isTrackingRecords ? selectedSituationId ?? undefined : existingRule?.situationId,
                  severityId: isTrackingRecords ? selectedSeverityId ?? undefined : existingRule?.severityId,
                  actions: isTrackingRecords ? trackingActionsOut : (existingRule?.actions ?? []),
                  uiState: {
                    selectedSituationId,
                    selectedSeverityId,
                    triggerType,
                    trackingConditions,
                    noMovementDuration,
                    noMovementUnit,
                    severityActions,
                    vkrConditions,
                  },
                });
```

(Editing an existing non-tracking rule like `R10`/`R11` now only ever touches `name`/`description`/`priority`/`active` — its `trigger`/`conditions`/`actions`/`situationId`/`severityId` pass through unchanged, since there's no more UI to edit them.)

Also find, just above that same `onClick` (the local `const` computations feeding into the upsert call):
```tsx
                const trackingConditionsOut: Rule["conditions"] =
                  triggerType === "automatic"
                    ? [...currentRecordConditions, ...historyConditions]
                    : [...historyConditions];
```
Replace with:
```tsx
                const trackingConditionsOut: Rule["conditions"] = trackingConditions;
```

(Filtering out "current record" rows when `triggerType === "timer"` is now handled inside `TrackingConditionsBuilder` itself via its `allowCurrentRecord` prop — Task 8 — so nothing needs filtering again at save time; whatever rows are in `trackingConditions` are exactly what should be saved.)

- [ ] **Step 15: Verify it compiles**

Run: `npm run build`
Expected: **Fails** — the JSX in the middle column still references `TrackingConditionsBuilder` (not created yet) and the `TRACKING_FIELDS`/`TRACKING_OPERATORS` import removed in Step 1 may leave stray references if Step 1 missed something. Run `npx tsc --noEmit` and confirm every error is either about the missing `TrackingConditionsBuilder` module/import, or about the tracking_records JSX block still calling the old `CurrentRecordConditionsBuilder`/`TrackingHistoryConditionsBuilder` (both deleted from imports in Step 1) — that's expected, fixed in Task 8. Anything else is a real mistake from this task — fix it before moving on.

- [ ] **Step 16: Commit**

```bash
git add src/components/rules/RuleCreatorPage.tsx
git commit -m "refactor: remove route_compliance wizard and oblast pill bar (WIP, conditions builder follows)"
```

---

## Task 8: `TrackingConditionsBuilder` — merge current-record + history conditions into one

**Files:**
- Create: `src/components/rules/editors/TrackingConditionsBuilder.tsx`
- Delete: `src/components/rules/editors/CurrentRecordConditionsBuilder.tsx`
- Delete: `src/components/rules/editors/TrackingHistoryConditionsBuilder.tsx`
- Modify: `src/components/rules/RuleCreatorPage.tsx`

Per `docs/superpowers/specs/2026-07-16-situace-podminky-uprava-design.md` §4: one row type, one field select, and a "co platí" select with **je / není / opakuje se / bylo v historii** (the last one reveals its own nested je/není + rozsah). No `Condition` type changes needed — all three existing shapes (`field`, `tracking_aggregate` with `same_repeats`, `tracking_aggregate` with `specific`) already cover the four options exactly.

- [ ] **Step 1: Create the merged builder**

Create `src/components/rules/editors/TrackingConditionsBuilder.tsx`:

```tsx
import { Plus, X } from "lucide-react";
import { TRACKING_FIELDS, REPEATABLE_FIELDS } from "@/lib/model/trackingFields";
import { cn } from "@/lib/utils";
import type { Condition } from "@/lib/model/types";

type RowKind = "is" | "is_not" | "repeats" | "history";

function isTrackingConditionRow(c: Condition): boolean {
  return c.kind === "field" || c.kind === "tracking_aggregate";
}

function rowKindOf(c: Condition): RowKind {
  if (c.kind === "field") return c.operator === "není" ? "is_not" : "is";
  if (c.kind === "tracking_aggregate" && c.valueMode === "same_repeats") return "repeats";
  return "history";
}

export function TrackingConditionsBuilder({
  conditions,
  onChange,
  allowCurrentRecord,
}: {
  conditions: Condition[];
  onChange: (next: Condition[]) => void;
  /** false when Spouštěč = Časovač — jen "bylo v historii" dává smysl (žádný "právě příchozí" záznam). */
  allowCurrentRecord: boolean;
}) {
  const rows = conditions
    .filter(isTrackingConditionRow)
    .filter((c) => allowCurrentRecord || rowKindOf(c) === "history");

  function updateAt(index: number, next: Condition) {
    const target = rows[index];
    onChange(conditions.map((c) => (c === target ? next : c)));
  }

  function removeAt(index: number) {
    const target = rows[index];
    onChange(conditions.filter((c) => c !== target));
  }

  function addRow() {
    const next: Condition = allowCurrentRecord
      ? { kind: "field", fieldId: "derivedStatus", operator: "je", value: "" }
      : { kind: "tracking_aggregate", trackingFieldId: "derivedStatus", valueMode: "specific", expectedValue: "", mode: "contains", count: 1, occurrence: "any" };
    onChange([...conditions, next]);
  }

  function changeKind(index: number, kind: RowKind) {
    const row = rows[index];
    const fieldId = row.kind === "field" ? row.fieldId : row.trackingFieldId;
    if (kind === "is" || kind === "is_not") {
      updateAt(index, { kind: "field", fieldId, operator: kind === "is" ? "je" : "není", value: row.kind === "field" ? (row.value ?? "") : "" });
    } else if (kind === "repeats") {
      const repeatableField = REPEATABLE_FIELDS.some((f) => f.value === fieldId) ? fieldId : REPEATABLE_FIELDS[0].value;
      updateAt(index, { kind: "tracking_aggregate", trackingFieldId: repeatableField, valueMode: "same_repeats", count: 4, occurrence: "consecutive" });
    } else {
      updateAt(index, { kind: "tracking_aggregate", trackingFieldId: fieldId, valueMode: "specific", expectedValue: "", mode: "contains", count: 1, occurrence: "any" });
    }
  }

  return (
    <div className="space-y-2">
      {rows.map((row, i) => {
        const kind = rowKindOf(row);
        const fieldOptions = kind === "repeats" ? REPEATABLE_FIELDS : TRACKING_FIELDS;
        return (
          <div key={i} className="rounded-lg border border-border bg-background p-2.5 space-y-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <select
                value={row.kind === "field" ? row.fieldId : row.trackingFieldId}
                onChange={(e) => {
                  if (row.kind === "field") updateAt(i, { ...row, fieldId: e.target.value });
                  else updateAt(i, { ...row, trackingFieldId: e.target.value });
                }}
                className="rounded border border-border bg-background px-2 py-1.5 text-xs"
              >
                {fieldOptions.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
              <select
                value={kind}
                onChange={(e) => changeKind(i, e.target.value as RowKind)}
                className="rounded border border-border bg-background px-2 py-1.5 text-xs"
              >
                <option value="is">je</option>
                <option value="is_not">není</option>
                {allowCurrentRecord && <option value="repeats">opakuje se</option>}
                <option value="history">bylo v historii</option>
              </select>
              <button onClick={() => removeAt(i)} className="ml-auto text-muted-foreground hover:text-foreground">
                <X className="size-3.5" />
              </button>
            </div>

            {(kind === "is" || kind === "is_not") && row.kind === "field" && (
              <input
                value={row.value ?? ""}
                onChange={(e) => updateAt(i, { ...row, value: e.target.value })}
                placeholder="hodnota…"
                className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs"
              />
            )}

            {kind === "repeats" && row.kind === "tracking_aggregate" && (
              <div className="space-y-2">
                <div className="text-[11px] text-muted-foreground">
                  Bez konkrétní hodnoty — hlídá, že stejná hodnota se opakuje, počítaje v to i tento nový záznam.
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={2}
                    value={row.count}
                    onChange={(e) => updateAt(i, { ...row, count: Number(e.target.value) })}
                    className="w-16 rounded border border-border bg-background px-2 py-1.5 text-xs text-center"
                  />
                  <span className="text-xs text-muted-foreground">po sobě jdoucích záznamů</span>
                </div>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={row.occurrence === "consecutive"}
                    onChange={(e) => updateAt(i, { ...row, occurrence: e.target.checked ? "consecutive" : "any" })}
                  />
                  musí být nepřerušeně
                </label>
              </div>
            )}

            {kind === "history" && row.kind === "tracking_aggregate" && (
              <div className="space-y-2">
                <div className="flex gap-1">
                  <button
                    onClick={() => updateAt(i, { ...row, mode: "contains" })}
                    className={cn("rounded-md px-2 py-1 text-[11px] font-medium", (row.mode ?? "contains") === "contains" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}
                  >
                    je
                  </button>
                  <button
                    onClick={() => updateAt(i, { ...row, mode: "not_contains" })}
                    className={cn("rounded-md px-2 py-1 text-[11px] font-medium", row.mode === "not_contains" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}
                  >
                    není
                  </button>
                </div>
                <input
                  value={row.expectedValue ?? ""}
                  onChange={(e) => updateAt(i, { ...row, expectedValue: e.target.value })}
                  placeholder="hodnota…"
                  className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs"
                />
                <div className="flex items-center gap-4 text-xs flex-wrap">
                  <label className="flex items-center gap-1.5">
                    <input type="radio" checked={row.count <= 1} onChange={() => updateAt(i, { ...row, count: 1 })} />
                    v posledním záznamu
                  </label>
                  <label className={cn("flex items-center gap-1.5", row.count <= 1 && "opacity-40")}>
                    <input type="radio" checked={row.count > 1} onChange={() => updateAt(i, { ...row, count: Math.max(2, row.count) })} />
                    v posledních
                    <input
                      type="number"
                      min={2}
                      disabled={row.count <= 1}
                      value={row.count > 1 ? row.count : 2}
                      onChange={(e) => updateAt(i, { ...row, count: Math.max(2, Number(e.target.value)) })}
                      className="w-14 rounded border border-border bg-background px-1.5 py-1 text-xs text-center"
                    />
                    záznamech
                  </label>
                </div>
                <label className={cn("flex items-center gap-2 text-xs", row.count <= 1 && "opacity-40")}>
                  <input
                    type="checkbox"
                    disabled={row.count <= 1}
                    checked={row.occurrence === "consecutive"}
                    onChange={(e) => updateAt(i, { ...row, occurrence: e.target.checked ? "consecutive" : "any" })}
                  />
                  musí být nepřerušeně
                </label>
              </div>
            )}
          </div>
        );
      })}

      <button
        onClick={addRow}
        className="flex items-center gap-1 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary"
      >
        <Plus className="size-3" /> přidat podmínku
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Wire it into `RuleCreatorPage`, replacing the two old blocks**

In `src/components/rules/RuleCreatorPage.tsx`, find:
```tsx
                {triggerType === "automatic" && (
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Podmínky současného záznamu
                    </div>
                    <CurrentRecordConditionsBuilder
                      conditions={currentRecordConditions}
                      onChange={setCurrentRecordConditions}
                    />
                  </div>
                )}

                {triggerType === "timer" && (
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Zásilka nemá nový záznam déle než
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        value={noMovementDuration}
                        onChange={(e) => setNoMovementDuration(Number(e.target.value))}
                        className="w-20 rounded border border-border bg-background px-2 py-1.5 text-sm text-center"
                      />
                      <select
                        value={noMovementUnit}
                        onChange={(e) => setNoMovementUnit(e.target.value as "h" | "d" | "bd")}
                        className="rounded border border-border bg-background px-2 py-1.5 text-xs"
                      >
                        <option value="h">hodin</option>
                        <option value="d">dní</option>
                        <option value="bd">pracovních dní</option>
                      </select>
                      <span className="text-xs text-muted-foreground">od posledního záznamu</span>
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Podmínky na historii záznamů
                  </div>
                  <TrackingHistoryConditionsBuilder
                    conditions={historyConditions}
                    onChange={setHistoryConditions}
                  />
                </div>

                {/* Podmínky z ostatních entit — sdíleno pro všechny tracking situace */}
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Podmínky z ostatních entit
                  </div>
                  <div className="text-[11px] text-muted-foreground mb-2">
                    Pravidlo se uplatní jen pro zásilky odpovídající těmto podmínkám (zákazník, zásilka…).
                  </div>
                  <VkrConditionsBuilder
                    conditions={vkrConditions}
                    onChange={setVkrConditions}
                  />
                </div>
              </>
            )}
```

Replace with:
```tsx
                {triggerType === "timer" && (
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Zásilka nemá nový záznam déle než
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        value={noMovementDuration}
                        onChange={(e) => setNoMovementDuration(Number(e.target.value))}
                        className="w-20 rounded border border-border bg-background px-2 py-1.5 text-sm text-center"
                      />
                      <select
                        value={noMovementUnit}
                        onChange={(e) => setNoMovementUnit(e.target.value as "h" | "d" | "bd")}
                        className="rounded border border-border bg-background px-2 py-1.5 text-xs"
                      >
                        <option value="h">hodin</option>
                        <option value="d">dní</option>
                        <option value="bd">pracovních dní</option>
                      </select>
                      <span className="text-xs text-muted-foreground">od posledního záznamu</span>
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3 pb-2 border-b border-border">
                    Podmínky
                  </div>

                  <div className="mb-4">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Co platí o záznamech v trackingu
                    </div>
                    <TrackingConditionsBuilder
                      conditions={trackingConditions}
                      onChange={setTrackingConditions}
                      allowCurrentRecord={triggerType === "automatic"}
                    />
                  </div>

                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Co dále platí
                    </div>
                    <VkrConditionsBuilder
                      conditions={vkrConditions}
                      onChange={setVkrConditions}
                    />
                  </div>
                </div>
              </>
            )}
```

- [ ] **Step 3: Delete the two old builder files**

```bash
rm src/components/rules/editors/CurrentRecordConditionsBuilder.tsx
rm src/components/rules/editors/TrackingHistoryConditionsBuilder.tsx
```

- [ ] **Step 4: Verify it compiles**

Run: `npm run build`
Expected: Succeeds. Run `npx tsc --noEmit` and confirm **zero** errors reference `RuleCreatorPage.tsx` or `TrackingConditionsBuilder.tsx` — only the pre-existing, unrelated errors in `RoutesAndSegmentsPage.tsx`/`RuleEditor.tsx` may remain (both untouched by this plan).

- [ ] **Step 5: Commit**

```bash
git add src/components/rules/editors/TrackingConditionsBuilder.tsx src/components/rules/RuleCreatorPage.tsx
git rm src/components/rules/editors/CurrentRecordConditionsBuilder.tsx src/components/rules/editors/TrackingHistoryConditionsBuilder.tsx
git commit -m "feat: merge tracking condition blocks into one unified row builder"
```

---

## Task 9: Manual QA of Tasks 1-8

**Files:** none (verification only)

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`, open the printed local URL.

- [ ] **Step 2: Walk the flow**

1. Open `/` — confirm top nav reads "Pravidla pro tracking" (not "Konfigurátor pravidel"), "Trasy zásilek" is greyed out and unclickable, and "Situace a závažnosti" is a real, clickable nav item highlighted when active.
2. Confirm rule `R10` ("Příchod na clení neproběhl správně", area Soulad s předepsanou trasou) still shows in the list.
3. Click into `R10`'s "Upravit pravidlo" — confirm: name/description/priority/active are editable at the top; below that, the page shows "Konfigurace podmínek pro tuto oblast bude přidána později." (no crash, no leftover route_compliance UI). Change the name, save, confirm it persists and the rule's original trigger/conditions/actions are otherwise untouched (re-open and confirm nothing else changed).
4. Click "+ Nové pravidlo" — confirm there's **no** oblast picker anywhere (no pill bar), and the wizard opens straight into the tracking flow (Situace/Závažnost picker in column 1).
5. Pick a Situace + Závažnost — confirm column 2/3 prefill priority + actions, but **not** name/description (those stay empty, user must type them).
6. In column 2, confirm there's one "Podmínky" heading containing two subsections: "Co platí o záznamech v trackingu" and "Co dále platí".
7. Under "Co platí o záznamech v trackingu", add a row, confirm the "co platí" dropdown shows all 4 options (je/není/opakuje se/bylo v historii) while Spouštěč = Automaticky. Try each:
   - "je"/"není" → shows a single hodnota input.
   - "opakuje se" → shows count + "musí být nepřerušeně", field dropdown narrows to location-ish fields (Město/ID místa/Kód země).
   - "bylo v historii" → shows nested je/není + hodnota + rozsah (v posledním/v posledních N) + nepřerušeně (disabled when scope is "poslední záznam").
8. Switch Spouštěč to Časovač — confirm the "co platí" dropdown for tracking conditions now only offers "bylo v historii" (no je/není/opakuje se), and any previously-added je/není/opakuje-se rows disappear from view (not deleted from underlying data — switch back to Automaticky and confirm they reappear unchanged).
9. Add an action, fill in a name, save — confirm it navigates to `/` and the new rule appears.
10. Click "Situace a závažnosti" nav item — confirm: search box at top (no filters), each Situace is an expandable row; expand one and confirm each Závažnost shows nested, and any rule referencing that severity renders as its own card with code/name/trigger/priority/status dot (not just plain text) — click one, confirm it navigates to that rule's edit page.
11. Confirm `Trasy zásilek` really can't be clicked (no navigation happens).

- [ ] **Step 3: Fix anything that doesn't match, then re-run Step 2 from the top**

- [ ] **Step 4: Final commit (only if Step 3 required fixes)**

```bash
git add -A
git commit -m "fix: address issues found in manual QA pass"
```

---

## Task 10: `SituationsListPage` — search + expandable tree with rule detail

**Files:**
- Create: `src/lib/model/ruleDisplay.ts`
- Modify: `src/components/rules/RulesList.tsx`
- Modify: `src/components/situations/SituationsListPage.tsx`

Per `docs/superpowers/specs/2026-07-16-situace-podminky-uprava-design.md` §2: search (no filters), each Situace expandable, each Závažnost inside it shows its linked Pravidla as full detail cards (code/name/trigger/priority/status), matching `RulesList`'s row style.

- [ ] **Step 1: Extract the three small rule-display helpers so both pages can share them**

Create `src/lib/model/ruleDisplay.ts`:

```ts
export function triggerLabel(kind: string): string {
  if (kind === "condition_met") return "Podmínka";
  if (kind === "schedule") return "Časovač";
  return "Manuálně";
}

export function priorityLabel(p: string): string {
  return p.toUpperCase();
}

export function isPriorityHigh(p: string): boolean {
  return p === "high" || p === "urgent";
}
```

In `src/components/rules/RulesList.tsx`, find:
```tsx
function triggerLabel(kind: string): string {
  if (kind === "condition_met") return "Podmínka";
  if (kind === "schedule") return "Časovač";
  return "Manuálně";
}

function priorityLabel(p: string): string {
  return p.toUpperCase();
}

function isPriorityHigh(p: string): boolean {
  return p === "high" || p === "urgent";
}

export function RulesList() {
```
Replace with:
```tsx
export function RulesList() {
```

Find the import block near the top of `RulesList.tsx` and add the new import — find:
```tsx
import { useRules, rulesStore } from "@/lib/model/store";
```
Replace with:
```tsx
import { useRules, rulesStore } from "@/lib/model/store";
import { triggerLabel, priorityLabel, isPriorityHigh } from "@/lib/model/ruleDisplay";
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: Succeeds — `RulesList.tsx` now imports the three helpers instead of declaring them locally, behavior unchanged.

- [ ] **Step 3: Commit**

```bash
git add src/lib/model/ruleDisplay.ts src/components/rules/RulesList.tsx
git commit -m "refactor: extract rule display helpers to a shared module"
```

- [ ] **Step 4: Rewrite `SituationsListPage` with search + expandable tree**

Find the whole file content and replace it entirely:

```tsx
import { useState } from "react";
import { Plus, Trash2, ChevronRight, ChevronDown, Search } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { useSituations, situationsStore, useRules } from "@/lib/model/store";
import { triggerLabel, priorityLabel, isPriorityHigh } from "@/lib/model/ruleDisplay";
import { cn } from "@/lib/utils";
import type { Rule, Situation } from "@/lib/model/types";

export function SituationsListPage() {
  const situations = useSituations();
  const rules = useRules();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function createSituation() {
    const id = "sit_" + Date.now();
    situationsStore.upsert({
      id,
      code: "SIT-" + Math.floor(Math.random() * 9000 + 1000),
      name: "Nová situace",
      area: "tracking_records",
      severities: [],
    });
    navigate({ to: "/situace/$id", params: { id } });
  }

  function totalUsage(situationId: string): number {
    return rules.filter((r) => r.situationId === situationId).length;
  }

  function rulesForSeverity(severityId: string): Rule[] {
    return rules.filter((r) => r.severityId === severityId);
  }

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function matchesQuery(situation: Situation): boolean {
    const q = query.trim().toLocaleLowerCase("cs-CZ");
    if (!q) return true;
    if (situation.name.toLocaleLowerCase("cs-CZ").includes(q)) return true;
    return situation.severities.some((s) => s.name.toLocaleLowerCase("cs-CZ").includes(q));
  }

  const visible = situations.filter(matchesQuery);

  return (
    <div className="flex h-screen w-screen flex-col bg-background text-foreground">
      <AppHeader current="situace" />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl p-6">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-lg font-semibold">Situace a závažnosti</h1>
            <button
              onClick={createSituation}
              className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="size-3.5" /> Nová situace
            </button>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Šablony pro věci k řešení — každá situace má stupně závažnosti s výchozím názvem, popisem, prioritou a akcemi.
          </p>

          <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground mb-4">
            <Search size={15} className="shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Hledat situaci, závažnost…"
              className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex flex-col gap-2">
            {visible.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                {situations.length === 0 ? "Zatím žádné situace." : "Žádná situace neodpovídá hledání."}
              </p>
            ) : (
              visible.map((s) => {
                const usage = totalUsage(s.id);
                const isOpen = expanded.has(s.id);
                return (
                  <div key={s.id} className="rounded-lg border border-border overflow-hidden">
                    <div
                      onClick={() => toggleExpanded(s.id)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors cursor-pointer"
                    >
                      {isOpen ? <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" /> : <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{s.name}</div>
                        {s.description && <div className="text-xs text-muted-foreground mt-0.5">{s.description}</div>}
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {s.severities.length} {s.severities.length === 1 ? "závažnost" : "závažnosti"}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {usage} {usage === 1 ? "pravidlo" : usage < 5 ? "pravidla" : "pravidel"}
                      </span>
                      <Link
                        to="/situace/$id"
                        params={{ id: s.id }}
                        onClick={(e) => e.stopPropagation()}
                        className="shrink-0 text-xs text-primary hover:underline"
                      >
                        upravit
                      </Link>
                      <button
                        disabled={usage > 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          situationsStore.remove(s.id);
                        }}
                        title={usage > 0 ? `Používá se v ${usage} pravidlech` : "Smazat situaci"}
                        className={cn(
                          "shrink-0 rounded p-1.5 text-muted-foreground transition-colors",
                          usage > 0 ? "opacity-30 cursor-not-allowed" : "hover:text-red-500"
                        )}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>

                    {isOpen && (
                      <div className="border-t border-border bg-muted/10 px-4 py-3 space-y-3">
                        {s.severities.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic">Zatím žádné závažnosti.</p>
                        ) : (
                          s.severities.map((sev) => {
                            const sevRules = rulesForSeverity(sev.id);
                            return (
                              <div key={sev.id} className="border-l-2 border-border pl-3">
                                <div className="flex items-center gap-2 py-1">
                                  <span className="text-xs font-medium">{sev.name}</span>
                                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                    {priorityLabel(sev.priority)}
                                  </span>
                                  <span className="ml-auto text-[11px] text-muted-foreground">
                                    {sevRules.length} {sevRules.length === 1 ? "pravidlo" : sevRules.length < 5 ? "pravidla" : "pravidel"}
                                  </span>
                                </div>
                                {sevRules.map((rule) => (
                                  <Link
                                    key={rule.id}
                                    to="/rules/$ruleId/edit"
                                    params={{ ruleId: rule.id }}
                                    className="mt-1 flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2 hover:bg-muted/40 transition-colors"
                                  >
                                    <span className="font-mono text-[11px] text-muted-foreground w-9 shrink-0">{rule.code}</span>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-xs font-medium truncate">{rule.name}</div>
                                      <div className="flex gap-1.5 mt-1">
                                        <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                          {triggerLabel(rule.trigger.kind)}
                                        </span>
                                        <span
                                          className={cn(
                                            "rounded-full border border-border px-1.5 py-0.5 text-[10px] font-semibold",
                                            isPriorityHigh(rule.priority) ? "text-destructive border-destructive/30" : "text-muted-foreground"
                                          )}
                                        >
                                          {priorityLabel(rule.priority)}
                                        </span>
                                      </div>
                                    </div>
                                    <span className={cn("size-2 rounded-full shrink-0", rule.active ? "bg-emerald-500" : "bg-border")} />
                                  </Link>
                                ))}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <Link to="/" className="mt-6 inline-block text-sm text-muted-foreground hover:text-foreground">
            ← Zpět na pravidla
          </Link>
        </div>
      </div>
    </div>
  );
}
```

(Situace start **collapsed** by default. Clicking anywhere on a Situace row toggles expand/collapse, except the "upravit" link and delete button, which `stopPropagation`.)

- [ ] **Step 5: Verify it compiles**

Run: `npm run build`
Expected: Succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/components/situations/SituationsListPage.tsx
git commit -m "feat: redesign Situace list with search and expandable Situace → Závažnost → Pravidlo tree"
```

---

## Task 11: Final manual QA pass

**Files:** none (verification only)

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`, open the printed local URL.

- [ ] **Step 2: Walk the whole flow end-to-end**

1. Open `/situace` directly from the top nav — confirm search box works (type "problém", confirm only "Problém v přepravě" situace matches; clear it).
2. Expand "Problém v přepravě" — confirm 3 závažnosti show, and the one with an existing rule (e.g. "zaseknutá na místě" with `T01`) shows that rule as a full detail card (code, name, trigger badge, priority badge, active dot) — click it, confirm it opens `T01`'s edit page.
3. Confirm collapsing/re-expanding preserves the rest of the page state (search query, other rows' expand state).
4. Go back to `/`, click "+ Nové pravidlo", walk through creating a tracking rule end-to-end (situace/závažnost → spouštěč → merged podmínky → akce → save) — confirm it saves and appears in the list.
5. Re-open that new rule for editing — confirm everything reloads exactly as saved, including the merged "Podmínky" section showing the right rows in the right sub-mode (je/není/opakuje se/bylo v historii).
6. Confirm `R10`/`R11` (route_compliance) are still visible in `/` list with correct `AreaBadge` and remain read-only-except-meta when opened for editing.

- [ ] **Step 3: Fix anything that doesn't match, then re-run Step 2 from the top**

- [ ] **Step 4: Final commit (only if Step 3 required fixes)**

```bash
git add -A
git commit -m "fix: address issues found in final manual QA pass"
```
