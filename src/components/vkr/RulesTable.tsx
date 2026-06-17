import { useState } from "react";
import { Search, MoreHorizontal, Copy, Pencil, Archive, ArchiveRestore } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Rule } from "@/lib/vkr/types";
import { TRIGGER_LABELS } from "@/lib/vkr/fields";
import { rulesStore } from "@/lib/vkr/store";

type TriggerFilter = "all" | Rule["trigger"]["type"];
type PriorityFilter = "all" | "urgent" | "high" | "medium" | "low";

const TRIGGER_COLOR: Record<string, string> = {
  schedule: "bg-primary-soft text-primary",
  condition_met: "bg-info/15 text-info-foreground",
  manual: "bg-muted text-muted-foreground",
};

const PRIORITY_LABEL: Record<string, string> = { urgent: "Urgent", high: "High", medium: "Medium", low: "Low" };
const PRIORITY_COLOR: Record<string, string> = {
  urgent: "bg-destructive/15 text-destructive",
  high: "bg-warning/20 text-warning-foreground",
  medium: "bg-info/15 text-info-foreground",
  low: "bg-muted text-muted-foreground",
};

export function RulesTable({
  rules,
  title,
  subtitle,
  selectedId,
  onSelect,
  onEdit,
  onAddRule,
  isArchive,
}: {
  rules: Rule[];
  title: string;
  subtitle?: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onEdit: (r: Rule) => void;
  onAddRule: () => void;
  isArchive?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [triggerFilter, setTriggerFilter] = useState<TriggerFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");

  const visible = rules.filter((r) => {
    if (search) {
      const s = search.toLowerCase();
      if (!r.name.toLowerCase().includes(s) && !r.code.toLowerCase().includes(s)) return false;
    }
    if (triggerFilter !== "all" && r.trigger.type !== triggerFilter) return false;
    if (priorityFilter !== "all") {
      const topPrio = r.actions.find((a) => a.priority)?.priority;
      if (topPrio !== priorityFilter) return false;
    }
    return true;
  });

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col">
      <header className="border-b border-border bg-surface px-8 pb-4 pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-semibold tracking-tight">{title}</h2>
            {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {!isArchive && (
            <button
              onClick={onAddRule}
              className="shrink-0 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              + Nové pravidlo
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Hledat pravidlo, kód…"
              className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
            />
          </div>
          <SelectMini
            value={triggerFilter}
            onChange={(v) => setTriggerFilter(v as TriggerFilter)}
            options={[{ value: "all", label: "Všechny spouštěče" }, ...Object.entries(TRIGGER_LABELS).map(([v, l]) => ({ value: v, label: l }))]}
          />
          <SelectMini
            value={priorityFilter}
            onChange={(v) => setPriorityFilter(v as PriorityFilter)}
            options={[{ value: "all", label: "Všechny priority" }, ...Object.entries(PRIORITY_LABEL).map(([v, l]) => ({ value: v, label: l }))]}
          />
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-surface text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <tr className="border-b border-border">
              <th className="w-14 px-8 py-3 text-left">Kód</th>
              <th className="px-3 py-3 text-left">Pravidlo</th>
              <th className="w-44 px-3 py-3 text-left">Spouštěč</th>
              <th className="w-24 px-3 py-3 text-left">Priorita</th>
              <th className="w-28 px-3 py-3 text-right">Spuštěno 30 d</th>
              <th className="w-32 px-3 py-3 text-left">Naposledy</th>
              <th className="w-20 px-3 py-3 text-center">Aktivní</th>
              <th className="w-10 px-3 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => {
              const topPrio = r.actions.find((a) => a.priority)?.priority ?? "medium";
              const selected = selectedId === r.id;
              return (
                <tr
                  key={r.id}
                  onClick={() => onSelect(r.id)}
                  className={cn(
                    "cursor-pointer border-b border-border transition-colors",
                    selected ? "bg-primary-soft/60" : "hover:bg-muted/40",
                    !r.active && !isArchive && "opacity-60",
                  )}
                >
                  <td className="px-8 py-3 font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{r.code}</td>
                  <td className="px-3 py-3">
                    <div className="font-medium leading-snug">{r.name}</div>
                    {r.description && <div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{r.description}</div>}
                  </td>
                  <td className="px-3 py-3">
                    <span className={cn("inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold", TRIGGER_COLOR[r.trigger.type] ?? "bg-muted")}>
                      {TRIGGER_LABELS[r.trigger.type]}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className={cn("inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider", PRIORITY_COLOR[topPrio])}>
                      {PRIORITY_LABEL[topPrio]}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-sm tabular-nums">{r.runs30d}</td>
                  <td className="px-3 py-3 text-xs text-muted-foreground" suppressHydrationWarning>{r.lastRunAt ? formatRelative(r.lastRunAt) : "—"}</td>
                  <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                    {isArchive ? (
                      <button
                        onClick={() => rulesStore.unarchive(r.id)}
                        className="rounded-md border border-border bg-background px-2 py-1 text-[11px] font-medium hover:bg-muted"
                      >
                        Obnovit
                      </button>
                    ) : (
                      <Switch
                        checked={r.active}
                        onCheckedChange={() => rulesStore.toggle(r.id)}
                        className="data-[state=checked]:bg-primary"
                      />
                    )}
                  </td>
                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(r)}>
                          <Pencil className="mr-2 size-3.5" /> Upravit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => rulesStore.duplicate(r.id)}>
                          <Copy className="mr-2 size-3.5" /> Duplikovat
                        </DropdownMenuItem>
                        {isArchive ? (
                          <DropdownMenuItem onClick={() => rulesStore.unarchive(r.id)}>
                            <ArchiveRestore className="mr-2 size-3.5" /> Obnovit z archivu
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => rulesStore.archive(r.id)}>
                            <Archive className="mr-2 size-3.5" /> Archivovat
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {visible.length === 0 && (
          <div className="m-8 rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            Žádné pravidlo neodpovídá filtru.
          </div>
        )}
      </div>
    </section>
  );
}

function SelectMini({
  value, onChange, options,
}: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function formatRelative(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 60000;
  if (diff < 1) return "právě teď";
  if (diff < 60) return `před ${Math.round(diff)} min`;
  if (diff < 60 * 24) return `před ${Math.round(diff / 60)} h`;
  return `před ${Math.round(diff / 60 / 24)} d`;
}
