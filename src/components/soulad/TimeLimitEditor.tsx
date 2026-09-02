import type { TimeLimit } from "@/lib/model/types";
import { InputToken, SelectToken, Sentence } from "@/components/common/SentenceToken";

/**
 * Konečný limit — jak dlouho čekáme na opožděný záznam, než založíme věc k řešení.
 * Tracking chodí se zpožděním, proto se liší od Termínu, který se měří na vlastním čase záznamu.
 */
export function TimeLimitEditor({
  label,
  value,
  onChange,
}: {
  /** Volitelný nadpis — Dnešní doručení má takových limitů víc a potřebuje je rozlišit. */
  label?: string;
  value: TimeLimit;
  onChange: (next: TimeLimit) => void;
}) {
  const isOffset = value.mode !== "absolute";

  return (
    <div>
      {label && <div className="text-overline mb-1">{label}</div>}
      <Sentence>
      Čekat
      {isOffset ? (
        <>
          <InputToken
            min={0}
            ariaLabel="počet hodin po termínu"
            value={value.offsetHours ?? 0}
            onChange={(next) => onChange({ ...value, offsetHours: Math.max(0, Number(next) || 0) })}
          />
          <SelectToken
            ariaLabel="jak se konečný limit počítá"
            value="offset"
            label="hodin po termínu"
            onChange={(next) => onChange({ ...value, mode: next as "absolute" | "offset" })}
          >
            <option value="offset">hodin po termínu</option>
            <option value="absolute">do času</option>
          </SelectToken>
        </>
      ) : (
        <>
          <SelectToken
            ariaLabel="jak se konečný limit počítá"
            value="absolute"
            label="do času"
            onChange={(next) => onChange({ ...value, mode: next as "absolute" | "offset" })}
          >
            <option value="offset">hodin po termínu</option>
            <option value="absolute">do času</option>
          </SelectToken>
          <InputToken
            type="time"
            ariaLabel="konečný limit — pevný čas"
            value={value.absoluteTime ?? "09:00"}
            onChange={(next) => onChange({ ...value, absoluteTime: next })}
          />
        </>
      )}
        a pak založit věc k řešení
      </Sentence>
    </div>
  );
}
