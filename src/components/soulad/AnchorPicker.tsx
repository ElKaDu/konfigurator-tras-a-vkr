import type { CheckpointCorrectness, Segment } from "@/lib/model/types";
import { useCheckpointTypes, useRoutes, useSegments } from "@/lib/model/store";
import { SelectToken } from "@/components/common/SentenceToken";

type AnchorValue = Pick<CheckpointCorrectness, "anchorKind" | "anchorLabel" | "anchorCheckpointTypeId">;

const SYSTEM_ANCHORS: { label: string }[] = [
  { label: "Vytvoření zásilky" },
  { label: "Vyzvednutí zásilky" },
  { label: "Vytvoření objednávky" },
  { label: "Avizované doručení zákazníkovi (ADD)" },
  { label: "Doručení hlášené dopravcem" },
];

/**
 * Nabízí systémové kotvy, body aktuálního úseku, a PŘIDÁVÁ body ostatních úseků, které patří
 * do stejné trasy (tras) jako aktuální úsek — viz docs/superpowers/specs/2026-07-20-usek-detail-v2-design.md §4.
 * Úsek bez trasy se chová jako dřív (jen "Body tohoto úseku").
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
  const routes = useRoutes();
  const segments = useSegments();
  const ctMap = new Map(checkpointTypes.map((ct) => [ct.id, ct.name]));

  const siblingSegmentIds = new Set(
    routes
      .filter((r) => r.segmentIds.includes(segment.id))
      .flatMap((r) => r.segmentIds)
      .filter((id) => id !== segment.id)
  );
  const siblingSegments = segments.filter((s) => siblingSegmentIds.has(s.id));

  const selectValue =
    value.anchorKind === "checkpoint"
      ? `checkpoint:${value.anchorCheckpointTypeId}`
      : value.anchorKind === "system_event"
        ? `system:${value.anchorLabel}`
        : "unsupported";

  const label = value.anchorLabel || "vyber událost";

  return (
    <SelectToken
      ariaLabel="událost, od které se termín počítá"
      value={selectValue}
      label={label}
      onChange={(raw) => {
        if (raw.startsWith("system:")) {
          onChange({ anchorKind: "system_event", anchorLabel: raw.slice("system:".length) });
        } else {
          const checkpointTypeId = raw.slice("checkpoint:".length);
          onChange({
            anchorKind: "checkpoint",
            anchorLabel: ctMap.get(checkpointTypeId) ?? checkpointTypeId,
            anchorCheckpointTypeId: checkpointTypeId,
          });
        }
      }}
    >
      {selectValue === "unsupported" && (
        <option value="unsupported" disabled hidden>
          {value.anchorLabel || "nepodporovaná kotva"}
        </option>
      )}
      <optgroup label="Události zásilky">
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
      {/* Pozn.: hodnota kotvy je klíčovaná jen checkpointTypeId, ne konkrétním úsekem — pokud
          se stejný typ bodu objeví ve dvou sourozeneckých úsecích, výběr mezi nimi se ve
          <select> nerozliší (obě možnosti mají stejnou value). Známé omezení. */}
      {siblingSegments.map((sib) => (
        <optgroup key={sib.id} label={`Body úseku: ${sib.name}`}>
          {sib.checkpoints.map((cp) => (
            <option key={cp.id} value={`checkpoint:${cp.checkpointTypeId}`}>
              {cp.note ?? ctMap.get(cp.checkpointTypeId) ?? cp.checkpointTypeId}
            </option>
          ))}
        </optgroup>
      ))}
    </SelectToken>
  );
}
