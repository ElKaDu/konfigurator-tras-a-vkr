import { useState } from "react";
import { ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { isSegmentUsed, segmentsStore } from "@/lib/model/store";
import { cn } from "@/lib/utils";
import type { Segment } from "@/lib/model/types";
import { BodRow } from "./BodRow";

export function SegmentRow({
  segment,
  fromRouteId,
  highlighted,
}: {
  segment: Segment;
  fromRouteId?: string;
  highlighted?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const { used, count } = isSegmentUsed(segment.id);
  const visibleCheckpoints = segment.checkpoints.filter((cp) => cp.kind !== "dnesni_doruceni");

  return (
    <div className={cn("border-t border-border first:border-t-0", highlighted && "bg-primary-soft/10")}>
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 text-muted-foreground hover:text-foreground"
          aria-label={expanded ? "Sbalit body" : "Rozbalit body"}
        >
          {expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
        </button>
        <Link
          to="/soulad-s-trasou/usek/$id"
          params={{ id: segment.id }}
          search={fromRouteId ? { from: fromRouteId } : undefined}
          className="flex-1 min-w-0 text-sm font-medium underline decoration-dotted underline-offset-2 hover:text-primary truncate"
        >
          {segment.name}
        </Link>
        <span className="shrink-0 text-xs text-muted-foreground">{visibleCheckpoints.length} bodů</span>
        <button
          disabled={used}
          onClick={() => segmentsStore.remove(segment.id)}
          title={used ? `Používá se v ${count} ${count === 1 ? "trase" : "trasách"}` : "Smazat úsek"}
          className={cn(
            "shrink-0 rounded p-1 transition-colors",
            used ? "text-muted-foreground/30 cursor-not-allowed" : "text-muted-foreground hover:text-red-500",
          )}
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
      {expanded && (
        <div className="pb-2">
          {visibleCheckpoints.length === 0 ? (
            <div className="pl-[26px] pr-2 text-xs text-muted-foreground italic">Zatím žádné body.</div>
          ) : (
            visibleCheckpoints.map((cp) => <BodRow key={cp.id} checkpoint={cp} />)
          )}
        </div>
      )}
    </div>
  );
}
