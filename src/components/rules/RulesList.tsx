import { useState } from "react";
import { Search, Trash2, ChevronUp, ChevronDown, Plus } from "@/components/ui/icon";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/AppShell";
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
        "flex h-8 items-center gap-1.5 rounded-full border px-3.5 text-[13px] leading-5 transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-input text-muted-foreground hover:border-primary hover:text-primary",
      )}
    >
      <span>{label}</span>
      <span className="text-[12px] tabular-nums opacity-80">{count}</span>
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
    <AppShell
      current="rules"
      title="Pravidla pro tracking"
      actions={
        <div className="flex items-center gap-2">
          <Link
            to="/rules/new"
            search={{ situationId: undefined, severityId: undefined }}
            className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-[15px] font-medium text-primary-foreground elevation-1 transition-colors hover:bg-[#7E4EE6]"
          >
            <Plus size={18} />
            Nové pravidlo
          </Link>
          <DataMenu />
        </div>
      }
    >
      <div className={cn("transition-all", selectedRule && "mr-[460px]")}>
        <div className="rounded-md bg-card elevation-2">
          {/* Hlavička karty */}
          <div className="px-6 pt-5">
            <h2 className="text-h5">{title}</h2>
            {subtitle && <p className="mt-1 text-[13px] leading-[18px] text-muted-foreground">{subtitle}</p>}
          </div>

          <div className="px-6 py-5">
            {/* Hledání — zatím jen vizuál */}
            <div className="mb-4 flex h-[42px] items-center gap-2.5 rounded-md border border-input px-3.5 text-sm text-muted-foreground">
              <Search size={18} className="shrink-0" />
              <span>Hledat pravidlo, kód…</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
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
          </div>

          {/* Hlavička tabulky — Materio table-header-color */}
          <div className="flex gap-3.5 bg-muted px-6 py-2.5 text-[12px] uppercase tracking-[0.6px] text-muted-foreground">
            <span className="w-[18px]" />
            <span className="flex-1">Pravidlo</span>
            <span>Akce</span>
          </div>

          {visible.length === 0 ? (
            <p className="border-t border-border py-10 text-center text-sm text-muted-foreground">
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
                    "group flex cursor-pointer items-center gap-3.5 border-t border-border px-6 py-3 transition-colors",
                    selectedRule?.id === rule.id ? "bg-primary-soft" : "hover:bg-muted/60",
                  )}
                >
                  <div className="flex w-[18px] shrink-0 flex-col">
                    {canReorder && (
                      <>
                        <button
                          disabled={vIdx === 0}
                          onClick={(e) => { e.stopPropagation(); moveRule(-1); }}
                          className="grid h-[13px] place-items-center text-muted-foreground hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
                          title="Posunout nahoru"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          disabled={vIdx === visible.length - 1}
                          onClick={(e) => { e.stopPropagation(); moveRule(1); }}
                          className="grid h-[13px] place-items-center text-muted-foreground hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
                          title="Posunout dolů"
                        >
                          <ChevronDown size={14} />
                        </button>
                      </>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-medium leading-[22px]">{rule.name}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <AreaBadge area={rule.area} />
                      <span className="inline-flex h-6 items-center rounded-full border border-input px-2.5 text-[13px] leading-5 text-muted-foreground">
                        {triggerLabel(rule.trigger.kind)}
                      </span>
                      <span
                        className={cn(
                          "inline-flex h-6 items-center rounded-full px-2.5 text-[13px] font-medium leading-5",
                          isPriorityHigh(rulePriority)
                            ? "bg-destructive/12 text-destructive"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {priorityLabel(rulePriority)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      rulesStore.remove(rule.id);
                      if (selectedRule?.id === rule.id) setSelectedRule(null);
                    }}
                    className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-all hover:text-destructive group-hover:opacity-100"
                    title="Smazat pravidlo"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {selectedRule && (
        <RuleDetailSidebar rule={selectedRule} onClose={() => setSelectedRule(null)} />
      )}
    </AppShell>
  );
}
