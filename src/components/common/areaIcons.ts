import {
  TextSearch,
  Route,
  ClipboardCheck,
  PackageX,
  Scale,
  Circle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Map from icon strings in areas.ts to available lucide-react icons in this version.
// ListSearch → TextSearch, PackageOff → PackageX (closest equivalents available).
export const AREA_ICONS: Record<string, LucideIcon> = {
  ListSearch: TextSearch,
  Route,
  ClipboardCheck,
  PackageOff: PackageX,
  Scale,
};

export function resolveAreaIcon(name: string): LucideIcon {
  return AREA_ICONS[name] ?? Circle;
}
