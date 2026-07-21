import type { Checkpoint, Segment } from "@/lib/model/types";
import { defaultVyzvednutiTermin } from "@/lib/model/defaults";
import { MatchEditor } from "./MatchEditor";
import { TerminEditor } from "./TerminEditor";
import { TimeLimitEditor } from "./TimeLimitEditor";

export function BodDetailPanel({
  segment,
  checkpoint,
  onUpdate,
}: {
  segment: Segment;
  checkpoint: Checkpoint;
  onUpdate: (next: Checkpoint) => void;
}) {
  return (
    <div className="p-6 flex flex-col gap-6">
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
    </div>
  );
}
