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
