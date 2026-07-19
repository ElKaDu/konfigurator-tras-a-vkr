import type { TimeLimit } from "@/lib/model/types";

export function TimeLimitEditor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: TimeLimit;
  onChange: (next: TimeLimit) => void;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap text-xs">
      <span className="text-muted-foreground w-40 shrink-0">{label}</span>
      <select
        value={value.mode}
        onChange={(e) => onChange({ ...value, mode: e.target.value as "absolute" | "offset" })}
        className="rounded border border-border bg-background px-2 py-1"
      >
        <option value="offset">posun od Termínu</option>
        <option value="absolute">pevný čas</option>
      </select>
      {value.mode === "absolute" ? (
        <input
          type="time"
          value={value.absoluteTime ?? "09:00"}
          onChange={(e) => onChange({ ...value, absoluteTime: e.target.value })}
          className="rounded border border-border bg-background px-2 py-1"
        />
      ) : (
        <>
          <input
            type="number"
            min={0}
            value={value.offsetHours ?? 0}
            onChange={(e) => onChange({ ...value, offsetHours: Math.max(0, Number(e.target.value) || 0) })}
            className="w-16 rounded border border-border bg-background px-2 py-1"
          />
          <span className="text-muted-foreground">h po Termínu</span>
        </>
      )}
    </div>
  );
}
