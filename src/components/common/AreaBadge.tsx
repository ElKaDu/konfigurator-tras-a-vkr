import { cn } from "@/lib/utils";
import { areaById } from "@/lib/model/areas";
import { resolveAreaIcon } from "./areaIcons";
import type { Area } from "@/lib/model/types";

function colorFor(area: Area): string {
  if (area === "tracking_records") {
    return "bg-teal-500/15 text-teal-700 dark:text-teal-300";
  }
  if (area === "route_compliance") {
    return "bg-primary-soft text-primary";
  }
  return "bg-muted text-muted-foreground";
}

export function AreaBadge({ area }: { area: Area }) {
  const meta = areaById(area);
  const Icon = resolveAreaIcon(meta.icon);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
        colorFor(area),
      )}
    >
      <Icon size={13} />
      {meta.label}
    </span>
  );
}
