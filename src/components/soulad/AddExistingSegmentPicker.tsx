// src/components/soulad/AddExistingSegmentPicker.tsx
import { useState } from "react";
import { Plus } from "@/components/ui/icon";
import { eligibleSegments } from "@/lib/model/routeEligibility";
import type { Route, Segment } from "@/lib/model/types";

export function AddExistingSegmentPicker({
  route,
  segments,
  onAdd,
}: {
  route: Pick<Route, "carriers" | "serviceTypes" | "segmentIds">;
  segments: Segment[];
  onAdd: (segmentId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const eligible = eligibleSegments(route, segments);

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-md border border-primary px-4 py-2 text-[13px] font-medium text-primary transition-colors hover:bg-primary/[0.06]"
      >
        <Plus size={16} /> Přidat existující úsek
      </button>
      {open && (
        <div className="mt-1.5 rounded-md border border-border bg-muted/20 p-1.5 space-y-0.5 max-w-sm">
          {eligible.length === 0 ? (
            <div className="px-2 py-1.5 text-xs text-muted-foreground italic">
              Žádné vhodné úseky (podle dopravce a typu služby trasy).
            </div>
          ) : (
            eligible.map((segment) => (
              <button
                key={segment.id}
                onClick={() => {
                  onAdd(segment.id);
                  setOpen(false);
                }}
                className="w-full flex items-center justify-between rounded px-2 py-1.5 text-xs text-left hover:bg-muted transition-colors"
              >
                <span className="font-medium">{segment.name}</span>
                <span className="text-muted-foreground">{segment.carriers.join(", ")}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
