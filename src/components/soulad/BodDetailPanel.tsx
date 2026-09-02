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
    <div className="flex flex-col gap-5">
      <div className="rounded-md bg-card px-6 py-5 elevation-2">
        <div className="mb-4 text-h5">Co musí být na záznamu</div>
        <MatchEditor value={checkpoint.match} onChange={(match) => onUpdate({ ...checkpoint, match })} />
      </div>

      <div className="rounded-md bg-card px-6 py-5 elevation-2">
        <TerminEditor
          segment={segment}
          currentCheckpointId={checkpoint.id}
          value={checkpoint.correctness[0] ?? defaultVyzvednutiTermin("corr_" + checkpoint.id)}
          onChange={(corr) => onUpdate({ ...checkpoint, correctness: [corr] })}
        />
      </div>

      <div className="rounded-md bg-card px-6 py-5 elevation-2">
        <div className="mb-4 text-h5">Konečný limit</div>
        <TimeLimitEditor
          label="Konečný limit"
          value={checkpoint.konecnyLimit ?? { mode: "offset", offsetHours: 0 }}
          onChange={(limit) => onUpdate({ ...checkpoint, konecnyLimit: limit })}
        />
      </div>
    </div>
  );
}
