import { useState } from "react";
import { Search, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { AppHeader } from "@/components/AppHeader";
import { DataMenu } from "@/components/common/DataMenu";
import { AreaBadge } from "@/components/common/AreaBadge";
import { useRules, rulesStore } from "@/lib/model/store";
import { triggerLabel, priorityLabel, isPriorityHigh, resolveRulePriority } from "@/lib/model/ruleDisplay";
import { RuleDetailSidebar } from "./RuleDetailSidebar";
import type { Priority, Rule } from "@/lib/model/types";

type Selection =
  | { kind: "all" }
  | { kind: "priority"; priority: Priority };

const PRIORITIES: Priority[] = ["low", "medium", "high", "urgent"];

function PriorityChip({
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
        "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary-soft text-primary"
          : "border-border text-muted-foreground hover:bg-muted/60",
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

export function RulesList() {
  const rules = useRules();
  const [selection, setSelection] = useState<Selection>({ kind: "all" });
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null);

  const allCount = rules.length;
  const priorityCounts: Record<Priority, number> = {
    low: 0, medium: 0, high: 0, urgent: 0,
  };
  rules.forEach((r) => { priorityCounts[resolveRulePriority(r)]++; });

  const visible = selection.kind === "all"
    ? rules
    : rules.filter((r) => resolveRulePriority(r) === selection.priority);

  const { title, subtitle } = selection.kind === "priority"
    ? { title: `Priorita: ${priorityLabel(selection.priority)}`, subtitle: `Pravidla s touto prioritou (odvozenou ze Závažnosti).` }
    : { title: "Všechna pravidla", subtitle: "Kompletní katalog pravidel napříč oblastmi." };

  return (
    <div className="flex h-screen w-screen flex-col bg-background text-foreground">
      <AppHeader
        current="rules"
        extras={
          <div className="flex items-center gap-2">
            <Link
              to="/rules/new"
              className="bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-primary/90"
            >
              + Nové pravidlo
            </Link>
            <DataMenu />
          </div>
        }
      />

      <div className="flex min-h-0 flex-1">
        {/* Main content */}
        <main className={cn("flex-1 min-w-0 p-6 overflow-auto", selectedRule && "mr-[460px]")}>
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

          {/* Priority filter chips */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <PriorityChip
              label="Všechny"
              count={allCount}
              active={selection.kind === "all"}
              onClick={() => setSelection({ kind: "all" })}
            />
            {PRIORITIES.map((p) => (
              <PriorityChip
                key={p}
                label={priorityLabel(p)}
                count={priorityCounts[p]}
                active={selection.kind === "priority" && selection.priority === p}
                onClick={() => setSelection({ kind: "priority", priority: p })}
              />
            ))}
          </div>

          {/* Rules list */}
          <div className="flex flex-col gap-2">
            {visible.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Žádná pravidla
              </p>
            ) : (
              visible.map((rule, vIdx) => {
                const canReorder = selection.kind === "all";
                const moveRule = (dir: -1 | 1) => {
                  const otherVIdx = vIdx + dir;
                  if (otherVIdx < 0 || otherVIdx >= visible.length) return;
                  const otherId = visible[otherVIdx].id;
                  const i = rules.findIndex((r) => r.id === rule.id);
                  const j = rules.findIndex((r) => r.id === otherId);
                  if (i < 0 || j < 0) return;
                  const next = [...rules];
                  [next[i], next[j]] = [next[j], next[i]];
                  rulesStore.replaceAll(next);
                };
                const rulePriority = resolveRulePriority(rule);
                return (
                <div
                  key={rule.id}
                  onClick={() => setSelectedRule(selectedRule?.id === rule.id ? null : rule)}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors hover:bg-muted/40",
                    selectedRule?.id === rule.id ? "border-primary bg-primary-soft/20" : "border-border",
                  )}
                >
                  {canReorder && (
                    <div className="flex flex-col shrink-0">
                      <button
                        disabled={vIdx === 0}
                        onClick={(e) => { e.stopPropagation(); moveRule(-1); }}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Posunout nahoru"
                      >
                        <ChevronUp className="size-3.5" />
                      </button>
                      <button
                        disabled={vIdx === visible.length - 1}
                        onClick={(e) => { e.stopPropagation(); moveRule(1); }}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Posunout dolů"
                      >
                        <ChevronDown className="size-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Name + chips */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{rule.name}</div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <AreaBadge area={rule.area} />
                      <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                        {triggerLabel(rule.trigger.kind)}
                      </span>
                      <span
                        className={cn(
                          "rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold",
                          isPriorityHigh(rulePriority)
                            ? "text-destructive border-destructive/30"
                            : "text-muted-foreground",
                        )}
                      >
                        {priorityLabel(rulePriority)}
                      </span>
                    </div>
                  </div>

                  {/* Trash */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      rulesStore.remove(rule.id);
                      if (selectedRule?.id === rule.id) setSelectedRule(null);
                    }}
                    className="opacity-0 group-hover:opacity-100 rounded p-1 text-muted-foreground hover:text-red-500 transition-all shrink-0"
                    title="Smazat pravidlo"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
                );
              })
            )}
          </div>
        </main>
      </div>

      {/* Rule detail sidebar */}
      {selectedRule && (
        <RuleDetailSidebar
          rule={selectedRule}
          onClose={() => setSelectedRule(null)}
        />
      )}
    </div>
  );
}
