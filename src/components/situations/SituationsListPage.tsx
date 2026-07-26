import { useState } from "react";
import { Plus, Trash2, ChevronRight, ChevronDown, Search } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { AreaBadge } from "@/components/common/AreaBadge";
import { useSituations, situationsStore, useRules } from "@/lib/model/store";
import { triggerLabel, priorityLabel, isPriorityHigh, resolveRulePriority } from "@/lib/model/ruleDisplay";
import { RuleDetailSidebar } from "@/components/rules/RuleDetailSidebar";
import { cn } from "@/lib/utils";
import type { Rule, Situation } from "@/lib/model/types";

export function SituationsListPage() {
  const situations = useSituations();
  const rules = useRules();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null);

  function createSituation() {
    const id = "sit_" + Date.now();
    situationsStore.upsert({
      id,
      code: "SIT-" + Math.floor(Math.random() * 9000 + 1000),
      name: "Nová situace",
      area: "tracking_records",
      severities: [],
    });
    navigate({ to: "/situace/$id", params: { id } });
  }

  function totalUsage(situationId: string): number {
    return rules.filter((r) => r.situationId === situationId).length;
  }

  function rulesForSeverity(severityId: string): Rule[] {
    return rules.filter((r) => r.severityId === severityId);
  }

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function matchesQuery(situation: Situation): boolean {
    const q = query.trim().toLocaleLowerCase("cs-CZ");
    if (!q) return true;
    if (situation.name.toLocaleLowerCase("cs-CZ").includes(q)) return true;
    return situation.severities.some((s) => s.name.toLocaleLowerCase("cs-CZ").includes(q));
  }

  const visible = situations.filter(matchesQuery);

  return (
    <div className="flex h-screen w-screen flex-col bg-background text-foreground">
      <AppHeader current="situace" />

      <div className={cn("flex-1 overflow-y-auto", selectedRule && "mr-[460px]")}>
        <div className="mx-auto max-w-3xl p-6">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-lg font-semibold">Situace a závažnosti</h1>
            <button
              onClick={createSituation}
              className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="size-3.5" /> Nová situace
            </button>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Šablony pro věci k řešení — každá situace má stupně závažnosti s výchozím názvem, popisem, prioritou a akcemi.
          </p>

          <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground mb-4">
            <Search size={15} className="shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Hledat situaci, závažnost…"
              className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex flex-col gap-2">
            {visible.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                {situations.length === 0 ? "Zatím žádné situace." : "Žádná situace neodpovídá hledání."}
              </p>
            ) : (
              visible.map((s) => {
                const usage = totalUsage(s.id);
                const isOpen = expanded.has(s.id);
                return (
                  <div key={s.id} className="rounded-lg border border-border overflow-hidden">
                    <div
                      onClick={() => navigate({ to: "/situace/$id", params: { id: s.id } })}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors cursor-pointer"
                    >
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleExpanded(s.id); }}
                        className="shrink-0 text-muted-foreground hover:text-foreground"
                        title={isOpen ? "Skrýt závažnosti a pravidla" : "Zobrazit závažnosti a pravidla"}
                      >
                        {isOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{s.name}</div>
                        {s.description && <div className="text-xs text-muted-foreground mt-0.5">{s.description}</div>}
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {s.severities.length} {s.severities.length === 1 ? "závažnost" : "závažnosti"}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {usage} {usage === 1 ? "pravidlo" : usage < 5 ? "pravidla" : "pravidel"}
                      </span>
                      <button
                        disabled={usage > 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          situationsStore.remove(s.id);
                        }}
                        title={usage > 0 ? `Používá se v ${usage} pravidlech` : "Smazat situaci"}
                        className={cn(
                          "shrink-0 rounded p-1.5 text-muted-foreground transition-colors",
                          usage > 0 ? "opacity-30 cursor-not-allowed" : "hover:text-red-500"
                        )}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>

                    {isOpen && (
                      <div className="border-t border-border bg-muted/10 px-4 py-3 space-y-3">
                        {s.severities.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic">Zatím žádné závažnosti.</p>
                        ) : (
                          s.severities.map((sev) => {
                            const sevRules = rulesForSeverity(sev.id);
                            return (
                              <div key={sev.id} className="border-l-2 border-border pl-3">
                                <div className="flex items-center gap-2 py-1">
                                  <span className="text-xs font-medium">{sev.name}</span>
                                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                    {priorityLabel(sev.priority)}
                                  </span>
                                  <span className="ml-auto text-[11px] text-muted-foreground">
                                    {sevRules.length} {sevRules.length === 1 ? "pravidlo" : sevRules.length < 5 ? "pravidla" : "pravidel"}
                                  </span>
                                </div>
                                {sevRules.map((rule) => (
                                  <div
                                    key={rule.id}
                                    onClick={() => setSelectedRule(rule)}
                                    className="mt-1 flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2 hover:bg-muted/40 transition-colors cursor-pointer"
                                  >
                                    <div className="flex-1 min-w-0">
                                      <div className="text-xs font-medium truncate">{rule.name}</div>
                                      <div className="flex gap-1.5 mt-1">
                                        <AreaBadge area={rule.area} />
                                        <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                          {triggerLabel(rule.trigger.kind)}
                                        </span>
                                        <span
                                          className={cn(
                                            "rounded-full border border-border px-1.5 py-0.5 text-[10px] font-semibold",
                                            isPriorityHigh(resolveRulePriority(rule)) ? "text-destructive border-destructive/30" : "text-muted-foreground"
                                          )}
                                        >
                                          {priorityLabel(resolveRulePriority(rule))}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {selectedRule && (
        <RuleDetailSidebar
          rule={selectedRule}
          onClose={() => setSelectedRule(null)}
        />
      )}
    </div>
  );
}
