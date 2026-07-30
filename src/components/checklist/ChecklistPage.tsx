import { ShipmentHeader } from "./ShipmentHeader";
import { Krok1Mock } from "./Krok1Mock";
import { CategoryNav } from "./CategoryNav";
import { ItemsList } from "./ItemsList";
import { ShrnutiNalezuPanel } from "./ShrnutiNalezuPanel";
import { CallPanel } from "./CallPanel";
import { VkrCards } from "./VkrCards";
import { useChecklistItems, useKontakty, resetChecklistPrototype } from "@/lib/checklist/store";
import { computeChecklistStatus } from "@/lib/checklist/derived";
import { RotateCcw } from "lucide-react";

export function ChecklistPage() {
  const items = useChecklistItems();
  const kontakty = useKontakty();
  const status = computeChecklistStatus(items, kontakty);

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
        <div className="mx-auto max-w-[1600px] px-6 py-5">
          <h2 className="mb-4 text-base font-semibold">Checklist</h2>

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
