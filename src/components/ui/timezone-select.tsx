import type { TimezoneSpec } from "@/lib/routes/types";
import { cn } from "@/lib/utils";

/**
 * Sjednocený dropdown pro výběr časové zóny.
 *
 * Speciální hodnoty (vždy nahoře):
 *  - `current_location`     — TZ aktuálního místa zásilky (poslední tracking event)
 *  - `UTC`                  — koordinovaný světový čas
 *  - `destination_country`  — TZ cílové země zásilky
 *  - `operator`             — TZ operátora (volitelné, jen pro Plán spuštění)
 * Pak standardní seznam IANA zón.
 */

const IANA_ZONES: Array<{ value: string; label: string }> = [
  { value: "Europe/Prague", label: "Europe/Prague" },
  { value: "Europe/London", label: "Europe/London" },
  { value: "Europe/Berlin", label: "Europe/Berlin" },
  { value: "America/New_York", label: "America/New_York" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles" },
  { value: "Asia/Dubai", label: "Asia/Dubai" },
  { value: "Asia/Jerusalem", label: "Asia/Jerusalem" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo" },
  { value: "Australia/Sydney", label: "Australia/Sydney" },
];

const TOOLTIP_CURRENT_LOCATION =
  "Časová zóna je odvozena z lokace poslední tracking události zásilky v okamžiku vyhodnocení pravidla.";

export interface TimezoneSelectProps {
  value: TimezoneSpec | undefined;
  onChange: (v: TimezoneSpec) => void;
  /** Přidá speciální volbu „TZ operátora" (Europe/Prague). Pro Plán spuštění. */
  includeOperator?: boolean;
  className?: string;
}

export function TimezoneSelect({ value, onChange, includeOperator, className }: TimezoneSelectProps) {
  return (
    <select
      value={value ?? "destination_country"}
      onChange={(e) => onChange(e.target.value as TimezoneSpec)}
      className={cn("rounded border border-border bg-background px-2 py-0.5 text-xs", className)}
    >
      <optgroup label="Speciální">
        <option value="current_location" title={TOOLTIP_CURRENT_LOCATION}>
          Čas aktuálního místa zásilky
        </option>
        <option value="UTC">UTC</option>
        <option value="destination_country">Čas cílové země zásilky</option>
        {includeOperator && <option value="operator">TZ operátora (Europe/Prague)</option>}
      </optgroup>
      <optgroup label="Zóny">
        {IANA_ZONES.map((z) => (
          <option key={z.value} value={z.value}>
            {z.label}
          </option>
        ))}
      </optgroup>
    </select>
  );
}
