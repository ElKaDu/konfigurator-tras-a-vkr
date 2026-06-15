import {
  TextSearch,
  Route,
  ClipboardCheck,
  PackageX,
  Scale,
  Circle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { areaById } from "@/lib/model/areas";
import type { Area } from "@/lib/model/types";

// Map from icon strings in areas.ts to available lucide-react icons in this version.
// ListSearch → TextSearch, PackageOff → PackageX (closest equivalents available).
const ICONS: Record<string, LucideIcon> = {
  ListSearch: TextSearch,
  Route,
  ClipboardCheck,
  PackageOff: PackageX,
  Scale,
};

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
  const Icon = ICONS[meta.icon] ?? Circle;

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
