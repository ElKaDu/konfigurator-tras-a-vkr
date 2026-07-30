# Checklist položka — light flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 5-state, modal-form checklist item flow with a light 3-state derived model — independent, always-editable Nález/Řešení dropdown fields, autosave, manual-only resolution, auto-attaching call scheduling, undo, and a "Hotovo" collapse per category — per `docs/superpowers/specs/2026-07-30-checklist-polozka-light-flow-design.md`.

**Architecture:** `ChecklistItemState` becomes a pure function of three stored booleans (no stored `state` field). Two small new modules (`TemplatedField.tsx` for the dropdown+"Jiné…"+checkbox row, `kontaktSync.ts` for the cross-store auto-attach/detach logic) get reused across `ChecklistItemRow`. `ItemResolutionForm.tsx` is deleted. `KontaktSchedulerDialog`/`KontaktWidget`/`ShrnutiNalezuPanel`/`VkrPanel`/`AppHeader`/`ChecklistPage` get updated to match the new field names and to add the auto-attach preview, call history, and nav/heading changes from the spec.

**Tech Stack:** TanStack Start (React + Vite), TanStack Router, Tailwind + shadcn/ui, no test framework in this repo — verification is `tsc --noEmit` plus manual browser walkthrough (established pattern from the prior plan, see Task 14).

---

### Task 1: `types.ts` — new data model

**Files:**
- Modify: `src/lib/checklist/types.ts`

- [ ] **Step 1: Replace the file contents**

```ts
export type ChecklistCategory = "obsah" | "hodnota" | "dokumentace";

export const CHECKLIST_CATEGORY_ORDER: ChecklistCategory[] = ["obsah", "hodnota", "dokumentace"];

export const CHECKLIST_CATEGORY_LABELS: Record<ChecklistCategory, string> = {
  obsah: "Obsah zásilky — přípustnost",
  hodnota: "Hodnota, odpovědnost, pojištění",
  dokumentace: "Dokumentace",
};

/** Tři stavy — nikdy se neukládá ručně, vždy se odvozuje přes deriveItemState() v derived.ts. */
export type ChecklistItemState = "open" | "waiting_contact" | "resolved";

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
  /** Prázdné pole = rovnou textové pole místo dropdownu. Dropdown vždy interně přidává "Jiné…". */
  findingOptions: string[];
  resolutionOptions: string[];
  /** Řídí, jestli se u položky (jakmile má vyplněné Řešení) nabízí "Založit věc k řešení". */
  canTrackForMonitoring: boolean;
}

/** Instance kontroly na konkrétní objednávce. */
export interface ChecklistItem {
  id: string;
  templateId: string;

  findingValue?: string;
  findingIsSuspicion: boolean;

  resolutionValue?: string;
  resolutionNeedsConfirm: boolean;

  manuallyResolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;

  /** Vyplněno, dokud je položka navázaná na (aktivní) kontakt. */
  kontaktId?: string;
  /** Nezávislé na stavu — položka může mít sledování i po vyřešení. */
  trackingVkrId?: string;
  /** Sdílená poznámka, viditelná i v přehledu callů. */
  noteValue?: string;
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

/** VkŘ vytvořená ze sledování jedné konkrétní položky. */
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

- [ ] **Step 2: Verify (will show errors elsewhere — expected until later tasks land)**

Run: `npx tsc --noEmit 2>&1 | grep -c checklist`
Expected: a non-zero count (other files still reference the old shape — resolved by later tasks).

- [ ] **Step 3: Commit**

```bash
git add src/lib/checklist/types.ts
git commit -m "refactor(checklist): simplify item model to 3 derived states"
```

---

### Task 2: `derived.ts` — state derivation and summary helpers

**Files:**
- Modify: `src/lib/checklist/derived.ts`

- [ ] **Step 1: Replace the file contents**

```ts
import type { ChecklistCategory, ChecklistItem, ChecklistItemState, Kontakt } from "./types";
import { CHECKLIST_CATEGORY_ORDER, CHECKLIST_CATEGORY_LABELS } from "./types";
import { templateById } from "./store";
import { kontaktyStore } from "./store";

export function deriveItemState(item: ChecklistItem): ChecklistItemState {
  if (item.manuallyResolved) return "resolved";
  if (item.findingIsSuspicion || item.resolutionNeedsConfirm) return "waiting_contact";
  return "open";
}

/** Volat, jen když deriveItemState(item) === "waiting_contact". */
export function waitingContactDetail(item: ChecklistItem): "missing_resolution" | "needs_confirm" {
  return item.resolutionValue ? "needs_confirm" : "missing_resolution";
}

export function isResolved(item: ChecklistItem): boolean {
  return deriveItemState(item) === "resolved";
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

/** Položky s nálezem nebo poznámkou, bez ohledu na stav — pro rozšířený panel Shrnutí. */
export function noteworthyItems(items: ChecklistItem[]): ChecklistItem[] {
  return items.filter((i) => !!i.findingValue || !!i.noteValue);
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

- [ ] **Step 2: Commit**

```bash
git add src/lib/checklist/derived.ts
git commit -m "refactor(checklist): derive item state and add noteworthyItems helper"
```

---

### Task 3: `seed.ts` — templates and items in the new shape

**Files:**
- Modify: `src/lib/checklist/seed.ts`

- [ ] **Step 1: Replace the file contents**

```ts
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
    findingOptions: ["V pořádku, žádná závada", "Obsahuje powerbanku / Li-ion baterii", "Obsahuje jinou nepřípustnou položku"],
    resolutionOptions: ["Zákazník věc vyndal, přeprava pokračuje", "Přeprava zrušena", "Nepřiznané poslání"],
    canTrackForMonitoring: false,
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
    findingOptions: ["V pořádku, neobsahuje nebezpečné látky", "Podezření na nebezpečnou látku (hořlavina, parfém apod.)"],
    resolutionOptions: ["Věc vyndána, přeprava pokračuje standardně", "Přeprava zrušena", "Nepřiznané poslání"],
    canTrackForMonitoring: false,
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
    findingOptions: ["Potvrzeno, jsou to dokumenty", "Nejedná se jen o dokumenty"],
    resolutionOptions: ["Přeřazeno na balík", "Sazba potvrzena jako dokumenty"],
    canTrackForMonitoring: false,
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
    findingOptions: ["Hodnota převyšuje limit odpovědnosti", "V pořádku, v rámci limitu"],
    resolutionOptions: ["Pojištěno", "Necháváme bez pojištění"],
    canTrackForMonitoring: false,
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
    findingOptions: ["Komodita pojistitelná jen v omezeném rozsahu", "Komodita plně pojistitelná"],
    resolutionOptions: ["Pojištění v omezeném rozsahu ponecháno", "Pojištění zrušeno, peníze vráceny"],
    canTrackForMonitoring: false,
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
    findingOptions: ["Podezření na řádovou chybu v zadané hodnotě", "Hodnota odpovídá"],
    resolutionOptions: ["Hodnota potvrzena", "Hodnota opravena"],
    canTrackForMonitoring: false,
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
    findingOptions: ["Faktura nedodána", "Faktura dodána, ale s chybou", "V pořádku"],
    resolutionOptions: ["Faktura upravena se zákazníkem", "Fakturu vytvoříme my", "Čekáme na dodání"],
    canTrackForMonitoring: true,
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
    findingOptions: ["EORI chybí nebo neplatné", "EORI v pořádku"],
    resolutionOptions: ["Čekáme na vyřízení", "Klient EORI doplnil"],
    canTrackForMonitoring: true,
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
    findingValue: "Obsahovalo powerbanku (Li-ion).",
    findingIsSuspicion: false,
    resolutionValue: "Zákazník věc vyndal, přeprava pokračuje — potvrzeno e-mailem.",
    resolutionNeedsConfirm: false,
    manuallyResolved: true,
    resolvedAt: nextNoon(0, 10, 12),
    resolvedBy: "E. Kadubcová",
  },
  {
    id: "item_dg",
    templateId: "tpl_dg",
    findingIsSuspicion: false,
    resolutionNeedsConfirm: false,
    manuallyResolved: false,
  },
  {
    id: "item_dokumenty",
    templateId: "tpl_dokumenty",
    findingIsSuspicion: false,
    resolutionNeedsConfirm: false,
    manuallyResolved: false,
  },
  {
    id: "item_hodnota_odpovednost",
    templateId: "tpl_hodnota_odpovednost",
    findingValue: "Hodnota převyšuje limit odpovědnosti.",
    findingIsSuspicion: false,
    resolutionNeedsConfirm: true,
    manuallyResolved: false,
    kontaktId: "kontakt_1",
  },
  {
    id: "item_pojistitelnost",
    templateId: "tpl_pojistitelnost",
    findingValue: "Komodita pojistitelná jen v omezeném rozsahu.",
    findingIsSuspicion: false,
    resolutionNeedsConfirm: true,
    manuallyResolved: false,
    kontaktId: "kontakt_1",
  },
  {
    id: "item_hodnota_chyba",
    templateId: "tpl_hodnota_chyba",
    findingIsSuspicion: false,
    resolutionNeedsConfirm: false,
    manuallyResolved: false,
  },
  {
    id: "item_celni_faktura",
    templateId: "tpl_celni_faktura",
    findingValue: "Faktura nedodána.",
    findingIsSuspicion: false,
    resolutionValue: "Čekáme na dodání",
    resolutionNeedsConfirm: false,
    manuallyResolved: false,
    trackingVkrId: "vkr_celni_faktura",
  },
  {
    id: "item_eori",
    templateId: "tpl_eori",
    findingValue: "EORI chybí nebo neplatné.",
    findingIsSuspicion: false,
    resolutionValue: "Čekáme na vyřízení",
    resolutionNeedsConfirm: false,
    manuallyResolved: false,
  },
];

/** Pomocná funkce pro čitelná seed data — "zítra/pozítří v HH:MM", bez závislosti na knihovně. */
function nextNoon(daysFromNow: number, hour: number, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/checklist/seed.ts
git commit -m "refactor(checklist): update seed data for new item/template shape"
```

---

### Task 4: `TemplatedField.tsx` — shared dropdown+"Jiné…"+checkbox row

**Files:**
- Create: `src/components/checklist/TemplatedField.tsx`

- [ ] **Step 1: Write the component**

```tsx
import { useState } from "react";

const OTHER = "__other__";

export function TemplatedField({
  label,
  options,
  value,
  onChange,
  checkboxLabel,
  checked,
  onCheckedChange,
}: {
  label: string;
  options: string[];
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  checkboxLabel: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  const startsAsFreeText = options.length === 0 || (!!value && !options.includes(value));
  const [freeText, setFreeText] = useState(startsAsFreeText);

  function handleSelectChange(next: string) {
    if (next === OTHER) {
      setFreeText(true);
      onChange(undefined);
      return;
    }
    onChange(next || undefined);
  }

  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
      <span className="w-14 shrink-0 pt-1.5 text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground sm:pt-0">
        {label}
      </span>
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {options.length > 0 && !freeText ? (
          <select
            value={value ?? ""}
            onChange={(e) => handleSelectChange(e.target.value)}
            className="min-w-0 flex-1 rounded-md border border-input bg-transparent px-2.5 py-1.5 text-[12.5px]"
          >
            <option value="">— nevybráno —</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
            <option value={OTHER}>Jiné…</option>
          </select>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <input
              type="text"
              value={value ?? ""}
              onChange={(e) => onChange(e.target.value || undefined)}
              placeholder="Popiš vlastními slovy…"
              className="min-w-0 flex-1 rounded-md border border-input bg-transparent px-2.5 py-1.5 text-[12.5px]"
            />
            {options.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setFreeText(false);
                  onChange(undefined);
                }}
                className="shrink-0 text-[10.5px] text-muted-foreground hover:text-foreground"
              >
                zpět na výběr
              </button>
            )}
          </div>
        )}
        <label className="flex shrink-0 items-center gap-1.5 text-[11px] text-secondary-foreground">
          <input type="checkbox" checked={checked} onChange={(e) => onCheckedChange(e.target.checked)} />
          {checkboxLabel}
        </label>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit 2>&1 | grep -i TemplatedField`
Expected: no output (no errors reference this file).

- [ ] **Step 3: Commit**

```bash
git add src/components/checklist/TemplatedField.tsx
git commit -m "feat(checklist): add TemplatedField dropdown+free-text+checkbox row"
```

---

### Task 5: `kontaktSync.ts` — auto-attach/detach on checkbox change

**Files:**
- Create: `src/lib/checklist/kontaktSync.ts`

- [ ] **Step 1: Write the helper**

```ts
import { checklistItemsStore, kontaktyStore } from "./store";
import type { ChecklistItem } from "./types";

/**
 * Po každé změně findingIsSuspicion/resolutionNeedsConfirm dorovná navázání položky na
 * aktuálně naplánovaný kontakt (jeden call pro vše, co čeká), nebo ji odpojí, pokud už žádný
 * checkbox není zatržený.
 */
export function syncKontaktAttachment(next: ChecklistItem): void {
  const needsContact = next.findingIsSuspicion || next.resolutionNeedsConfirm;

  if (needsContact && !next.kontaktId) {
    const planned = kontaktyStore.all().find((k) => k.status === "planned");
    if (planned) {
      checklistItemsStore.update(next.id, { kontaktId: planned.id });
      kontaktyStore.update(planned.id, { linkedItemIds: [...planned.linkedItemIds, next.id] });
    }
    return;
  }

  if (!needsContact && next.kontaktId) {
    const kontakt = kontaktyStore.byId(next.kontaktId);
    if (kontakt) {
      kontaktyStore.update(kontakt.id, {
        linkedItemIds: kontakt.linkedItemIds.filter((id) => id !== next.id),
      });
    }
    checklistItemsStore.update(next.id, { kontaktId: undefined });
  }
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit 2>&1 | grep -i kontaktSync`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/lib/checklist/kontaktSync.ts
git commit -m "feat(checklist): add auto-attach/detach sync for shared call"
```

---

### Task 6: `ChecklistItemRow.tsx` — rewrite with two rows, autosave, undo, context beside fields

**Files:**
- Modify: `src/components/checklist/ChecklistItemRow.tsx`

- [ ] **Step 1: Replace the file contents**

```tsx
import { useState } from "react";
import type { ChecklistItem, ChecklistItemTemplate } from "@/lib/checklist/types";
import { checklistItemsStore, checklistVkrStore } from "@/lib/checklist/store";
import { deriveItemState, waitingContactDetail } from "@/lib/checklist/derived";
import { syncKontaktAttachment } from "@/lib/checklist/kontaktSync";
import { ItemContext } from "./ItemContext";
import { TemplatedField } from "./TemplatedField";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ChecklistItemRow({ item, template }: { item: ChecklistItem; template: ChecklistItemTemplate }) {
  const [showContext, setShowContext] = useState(false);
  const state = deriveItemState(item);

  function patch(fields: Partial<ChecklistItem>) {
    checklistItemsStore.update(item.id, fields);
    syncKontaktAttachment({ ...item, ...fields });
  }

  function resolve() {
    checklistItemsStore.update(item.id, {
      manuallyResolved: true,
      resolvedAt: new Date().toISOString(),
      resolvedBy: "E. Kadubcová",
    });
  }

  function reopen() {
    checklistItemsStore.update(item.id, { manuallyResolved: false, resolvedAt: undefined, resolvedBy: undefined });
  }

  function createTrackingVkr() {
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
    checklistItemsStore.update(item.id, { trackingVkrId: id });
  }

  const trackingTag = item.trackingVkrId && (
    <span className="rounded-full border border-dashed border-info px-2 py-0.5 text-[9.5px] font-bold text-info-foreground">
      ⏳ sleduje se
    </span>
  );

  const contextButton = (
    <button
      onClick={() => setShowContext((s) => !s)}
      className="text-[11px] font-semibold text-primary hover:underline"
    >
      🛈 kontext zásilky
    </button>
  );

  if (state === "resolved") {
    return (
      <div className="border-b border-border py-3 last:border-0">
        <div className="flex gap-2.5">
          <span className="mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border border-success bg-success text-[10px] text-success-foreground">
            ✓
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[13.5px] font-semibold text-muted-foreground">{template.title}</span>
              {contextButton}
              <span className="rounded-full bg-success/15 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-success-foreground">
                vyřešeno
              </span>
              {trackingTag}
            </div>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">
              {[item.findingValue && `Nález: ${item.findingValue}`, item.resolutionValue && `Řešení: ${item.resolutionValue}`]
                .filter(Boolean)
                .join(" · ") || "Označeno bez nálezu."}
            </p>
            {showContext && (
              <div className="mt-2">
                <ItemContext title={template.title} fields={template.context} />
              </div>
            )}
            <button onClick={reopen} className="mt-1.5 text-[11px] font-medium text-primary hover:underline">
              ↺ vrátit do otevřeného stavu
            </button>
          </div>
        </div>
      </div>
    );
  }

  const detail = state === "waiting_contact" ? waitingContactDetail(item) : undefined;

  return (
    <div className="border-b border-border py-3 last:border-0">
      <div className="flex gap-2.5">
        <StateDot state={state} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13.5px] font-semibold">{template.title}</span>
            {contextButton}
            {state === "waiting_contact" && (
              <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-warning-foreground">
                čeká na kontakt · {detail === "needs_confirm" ? "řešení k potvrzení" : "řešení chybí"}
              </span>
            )}
            {trackingTag}
          </div>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">{template.description}</p>

          <div className="mt-2.5 flex flex-col gap-3 lg:flex-row lg:items-start">
            <div className="flex flex-1 flex-col gap-2">
              <TemplatedField
                label="Nález"
                options={template.findingOptions}
                value={item.findingValue}
                onChange={(v) => patch({ findingValue: v })}
                checkboxLabel="podezření"
                checked={item.findingIsSuspicion}
                onCheckedChange={(c) => patch({ findingIsSuspicion: c })}
              />
              <TemplatedField
                label="Řešení"
                options={template.resolutionOptions}
                value={item.resolutionValue}
                onChange={(v) => patch({ resolutionValue: v })}
                checkboxLabel="potvrdit s klientem"
                checked={item.resolutionNeedsConfirm}
                onCheckedChange={(c) => patch({ resolutionNeedsConfirm: c })}
              />
              <div className="flex items-start gap-1.5">
                <span className="w-14 shrink-0 pt-1.5 text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">
                  Pozn.
                </span>
                <Textarea
                  value={item.noteValue ?? ""}
                  onChange={(e) => patch({ noteValue: e.target.value || undefined })}
                  rows={1}
                  className="flex-1 text-[12.5px]"
                  placeholder="Poznámka…"
                />
              </div>
              <div className="flex flex-wrap gap-2 pt-0.5">
                <Button size="sm" onClick={resolve}>
                  ✓ Označit jako vyřešeno
                </Button>
                {item.resolutionValue && template.canTrackForMonitoring && (
                  <Button size="sm" variant="outline" onClick={createTrackingVkr}>
                    + Založit věc k řešení
                  </Button>
                )}
              </div>
            </div>
            {showContext && (
              <div className="lg:w-64 lg:shrink-0">
                <ItemContext title={template.title} fields={template.context} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StateDot({ state }: { state: "open" | "waiting_contact" }) {
  const base = "mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border text-[10px]";
  if (state === "waiting_contact") {
    return <span className={`${base} border-warning bg-warning/15 text-warning-foreground`}>📞</span>;
  }
  return <span className={`${base} border-input bg-transparent`} />;
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit 2>&1 | grep -i ChecklistItemRow`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/components/checklist/ChecklistItemRow.tsx
git commit -m "refactor(checklist): rewrite item row with independent finding/resolution fields"
```

---

### Task 7: `ItemsList.tsx` — collapse "Hotovo" per category

**Files:**
- Modify: `src/components/checklist/ItemsList.tsx`

- [ ] **Step 1: Replace the file contents**

```tsx
import { useState } from "react";
import { useChecklistItems } from "@/lib/checklist/store";
import { templateById } from "@/lib/checklist/store";
import { CHECKLIST_CATEGORY_ORDER, CHECKLIST_CATEGORY_LABELS } from "@/lib/checklist/types";
import type { ChecklistItem } from "@/lib/checklist/types";
import { categoryCounts, deriveItemState } from "@/lib/checklist/derived";
import { ChecklistItemRow } from "./ChecklistItemRow";

export function ItemsList() {
  const items = useChecklistItems();
  const counts = categoryCounts(items);

  return (
    <div className="flex flex-col gap-4">
      {CHECKLIST_CATEGORY_ORDER.map((category) => {
        const inCategory = items.filter((i) => templateById(i.templateId)?.category === category);
        const open = inCategory.filter((i) => deriveItemState(i) !== "resolved");
        const done = inCategory.filter((i) => deriveItemState(i) === "resolved");
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
              {open.map((item) => {
                const tpl = templateById(item.templateId);
                if (!tpl) return null;
                return <ChecklistItemRow key={item.id} item={item} template={tpl} />;
              })}
              {done.length > 0 && <DoneDisclosure items={done} />}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function DoneDisclosure({ items }: { items: ChecklistItem[] }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="py-1.5">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full rounded-md bg-muted px-2.5 py-1.5 text-left text-[12px] font-bold text-muted-foreground"
      >
        {expanded ? "▾" : "▸"} Hotovo ({items.length})
      </button>
      {expanded && (
        <div className="pl-3">
          {items.map((item) => {
            const tpl = templateById(item.templateId);
            if (!tpl) return null;
            return <ChecklistItemRow key={item.id} item={item} template={tpl} />;
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit 2>&1 | grep -i ItemsList`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/components/checklist/ItemsList.tsx
git commit -m "feat(checklist): collapse resolved items into a Hotovo disclosure"
```

---

### Task 8: Remove `ItemResolutionForm.tsx`

**Files:**
- Delete: `src/components/checklist/ItemResolutionForm.tsx`

- [ ] **Step 1: Confirm nothing still imports it**

Run: `grep -rn "ItemResolutionForm" src/`
Expected: no matches (Task 6 already removed the only import site).

- [ ] **Step 2: Delete the file**

```bash
git rm src/components/checklist/ItemResolutionForm.tsx
```

- [ ] **Step 3: Commit**

```bash
git commit -m "refactor(checklist): remove modal ItemResolutionForm, superseded by inline fields"
```

---

### Task 9: `KontaktSchedulerDialog.tsx` — auto-attach preview instead of manual selection

**Files:**
- Modify: `src/components/checklist/KontaktSchedulerDialog.tsx`

- [ ] **Step 1: Replace the file contents**

```tsx
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
import { useChecklistItems, checklistItemsStore, kontaktyStore, templateById } from "@/lib/checklist/store";
import { deriveItemState } from "@/lib/checklist/derived";
import type { KontaktType } from "@/lib/checklist/types";

export function KontaktSchedulerDialog({ onClose }: { onClose: () => void }) {
  const items = useChecklistItems();
  const eligible = items.filter((i) => deriveItemState(i) === "waiting_contact" && !i.kontaktId);

  const [type, setType] = useState<KontaktType>("customer");
  const [scheduledAt, setScheduledAt] = useState(defaultDateTimeLocal());
  const [note, setNote] = useState("");

  function submit() {
    const id = "kontakt_" + Date.now();
    const itemIds = eligible.map((i) => i.id);
    kontaktyStore.create({
      id,
      type,
      scheduledAt: new Date(scheduledAt).toISOString(),
      note: note || undefined,
      status: "planned",
      linkedItemIds: itemIds,
    });
    itemIds.forEach((itemId) => {
      checklistItemsStore.update(itemId, { kontaktId: id });
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
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Tento call se týká {eligible.length} {eligible.length === 1 ? "položky" : "položek"} — připojily se samy
            </label>
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-border p-2">
              {eligible.length === 0 && (
                <p className="px-1 py-2 text-xs text-muted-foreground">Žádná položka zatím nečeká na kontakt.</p>
              )}
              {eligible.map((i) => {
                const tpl = templateById(i.templateId);
                return (
                  <div key={i.id} className="rounded px-1.5 py-1 text-[13px]">
                    {tpl?.title}
                  </div>
                );
              })}
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Seznam je jen náhled — co se má na call probrat, se řeší checkboxem přímo u položky.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Zrušit
          </Button>
          <Button onClick={submit} disabled={eligible.length === 0}>
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

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit 2>&1 | grep -i KontaktSchedulerDialog`
Expected: no output (will still show for `KontaktWidget.tsx`'s call site until Task 10 lands — that's expected).

- [ ] **Step 3: Commit**

```bash
git add src/components/checklist/KontaktSchedulerDialog.tsx
git commit -m "refactor(checklist): auto-attach eligible items to call, remove manual selection"
```

---

### Task 10: `KontaktWidget.tsx` — drop `preselectedItemIds`

**Files:**
- Modify: `src/components/checklist/KontaktWidget.tsx`

- [ ] **Step 1: Replace the file contents**

```tsx
import { useState } from "react";
import { Phone } from "lucide-react";
import { useKontakty, useChecklistItems, templateById } from "@/lib/checklist/store";
import { nextPlannedKontakt, formatKontaktDateTime } from "@/lib/checklist/derived";
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
        {scheduling && <KontaktSchedulerDialog onClose={() => setScheduling(false)} />}
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

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit 2>&1 | grep -iE "KontaktWidget|KontaktSchedulerDialog"`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/components/checklist/KontaktWidget.tsx
git commit -m "refactor(checklist): drop preselectedItemIds, dialog computes eligible items itself"
```

---

### Task 11: `VkrPanel.tsx` — update `resolveVkr` to new field names

**Files:**
- Modify: `src/components/checklist/VkrPanel.tsx:12-21`

- [ ] **Step 1: Replace the `resolveVkr` function**

Old:

```tsx
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
```

New:

```tsx
  function resolveVkr(vkrId: string, itemId: string) {
    checklistVkrStore.resolve(vkrId);
    checklistItemsStore.update(itemId, {
      manuallyResolved: true,
      resolvedAt: new Date().toISOString(),
      resolvedBy: "E. Kadubcová",
    });
  }
```

`items` is still used elsewhere in the component (looking up `tpl` for the row label), so keep the `useChecklistItems()` call — only this function's body changes.

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit 2>&1 | grep -i VkrPanel`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/components/checklist/VkrPanel.tsx
git commit -m "refactor(checklist): update VkR resolution to manuallyResolved field"
```

---

### Task 12: `ShrnutiNalezuPanel.tsx` — add call history, rename to "Shrnutí"

**Files:**
- Modify: `src/components/checklist/ShrnutiNalezuPanel.tsx`

- [ ] **Step 1: Replace the file contents**

```tsx
import { useState } from "react";
import { useChecklistItems, useKontakty, kontaktyStore, templateById } from "@/lib/checklist/store";
import { noteworthyItems, formatKontaktDateTime } from "@/lib/checklist/derived";
import type { Kontakt } from "@/lib/checklist/types";

export function ShrnutiNalezuPanel() {
  const items = useChecklistItems();
  const kontakty = useKontakty();
  const noteworthy = noteworthyItems(items);

  if (kontakty.length === 0 && noteworthy.length === 0) return null;

  const sortedKontakty = [...kontakty].sort(
    (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
  );

  return (
    <div className="rounded-lg border border-border bg-card p-3.5">
      <p className="mb-2.5 text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">Shrnutí</p>

      {sortedKontakty.length > 0 && (
        <div className="mb-3 flex flex-col gap-2.5 border-b border-border pb-3">
          {sortedKontakty.map((k) => (
            <KontaktRow key={k.id} kontakt={k} />
          ))}
        </div>
      )}

      {noteworthy.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {noteworthy.map((item) => {
            const tpl = templateById(item.templateId);
            return (
              <div key={item.id} className="border-b border-border pb-2.5 last:border-0 last:pb-0">
                <div className="text-[12.5px] font-semibold">{tpl?.title}</div>
                {item.findingValue && (
                  <div className="mt-0.5 text-[11.5px] text-foreground">
                    <b>Nález:</b> {item.findingValue}
                  </div>
                )}
                {item.noteValue && (
                  <div className="text-[11.5px] text-muted-foreground">
                    <b>Poznámka:</b> {item.noteValue}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function KontaktRow({ kontakt }: { kontakt: Kontakt }) {
  const [note, setNote] = useState(kontakt.note ?? "");

  function saveNote() {
    kontaktyStore.update(kontakt.id, { note: note || undefined });
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-[12px]">
        <span className="font-semibold">
          {kontakt.type === "customer" ? "Zákazník" : "Přepravce"} · {formatKontaktDateTime(kontakt.scheduledAt)}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide ${
            kontakt.status === "done" ? "bg-success/15 text-success-foreground" : "bg-warning/15 text-warning-foreground"
          }`}
        >
          {kontakt.status === "done" ? "proběhl" : "naplánován"}
        </span>
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onBlur={saveNote}
        rows={1}
        placeholder="Poznámka k callu…"
        className="mt-1 w-full rounded-md border border-input bg-transparent px-2 py-1 text-[11.5px]"
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit 2>&1 | grep -i ShrnutiNalezuPanel`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/components/checklist/ShrnutiNalezuPanel.tsx
git commit -m "feat(checklist): show call history and note-bearing items in Shrnutí panel"
```

---

### Task 13: `AppHeader.tsx` + `ChecklistPage.tsx` — nav divider and "Krok 2" heading

**Files:**
- Modify: `src/components/AppHeader.tsx:24-29`
- Modify: `src/components/checklist/ChecklistPage.tsx:37-39`

- [ ] **Step 1: Add a divider before the checklist nav link**

In `src/components/AppHeader.tsx`, replace:

```tsx
      <nav className="flex items-center gap-1 text-sm font-medium">
        <NavLink to="/" active={current === "rules"}>Pravidla pro tracking</NavLink>
        <NavLink to="/soulad-s-trasou" active={current === "soulad"}>Soulad s trasou</NavLink>
        <NavLink to="/situace" active={current === "situace"}>Situace a závažnosti</NavLink>
        <NavLink to="/checklist" active={current === "checklist"}>Checklist objednávky</NavLink>
      </nav>
```

with:

```tsx
      <nav className="flex items-center gap-1 text-sm font-medium">
        <NavLink to="/" active={current === "rules"}>Pravidla pro tracking</NavLink>
        <NavLink to="/soulad-s-trasou" active={current === "soulad"}>Soulad s trasou</NavLink>
        <NavLink to="/situace" active={current === "situace"}>Situace a závažnosti</NavLink>
        <div className="mx-1.5 h-5 w-px bg-border" />
        <NavLink to="/checklist" active={current === "checklist"}>Checklist objednávky</NavLink>
      </nav>
```

- [ ] **Step 2: Rename the page badge to "Krok 2"**

In `src/components/checklist/ChecklistPage.tsx`, replace:

```tsx
            <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-[11px] font-semibold text-accent-foreground">
              Objednávka · Vyhodnocení a kontrola
            </span>
```

with:

```tsx
            <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-[11px] font-semibold text-accent-foreground">
              Krok 2 — Vyhodnocení a kontrola
            </span>
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit 2>&1 | grep -iE "AppHeader|ChecklistPage"`
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add src/components/AppHeader.tsx src/components/checklist/ChecklistPage.tsx
git commit -m "feat(checklist): separate checklist nav visually, add Krok 2 heading"
```

---

### Task 14: Full typecheck and end-to-end browser verification

**Files:** none (verification only)

- [ ] **Step 1: Full typecheck**

Run: `npx tsc --noEmit`
Expected: no errors anywhere in the project (not just the checklist files — confirms nothing outside `src/lib/checklist`/`src/components/checklist` broke, e.g. no other route imports `ItemResolutionForm`).

- [ ] **Step 2: Start the dev server and open `/checklist`**

Use the Browser pane (`preview_start` with the `dev` config, then `navigate` to `/checklist`) — do not use Bash to run the dev server. Confirm the page loads with no console errors (`read_console_messages`).

- [ ] **Step 3: Walk the open → resolved cycle**

On "Kontrola dokumentace k vývozu" (`item_dg`, seeded fully open): select a Nález option, confirm it saves without any button click (re-read the DOM/store); pick "Jiné…" and confirm a text input appears; type a Řešení; click "✓ Označit jako vyřešeno"; confirm the row collapses into the category's "▸ Hotovo" disclosure with the correct summary text.

- [ ] **Step 4: Walk the undo path**

Expand "▸ Hotovo" for that category, click "↺ vrátit do otevřeného stavu" on the item from Step 3, confirm it moves back to the open list above the disclosure with its Nález/Řešení values preserved.

- [ ] **Step 5: Walk the checkbox → auto-attach path**

On an open item, check "podezření" next to Nález. Confirm: the item shows "čeká na kontakt · řešení chybí"; since no `Kontakt` is `"planned"` (only the seeded `kontakt_1` is already planned and linked to other items — verify by checking `kontaktyStore.all()` via `javascript_tool`), confirm it attaches to `kontakt_1` if planned, or stays unattached if not. Then open `KontaktWidget` → "Naplánovat kontakt" (only reachable when no kontakt is planned) and confirm the dialog's preview list matches all `waiting_contact` items without a `kontaktId`.

- [ ] **Step 6: Walk the tracking VkŘ path**

On "Kontrola EORI vývozce" (`tpl_eori`, `canTrackForMonitoring: true`), fill Řešení, confirm "+ Založit věc k řešení" appears only now (not before Řešení was filled), click it, confirm the item gets a "⏳ sleduje se" tag and a new row appears in `VkrPanel`. Click "✓ Vyřešit" in `VkrPanel` and confirm the checklist item becomes `resolved` while keeping the "⏳ sleduje se" tag.

- [ ] **Step 7: Confirm context panel placement**

Click "🛈 kontext zásilky" on an open item at a wide viewport (`resize_window` to desktop preset) — confirm `ItemContext` renders beside the Nález/Řešení fields (`lg:flex-row`). `resize_window` to mobile preset — confirm it stacks below instead.

- [ ] **Step 8: Confirm Shrnutí panel and nav/heading changes**

Confirm the left-column panel header reads "Shrnutí" and shows the calls section above the noteworthy-items section; type into a call's poznámka textarea, blur it, and confirm (via `javascript_tool` reading `localStorage.getItem("checklist_kontakty_v1")`) it persisted. Confirm the header nav shows a visible divider before "Checklist objednávky", and the page badge reads "Krok 2 — Vyhodnocení a kontrola".

- [ ] **Step 9: Confirm reset still works**

Click "Reset prototypu", confirm all edits from Steps 3–8 revert to the seed state described in Task 3.

- [ ] **Step 10: Confirm other routes are unaffected**

Navigate to `/`, `/soulad-s-trasou`, `/situace` — confirm no console errors and no visual regressions (this task touched only checklist-scoped files and `AppHeader.tsx`, which is shared — specifically check the divider doesn't break nav layout on those pages too).

- [ ] **Step 11: Final commit if Steps 1–10 required any fixes**

If any verification step required a code fix, stage and commit it with a message describing the specific bug (not "fix bugs").
