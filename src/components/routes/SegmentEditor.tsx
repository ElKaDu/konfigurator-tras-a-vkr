import { useState } from "react";
import { X } from "lucide-react";
import { useSegments, useCheckpointTypes, segmentsStore } from "@/lib/model/store";
import { milestoneTypeUsage, segmentDependencies } from "@/lib/model/routeAssembly";
import { cn } from "@/lib/utils";
import { MilestoneLibrary } from "./MilestoneLibrary";
import { CheckpointWizard } from "./CheckpointWizard";

export function SegmentEditor({ segmentId }: { segmentId: string }) {
  const segments = useSegments();
  const segment = segments.find((s) => s.id === segmentId);
  const types = useCheckpointTypes();

  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!segment) return null;

  const typeName = (id: string) => types.find((t) => t.id === id)?.name ?? id;

  const usage = milestoneTypeUsage(segments);
  const deps = segmentDependencies(segment);

  const selectedCp = segment.checkpoints[selectedIndex] ?? null;

  function addMilestone(checkpointTypeId: string) {
    const newCp = {
      id: "cp_" + Date.now(),
      checkpointTypeId,
      match: {},
      correctness: [],
    };
    const updated = { ...segment!, checkpoints: [...segment!.checkpoints, newCp] };
    segmentsStore.upsert(updated);
    setSelectedIndex(updated.checkpoints.length - 1);
  }

  function removeCheckpoint(idx: number) {
    const updated = {
      ...segment!,
      checkpoints: segment!.checkpoints.filter((_, i) => i !== idx),
    };
    segmentsStore.upsert(updated);
    // Keep selection in bounds
    setSelectedIndex((prev) => Math.min(prev, updated.checkpoints.length - 1));
  }

  return (
    <div className="flex gap-4 min-h-0">
      {/* LEFT: Milestone library (~190px) */}
      <div className="w-[190px] shrink-0 rounded-xl border border-border bg-background p-3">
        <MilestoneLibrary onPick={addMilestone} />
      </div>

      {/* RIGHT: Segment content */}
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        {/* Segment header */}
        <div className="rounded-xl border border-border bg-background p-4 flex flex-col gap-2">
          <input
            value={segment.name}
            onChange={(e) =>
              segmentsStore.upsert({ ...segment, name: e.target.value })
            }
            className="text-base font-semibold bg-transparent border-none outline-none w-full placeholder:text-muted-foreground"
            placeholder="Název úseku"
          />
          <p className="text-sm text-muted-foreground">
            {[...segment.carriers, ...segment.serviceTypes].join(" · ")}
          </p>
          <textarea
            value={segment.description ?? ""}
            onChange={(e) =>
              segmentsStore.upsert({ ...segment, description: e.target.value || undefined })
            }
            placeholder="+ popis"
            rows={2}
            className={cn(
              "w-full resize-none bg-transparent border-none outline-none text-sm",
              segment.description
                ? "text-foreground"
                : "text-muted-foreground placeholder:text-muted-foreground"
            )}
          />
        </div>

        {/* Checkpoint sequence */}
        <div className="rounded-xl border border-border bg-background p-4 flex flex-col gap-2">
          <p className="text-sm font-medium text-muted-foreground mb-1">Milníky úseku</p>

          {segment.checkpoints.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              Zatím žádné milníky — přidej je z knihovny vlevo.
            </p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {segment.checkpoints.map((cp, idx) => {
                const name = typeName(cp.checkpointTypeId);
                const usageCount = usage.get(cp.checkpointTypeId) ?? 0;
                const isSelected = idx === selectedIndex;

                return (
                  <button
                    key={cp.id}
                    onClick={() => setSelectedIndex(idx)}
                    className={cn(
                      "group flex items-center justify-between rounded-md px-3 py-2 text-sm text-left transition-colors",
                      isSelected
                        ? "bg-primary/10 border border-primary/30 text-primary"
                        : "border border-border hover:bg-muted text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="tabular-nums text-xs opacity-60 shrink-0">{idx + 1}</span>
                      <span className="font-medium truncate">{name}</span>
                      {usageCount > 1 && (
                        <span className="shrink-0 rounded-full bg-primary/10 text-primary text-[11px] font-medium px-2 py-0.5">
                          sdílený · {usageCount}
                        </span>
                      )}
                    </div>
                    <span
                      role="button"
                      aria-label={`Odebrat milník ${name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeCheckpoint(idx);
                      }}
                      className="shrink-0 ml-2 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground transition-opacity"
                    >
                      <X size={14} />
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {deps.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Očekává dříve na trase: {deps.map(typeName).join(", ")}
            </p>
          )}
        </div>

        {/* Checkpoint wizard for selected checkpoint */}
        {selectedCp && (
          <CheckpointWizard milestoneLabel={typeName(selectedCp.checkpointTypeId)} />
        )}
      </div>
    </div>
  );
}
