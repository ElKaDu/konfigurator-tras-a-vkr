import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Trash2 } from "@/components/ui/icon";
import { AppShell } from "@/components/AppShell";
import { useSegments, segmentsStore, isSegmentUsed } from "@/lib/model/store";
import { cn } from "@/lib/utils";
import type { Checkpoint, Segment } from "@/lib/model/types";
import { defaultVyzvednutiTermin } from "@/lib/model/defaults";
import { BodDetailPanel } from "./BodDetailPanel";
import { SegmentMetaEditor } from "./SegmentMetaEditor";

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

export function SouladSTrasouUsekPage({
  segmentId,
  fromRouteId,
}: {
  segmentId: string;
  fromRouteId?: string;
}) {
  const segments = useSegments();
  const segment = segments.find((s) => s.id === segmentId) ?? null;
  const navigate = useNavigate();
  const visibleCheckpoints = segment?.checkpoints.filter((cp) => cp.kind !== "dnesni_doruceni") ?? [];
  const [selectedBodId, setSelectedBodId] = useState<string | null>(
    visibleCheckpoints[0]?.id ?? null,
  );

  if (!segment) {
    return (
      <AppShell current="soulad" title="Úsek" backTo="/soulad-s-trasou">
        <div className="rounded-md bg-card px-6 py-10 text-center text-sm text-muted-foreground elevation-2">
          Úsek nenalezen.
        </div>
      </AppShell>
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

  function removeCheckpoint(id: string) {
    const next = segment!.checkpoints.filter((cp) => cp.id !== id);
    updateSegment({ ...segment!, checkpoints: next });
    setSelectedBodId((prev) =>
      prev === id ? next.find((cp) => cp.kind !== "dnesni_doruceni")?.id ?? null : prev,
    );
  }

  function deleteSegment() {
    segmentsStore.remove(segment!.id);
    if (fromRouteId) navigate({ to: "/soulad-s-trasou/trasa/$id", params: { id: fromRouteId } });
    else navigate({ to: "/soulad-s-trasou" });
  }

  const usekVisibleCheckpoints = segment.checkpoints.filter((cp) => cp.kind !== "dnesni_doruceni");
  const selectedBod = usekVisibleCheckpoints.find((cp) => cp.id === selectedBodId) ?? null;
  const { used, count } = isSegmentUsed(segment.id);

  return (
    <AppShell current="soulad" title={segment.name || "Úsek"} backTo="/soulad-s-trasou">
      <div className="mb-4 flex items-center justify-between gap-4 text-[13px] text-muted-foreground">
        <div>
          <Link to="/soulad-s-trasou" className="hover:text-primary">Pravidla podle trasy</Link>
          {fromRouteId && (
            <>
              <span className="mx-1.5 opacity-50">/</span>
              <Link to="/soulad-s-trasou/trasa/$id" params={{ id: fromRouteId }} className="hover:text-primary">
                trasa
              </Link>
            </>
          )}
          <span className="mx-1.5 opacity-50">/</span>
          <span className="font-medium text-foreground">{segment.name}</span>
        </div>
        <button
          disabled={used}
          onClick={deleteSegment}
          title={used ? `Používá se v ${count} ${count === 1 ? "trase" : "trasách"}` : "Smazat úsek"}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-md border px-3 py-1.5 text-[13px] transition-colors",
            used
              ? "cursor-not-allowed border-input text-muted-foreground/40"
              : "border-destructive/50 text-destructive hover:bg-destructive/[0.06]",
          )}
        >
          <Trash2 size={16} />
          {used ? `Nelze smazat — používá se v ${count} ${count === 1 ? "trase" : "trasách"}` : "Smazat úsek"}
        </button>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="flex flex-col gap-5">
          <div className="rounded-md bg-card px-6 py-5 elevation-2">
            <SegmentMetaEditor segment={segment} onUpdate={updateSegment} />
          </div>

          <div className="rounded-md bg-card px-6 py-5 elevation-2">
            <div className="text-overline mb-3">Body úseku ({usekVisibleCheckpoints.length})</div>
            <div className="relative mb-3 flex flex-col gap-0.5">
              <div className="absolute bottom-3.5 left-[15px] top-3.5 w-px bg-border" />
              {usekVisibleCheckpoints.map((cp) => {
                const isSelected = cp.id === selectedBodId;
                return (
                  <div
                    key={cp.id}
                    className={cn(
                      "group relative flex items-center gap-2.5 rounded-md py-2 pl-2.5 pr-1.5 text-sm",
                      isSelected ? "bg-primary-soft font-medium text-primary" : "hover:bg-muted/60",
                    )}
                  >
                    <button
                      onClick={() => setSelectedBodId(cp.id)}
                      className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                    >
                      <span
                        className={cn(
                          "z-10 size-2.5 shrink-0 rounded-full",
                          isSelected ? "bg-primary ring-4 ring-primary-soft" : "bg-muted-foreground/40",
                        )}
                      />
                      <span className="min-w-0 flex-1 truncate">{cp.note ?? cp.checkpointTypeId}</span>
                    </button>
                    <button
                      onClick={() => removeCheckpoint(cp.id)}
                      title="Smazat bod"
                      className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-all hover:text-destructive group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
            <button
              onClick={addCheckpoint}
              className="w-full rounded-md border border-dashed border-input px-2.5 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              + Přidat bod
            </button>
          </div>
        </div>

        <div className="min-w-0">
          {selectedBod ? (
            <BodDetailPanel segment={segment} checkpoint={selectedBod} onUpdate={updateCheckpoint} />
          ) : (
            <div className="rounded-md bg-card px-6 py-10 text-center text-sm text-muted-foreground elevation-2">
              Vyberte bod vlevo, nebo přidejte nový.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
