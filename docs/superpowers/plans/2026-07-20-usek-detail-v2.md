# Úsek detail v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Doplnit do stránky detailu úseku (`SouladSTrasouUsekPage`) chybějící vizuální vrstvu podle
finálního wireframu: třetí sloupec "Plán spuštění" s vysvětlením kontrol a dynamickými Situace/Akce,
editaci základních údajů úseku, bohatší Termín editor, kotvy napříč úseky stejné trasy a odkaz na Zadání
pro programátory.

**Architektura:** Žádná nová sdílená datová struktura pro "kontroly" — obsah kontrol zůstává přímo v JSX
(přístup B ze specu), sdílejí se jen dvě malé vizuální komponenty (`KontrolaCard`, `Vetev`). Situace/
Závažnost/Akce se pořád čtou dynamicky z existujícího katalogu (`useSituations()`/`useActionTags()`),
jen se přesouvají z prostředního sloupce do nového třetího.

**Tech Stack:** React 19, TanStack Router, Vite, Tailwind v4. Bez testovacího runneru — ověřuje se přes
`npx tsc --noEmit`, `npm run build`, `npm run lint` a manuální průchod v prohlížeči.

**Spec:** `docs/superpowers/specs/2026-07-20-usek-detail-v2-design.md` — kompletní zdůvodnění a rozhodnutí.

---

## Task 1: AnchorPicker — 5 systémových kotev + kotvy napříč úseky stejné trasy

**Files:**
- Modify: `src/components/soulad/AnchorPicker.tsx`

- [ ] **Step 1: Rozšířit systémové kotvy a přidat kotvy z ostatních úseků stejné trasy**

Nahraď celý obsah `src/components/soulad/AnchorPicker.tsx`:

```tsx
import type { CheckpointCorrectness, Segment } from "@/lib/model/types";
import { useCheckpointTypes, useRoutes, useSegments } from "@/lib/model/store";

type AnchorValue = Pick<CheckpointCorrectness, "anchorKind" | "anchorLabel" | "anchorCheckpointTypeId">;

const SYSTEM_ANCHORS: { label: string }[] = [
  { label: "Vytvoření zásilky" },
  { label: "Vyzvednutí zásilky" },
  { label: "Vytvoření objednávky" },
  { label: "Avizované doručení zákazníkovi (ADD)" },
  { label: "Doručení hlášené dopravcem" },
];

/**
 * Nabízí systémové kotvy, body aktuálního úseku, a PŘIDÁVÁ body ostatních úseků, které patří
 * do stejné trasy (tras) jako aktuální úsek — viz docs/superpowers/specs/2026-07-20-usek-detail-v2-design.md §4.
 * Úsek bez trasy se chová jako dřív (jen "Body tohoto úseku").
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
  const routes = useRoutes();
  const segments = useSegments();
  const ctMap = new Map(checkpointTypes.map((ct) => [ct.id, ct.name]));

  const siblingSegmentIds = new Set(
    routes
      .filter((r) => r.segmentIds.includes(segment.id))
      .flatMap((r) => r.segmentIds)
      .filter((id) => id !== segment.id)
  );
  const siblingSegments = segments.filter((s) => siblingSegmentIds.has(s.id));

  const selectValue =
    value.anchorKind === "checkpoint"
      ? `checkpoint:${value.anchorCheckpointTypeId}`
      : value.anchorKind === "system_event"
        ? `system:${value.anchorLabel}`
        : "unsupported";

  return (
    <select
      aria-label="kotva"
      value={selectValue}
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
      {selectValue === "unsupported" && (
        <option value="unsupported" disabled hidden>
          {value.anchorLabel || "nepodporovaná kotva"}
        </option>
      )}
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
      {siblingSegments.map((sib) => (
        <optgroup key={sib.id} label={`Body úseku: ${sib.name}`}>
          {sib.checkpoints.map((cp) => (
            <option key={cp.id} value={`checkpoint:${cp.checkpointTypeId}`}>
              {cp.note ?? ctMap.get(cp.checkpointTypeId) ?? cp.checkpointTypeId}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
```

- [ ] **Step 2: Ověřit typecheck**

Run: `npx tsc --noEmit`
Expected: žádné nové chyby (jen 2 pre-existující v `RuleEditor.tsx`/`RulesList.tsx`).

- [ ] **Step 3: Commit**

```bash
git add src/components/soulad/AnchorPicker.tsx
git commit -m "feat(soulad): AnchorPicker — 5 systémových kotev + kotvy napříč úseky stejné trasy"
```

---

## Task 2: TerminEditor v2 — den/čas nebo odstup, živý náhled

**Files:**
- Modify: `src/components/soulad/TerminEditor.tsx`

- [ ] **Step 1: Nahradit TerminEditor bohatší verzí**

Nahraď celý obsah `src/components/soulad/TerminEditor.tsx`:

```tsx
import type { CheckpointCorrectness, Segment } from "@/lib/model/types";
import { AnchorPicker } from "./AnchorPicker";

const TIMEZONE_OPTIONS: { value: string; label: string }[] = [
  { value: "local", label: "Místní čas" },
  { value: "Europe/Prague", label: "Europe/Prague" },
  { value: "Europe/Berlin", label: "Europe/Berlin" },
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "America/New_York" },
];

function dnySlovo(n: number): string {
  if (n === 1) return "den";
  if (n >= 2 && n <= 4) return "dny";
  return "dní";
}

function fixedPreview(value: CheckpointCorrectness): string {
  const dayOffset = value.fixedDayOffset ?? 0;
  const dayStr =
    dayOffset === 0
      ? `v den události „${value.anchorLabel}"`
      : `${dayOffset} ${value.fixedDayMode === "business" ? "prac. " : ""}${dnySlovo(dayOffset)} ${value.fixedDayDirection === "before" ? "před" : "po"} události „${value.anchorLabel}"`;
  const tz = value.fixedTz ?? "local";
  return `nejpozději ${dayStr} v ${value.fixedTime ?? "08:00"} ${tz === "local" ? "místního času" : tz}`;
}

function offsetPreview(value: CheckpointCorrectness): string {
  const unitLabel = value.unit === "d" ? "dní" : value.unit === "bd" ? "prac. dní" : "h";
  const dir = value.direction === "before" ? "před" : "po";
  return `nejpozději ${value.value ?? 0} ${unitLabel} ${dir} události „${value.anchorLabel}"`;
}

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
  const anchor = { anchorKind: value.anchorKind, anchorLabel: value.anchorLabel, anchorCheckpointTypeId: value.anchorCheckpointTypeId };

  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm font-semibold">Vlastní čas záznamu musí být nejpozději do</div>

      <div className="flex flex-col gap-1.5 text-xs">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="radio"
            checked={isFixed}
            onChange={() => onChange({ ...value, mode: "fixed" })}
            className="accent-primary"
          />
          v konkrétní den a čas
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="radio"
            checked={!isFixed}
            onChange={() => onChange({ ...value, mode: "offset" })}
            className="accent-primary"
          />
          s odstupem od události
        </label>
      </div>

      {isFixed ? (
        <div className="flex flex-col gap-3 rounded-md border border-border bg-muted/20 p-3">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Den</div>
            <AnchorPicker
              segment={segment}
              currentCheckpointId={currentCheckpointId}
              value={anchor}
              onChange={(next) => onChange({ ...value, ...next })}
            />
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              <span className="text-[10px] text-muted-foreground">Posun:</span>
              <input
                type="number"
                min={0}
                value={value.fixedDayOffset ?? 0}
                onChange={(e) => onChange({ ...value, fixedDayOffset: Math.max(0, Number(e.target.value) || 0) })}
                className="w-14 rounded border border-border bg-background px-1.5 py-1 text-xs"
              />
              <span className="text-[10px] text-muted-foreground">dní</span>
              <select
                aria-label="typ dne posunu"
                value={value.fixedDayMode ?? "calendar"}
                onChange={(e) => onChange({ ...value, fixedDayMode: e.target.value as "calendar" | "business" })}
                className="rounded border border-border bg-background px-1.5 py-1 text-xs"
              >
                <option value="calendar">kalendářní</option>
                <option value="business">pracovní</option>
              </select>
              {(value.fixedDayOffset ?? 0) > 0 && (
                <select
                  aria-label="směr posunu dne"
                  value={value.fixedDayDirection ?? "after"}
                  onChange={(e) => onChange({ ...value, fixedDayDirection: e.target.value as "before" | "after" })}
                  className="rounded border border-border bg-background px-1.5 py-1 text-xs"
                >
                  <option value="after">po</option>
                  <option value="before">před</option>
                </select>
              )}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Čas</div>
            <div className="flex flex-wrap items-center gap-1.5">
              <input
                type="time"
                aria-label="pevný čas"
                value={value.fixedTime ?? "08:00"}
                onChange={(e) => onChange({ ...value, fixedTime: e.target.value })}
                className="rounded border border-border bg-background px-2 py-1 text-xs"
              />
              <span className="text-[10px] text-muted-foreground">pásmo</span>
              <select
                aria-label="časové pásmo"
                value={value.fixedTz ?? "local"}
                onChange={(e) => onChange({ ...value, fixedTz: e.target.value })}
                className="rounded border border-border bg-background px-2 py-1 text-xs"
              >
                {TIMEZONE_OPTIONS.map((tz) => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 rounded-md border border-border bg-muted/20 p-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <input
              type="number"
              min={0}
              value={value.value ?? 0}
              onChange={(e) => onChange({ ...value, value: Math.max(0, Number(e.target.value) || 0) })}
              className="w-14 rounded border border-border bg-background px-2 py-1 text-xs"
            />
            <select
              aria-label="jednotka posunu"
              value={value.unit ?? "h"}
              onChange={(e) => onChange({ ...value, unit: e.target.value as "h" | "d" | "bd" })}
              className="rounded border border-border bg-background px-2 py-1 text-xs"
            >
              <option value="h">h</option>
              <option value="d">dní</option>
              <option value="bd">prac. dní</option>
            </select>
            <select
              aria-label="směr posunu"
              value={value.direction ?? "after"}
              onChange={(e) => onChange({ ...value, direction: e.target.value as "before" | "after" })}
              className="rounded border border-border bg-background px-2 py-1 text-xs"
            >
              <option value="after">po</option>
              <option value="before">před</option>
            </select>
            <span className="text-[10px] text-muted-foreground">události:</span>
          </div>
          <AnchorPicker
            segment={segment}
            currentCheckpointId={currentCheckpointId}
            value={anchor}
            onChange={(next) => onChange({ ...value, ...next })}
          />
        </div>
      )}

      {value.anchorLabel && (
        <div className="flex items-start gap-1.5 rounded-md bg-primary-soft border border-primary/20 px-2.5 py-2 text-xs text-primary">
          <span className="mt-0.5">✓</span>
          <div>
            <div>{isFixed ? fixedPreview(value) : offsetPreview(value)}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {isFixed ? "Dřívější dny se započítávají automaticky." : "Může spadnout i na jiný den — to je v pořádku."}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Ověřit typecheck a build**

Run: `npx tsc --noEmit && npm run build`
Expected: build projde (žádné nové chyby oproti stavu před Taskem 1).

- [ ] **Step 3: Commit**

```bash
git add src/components/soulad/TerminEditor.tsx
git commit -m "feat(soulad): TerminEditor v2 — den/čas nebo odstup od události, živý náhled věty"
```

---

## Task 3: Sdílené vizuální komponenty KontrolaCard a Vetev

**Files:**
- Create: `src/components/soulad/KontrolaCard.tsx`
- Create: `src/components/soulad/Vetev.tsx`

- [ ] **Step 1: Napsat `KontrolaCard`**

```tsx
// src/components/soulad/KontrolaCard.tsx
import type { ReactNode } from "react";

export function KontrolaCard({
  cislo,
  nazev,
  casovani,
  pravidlo,
  children,
}: {
  cislo: number;
  nazev: string;
  casovani: string;
  pravidlo: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-foreground font-mono">
            {cislo}
          </div>
          <div className="text-xs font-semibold truncate">{nazev}</div>
        </div>
        <span className="shrink-0 rounded-full bg-primary-soft px-2.5 py-0.5 text-[11px] font-medium text-primary">
          {casovani}
        </span>
      </div>
      <div className="px-4 pt-2.5 text-[11px] text-muted-foreground">{pravidlo}</div>
      <div className="flex flex-col gap-2 p-3.5">{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: Napsat `Vetev`**

```tsx
// src/components/soulad/Vetev.tsx
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Vetev({
  kind,
  label,
  children,
}: {
  kind: "ok" | "warn" | "neutral";
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div
        className={cn(
          "px-3 py-1.5 text-[11px] font-semibold",
          kind === "ok" && "bg-success/20 text-success-foreground",
          kind === "warn" && "bg-warning/20 text-warning-foreground",
          kind === "neutral" && "bg-muted text-muted-foreground",
        )}
      >
        {label}
      </div>
      <div className="p-3 bg-card">{children}</div>
    </div>
  );
}
```

- [ ] **Step 3: Ověřit typecheck**

Run: `npx tsc --noEmit`
Expected: žádné nové chyby (komponenty zatím nikde nejsou použité, ale musí projít typecheckem).

- [ ] **Step 4: Commit**

```bash
git add src/components/soulad/KontrolaCard.tsx src/components/soulad/Vetev.tsx
git commit -m "feat(soulad): sdílené vizuální komponenty KontrolaCard a Vetev pro Plán spuštění"
```

---

## Task 4: KontrolyPanel + DnesniDoruceniKontroly — obsah "Plán spuštění"

**Files:**
- Create: `src/components/soulad/DnesniDoruceniKontroly.tsx`
- Create: `src/components/soulad/KontrolyPanel.tsx`

- [ ] **Step 1: Napsat `DnesniDoruceniKontroly` (3 kontroly pro typ Dnešní doručení)**

```tsx
// src/components/soulad/DnesniDoruceniKontroly.tsx
import type { DnesniDoruceniConfig } from "@/lib/model/types";
import { ROUTE_COMPLIANCE_SITUATIONS } from "@/lib/model/routeComplianceSituations";
import { formatTimeLimit } from "@/lib/model/formatTimeLimit";
import { KontrolaCard } from "./KontrolaCard";
import { Vetev } from "./Vetev";
import { SituaceCard } from "./SituaceCard";

export function DnesniDoruceniKontroly({ config }: { config: DnesniDoruceniConfig }) {
  return (
    <div className="flex flex-col gap-3.5">
      <KontrolaCard
        cislo={1}
        nazev="Limit pro řádné záznamy"
        casovani={formatTimeLimit(config.limitProRadneZaznamy)}
        pravidlo="Až do tohoto limitu sledujeme, jestli se objeví řádný záznam — tedy záznam se shodou a vlastním časem ≤ Termín. Datum doručení od přepravce (D) se tady ještě nekontroluje — poprvé se vyhodnotí až v Konečném limitu."
      >
        <Vetev kind="ok" label="✓ Řádný záznam se objevil">
          <p className="text-xs text-muted-foreground">Žádná věc k řešení — pokračuje se na 2. fyzický scan.</p>
        </Vetev>
        <Vetev kind="warn" label="! Řádný záznam se neobjevil">
          <p className="text-xs text-muted-foreground">Žádná věc k řešení — čeká se do Konečného limitu, kde se poprvé vyhodnotí i D.</p>
        </Vetev>
      </KontrolaCard>

      <KontrolaCard
        cislo={2}
        nazev="Konečný limit"
        casovani={formatTimeLimit(config.konecnyLimitScan1)}
        pravidlo="Poslední kontrola tohoto scanu — vlastní čas záznamu už nerozhoduje, jde jen o to, jestli řádný záznam nakonec dorazil."
      >
        <Vetev kind="warn" label="! Řádný záznam se neobjevil ani teď">
          <SituaceCard
            headline="Vzniká věc k řešení"
            situationId={ROUTE_COMPLIANCE_SITUATIONS.zpozdenaZasilka.situationId}
            severityId={ROUTE_COMPLIANCE_SITUATIONS.zpozdenaZasilka.severityId}
          />
        </Vetev>
        <Vetev kind="ok" label="✓ Řádný záznam se objevil">
          <p className="text-xs text-muted-foreground mb-2">Ještě nic nevzniká — nejdřív se znovu ověří D:</p>
          <div className="border-l-2 border-border pl-2.5 mb-2">
            <p className="text-[11px] text-muted-foreground">
              <b className="text-foreground">D = dnes</b> → žádná věc k řešení, pokračuje se na 2. fyzický scan.
            </p>
          </div>
          <div className="border-l-2 border-warning pl-2.5">
            <p className="text-[11px] text-muted-foreground mb-2">
              <b className="text-foreground">D ≠ dnes, posunulo se</b> → vzniká věc k řešení:
            </p>
            <SituaceCard
              headline="Vzniká věc k řešení"
              situationId={ROUTE_COMPLIANCE_SITUATIONS.zpozdenaZasilka.situationId}
              severityId={ROUTE_COMPLIANCE_SITUATIONS.zpozdenaZasilka.severityId}
            />
          </div>
        </Vetev>
      </KontrolaCard>

      <KontrolaCard
        cislo={3}
        nazev="2. scan — Konečný limit"
        casovani={formatTimeLimit(config.konecnyLimitScan2)}
        pravidlo="Jednostupňové, žádný mezistupeň jako u 1. scanu — jde o to, jestli 2. scan řádně dorazil do termínu finální kontroly (ne jen jestli dorazil vůbec)."
      >
        <Vetev kind="ok" label="✓ Řádně dorazil do termínu finální kontroly">
          <SituaceCard
            headline="Informativní"
            situationId={ROUTE_COMPLIANCE_SITUATIONS.dnesniDoruceni.situationId}
            severityId={ROUTE_COMPLIANCE_SITUATIONS.dnesniDoruceni.severityId}
          />
        </Vetev>
        <Vetev kind="warn" label="! Nedorazil řádně do termínu finální kontroly">
          <SituaceCard
            headline="Vzniká věc k řešení"
            situationId={ROUTE_COMPLIANCE_SITUATIONS.zpozdenaZasilka.situationId}
            severityId={ROUTE_COMPLIANCE_SITUATIONS.zpozdenaZasilka.severityId}
          />
        </Vetev>
      </KontrolaCard>
    </div>
  );
}
```

- [ ] **Step 2: Napsat `KontrolyPanel` (dispatcher podle typu bodu + banner)**

```tsx
// src/components/soulad/KontrolyPanel.tsx
import type { Checkpoint } from "@/lib/model/types";
import { ROUTE_COMPLIANCE_SITUATIONS } from "@/lib/model/routeComplianceSituations";
import { formatTimeLimit } from "@/lib/model/formatTimeLimit";
import { KontrolaCard } from "./KontrolaCard";
import { Vetev } from "./Vetev";
import { SituaceCard } from "./SituaceCard";
import { DnesniDoruceniKontroly } from "./DnesniDoruceniKontroly";

export function KontrolyPanel({ checkpoint }: { checkpoint: Checkpoint }) {
  return (
    <div className="flex flex-col gap-3.5">
      <div className="text-sm font-semibold">Plán spuštění</div>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-[11px] text-muted-foreground">
        <span>🔒 Situace, Závažnost a Akce se needitují tady — nastavují se v Django adminu.</span>
        <a
          href="/zadani-pro-programatory.html"
          target="_blank"
          rel="noreferrer"
          className="ml-auto shrink-0 font-semibold text-primary hover:underline"
        >
          Zadání pro programátory →
        </a>
      </div>

      {checkpoint.kind === "dnesni_doruceni" && checkpoint.dnesniDoruceni ? (
        <DnesniDoruceniKontroly config={checkpoint.dnesniDoruceni} />
      ) : (
        <KontrolaCard
          cislo={1}
          nazev="Konečný limit"
          casovani={formatTimeLimit(checkpoint.konecnyLimit ?? { mode: "offset", offsetHours: 0 })}
          pravidlo="Jediná kontrola tohoto bodu — časovač, žádný mezistupeň, žádná vazba na ADD/D."
        >
          <Vetev kind="ok" label="✓ Řádně nalezen do Termínu">
            <p className="text-xs text-muted-foreground">Žádná věc k řešení — řetězec pokračuje na další bod.</p>
          </Vetev>
          <Vetev kind="warn" label="! Nenalezen do Termínu">
            <SituaceCard
              headline="Vzniká věc k řešení"
              situationId={ROUTE_COMPLIANCE_SITUATIONS.problemNaTrase.situationId}
              severityId={ROUTE_COMPLIANCE_SITUATIONS.problemNaTrase.severityId}
            />
          </Vetev>
          <Vetev kind="neutral" label="ℹ Objeví se později (reaktivně)">
            <p className="text-xs text-muted-foreground mb-2">Kdykoli po Termínu, pokud záznam jinak splňuje podmínky:</p>
            <SituaceCard
              headline="Vzniká věc k řešení (informativní)"
              situationId={ROUTE_COMPLIANCE_SITUATIONS.problemNaTrasePozde.situationId}
              severityId={ROUTE_COMPLIANCE_SITUATIONS.problemNaTrasePozde.severityId}
            />
          </Vetev>
        </KontrolaCard>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Ověřit typecheck**

Run: `npx tsc --noEmit`
Expected: žádné nové chyby. `KontrolyPanel` zatím není nikde použitý — to je v pořádku, napojí se v Tasku 5.

- [ ] **Step 4: Commit**

```bash
git add src/components/soulad/DnesniDoruceniKontroly.tsx src/components/soulad/KontrolyPanel.tsx
git commit -m "feat(soulad): obsah Plán spuštění — KontrolyPanel + DnesniDoruceniKontroly"
```

---

## Task 5: 3sloupcový layout úseku, editace úseku, timeline body, napojení Plán spuštění

**Files:**
- Modify: `src/components/soulad/SouladSTrasouUsekPage.tsx`
- Modify: `src/components/soulad/BodDetailPanel.tsx`
- Modify: `src/components/soulad/DnesniDoruceniEditablePanel.tsx`

- [ ] **Step 1: Přepsat `SouladSTrasouUsekPage` — editace úseku, timeline body, 3 sloupce**

Nahraď celý obsah `src/components/soulad/SouladSTrasouUsekPage.tsx`:

```tsx
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { useSegments, segmentsStore } from "@/lib/model/store";
import { cn } from "@/lib/utils";
import type { Checkpoint, Segment } from "@/lib/model/types";
import { defaultVyzvednutiTermin } from "@/lib/model/defaults";
import { TRANSPORT_VARIANTS } from "@/lib/routes/types";
import { BodDetailPanel } from "./BodDetailPanel";
import { KontrolyPanel } from "./KontrolyPanel";

const CARRIER_OPTIONS = ["FedEx", "UPS", "DHL", "PPL", "GLS"];

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

  function toggleCarrier(c: string) {
    updateSegment({
      ...segment!,
      carriers: segment!.carriers.includes(c)
        ? segment!.carriers.filter((x) => x !== c)
        : [...segment!.carriers, c],
    });
  }

  function toggleServiceType(v: string) {
    updateSegment({
      ...segment!,
      serviceTypes: segment!.serviceTypes.includes(v)
        ? segment!.serviceTypes.filter((x) => x !== v)
        : [...segment!.serviceTypes, v],
    });
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
        <div className="w-[300px] shrink-0 border-r border-border overflow-y-auto p-4">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Základní info
          </div>
          <div className="flex flex-col gap-3 mb-5">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Název úseku</label>
              <input
                value={segment.name}
                onChange={(e) => updateSegment({ ...segment, name: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Popis (volitelný)</label>
              <textarea
                value={segment.description ?? ""}
                onChange={(e) => updateSegment({ ...segment, description: e.target.value || undefined })}
                rows={2}
                placeholder="Krátký popis…"
                className="w-full resize-none rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Dopravci</label>
              <div className="flex flex-wrap gap-1.5">
                {CARRIER_OPTIONS.map((c) => {
                  const selected = segment.carriers.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleCarrier(c)}
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs transition-colors border",
                        selected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Typ služby</label>
              <div className="flex flex-wrap gap-1.5">
                {TRANSPORT_VARIANTS.map((v) => {
                  const selected = segment.serviceTypes.includes(v.value);
                  return (
                    <button
                      key={v.value}
                      type="button"
                      onClick={() => toggleServiceType(v.value)}
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs transition-colors border",
                        selected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {v.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Body úseku ({segment.checkpoints.length})
          </div>
          <div className="relative flex flex-col gap-0.5 mb-2">
            <div className="absolute left-[15px] top-3.5 bottom-3.5 w-px bg-border" />
            {segment.checkpoints.map((cp) => {
              const isSelected = cp.id === selectedBodId;
              return (
                <button
                  key={cp.id}
                  onClick={() => setSelectedBodId(cp.id)}
                  className={cn(
                    "relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm",
                    isSelected ? "bg-primary-soft text-primary font-medium" : "hover:bg-muted",
                  )}
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
        <div className="w-[380px] shrink-0 border-r border-border overflow-y-auto">
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

- [ ] **Step 2: Zeštíhlit `BodDetailPanel` — odstranit Situace karty a duplicitní texty (přesunuty do `KontrolyPanel`)**

Nahraď celý obsah `src/components/soulad/BodDetailPanel.tsx`:

```tsx
import type { Checkpoint, Segment } from "@/lib/model/types";
import { defaultVyzvednutiTermin } from "@/lib/model/defaults";
import { MatchEditor } from "./MatchEditor";
import { TerminEditor } from "./TerminEditor";
import { TimeLimitEditor } from "./TimeLimitEditor";
import { DnesniDoruceniEditablePanel } from "./DnesniDoruceniEditablePanel";

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
    <div className="p-6 flex flex-col gap-6">
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
            <TerminEditor
              segment={segment}
              currentCheckpointId={checkpoint.id}
              value={checkpoint.correctness[0] ?? defaultVyzvednutiTermin("corr_" + checkpoint.id)}
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
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Zeštíhlit `DnesniDoruceniEditablePanel` — odstranit Situace karty a duplicitní texty**

Nahraď celý obsah `src/components/soulad/DnesniDoruceniEditablePanel.tsx`:

```tsx
import type { DnesniDoruceniConfig, Segment } from "@/lib/model/types";
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
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="text-sm font-semibold mb-3">2. fyzický scan</div>
        <MatchEditor
          value={config.scan2.match}
          onChange={(match) => onChange({ ...config, scan2: { ...config.scan2, match } })}
          showZipMatchesDestination
        />
        <div className="mt-3">
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
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Ověřit typecheck a build**

Run: `npx tsc --noEmit && npm run build`
Expected: build projde bez chyb (jen 2 pre-existující tsc chyby v `RuleEditor.tsx`/`RulesList.tsx`).

- [ ] **Step 5: Commit**

```bash
git add src/components/soulad/SouladSTrasouUsekPage.tsx src/components/soulad/BodDetailPanel.tsx src/components/soulad/DnesniDoruceniEditablePanel.tsx
git commit -m "feat(soulad): 3sloupcový layout úseku — editace úseku, timeline body, napojení Plán spuštění"
```

---

## Task 6: Zadání pro programátory jako statický asset

**Files:**
- Create: `public/zadani-pro-programatory.html` (kopie `mockups/2026-07-17-zadani-pro-programatory.html`)

- [ ] **Step 1: Zkopírovat soubor**

```bash
mkdir -p public
cp mockups/2026-07-17-zadani-pro-programatory.html public/zadani-pro-programatory.html
```

- [ ] **Step 2: Ověřit, že Vite ho servíruje jako statický soubor**

Run: `npm run dev` (nebo použij již běžící dev server v tomto worktree), pak otevři
`http://localhost:<port>/zadani-pro-programatory.html` v prohlížeči.
Expected: stránka se zobrazí (stejný obsah jako `mockups/2026-07-17-zadani-pro-programatory.html`).

- [ ] **Step 3: Commit**

```bash
git add public/zadani-pro-programatory.html
git commit -m "docs(soulad): zpřístupnit Zadání pro programátory jako statický asset"
```

---

## Task 7: Finální kontrola

- [ ] **Step 1: Kompletní build**

Run: `npm run build`
Expected: SUCCESS, žádné TypeScript chyby (kromě 2 pre-existujících nesouvisejících chyb v `RuleEditor.tsx`/`RulesList.tsx`).

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: žádné NOVÉ chyby mimo `prettier/prettier` formátovací pravidlo ve všech souborech dotčených touto
prací (`AnchorPicker.tsx`, `TerminEditor.tsx`, `KontrolaCard.tsx`, `Vetev.tsx`, `KontrolyPanel.tsx`,
`DnesniDoruceniKontroly.tsx`, `SouladSTrasouUsekPage.tsx`, `BodDetailPanel.tsx`, `DnesniDoruceniEditablePanel.tsx`).

- [ ] **Step 3: Manuální průchod v prohlížeči**

Run: `npm run dev`, otevři `/soulad-s-trasou`, vyber úsek s demo body a projdi:
- **Editace úseku:** změň Název úseku, přepni pár pilulek Dopravci/Typ služby — ověř, že se hned uloží
  (přežije refresh stránky).
- **Timeline bodů:** ověř tečku + spojovací čáru vlevo, vybraný bod je zvýrazněný (plná tečka + fialový
  text), ostatní neutrální.
- **Termín editor v2:** otevři "Vlastní čas záznamu musí být nejpozději do" u libovolného bodu, přepni mezi
  „v konkrétní den a čas" a „s odstupem od události", vyzkoušej Posun (dny, kalendářní/pracovní, po/před),
  pásmo, a u odstupu jednotku (h/d/prac. dní) a směr (po/před) — ověř, že se fialový náhled dole vždy
  správně přepočítá a text sedí s nastavením.
- **Kotva napříč úseky:** u úseku, který je součástí trasy s víc úseky (`seg_cz_arrival` +
  `seg_cz_lastmile` na trase FedEx Air — CZ), otevři výběr kotvy a ověř, že se kromě "Body tohoto úseku"
  zobrazí i optgroup s body druhého úseku.
- **Plán spuštění (Běžný bod):** ověř kartu "Konečný limit" se 3 větvemi (✓/!/ℹ), reálný čas v pilulce
  (ne vymyšlený příklad), a že karty Situace/Akce v negativních větvích ukazují skutečná data z katalogu
  (ne "nenalezena v katalogu").
- **Plán spuštění (Dnešní doručení):** ověř všechny 3 Kontroly, vnořené D=dnes/D≠dnes větvení v Kontrole 2,
  a že časy v pilulkách odpovídají tomu, co je nastavené v prostředním sloupci.
- **Odkaz Zadání pro programátory:** klikni na odkaz v banneru nad Plán spuštění, ověř, že se otevře nová
  záložka se skutečnou stránkou (ne 404).
- **Existující demo body** (`cp_odlet_brno_demo`, `cp_dnesni_doruceni_demo`) — ověř, že po všech změnách
  pořád fungují a nezobrazují chyby.

Pokud cokoliv z výše uvedeného nesedí, over si to přímo v Browser pane nástroji (screenshot, read_page),
neopravuj naslepo.

- [ ] **Step 4: Shrnutí pro uživatelku**

V závěrečném shrnutí znovu připomeň (pokud to ještě nebylo vyřešeno): než se tahle větev spojí s `main`,
uživatelka chtěla založit rollback bod (git tag na posledním commitu před mergem).
