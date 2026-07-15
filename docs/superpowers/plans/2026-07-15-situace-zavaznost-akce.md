# Situace, Závažnost a Akce — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Situace/Závažnost/Akce entities to the tracking-rules configurator, rework the rule wizard's layout and condition builders around them, and add a settings area to manage them — per `docs/superpowers/specs/2026-07-15-situace-zavaznost-akce-design.md`.

**Architecture:** Pure frontend prototype (Vite + TanStack Router + React, in-memory stores with optional localStorage persistence, Tailwind/shadcn). New entities follow the exact same store/seed pattern already used for `Route`/`Segment`/`CheckpointType`. `RuleCreatorPage.tsx` (the existing all-in-one wizard for `/rules/new/` and `/rules/$ruleId/edit`) is reworked in place — no new wizard component. A new `/situace` + `/situace/$id` area (modeled directly on `RoutesAndSegmentsPage`/`RouteEditorPage`) manages the new catalogs.

**Tech Stack:** TypeScript, React 19, TanStack Router (file-based routes), Tailwind CSS v4 + shadcn/radix primitives, lucide-react icons. No test runner is configured in this repo (no vitest/jest, no `*.test.*` files exist) — this is a rapid client-facing prototype, not a tested production app. Verification for every task is **`npm run build`** (catches type errors — the closest thing to an automated check this repo has) plus a manual click-through in the browser dev server, matching how every existing feature in this codebase has been built and verified so far. Do not introduce a test framework as part of this plan — that would be a bigger, unrelated decision for the user to make separately.

---

## Important context for the engineer

- **`src/components/rules/AreaPicker.tsx`, `src/components/rules/RuleEditor.tsx`, and the route `src/routes/rules.new.edit.tsx` are dead code.** They were an earlier two-step wizard, superseded by `RuleCreatorPage.tsx` (which now does area + situace + conditions + actions + save in one page, reachable only at `/rules/new/` and `/rules/$ruleId/edit`). Confirmed via `grep` — nothing navigates to `/rules/new/edit` anymore, and `RuleEditor`'s "Uložit pravidlo" button has no `onClick`. **Do not touch these three files** — they're out of scope for this plan (flag for cleanup separately if the user wants).
- The existing `VKR_CONDITION_CATALOG` (`src/lib/vkr/vkrConditionCatalog.ts`) currently has a "Historie trackingu" category (`tracking_history.*` fields) bolted onto the generic `VkrConditionsBuilder`. This plan removes that category — it's superseded by the new dedicated `TrackingHistoryConditionsBuilder` (Task 5).
- There is a **naming collision**: `RuleCreatorPage.tsx` already declares a local UI-only type `type Situation = "delivery_day" | "unexpected_location" | "missed_milestone" | "other"` used for the `route_compliance` area's situation cards. This plan imports the new model entity `Situation` (Situace) into the same file, so the local type must be renamed to `RouteUiSituation` first (Task 12) to avoid a collision. This rename does not change any behavior — it only touches type annotations.
- Reminder: **"Spouštěč"** = 2 types now (`automatic` | `timer`), not the old 3-card picker. **"Situace"** in this plan always means the new business-classification entity, never the old trigger cards.

---

## Task 1: Extend data model types

**Files:**
- Modify: `src/lib/model/types.ts`

- [ ] **Step 1: Add the `VkrCondition` import and new entity types**

At the top of the file, add the import (the file currently has zero imports):

```ts
import type { VkrCondition } from "@/lib/vkr/vkrConditionCatalog";

export type Area = "tracking_records" | "route_compliance" | "order_eval" | "unpickup" | "params_price";
```

Then, after the existing `Condition` type union, extend the `tracking_aggregate` variant with a `mode` field (this is the only change to `Condition` — it's additive and optional, so nothing that constructs a `tracking_aggregate` condition today needs to change):

Find:
```ts
export type Condition =
  | { kind: "field"; fieldId: string; operator: string; value?: string }
  | { kind: "tracking_aggregate"; trackingFieldId: string; valueMode: "same_repeats" | "specific"; expectedValue?: string; count: number; occurrence: "consecutive" | "any" }
  | { kind: "route_compliance"; mode: "checkpoint_type" | "general"; checkpointTypeId?: string; generalCheck?: "unrecognized_location" | "unrecognized_status" };
```

Replace with:
```ts
export type Condition =
  | { kind: "field"; fieldId: string; operator: string; value?: string }
  | {
      kind: "tracking_aggregate";
      trackingFieldId: string;
      valueMode: "same_repeats" | "specific";
      expectedValue?: string;
      /** "contains" (default) = Obsahuje, "not_contains" = Neobsahuje. Only meaningful when valueMode is "specific". */
      mode?: "contains" | "not_contains";
      count: number;
      occurrence: "consecutive" | "any";
    }
  | { kind: "route_compliance"; mode: "checkpoint_type" | "general"; checkpointTypeId?: string; generalCheck?: "unrecognized_location" | "unrecognized_status" };
```

- [ ] **Step 2: Extend `Action` and `Rule`, add the new Situace/Závažnost/Akce entities**

Find:
```ts
export type ActionType = "create_vkr" | "send_email" | "set_field" | "change_phase" | "update_vkr" | "add_note" | "request_field_from_operator";
export interface Action {
  id: string; type: ActionType;
  runWhenRouteCondition?: "fulfilled" | "not_fulfilled";
  title?: string; body?: string; fieldId?: string; value?: string; priority?: Priority;
  vkrText?: string; // Text věci k řešení (volitelný popis akce pro operátora)
}

export interface Rule {
  id: string; code: string; name: string; area: Area; active: boolean; priority: Priority;
  description?: string;
  trigger: { kind: TriggerKind; label: string };
  conditions: Condition[];
  actions: Action[];
  // Volitelný snapshot UI stavu z RuleCreatorPage, slouží k prefillu při editaci.
  uiState?: Record<string, unknown>;
}
```

Replace with:
```ts
export type ActionType = "create_vkr" | "send_email" | "set_field" | "change_phase" | "update_vkr" | "add_note" | "request_field_from_operator";
export interface Action {
  id: string; type: ActionType;
  runWhenRouteCondition?: "fulfilled" | "not_fulfilled";
  title?: string; body?: string; fieldId?: string; value?: string; priority?: Priority;
  vkrText?: string; // Text věci k řešení (volitelný popis akce pro operátora)
  /** Pro akce vzniklé z katalogu Akcí (tracking_records) — odkaz na ActionTag. */
  actionTagId?: string;
}

export interface Rule {
  id: string; code: string; name: string; area: Area; active: boolean; priority: Priority;
  description?: string;
  trigger: { kind: TriggerKind; label: string };
  conditions: Condition[];
  actions: Action[];
  // Volitelný snapshot UI stavu z RuleCreatorPage, slouží k prefillu při editaci.
  uiState?: Record<string, unknown>;
  /** Odkaz na Situaci/Závažnost — jen pro klasifikaci a zobrazení. Needitovatelné po založení pravidla. */
  situationId?: string;
  severityId?: string;
}

// ---------------------------------------------------------------------------
// Situace / Závažnost / Akce
// ---------------------------------------------------------------------------

/** Jednoduchý tag z katalogu Akcí — zatím bez vlastního chování (viz spec 3.3). */
export interface ActionTag {
  id: string;
  label: string;
  icon?: string; // lucide icon name
}

/** Jedna akce přiřazená k závažnosti — výchozí text/podmínka pro tento kontext. */
export interface SeverityAction {
  id: string;
  actionTagId: string;
  description?: string;
  condition?: VkrCondition[];
}

/** Úroveň uvnitř Situace — nese výchozí šablonu VkŘ. */
export interface Severity {
  id: string;
  name: string;
  vkrTitle: string;
  vkrDescription?: string;
  priority: Priority;
  actions: SeverityAction[];
}

/** Byznysová kategorie (např. "Nedoručeno"). */
export interface Situation {
  id: string;
  code: string;
  name: string;
  description?: string;
  area: Area;
  severities: Severity[];
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: Succeeds (this step only adds types — nothing references them yet, so no other file should break). If it errors, check the `import type` line was placed before the first `export`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/model/types.ts
git commit -m "feat: add Situace/Závažnost/Akce types and extend Rule/Action/Condition"
```

---

## Task 2: Extract shared tracking field catalogs

**Files:**
- Create: `src/lib/model/trackingFields.ts`
- Modify: `src/components/rules/RuleCreatorPage.tsx:50-66`

- [ ] **Step 1: Create the shared catalog file**

`RuleCreatorPage.tsx` currently defines `TRACKING_FIELDS` and `TRACKING_OPERATORS` as local consts (lines 50-66). The two new condition builders (Tasks 7-8) need the same field list, so extract it to a shared module first.

```ts
export interface TrackingFieldDef {
  value: string;
  label: string;
  group: string;
}

export const TRACKING_FIELDS: TrackingFieldDef[] = [
  { value: "eventType", label: "Typ záznamu (eventType)", group: "Typ a status" },
  { value: "derivedStatus", label: "Odvozený status", group: "Typ a status" },
  { value: "derivedStatusCode", label: "Kód odvozeného statusu", group: "Typ a status" },
  { value: "eventDescription", label: "Popis události", group: "Typ a status" },
  { value: "exceptionCode", label: "Kód výjimky", group: "Výjimka" },
  { value: "exceptionDescription", label: "Popis výjimky", group: "Výjimka" },
  { value: "locationType", label: "Typ místa", group: "Lokace" },
  { value: "locationId", label: "ID místa", group: "Lokace" },
  { value: "city", label: "Město", group: "Lokace" },
  { value: "countryCode", label: "Kód země", group: "Lokace" },
  { value: "postalCode", label: "PSČ", group: "Lokace" },
  { value: "deliveryAttempts", label: "Počet pokusů o doručení", group: "Doručení" },
  { value: "eventTime", label: "Čas záznamu (eventTime)", group: "Čas" },
];

/** Podmnožina polí, u kterých dává smysl "stejná hodnota se opakuje" (režim Opakuje se). */
export const REPEATABLE_FIELDS: TrackingFieldDef[] = TRACKING_FIELDS.filter((f) =>
  ["locationId", "city", "countryCode"].includes(f.value)
);

export const TRACKING_OPERATORS = ["je jedním z", "není žádným z", "je", "není", "obsahuje", "je větší než", "je menší nebo rovno"];

/** Zjednodušené operátory pro "Podmínky současného záznamu" → režim Shoda hodnoty. */
export const SIMPLE_OPERATORS = ["je", "není"];
```

- [ ] **Step 2: Update `RuleCreatorPage.tsx` to import from the new file**

Find (lines 50-66):
```ts
const TRACKING_FIELDS: { value: string; label: string; group: string }[] = [
  { value: "eventType", label: "Typ záznamu (eventType)", group: "Typ a status" },
  { value: "derivedStatus", label: "Odvozený status", group: "Typ a status" },
  { value: "derivedStatusCode", label: "Kód odvozeného statusu", group: "Typ a status" },
  { value: "eventDescription", label: "Popis události", group: "Typ a status" },
  { value: "exceptionCode", label: "Kód výjimky", group: "Výjimka" },
  { value: "exceptionDescription", label: "Popis výjimky", group: "Výjimka" },
  { value: "locationType", label: "Typ místa", group: "Lokace" },
  { value: "locationId", label: "ID místa", group: "Lokace" },
  { value: "city", label: "Město", group: "Lokace" },
  { value: "countryCode", label: "Kód země", group: "Lokace" },
  { value: "postalCode", label: "PSČ", group: "Lokace" },
  { value: "deliveryAttempts", label: "Počet pokusů o doručení", group: "Doručení" },
  { value: "eventTime", label: "Čas záznamu (eventTime)", group: "Čas" },
];

const TRACKING_OPERATORS = ["je jedním z", "není žádným z", "je", "není", "obsahuje", "je větší než", "je menší nebo rovno"];
```

Replace with nothing (delete these lines entirely). Then add this import near the top of the file, next to the other `@/lib/model/...` imports:

```ts
import { TRACKING_FIELDS, TRACKING_OPERATORS } from "@/lib/model/trackingFields";
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: Succeeds — `TrackingFieldSelect` and `TrackingConditionBuilder` (further down in the file) already reference `TRACKING_FIELDS`/`TRACKING_OPERATORS` by name, so the import satisfies them unchanged.

- [ ] **Step 4: Commit**

```bash
git add src/lib/model/trackingFields.ts src/components/rules/RuleCreatorPage.tsx
git commit -m "refactor: extract tracking field catalog to shared module"
```

---

## Task 3: Seed data for Akce and Situace

**Files:**
- Modify: `src/lib/model/seed.ts`

- [ ] **Step 1: Add imports**

Find:
```ts
import type {
  CheckpointType,
  Route,
  Rule,
  SampleShipment,
  Segment,
} from "./types";
```

Replace with:
```ts
import type {
  ActionTag,
  CheckpointType,
  Route,
  Rule,
  SampleShipment,
  Segment,
  Situation,
} from "./types";
```

- [ ] **Step 2: Add `ACTION_TAGS` and `SITUATIONS`, and link `rule_t01` to a severity**

Add this new section anywhere after the `CHECKPOINT_TYPES` block (e.g. right before `// Segments`):

```ts
// ---------------------------------------------------------------------------
// Action Tags (katalog Akcí)
// ---------------------------------------------------------------------------
export const ACTION_TAGS: ActionTag[] = [
  { id: "at_call_customer", label: "Zavolat zákazníkovi", icon: "Phone" },
  { id: "at_email_customer", label: "Informovat e-mailem", icon: "Mail" },
  { id: "at_check_carrier", label: "Prověřit u dopravce", icon: "Search" },
  { id: "at_shift_date", label: "Posunout datum doručení", icon: "CalendarClock" },
];

// ---------------------------------------------------------------------------
// Situace (3 situace, 7 závažností — viz spec bod 7)
// ---------------------------------------------------------------------------
export const SITUATIONS: Situation[] = [
  {
    id: "sit_undelivered",
    code: "SIT-UNDELIVERED",
    name: "Nedoručeno",
    description: "Zásilka byla doručována, ale příjemce nebyl zastižen.",
    area: "tracking_records",
    severities: [
      {
        id: "sev_undelivered_normal",
        name: "běžné",
        vkrTitle: "Nedoručeno — informovat zákazníka",
        vkrDescription: "Zásilka byla doručována, příjemce nebyl zastižen (1. pokus).",
        priority: "low",
        actions: [
          { id: "sa_undelivered_normal_1", actionTagId: "at_email_customer", description: "Informuj zákazníka o neúspěšném pokusu a domluv nový termín." },
        ],
      },
      {
        id: "sev_undelivered_problem",
        name: "problémové",
        vkrTitle: "Nedoručeno — prověřit důvod",
        vkrDescription: "Druhý neúspěšný pokus o doručení.",
        priority: "medium",
        actions: [
          { id: "sa_undelivered_problem_1", actionTagId: "at_email_customer", description: "Informuj zákazníka o druhém neúspěšném pokusu." },
          { id: "sa_undelivered_problem_2", actionTagId: "at_check_carrier", description: "Ověř u dopravce důvod opakovaného nedoručení." },
        ],
      },
      {
        id: "sev_undelivered_critical",
        name: "kritické",
        vkrTitle: "Nedoručeno — telefonicky řešit",
        vkrDescription: "Třetí a další neúspěšný pokus o doručení.",
        priority: "high",
        actions: [
          { id: "sa_undelivered_critical_1", actionTagId: "at_call_customer", description: "Zavolej zákazníkovi, domluv individuální doručení." },
          { id: "sa_undelivered_critical_2", actionTagId: "at_check_carrier", description: "Ověř u dopravce, proč se opakovaně nedaří doručit." },
        ],
      },
    ],
  },
  {
    id: "sit_damage",
    code: "SIT-DAMAGE",
    name: "Poškození zásilky",
    description: "Tracking hlásí zjištěné poškození zásilky.",
    area: "tracking_records",
    severities: [
      {
        id: "sev_damage_default",
        name: "zjištěno poškození",
        vkrTitle: "Poškození zásilky — kontaktovat zákazníka",
        vkrDescription: "Tracking hlásí poškození zásilky.",
        priority: "high",
        actions: [
          { id: "sa_damage_1", actionTagId: "at_call_customer", description: "Informuj zákazníka o poškození a domluv další postup (výměna/reklamace)." },
        ],
      },
    ],
  },
  {
    id: "sit_transport_issue",
    code: "SIT-TRANSPORT",
    name: "Problém v přepravě",
    description: "Zásilka vykazuje známky problému v přepravě.",
    area: "tracking_records",
    severities: [
      {
        id: "sev_transport_possible",
        name: "možný problém",
        vkrTitle: "Možný problém v přepravě — prověřit",
        vkrDescription: "Status signalizuje možný problém, je potřeba ověřit kontext (místo/čas vzniku).",
        priority: "low",
        actions: [
          { id: "sa_transport_possible_1", actionTagId: "at_check_carrier", description: "Ověř kontext statusu (místo, čas) a rozhodni, zda jde o skutečný problém." },
        ],
      },
      {
        id: "sev_transport_stuck",
        name: "zaseknutá na místě",
        vkrTitle: "Zásilka zaseknutá na jednom místě",
        vkrDescription: "Několik po sobě jdoucích záznamů ze stejného místa — zásilka se fyzicky nepohybuje.",
        priority: "medium",
        actions: [
          { id: "sa_transport_stuck_1", actionTagId: "at_check_carrier", description: "Ověř u dopravce, proč se zásilka nehýbe." },
        ],
      },
      {
        id: "sev_transport_lost_suspect",
        name: "podezření na ztrátu",
        vkrTitle: "Podezření na ztrátu zásilky",
        vkrDescription: "Zásilka nemá nový tracking záznam déle, než je pro tuto trasu obvyklé.",
        priority: "high",
        actions: [
          { id: "sa_lost_1", actionTagId: "at_check_carrier", description: "Zahaj šetření ztráty u dopravce." },
          { id: "sa_lost_2", actionTagId: "at_call_customer", description: "Informuj zákazníka o možném zpoždění." },
        ],
      },
    ],
  },
];
```

Then, in the existing `RULES` array, find the `rule_t01` entry and add the two new fields so the seed demonstrates an already-linked rule:

Find:
```ts
  {
    id: "rule_t01",
    code: "T01",
    name: "Zásilka se zasekla na jednom místě",
    area: "tracking_records",
    active: true,
    priority: "low",
```

Replace with:
```ts
  {
    id: "rule_t01",
    code: "T01",
    name: "Zásilka se zasekla na jednom místě",
    area: "tracking_records",
    active: true,
    priority: "low",
    situationId: "sit_transport_issue",
    severityId: "sev_transport_stuck",
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: Succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/lib/model/seed.ts
git commit -m "feat: seed 3 example situations (7 severities) and an action tag catalog"
```

---

## Task 4: Store support for Akce and Situace

**Files:**
- Modify: `src/lib/model/store.ts`

- [ ] **Step 1: Update the import and add the two new stores**

Find:
```ts
import { useEffect, useState } from "react";
import type { CheckpointType, Route, Rule, SampleShipment, Segment } from "./types";
import {
  CHECKPOINT_TYPES,
  ROUTES,
  RULES,
  SAMPLE_SHIPMENTS,
  SEGMENTS,
} from "./seed";
```

Replace with:
```ts
import { useEffect, useState } from "react";
import type { ActionTag, CheckpointType, Route, Rule, SampleShipment, Segment, Situation } from "./types";
import {
  ACTION_TAGS,
  CHECKPOINT_TYPES,
  ROUTES,
  RULES,
  SAMPLE_SHIPMENTS,
  SEGMENTS,
  SITUATIONS,
} from "./seed";
```

Add this new section anywhere after the `Rules store` block (e.g. right before `Routes store`):

```ts
// ---------------------------------------------------------------------------
// Action Tags store
// ---------------------------------------------------------------------------

const _actionTags = makeStore<ActionTag>(ACTION_TAGS, "model_action_tags_v1");

export function useActionTags(): ActionTag[] {
  return _actionTags.useItems();
}

export const actionTagsStore = {
  all: (): ActionTag[] => _actionTags.getState(),
  byId: (id: string): ActionTag | undefined => _actionTags.getState().find((t) => t.id === id),
  upsert(tag: ActionTag): void {
    const cur = _actionTags.getState();
    const idx = cur.findIndex((t) => t.id === tag.id);
    _actionTags.setState(idx >= 0 ? cur.map((t) => (t.id === tag.id ? tag : t)) : [...cur, tag]);
  },
  remove(id: string): void {
    _actionTags.setState(_actionTags.getState().filter((t) => t.id !== id));
  },
};

// ---------------------------------------------------------------------------
// Situace store
// ---------------------------------------------------------------------------

const _situations = makeStore<Situation>(SITUATIONS, "model_situations_v1");

export function useSituations(): Situation[] {
  return _situations.useItems();
}

export const situationsStore = {
  all: (): Situation[] => _situations.getState(),
  byId: (id: string): Situation | undefined => _situations.getState().find((s) => s.id === id),
  upsert(situation: Situation): void {
    const cur = _situations.getState();
    const idx = cur.findIndex((s) => s.id === situation.id);
    _situations.setState(idx >= 0 ? cur.map((s) => (s.id === situation.id ? situation : s)) : [...cur, situation]);
  },
  remove(id: string): void {
    _situations.setState(_situations.getState().filter((s) => s.id !== id));
  },
};

/** Kolik pravidel je navázáno na danou závažnost — použij pro guard při mazání. */
export function severityUsageCount(severityId: string): number {
  return _rules.getState().filter((r) => r.severityId === severityId).length;
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: Succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/lib/model/store.ts
git commit -m "feat: add actionTagsStore, situationsStore and severityUsageCount"
```

---

## Task 5: Remove the redundant "Historie trackingu" category

**Files:**
- Modify: `src/lib/vkr/vkrConditionCatalog.ts:74-124`

The generic `VkrConditionsBuilder` currently bolts a "Historie trackingu" category onto the same catalog used for shipment/customer conditions. That's superseded by the dedicated `TrackingHistoryConditionsBuilder` (Task 8). Remove it so there's one place, not two, for tracking-history conditions.

- [ ] **Step 1: Confirm nothing else depends on the `tracking_history.*` field ids**

Run: `grep -rn "tracking_history\." src/`
Expected: Only matches inside `vkrConditionCatalog.ts` itself. If anything else matches, stop and re-read this task before proceeding — it means some other code depends on these ids.

- [ ] **Step 2: Delete the category**

Find (lines 74-124):
```ts
// ---- Kategorie „Historie trackingu" ------------------------------------------------
// Sémantika: každá podmínka se vyhodnocuje NEZÁVISLE — „existuje záznam v historii,
// který splňuje X". Více podmínek (AND) NEvyžaduje, aby šlo o tentýž záznam.
// Operátory zrcadlí TRACKING_OPERATORS z TrackingConditionBuilder.

const HIST_CAT = "Historie trackingu";

const TEXT_OPS: VkrOperator[] = [
  { id: "je jedním z", label: "je jedním z", needsValue: true, valueType: "text", valuePlaceholder: "hodnota, hodnota…" },
  { id: "není žádným z", label: "není žádným z", needsValue: true, valueType: "text", valuePlaceholder: "hodnota, hodnota…" },
  { id: "je", label: "je", needsValue: true, valueType: "text", valuePlaceholder: "hodnota" },
  { id: "není", label: "není", needsValue: true, valueType: "text", valuePlaceholder: "hodnota" },
  { id: "obsahuje", label: "obsahuje", needsValue: true, valueType: "text", valuePlaceholder: "podřetězec" },
];

const NUMBER_OPS: VkrOperator[] = [
  { id: "je", label: "je", needsValue: true, valueType: "number", valuePlaceholder: "0" },
  { id: "je větší než", label: "je větší než", needsValue: true, valueType: "number", valuePlaceholder: "0" },
  { id: "je menší nebo rovno", label: "je menší nebo rovno", needsValue: true, valueType: "number", valuePlaceholder: "0" },
];

function histText(id: string, label: string): VkrConditionFieldDef {
  return { id: `tracking_history.${id}`, label, category: HIST_CAT, operators: TEXT_OPS };
}

VKR_CONDITION_CATALOG.push(
  histText("derivedStatus", "Status"),
  histText("derivedStatusCode", "Kód statusu"),
  histText("eventType", "Typ záznamu"),
  histText("eventDescription", "Popis události"),
  histText("exceptionCode", "Kód výjimky"),
  histText("exceptionDescription", "Popis výjimky"),
  histText("locationType", "Typ místa"),
  histText("locationId", "ID místa"),
  histText("city", "Město"),
  histText("countryCode", "Země"),
  histText("postalCode", "PSČ"),
  {
    id: "tracking_history.deliveryAttempts",
    label: "Počet pokusů o doručení",
    category: HIST_CAT,
    operators: NUMBER_OPS,
  },
  {
    id: "tracking_history.eventTime",
    label: "Čas záznamu",
    category: HIST_CAT,
    customValueEditor: "tracking_time",
    operators: [{ id: "matches", label: "odpovídá", needsValue: true, valueType: "text" }],
  },
);
```

Replace with nothing (delete entirely).

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: Succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/lib/vkr/vkrConditionCatalog.ts
git commit -m "refactor: remove Historie trackingu category, superseded by TrackingHistoryConditionsBuilder"
```

---

## Task 6: Wire `situationId`/`severityId` through the `/rules/new/` route

Do this early (before building `SeverityCard`'s "+ Pravidlo pro tuto závažnost" link in Task 10) so nothing downstream references search params the route doesn't know about yet.

**Files:**
- Modify: `src/routes/rules.new.index.tsx`
- Modify: `src/components/rules/RuleCreatorPage.tsx:255`

- [ ] **Step 1: Add `validateSearch` to the route**

Find (entire current file):
```tsx
import { createFileRoute } from "@tanstack/react-router";
import { RuleCreatorPage } from "@/components/rules/RuleCreatorPage";

export const Route = createFileRoute("/rules/new/")({
  head: () => ({
    meta: [{ title: "Nové pravidlo — Bytorp" }],
  }),
  component: RuleCreatorPage,
});
```

Replace with:
```tsx
import { createFileRoute } from "@tanstack/react-router";
import { RuleCreatorPage } from "@/components/rules/RuleCreatorPage";

export const Route = createFileRoute("/rules/new/")({
  validateSearch: (search: Record<string, unknown>) => ({
    situationId: (search.situationId as string | undefined) ?? undefined,
    severityId: (search.severityId as string | undefined) ?? undefined,
  }),
  head: () => ({
    meta: [{ title: "Nové pravidlo — Bytorp" }],
  }),
  component: RulesNewIndexPage,
});

function RulesNewIndexPage() {
  const { situationId, severityId } = Route.useSearch();
  return <RuleCreatorPage initialSituationId={situationId} initialSeverityId={severityId} />;
}
```

- [ ] **Step 2: Accept (but don't wire up yet) the new props in `RuleCreatorPage`**

Find (line 255):
```tsx
export function RuleCreatorPage({ ruleId }: { ruleId?: string } = {}) {
```

Replace with:
```tsx
export function RuleCreatorPage({
  ruleId,
  initialSituationId,
  initialSeverityId,
}: {
  ruleId?: string;
  initialSituationId?: string;
  initialSeverityId?: string;
} = {}) {
  void initialSituationId; // wired up in Task 17
  void initialSeverityId; // wired up in Task 17
```

(The `void` statements are a deliberate, temporary placeholder to keep `npm run build` green between now and Task 17, where these become real prefill logic — this project has `noUnusedParameters`/`noUnusedLocals` off, so this isn't strictly required by the compiler, but it documents intent for whoever reads the diff mid-stack.)

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: Succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/routes/rules.new.index.tsx src/components/rules/RuleCreatorPage.tsx
git commit -m "feat: accept situationId/severityId search params on /rules/new/"
```

---

## Task 7: `ActionTagPicker` component

**Files:**
- Create: `src/components/situations/ActionTagPicker.tsx`

- [ ] **Step 1: Write the component**

A combobox listing the Akce catalog, with inline "+ Vytvořit" when the typed text doesn't match an existing tag. Modeled on the existing `AddConditionButton` in `VkrConditionsBuilder.tsx`.

```tsx
import { useState } from "react";
import { Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useActionTags, actionTagsStore } from "@/lib/model/store";
import type { ActionTag } from "@/lib/model/types";

export function ActionTagPicker({
  excludeIds,
  onPick,
}: {
  excludeIds: string[];
  onPick: (tag: ActionTag) => void;
}) {
  const tags = useActionTags();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const available = tags.filter((t) => !excludeIds.includes(t.id));
  const filtered = available.filter((t) => t.label.toLowerCase().includes(query.toLowerCase()));
  const exactMatch = tags.some((t) => t.label.toLowerCase() === query.trim().toLowerCase());

  function pick(tag: ActionTag) {
    onPick(tag);
    setOpen(false);
    setQuery("");
  }

  function createAndPick() {
    const label = query.trim();
    if (!label) return;
    const tag: ActionTag = { id: "at_" + Date.now(), label };
    actionTagsStore.upsert(tag);
    pick(tag);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 rounded-lg border border-dashed border-border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors">
          <Plus className="size-3.5" /> Přidat akci
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-0 overflow-hidden" sideOffset={4}>
        <div className="border-b border-border px-2.5 py-1.5">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Hledat nebo vytvořit akci…"
            className="w-full bg-transparent text-xs focus:outline-none"
          />
        </div>
        <div className="max-h-56 overflow-y-auto p-1">
          {filtered.map((tag) => (
            <button
              key={tag.id}
              onClick={() => pick(tag)}
              className="w-full rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted/60"
            >
              {tag.label}
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="px-2 py-3 text-center text-xs text-muted-foreground">Nic nenalezeno</div>
          )}
          {query.trim() && !exactMatch && (
            <button
              onClick={createAndPick}
              className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-primary hover:bg-primary-soft/40"
            >
              <Plus className="size-3" /> Vytvořit „{query.trim()}"
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: Succeeds (component isn't imported anywhere yet, so this only checks its own types — confirm no errors reported for this file specifically).

- [ ] **Step 3: Commit**

```bash
git add src/components/situations/ActionTagPicker.tsx
git commit -m "feat: add ActionTagPicker combobox with inline tag creation"
```

---

## Task 8: `CurrentRecordConditionsBuilder` component

**Files:**
- Create: `src/components/rules/editors/CurrentRecordConditionsBuilder.tsx`

This is condition **Block 1** from the spec (5.3.1): "Podmínky současného záznamu" — only shown for the `Automaticky` spouštěč. Two row modes: **Shoda hodnoty** (`kind: "field"`) and **Opakuje se** (`kind: "tracking_aggregate"`, `valueMode: "same_repeats"`).

- [ ] **Step 1: Write the component**

```tsx
import { Plus, X } from "lucide-react";
import { TRACKING_FIELDS, REPEATABLE_FIELDS, SIMPLE_OPERATORS } from "@/lib/model/trackingFields";
import { cn } from "@/lib/utils";
import type { Condition } from "@/lib/model/types";

function isBlock1Condition(c: Condition): boolean {
  return c.kind === "field" || (c.kind === "tracking_aggregate" && c.valueMode === "same_repeats");
}

export function CurrentRecordConditionsBuilder({
  conditions,
  onChange,
}: {
  conditions: Condition[];
  onChange: (next: Condition[]) => void;
}) {
  const rows = conditions.filter(isBlock1Condition);

  function updateAt(index: number, next: Condition) {
    const target = rows[index];
    onChange(conditions.map((c) => (c === target ? next : c)));
  }

  function removeAt(index: number) {
    const target = rows[index];
    onChange(conditions.filter((c) => c !== target));
  }

  function addShoda() {
    onChange([...conditions, { kind: "field", fieldId: "derivedStatus", operator: "je", value: "" }]);
  }

  function addOpakujeSe() {
    onChange([
      ...conditions,
      { kind: "tracking_aggregate", trackingFieldId: "city", valueMode: "same_repeats", count: 4, occurrence: "consecutive" },
    ]);
  }

  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div key={i} className="rounded-lg border border-border bg-background p-2.5 space-y-2">
          <div className="flex gap-1">
            <button
              onClick={() => updateAt(i, { kind: "field", fieldId: "derivedStatus", operator: "je", value: "" })}
              className={cn("rounded-md px-2 py-1 text-[11px] font-medium", row.kind === "field" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}
            >
              Shoda hodnoty
            </button>
            <button
              onClick={() => updateAt(i, { kind: "tracking_aggregate", trackingFieldId: "city", valueMode: "same_repeats", count: 4, occurrence: "consecutive" })}
              className={cn("rounded-md px-2 py-1 text-[11px] font-medium", row.kind === "tracking_aggregate" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}
            >
              Opakuje se
            </button>
            <button onClick={() => removeAt(i)} className="ml-auto text-muted-foreground hover:text-foreground">
              <X className="size-3.5" />
            </button>
          </div>

          {row.kind === "field" && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <select
                value={row.fieldId}
                onChange={(e) => updateAt(i, { ...row, fieldId: e.target.value })}
                className="rounded border border-border bg-background px-2 py-1.5 text-xs"
              >
                {TRACKING_FIELDS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
              <select
                value={row.operator}
                onChange={(e) => updateAt(i, { ...row, operator: e.target.value })}
                className="rounded border border-border bg-background px-2 py-1.5 text-xs"
              >
                {SIMPLE_OPERATORS.map((op) => (
                  <option key={op}>{op}</option>
                ))}
              </select>
              <input
                value={row.value ?? ""}
                onChange={(e) => updateAt(i, { ...row, value: e.target.value })}
                placeholder="hodnota…"
                className="flex-1 min-w-[100px] rounded border border-border bg-background px-2 py-1.5 text-xs"
              />
            </div>
          )}

          {row.kind === "tracking_aggregate" && (
            <div className="space-y-2">
              <select
                value={row.trackingFieldId}
                onChange={(e) => updateAt(i, { ...row, trackingFieldId: e.target.value })}
                className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs"
              >
                {REPEATABLE_FIELDS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
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
        </div>
      ))}

      <div className="flex gap-2">
        <button
          onClick={addShoda}
          className="flex items-center gap-1 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary"
        >
          <Plus className="size-3" /> Shoda hodnoty
        </button>
        <button
          onClick={addOpakujeSe}
          className="flex items-center gap-1 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary"
        >
          <Plus className="size-3" /> Opakuje se
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: Succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/rules/editors/CurrentRecordConditionsBuilder.tsx
git commit -m "feat: add CurrentRecordConditionsBuilder (Shoda hodnoty / Opakuje se)"
```

---

## Task 9: `TrackingHistoryConditionsBuilder` component

**Files:**
- Create: `src/components/rules/editors/TrackingHistoryConditionsBuilder.tsx`

This is condition **Block 2** from the spec (5.3.2): "Podmínky na historii záznamů" — shown for both spouštěč types. Rows are `kind: "tracking_aggregate"`, `valueMode: "specific"`.

- [ ] **Step 1: Write the component**

```tsx
import { Plus, X } from "lucide-react";
import { TRACKING_FIELDS } from "@/lib/model/trackingFields";
import { cn } from "@/lib/utils";
import type { Condition } from "@/lib/model/types";

function isBlock2Condition(c: Condition): boolean {
  return c.kind === "tracking_aggregate" && c.valueMode === "specific";
}

export function TrackingHistoryConditionsBuilder({
  conditions,
  onChange,
}: {
  conditions: Condition[];
  onChange: (next: Condition[]) => void;
}) {
  const rows = conditions.filter(isBlock2Condition);

  function updateAt(index: number, next: Condition) {
    const target = rows[index];
    onChange(conditions.map((c) => (c === target ? next : c)));
  }

  function removeAt(index: number) {
    const target = rows[index];
    onChange(conditions.filter((c) => c !== target));
  }

  function addRow() {
    onChange([
      ...conditions,
      { kind: "tracking_aggregate", trackingFieldId: "derivedStatus", valueMode: "specific", expectedValue: "", mode: "contains", count: 1, occurrence: "any" },
    ]);
  }

  return (
    <div className="space-y-2">
      {rows.map((row, i) => {
        if (row.kind !== "tracking_aggregate") return null;
        const scopeIsLast = row.count <= 1;
        return (
          <div key={i} className="rounded-lg border border-border bg-background p-2.5 space-y-2">
            <div className="flex gap-1">
              <button
                onClick={() => updateAt(i, { ...row, mode: "contains" })}
                className={cn("rounded-md px-2 py-1 text-[11px] font-medium", (row.mode ?? "contains") === "contains" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}
              >
                Obsahuje
              </button>
              <button
                onClick={() => updateAt(i, { ...row, mode: "not_contains" })}
                className={cn("rounded-md px-2 py-1 text-[11px] font-medium", row.mode === "not_contains" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}
              >
                Neobsahuje
              </button>
              <button onClick={() => removeAt(i)} className="ml-auto text-muted-foreground hover:text-foreground">
                <X className="size-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <select
                value={row.trackingFieldId}
                onChange={(e) => updateAt(i, { ...row, trackingFieldId: e.target.value })}
                className="rounded border border-border bg-background px-2 py-1.5 text-xs"
              >
                {TRACKING_FIELDS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
              <input
                value={row.expectedValue ?? ""}
                onChange={(e) => updateAt(i, { ...row, expectedValue: e.target.value })}
                placeholder="hodnota…"
                className="flex-1 min-w-[100px] rounded border border-border bg-background px-2 py-1.5 text-xs"
              />
            </div>

            <div className="flex items-center gap-4 text-xs pl-1 flex-wrap">
              <label className="flex items-center gap-1.5">
                <input type="radio" checked={scopeIsLast} onChange={() => updateAt(i, { ...row, count: 1 })} />
                V posledním záznamu
              </label>
              <label className="flex items-center gap-1.5">
                <input type="radio" checked={!scopeIsLast} onChange={() => updateAt(i, { ...row, count: Math.max(2, row.count) })} />
                V posledních
                <input
                  type="number"
                  min={2}
                  value={!scopeIsLast ? row.count : 2}
                  onChange={(e) => updateAt(i, { ...row, count: Math.max(2, Number(e.target.value)) })}
                  className="w-14 rounded border border-border bg-background px-1.5 py-1 text-xs text-center"
                />
                záznamech
              </label>
            </div>

            <label className={cn("flex items-center gap-2 pl-1 text-xs", scopeIsLast && "opacity-40")}>
              <input
                type="checkbox"
                disabled={scopeIsLast}
                checked={row.occurrence === "consecutive"}
                onChange={(e) => updateAt(i, { ...row, occurrence: e.target.checked ? "consecutive" : "any" })}
              />
              musí být nepřerušeně
            </label>
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

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: Succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/rules/editors/TrackingHistoryConditionsBuilder.tsx
git commit -m "feat: add TrackingHistoryConditionsBuilder (Obsahuje/Neobsahuje)"
```

---

## Task 10: `SeverityCard` component

**Files:**
- Create: `src/components/situations/SeverityCard.tsx`

Inline-editable card for one Závažnost, used inside `SituationEditorPage` (Task 12). Auto-saves on every change (no separate Save button — matches the plan's "keep it simple" approach).

- [ ] **Step 1: Write the component**

```tsx
import { Trash2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { ActionTagPicker } from "./ActionTagPicker";
import { useActionTags } from "@/lib/model/store";
import { cn } from "@/lib/utils";
import type { Priority, Severity } from "@/lib/model/types";

export function SeverityCard({
  severity,
  situationId,
  usageCount,
  onChange,
  onRemove,
}: {
  severity: Severity;
  situationId: string;
  usageCount: number;
  onChange: (next: Severity) => void;
  onRemove: () => void;
}) {
  const actionTags = useActionTags();
  const tagLabel = (id: string) => actionTags.find((t) => t.id === id)?.label ?? id;

  function updateAction(actionId: string, patch: Partial<Severity["actions"][number]>) {
    onChange({
      ...severity,
      actions: severity.actions.map((a) => (a.id === actionId ? { ...a, ...patch } : a)),
    });
  }

  function removeAction(actionId: string) {
    onChange({ ...severity, actions: severity.actions.filter((a) => a.id !== actionId) });
  }

  return (
    <div className="rounded-xl border border-border bg-background p-4 space-y-3">
      <div className="flex items-center gap-2">
        <input
          value={severity.name}
          onChange={(e) => onChange({ ...severity, name: e.target.value })}
          className="flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm font-medium"
        />
        <button
          disabled={usageCount > 0}
          onClick={onRemove}
          title={usageCount > 0 ? `Používá se v ${usageCount} pravidlech` : "Smazat závažnost"}
          className={cn(
            "rounded-md p-1.5 text-muted-foreground transition-colors",
            usageCount > 0 ? "opacity-30 cursor-not-allowed" : "hover:text-red-500"
          )}
        >
          <Trash2 className="size-4" />
        </button>
      </div>

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
        <select
          value={severity.priority}
          onChange={(e) => onChange({ ...severity, priority: e.target.value as Priority })}
          className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm"
        >
          <option value="low">LOW</option>
          <option value="medium">MEDIUM</option>
          <option value="high">HIGH</option>
          <option value="urgent">URGENT</option>
        </select>
      </div>

      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Přiřazené akce
        </div>
        <div className="space-y-2">
          {severity.actions.map((a) => (
            <div key={a.id} className="rounded-lg border border-border bg-muted/20 p-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary">
                  {tagLabel(a.actionTagId)}
                </span>
                <button onClick={() => removeAction(a.id)} className="text-muted-foreground hover:text-red-500 text-xs">
                  Odebrat
                </button>
              </div>
              <textarea
                value={a.description ?? ""}
                onChange={(e) => updateAction(a.id, { description: e.target.value })}
                placeholder="Výchozí text pro operátora…"
                rows={2}
                className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs resize-none"
              />
            </div>
          ))}
        </div>
        <div className="mt-2">
          <ActionTagPicker
            excludeIds={severity.actions.map((a) => a.actionTagId)}
            onPick={(tag) =>
              onChange({
                ...severity,
                actions: [...severity.actions, { id: "sa_" + Date.now(), actionTagId: tag.id, description: "" }],
              })
            }
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <span className="text-xs text-muted-foreground">
          {usageCount} {usageCount === 1 ? "pravidlo" : usageCount < 5 ? "pravidla" : "pravidel"}
        </span>
        <Link
          to="/rules/new"
          search={{ situationId, severityId: severity.id }}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          + Pravidlo pro tuto závažnost
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: Succeeds. The `Link search={{situationId, severityId}}` call type-checks because Task 6 already declared these keys on the `/rules/new/` route's `validateSearch`.

- [ ] **Step 3: Commit**

```bash
git add src/components/situations/SeverityCard.tsx
git commit -m "feat: add SeverityCard with inline action assignment"
```

---

## Task 11: `SituationsListPage` and its route

**Files:**
- Create: `src/components/situations/SituationsListPage.tsx`
- Create: `src/routes/situace.tsx`

- [ ] **Step 1: Write the list page**

```tsx
import { Plus, Trash2 } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { useSituations, situationsStore, useRules } from "@/lib/model/store";
import { cn } from "@/lib/utils";

export function SituationsListPage() {
  const situations = useSituations();
  const rules = useRules();
  const navigate = useNavigate();

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

  return (
    <div className="flex h-screen w-screen flex-col bg-background text-foreground">
      <AppHeader current="rules" />

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
          <p className="text-sm text-muted-foreground mb-6">
            Šablony pro věci k řešení — každá situace má stupně závažnosti s výchozím názvem, popisem, prioritou a akcemi.
          </p>

          <div className="flex flex-col gap-2">
            {situations.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Zatím žádné situace.</p>
            ) : (
              situations.map((s) => {
                const usage = totalUsage(s.id);
                return (
                  <Link
                    key={s.id}
                    to="/situace/$id"
                    params={{ id: s.id }}
                    className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{s.name}</div>
                      {s.description && <div className="text-xs text-muted-foreground mt-0.5">{s.description}</div>}
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{s.severities.length} závažností</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{usage} pravidel</span>
                    <button
                      disabled={usage > 0}
                      onClick={(e) => {
                        e.preventDefault();
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
                  </Link>
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

- [ ] **Step 2: Create the route**

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { SituationsListPage } from "@/components/situations/SituationsListPage";

export const Route = createFileRoute("/situace")({
  head: () => ({
    meta: [
      { title: "Situace a závažnosti — Bytorp" },
      { name: "description", content: "Šablony pro věci k řešení podle situace a závažnosti." },
    ],
  }),
  component: SituationsListPage,
});
```

- [ ] **Step 3: Verify it compiles and the route renders**

Run: `npm run build`
Expected: Succeeds (build also regenerates `src/routeTree.gen.ts` — do not hand-edit that file if it changes).

- [ ] **Step 4: Commit**

```bash
git add src/components/situations/SituationsListPage.tsx src/routes/situace.tsx src/routeTree.gen.ts
git commit -m "feat: add /situace list page"
```

---

## Task 12: `SituationEditorPage` and its route

**Files:**
- Create: `src/components/situations/SituationEditorPage.tsx`
- Create: `src/routes/situace.$id.tsx`

- [ ] **Step 1: Write the editor page**

```tsx
import { Trash2 } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { SeverityCard } from "./SeverityCard";
import { useSituations, situationsStore, severityUsageCount } from "@/lib/model/store";
import type { Severity } from "@/lib/model/types";

export function SituationEditorPage({ situationId }: { situationId: string }) {
  const situations = useSituations();
  const navigate = useNavigate();
  const situation = situations.find((s) => s.id === situationId);

  if (!situation) {
    return (
      <div className="flex h-screen w-screen flex-col bg-background text-foreground">
        <AppHeader current="rules" />
        <div className="p-6 text-sm text-muted-foreground">Situace nenalezena. <Link to="/situace" className="text-primary underline">Zpět na seznam</Link></div>
      </div>
    );
  }

  function updateSeverity(next: Severity) {
    if (!situation) return;
    situationsStore.upsert({
      ...situation,
      severities: situation.severities.map((s) => (s.id === next.id ? next : s)),
    });
  }

  function removeSeverity(severityId: string) {
    if (!situation) return;
    situationsStore.upsert({
      ...situation,
      severities: situation.severities.filter((s) => s.id !== severityId),
    });
  }

  function addSeverity() {
    if (!situation) return;
    const newSeverity: Severity = {
      id: "sev_" + Date.now(),
      name: "Nová závažnost",
      vkrTitle: "",
      priority: "medium",
      actions: [],
    };
    situationsStore.upsert({ ...situation, severities: [...situation.severities, newSeverity] });
  }

  const totalUsage = situation.severities.reduce((sum, s) => sum + severityUsageCount(s.id), 0);

  return (
    <div className="flex h-screen w-screen flex-col bg-background text-foreground">
      <AppHeader current="rules" />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl p-6 space-y-5">
          <Link to="/situace" className="text-xs text-muted-foreground hover:text-foreground">
            ← Zpět na situace
          </Link>

          <div className="flex items-center gap-2">
            <input
              value={situation.name}
              onChange={(e) => situationsStore.upsert({ ...situation, name: e.target.value })}
              className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-lg font-semibold"
            />
            <button
              disabled={totalUsage > 0}
              onClick={() => {
                situationsStore.remove(situation.id);
                navigate({ to: "/situace" });
              }}
              title={totalUsage > 0 ? `Používá se v ${totalUsage} pravidlech` : "Smazat situaci"}
              className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:border-red-300 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <Trash2 className="size-4" /> Smazat
            </button>
          </div>

          <textarea
            value={situation.description ?? ""}
            onChange={(e) => situationsStore.upsert({ ...situation, description: e.target.value })}
            placeholder="Popis situace…"
            rows={2}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm resize-none"
          />

          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Závažnosti ({situation.severities.length})
            </div>
            <div className="space-y-3">
              {situation.severities.map((sev) => (
                <SeverityCard
                  key={sev.id}
                  severity={sev}
                  situationId={situation.id}
                  usageCount={severityUsageCount(sev.id)}
                  onChange={updateSeverity}
                  onRemove={() => removeSeverity(sev.id)}
                />
              ))}
            </div>
            <button
              onClick={addSeverity}
              className="mt-3 w-full rounded-lg border border-dashed border-border py-2 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              + Přidat závažnost
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create the route**

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { SituationEditorPage } from "@/components/situations/SituationEditorPage";

export const Route = createFileRoute("/situace/$id")({
  head: () => ({ meta: [{ title: "Editace situace — Bytorp" }] }),
  component: SituaceEditorRoute,
});

function SituaceEditorRoute() {
  const { id } = Route.useParams();
  return <SituationEditorPage situationId={id} />;
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: Succeeds.

- [ ] **Step 4: Manual check**

Run: `npm run dev`, open the app, navigate to `/situace`, click into "Nedoručeno" — confirm you see 3 závažnosti with their seeded akce, and that "zaseknutá na místě" under "Problém v přepravě" shows "1 pravidlo" (from the `rule_t01` link added in Task 3) and its delete button is disabled.

- [ ] **Step 5: Commit**

```bash
git add src/components/situations/SituationEditorPage.tsx src/routes/situace.\$id.tsx src/routeTree.gen.ts
git commit -m "feat: add /situace/:id editor page"
```

---

## Task 13: Link to Situace from the rules list

**Files:**
- Modify: `src/components/rules/RulesList.tsx:99-115`

- [ ] **Step 1: Add the entry point**

Find:
```tsx
      <AppHeader
        current="rules"
        extras={
          <div className="flex items-center gap-2">
            <Link
              to="/rules/new"
              search={{ area: selection.kind === "area" ? selection.area : undefined }}
              className="bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-primary/90"
            >
              + Nové pravidlo
            </Link>
            <DataMenu />
          </div>
        }
      />
```

Replace with:
```tsx
      <AppHeader
        current="rules"
        extras={
          <div className="flex items-center gap-2">
            <Link
              to="/situace"
              className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              Situace a závažnosti →
            </Link>
            <Link
              to="/rules/new"
              search={{ area: selection.kind === "area" ? selection.area : undefined }}
              className="bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-primary/90"
            >
              + Nové pravidlo
            </Link>
            <DataMenu />
          </div>
        }
      />
```

Note: `search={{area: ...}}` here was already unused by `RuleCreatorPage` before this plan (confirmed during research — it never reads that search param) and stays that way; fixing it is out of scope for this plan.

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: Succeeds.

- [ ] **Step 3: Manual check**

Run: `npm run dev`, open `/`, confirm "Situace a závažnosti →" appears next to "+ Nové pravidlo" and navigates to `/situace`.

- [ ] **Step 4: Commit**

```bash
git add src/components/rules/RulesList.tsx
git commit -m "feat: link to Situace a závažnosti from the rules list"
```

---

## Task 14: `RuleCreatorPage` — rename the colliding local type

**Files:**
- Modify: `src/components/rules/RuleCreatorPage.tsx`

Do this rename **before** importing the model's `Situation` type in Task 15, so there's never a moment where both exist under the same name.

- [ ] **Step 1: Rename `Situation` → `RouteUiSituation` everywhere it's used as a type in this file**

Find (line 20):
```ts
type Situation = "delivery_day" | "unexpected_location" | "missed_milestone" | "other";
```
Replace with:
```ts
type RouteUiSituation = "delivery_day" | "unexpected_location" | "missed_milestone" | "other";
```

Find (line 68):
```ts
const SITUATION_CARDS: {
  id: Situation;
```
Replace with:
```ts
const SITUATION_CARDS: {
  id: RouteUiSituation;
```

Find (line 122, inside `RuleCreatorUiState`):
```ts
  selectedSituation: Situation | null;
```
Replace with:
```ts
  selectedSituation: RouteUiSituation | null;
```

Find (line 176):
```ts
function inferRouteSituation(rule?: Rule): Situation | null {
```
Replace with:
```ts
function inferRouteSituation(rule?: Rule): RouteUiSituation | null {
```

Find (line 268):
```ts
  const [selectedSituation, setSelectedSituation] = useState<Situation | null>(
```
Replace with:
```ts
  const [selectedSituation, setSelectedSituation] = useState<RouteUiSituation | null>(
```

Find (line 1404):
```ts
function getTriggerLabel(situation: Situation | null, interval: CheckInterval): string {
```
Replace with:
```ts
function getTriggerLabel(situation: RouteUiSituation | null, interval: CheckInterval): string {
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: Succeeds — this step is a pure rename, behavior is unchanged.

- [ ] **Step 3: Manual check**

Run: `npm run dev`, open `/rules/new`, pick "Soulad s předepsanou trasou", confirm the situation cards and their configs still work exactly as before (this task must not change route_compliance behavior at all).

- [ ] **Step 4: Commit**

```bash
git add src/components/rules/RuleCreatorPage.tsx
git commit -m "refactor: rename local Situation type to RouteUiSituation to avoid collision"
```

---

## Task 15: `RuleCreatorPage` — replace tracking-only state with Situace/Závažnost + Spouštěč state

**Files:**
- Modify: `src/components/rules/RuleCreatorPage.tsx`

This is the biggest task in the plan. It removes the old `TrackingSituation`/`TRACKING_SITUATION_CARDS` machinery and the associated per-card state, and replaces it with state driven by the new Situace/Závažnost model plus the 2-type Spouštěč.

- [ ] **Step 1: Remove the old tracking-situation type, card list, and per-card condition-row type**

Find (lines 25-48):
```ts
type TrackingSituation = "tracking_event" | "no_movement" | "stuck_location";
interface TrackingConditionRow { id: string; field: string; operator: string; value: string; timeSpec?: TrackingTimeSpec; }
type StuckMatchMode = "locationId" | "city" | "countryCode";

const TRACKING_SITUATION_CARDS: { id: TrackingSituation; icon: React.ReactNode; label: string; trigger: string }[] = [
  {
    id: "tracking_event",
    icon: <Radio className="size-4" />,
    label: "Přišel konkrétní tracking záznam",
    trigger: "Reaktivní — při každém novém záznamu",
  },
  {
    id: "no_movement",
    icon: <PauseCircle className="size-4" />,
    label: "Zásilka bez pohybu po stanovenou dobu",
    trigger: "Časový plán — kontroluje periodicky",
  },
  {
    id: "stuck_location",
    icon: <LocateFixed className="size-4" />,
    label: "Zásilka zaseknutá na jednom místě",
    trigger: "Reaktivní — při každém novém záznamu",
  },
];
```

Replace with:
```ts
type TrackingTriggerType = "automatic" | "timer";
interface TrackingConditionRow { id: string; field: string; operator: string; value: string; timeSpec?: TrackingTimeSpec; }
```

(`StuckMatchMode` and `TRACKING_SITUATION_CARDS` are gone — matching by location is now just a field choice inside `CurrentRecordConditionsBuilder`.)

- [ ] **Step 2: Update imports**

Find:
```ts
import { Lock, Clock, MapPin, AlertTriangle, Zap, ChevronDown, ChevronUp, Plus, X, Radio, PauseCircle, LocateFixed, Settings2 } from "lucide-react";
```

Replace with:
```ts
import { Lock, Clock, MapPin, AlertTriangle, Zap, ChevronDown, ChevronUp, Plus, X, Settings2 } from "lucide-react";
```

(`Radio`, `PauseCircle`, `LocateFixed` were only used by the deleted `TRACKING_SITUATION_CARDS`.)

Add these imports next to the existing `@/lib/model` / `@/components/rules` imports:

```ts
import { useSituations, situationsStore, useActionTags } from "@/lib/model/store";
import type { Situation, Severity, Condition } from "@/lib/model/types";
import { CurrentRecordConditionsBuilder } from "@/components/rules/editors/CurrentRecordConditionsBuilder";
import { TrackingHistoryConditionsBuilder } from "@/components/rules/editors/TrackingHistoryConditionsBuilder";
import { ActionTagPicker } from "@/components/situations/ActionTagPicker";
```

(`situationsStore` is imported now for use in Task 17's save handler; if your editor flags it as unused before then, that's expected and resolves once Task 17 lands.)

- [ ] **Step 3: Replace the `RuleCreatorUiState`/`RuleCreatorInitialState` tracking fields**

Find:
```ts
interface RuleCreatorUiState {
  selectedSituation: RouteUiSituation | null;
  selectedTrackingSituation: TrackingSituation | null;
  trackingConditions: TrackingConditionRow[];
  noMovementDuration: number;
  noMovementUnit: "h" | "d" | "bd";
  ignoreClearance: boolean;
  stuckCount: number;
  stuckMatchMode: StuckMatchMode;
  stuckInclude: TrackingConditionRow[];
  stuckExclude: TrackingConditionRow[];
  deliveryMilestone: string;
```

Replace with:
```ts
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
```

Just above this interface, add the new local row type used for the Akce column (checkbox + editable text, decoupled from the persisted `Action[]` shape until save):

```ts
interface SeverityActionRow {
  id: string;
  actionTagId: string;
  enabled: boolean;
  description: string;
}
```

- [ ] **Step 4: Update `getInitialFormState` — remove old tracking fields, add new ones**

Find:
```ts
function inferTrackingSituation(rule?: Rule): TrackingSituation | null {
  if (!rule || rule.area !== "tracking_records") return null;
  const name = rule.name.toLocaleLowerCase("cs-CZ");
  if (name.includes("bez pohybu") || name.includes("no movement")) return "no_movement";
  const aggregate = rule.conditions.find((c) => c.kind === "tracking_aggregate");
  if (aggregate?.kind === "tracking_aggregate" && (aggregate.valueMode === "same_repeats" || aggregate.trackingFieldId.includes("location"))) return "stuck_location";
  return "tracking_event";
}

function trackingConditionsFromRule(rule?: Rule): TrackingConditionRow[] {
  if (!rule) return [];
  const fieldRows = rule.conditions
    .filter((c) => c.kind === "field")
    .map((c, index) => ({ id: `tc_${index + 1}`, field: c.fieldId, operator: c.operator, value: c.value ?? "" }));
  if (fieldRows.length > 0) return fieldRows;
  const aggregate = rule.conditions.find((c) => c.kind === "tracking_aggregate");
  if (aggregate?.kind !== "tracking_aggregate") return [];
  return [{
    id: "tc_1",
    field: aggregate.trackingFieldId,
    operator: aggregate.valueMode === "specific" ? "je" : "je jedním z",
    value: aggregate.expectedValue ?? "",
  }];
}
```

Replace with:
```ts
function inferTriggerType(rule?: Rule): TrackingTriggerType {
  if (!rule || rule.area !== "tracking_records") return "automatic";
  return rule.trigger.kind === "schedule" ? "timer" : "automatic";
}

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

function severityActionRowsFromRule(rule?: Rule): SeverityActionRow[] {
  if (!rule || rule.area !== "tracking_records") return [];
  return rule.actions
    .filter((a) => a.actionTagId)
    .map((a) => ({ id: a.id, actionTagId: a.actionTagId!, enabled: true, description: a.vkrText ?? "" }));
}
```

Find:
```ts
function getInitialFormState(rule?: Rule): RuleCreatorInitialState {
  const ui = (rule?.uiState ?? {}) as Partial<RuleCreatorUiState>;
  const fulfilledFromRule = rule?.actions.filter((a) => a.runWhenRouteCondition === "fulfilled").map(toBranchAction) ?? [];
  const notFulfilledFromRule = rule?.actions.filter((a) => a.runWhenRouteCondition !== "fulfilled").map(toBranchAction) ?? [];
  const trackingFromRule = rule?.area === "tracking_records" ? rule.actions.map(toBranchAction) : [];
  const inferredTrackingConditions = trackingConditionsFromRule(rule);
  const checkpointId = routeCheckpointFromRule(rule);

  return {
    selectedArea: rule?.area ?? "route_compliance",
    ruleName: rule?.name ?? "",
    ruleDescription: rule?.description ?? "",
    priority: rule?.priority ?? "medium",
    active: rule?.active ?? true,
    selectedSituation: ui.selectedSituation ?? inferRouteSituation(rule),
    selectedTrackingSituation: ui.selectedTrackingSituation ?? inferTrackingSituation(rule),
    trackingConditions: ui.trackingConditions ?? (inferredTrackingConditions.length > 0 ? inferredTrackingConditions : DEFAULT_TRACKING_CONDITIONS.map((r) => ({ ...r }))),
    noMovementDuration: ui.noMovementDuration ?? 72,
    noMovementUnit: ui.noMovementUnit ?? "h",
    ignoreClearance: ui.ignoreClearance ?? true,
    stuckCount: ui.stuckCount ?? 4,
    stuckMatchMode: ui.stuckMatchMode ?? "city",
    stuckInclude: ui.stuckInclude ?? [],
    stuckExclude: ui.stuckExclude ?? [],
    deliveryMilestone: ui.deliveryMilestone ?? checkpointId ?? "ct_first_scan",
```

Replace with:
```ts
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
```

Then a few lines further down in the same return object, find:
```ts
    fulfilledActions: ui.fulfilledActions ?? fulfilledFromRule,
    notFulfilledActions: ui.notFulfilledActions ?? (notFulfilledFromRule.length > 0 ? notFulfilledFromRule : cloneActions(DEFAULT_NOT_FULFILLED_ACTIONS)),
    trackingActions: ui.trackingActions ?? trackingFromRule,
  };
}
```

Replace with:
```ts
    fulfilledActions: ui.fulfilledActions ?? fulfilledFromRule,
    notFulfilledActions: ui.notFulfilledActions ?? (notFulfilledFromRule.length > 0 ? notFulfilledFromRule : cloneActions(DEFAULT_NOT_FULFILLED_ACTIONS)),
  };
}
```

(`trackingActions`/`BranchAction`-based tracking actions are gone — the Akce column for tracking_records now reads/writes `severityActions` instead. `BranchAction`, `toBranchAction`, `DEFAULT_NOT_FULFILLED_ACTIONS`, `cloneActions` all stay — they're still used by `route_compliance`.)

- [ ] **Step 5: Update the component's `useState` calls**

Find:
```ts
  // Tracking records state
  const [selectedTrackingSituation, setSelectedTrackingSituation] = useState<TrackingSituation | null>(
    initialState.selectedTrackingSituation
  );
  const [trackingConditions, setTrackingConditions] = useState<TrackingConditionRow[]>(
    initialState.trackingConditions
  );
  const [noMovementDuration, setNoMovementDuration] = useState(initialState.noMovementDuration);
  const [noMovementUnit, setNoMovementUnit] = useState<"h" | "d" | "bd">(initialState.noMovementUnit);
  const [ignoreClearance, setIgnoreClearance] = useState(initialState.ignoreClearance);
  const [stuckCount, setStuckCount] = useState(initialState.stuckCount);
  const [stuckMatchMode, setStuckMatchMode] = useState<StuckMatchMode>(initialState.stuckMatchMode);
  const [stuckInclude, setStuckInclude] = useState<TrackingConditionRow[]>(initialState.stuckInclude);
  const [stuckExclude, setStuckExclude] = useState<TrackingConditionRow[]>(initialState.stuckExclude);
  const [ruleName, setRuleName] = useState(initialState.ruleName);
```

Replace with:
```ts
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
```

Find (inside the `useEffect` that re-syncs state when `initialState` changes — the block that begins `useEffect(() => {` right after the state declarations):
```ts
    setSelectedTrackingSituation(initialState.selectedTrackingSituation);
    setTrackingConditions(initialState.trackingConditions);
    setNoMovementDuration(initialState.noMovementDuration);
    setNoMovementUnit(initialState.noMovementUnit);
    setIgnoreClearance(initialState.ignoreClearance);
    setStuckCount(initialState.stuckCount);
    setStuckMatchMode(initialState.stuckMatchMode);
    setStuckInclude(initialState.stuckInclude);
    setStuckExclude(initialState.stuckExclude);
    setRuleName(initialState.ruleName);
```

Replace with:
```ts
    setSelectedSituationId(initialState.selectedSituationId);
    setSelectedSeverityId(initialState.selectedSeverityId);
    setTriggerType(initialState.triggerType);
    setCurrentRecordConditions(initialState.currentRecordConditions);
    setHistoryConditions(initialState.historyConditions);
    setNoMovementDuration(initialState.noMovementDuration);
    setNoMovementUnit(initialState.noMovementUnit);
    setSeverityActions(initialState.severityActions);
    setRuleName(initialState.ruleName);
```

Find, further down in the same `useEffect`:
```ts
    setFulfilledActions(initialState.fulfilledActions);
    setNotFulfilledActions(initialState.notFulfilledActions);
    setTrackingActions(initialState.trackingActions);
  }, [initialState]);
```

Replace with:
```ts
    setFulfilledActions(initialState.fulfilledActions);
    setNotFulfilledActions(initialState.notFulfilledActions);
  }, [initialState]);
```

Also find, further down again (the `[fulfilledActions, notFulfilledActions, trackingActions]` state declarations that still exist below):
```ts
  const [fulfilledActions, setFulfilledActions] = useState<BranchAction[]>(
    initialState.fulfilledActions
  );
  const [notFulfilledActions, setNotFulfilledActions] = useState<BranchAction[]>(
    initialState.notFulfilledActions
  );
  const [trackingActions, setTrackingActions] = useState<BranchAction[]>(
    initialState.trackingActions
  );
```

Replace with:
```ts
  const [fulfilledActions, setFulfilledActions] = useState<BranchAction[]>(
    initialState.fulfilledActions
  );
  const [notFulfilledActions, setNotFulfilledActions] = useState<BranchAction[]>(
    initialState.notFulfilledActions
  );
```

- [ ] **Step 6: Add derived Situace/Závažnost lookups**

Right after the existing `const isRouteCompliance = ...` / `const isTrackingRecords = ...` lines, add:

```ts
  const situations = useSituations();
  const actionTags = useActionTags();
  const selectedSituationObj: Situation | undefined = situations.find((s) => s.id === selectedSituationId);
  const selectedSeverityObj: Severity | undefined = selectedSituationObj?.severities.find((s) => s.id === selectedSeverityId);

  function applySeverityTemplate(severity: Severity) {
    setRuleName(severity.vkrTitle);
    setRuleDescription(severity.vkrDescription ?? "");
    setPriority(severity.priority);
    setSeverityActions(
      severity.actions.map((a) => ({ id: a.id, actionTagId: a.actionTagId, enabled: true, description: a.description ?? "" }))
    );
  }

  function handleSelectSituation(situationId: string) {
    setSelectedSituationId(situationId);
    const nextSituation = situations.find((s) => s.id === situationId);
    const firstSeverity = nextSituation?.severities[0];
    setSelectedSeverityId(firstSeverity?.id ?? null);
    if (firstSeverity) applySeverityTemplate(firstSeverity);
  }

  function handleSelectSeverity(severity: Severity) {
    setSelectedSeverityId(severity.id);
    applySeverityTemplate(severity);
  }
```

- [ ] **Step 7: Remove the now-dangling `trackingTriggerLabel` declaration**

`selectedTrackingSituation` no longer exists after Step 5 above, so this line (originally right after `const triggerLabel = getTriggerLabel(...)`) must go too, or the file won't compile:

Find:
```ts
  const triggerLabel = getTriggerLabel(selectedSituation, checkInterval);
  const trackingTriggerLabel = getTrackingTriggerLabel(selectedTrackingSituation);
```

Replace with:
```ts
  const triggerLabel = getTriggerLabel(selectedSituation, checkInterval);
```

(The `getTrackingTriggerLabel` function itself is deleted in Task 17 Step 2, alongside the other now-unused tracking-config helpers — it has no other caller after this line goes.)

- [ ] **Step 9: Verify it compiles**

Run: `npm run build`
Expected: **Fails** at this point — the JSX further down in the file still references the now-deleted `selectedTrackingSituation`, `TrackingEventConfig`, `NoMovementConfig`, `StuckLocationConfig`, `trackingActions`, etc. That's expected; those references get replaced in Tasks 16-18. Confirm the errors are all about those specific names (not about anything in the state/helper code you just wrote) before moving on.

- [ ] **Step 10: Commit**

```bash
git add src/components/rules/RuleCreatorPage.tsx
git commit -m "refactor: replace tracking-situation state with Situace/Závažnost + Spouštěč state (WIP, JSX follows in next tasks)"
```

---

## Task 16: `RuleCreatorPage` — oblast pill bar + column 1 (Situace/Závažnost picker)

**Files:**
- Modify: `src/components/rules/RuleCreatorPage.tsx`

- [ ] **Step 1: Replace the top-level layout wrapper to add the oblast pill bar above the 3 columns**

Find:
```tsx
  return (
    <div className="flex h-screen w-screen flex-col bg-background text-foreground">
      <AppHeader current="rules" />

      <div className="flex flex-1 min-h-0">
        {/* LEFT COLUMN — Oblast + Situace + Meta */}
        <div className="flex w-[280px] shrink-0 flex-col border-r border-border">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Oblast */}
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Oblast</div>
              <div className="flex flex-col gap-1">
                {AREAS.map((area) => {
                  const Icon = resolveAreaIcon(area.icon);
                  const isSelected = selectedArea === area.id;
                  if (!area.enabled) {
                    return (
                      <div
                        key={area.id}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 opacity-40 cursor-not-allowed"
                      >
                        <Icon className="size-4 shrink-0 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground truncate">{area.label}</span>
                        <span className="ml-auto text-[10px] text-muted-foreground shrink-0">brzy</span>
                      </div>
                    );
                  }
                  return (
                    <button
                      key={area.id}
                      onClick={() => { setSelectedArea(area.id); setSelectedSituation(null); }}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors",
                        isSelected ? "bg-primary-soft text-primary" : "hover:bg-muted text-foreground"
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="text-sm truncate">{area.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Situace (tracking_records) */}
            {isTrackingRecords && (
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Situace</div>
                <div className="flex flex-col gap-1.5">
                  {TRACKING_SITUATION_CARDS.map((card) => {
                    const isSelected = selectedTrackingSituation === card.id;
                    return (
                      <button
                        key={card.id}
                        onClick={() => setSelectedTrackingSituation(card.id)}
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
```

Replace with:
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
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Situace + Závažnost (tracking_records) */}
            {isTrackingRecords && (
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Situace</div>
                <select
                  value={selectedSituationId ?? ""}
                  onChange={(e) => handleSelectSituation(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm mb-3"
                >
                  <option value="" disabled>— vyber situaci —</option>
                  {situations.filter((s) => s.area === "tracking_records").map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>

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
                      Předvyplní název/popis/prioritu a akce vpravo — dál nezávisle editovatelné.
                    </p>
                  </>
                )}
              </div>
            )}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: Still fails (middle/right column JSX not fixed yet, per Task 15 Step 7) — confirm the remaining errors are only about `selectedTrackingSituation`/`TrackingEventConfig`/`NoMovementConfig`/`StuckLocationConfig`/`trackingActions` further down, not about anything in the section you just edited.

- [ ] **Step 3: Commit**

```bash
git add src/components/rules/RuleCreatorPage.tsx
git commit -m "refactor: move Oblast to horizontal bar, column 1 is Situace/Závažnost picker (WIP)"
```

---

## Task 17: `RuleCreatorPage` — column 2 (meta + Spouštěč + 3 condition blocks)

**Files:**
- Modify: `src/components/rules/RuleCreatorPage.tsx`

- [ ] **Step 1: Replace the tracking_records branch of the middle column**

Find:
```tsx
            {isTrackingRecords && !selectedTrackingSituation && (
              <div className="rounded-xl border border-dashed border-border p-8 text-center">
                <div className="text-sm text-muted-foreground">Vyber situaci v levém sloupci.</div>
              </div>
            )}

            {isTrackingRecords && selectedTrackingSituation && (
              <>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                  <Lock className="size-3.5 text-muted-foreground shrink-0" />
                  <div className="text-sm text-muted-foreground flex-1 min-w-0">
                    <span className="font-medium text-foreground">Spouštěč:</span> {trackingTriggerLabel}
                  </div>
                  <button
                    disabled
                    title="Brzy: ruční úprava triggeru (plán, podmínka, manuální)."
                    className="flex items-center gap-1 rounded-md border border-dashed border-border px-2 py-1 text-[11px] text-muted-foreground opacity-60 cursor-not-allowed"
                  >
                    <Settings2 className="size-3" /> Pokročilé
                  </button>
                </div>

                {selectedTrackingSituation === "tracking_event" && (
                  <TrackingEventConfig
                    conditions={trackingConditions}
                    onConditions={setTrackingConditions}
                  />
                )}
                {selectedTrackingSituation === "no_movement" && (
                  <NoMovementConfig
                    duration={noMovementDuration}
                    onDuration={setNoMovementDuration}
                    unit={noMovementUnit}
                    onUnit={setNoMovementUnit}
                    ignoreClearance={ignoreClearance}
                    onIgnoreClearance={setIgnoreClearance}
                  />
                )}
                {selectedTrackingSituation === "stuck_location" && (
                  <StuckLocationConfig
                    count={stuckCount}
                    onCount={setStuckCount}
                    matchMode={stuckMatchMode}
                    onMatchMode={setStuckMatchMode}
                    trackingConditions={stuckInclude}
                    onTrackingConditions={setStuckInclude}
                  />
                )}

                {/* Podmínka zásilky — sdíleno pro všechny tracking situace */}
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Podmínka zásilky
                  </div>
                  <div className="text-[11px] text-muted-foreground mb-2">
                    Pravidlo se uplatní jen pro zásilky odpovídající těmto podmínkám. V selektoru jsou všechna pole zásilky.
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
            {isTrackingRecords && !selectedSeverityId && (
              <div className="rounded-xl border border-dashed border-border p-8 text-center">
                <div className="text-sm text-muted-foreground">Vyber situaci a závažnost v levém sloupci.</div>
              </div>
            )}

            {isTrackingRecords && selectedSeverityId && (
              <>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Spouštěč</div>
                  <div className="flex gap-1.5 rounded-lg bg-muted/40 p-1 max-w-xs">
                    <button
                      onClick={() => setTriggerType("automatic")}
                      className={cn(
                        "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                        triggerType === "automatic" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      ⚡ Automaticky
                    </button>
                    <button
                      onClick={() => setTriggerType("timer")}
                      className={cn(
                        "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                        triggerType === "timer" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      🕐 Časovač
                    </button>
                  </div>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    {triggerType === "automatic"
                      ? "Vyhodnotí se při každém novém tracking záznamu."
                      : "Kontroluje periodicky, jestli od posledního záznamu neuplynula nastavená doba."}
                  </p>
                </div>

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

- [ ] **Step 2: Delete the now-unused `TrackingEventConfig`, `NoMovementConfig`, `StuckLocationConfig`, `TrackingFieldSelect`, `TrackingConditionBuilder` functions**

These local helper components (originally around lines 1126-1391) are no longer referenced anywhere. Find and delete, in order:

1. The whole `TrackingFieldSelect` function.
2. The whole `TrackingConditionBuilder` function.
3. The whole `TrackingEventConfig` function.
4. The whole `NoMovementConfig` function.
5. The whole `StuckLocationConfig` function.

Each is a clearly bounded `function Name(...) { ... }` block under the `/* ─── Tracking configs ───────────────────────────────────── */` comment — delete the comment header too if nothing remains under it, since there's nothing tracking-config-specific left in this file (the new builders live in `src/components/rules/editors/`).

Also delete `getTrackingTriggerLabel` (in the `/* ─── Helpers ────────────────────────────────────────────── */` section near the bottom of the file):

Find:
```ts
function getTrackingTriggerLabel(situation: TrackingSituation | null): string {
  switch (situation) {
    case "tracking_event": return "Reaktivní — při každém novém tracking záznamu";
    case "no_movement": return "Časový plán (schedule) — systém kontroluje periodicky";
    case "stuck_location": return "Reaktivní — při každém novém tracking záznamu";
    default: return "—";
  }
}
```

Replace with nothing (delete entirely) — its only caller was the `trackingTriggerLabel` line removed in Task 15 Step 7.

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: Fewer errors than before — remaining ones should now only be about `trackingActions`/`ActionBranch` in the right column (Task 18) and the save handler (Task 19). If you see an error about `TrackingConditionRow` or `TrackingTimeSpec` being unused imports, leave them — `TrackingConditionRow` is still declared (harmless, unused-locals is off per `tsconfig.json`) and `TrackingTimeSpec`/`TrackingTimeValueEditor` are no longer used in this file if you deleted all the functions above; if so, also remove that import line:

Find:
```ts
import { TrackingTimeValueEditor, DEFAULT_TIME_SPEC, type TrackingTimeSpec } from "@/components/rules/editors/TrackingTimeValueEditor";
```
If nothing in the file still references `TrackingTimeValueEditor`/`DEFAULT_TIME_SPEC`/`TrackingTimeSpec` after Step 2, delete this line. If the "Migrace starých VkŘ podmínek" section at the bottom of the file (`convertLegacyVkrConditions`) or anything else still uses `TrackingTimeSpec`, keep it.

- [ ] **Step 4: Commit**

```bash
git add src/components/rules/RuleCreatorPage.tsx
git commit -m "refactor: column 2 now has Spouštěč + 3 condition blocks for tracking_records (WIP)"
```

---

## Task 18: `RuleCreatorPage` — column 3 (Akce) for tracking_records

**Files:**
- Modify: `src/components/rules/RuleCreatorPage.tsx`

- [ ] **Step 1: Replace the tracking_records branch of the right column**

Find:
```tsx
            {isTrackingRecords && (
              <ActionBranch
                label="Podmínka splněna"
                variant="fulfilled"
                actions={trackingActions}
                advancedOpen={advancedOpen}
                onToggleAdvanced={(id) => setAdvancedOpen((p) => ({ ...p, [id]: !p[id] }))}
                onAdd={() => setTrackingActions((prev) => [...prev, { id: "ta_" + Date.now(), type: "create_vkr", title: "" }])}
                onRemove={(id) => setTrackingActions((prev) => prev.filter((a) => a.id !== id))}
                onChangeType={(id, type) =>
                  setTrackingActions((prev) => prev.map((a) => a.id === id ? { ...a, type } : a))
                }
                onChangeTitle={(id, title) =>
                  setTrackingActions((prev) => prev.map((a) => a.id === id ? { ...a, title } : a))
                }
                onChangeVkrText={(id, vkrText) =>
                  setTrackingActions((prev) => prev.map((a) => a.id === id ? { ...a, vkrText } : a))
                }
                onChangeShipmentConditions={(id, shipmentConditions) =>
                  setTrackingActions((prev) => prev.map((a) => a.id === id ? { ...a, shipmentConditions } : a))
                }
              />
            )}
```

Replace with:
```tsx
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
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: Fewer errors — remaining ones should only be in the save handler (Task 19), which still references `trackingActions`.

- [ ] **Step 3: Commit**

```bash
git add src/components/rules/RuleCreatorPage.tsx
git commit -m "refactor: column 3 Akce for tracking_records now driven by severityActions (WIP)"
```

---

## Task 19: `RuleCreatorPage` — save handler + prefill from search params

**Files:**
- Modify: `src/components/rules/RuleCreatorPage.tsx`

- [ ] **Step 1: Update the Save button's `onClick` to build conditions/actions for tracking_records**

Find:
```tsx
            <button
              disabled={!ruleName || !selectedArea}
              onClick={() => {
                const id = existingRule?.id ?? ("rule_" + Date.now());
                const code = existingRule?.code ?? ("R" + Math.floor(Math.random() * 90 + 10));
                rulesStore.upsert({
                  id,
                  code,
                  name: ruleName,
                  description: ruleDescription || undefined,
                  area: selectedArea,
                  active,
                  priority: priority as Priority,
                  trigger: { kind: "condition_met", label: triggerLabel },
                  conditions: [],
                  actions: [...fulfilledActions, ...notFulfilledActions].map((a) => ({
                    id: a.id,
                    type: a.type as ActionType,
                    title: a.title,
                    vkrText: a.vkrText,
                    runWhenRouteCondition: fulfilledActions.includes(a) ? "fulfilled" : "not_fulfilled",
                  })),
                  uiState: {
                    selectedSituation,
                    selectedTrackingSituation,
                    deliveryMilestone,
                    checkTimes,
                    scheduleItems,
                    vkrConditions,
                    routeScope,
                    missedMilestoneType,
                    
                    tooLongMilestone,
                    tooLongThreshold,
                    checkInterval,
                    trackingConditions,
                    noMovementDuration,
                    noMovementUnit,
                    ignoreClearance,
                    stuckCount,
                    stuckMatchMode,
                    stuckInclude,
                    stuckExclude,
                    fulfilledActions,
                    notFulfilledActions,
                    trackingActions,
                  },
                });
                toast.success(isEdit ? "Pravidlo upraveno" : "Pravidlo uloženo");
                navigate({ to: "/" });
              }}
```

Replace with:
```tsx
            <button
              disabled={!ruleName || !selectedArea}
              onClick={() => {
                const id = existingRule?.id ?? ("rule_" + Date.now());
                const code = existingRule?.code ?? ("R" + Math.floor(Math.random() * 90 + 10));

                const trackingTrigger = triggerType === "timer"
                  ? { kind: "schedule" as const, label: "Časový plán — kontroluje periodicky" }
                  : { kind: "condition_met" as const, label: "Reaktivní — při každém novém tracking záznamu" };

                const trackingConditionsOut: Rule["conditions"] =
                  triggerType === "automatic"
                    ? [...currentRecordConditions, ...historyConditions]
                    : [...historyConditions];

                const trackingActionsOut: Rule["actions"] = severityActions
                  .filter((a) => a.enabled)
                  .map((a) => ({
                    id: a.id,
                    type: "create_vkr",
                    title: ruleName,
                    vkrText: a.description || undefined,
                    actionTagId: a.actionTagId,
                  }));

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
                toast.success(isEdit ? "Pravidlo upraveno" : "Pravidlo uloženo");
                navigate({ to: "/" });
              }}
```

- [ ] **Step 2: Wire up `initialSituationId`/`initialSeverityId` from Task 6**

Find (from Task 6's Step 2):
```tsx
  void initialSituationId; // wired up in Task 17
  void initialSeverityId; // wired up in Task 17
```

Replace with nothing (delete both lines) — instead, add an effect right after the `situations`/`actionTags`/`applySeverityTemplate`/`handleSelectSituation`/`handleSelectSeverity` block from Task 15 Step 6:

```ts
  useEffect(() => {
    if (isEdit || !initialSituationId) return;
    setSelectedArea("tracking_records");
    setSelectedSituationId(initialSituationId);
    const situation = situations.find((s) => s.id === initialSituationId);
    const severity = situation?.severities.find((s) => s.id === initialSeverityId) ?? situation?.severities[0];
    if (severity) {
      setSelectedSeverityId(severity.id);
      applySeverityTemplate(severity);
    }
    // Only run once on mount for the "+ Pravidlo pro tuto závažnost" entry point — deliberately
    // excludes `situations` from deps so it doesn't re-fire and clobber user edits on every store update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: Succeeds — this should be the last task that touches `RuleCreatorPage.tsx`'s logic.

- [ ] **Step 4: Commit**

```bash
git add src/components/rules/RuleCreatorPage.tsx
git commit -m "feat: wire up save handler and severity-prefill for tracking_records rules"
```

---

## Task 20: Manual QA pass

**Files:** none (verification only)

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`, open the printed local URL.

- [ ] **Step 2: Walk the whole flow**

1. Open `/` — confirm rule `T01` ("Zásilka se zasekla na jednom místě") still shows in the list.
2. Click "Situace a závažnosti →" — confirm `/situace` shows 3 situace: Nedoručeno, Poškození zásilky, Problém v přepravě.
3. Open "Problém v přepravě" — confirm 3 závažnosti (možný problém / zaseknutá na místě / podezření na ztrátu), and that "zaseknutá na místě" shows **1 pravidlo** with its trash icon disabled.
4. Click "+ Přidat akci" on "podezření na ztrátu", type a brand-new name, confirm "Vytvořit „…"" appears and adds it as a tag with an empty description field.
5. Click "+ Pravidlo pro tuto závažnost" on "možný problém" — confirm it lands on `/rules/new`, oblast is preselected to "Záznamy z trackingu" in the horizontal bar, Situace/Závažnost are preselected in column 1, and the name/description/priority/akce in columns 2-3 are prefilled from the severity's template.
6. In column 2, switch Spouštěč to "Časovač" — confirm "Podmínky současného záznamu" disappears and "Doba klidu" appears; switch back to "Automaticky" — confirm the reverse.
7. In "Podmínky současného záznamu", add a "Shoda hodnoty" row and an "Opakuje se" row — confirm each shows its own fields (pole+operátor+hodnota vs. pole+count+checkbox).
8. In "Podmínky na historii záznamů", add a row, toggle Obsahuje/Neobsahuje, switch between "V posledním záznamu" and "V posledních N záznamech" — confirm the "musí být nepřerušeně" checkbox is disabled only when scope is "poslední záznam".
9. In column 3 (Akce), uncheck the inherited action, confirm its text area greys out; add a new action via "Přidat akci".
10. Click "Uložit pravidlo" — confirm it navigates to `/` and the new rule appears in the list.
11. Click into the newly created rule's edit view (via the rule detail sidebar → "Upravit pravidlo") — confirm Situace/Závažnost/Spouštěč/conditions/actions all reload exactly as saved.
12. Switch the oblast pill bar to "Soulad s předepsanou trasou" and confirm that area's wizard (situation cards, route scope, milestone picker, fulfilled/nesplněno action branches) still behaves exactly as before this plan — this area was not supposed to change.

- [ ] **Step 3: Fix anything that doesn't match, then re-run Step 2 from the top**

- [ ] **Step 4: Final commit (only if Step 3 required fixes)**

```bash
git add -A
git commit -m "fix: address issues found in manual QA pass"
```
