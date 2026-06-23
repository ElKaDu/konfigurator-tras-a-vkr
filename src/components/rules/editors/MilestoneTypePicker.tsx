import { Info } from "lucide-react";
import { useCheckpointTypes } from "@/lib/model/store";

export function MilestoneTypePicker({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (id: string) => void;
}) {
  const checkpointTypes = useCheckpointTypes();

  return (
    <div className="rounded-xl border border-border bg-muted/10 p-3 space-y-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Typ milníku
      </div>

      <div className="space-y-1.5">
        {checkpointTypes.map((ct) => (
          <label
            key={ct.id}
            className="flex items-center gap-2.5 cursor-pointer rounded-lg border border-border bg-background px-3 py-2 hover:bg-muted/30"
          >
            <input
              type="radio"
              name="missed_milestone_type"
              value={ct.id}
              checked={value === ct.id}
              onChange={() => onChange(ct.id)}
              className="accent-primary"
            />
            <span className="text-sm">{ct.name}</span>
          </label>
        ))}
      </div>

      <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground leading-snug">
        <Info size={11} className="mt-0.5 shrink-0" />
        <span>
          Pravidlo se spustí pouze na úsecích, kde má vybraný typ milníku
          zaznamenaný čas.
        </span>
      </div>
    </div>
  );
}
