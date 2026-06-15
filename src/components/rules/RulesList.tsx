import { useState } from "react";
import { Search } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { AppHeader } from "@/components/AppHeader";
import { AreaBadge } from "@/components/common/AreaBadge";
import { AREAS, CIRCLED } from "@/lib/model/areas";
import { useRules } from "@/lib/model/store";
import type { Area } from "@/lib/model/types";

// Sidebar area list sorted by spec-defined canonical number (AREAS.num).
const SORTED_AREAS = [...AREAS].sort((a, b) => a.num - b.num);

type Selection =
  | { kind: "all" }
  | { kind: "active" }
  | { kind: "archived" }
  | { kind: "area"; area: Area };

function SidebarItem({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-between rounded-lg px-2.5 py-2 text-sm w-full text-left",
        active
          ? "bg-primary-soft text-primary font-medium"
          : "text-foreground hover:bg-muted/60",
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          "rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
          active
            ? "bg-primary/15 text-primary"
            : "bg-muted text-muted-foreground",
        )}
      >
        {count}
      </span>
    </button>
  );
}

function triggerLabel(kind: string): string {
  if (kind === "condition_met") return "Podmínka";
  if (kind === "schedule") return "Časovač";
  return "Manuálně";
}

function priorityLabel(p: string): string {
  return p.toUpperCase();
}

function isPriorityHigh(p: string): boolean {
  return p === "high" || p === "urgent";
}

export function RulesList() {
  const rules = useRules();
  const [selection, setSelection] = useState<Selection>({ kind: "all" });

  const allCount    = rules.length;
  const activeCount = rules.filter((r) => r.active).length;

  const visible = (() => {
    switch (selection.kind) {
      case "all":      return rules;
      case "active":   return rules.filter((r) => r.active);
      case "archived": return [];
      case "area":     return rules.filter((r) => r.area === selection.area);
    }
  })();

  const { title, subtitle } = (() => {
    if (selection.kind === "active")   return { title: "Pouze aktivní", subtitle: "Pravidla aktuálně vyhodnocovaná runtime evaluátorem." };
    if (selection.kind === "archived") return { title: "Archiv",        subtitle: "Archivovaná pravidla. Momentálně žádné záznamy." };
    if (selection.kind === "area") {
      const meta = AREAS.find((a) => a.id === selection.area);
      return { title: meta?.label ?? selection.area, subtitle: meta?.description };
    }
    return { title: "Všechna pravidla", subtitle: "Kompletní katalog pravidel napříč oblastmi." };
  })();

  return (
    <div className="flex h-screen w-screen flex-col bg-background text-foreground">
      <AppHeader
        current="rules"
        extras={
          <Link
            to="/rules/new"
            search={{ area: selection.kind === "area" ? selection.area : undefined }}
            className="bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-primary/90"
          >
            + Nové pravidlo
          </Link>
        }
      />

      <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
        <aside className="w-[260px] shrink-0 border-r border-border bg-surface p-2 overflow-y-auto">
          {/* Group: Pravidla */}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1 mt-2">
            Pravidla
          </div>

          <SidebarItem
            label="Všechna pravidla"
            count={allCount}
            active={selection.kind === "all"}
            onClick={() => setSelection({ kind: "all" })}
          />
          <SidebarItem
            label="Pouze aktivní"
            count={activeCount}
            active={selection.kind === "active"}
            onClick={() => setSelection({ kind: "active" })}
          />
          <SidebarItem
            label="Archiv"
            count={0}
            active={selection.kind === "archived"}
            onClick={() => setSelection({ kind: "archived" })}
          />

          {/* Group: Oblasti */}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1 mt-4">
            Oblasti
          </div>

          {SORTED_AREAS.map((meta) => {
            const { id } = meta;
            const circled = CIRCLED[meta.num - 1];
            const count   = rules.filter((r) => r.area === id).length;
            const isActive = selection.kind === "area" && selection.area === id;
            const disabled = !meta.enabled;

            return (
              <button
                key={id}
                disabled={disabled}
                onClick={disabled ? undefined : () => setSelection({ kind: "area", area: id })}
                className={cn(
                  "flex items-center justify-between rounded-lg px-2.5 py-2 text-sm w-full text-left",
                  isActive
                    ? "bg-primary-soft text-primary font-medium"
                    : "text-foreground hover:bg-muted/60",
                  disabled && "opacity-60 cursor-default",
                )}
              >
                <span>
                  {circled} {meta.label}
                </span>
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                    isActive
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {disabled ? "brzy" : count}
                </span>
              </button>
            );
          })}
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 p-6 overflow-auto">
          <div className="mb-4">
            <h1 className="text-lg font-semibold">{title}</h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>

          {/* Search box (visual only) */}
          <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground mb-4">
            <Search size={15} className="shrink-0" />
            <span>Hledat pravidlo, kód…</span>
          </div>

          {/* Rules list */}
          <div className="flex flex-col gap-2">
            {visible.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Žádná pravidla
              </p>
            ) : (
              visible.map((rule) => (
                <div
                  key={rule.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border border-border px-3 py-2.5",
                    !rule.active && "opacity-60",
                  )}
                >
                  {/* Code */}
                  <span className="font-mono text-xs text-muted-foreground w-9 shrink-0">
                    {rule.code}
                  </span>

                  {/* Name + chips */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{rule.name}</div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <AreaBadge area={rule.area} />
                      {/* Trigger chip */}
                      <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                        {triggerLabel(rule.trigger.kind)}
                      </span>
                      {/* Priority chip */}
                      <span
                        className={cn(
                          "rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold",
                          isPriorityHigh(rule.priority)
                            ? "text-destructive border-destructive/30"
                            : "text-muted-foreground",
                        )}
                      >
                        {priorityLabel(rule.priority)}
                      </span>
                    </div>
                  </div>

                  {/* Status dot */}
                  <span
                    className={cn(
                      "size-2 rounded-full shrink-0",
                      rule.active ? "bg-emerald-500" : "bg-border",
                    )}
                  />
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
