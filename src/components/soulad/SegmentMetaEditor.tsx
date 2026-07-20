import { cn } from "@/lib/utils";
import type { Segment } from "@/lib/model/types";
import { TRANSPORT_VARIANTS } from "@/lib/routes/types";

const CARRIER_OPTIONS = ["FedEx", "UPS", "DHL", "PPL", "GLS"];

export function SegmentMetaEditor({
  segment,
  onUpdate,
}: {
  segment: Segment;
  onUpdate: (next: Segment) => void;
}) {
  function toggleCarrier(c: string) {
    onUpdate({
      ...segment,
      carriers: segment.carriers.includes(c)
        ? segment.carriers.filter((x) => x !== c)
        : [...segment.carriers, c],
    });
  }

  function toggleServiceType(v: string) {
    onUpdate({
      ...segment,
      serviceTypes: segment.serviceTypes.includes(v)
        ? segment.serviceTypes.filter((x) => x !== v)
        : [...segment.serviceTypes, v],
    });
  }

  return (
    <>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        Základní info
      </div>
      <div className="flex flex-col gap-3 mb-5">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Název úseku</label>
          <input
            value={segment.name}
            onChange={(e) => onUpdate({ ...segment, name: e.target.value })}
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Popis (volitelný)</label>
          <textarea
            value={segment.description ?? ""}
            onChange={(e) => onUpdate({ ...segment, description: e.target.value || undefined })}
            rows={2}
            placeholder="Krátký popis…"
            className="w-full resize-none rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Dopravci</label>
          <div className="flex flex-wrap gap-1.5">
            {CARRIER_OPTIONS.map((c) => {
              const selected = segment.carriers.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCarrier(c)}
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs transition-colors border",
                    selected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Typ služby</label>
          <div className="flex flex-wrap gap-1.5">
            {TRANSPORT_VARIANTS.map((v) => {
              const selected = segment.serviceTypes.includes(v.value);
              return (
                <button
                  key={v.value}
                  type="button"
                  onClick={() => toggleServiceType(v.value)}
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs transition-colors border",
                    selected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  {v.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
