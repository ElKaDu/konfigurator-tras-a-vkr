import type { CheckpointMatch } from "@/lib/model/types";

export function MatchEditor({
  value,
  onChange,
  showZipMatchesDestination,
}: {
  value: CheckpointMatch;
  onChange: (next: CheckpointMatch) => void;
  showZipMatchesDestination?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground w-24 shrink-0">Status (oddělte čárkou)</span>
        <input
          type="text"
          value={value.status?.join(", ") ?? ""}
          onChange={(e) => {
            const status = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
            onChange({ ...value, status: status.length ? status : undefined });
          }}
          placeholder="např. Left FedEx origin facility"
          className="flex-1 rounded border border-border bg-background px-2 py-1"
        />
      </label>
      <label className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground w-24 shrink-0">Typ lokace (oddělte čárkou)</span>
        <input
          type="text"
          value={value.location_type?.join(", ") ?? ""}
          onChange={(e) => {
            const location_type = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
            onChange({ ...value, location_type: location_type.length ? location_type : undefined });
          }}
          placeholder="např. ORIGIN_FEDEX_FACILITY"
          className="flex-1 rounded border border-border bg-background px-2 py-1"
        />
      </label>
      {showZipMatchesDestination && (
        <label className="flex items-center gap-2 text-xs cursor-pointer">
          <input
            type="checkbox"
            checked={value.zip_matches_destination ?? false}
            onChange={(e) => onChange({ ...value, zip_matches_destination: e.target.checked })}
            className="accent-primary"
          />
          <span>PSČ — shoda se zásilkou (1. číslice PSČ místa doručení)</span>
        </label>
      )}
    </div>
  );
}
