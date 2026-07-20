import type { Checkpoint } from "@/lib/model/types";

export function BodRow({ checkpoint }: { checkpoint: Checkpoint }) {
  return (
    <div className="flex items-center justify-between py-1 pl-[26px] pr-2 text-xs text-muted-foreground">
      <span className="truncate">{checkpoint.note ?? checkpoint.checkpointTypeId}</span>
      <span className="shrink-0 text-[10px] ml-2">
        {checkpoint.kind === "dnesni_doruceni" ? "Dnešní doručení" : "Běžný bod"}
      </span>
    </div>
  );
}
