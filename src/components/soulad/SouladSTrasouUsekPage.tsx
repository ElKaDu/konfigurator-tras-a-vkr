import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { useSegments, segmentsStore } from "@/lib/model/store";
import { cn } from "@/lib/utils";
import type { Checkpoint, Segment } from "@/lib/model/types";
import { defaultVyzvednutiTermin } from "@/lib/model/defaults";
import { BodDetailPanel } from "./BodDetailPanel";

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
        <div className="w-[280px] shrink-0 border-r border-border overflow-y-auto p-4">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Body úseku ({segment.checkpoints.length})
          </div>
          <div className="flex flex-col gap-0.5 mb-2">
            {segment.checkpoints.map((cp) => (
              <button
                key={cp.id}
                onClick={() => setSelectedBodId(cp.id)}
                className={cn(
                  "flex items-center justify-between rounded-md px-2.5 py-2 text-left text-sm",
                  cp.id === selectedBodId ? "bg-primary-soft text-primary font-medium" : "hover:bg-muted",
                )}
              >
                <span>{cp.note ?? cp.checkpointTypeId}</span>
                <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                  {cp.kind === "dnesni_doruceni" ? "Dnešní doručení" : "Běžný bod"}
                </span>
              </button>
            ))}
          </div>
          <button
            onClick={addCheckpoint}
            className="w-full rounded-md border border-dashed border-border px-2.5 py-2 text-xs text-primary hover:bg-muted"
          >
            + Přidat bod
          </button>
        </div>
        <div className="flex-1 min-w-0 overflow-y-auto">
          {selectedBod ? (
            <BodDetailPanel segment={segment} checkpoint={selectedBod} onUpdate={updateCheckpoint} />
          ) : (
            <div className="p-8 text-sm text-muted-foreground">Vyberte bod vlevo, nebo přidejte nový.</div>
          )}
        </div>
      </div>
    </div>
  );
}
