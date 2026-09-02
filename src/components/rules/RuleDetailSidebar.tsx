import { X, Pencil, FileText, History as HistoryIcon, Trash2 } from "@/components/ui/icon";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { AreaBadge } from "@/components/common/AreaBadge";
import { rulesStore } from "@/lib/model/store";
import { priorityLabel, isPriorityHigh, resolveRuleActions, resolveRulePriority } from "@/lib/model/ruleDisplay";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Rule } from "@/lib/model/types";

export function RuleDetailSidebar({ rule, onClose }: { rule: Rule; onClose: () => void }) {
  return (
    <aside className="fixed right-0 top-16 bottom-0 flex w-[460px] flex-col border-l border-border bg-surface shadow-xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold leading-snug">{rule.name}</h3>
          {rule.description && (
            <p className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap">{rule.description}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>

      <Tabs defaultValue="summary" className="flex min-h-0 flex-1 flex-col">
        <TabsList className="mx-5 border-b border-border">
          <TabsTrigger value="summary" className="text-xs">
            <FileText className="mr-1 size-3.5" />Detail pravidla
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs">
            <HistoryIcon className="mr-1 size-3.5" />Historie
          </TabsTrigger>
        </TabsList>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
          <TabsContent value="summary" className="mt-0 space-y-4">
            <RuleSummaryTab rule={rule} />
          </TabsContent>
          <TabsContent value="history" className="mt-0">
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
              Žádné záznamy spuštění.
            </div>
          </TabsContent>
        </div>
      </Tabs>

      <div className="border-t border-border bg-surface p-4 space-y-2">
        <Link
          to="/rules/$ruleId/edit"
          params={{ ruleId: rule.id }}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Pencil className="size-4" /> Upravit pravidlo
        </Link>
        <button
          onClick={() => { rulesStore.remove(rule.id); onClose(); }}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:border-red-300 hover:text-red-500 transition-colors"
        >
          <Trash2 className="size-4" /> Smazat pravidlo
        </button>
      </div>
    </aside>
  );
}

function SummarySection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}

function RuleSummaryTab({ rule }: { rule: Rule }) {
  const actionTypeLabel: Record<string, string> = {
    create_vkr: "Vytvořit VkŘ",
    send_email: "Poslat e-mail",
    set_field: "Nastavit pole",
    change_phase: "Změnit fázi",
    add_note: "Přidat poznámku",
    update_vkr: "Aktualizovat VkŘ",
    request_field_from_operator: "Vyžádat pole od operátora",
  };

  return (
    <div className="space-y-4">
      <SummarySection label="Oblast">
        <AreaBadge area={rule.area} />
      </SummarySection>

      <SummarySection label="Spouštěč">
        <div className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
          {rule.trigger.label}
        </div>
      </SummarySection>

      <SummarySection label="Akce">
        <div className="space-y-2">
          {resolveRuleActions(rule).map((a) => (
            <div key={a.id} className="rounded-lg border border-border bg-background p-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{actionTypeLabel[a.type] ?? a.type}</span>
                {a.runWhenRouteCondition && (
                  <span className={cn(
                    "text-[10px] font-semibold rounded-full px-2 py-0.5",
                    a.runWhenRouteCondition === "fulfilled" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  )}>
                    {a.runWhenRouteCondition === "fulfilled" ? "splněno" : "nesplněno"}
                  </span>
                )}
              </div>
              {a.title && <div className="mt-0.5 text-xs text-muted-foreground">{a.title}</div>}
            </div>
          ))}
        </div>
      </SummarySection>

      <SummarySection label="Priorita">
        <span className={cn(
          "inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold",
          isPriorityHigh(resolveRulePriority(rule))
            ? "bg-destructive/15 text-destructive"
            : "bg-muted text-muted-foreground"
        )}>
          {priorityLabel(resolveRulePriority(rule))}
        </span>
      </SummarySection>
    </div>
  );
}
