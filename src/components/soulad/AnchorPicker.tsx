import type { CheckpointCorrectness, Segment } from "@/lib/model/types";
import { useCheckpointTypes } from "@/lib/model/store";

type AnchorValue = Pick<CheckpointCorrectness, "anchorKind" | "anchorLabel" | "anchorCheckpointTypeId">;

const SYSTEM_ANCHORS: { label: string }[] = [
  { label: "Avizované doručení zákazníkovi (ADD)" },
  { label: "Vyzvednutí zásilky" },
];

/**
 * Nabízí tři skupiny kotev: systémové (ADD, Vyzvednutí zásilky), a PRIMÁRNĚ body právě
 * otevřeného úseku (segment.checkpoints) — ne všechny body všech tras.
 */
export function AnchorPicker({
  segment,
  currentCheckpointId,
  value,
  onChange,
}: {
  segment: Segment;
  currentCheckpointId?: string;
  value: AnchorValue;
  onChange: (next: AnchorValue) => void;
}) {
  const checkpointTypes = useCheckpointTypes();
  const ctMap = new Map(checkpointTypes.map((ct) => [ct.id, ct.name]));

  const selectValue =
    value.anchorKind === "checkpoint"
      ? `checkpoint:${value.anchorCheckpointTypeId}`
      : value.anchorKind === "system_event"
        ? `system:${value.anchorLabel}`
        : "unsupported";

  return (
    <select
      aria-label="kotva"
      value={selectValue}
      onChange={(e) => {
        const raw = e.target.value;
        if (raw.startsWith("system:")) {
          onChange({ anchorKind: "system_event", anchorLabel: raw.slice("system:".length) });
        } else {
          const checkpointTypeId = raw.slice("checkpoint:".length);
          onChange({ anchorKind: "checkpoint", anchorLabel: ctMap.get(checkpointTypeId) ?? checkpointTypeId, anchorCheckpointTypeId: checkpointTypeId });
        }
      }}
      className="rounded border border-border bg-background px-2 py-1 text-xs"
    >
      {selectValue === "unsupported" && (
        <option value="unsupported" disabled hidden>
          {value.anchorLabel || "nepodporovaná kotva"}
        </option>
      )}
      <optgroup label="Systémové kotvy">
        {SYSTEM_ANCHORS.map((a) => (
          <option key={a.label} value={`system:${a.label}`}>{a.label}</option>
        ))}
      </optgroup>
      <optgroup label="Body tohoto úseku">
        {segment.checkpoints
          .filter((cp) => cp.id !== currentCheckpointId)
          .map((cp) => (
            <option key={cp.id} value={`checkpoint:${cp.checkpointTypeId}`}>
              {cp.note ?? ctMap.get(cp.checkpointTypeId) ?? cp.checkpointTypeId}
            </option>
          ))}
      </optgroup>
    </select>
  );
}
