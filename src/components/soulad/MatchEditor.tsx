import { useState } from "react";
import { X } from "@/components/ui/icon";
import type { CheckpointMatch } from "@/lib/model/types";

/** Hodnoty se zadávají jako chipy — čárky v jednom dlouhém poli se špatně čtou i opravují. */
function ChipsField({
  label,
  values,
  placeholder,
  onChange,
}: {
  label: string;
  values: string[];
  placeholder: string;
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function commit() {
    const parts = draft.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length) onChange([...values, ...parts.filter((p) => !values.includes(p))]);
    setDraft("");
  }

  return (
    <div className="flex items-start gap-3">
      <label className="w-24 shrink-0 pt-2.5 text-[13px] text-muted-foreground">{label}</label>
      <div className="flex min-h-[38px] flex-1 flex-wrap items-center gap-1.5 rounded-md border border-input bg-card px-2.5 py-1.5">
        {values.map((v) => (
          <span
            key={v}
            className="inline-flex h-6 items-center gap-1.5 rounded-full bg-primary-soft px-2.5 text-[13px] font-medium text-accent-foreground"
          >
            {v}
            <button
              onClick={() => onChange(values.filter((x) => x !== v))}
              title={`Odebrat ${v}`}
              className="opacity-60 transition-opacity hover:opacity-100"
            >
              <X size={14} />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              commit();
            }
            if (e.key === "Backspace" && !draft && values.length) onChange(values.slice(0, -1));
          }}
          onBlur={commit}
          placeholder={values.length ? "" : placeholder}
          className="min-w-[120px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
}

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
    <div className="flex flex-col gap-3">
      <ChipsField
        label="Status"
        values={value.status ?? []}
        placeholder="např. Left FedEx origin facility"
        onChange={(status) => onChange({ ...value, status: status.length ? status : undefined })}
      />
      <ChipsField
        label="Typ lokace"
        values={value.location_type ?? []}
        placeholder="např. ORIGIN_FEDEX_FACILITY"
        onChange={(location_type) =>
          onChange({ ...value, location_type: location_type.length ? location_type : undefined })
        }
      />
      {showZipMatchesDestination && (
        <label className="flex cursor-pointer items-center gap-2.5 pl-27 text-sm">
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
