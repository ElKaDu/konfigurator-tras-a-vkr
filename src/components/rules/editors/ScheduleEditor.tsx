import { useState } from "react";
import { Plus, X, Info, Clock, Flag } from "lucide-react";
import { cn } from "@/lib/utils";

/** Položka Plánu spuštění — buď pevný denní čas, nebo offset od termínu milníku.
 *  Termín milníku = pole „Čas uvedený na záznamu" v Match podmínkách
 *  vybraného typu milníku na úseku, kterým zásilka prochází.
 *  Když má úsek víc časových podmínek, jako termín se bere „nejpozději do". */
export type ScheduleItem =
  | {
      id: string;
      kind: "time_of_day";
      time: string;               // "HH:MM"
      tzMode: "destination" | "fixed";
      tz?: string;                // jen pro tzMode="fixed"
    }
  | {
      id: string;
      kind: "relative_to_milestone_due";
      position: "before" | "at" | "after";
      amount: number;
      unit: "min" | "h";
    };

const TZ_OPTIONS = [
  "Europe/Prague",
  "Europe/Berlin",
  "Europe/London",
  "UTC",
  "America/New_York",
  "Asia/Shanghai",
];

function uid(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

export function ScheduleEditor({
  items,
  onChange,
  milestoneLabel,
}: {
  items: ScheduleItem[];
  onChange: (next: ScheduleItem[]) => void;
  /** Label vybraného typu milníku — jen pro popis (info hláška). */
  milestoneLabel?: string;
}) {
  const hasRelative = items.some((i) => i.kind === "relative_to_milestone_due");

  function add(kind: ScheduleItem["kind"]) {
    if (kind === "time_of_day") {
      onChange([
        ...items,
        { id: uid("t"), kind: "time_of_day", time: "08:00", tzMode: "destination" },
      ]);
    } else {
      onChange([
        ...items,
        { id: uid("r"), kind: "relative_to_milestone_due", position: "after", amount: 2, unit: "h" },
      ]);
    }
  }

  function update(id: string, patch: Partial<ScheduleItem>) {
    onChange(
      items.map((it) => (it.id === id ? ({ ...it, ...patch } as ScheduleItem) : it))
    );
  }

  function remove(id: string) {
    onChange(items.filter((it) => it.id !== id));
  }

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium">Plán spuštění</div>

      {items.length === 0 && (
        <div className="rounded-lg border border-dashed border-border px-3 py-2.5 text-xs text-muted-foreground italic">
          Zatím nejsou nastavené žádné časy spuštění.
        </div>
      )}

      <div className="space-y-1.5">
        {items.map((it) =>
          it.kind === "time_of_day" ? (
            <TimeOfDayRow
              key={it.id}
              item={it}
              onChange={(patch) => update(it.id, patch)}
              onRemove={() => remove(it.id)}
            />
          ) : (
            <RelativeRow
              key={it.id}
              item={it}
              onChange={(patch) => update(it.id, patch)}
              onRemove={() => remove(it.id)}
            />
          )
        )}
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          onClick={() => add("time_of_day")}
          className="flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
          <Clock className="size-3" /> V určitou hodinu
        </button>
        <button
          onClick={() => add("relative_to_milestone_due")}
          className="flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
          <Flag className="size-3" /> Podle termínu milníku
        </button>
      </div>

      {hasRelative && (
        <div className="mt-2 flex items-start gap-1.5 rounded-md bg-muted/50 px-3 py-2 text-[11px] text-muted-foreground leading-snug">
          <Info size={12} className="mt-0.5 shrink-0" />
          <span>
            Pravidlo se spustí jen na úsecích, kde má
            {milestoneLabel ? <> typ milníku „<strong>{milestoneLabel}</strong>"</> : <> tento typ milníku</>}
            {" "}vyplněný <em>Čas uvedený na záznamu</em>. Ostatní úseky se přeskočí. Pokud má úsek
            víc časových podmínek, jako termín se bere „nejpozději do".
          </span>
        </div>
      )}

      <div className="mt-2 rounded-lg bg-muted/30 border border-border px-3 py-2 text-[11px] text-muted-foreground leading-relaxed">
        Jakmile milník proběhne v pořádku, další časy už VkŘ neodešlou.
      </div>
    </div>
  );
}

function TimeOfDayRow({
  item,
  onChange,
  onRemove,
}: {
  item: Extract<ScheduleItem, { kind: "time_of_day" }>;
  onChange: (patch: Partial<Extract<ScheduleItem, { kind: "time_of_day" }>>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2 py-1.5">
      <Clock className="size-3.5 text-muted-foreground shrink-0" />
      <span className="text-xs text-muted-foreground shrink-0">v</span>
      <input
        type="time"
        value={item.time}
        onChange={(e) => onChange({ time: e.target.value })}
        className="rounded border border-border bg-background px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
      />
      <span className="text-xs text-muted-foreground shrink-0">·</span>
      <select
        value={item.tzMode}
        onChange={(e) => {
          const tzMode = e.target.value as "destination" | "fixed";
          onChange({ tzMode, tz: tzMode === "fixed" ? (item.tz ?? "Europe/Prague") : undefined });
        }}
        className="rounded border border-border bg-background px-1.5 py-0.5 text-xs focus:outline-none"
      >
        <option value="destination">TZ cílové země</option>
        <option value="fixed">Konkrétní TZ</option>
      </select>
      {item.tzMode === "fixed" && (
        <select
          value={item.tz ?? "Europe/Prague"}
          onChange={(e) => onChange({ tz: e.target.value })}
          className="rounded border border-border bg-background px-1.5 py-0.5 text-xs focus:outline-none"
        >
          {TZ_OPTIONS.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
      )}
      <button
        onClick={onRemove}
        className="ml-auto text-muted-foreground hover:text-foreground shrink-0"
        aria-label="Odstranit"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

function RelativeRow({
  item,
  onChange,
  onRemove,
}: {
  item: Extract<ScheduleItem, { kind: "relative_to_milestone_due" }>;
  onChange: (patch: Partial<Extract<ScheduleItem, { kind: "relative_to_milestone_due" }>>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2 py-1.5 flex-wrap">
      <Flag className="size-3.5 text-muted-foreground shrink-0" />
      {/* 3-position toggle */}
      <div className="inline-flex rounded-md border border-border overflow-hidden text-xs">
        {(["before", "at", "after"] as const).map((pos) => (
          <button
            key={pos}
            onClick={() => onChange({ position: pos })}
            className={cn(
              "px-2 py-0.5 transition-colors",
              item.position === pos
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-muted"
            )}
          >
            {pos === "before" ? "před" : pos === "at" ? "v termínu" : "po"}
          </button>
        ))}
      </div>

      {item.position !== "at" && (
        <>
          <input
            type="number"
            min={1}
            value={item.amount}
            onChange={(e) => onChange({ amount: Math.max(1, Number(e.target.value) || 1) })}
            className="w-14 rounded border border-border bg-background px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
          <select
            value={item.unit}
            onChange={(e) => onChange({ unit: e.target.value as "min" | "h" })}
            className="rounded border border-border bg-background px-1.5 py-0.5 text-xs focus:outline-none"
          >
            <option value="min">min</option>
            <option value="h">h</option>
          </select>
        </>
      )}

      <span className="text-xs text-muted-foreground">
        {item.position === "at"
          ? "v termínu milníku"
          : item.position === "before"
          ? "před termínem milníku"
          : "po termínu milníku"}
      </span>

      <button
        onClick={onRemove}
        className="ml-auto text-muted-foreground hover:text-foreground shrink-0"
        aria-label="Odstranit"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
