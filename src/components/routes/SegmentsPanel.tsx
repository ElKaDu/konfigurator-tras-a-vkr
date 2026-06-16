import { useState } from "react";
import { useSegments, segmentsStore } from "@/lib/model/store";
import { cn } from "@/lib/utils";
import { SegmentEditor } from "./SegmentEditor";

export function SegmentsPanel({
  defaultCarriers,
  defaultServiceTypes,
}: {
  defaultCarriers: string[];
  defaultServiceTypes: string[];
}) {
  const segments = useSegments();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  function createSegment() {
    const newSeg = {
      id: "seg_" + Date.now(),
      name: "Nový úsek",
      description: undefined,
      carriers: defaultCarriers,
      serviceTypes: defaultServiceTypes,
      checkpoints: [],
    };
    segmentsStore.upsert(newSeg);
    setSelectedId(newSeg.id);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Segment list */}
      <div className="flex flex-col gap-1.5">
        {segments.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            Zatím žádné úseky — přidej první.
          </p>
        ) : (
          segments.map((seg) => (
            <button
              key={seg.id}
              onClick={() => setSelectedId(seg.id === selectedId ? null : seg.id)}
              className={cn(
                "flex flex-col items-start gap-0.5 rounded-md border px-3 py-2.5 text-sm text-left transition-colors",
                seg.id === selectedId
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border hover:bg-muted text-foreground"
              )}
            >
              <span className="font-medium">{seg.name}</span>
              <span
                className={cn(
                  "text-xs",
                  seg.id === selectedId ? "text-primary/70" : "text-muted-foreground"
                )}
              >
                {[...seg.carriers, ...seg.serviceTypes].join(" · ")}
              </span>
              {seg.description && (
                <span
                  className={cn(
                    "text-xs",
                    seg.id === selectedId ? "text-primary/70" : "text-muted-foreground"
                  )}
                >
                  {seg.description}
                </span>
              )}
            </button>
          ))
        )}
      </div>

      {/* Add new segment button */}
      <button
        onClick={createSegment}
        className="self-start rounded-md border border-dashed border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
      >
        + nový úsek
      </button>

      {/* Inline editor for selected segment */}
      {selectedId && (
        <div className="mt-2">
          <SegmentEditor segmentId={selectedId} />
        </div>
      )}
    </div>
  );
}
