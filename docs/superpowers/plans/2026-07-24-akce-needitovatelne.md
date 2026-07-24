# Akce na pravidle jsou needitovatelné — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the "Akce" column in the rule wizard (`RuleCreatorPage`) read-only — actions are always the live set from the selected Závažnost, never an independently editable copy — and make every other place in the app that displays a rule's actions read the same live source, per `docs/superpowers/specs/2026-07-24-akce-needitovatelne-design.md`.

**Architecture:** Pure frontend prototype (Vite + TanStack Router + React, in-memory stores with optional localStorage persistence, Tailwind/shadcn). Add one new resolver function, `resolveRuleActions(rule)`, that returns a `Rule`'s actions either live from its linked `Severity` (when `rule.severityId` is set) or from the rule's own stored `actions` (fallback for non-tracking areas). Every display site swaps `rule.actions` for `resolveRuleActions(rule)`. The wizard's right column drops its local editable state entirely and renders `Severity.actions` directly.

**Tech Stack:** TypeScript, React 19, TanStack Router (file-based routes), Tailwind CSS v4 + shadcn/radix primitives, lucide-react icons. No test runner is configured in this repo (no vitest/jest, no `*.test.*` files) — this is a rapid client-facing prototype. Verification for every task is **`npm run build`** (catches type errors) plus a manual click-through in the browser dev server.

---

## Important context for the engineer

- **`src/components/vkr/RuleDetailPanel.tsx` and `src/components/vkr/RulesTable.tsx` are dead code, do not touch them.** They import `Rule`/`Action` from `@/lib/vkr/types` — a completely different, legacy data model, not the one this plan touches (`@/lib/model/types`). Confirmed via `grep -rln "RuleDetailPanel\|RulesTable" src/routes src/components` — nothing outside their own files imports them. The route `/test` (`src/routes/test.tsx`) renders `TestPanel` (`src/components/test/TestPanel.tsx`), which is a separate component using the correct `@/lib/model` store and has its own local `OutcomeCard`/`stubLines` — that's the one real consumer under `/test`.
- **Real, live consumers of `rule.actions` in the current `@/lib/model` system** (the only ones this plan touches): `src/components/rules/RuleCreatorPage.tsx` (the wizard itself), `src/components/rules/RulesList.tsx:369` (action badges in the rule detail drawer), `src/components/test/TestPanel.tsx:39` (dry-run stub title).
- `Severity` (in `src/lib/model/types.ts`) has **no** `vkrTitle`/`vkrDescription` fields — only `id`, `name`, `priority`, `actions: SeverityAction[]`. Don't reintroduce those; the current implementation already diverged from the original 2026-07-15 spec on that point and this plan doesn't touch it.
- `seed.ts` has several tracking rules whose `uiState` object contains a stray `severityActions: [...]` key (e.g. `rule_t03`, `rule_t04`). `uiState` is typed as `Record<string, unknown>`, so this is harmless dead data after this plan — **do not edit `seed.ts`**, it's out of scope and the stray key causes no type error.
- Reminder: **"Živý odkaz"** means the wizard and every display site always show the *current* state of `Severity.actions`, looked up via `rule.severityId` — not a snapshot taken when the rule was last saved. If a severity's actions are edited later in `/situace`, every rule pointing at it reflects that change immediately, everywhere.

---

## Task 1: `resolveRuleActions` resolver + `findSeverityById` store helper

**Files:**
- Modify: `src/lib/model/store.ts`
- Modify: `src/lib/model/ruleDisplay.ts`

- [ ] **Step 1: Add `findSeverityById` to `store.ts`**

Find (in `src/lib/model/store.ts`):
```ts
import type { ActionTag, CheckpointType, Route, Rule, SampleShipment, Segment, Situation } from "./types";
```

Replace with:
```ts
import type { ActionTag, CheckpointType, Route, Rule, SampleShipment, Segment, Severity, Situation } from "./types";
```

Find:
```ts
/** Kolik pravidel je navázáno na danou závažnost — použij pro guard při mazání. */
export function severityUsageCount(severityId: string): number {
  return _rules.getState().filter((r) => r.severityId === severityId).length;
}
```

Replace with:
```ts
/** Kolik pravidel je navázáno na danou závažnost — použij pro guard při mazání. */
export function severityUsageCount(severityId: string): number {
  return _rules.getState().filter((r) => r.severityId === severityId).length;
}

/** Najde Závažnost podle id napříč všemi Situacemi. */
export function findSeverityById(severityId: string): Severity | undefined {
  for (const situation of _situations.getState()) {
    const severity = situation.severities.find((s) => s.id === severityId);
    if (severity) return severity;
  }
  return undefined;
}
```

- [ ] **Step 2: Add `resolveRuleActions` to `ruleDisplay.ts`**

Find (entire current file `src/lib/model/ruleDisplay.ts`):
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

Replace with:
```ts
import { findSeverityById } from "./store";
import type { Action, Rule } from "./types";

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

/**
 * Needitovatelné akce navázané na pravidlo. Pokud má pravidlo severityId, vrací VŽDY
 * aktuální akce ze Závažnosti (živý odkaz — viz docs/superpowers/specs/2026-07-24-akce-needitovatelne-design.md),
 * ne uloženou kopii. Bez severityId (ostatní oblasti mimo tracking) padá zpět na rule.actions.
 */
export function resolveRuleActions(rule: Rule): Action[] {
  if (rule.severityId) {
    const severity = findSeverityById(rule.severityId);
    if (severity) {
      return severity.actions.map((a) => ({
        id: a.id,
        type: "create_vkr",
        title: rule.name,
        vkrText: a.description || undefined,
        actionTagId: a.actionTagId,
      }));
    }
  }
  return rule.actions;
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: Succeeds. `resolveRuleActions` isn't called anywhere yet, so this only checks its own types.

- [ ] **Step 4: Commit**

```bash
git add src/lib/model/store.ts src/lib/model/ruleDisplay.ts
git commit -m "feat: add resolveRuleActions — live rule actions from linked Severity"
```

---

## Task 2: Wire `resolveRuleActions` into `RulesList.tsx` and `TestPanel.tsx`

**Files:**
- Modify: `src/components/rules/RulesList.tsx:9,369`
- Modify: `src/components/test/TestPanel.tsx:5,39`

- [ ] **Step 1: `RulesList.tsx` — import and use the resolver**

Find:
```ts
import { triggerLabel, priorityLabel, isPriorityHigh } from "@/lib/model/ruleDisplay";
```

Replace with:
```ts
import { triggerLabel, priorityLabel, isPriorityHigh, resolveRuleActions } from "@/lib/model/ruleDisplay";
```

Find (inside `RuleSummaryTab`):
```tsx
      <SummarySection label="Akce">
        <div className="space-y-2">
          {rule.actions.map((a) => (
```

Replace with:
```tsx
      <SummarySection label="Akce">
        <div className="space-y-2">
          {resolveRuleActions(rule).map((a) => (
```

- [ ] **Step 2: `TestPanel.tsx` — import and use the resolver**

Find:
```ts
import { useSampleShipments, useRules } from "@/lib/model/store";
```

Replace with:
```ts
import { useSampleShipments, useRules } from "@/lib/model/store";
import { resolveRuleActions } from "@/lib/model/ruleDisplay";
```

Find:
```ts
  const vkrTitle = rule.actions[0]?.title ?? rule.name;
```

Replace with:
```ts
  const vkrTitle = resolveRuleActions(rule)[0]?.title ?? rule.name;
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: Succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/rules/RulesList.tsx src/components/test/TestPanel.tsx
git commit -m "feat: read rule actions via resolveRuleActions in RulesList and TestPanel"
```

---

## Task 3: Rework `RuleCreatorPage.tsx` — read-only Akce sourced live from Severity

**Files:**
- Modify: `src/components/rules/RuleCreatorPage.tsx`

This removes `SeverityActionRow`, the `severityActions` state, and every place that reads/writes it, leaving `selectedSeverityObj` (already computed in the file) as the only source for the right column. One task, one commit at the end — the intermediate steps don't compile in isolation because the state removal (steps 1-4) and its remaining call sites (steps 5-7) are two ends of the same edit.

- [ ] **Step 1: Drop the `SeverityActionRow` interface and the `severityActions` field on `RuleCreatorUiState`**

Find:
```ts
type TrackingTriggerType = "automatic" | "timer";

interface SeverityActionRow {
  id: string;
  actionTagId: string;
  enabled: boolean;
  description: string;
}

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

Replace with:
```ts
type TrackingTriggerType = "automatic" | "timer";

interface RuleCreatorUiState {
  selectedSituationId: string | null;
  selectedSeverityId: string | null;
  triggerType: TrackingTriggerType;
  trackingConditions: Condition[];
  noMovementDuration: number;
  noMovementUnit: "h" | "d" | "bd";
  vkrConditions: VkrCondition[];
}
```

- [ ] **Step 2: Delete `severityActionRowsFromRule` and its use in `getInitialFormState`**

Find:
```ts
function severityActionRowsFromRule(rule?: Rule): SeverityActionRow[] {
  if (!rule || rule.area !== "tracking_records") return [];
  return rule.actions
    .filter((a) => a.actionTagId)
    .map((a) => ({ id: a.id, actionTagId: a.actionTagId!, enabled: true, description: a.vkrText ?? "" }));
}

function getInitialFormState(rule?: Rule): RuleCreatorInitialState {
```

Replace with:
```ts
function getInitialFormState(rule?: Rule): RuleCreatorInitialState {
```

Find:
```ts
    noMovementDuration: ui.noMovementDuration ?? 72,
    noMovementUnit: ui.noMovementUnit ?? "h",
    severityActions: ui.severityActions ?? severityActionRowsFromRule(rule),
    vkrConditions: (ui.vkrConditions as VkrCondition[] | undefined) ?? [],
```

Replace with:
```ts
    noMovementDuration: ui.noMovementDuration ?? 72,
    noMovementUnit: ui.noMovementUnit ?? "h",
    vkrConditions: (ui.vkrConditions as VkrCondition[] | undefined) ?? [],
```

- [ ] **Step 3: Remove the `severityActions` state and its sync in the reset `useEffect`**

Find:
```ts
  const [noMovementUnit, setNoMovementUnit] = useState<"h" | "d" | "bd">(initialState.noMovementUnit);
  const [severityActions, setSeverityActions] = useState<SeverityActionRow[]>(initialState.severityActions);
  const [ruleName, setRuleName] = useState(initialState.ruleName);
```

Replace with:
```ts
  const [noMovementUnit, setNoMovementUnit] = useState<"h" | "d" | "bd">(initialState.noMovementUnit);
  const [ruleName, setRuleName] = useState(initialState.ruleName);
```

Find:
```ts
    setNoMovementUnit(initialState.noMovementUnit);
    setSeverityActions(initialState.severityActions);
    setRuleName(initialState.ruleName);
```

Replace with:
```ts
    setNoMovementUnit(initialState.noMovementUnit);
    setRuleName(initialState.ruleName);
```

- [ ] **Step 4: Simplify `applySeverityTemplate` — drop the actions copy, keep the priority prefill**

Find:
```ts
  function applySeverityTemplate(severity: Severity) {
    setPriority(severity.priority);
    setSeverityActions(
      severity.actions.map((a) => ({ id: a.id, actionTagId: a.actionTagId, enabled: true, description: a.description ?? "" }))
    );
  }
```

Replace with:
```ts
  function applySeverityTemplate(severity: Severity) {
    setPriority(severity.priority);
  }
```

- [ ] **Step 5: Replace the `trackingActionsOut` computation in the save handler**

Find:
```ts
                const trackingActionsOut: Rule["actions"] = severityActions
                  .filter((a) => a.enabled)
                  .map((a) => ({
                    id: a.id,
                    type: "create_vkr",
                    title: ruleName,
                    vkrText: a.description || undefined,
                    actionTagId: a.actionTagId,
                  }));
```

Replace with:
```ts
                const trackingActionsOut: Rule["actions"] = (selectedSeverityObj?.actions ?? []).map((a) => ({
                  id: a.id,
                  type: "create_vkr",
                  title: ruleName,
                  vkrText: a.description || undefined,
                  actionTagId: a.actionTagId,
                }));
```

- [ ] **Step 6: Drop `severityActions` from the saved `uiState`**

Find:
```ts
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
```

Replace with:
```ts
                  uiState: {
                    selectedSituationId,
                    selectedSeverityId,
                    triggerType,
                    trackingConditions,
                    noMovementDuration,
                    noMovementUnit,
                    vkrConditions,
                  },
```

- [ ] **Step 7: Drop the now-unused `ActionTagPicker`/`X` imports**

Find:
```ts
import { useEffect, useMemo, useState } from "react";
import { Lock, X } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { Textarea } from "@/components/ui/textarea";
import { useRules, rulesStore, useSituations, useActionTags } from "@/lib/model/store";
import { cn } from "@/lib/utils";
import type { Area, Priority, Rule, Situation, Severity, Condition } from "@/lib/model/types";
import { VkrConditionsBuilder } from "@/components/rules/editors/VkrConditionsBuilder";
import type { VkrCondition } from "@/lib/vkr/vkrConditionCatalog";
import { TrackingIncomingConditionsBuilder } from "@/components/rules/editors/TrackingIncomingConditionsBuilder";
import { TrackingHistoricalConditionsBuilder } from "@/components/rules/editors/TrackingHistoricalConditionsBuilder";
import { isHistoricalConditionRow } from "@/lib/model/trackingFields";
import { ActionTagPicker } from "@/components/situations/ActionTagPicker";
```

Replace with:
```ts
import { useEffect, useMemo, useState } from "react";
import { Lock } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { Textarea } from "@/components/ui/textarea";
import { useRules, rulesStore, useSituations, useActionTags } from "@/lib/model/store";
import { cn } from "@/lib/utils";
import type { Area, Priority, Rule, Situation, Severity, Condition } from "@/lib/model/types";
import { VkrConditionsBuilder } from "@/components/rules/editors/VkrConditionsBuilder";
import type { VkrCondition } from "@/lib/vkr/vkrConditionCatalog";
import { TrackingIncomingConditionsBuilder } from "@/components/rules/editors/TrackingIncomingConditionsBuilder";
import { TrackingHistoricalConditionsBuilder } from "@/components/rules/editors/TrackingHistoricalConditionsBuilder";
import { isHistoricalConditionRow } from "@/lib/model/trackingFields";
```

(`Textarea` stays — it's still used for the rule's own Popis field in the middle column.)

- [ ] **Step 8: Remove the helper note paragraph under the Závažnost picker in the left column**

Find:
```tsx
                {selectedSituationObj && (
                  <>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Závažnost</div>
                    <div className="flex flex-col gap-1.5">
                      {selectedSituationObj.severities.map((sev) => {
                        const isSelected = selectedSeverityId === sev.id;
                        return (
                          <button
                            key={sev.id}
                            onClick={() => handleSelectSeverity(sev)}
                            className={cn(
                              "rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors",
                              isSelected
                                ? "border-primary bg-primary-soft/40 text-primary"
                                : "border-border hover:border-primary/30 hover:bg-muted/30 text-foreground"
                            )}
                          >
                            {sev.name}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-3 text-[10px] italic text-muted-foreground leading-relaxed">
                      Předvyplní prioritu a akce vpravo — dál nezávisle editovatelné.
                    </p>
                  </>
                )}
```

Replace with:
```tsx
                {selectedSituationObj && (
                  <>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Závažnost</div>
                    <div className="flex flex-col gap-1.5">
                      {selectedSituationObj.severities.map((sev) => {
                        const isSelected = selectedSeverityId === sev.id;
                        return (
                          <button
                            key={sev.id}
                            onClick={() => handleSelectSeverity(sev)}
                            className={cn(
                              "rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors",
                              isSelected
                                ? "border-primary bg-primary-soft/40 text-primary"
                                : "border-border hover:border-primary/30 hover:bg-muted/30 text-foreground"
                            )}
                          >
                            {sev.name}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
```

- [ ] **Step 9: Replace the entire right column with a read-only list**

Find:
```tsx
        {/* RIGHT COLUMN — Akce */}
        <div className="flex w-[340px] shrink-0 flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Akce</div>


            {isTrackingRecords && (
              <div className="space-y-2">
                {severityActions.map((row) => {
                  const tag = actionTags.find((t) => t.id === row.actionTagId);
                  return (
                    <div key={row.id} className="rounded-lg border border-border bg-background p-2.5">
                      <div className="flex items-center gap-2 mb-1.5">
                        <input
                          type="checkbox"
                          checked={row.enabled}
                          onChange={(e) =>
                            setSeverityActions((prev) => prev.map((a) => (a.id === row.id ? { ...a, enabled: e.target.checked } : a)))
                          }
                        />
                        <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary flex-1">
                          {tag?.label ?? row.actionTagId}
                        </span>
                        <button
                          onClick={() => setSeverityActions((prev) => prev.filter((a) => a.id !== row.id))}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                      <Textarea
                        value={row.description}
                        onChange={(e) =>
                          setSeverityActions((prev) => prev.map((a) => (a.id === row.id ? { ...a, description: e.target.value } : a)))
                        }
                        placeholder="Co má operátor udělat…"
                        rows={2}
                        className="resize-none text-xs"
                        disabled={!row.enabled}
                      />
                    </div>
                  );
                })}
                <ActionTagPicker
                  excludeIds={severityActions.map((a) => a.actionTagId)}
                  onPick={(tag) =>
                    setSeverityActions((prev) => [...prev, { id: "sa_" + Date.now(), actionTagId: tag.id, enabled: true, description: "" }])
                  }
                />
              </div>
            )}

            {!isTrackingRecords && (
              <div className="rounded-xl border border-dashed border-border p-8 text-center">
                <div className="text-sm text-muted-foreground">Pro tuto oblast se akce nekonfigurují přes wizard.</div>
              </div>
            )}
          </div>
        </div>
```

Replace with:
```tsx
        {/* RIGHT COLUMN — Akce (needitovatelné, jen zobrazení ze Závažnosti) */}
        <div className="flex w-[340px] shrink-0 flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Akce</div>

            {isTrackingRecords && !selectedSeverityObj && (
              <div className="rounded-xl border border-dashed border-border p-8 text-center">
                <div className="text-sm text-muted-foreground">Vyber situaci a závažnost v levém sloupci.</div>
              </div>
            )}

            {isTrackingRecords && selectedSeverityObj && selectedSeverityObj.actions.length === 0 && (
              <div className="rounded-xl border border-dashed border-border p-8 text-center">
                <div className="text-sm text-muted-foreground">Tato závažnost nemá žádné výchozí akce.</div>
              </div>
            )}

            {isTrackingRecords && selectedSeverityObj && selectedSeverityObj.actions.length > 0 && (
              <div className="space-y-2">
                {selectedSeverityObj.actions.map((a) => {
                  const tag = actionTags.find((t) => t.id === a.actionTagId);
                  return (
                    <div key={a.id} className="rounded-lg border border-border bg-muted/20 p-2.5">
                      <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary">
                        {tag?.label ?? a.actionTagId}
                      </span>
                      {a.description && (
                        <p className="mt-1.5 rounded-md bg-muted/30 px-2 py-1.5 text-xs text-muted-foreground">
                          {a.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {!isTrackingRecords && (
              <div className="rounded-xl border border-dashed border-border p-8 text-center">
                <div className="text-sm text-muted-foreground">Pro tuto oblast se akce nekonfigurují přes wizard.</div>
              </div>
            )}
          </div>
        </div>
```

- [ ] **Step 10: Verify it compiles**

Run: `npm run build`
Expected: Succeeds — no more references to `severityActions`, `setSeverityActions`, `ActionTagPicker`, or the removed `X` import remain.

- [ ] **Step 11: Commit**

```bash
git add src/components/rules/RuleCreatorPage.tsx
git commit -m "feat: make Akce column in rule wizard read-only, sourced live from Severity"
```

---

## Task 4: Manual verification in the browser

**Files:** none (verification only)

- [ ] **Step 1: Start the dev server and open the wizard**

Run: `npm run dev`, open `/rules/new/`.

- [ ] **Step 2: Confirm the wizard behavior**

- Select Situace "Nedoručeno", Závažnost "problémové". Right column should show 2 read-only action cards (`Informovat e-mailem`, `Prověřit u dopravce`), each with a static muted description block, no checkboxes, no delete buttons, no "+ Přidat akci" control.
- Confirm the left column no longer shows the "Předvyplní prioritu a akce vpravo…" note under the Závažnost buttons.
- Fill in a rule name, save. Go back to `/`, open the new rule's detail drawer (via `RulesList`) — confirm the same 2 actions show up in its "Akce" section.

- [ ] **Step 3: Confirm the live-link behavior end to end**

- Go to `/situace`, open "Nedoručeno", edit the description text of one action under "problémové" (or remove one action).
- Go back to `/`, reopen the rule saved in Step 2 (both its `RulesList` detail drawer, and re-open it in the wizard via "Upravit"). Confirm the action list reflects the edit/removal immediately, in both places.
- Open `/test`, select the same rule, run "Otestovat" — confirm the dry-run title line still resolves sensibly (uses the rule name via `resolveRuleActions(rule)[0]?.title`).

- [ ] **Step 4: Confirm existing seeded rules still render**

- Open `/` (`RulesList`) and check a couple of the seeded tracking rules (e.g. `T01`, `T04` — `T04` has `actions: []` in seed data but a `severityId`) — their detail drawers should show actions resolved live from their linked Severity, not an empty list.

No commit for this task — it's verification only.
