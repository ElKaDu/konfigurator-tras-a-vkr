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
