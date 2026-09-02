import { useState } from "react";
import { Plus, Trash2, ChevronRight, ChevronDown, Search, Pencil } from "@/components/ui/icon";
import { Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
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
    <AppShell
      current="situace"
      title="Situace a závažnosti"
      actions={
        <button
          onClick={createSituation}
          className="flex items-center gap-1.5 rounded-md border border-primary px-4 py-2 text-[15px] font-medium text-primary transition-colors hover:bg-primary/[0.06]"
        >
          <Plus size={18} /> Nová situace
        </button>
      }
    >
      {/* Šířka seznamu je stálá — panel s detailem se otevírá vedle něj. */}
      <div className="flex items-start gap-5">
        <div className="w-full max-w-[1160px] shrink-0 rounded-md bg-card elevation-2">
          <div className="px-6 pt-5">
            <h2 className="text-h5">Přehled situací</h2>
            <p className="mt-1 text-[13px] leading-[18px] text-muted-foreground">
              Šablony pro věci k řešení — každá situace má stupně závažnosti s výchozím názvem, popisem, prioritou a akcemi.
            </p>
          </div>

          <div className="px-6 py-5">
          <div className="flex h-[42px] items-center gap-2.5 rounded-md border border-input px-3.5 text-sm text-muted-foreground">
            <Search size={18} className="shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Hledat situaci, závažnost…"
              className="flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          </div>

          {/* Hlavička tabulky — stejná jako v Nastavení pravidel */}
          <div className="flex gap-4 bg-muted px-6 py-2.5 text-[12px] uppercase tracking-[0.6px] text-muted-foreground">
            <span className="w-[18px]" />
            <span className="flex-1">Situace</span>
            <span>Akce</span>
          </div>

          <div className="flex flex-col">
            {visible.length === 0 ? (
              <p className="border-t border-border py-10 text-center text-sm text-muted-foreground">
                {situations.length === 0 ? "Zatím žádné situace." : "Žádná situace neodpovídá hledání."}
              </p>
            ) : (
              visible.map((s) => {
                const usage = totalUsage(s.id);
                const isOpen = expanded.has(s.id);
                return (
                  <div key={s.id} className="border-t border-border">
                    <div
                      onClick={() => navigate({ to: "/situace/$id", params: { id: s.id } })}
                      className="flex cursor-pointer items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/60"
                    >
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleExpanded(s.id); }}
                        className="grid w-[18px] shrink-0 place-items-center text-muted-foreground transition-colors hover:text-primary"
                        title={isOpen ? "Skrýt závažnosti a pravidla" : "Zobrazit závažnosti a pravidla"}
                      >
                        {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="text-[15px] font-medium leading-[22px]">{s.name}</div>
                        {s.description && (
                          <div className="mt-1 text-[13px] leading-[18px] text-muted-foreground">{s.description}</div>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5">
                        <span className="inline-flex h-6 items-center rounded-full bg-muted px-2.5 text-[13px] leading-5 text-muted-foreground">
                          {s.severities.length} {s.severities.length === 1 ? "závažnost" : s.severities.length < 5 ? "závažnosti" : "závažností"}
                        </span>
                        <span
                          className={cn(
                            "inline-flex h-6 items-center rounded-full px-2.5 text-[13px] font-medium leading-5",
                            usage > 0 ? "bg-primary-soft text-accent-foreground" : "bg-muted text-muted-foreground",
                          )}
                        >
                          {usage} {usage === 1 ? "pravidlo" : usage < 5 ? "pravidla" : "pravidel"}
                        </span>
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        <Link
                          to="/situace/$id"
                          params={{ id: s.id }}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-[13px] leading-5 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                          title="Upravit situaci"
                        >
                          <Pencil size={16} />
                          Upravit
                        </Link>
                        <button
                          disabled={usage > 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            situationsStore.remove(s.id);
                          }}
                          title={usage > 0 ? `Používá se v ${usage} pravidlech` : "Smazat situaci"}
                          className={cn(
                            "grid size-[34px] place-items-center rounded-md text-muted-foreground transition-colors",
                            usage > 0 ? "cursor-not-allowed opacity-30" : "hover:bg-destructive/10 hover:text-destructive",
                          )}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="space-y-3 border-t border-border bg-muted/50 px-6 py-4">
                        {s.severities.length === 0 ? (
                          <p className="text-[13px] text-muted-foreground">Zatím žádné závažnosti.</p>
                        ) : (
                          s.severities.map((sev) => {
                            const sevRules = rulesForSeverity(sev.id);
                            return (
                              <div key={sev.id} className="border-l-2 border-border pl-3">
                                <div className="flex items-center gap-2 py-1">
                                  <span className="text-sm font-medium">{sev.name}</span>
                                  <span
                                    className={cn(
                                      "inline-flex h-6 items-center rounded-full px-2.5 text-[13px] font-medium leading-5",
                                      isPriorityHigh(sev.priority)
                                        ? "bg-destructive/12 text-destructive"
                                        : "bg-muted text-muted-foreground",
                                    )}
                                  >
                                    {priorityLabel(sev.priority)}
                                  </span>
                                  <span className="ml-auto text-[13px] text-muted-foreground">
                                    {sevRules.length} {sevRules.length === 1 ? "pravidlo" : sevRules.length < 5 ? "pravidla" : "pravidel"}
                                  </span>
                                </div>
                                {sevRules.map((rule) => (
                                  <div
                                    key={rule.id}
                                    onClick={() => setSelectedRule(rule)}
                                    className="mt-1.5 flex cursor-pointer items-center gap-3 rounded-md border border-border bg-card px-3.5 py-2.5 transition-colors hover:bg-muted/60"
                                  >
                                    <div className="flex-1 min-w-0">
                                      <div className="truncate text-sm font-medium">{rule.name}</div>
                                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                        <span className="inline-flex h-6 items-center rounded-full border border-input px-2.5 text-[13px] leading-5 text-muted-foreground">
                                          {triggerLabel(rule.trigger.kind)}
                                        </span>
                                        <span
                                          className={cn(
                                            "inline-flex h-6 items-center rounded-full px-2.5 text-[13px] font-medium leading-5",
                                            isPriorityHigh(resolveRulePriority(rule))
                                              ? "bg-destructive/12 text-destructive"
                                              : "bg-muted text-muted-foreground",
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

        {selectedRule && (
          <RuleDetailSidebar rule={selectedRule} onClose={() => setSelectedRule(null)} />
        )}
      </div>
    </AppShell>
  );
}
