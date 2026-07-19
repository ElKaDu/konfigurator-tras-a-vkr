import type { CheckpointCorrectness, Segment } from "@/lib/model/types";
import { AnchorPicker } from "./AnchorPicker";

export function TerminEditor({
  segment,
  currentCheckpointId,
  value,
  onChange,
}: {
  segment: Segment;
  currentCheckpointId?: string;
  value: CheckpointCorrectness;
  onChange: (next: CheckpointCorrectness) => void;
}) {
  const isFixed = value.mode !== "offset";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <span className="text-muted-foreground">kotva</span>
        <AnchorPicker
          segment={segment}
          currentCheckpointId={currentCheckpointId}
          value={{ anchorKind: value.anchorKind, anchorLabel: value.anchorLabel, anchorCheckpointTypeId: value.anchorCheckpointTypeId }}
          onChange={(anchor) => onChange({ ...value, ...anchor })}
        />
        <select
          value={value.mode ?? "fixed"}
          onChange={(e) => onChange({ ...value, mode: e.target.value as "fixed" | "offset" })}
          className="rounded border border-border bg-background px-2 py-1 text-xs"
        >
          <option value="fixed">v pevný čas</option>
          <option value="offset">posun v hodinách</option>
        </select>
        {isFixed ? (
          <input
            type="time"
            value={value.fixedTime ?? "08:00"}
            onChange={(e) => onChange({ ...value, fixedTime: e.target.value })}
            className="rounded border border-border bg-background px-2 py-1 text-xs"
          />
        ) : (
          <>
            <input
              type="number"
              min={0}
              value={value.value ?? 0}
              onChange={(e) => onChange({ ...value, value: Math.max(0, Number(e.target.value) || 0) })}
              className="w-16 rounded border border-border bg-background px-2 py-1 text-xs"
            />
            <span className="text-muted-foreground">h</span>
          </>
        )}
      </div>
    </div>
  );
}
