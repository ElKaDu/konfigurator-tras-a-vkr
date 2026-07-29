import { AppHeader } from "@/components/AppHeader";
import { Krok1Mock } from "./Krok1Mock";
import { CategoryNav } from "./CategoryNav";
import { ItemsList } from "./ItemsList";
import { ShrnutiNalezuPanel } from "./ShrnutiNalezuPanel";
import { VkrPanel } from "./VkrPanel";
import { KontaktWidget } from "./KontaktWidget";
import { useChecklistItems, resetChecklistPrototype } from "@/lib/checklist/store";
import { computeChecklistStatus } from "@/lib/checklist/derived";
import { RotateCcw } from "lucide-react";

export function ChecklistPage() {
  const items = useChecklistItems();
  const status = computeChecklistStatus(items);

  return (
    <div className="flex h-screen w-screen flex-col bg-background text-foreground">
      <AppHeader
        current="checklist"
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
        <div className="mx-auto max-w-5xl px-6 py-5">
          <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
            Obchodní případy / Objednávky / <span className="font-medium text-foreground">#OP-2026-04471</span>
          </div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-semibold">Objednávka #OP-2026-04471</h1>
            <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-[11px] font-semibold text-accent-foreground">
              Objednávka · Vyhodnocení a kontrola
            </span>
            <span className={statusPillClass(status.kind)}>{status.label}</span>
          </div>

          <div className="mb-4 rounded-lg border border-primary bg-primary-soft px-4 py-2.5 text-xs text-accent-foreground">
            <b>Prototyp checklistu.</b> Krok 1 níže je jen náhled (needituje se). Zbytek — položky, kontext,
            nálezy, kontakty, věci k řešení — je plně funkční, ukládá se do localStorage.
          </div>

          <div className="mb-4 flex flex-wrap items-stretch gap-3">
            <div className="flex flex-1 min-w-[220px] items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
              <div>
                <div className="text-xl font-bold tabular-nums text-warning-foreground">2:40</div>
                <div className="text-[11px] text-muted-foreground">
                  do limitu zpracování <span className="opacity-70">(mock — nepočítá se)</span>
                </div>
              </div>
            </div>
            <KontaktWidget />
            <div className="flex flex-1 min-w-[190px] items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
              <div className="flex-1">
                <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                  <span>Krok 2</span>
                  <span className="tabular-nums text-foreground">
                    {status.resolvedCount} / {status.totalCount}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-success"
                    style={{ width: `${status.progressPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <Krok1Mock />

          <div className="grid grid-cols-[260px_minmax(0,1fr)] items-start gap-4">
            <aside className="sticky top-4 flex flex-col gap-3">
              <CategoryNav />
              <ShrnutiNalezuPanel />
              <VkrPanel />
            </aside>
            <main>
              <ItemsList />
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

function statusPillClass(kind: "in_progress" | "waiting_contact" | "overdue" | "done"): string {
  const base = "rounded-full px-2.5 py-0.5 text-[11px] font-semibold";
  if (kind === "waiting_contact") return `${base} bg-warning/15 text-warning-foreground`;
  if (kind === "overdue") return `${base} bg-destructive/15 text-destructive`;
  if (kind === "done") return `${base} bg-success/15 text-success-foreground`;
  return `${base} bg-muted text-muted-foreground`;
}
