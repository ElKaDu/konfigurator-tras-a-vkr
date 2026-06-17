import { useState } from "react";
import { Search, X, Pencil, Sparkles, PlayCircle, History as HistoryIcon, Trash2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { AppHeader } from "@/components/AppHeader";
import { AreaBadge } from "@/components/common/AreaBadge";
import { AREAS, CIRCLED } from "@/lib/model/areas";
import { useRules, rulesStore } from "@/lib/model/store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Area, Rule } from "@/lib/model/types";

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
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null);

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
                  onClick={() => setSelectedRule(selectedRule?.id === rule.id ? null : rule)}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors hover:bg-muted/40",
                    !rule.active && "opacity-60",
                    selectedRule?.id === rule.id ? "border-primary bg-primary-soft/20" : "border-border",
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
                      <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                        {triggerLabel(rule.trigger.kind)}
                      </span>
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

                  {/* Status dot + trash */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        rulesStore.remove(rule.id);
                        if (selectedRule?.id === rule.id) setSelectedRule(null);
                      }}
                      className="opacity-0 group-hover:opacity-100 rounded p-1 text-muted-foreground hover:text-red-500 transition-all"
                      title="Smazat pravidlo"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                    <span
                      className={cn(
                        "size-2 rounded-full",
                        rule.active ? "bg-emerald-500" : "bg-border",
                      )}
                    />
                  </div>
                </div>
              ))
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

/* ─── Rule Detail Sidebar ────────────────────────────────── */

const MOCK_SHIPMENTS_TEST = [
  "BYT-2026-1142 — FedEx Express → DE",
  "BYT-2026-1117 — UPS World → USA",
  "BYT-2026-1099 — FedEx Eco → CH",
];

function RuleDetailSidebar({ rule, onClose }: { rule: Rule; onClose: () => void }) {
  return (
    <aside className="fixed right-0 top-14 bottom-0 flex w-[460px] flex-col border-l border-border bg-surface shadow-xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
        <div className="min-w-0">
          <div className="font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {rule.code}
          </div>
          <h3 className="mt-1 text-base font-semibold leading-snug">{rule.name}</h3>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>

      <Tabs defaultValue="summary" className="flex min-h-0 flex-1 flex-col">
        <TabsList className="mx-5 grid w-auto grid-cols-3">
          <TabsTrigger value="summary" className="text-xs">
            <Sparkles className="mr-1 size-3.5" />Shrnutí
          </TabsTrigger>
          <TabsTrigger value="test" className="text-xs">
            <PlayCircle className="mr-1 size-3.5" />Test
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs">
            <HistoryIcon className="mr-1 size-3.5" />Historie
          </TabsTrigger>
        </TabsList>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
          <TabsContent value="summary" className="mt-0 space-y-4">
            <RuleSummaryTab rule={rule} />
          </TabsContent>
          <TabsContent value="test" className="mt-0">
            <RuleTestTab rule={rule} />
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
          to="/rules/new"
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
          {rule.actions.map((a) => (
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
          rule.priority === "high" || rule.priority === "urgent"
            ? "bg-destructive/15 text-destructive"
            : "bg-muted text-muted-foreground"
        )}>
          {rule.priority.toUpperCase()}
        </span>
      </SummarySection>
    </div>
  );
}

function RuleTestTab({ rule }: { rule: Rule }) {
  const [selected, setSelected] = useState(MOCK_SHIPMENTS_TEST[0]);
  const [result, setResult] = useState<{ met: boolean } | null>(null);

  const run = () => {
    const seed = (selected + rule.id).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    setResult({ met: seed % 3 !== 0 });
  };

  return (
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground">
        Otestuj pravidlo na konkrétní zásilce (dry run — nic se neuloží).
      </div>
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
      >
        {MOCK_SHIPMENTS_TEST.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <button
        onClick={run}
        className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Spustit dry run
      </button>
      {result && (
        <div className={cn(
          "rounded-lg border p-3 text-sm font-semibold",
          result.met ? "border-green-300 bg-green-50 text-green-700" : "border-red-300 bg-red-50 text-red-700"
        )}>
          {result.met ? "✓ Podmínky splněny — akce by byla provedena" : "✗ Podmínky nesplněny"}
        </div>
      )}
    </div>
  );
}
