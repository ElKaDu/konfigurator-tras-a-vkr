# Checklist — reaktivní sloupce a záhlaví zásilky Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Přestavět stránku `/checklist` na tři sloupce s vlastním záhlavím zásilky, kde pravý sloupec je čistě reaktivní (plánování callu a karty věcí k řešení se objeví, až když operátorka něco naklikne), podle `docs/superpowers/specs/2026-07-30-checklist-reaktivni-sloupce-zahlavi-design.md`.

**Architecture:** `KontaktStatus` se rozšiřuje o `"draft"` a `scheduledAt` se stává volitelným — zatržení checkboxu vytvoří draft kontakt přímo v `kontaktSync.ts`, zadání termínu ho povýší na `planned`. Modální `KontaktSchedulerDialog` i horní `KontaktWidget` se ruší ve prospěch inline karty v novém pravém sloupci. `VkrPanel` (levý sloupec) se ruší; jeho statické Krok 1 řádky se stěhují do `Krok1Mock`, dynamické VkŘ nahrazují plné karty v pravém sloupci. Nový `ShipmentHeader` nahrazuje `AppHeader` jen na této routě.

**Tech Stack:** TanStack Start (React + Vite), TanStack Router, Tailwind + shadcn/ui, localStorage-backed `makeStore`. V repu není testovací framework — ověřuje se `tsc --noEmit` + ruční průchod v prohlížeči (Task 12).

---

### Task 1: `types.ts` — `draft` status a volitelný termín

**Files:**
- Modify: `src/lib/checklist/types.ts:58` a `src/lib/checklist/types.ts:65`

- [ ] **Step 1: Rozšířit `KontaktStatus`**

Nahraď řádek:

```ts
export type KontaktStatus = "planned" | "done";
```

za:

```ts
/** "draft" = rozjednaný call bez termínu (vznikl zatržením checkboxu), "planned" = má termín. */
export type KontaktStatus = "draft" | "planned" | "done";
```

- [ ] **Step 2: Udělat `scheduledAt` volitelné**

V `interface Kontakt` nahraď:

```ts
  /** ISO datetime string, např. "2026-07-30T10:00:00". */
  scheduledAt: string;
```

za:

```ts
  /** ISO datetime string, např. "2026-07-30T10:00:00". Prázdné, dokud je kontakt "draft". */
  scheduledAt?: string;
```

- [ ] **Step 3: Ověřit**

Run: `npx tsc --noEmit 2>&1 | grep -c checklist`
Expected: nenulové číslo — ostatní soubory (`derived.ts`, `ShrnutiNalezuPanel.tsx`, `KontaktWidget.tsx`) zatím počítají s povinným `scheduledAt`. Opraví je Tasky 2, 4, 9. Neopravuj je teď.

- [ ] **Step 4: Commit**

```bash
git add src/lib/checklist/types.ts
git commit -m "refactor(checklist): add draft kontakt status, make scheduledAt optional"
```

---

### Task 2: `derived.ts` — ošetřit chybějící termín

**Files:**
- Modify: `src/lib/checklist/derived.ts:59-67`, `:77-86`

- [ ] **Step 1: Ošetřit `computeChecklistStatus`**

Nahraď blok:

```ts
  const plannedKontakty = kontaktyStore.all().filter((k: Kontakt) => k.status === "planned");
  if (plannedKontakty.length > 0) {
    const now = Date.now();
    const overdue = plannedKontakty.some((k) => new Date(k.scheduledAt).getTime() < now);
```

za:

```ts
  // Záměrně jen "planned" — draft (rozjednaný call bez termínu) nemá měnit stavový štítek nahoře.
  const plannedKontakty = kontaktyStore.all().filter((k: Kontakt) => k.status === "planned");
  if (plannedKontakty.length > 0) {
    const now = Date.now();
    const overdue = plannedKontakty.some((k) => !!k.scheduledAt && new Date(k.scheduledAt).getTime() < now);
```

- [ ] **Step 2: Ošetřit `nextPlannedKontakt` a `formatKontaktDateTime`**

Nahraď obě funkce na konci souboru:

```ts
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

za:

```ts
export function nextPlannedKontakt(kontakty: Kontakt[]): Kontakt | undefined {
  return kontakty
    .filter((k) => k.status === "planned" && !!k.scheduledAt)
    .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())[0];
}

/** Vrací "—" pro kontakt bez termínu (draft), jinak "31. 7. 10:00". */
export function formatKontaktDateTime(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" }).format(d);
}
```

- [ ] **Step 3: Ověřit**

Run: `npx tsc --noEmit 2>&1 | grep -i "derived.ts"`
Expected: žádný výstup.

- [ ] **Step 4: Commit**

```bash
git add src/lib/checklist/derived.ts
git commit -m "refactor(checklist): handle optional scheduledAt in derived helpers"
```

---

### Task 3: `kontaktSync.ts` — vytvořit draft, když žádný kontakt neexistuje

**Files:**
- Modify: `src/lib/checklist/kontaktSync.ts`

- [ ] **Step 1: Nahradit celý obsah souboru**

```ts
import { checklistItemsStore, kontaktyStore } from "./store";
import type { ChecklistItem, Kontakt } from "./types";

/**
 * Po každé změně findingIsSuspicion/resolutionNeedsConfirm dorovná navázání položky na
 * rozjednaný nebo naplánovaný kontakt (jeden call pro vše, co čeká). Pokud žádný takový
 * neexistuje, založí nový "draft" — call bez termínu, který se v pravém sloupci hned zobrazí
 * k doplnění. Odpojí položku, pokud už žádný checkbox není zatržený.
 */
export function syncKontaktAttachment(next: ChecklistItem): void {
  const needsContact = next.findingIsSuspicion || next.resolutionNeedsConfirm;

  if (needsContact && !next.kontaktId) {
    let target = kontaktyStore.all().find((k) => k.status === "draft" || k.status === "planned");
    if (!target) {
      target = createDraftKontakt();
    }
    checklistItemsStore.update(next.id, { kontaktId: target.id });
    if (!target.linkedItemIds.includes(next.id)) {
      kontaktyStore.update(target.id, { linkedItemIds: [...target.linkedItemIds, next.id] });
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

/** Založí prázdný rozjednaný call. Volá se i z pravého sloupce ("+ Naplánovat kontakt ručně"). */
export function createDraftKontakt(): Kontakt {
  const kontakt: Kontakt = {
    id: "kontakt_" + Date.now(),
    type: "customer",
    status: "draft",
    linkedItemIds: [],
  };
  kontaktyStore.create(kontakt);
  return kontakt;
}
```

- [ ] **Step 2: Ověřit**

Run: `npx tsc --noEmit 2>&1 | grep -i "kontaktSync"`
Expected: žádný výstup.

- [ ] **Step 3: Commit**

```bash
git add src/lib/checklist/kontaktSync.ts
git commit -m "feat(checklist): auto-create draft kontakt when checkbox is ticked"
```

---

### Task 4: `ShrnutiNalezuPanel.tsx` — řádek Řešení a draft-safe řazení

**Files:**
- Modify: `src/components/checklist/ShrnutiNalezuPanel.tsx`

- [ ] **Step 1: Nahradit celý obsah souboru**

```tsx
import { useChecklistItems, useKontakty, kontaktyStore, templateById } from "@/lib/checklist/store";
import { noteworthyItems, formatKontaktDateTime } from "@/lib/checklist/derived";
import type { Kontakt } from "@/lib/checklist/types";

export function ShrnutiNalezuPanel() {
  const items = useChecklistItems();
  const kontakty = useKontakty();
  const noteworthy = noteworthyItems(items);

  // Rozjednané cally (draft) sem nepatří — v shrnutí má být jen to, co má termín nebo proběhlo.
  const relevantKontakty = kontakty.filter((k) => k.status !== "draft");

  if (relevantKontakty.length === 0 && noteworthy.length === 0) return null;

  const sortedKontakty = [...relevantKontakty].sort(
    (a, b) => new Date(b.scheduledAt ?? 0).getTime() - new Date(a.scheduledAt ?? 0).getTime(),
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
                {item.resolutionValue && (
                  <div className="text-[11.5px] text-foreground">
                    <b>Řešení:</b> {item.resolutionValue}
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
        value={kontakt.note ?? ""}
        onChange={(e) => kontaktyStore.update(kontakt.id, { note: e.target.value || undefined })}
        rows={1}
        placeholder="Poznámka k callu…"
        aria-label="Poznámka k callu"
        className="mt-1 w-full rounded-md border border-input bg-transparent px-2 py-1 text-[11.5px]"
      />
    </div>
  );
}
```

- [ ] **Step 2: Ověřit**

Run: `npx tsc --noEmit 2>&1 | grep -i "ShrnutiNalezuPanel"`
Expected: žádný výstup.

- [ ] **Step 3: Commit**

```bash
git add src/components/checklist/ShrnutiNalezuPanel.tsx
git commit -m "feat(checklist): show resolution row in Shrnutí, hide draft calls"
```

---

### Task 5: `CallPanel.tsx` — inline plánování callu v pravém sloupci

**Files:**
- Create: `src/components/checklist/CallPanel.tsx`

- [ ] **Step 1: Vytvořit komponentu**

```tsx
import { useChecklistItems, useKontakty, kontaktyStore, templateById } from "@/lib/checklist/store";
import { formatKontaktDateTime } from "@/lib/checklist/derived";
import { createDraftKontakt } from "@/lib/checklist/kontaktSync";
import type { ChecklistItem, Kontakt, KontaktType } from "@/lib/checklist/types";
import { Button } from "@/components/ui/button";

export function CallPanel() {
  const kontakty = useKontakty();
  const items = useChecklistItems();

  const active = kontakty.find((k) => k.status === "draft" || k.status === "planned");
  const done = kontakty.filter((k) => k.status === "done");

  return (
    <div className="flex flex-col gap-3">
      {active ? (
        <ActiveCallCard kontakt={active} items={items} />
      ) : (
        <div className="rounded-lg border border-dashed border-input bg-card p-3.5 text-center">
          <button
            onClick={() => createDraftKontakt()}
            className="text-[12px] font-bold text-primary hover:underline"
          >
            + Naplánovat kontakt ručně
          </button>
        </div>
      )}

      {active && (
        <div className="text-center">
          <button
            onClick={() => createDraftKontakt()}
            className="text-[11px] font-bold text-primary hover:underline"
          >
            + Naplánovat další kontakt
          </button>
        </div>
      )}

      {done.map((k) => (
        <DoneCallCard key={k.id} kontakt={k} />
      ))}
    </div>
  );
}

function ActiveCallCard({ kontakt, items }: { kontakt: Kontakt; items: ChecklistItem[] }) {
  const linked = kontakt.linkedItemIds
    .map((id) => items.find((i) => i.id === id))
    .filter((i): i is ChecklistItem => !!i);

  const isPlanned = !!kontakt.scheduledAt;

  function patch(fields: Partial<Kontakt>) {
    kontaktyStore.update(kontakt.id, fields);
  }

  function markDone() {
    kontaktyStore.update(kontakt.id, { status: "done" });
  }

  return (
    <div className="rounded-lg border border-info bg-info/10 p-3.5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[10.5px] font-bold uppercase tracking-wide text-info-foreground">
          📞 Plánování callu
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide ${
            isPlanned ? "bg-success/15 text-success-foreground" : "bg-warning/15 text-warning-foreground"
          }`}
        >
          {isPlanned ? "naplánováno" : "rozjednáno"}
        </span>
      </div>

      <div className="mb-2 rounded-md bg-surface p-2">
        {linked.length === 0 && (
          <p className="text-[11px] text-muted-foreground">
            Zatím nic k probrání — zatrhni „podezření“ nebo „potvrdit s klientem“ u položky.
          </p>
        )}
        {linked.map((item) => (
          <div key={item.id} className="py-0.5 text-[11px]">
            <b>{templateById(item.templateId)?.title}</b>
            {item.findingIsSuspicion && item.findingValue && <> — nález: {item.findingValue}</>}
            {item.resolutionNeedsConfirm && item.resolutionValue && <> — řešení: {item.resolutionValue}</>}
          </div>
        ))}
      </div>

      <div className="mb-1.5">
        <label className="mb-0.5 block text-[9.5px] font-bold uppercase tracking-wide text-muted-foreground">
          Typ
        </label>
        <select
          value={kontakt.type}
          onChange={(e) => patch({ type: e.target.value as KontaktType })}
          aria-label="Typ kontaktu"
          className="w-full rounded-md border border-input bg-surface px-2 py-1.5 text-[11.5px]"
        >
          <option value="customer">Zákazník</option>
          <option value="carrier">Přepravce</option>
        </select>
      </div>

      <div className="mb-1.5">
        <label className="mb-0.5 block text-[9.5px] font-bold uppercase tracking-wide text-muted-foreground">
          Termín
        </label>
        <input
          type="datetime-local"
          value={toDateTimeLocal(kontakt.scheduledAt)}
          onChange={(e) =>
            patch({
              scheduledAt: e.target.value ? new Date(e.target.value).toISOString() : undefined,
              status: e.target.value ? "planned" : "draft",
            })
          }
          aria-label="Termín kontaktu"
          className="w-full rounded-md border border-input bg-surface px-2 py-1.5 text-[11.5px]"
        />
      </div>

      <div className="mb-2">
        <label className="mb-0.5 block text-[9.5px] font-bold uppercase tracking-wide text-muted-foreground">
          Poznámka
        </label>
        <textarea
          value={kontakt.note ?? ""}
          onChange={(e) => patch({ note: e.target.value || undefined })}
          rows={2}
          placeholder="Co se bude probírat…"
          aria-label="Poznámka k callu"
          className="w-full rounded-md border border-input bg-surface px-2 py-1.5 text-[11.5px]"
        />
      </div>

      <Button size="sm" className="w-full" onClick={markDone} disabled={!isPlanned}>
        ✓ Call proběhl
      </Button>
    </div>
  );
}

function DoneCallCard({ kontakt }: { kontakt: Kontakt }) {
  return (
    <div className="rounded-lg border border-border bg-muted p-3.5">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">📞 Call</span>
        <span className="rounded-full bg-success/15 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-success-foreground">
          proběhlo
        </span>
      </div>
      <div className="text-[11.5px] font-semibold">
        {kontakt.type === "customer" ? "Zákazník" : "Přepravce"} · {formatKontaktDateTime(kontakt.scheduledAt)}
      </div>
      {kontakt.note && <div className="mt-1 text-[11px] text-muted-foreground">{kontakt.note}</div>}
    </div>
  );
}

/** ISO → hodnota pro <input type="datetime-local"> ("2026-07-31T10:00"). Prázdný string pro draft. */
function toDateTimeLocal(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
```

- [ ] **Step 2: Ověřit**

Run: `npx tsc --noEmit 2>&1 | grep -i "CallPanel"`
Expected: žádný výstup.

- [ ] **Step 3: Commit**

```bash
git add src/components/checklist/CallPanel.tsx
git commit -m "feat(checklist): add inline call planning panel for right column"
```

---

### Task 6: `VkrCards.tsx` — karty věcí k řešení v pravém sloupci

**Files:**
- Create: `src/components/checklist/VkrCards.tsx`

- [ ] **Step 1: Vytvořit komponentu**

Kartový vzor odpovídá `mockups/2026-07-16-vkr-operator-karta.html` (název, situace, badge, „nalezeno" box, poznámka).

```tsx
import { useChecklistVkrs, useChecklistItems, checklistVkrStore, checklistItemsStore, templateById } from "@/lib/checklist/store";
import { formatKontaktDateTime } from "@/lib/checklist/derived";
import type { ChecklistVkr } from "@/lib/checklist/types";
import { Button } from "@/components/ui/button";

export function VkrCards() {
  const vkrs = useChecklistVkrs();
  const items = useChecklistItems();

  if (vkrs.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">Věci k řešení</p>
      {vkrs.map((vkr) => {
        const item = items.find((i) => i.id === vkr.itemId);
        const tpl = item ? templateById(item.templateId) : undefined;
        return (
          <div key={vkr.id} id={`vkr-${vkr.id}`} className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-baseline justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[12.5px] font-bold">{vkr.title}</div>
                <div className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                  {tpl?.title ?? "—"}
                </div>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  vkr.resolved
                    ? "bg-success/15 text-success-foreground"
                    : "bg-warning/15 text-warning-foreground"
                }`}
              >
                {vkr.resolved ? "vyřešeno" : "sledování"}
              </span>
            </div>

            <div className="mt-2 rounded-md bg-muted px-2.5 py-2">
              <div className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                Řešení k dosledování
              </div>
              <div className="font-mono text-[11px]">{item?.resolutionValue ?? "—"}</div>
            </div>

            <div className="mt-2 text-[10.5px] text-muted-foreground">
              termín {formatKontaktDateTime(vkr.dueAt)}
            </div>

            {!vkr.resolved && item && (
              <Button
                size="sm"
                variant="outline"
                className="mt-2 w-full"
                onClick={() => resolveVkr(vkr, item.id)}
              >
                ✓ Vyřešit
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Odbavení VkŘ zároveň uzavírá navázanou položku — stejná logika, jakou měl dřív VkrPanel. */
function resolveVkr(vkr: ChecklistVkr, itemId: string) {
  checklistVkrStore.resolve(vkr.id);
  checklistItemsStore.update(itemId, {
    manuallyResolved: true,
    resolvedAt: new Date().toISOString(),
    resolvedBy: "E. Kadubcová",
  });
}
```

- [ ] **Step 2: Ověřit**

Run: `npx tsc --noEmit 2>&1 | grep -i "VkrCards"`
Expected: žádný výstup.

- [ ] **Step 3: Commit**

```bash
git add src/components/checklist/VkrCards.tsx
git commit -m "feat(checklist): add VkR cards for right column"
```

---

### Task 7: `ShipmentHeader.tsx` — záhlaví zásilky

**Files:**
- Create: `src/components/checklist/ShipmentHeader.tsx`

- [ ] **Step 1: Vytvořit komponentu**

```tsx
import type { ReactNode } from "react";
import type { ChecklistStatusKind } from "@/lib/checklist/derived";

/**
 * Záhlaví stránky checklistu — nahrazuje sdílený AppHeader. Stránka je záměrně izolovaná:
 * žádná navigace, žádná cesta zpět. Data jsou mock, stejná jako v kontextech položek.
 */
export function ShipmentHeader({
  statusLabel,
  statusKind,
  extras,
}: {
  statusLabel: string;
  statusKind: ChecklistStatusKind;
  extras?: ReactNode;
}) {
  return (
    <header className="shrink-0 border-b border-border bg-surface px-6 py-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="grid size-[34px] shrink-0 place-items-center rounded-[9px] bg-primary-soft text-base">📦</div>
        <span className="text-[17px] font-bold">Objednávka #OP-2026-04471</span>
        <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-accent-foreground">
          Krok 2 — Vyhodnocení a kontrola
        </span>
        <span className={statusPillClass(statusKind)}>{statusLabel}</span>
        <div className="ml-auto flex items-center gap-2">{extras}</div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-7">
        <Attr label="Odkud → kam" value="🇨🇿 Praha → 🇩🇪 Berlín" />
        <Attr label="Přepravce" value="DHL Express" />
        <Attr label="Hodnota" value="4 200 Kč" />
        <Attr label="Operátor" value="E. Kadubcová" />

        <div className="ml-auto flex items-center gap-2.5 rounded-[9px] border border-warning bg-warning/15 px-3.5 py-1.5">
          <span className="text-[22px] font-extrabold leading-none tabular-nums text-warning-foreground">2:40</span>
          <span className="text-[10px] font-bold uppercase tracking-wide text-warning-foreground">
            do limitu
            <small className="block text-[9px] font-medium normal-case tracking-normal opacity-75">
              zpracování (mock)
            </small>
          </span>
        </div>
      </div>
    </header>
  );
}

function Attr({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-0.5 text-[9.5px] font-bold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-[12.5px] font-semibold">{value}</div>
    </div>
  );
}

function statusPillClass(kind: ChecklistStatusKind): string {
  const base = "rounded-full px-2.5 py-0.5 text-[11px] font-semibold";
  if (kind === "waiting_contact") return `${base} bg-warning/15 text-warning-foreground`;
  if (kind === "overdue") return `${base} bg-destructive/15 text-destructive`;
  if (kind === "done") return `${base} bg-success/15 text-success-foreground`;
  return `${base} bg-muted text-muted-foreground`;
}
```

- [ ] **Step 2: Ověřit**

Run: `npx tsc --noEmit 2>&1 | grep -i "ShipmentHeader"`
Expected: žádný výstup.

- [ ] **Step 3: Commit**

```bash
git add src/components/checklist/ShipmentHeader.tsx
git commit -m "feat(checklist): add isolated shipment header"
```

---

### Task 8: `Krok1Mock.tsx` — převzít řádek „Čeká na zaplacení"

**Files:**
- Modify: `src/components/checklist/Krok1Mock.tsx:24-40`

- [ ] **Step 1: Doplnit třetí řádek a VkŘ referenci**

Nahraď blok od `<div className="font-medium">Kontrola přiřazení zákazníka</div>` obsahující dva `flex gap-2` bloky — tedy celý úsek:

```tsx
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
```

za:

```tsx
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
        <div className="flex gap-2">
          <span className="mt-0.5 flex size-4 items-center justify-center rounded bg-success text-[10px] text-success-foreground">
            ✓
          </span>
          <div>
            <div className="font-medium">Čeká na zaplacení</div>
            <div className="text-xs text-muted-foreground">
              Uhrazeno 9:42. <span className="opacity-70">VkŘ #4471-C</span>
            </div>
          </div>
        </div>
```

- [ ] **Step 2: Aktualizovat počet v souhrnném štítku**

V témže souboru nahraď:

```tsx
          vyřešeno 2/2
```

za:

```tsx
          vyřešeno 3/3
```

- [ ] **Step 3: Ověřit**

Run: `npx tsc --noEmit 2>&1 | grep -i "Krok1Mock"`
Expected: žádný výstup.

- [ ] **Step 4: Commit**

```bash
git add src/components/checklist/Krok1Mock.tsx
git commit -m "feat(checklist): move Čeká na zaplacení row into Krok1Mock"
```

---

### Task 9: `ChecklistPage.tsx` — tři sloupce a nové záhlaví

**Files:**
- Modify: `src/components/checklist/ChecklistPage.tsx`

- [ ] **Step 1: Nahradit celý obsah souboru**

```tsx
import { ShipmentHeader } from "./ShipmentHeader";
import { Krok1Mock } from "./Krok1Mock";
import { CategoryNav } from "./CategoryNav";
import { ItemsList } from "./ItemsList";
import { ShrnutiNalezuPanel } from "./ShrnutiNalezuPanel";
import { CallPanel } from "./CallPanel";
import { VkrCards } from "./VkrCards";
import { useChecklistItems, resetChecklistPrototype } from "@/lib/checklist/store";
import { computeChecklistStatus } from "@/lib/checklist/derived";
import { RotateCcw } from "lucide-react";

export function ChecklistPage() {
  const items = useChecklistItems();
  const status = computeChecklistStatus(items);

  return (
    <div className="flex h-screen w-screen flex-col bg-background text-foreground">
      <ShipmentHeader
        statusLabel={status.label}
        statusKind={status.kind}
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
        <div className="mx-auto max-w-[1180px] px-6 py-5">
          <div className="mb-4 rounded-lg border border-primary bg-primary-soft px-4 py-2.5 text-xs text-accent-foreground">
            <b>Prototyp checklistu.</b> Krok 1 níže je jen náhled (needituje se). Zbytek — položky, kontext,
            nálezy, kontakty, věci k řešení — je plně funkční, ukládá se do localStorage.
          </div>

          <div className="mb-4 rounded-lg border border-border bg-card px-4 py-3">
            <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
              <span>Krok 2</span>
              <span className="tabular-nums text-foreground">
                {status.resolvedCount} / {status.totalCount}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-muted">
              <div className="h-full rounded-full bg-success" style={{ width: `${status.progressPct}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-[250px_minmax(0,1fr)_280px] items-start gap-4">
            <aside className="sticky top-4 flex flex-col gap-3">
              <CategoryNav />
              <ShrnutiNalezuPanel />
            </aside>
            <main className="flex flex-col gap-4">
              <Krok1Mock />
              <ItemsList />
            </main>
            <aside className="sticky top-4 flex flex-col gap-3">
              <CallPanel />
              <VkrCards />
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Ověřit**

Run: `npx tsc --noEmit 2>&1 | grep -i "ChecklistPage"`
Expected: žádný výstup. (`VkrPanel`, `KontaktWidget` a `KontaktSchedulerDialog` teď nikdo neimportuje — smaže je Task 10.)

- [ ] **Step 3: Commit**

```bash
git add src/components/checklist/ChecklistPage.tsx
git commit -m "feat(checklist): three-column layout with shipment header and right column"
```

---

### Task 10: Smazat `VkrPanel.tsx`, `KontaktWidget.tsx`, `KontaktSchedulerDialog.tsx`

**Files:**
- Delete: `src/components/checklist/VkrPanel.tsx`
- Delete: `src/components/checklist/KontaktWidget.tsx`
- Delete: `src/components/checklist/KontaktSchedulerDialog.tsx`

- [ ] **Step 1: Ověřit, že je nikdo neimportuje**

Run: `grep -rn "VkrPanel\|KontaktWidget\|KontaktSchedulerDialog" src/`
Expected: shody jen uvnitř samotných tří mazaných souborů — jejich vlastní `export function` a import `KontaktSchedulerDialog` uvnitř `KontaktWidget.tsx`. Task 9 už odstranil poslední vnější konzumenty (`ChecklistPage.tsx`). Pokud se objeví shoda v jiném souboru, ZASTAV a nahlas to.

- [ ] **Step 2: Smazat soubory**

```bash
git rm src/components/checklist/VkrPanel.tsx src/components/checklist/KontaktWidget.tsx src/components/checklist/KontaktSchedulerDialog.tsx
```

- [ ] **Step 3: Ověřit**

Run: `npx tsc --noEmit 2>&1 | grep -i "checklist"`
Expected: žádný výstup.

- [ ] **Step 4: Commit**

```bash
git commit -m "refactor(checklist): remove VkrPanel, KontaktWidget and scheduler dialog"
```

---

### Task 11: Prokliky — kapitoly → Hotovo, položka → VkŘ karta

**Files:**
- Modify: `src/components/checklist/ItemsList.tsx`
- Modify: `src/components/checklist/CategoryNav.tsx`
- Modify: `src/components/checklist/ChecklistItemRow.tsx:48-52`

- [ ] **Step 1: Umožnit rozbalení „Hotovo" zvenčí**

V `src/components/checklist/ItemsList.tsx` nahraď celý obsah:

```tsx
import { useEffect, useState } from "react";
import { useChecklistItems } from "@/lib/checklist/store";
import { templateById } from "@/lib/checklist/store";
import { CHECKLIST_CATEGORY_ORDER, CHECKLIST_CATEGORY_LABELS } from "@/lib/checklist/types";
import type { ChecklistCategory, ChecklistItem } from "@/lib/checklist/types";
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
              {done.length > 0 && <DoneDisclosure category={category} items={done} />}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function DoneDisclosure({ category, items }: { category: ChecklistCategory; items: ChecklistItem[] }) {
  const [expanded, setExpanded] = useState(false);

  // Proklik z levého panelu (CategoryNav) rozbalí správnou sekci — komunikace přes window event,
  // ať CategoryNav nemusí vlastnit stav, který patří sem.
  useEffect(() => {
    function onExpand(e: Event) {
      if ((e as CustomEvent<string>).detail === category) setExpanded(true);
    }
    window.addEventListener("checklist:expand-done", onExpand);
    return () => window.removeEventListener("checklist:expand-done", onExpand);
  }, [category]);

  return (
    <div className="py-1.5">
      <button
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
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

- [ ] **Step 2: Udělat počet v `CategoryNav` klikací**

V `src/components/checklist/CategoryNav.tsx` nahraď celý obsah:

```tsx
import { useChecklistItems } from "@/lib/checklist/store";
import { categoryCounts } from "@/lib/checklist/derived";
import type { ChecklistCategory } from "@/lib/checklist/types";

export function CategoryNav() {
  const items = useChecklistItems();
  const counts = categoryCounts(items);

  function scrollTo(category: string) {
    document.getElementById(`cat-${category}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /** Skočí na kapitolu a zároveň rozbalí její sekci "Hotovo" v hlavním sloupci. */
  function showDone(category: ChecklistCategory) {
    scrollTo(category);
    window.dispatchEvent(new CustomEvent("checklist:expand-done", { detail: category }));
  }

  return (
    <nav className="rounded-lg border border-border bg-card p-3.5">
      <p className="mb-2.5 text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">
        Kapitoly kontrol
      </p>
      <div className="flex flex-col">
        {counts.map((c) => (
          <div
            key={c.category}
            className="flex items-baseline justify-between gap-2 rounded-md px-2.5 py-1.5 text-[13px] hover:bg-muted"
          >
            <button onClick={() => scrollTo(c.category)} className="text-left">
              {c.label}
            </button>
            {c.resolved > 0 ? (
              <button
                onClick={() => showDone(c.category)}
                className="shrink-0 tabular-nums text-[11.5px] font-semibold text-primary hover:underline"
                title="Zobrazit vyřešené body"
              >
                {c.resolved}/{c.total}
              </button>
            ) : (
              <span className="shrink-0 tabular-nums text-[11.5px] text-muted-foreground">
                {c.resolved}/{c.total}
              </span>
            )}
          </div>
        ))}
      </div>
    </nav>
  );
}
```

- [ ] **Step 3: Udělat z „sleduje se" odkaz na kartu**

V `src/components/checklist/ChecklistItemRow.tsx` nahraď blok:

```tsx
  const trackingTag = item.trackingVkrId && (
    <span className="rounded-full border border-dashed border-info px-2 py-0.5 text-[9.5px] font-bold text-info-foreground">
      ⏳ sleduje se
    </span>
  );
```

za:

```tsx
  const trackingTag = item.trackingVkrId && (
    <button
      onClick={() => {
        const el = document.getElementById(`vkr-${item.trackingVkrId}`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        el?.animate([{ opacity: 0.35 }, { opacity: 1 }], { duration: 900, iterations: 2 });
      }}
      className="rounded-full border border-dashed border-info px-2 py-0.5 text-[9.5px] font-bold text-info-foreground hover:bg-info/10"
      title="Zobrazit věc k řešení"
    >
      ⏳ sleduje se →
    </button>
  );
```

- [ ] **Step 4: Ověřit**

Run: `npx tsc --noEmit 2>&1 | grep -iE "ItemsList|CategoryNav|ChecklistItemRow"`
Expected: žádný výstup.

- [ ] **Step 5: Commit**

```bash
git add src/components/checklist/ItemsList.tsx src/components/checklist/CategoryNav.tsx src/components/checklist/ChecklistItemRow.tsx
git commit -m "feat(checklist): cross-column navigation for done items and VkR cards"
```

---

### Task 12: Kompletní typecheck a ověření v prohlížeči

**Files:** žádné (jen ověření)

- [ ] **Step 1: Kompletní typecheck**

Run: `npx tsc --noEmit`
Expected: jen dvě předem existující, nesouvisející chyby v `src/components/rules/RuleEditor.tsx:72` a `src/components/rules/RulesList.tsx:80` (obě jsou router-typing problémy, které předchází celý tento plán). Žádná chyba v `src/components/checklist/` ani `src/lib/checklist/`.

- [ ] **Step 2: Otevřít `/checklist`**

Použij Browser panel (`preview_start` s configem `dev`, pak `navigate` na `/checklist`) — nespouštěj dev server přes Bash. Zkontroluj `read_console_messages` — žádné nové chyby (varování „controlled input to be uncontrolled" existuje i na ostatních routách před touto změnou, není regrese).

- [ ] **Step 3: Ověřit záhlaví**

Potvrď, že nahoře je záhlaví zásilky (📦 Objednávka #OP-2026-04471, štítek Krok 2, stavový štítek, atributy, výrazná krabička 2:40) a že tam NENÍ žádná navigace ani logo. Pak otevři `/`, `/soulad-s-trasou` a `/situace` a potvrď, že tam původní `AppHeader` s taby zůstal beze změny.

- [ ] **Step 4: Ověřit výchozí stav pravého sloupce**

Klikni na „Reset prototypu". V pravém sloupci má být karta plánování callu (seed obsahuje `kontakt_1` se stavem `planned`) a karty věcí k řešení (seed obsahuje `vkr_celni_faktura`). Ověř přes `javascript_tool`, že `JSON.parse(localStorage.getItem("checklist_kontakty_v1"))` obsahuje jeden kontakt se `status: "planned"`.

- [ ] **Step 5: Ověřit vznik draftu**

Odstraň seed kontakt, ať můžeš ověřit vznik draftu od nuly: přes `javascript_tool` spusť `localStorage.setItem("checklist_kontakty_v1", "[]")` a znovu načti stránku. Pravý sloupec má teď ukazovat jen „+ Naplánovat kontakt ručně". Zatrhni „podezření" u libovolné otevřené položky a ověř, že se objevila karta se štítkem „rozjednáno", že v náhledu je název té položky, a že v `checklist_kontakty_v1` je nový kontakt se `status: "draft"` a bez `scheduledAt`.

- [ ] **Step 6: Ověřit přechod draft → planned**

Vyplň v kartě termín. Ověř, že štítek přeskočil na „naplánováno", že stavový štítek v záhlaví je „⏱ Čeká na kontakt", a že v localStorage má kontakt `status: "planned"` a vyplněné `scheduledAt`. Ověř, že se call zároveň objevil v panelu Shrnutí v levém sloupci.

- [ ] **Step 7: Ověřit „Call proběhl"**

Klikni na „✓ Call proběhl". Ověř, že se karta změnila na šedý historický záznam bez formulářových polí, že `status` je `"done"`, a že v Shrnutí má call štítek „proběhl".

- [ ] **Step 8: Ověřit odpojení**

Odškrtni ten checkbox zpět. Ověř, že položka už nemá `kontaktId` a že zmizela z `linkedItemIds` svého kontaktu.

- [ ] **Step 9: Ověřit karty věcí k řešení a proklik**

U položky „Kontrola EORI vývozce" vyplň Řešení a klikni „+ Založit věc k řešení". Ověř, že v pravém sloupci přibyla karta a že u položky je štítek „⏳ sleduje se →". Klikni na štítek a potvrď, že se stránka odscrollovala na kartu. Pak klikni „✓ Vyřešit" na kartě a ověř, že se položka uzavřela (`manuallyResolved: true`) a karta má štítek „vyřešeno".

- [ ] **Step 10: Ověřit proklik na vyřešené body**

V levém panelu „Kapitoly kontrol" klikni na modrý počet u kapitoly, která má aspoň jeden vyřešený bod. Ověř, že se hlavní sloupec odscrolloval na tu kapitolu a že se její sekce „▾ Hotovo (N)" rozbalila. Ověř, že počet u kapitoly s `0/N` klikací není.

- [ ] **Step 11: Ověřit Krok 1 mock**

Rozbal accordion „Krok 1" v prostředním sloupci a potvrď, že obsahuje tři řádky včetně „Čeká na zaplacení" (VkŘ #4471-C) a že štítek říká „vyřešeno 3/3".

- [ ] **Step 12: Ověřit reset**

Klikni „Reset prototypu" a potvrď, že se všechna data (včetně nově vzniklých draftů a VkŘ) vrátila do seed stavu.

- [ ] **Step 13: Commit případných oprav**

Pokud některý krok odhalil chybu, oprav ji a commitni se zprávou popisující konkrétní bug (ne „fix bugs").
