# Tracking podmínky — časové okno a dva boxy — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Přepracovat podmínku „opakuje se" u tracking pravidel na časové okno a rozdělit editor podmínek na
dva samostatné boxy (příchozí záznam / historické záznamy) podle `docs/superpowers/specs/2026-07-19-tracking-opakuje-se-design.md`.

**Architecture:** Rozšířit `Condition` union o nové pole tvary, upravit pomocné funkce v `trackingFields.ts`,
nahradit jednu komponentu `TrackingConditionsBuilder.tsx` dvěma zaměřenými komponentami
(`TrackingIncomingConditionsBuilder.tsx`, `TrackingHistoricalConditionsBuilder.tsx`) a zapojit je do
`RuleCreatorPage.tsx` s viditelností podle spouštěče.

**Tech Stack:** React 19, TypeScript (strict), TanStack Start/Router, Tailwind, lucide-react ikony.

**Poznámka k testům:** Tenhle projekt (Lovable prototyp) nemá žádnou automatizovanou testovací
infrastrukturu (žádný vitest/jest, žádné `*.test.*` soubory). Místo psaní/spouštění testů každý krok ověřuje
`npx tsc --noEmit` (typecheck) a na konci manuální ověření v běžícím dev serveru přes Browser nástroj.
Baseline `npx tsc --noEmit` už dnes hlásí 2 preexistující chyby mimo dotčené soubory
(`RuleEditor.tsx:72`, `RulesList.tsx:88` — TanStack Router typing, nesouvisí s touhle prací) — cílem je
**nepřidat žádné nové** chyby, ne dosáhnout nuly.

---

## Task 1: Datový model — `Condition` typ

**Files:**
- Modify: `src/lib/model/types.ts:131-143`

- [ ] **Step 1: Nahradit variantu `tracking_aggregate` dvěma tvary podle `valueMode`**

V `src/lib/model/types.ts` nahraď blok (řádky 131–143):

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

tímhle:

```ts
export type Condition =
  | { kind: "field"; fieldId: string; operator: string; value?: string }
  | {
      kind: "tracking_aggregate";
      trackingFieldId: string;
      valueMode: "same_repeats";
      /** Číselná hodnota časového prahu, např. 24. */
      durationValue: number;
      durationUnit: "h" | "d";
      /** true = "musí to být nepřerušeně" (reset na jakoukoli změnu hodnoty). false = souhrnné sčítání i s přestávkami. */
      continuous: boolean;
      /** Volitelný reset bod podle statusu (typicky clění) — takový záznam pravidlo nikdy nespustí, jen posune počátek měřené série. */
      resetOn?: { fieldId: string; operator: "contains" | "not_contains"; value: string };
    }
  | {
      kind: "tracking_aggregate";
      trackingFieldId: string;
      valueMode: "specific";
      expectedValue?: string;
      /** "contains" (default) = je, "not_contains" = není. */
      mode?: "contains" | "not_contains";
      count: number;
      /** "any" = "nerozhoduje" (pole count je v UI neaktivní). */
      countOperator: "gt" | "lt" | "eq" | "any";
      occurrence: "consecutive" | "any";
      /** "recent" = jde o poslední záznamy (omezeno na posledních `count`). "anywhere" = kdekoliv v historii. */
      scope: "recent" | "anywhere";
    }
  | { kind: "route_compliance"; mode: "checkpoint_type" | "general"; checkpointTypeId?: string; generalCheck?: "unrecognized_location" | "unrecognized_status" };
```

- [ ] **Step 2: Typecheck (bude zatím červený jinde)**

Run: `npx tsc --noEmit`
Expected: Nové chyby v `src/lib/model/seed.ts`, `src/lib/model/trackingFields.ts`,
`src/components/rules/editors/TrackingConditionsBuilder.tsx`, `src/components/rules/RuleCreatorPage.tsx` —
to je očekávané, opraví se v dalších tascích. Potvrď jen, že chyby dávají smysl (chybějící/přebývající
pole `count`/`occurrence`/`durationValue`/atd.), ne že je něco úplně jinak rozbité.

- [ ] **Step 3: Commit**

```bash
git add src/lib/model/types.ts
git commit -m "refactor: rozdělit Condition.tracking_aggregate na časové a počet-based varianty"
```

---

## Task 2: Pomocné funkce — `trackingFields.ts`

**Files:**
- Modify: `src/lib/model/trackingFields.ts:30-45`

- [ ] **Step 1: Nahradit `RowKind`/`rowKindOf`/`isTrackingConditionRow`/`isHistoryCondition` dvěma sadami helperů**

V `src/lib/model/trackingFields.ts` nahraď všechno od řádku 30 (`export type RowKind`) do konce souboru
(řádek 45) tímhle:

```ts
type IncomingCondition =
  | Extract<Condition, { kind: "field" }>
  | Extract<Condition, { kind: "tracking_aggregate"; valueMode: "same_repeats" }>;

type HistoricalCondition = Extract<Condition, { kind: "tracking_aggregate"; valueMode: "specific" }>;

/** Řádek v boxu "Podmínky pro příchozí záznam". */
export type IncomingRowKind = "is" | "is_not" | "repeats";

/** True pro řádky boxu "Podmínky pro příchozí záznam" (je/není/opakuje se). */
export function isIncomingConditionRow(c: Condition): c is IncomingCondition {
  return c.kind === "field" || (c.kind === "tracking_aggregate" && c.valueMode === "same_repeats");
}

export function incomingRowKindOf(c: IncomingCondition): IncomingRowKind {
  if (c.kind === "field") return c.operator === "není" ? "is_not" : "is";
  return "repeats";
}

/** True pro řádky boxu "Podmínky pro historické záznamy". */
export function isHistoricalConditionRow(c: Condition): c is HistoricalCondition {
  return c.kind === "tracking_aggregate" && c.valueMode === "specific";
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: Chyby v `trackingFields.ts` zmizí. Zůstávají chyby v `seed.ts`,
`TrackingConditionsBuilder.tsx`, `RuleCreatorPage.tsx` (import `isHistoryCondition`, `isTrackingConditionRow`,
`rowKindOf`, `RowKind` už neexistují) — očekávané, řeší dál tasky.

- [ ] **Step 3: Commit**

```bash
git add src/lib/model/trackingFields.ts
git commit -m "refactor: nahradit RowKind helpery pro dva boxy (příchozí/historické záznamy)"
```

---

## Task 3: Migrace seed dat — `rule_t01` a `rule_t02`

**Files:**
- Modify: `src/lib/model/seed.ts:267-275` (rule_t01)
- Modify: `src/lib/model/seed.ts:317-325` (rule_t02)

- [ ] **Step 1: Přepsat podmínku `rule_t01` na časové okno**

V `src/lib/model/seed.ts` nahraď (uvnitř `rule_t01`):

```ts
    conditions: [
      {
        kind: "tracking_aggregate",
        trackingFieldId: "location_city",
        valueMode: "same_repeats",
        count: 3,
        occurrence: "consecutive",
      },
    ],
```

tímhle (24 h je provizorní hodnota — přesný práh je na doladění s byznysem, viz spec §6):

```ts
    conditions: [
      {
        kind: "tracking_aggregate",
        trackingFieldId: "location_city",
        valueMode: "same_repeats",
        durationValue: 24,
        durationUnit: "h",
        continuous: true,
      },
    ],
```

- [ ] **Step 2: Přepsat podmínku `rule_t02` na nový tvar `specific`**

Nahraď (uvnitř `rule_t02`):

```ts
    conditions: [
      {
        kind: "tracking_aggregate",
        trackingFieldId: "status_code",
        valueMode: "specific",
        expectedValue: "DELIVERY_ATTEMPTED",
        count: 2,
        occurrence: "any",
      },
    ],
```

tímhle:

```ts
    conditions: [
      {
        kind: "tracking_aggregate",
        trackingFieldId: "status_code",
        valueMode: "specific",
        expectedValue: "DELIVERY_ATTEMPTED",
        count: 2,
        countOperator: "eq",
        occurrence: "any",
        scope: "recent",
      },
    ],
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: Chyby v `seed.ts` zmizí. Zůstávají jen v `TrackingConditionsBuilder.tsx` a `RuleCreatorPage.tsx`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/model/seed.ts
git commit -m "feat: migrovat seed data T01/T02 na nový tvar tracking_aggregate"
```

---

## Task 4: Nová komponenta — `TrackingIncomingConditionsBuilder.tsx`

**Files:**
- Create: `src/components/rules/editors/TrackingIncomingConditionsBuilder.tsx`

- [ ] **Step 1: Vytvořit komponentu**

```tsx
import { FileText, Plus, X } from "lucide-react";
import {
  TRACKING_FIELDS,
  REPEATABLE_FIELDS,
  isIncomingConditionRow,
  incomingRowKindOf,
  type IncomingRowKind,
} from "@/lib/model/trackingFields";
import type { Condition } from "@/lib/model/types";

function fieldIdOf(row: Condition): string {
  return row.kind === "field" ? row.fieldId : row.kind === "tracking_aggregate" ? row.trackingFieldId : "";
}

export function TrackingIncomingConditionsBuilder({
  conditions,
  onChange,
}: {
  conditions: Condition[];
  onChange: (next: Condition[]) => void;
}) {
  const rows = conditions.filter(isIncomingConditionRow);

  function updateAt(index: number, next: Condition) {
    const target = rows[index];
    onChange(conditions.map((c) => (c === target ? next : c)));
  }

  function removeAt(index: number) {
    const target = rows[index];
    onChange(conditions.filter((c) => c !== target));
  }

  function addRow() {
    onChange([...conditions, { kind: "field", fieldId: "derivedStatus", operator: "je", value: "" }]);
  }

  function changeKind(index: number, kind: IncomingRowKind) {
    const row = rows[index];
    const fieldId = fieldIdOf(row);
    if (kind === "is" || kind === "is_not") {
      updateAt(index, {
        kind: "field",
        fieldId,
        operator: kind === "is" ? "je" : "není",
        value: row.kind === "field" ? (row.value ?? "") : "",
      });
    } else {
      const repeatableField = REPEATABLE_FIELDS.some((f) => f.value === fieldId) ? fieldId : REPEATABLE_FIELDS[0].value;
      updateAt(index, {
        kind: "tracking_aggregate",
        trackingFieldId: repeatableField,
        valueMode: "same_repeats",
        durationValue: 24,
        durationUnit: "h",
        continuous: true,
      });
    }
  }

  return (
    <div className="space-y-2">
      {rows.map((row, i) => {
        const kind = incomingRowKindOf(row);
        const fieldOptions = kind === "repeats" ? REPEATABLE_FIELDS : TRACKING_FIELDS;
        return (
          <div key={i} className="rounded-lg border border-border bg-background p-2.5 space-y-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <select
                value={fieldIdOf(row)}
                onChange={(e) => {
                  if (row.kind === "field") updateAt(i, { ...row, fieldId: e.target.value });
                  else if (row.kind === "tracking_aggregate") updateAt(i, { ...row, trackingFieldId: e.target.value });
                }}
                className="rounded border border-border bg-background px-2 py-1.5 text-xs"
              >
                {fieldOptions.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
              <select
                value={kind}
                onChange={(e) => changeKind(i, e.target.value as IncomingRowKind)}
                className="rounded border border-border bg-background px-2 py-1.5 text-xs"
              >
                <option value="is">je</option>
                <option value="is_not">není</option>
                <option value="repeats">opakuje se</option>
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
                  Bez konkrétní hodnoty — hlídá, jak dlouho pole nemění hodnotu. Vyhodnocuje se jen při nové
                  tracking události.
                </div>
                <a
                  href="https://claude.ai/code/artifact/2fd59815-c4c2-4d56-b0a6-e777c8b0fbed"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                >
                  <FileText className="size-3" /> Zadání pro implementaci — časové okno
                </a>
                <div className="flex items-center gap-2">
                  <span className="text-xs">hodnota platí už</span>
                  <input
                    type="number"
                    min={1}
                    value={row.durationValue}
                    onChange={(e) => updateAt(i, { ...row, durationValue: Number(e.target.value) })}
                    className="w-16 rounded border border-border bg-background px-2 py-1.5 text-xs text-center"
                  />
                  <select
                    value={row.durationUnit}
                    onChange={(e) => updateAt(i, { ...row, durationUnit: e.target.value as "h" | "d" })}
                    className="rounded border border-border bg-background px-2 py-1.5 text-xs"
                  >
                    <option value="h">hodin</option>
                    <option value="d">dní</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={row.continuous}
                    onChange={(e) => updateAt(i, { ...row, continuous: e.target.checked })}
                  />
                  musí to být nepřerušeně
                  <span className="text-[11px] text-muted-foreground">(vypnuto = sčítá se i s přestávkami)</span>
                </label>

                <div className="border-t border-dashed border-border pt-2 space-y-1.5">
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={!!row.resetOn}
                      onChange={(e) =>
                        updateAt(i, {
                          ...row,
                          resetOn: e.target.checked ? { fieldId: "derivedStatus", operator: "contains", value: "" } : undefined,
                        })
                      }
                    />
                    resetovat časomíru, když se objeví status
                  </label>
                  {row.resetOn && (
                    <div className="flex items-center gap-1.5 pl-6 flex-wrap">
                      <select
                        value={row.resetOn.fieldId}
                        onChange={(e) => updateAt(i, { ...row, resetOn: { ...row.resetOn!, fieldId: e.target.value } })}
                        className="rounded border border-border bg-background px-2 py-1 text-xs"
                      >
                        {TRACKING_FIELDS.map((f) => (
                          <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                      </select>
                      <select
                        value={row.resetOn.operator}
                        onChange={(e) =>
                          updateAt(i, { ...row, resetOn: { ...row.resetOn!, operator: e.target.value as "contains" | "not_contains" } })
                        }
                        className="rounded border border-border bg-background px-2 py-1 text-xs"
                      >
                        <option value="contains">obsahuje</option>
                        <option value="not_contains">neobsahuje</option>
                      </select>
                      <input
                        value={row.resetOn.value}
                        onChange={(e) => updateAt(i, { ...row, resetOn: { ...row.resetOn!, value: e.target.value } })}
                        placeholder="hodnota…"
                        className="flex-1 min-w-[100px] rounded border border-border bg-background px-2 py-1 text-xs"
                      />
                    </div>
                  )}
                  <p className="text-[11px] text-muted-foreground pl-6">
                    Takový záznam pravidlo samo nikdy nespustí a časomíra od něj počítá znovu.
                  </p>
                </div>
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

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: Nový soubor bez chyb. `RuleCreatorPage.tsx` a `TrackingConditionsBuilder.tsx` pořád chybové
(řeší task 6).

- [ ] **Step 3: Commit**

```bash
git add src/components/rules/editors/TrackingIncomingConditionsBuilder.tsx
git commit -m "feat: přidat TrackingIncomingConditionsBuilder (je/není/opakuje se s časovým oknem)"
```

---

## Task 5: Nová komponenta — `TrackingHistoricalConditionsBuilder.tsx`

**Files:**
- Create: `src/components/rules/editors/TrackingHistoricalConditionsBuilder.tsx`

- [ ] **Step 1: Vytvořit komponentu**

```tsx
import { Plus, X } from "lucide-react";
import { TRACKING_FIELDS, isHistoricalConditionRow } from "@/lib/model/trackingFields";
import { cn } from "@/lib/utils";
import type { Condition } from "@/lib/model/types";

export function TrackingHistoricalConditionsBuilder({
  conditions,
  onChange,
}: {
  conditions: Condition[];
  onChange: (next: Condition[]) => void;
}) {
  const rows = conditions.filter(isHistoricalConditionRow);

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
      {
        kind: "tracking_aggregate",
        trackingFieldId: "derivedStatus",
        valueMode: "specific",
        expectedValue: "",
        mode: "contains",
        count: 1,
        countOperator: "eq",
        occurrence: "any",
        scope: "recent",
      },
    ]);
  }

  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div key={i} className="rounded-lg border border-border bg-background p-2.5 space-y-2">
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
            <div className="flex gap-1">
              <button
                onClick={() => updateAt(i, { ...row, mode: "contains" })}
                className={cn(
                  "rounded-md px-2 py-1 text-[11px] font-medium",
                  (row.mode ?? "contains") === "contains" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}
              >
                je
              </button>
              <button
                onClick={() => updateAt(i, { ...row, mode: "not_contains" })}
                className={cn(
                  "rounded-md px-2 py-1 text-[11px] font-medium",
                  row.mode === "not_contains" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}
              >
                není
              </button>
            </div>
            <button onClick={() => removeAt(i)} className="ml-auto text-muted-foreground hover:text-foreground">
              <X className="size-3.5" />
            </button>
          </div>

          <input
            value={row.expectedValue ?? ""}
            onChange={(e) => updateAt(i, { ...row, expectedValue: e.target.value })}
            placeholder="hodnota…"
            className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs"
          />

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">počet záznamů</span>
            <select
              value={row.countOperator}
              onChange={(e) => updateAt(i, { ...row, countOperator: e.target.value as typeof row.countOperator })}
              className="rounded border border-border bg-background px-2 py-1.5 text-xs"
            >
              <option value="gt">větší než</option>
              <option value="lt">menší než</option>
              <option value="eq">rovno</option>
              <option value="any">nerozhoduje</option>
            </select>
            <input
              type="number"
              min={1}
              disabled={row.countOperator === "any"}
              value={row.count}
              onChange={(e) => updateAt(i, { ...row, count: Number(e.target.value) })}
              className="w-16 rounded border border-border bg-background px-2 py-1.5 text-xs text-center disabled:opacity-40"
            />
          </div>

          <div className="flex items-center gap-4 text-xs flex-wrap">
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={row.scope === "recent"}
                onChange={(e) => updateAt(i, { ...row, scope: e.target.checked ? "recent" : "anywhere" })}
              />
              jde o poslední záznamy
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={row.occurrence === "consecutive"}
                onChange={(e) => updateAt(i, { ...row, occurrence: e.target.checked ? "consecutive" : "any" })}
              />
              musí být za sebou
            </label>
          </div>
        </div>
      ))}

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

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: Nový soubor bez chyb.

- [ ] **Step 3: Commit**

```bash
git add src/components/rules/editors/TrackingHistoricalConditionsBuilder.tsx
git commit -m "feat: přidat TrackingHistoricalConditionsBuilder (počet s operátorem, scope, za sebou)"
```

---

## Task 6: Zapojení do `RuleCreatorPage.tsx` a smazání staré komponenty

**Files:**
- Modify: `src/components/rules/RuleCreatorPage.tsx:12-13` (importy)
- Modify: `src/components/rules/RuleCreatorPage.tsx:239` (save-time filtr)
- Modify: `src/components/rules/RuleCreatorPage.tsx:429-438` (JSX)
- Delete: `src/components/rules/editors/TrackingConditionsBuilder.tsx`

- [ ] **Step 1: Upravit importy**

V `src/components/rules/RuleCreatorPage.tsx` nahraď (řádky 12–13):

```ts
import { TrackingConditionsBuilder } from "@/components/rules/editors/TrackingConditionsBuilder";
import { isHistoryCondition } from "@/lib/model/trackingFields";
```

tímhle:

```ts
import { TrackingIncomingConditionsBuilder } from "@/components/rules/editors/TrackingIncomingConditionsBuilder";
import { TrackingHistoricalConditionsBuilder } from "@/components/rules/editors/TrackingHistoricalConditionsBuilder";
import { isHistoricalConditionRow } from "@/lib/model/trackingFields";
```

- [ ] **Step 2: Upravit save-time filtr pro spouštěč Časovač**

Nahraď (řádek 239):

```ts
                    ? trackingConditions.filter(isHistoryCondition)
```

tímhle:

```ts
                    ? trackingConditions.filter(isHistoricalConditionRow)
```

- [ ] **Step 3: Nahradit JSX blok dvěma boxy**

Nahraď (řádky 429–438):

```tsx
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
```

tímhle:

```tsx
                  {triggerType === "automatic" && (
                    <div className="mb-4">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                        Podmínky pro příchozí záznam
                      </div>
                      <TrackingIncomingConditionsBuilder
                        conditions={trackingConditions}
                        onChange={setTrackingConditions}
                      />
                    </div>
                  )}

                  <div className="mb-4">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Podmínky pro historické záznamy
                    </div>
                    <TrackingHistoricalConditionsBuilder
                      conditions={trackingConditions}
                      onChange={setTrackingConditions}
                    />
                  </div>
```

- [ ] **Step 4: Smazat starou komponentu**

```bash
rm src/components/rules/editors/TrackingConditionsBuilder.tsx
```

- [ ] **Step 5: Typecheck — musí být čisté**

Run: `npx tsc --noEmit`
Expected: Přesně ty samé 2 preexistující chyby jako na začátku (`RuleEditor.tsx:72`, `RulesList.tsx:88`),
nic navíc, nic v žádném ze souborů dotčených touhle prací.

- [ ] **Step 6: Commit**

```bash
git add -A src/components/rules/RuleCreatorPage.tsx src/components/rules/editors/TrackingConditionsBuilder.tsx
git commit -m "feat: rozdělit editor tracking podmínek na dva boxy podle spouštěče"
```

---

## Task 7: Manuální ověření v prototypu

**Files:** žádné (jen ověření přes Browser nástroj)

- [ ] **Step 1: Spustit dev server**

Server v téhle worktree už typicky běží na `http://localhost:8081` (`npm run dev -- --port 8081` z
`.claude/worktrees/situace-zavaznost-akce`). Pokud neběží, spustit ho odsud.

- [ ] **Step 2: Otevřít editaci pravidla T01 (`/rules/rule_t01/edit`)**

Ověřit:
- Spouštěč je „⚡ Automaticky" → vidět oba boxy: „Podmínky pro příchozí záznam" a „Podmínky pro historické
  záznamy".
- V boxu „příchozí záznam" je řádek „ID místa" / „Město" (podle migrace) / „opakuje se" s polem „hodnota
  platí už 24 hodin", checkboxem „musí to být nepřerušeně" (zapnutý) a odkazem „Zadání pro implementaci —
  časové okno" (musí vést na `https://claude.ai/code/artifact/2fd59815-c4c2-4d56-b0a6-e777c8b0fbed`).
- Zapnutí checkboxu „resetovat časomíru, když se objeví status" ukáže pole/operátor/hodnotu a jde vyplnit.

- [ ] **Step 3: Přepnout spouštěč na „🕐 Časovač"**

Ověřit: box „Podmínky pro příchozí záznam" úplně zmizí, zůstane jen „Podmínky pro historické záznamy".

- [ ] **Step 4: V boxu „historické záznamy" přidat podmínku a projít operátor počtu**

Klikni „+ přidat podmínku", zkontroluj:
- Dropdown pole (všechna `TRACKING_FIELDS`, ne jen `REPEATABLE_FIELDS`).
- Tlačítka je/není.
- Vstup hodnoty.
- Select operátoru počtu (větší než/menší než/rovno/nerozhoduje) — při „nerozhoduje" se číselné pole
  vizuálně deaktivuje (šedé, needitovatelné).
- Checkboxy „jde o poslední záznamy" a „musí být za sebou" fungují nezávisle na sobě.

- [ ] **Step 5: Screenshot obou stavů (Automaticky / Časovač) pro záznam**

Použij `computer` nástroj (`screenshot`) na obě konfigurace, potvrď vizuálně shodu s náčrty z brainstormingu
(`.superpowers/brainstorm/.../dva-boxy-overview.html`, `pocet-operator.html` — pokud ještě existují lokálně).

- [ ] **Step 6: Zkontrolovat, že uložení pravidla nehodí chybu**

Klikni „Uložit změny", zkontroluj toast „Pravidlo upraveno" a žádnou chybu v konzoli
(`read_console_messages`, `onlyErrors: true`).

---

## Self-Review Checklist (pro toho, kdo plán píše/kontroluje před spuštěním)

- **Pokrytí specifikace:** §3 (časové okno) → Task 1+4. §4 (dva boxy + viditelnost podle spouštěče) →
  Task 6. §5 (historický box, operátor počtu) → Task 5. §7 (datový model) → Task 1. Migrace seed dat → Task 3.
- **Typová konzistence:** `durationValue`/`durationUnit`/`continuous`/`resetOn` používané shodně v Task 1
  (typ) a Task 4 (komponenta) i Task 3 (seed data). `count`/`countOperator`/`occurrence`/`scope` shodně
  v Task 1, Task 3 (rule_t02) a Task 5.
- **Beze změny:** `mockups/2026-07-19-tracking-opakuje-se-zadani.html` se v tomhle plánu nikde needituje —
  jen se na něj odkazuje link v Task 4.
