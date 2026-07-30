import { useState } from "react";

const OTHER = "__other__";

export function TemplatedField({
  label,
  options,
  value,
  onChange,
  checkboxLabel,
  checked,
  onCheckedChange,
}: {
  label: string;
  options: string[];
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  checkboxLabel: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  const startsAsFreeText = options.length === 0 || (!!value && !options.includes(value));
  const [freeText, setFreeText] = useState(startsAsFreeText);

  function handleSelectChange(next: string) {
    if (next === OTHER) {
      setFreeText(true);
      onChange(undefined);
      return;
    }
    onChange(next || undefined);
  }

  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
      <span className="w-14 shrink-0 pt-1.5 text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground sm:pt-0">
        {label}
      </span>
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {options.length > 0 && !freeText ? (
          <select
            value={value ?? ""}
            onChange={(e) => handleSelectChange(e.target.value)}
            aria-label={label}
            className="min-w-0 flex-1 rounded-md border border-input bg-transparent px-2.5 py-1.5 text-[12.5px]"
          >
            <option value="">— nevybráno —</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
            <option value={OTHER}>Jiné…</option>
          </select>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <input
              type="text"
              value={value ?? ""}
              onChange={(e) => onChange(e.target.value || undefined)}
              placeholder="Popiš vlastními slovy…"
              aria-label={label}
              className="min-w-0 flex-1 rounded-md border border-input bg-transparent px-2.5 py-1.5 text-[12.5px]"
            />
            {options.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setFreeText(false);
                }}
                className="shrink-0 text-[10.5px] text-muted-foreground hover:text-foreground"
              >
                zpět na výběr
              </button>
            )}
          </div>
        )}
        <label className="flex shrink-0 items-center gap-1.5 text-[11px] text-secondary-foreground">
          <input type="checkbox" checked={checked} onChange={(e) => onCheckedChange(e.target.checked)} />
          {checkboxLabel}
        </label>
      </div>
    </div>
  );
}
