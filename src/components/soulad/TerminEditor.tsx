import type { CheckpointCorrectness, Segment } from "@/lib/model/types";
import { AnchorPicker } from "./AnchorPicker";
import { InputToken, SelectToken, Sentence } from "@/components/common/SentenceToken";

const TIMEZONE_OPTIONS: { value: string; label: string }[] = [
  { value: "local", label: "místního času" },
  { value: "Europe/Prague", label: "Europe/Prague" },
  { value: "Europe/Berlin", label: "Europe/Berlin" },
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "America/New_York" },
];

function dnySlovo(n: number): string {
  if (n === 1) return "den";
  if (n >= 2 && n <= 4) return "dny";
  return "dní";
}

/**
 * Volby prvního tokenu věty. „v den" a posuny nastavují pevný den (mode "fixed"),
 * „za" přepíná na odstup (mode "offset"). Režim je tak součástí věty, ne přepínač nad ní.
 */
const DAY_OPTIONS: { value: string; label: string }[] = [{ value: "fixed|0|calendar|after", label: "v den" }];
for (const dir of ["after", "before"] as const) {
  for (const mode of ["calendar", "business"] as const) {
    for (const n of [1, 2, 3, 4, 5]) {
      DAY_OPTIONS.push({
        value: `fixed|${n}|${mode}|${dir}`,
        label: `${n} ${mode === "business" ? "prac. " : ""}${dnySlovo(n)} ${dir === "after" ? "po" : "před"}`,
      });
    }
  }
}

const OFFSET_UNITS: { value: string; label: string }[] = [
  { value: "h", label: "hodin" },
  { value: "d", label: "dní" },
  { value: "bd", label: "prac. dní" },
];

export function TerminEditor({
  segment,
  currentCheckpointId,
  value,
  onChange,
}: {
  segment: Segment;
  currentCheckpointId?: string;
  value: CheckpointCorrectness;
  onChange: (next: CheckpointCorrectness) => void;
}) {
  const isFixed = value.mode !== "offset";
  const anchor = {
    anchorKind: value.anchorKind,
    anchorLabel: value.anchorLabel,
    anchorCheckpointTypeId: value.anchorCheckpointTypeId,
  };

  const fixedDayOffset = value.fixedDayOffset ?? 0;
  const fixedDayMode = value.fixedDayMode ?? "calendar";
  const fixedDayDirection = value.fixedDayDirection ?? "after";
  const fixedTime = value.fixedTime ?? "08:00";
  const fixedTz = value.fixedTz ?? "local";
  const unit = value.unit ?? "h";
  const direction = value.direction ?? "after";
  const offsetValue = value.value ?? 0;

  const dayValue = isFixed ? `fixed|${fixedDayOffset}|${fixedDayMode}|${fixedDayDirection}` : "offset";
  const dayLabel = isFixed
    ? DAY_OPTIONS.find((o) => o.value === dayValue)?.label ?? "v den"
    : "za";

  function pickDay(raw: string) {
    if (raw === "offset") {
      onChange({ ...value, mode: "offset" });
      return;
    }
    const [, n, mode, dir] = raw.split("|");
    onChange({
      ...value,
      mode: "fixed",
      fixedDayOffset: Number(n),
      fixedDayMode: mode as "calendar" | "business",
      fixedDayDirection: dir as "before" | "after",
    });
  }

  return (
    <Sentence>
      Nejpozději
      <SelectToken ariaLabel="jak se termín počítá" value={dayValue} label={dayLabel} onChange={pickDay}>
        <optgroup label="V daný den">
          {DAY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </optgroup>
        <optgroup label="S odstupem">
          <option value="offset">za</option>
        </optgroup>
      </SelectToken>

      {isFixed ? (
        <>
          události
          <AnchorPicker
            segment={segment}
            currentCheckpointId={currentCheckpointId}
            value={anchor}
            onChange={(next) => onChange({ ...value, ...next })}
          />
          v
          <InputToken
            type="time"
            ariaLabel="čas termínu"
            value={fixedTime}
            onChange={(next) => onChange({ ...value, fixedTime: next })}
          />
          <SelectToken
            ariaLabel="časové pásmo"
            value={fixedTz}
            label={TIMEZONE_OPTIONS.find((t) => t.value === fixedTz)?.label ?? fixedTz}
            onChange={(next) => onChange({ ...value, fixedTz: next })}
          >
            {TIMEZONE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </SelectToken>
        </>
      ) : (
        <>
          <InputToken
            min={0}
            ariaLabel="velikost odstupu"
            value={offsetValue}
            onChange={(next) => onChange({ ...value, value: Math.max(0, Number(next) || 0) })}
          />
          <SelectToken
            ariaLabel="jednotka odstupu"
            value={unit}
            label={OFFSET_UNITS.find((u) => u.value === unit)?.label ?? unit}
            onChange={(next) => onChange({ ...value, unit: next as "h" | "d" | "bd" })}
          >
            {OFFSET_UNITS.map((u) => (
              <option key={u.value} value={u.value}>{u.label}</option>
            ))}
          </SelectToken>
          <SelectToken
            ariaLabel="směr odstupu"
            value={direction}
            label={direction === "after" ? "po" : "před"}
            onChange={(next) => onChange({ ...value, direction: next as "before" | "after" })}
          >
            <option value="after">po</option>
            <option value="before">před</option>
          </SelectToken>
          události
          <AnchorPicker
            segment={segment}
            currentCheckpointId={currentCheckpointId}
            value={anchor}
            onChange={(next) => onChange({ ...value, ...next })}
          />
        </>
      )}
    </Sentence>
  );
}
