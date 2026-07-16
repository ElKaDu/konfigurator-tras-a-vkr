import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { Textarea } from "@/components/ui/textarea";
import { useRules, rulesStore, useSituations, useActionTags } from "@/lib/model/store";
import { cn } from "@/lib/utils";
import type { Area, Priority, Rule, Situation, Severity, Condition } from "@/lib/model/types";
import { VkrConditionsBuilder } from "@/components/rules/editors/VkrConditionsBuilder";
import type { VkrCondition } from "@/lib/vkr/vkrConditionCatalog";
import { TrackingConditionsBuilder } from "@/components/rules/editors/TrackingConditionsBuilder";
import { ActionTagPicker } from "@/components/situations/ActionTagPicker";


type TrackingTriggerType = "automatic" | "timer";

interface SeverityActionRow {
  id: string;
  actionTagId: string;
  enabled: boolean;
  description: string;
}

interface RuleCreatorUiState {
  selectedSituationId: string | null;
  selectedSeverityId: string | null;
  triggerType: TrackingTriggerType;
  trackingConditions: Condition[];
  noMovementDuration: number;
  noMovementUnit: "h" | "d" | "bd";
  severityActions: SeverityActionRow[];
  vkrConditions: VkrCondition[];
}

type RuleCreatorInitialState = RuleCreatorUiState & {
  selectedArea: Area;
  ruleName: string;
  ruleDescription: string;
  priority: Priority;
  active: boolean;
};

function inferTriggerType(rule?: Rule): TrackingTriggerType {
  if (!rule || rule.area !== "tracking_records") return "automatic";
  return rule.trigger.kind === "schedule" ? "timer" : "automatic";
}

function trackingConditionsFromRule(rule?: Rule): Condition[] {
  if (!rule) return [];
  return rule.conditions.filter((c) => c.kind === "field" || c.kind === "tracking_aggregate");
}

function severityActionRowsFromRule(rule?: Rule): SeverityActionRow[] {
  if (!rule || rule.area !== "tracking_records") return [];
  return rule.actions
    .filter((a) => a.actionTagId)
    .map((a) => ({ id: a.id, actionTagId: a.actionTagId!, enabled: true, description: a.vkrText ?? "" }));
}

function getInitialFormState(rule?: Rule): RuleCreatorInitialState {
  const ui = (rule?.uiState ?? {}) as Partial<RuleCreatorUiState>;

  return {
    selectedArea: rule?.area ?? "tracking_records",
    ruleName: rule?.name ?? "",
    ruleDescription: rule?.description ?? "",
    priority: rule?.priority ?? "medium",
    active: rule?.active ?? true,
    selectedSituationId: ui.selectedSituationId ?? rule?.situationId ?? null,
    selectedSeverityId: ui.selectedSeverityId ?? rule?.severityId ?? null,
    triggerType: ui.triggerType ?? inferTriggerType(rule),
    trackingConditions: ui.trackingConditions ?? trackingConditionsFromRule(rule),
    noMovementDuration: ui.noMovementDuration ?? 72,
    noMovementUnit: ui.noMovementUnit ?? "h",
    severityActions: ui.severityActions ?? severityActionRowsFromRule(rule),
    vkrConditions: (ui.vkrConditions as VkrCondition[] | undefined) ?? [],
  };
}

export function RuleCreatorPage({
  ruleId,
  initialSituationId,
  initialSeverityId,
}: {
  ruleId?: string;
  initialSituationId?: string;
  initialSeverityId?: string;
} = {}) {
  const rules = useRules();
  const navigate = useNavigate();

  const existingRule = ruleId ? rules.find((r) => r.id === ruleId) : undefined;
  const initialState = useMemo(() => getInitialFormState(existingRule), [existingRule]);
  const isEdit = !!ruleId;

  const selectedArea = initialState.selectedArea;

  // Tracking records state
  const [selectedSituationId, setSelectedSituationId] = useState<string | null>(initialState.selectedSituationId);
  const [selectedSeverityId, setSelectedSeverityId] = useState<string | null>(initialState.selectedSeverityId);
  const [triggerType, setTriggerType] = useState<TrackingTriggerType>(initialState.triggerType);
  const [trackingConditions, setTrackingConditions] = useState<Condition[]>(initialState.trackingConditions);
  const [noMovementDuration, setNoMovementDuration] = useState(initialState.noMovementDuration);
  const [noMovementUnit, setNoMovementUnit] = useState<"h" | "d" | "bd">(initialState.noMovementUnit);
  const [severityActions, setSeverityActions] = useState<SeverityActionRow[]>(initialState.severityActions);
  const [ruleName, setRuleName] = useState(initialState.ruleName);
  const [ruleDescription, setRuleDescription] = useState(initialState.ruleDescription);
  const [priority, setPriority] = useState<Priority>(initialState.priority);
  const [active, setActive] = useState(initialState.active);
  const [vkrConditions, setVkrConditions] = useState<VkrCondition[]>(initialState.vkrConditions);

  useEffect(() => {
    setSelectedSituationId(initialState.selectedSituationId);
    setSelectedSeverityId(initialState.selectedSeverityId);
    setTriggerType(initialState.triggerType);
    setTrackingConditions(initialState.trackingConditions);
    setNoMovementDuration(initialState.noMovementDuration);
    setNoMovementUnit(initialState.noMovementUnit);
    setSeverityActions(initialState.severityActions);
    setRuleName(initialState.ruleName);
    setRuleDescription(initialState.ruleDescription);
    setPriority(initialState.priority);
    setActive(initialState.active);
    setVkrConditions(initialState.vkrConditions);
  }, [initialState]);

  const isTrackingRecords = selectedArea === "tracking_records";

  const situations = useSituations();
  const actionTags = useActionTags();
  const selectedSituationObj: Situation | undefined = situations.find((s) => s.id === selectedSituationId);
  const selectedSeverityObj: Severity | undefined = selectedSituationObj?.severities.find((s) => s.id === selectedSeverityId);

  function applySeverityTemplate(severity: Severity) {
    setPriority(severity.priority);
    setSeverityActions(
      severity.actions.map((a) => ({ id: a.id, actionTagId: a.actionTagId, enabled: true, description: a.description ?? "" }))
    );
  }

  function handleSelectSituation(situationId: string) {
    setSelectedSituationId(situationId);
    const nextSituation = situations.find((s) => s.id === situationId);
    const firstSeverity = nextSituation?.severities[0];
    setSelectedSeverityId(firstSeverity?.id ?? null);
    if (firstSeverity) applySeverityTemplate(firstSeverity);
  }

  function handleSelectSeverity(severity: Severity) {
    setSelectedSeverityId(severity.id);
    applySeverityTemplate(severity);
  }

  useEffect(() => {
    if (isEdit || !initialSituationId) return;
    setSelectedSituationId(initialSituationId);
    const situation = situations.find((s) => s.id === initialSituationId);
    const severity = situation?.severities.find((s) => s.id === initialSeverityId) ?? situation?.severities[0];
    if (severity) {
      setSelectedSeverityId(severity.id);
      applySeverityTemplate(severity);
    }
    // Only run once on mount for the "+ Pravidlo pro tuto závažnost" entry point — deliberately
    // excludes `situations` from deps so it doesn't re-fire and clobber user edits on every store update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-screen w-screen flex-col bg-background text-foreground">
      <AppHeader current="rules" />

      <div className="flex flex-1 min-h-0">
        {/* LEFT COLUMN — Situace + Závažnost */}
        <div className="flex w-[260px] shrink-0 flex-col border-r border-border">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Situace + Závažnost (tracking_records) */}
            {isTrackingRecords && (
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Situace</div>
                <select
                  value={selectedSituationId ?? ""}
                  onChange={(e) => handleSelectSituation(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm mb-3"
                >
                  <option value="" disabled>— vyber situaci —</option>
                  {situations.filter((s) => s.area === "tracking_records").map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>

                {selectedSituationObj && (
                  <>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Závažnost</div>
                    <div className="flex flex-col gap-1.5">
                      {selectedSituationObj.severities.map((sev) => {
                        const isSelected = selectedSeverityId === sev.id;
                        return (
                          <button
                            key={sev.id}
                            onClick={() => handleSelectSeverity(sev)}
                            className={cn(
                              "rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors",
                              isSelected
                                ? "border-primary bg-primary-soft/40 text-primary"
                                : "border-border hover:border-primary/30 hover:bg-muted/30 text-foreground"
                            )}
                          >
                            {sev.name}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-3 text-[10px] italic text-muted-foreground leading-relaxed">
                      Předvyplní název/popis/prioritu a akce vpravo — dál nezávisle editovatelné.
                    </p>
                  </>
                )}
              </div>
            )}

          </div>

          {/* Save button */}
          <div className="border-t border-border p-4 space-y-2">
            <button
              disabled={!ruleName}
              onClick={() => {
                const id = existingRule?.id ?? ("rule_" + Date.now());
                const code = existingRule?.code ?? ("R" + Math.floor(Math.random() * 90 + 10));

                const trackingTrigger = triggerType === "timer"
                  ? { kind: "schedule" as const, label: "Časový plán — kontroluje periodicky" }
                  : { kind: "condition_met" as const, label: "Reaktivní — při každém novém tracking záznamu" };

                const trackingConditionsOut: Rule["conditions"] = trackingConditions;

                const trackingActionsOut: Rule["actions"] = severityActions
                  .filter((a) => a.enabled)
                  .map((a) => ({
                    id: a.id,
                    type: "create_vkr",
                    title: ruleName,
                    vkrText: a.description || undefined,
                    actionTagId: a.actionTagId,
                  }));

                rulesStore.upsert({
                  id,
                  code,
                  name: ruleName,
                  description: ruleDescription || undefined,
                  area: selectedArea,
                  active,
                  priority: priority as Priority,
                  trigger: isTrackingRecords ? trackingTrigger : (existingRule?.trigger ?? { kind: "condition_met", label: "—" }),
                  conditions: isTrackingRecords ? trackingConditionsOut : (existingRule?.conditions ?? []),
                  situationId: isTrackingRecords ? selectedSituationId ?? undefined : existingRule?.situationId,
                  severityId: isTrackingRecords ? selectedSeverityId ?? undefined : existingRule?.severityId,
                  actions: isTrackingRecords ? trackingActionsOut : (existingRule?.actions ?? []),
                  uiState: {
                    selectedSituationId,
                    selectedSeverityId,
                    triggerType,
                    trackingConditions,
                    noMovementDuration,
                    noMovementUnit,
                    severityActions,
                    vkrConditions,
                  },
                });
                toast.success(isEdit ? "Pravidlo upraveno" : "Pravidlo uloženo");
                navigate({ to: "/" });
              }}
              className={cn(
                "w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                ruleName ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              {isEdit ? "Uložit změny" : "Uložit pravidlo"}
            </button>
            <Link
              to="/"
              className="block w-full rounded-lg border border-border px-4 py-2 text-center text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              ← Zpět na pravidla
            </Link>
          </div>
        </div>

        {/* MIDDLE COLUMN — Spouštěč + Podmínky */}
        <div className="flex flex-1 min-w-0 flex-col border-r border-border">
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Meta — název, priorita, aktivní — nahoře */}
            <div className="space-y-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Nastavení pravidla</div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Název pravidla</label>
                <input
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="Pojmenuj pravidlo…"
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Popis (volitelný)</label>
                <Textarea
                  value={ruleDescription}
                  onChange={(e) => setRuleDescription(e.target.value)}
                  placeholder="Krátký popis pravidla…"
                  rows={2}
                  className="resize-none text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Priorita</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as typeof priority)}
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none"
                >
                  <option value="low">LOW</option>
                  <option value="medium">MEDIUM</option>
                  <option value="high">HIGH</option>
                  <option value="urgent">URGENT</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Aktivní</span>
                <button
                  onClick={() => setActive((v) => !v)}
                  className={cn(
                    "relative inline-block h-5 w-9 rounded-full transition-colors",
                    active ? "bg-primary" : "bg-muted"
                  )}
                >
                  <span className={cn(
                    "absolute top-0.5 size-4 rounded-full bg-white transition-all shadow",
                    active ? "right-0.5" : "left-0.5"
                  )} />
                </button>
              </div>
            </div>

            <div className="border-t border-border" />

            {!isTrackingRecords && (
              <div className="rounded-xl border border-dashed border-border p-8 text-center">
                <div className="text-sm text-muted-foreground">
                  Konfigurace podmínek pro tuto oblast bude přidána později.
                </div>
              </div>
            )}

            {isTrackingRecords && !selectedSeverityId && (
              <div className="rounded-xl border border-dashed border-border p-8 text-center">
                <div className="text-sm text-muted-foreground">Vyber situaci a závažnost v levém sloupci.</div>
              </div>
            )}

            {isTrackingRecords && selectedSeverityId && (
              <>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Spouštěč</div>
                  <div className="flex gap-1.5 rounded-lg bg-muted/40 p-1 max-w-xs">
                    <button
                      onClick={() => setTriggerType("automatic")}
                      className={cn(
                        "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                        triggerType === "automatic" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      ⚡ Automaticky
                    </button>
                    <button
                      onClick={() => setTriggerType("timer")}
                      className={cn(
                        "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                        triggerType === "timer" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      🕐 Časovač
                    </button>
                  </div>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    {triggerType === "automatic"
                      ? "Vyhodnotí se při každém novém tracking záznamu."
                      : "Kontroluje periodicky, jestli od posledního záznamu neuplynula nastavená doba."}
                  </p>
                </div>

                {triggerType === "timer" && (
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Zásilka nemá nový záznam déle než
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        value={noMovementDuration}
                        onChange={(e) => setNoMovementDuration(Number(e.target.value))}
                        className="w-20 rounded border border-border bg-background px-2 py-1.5 text-sm text-center"
                      />
                      <select
                        value={noMovementUnit}
                        onChange={(e) => setNoMovementUnit(e.target.value as "h" | "d" | "bd")}
                        className="rounded border border-border bg-background px-2 py-1.5 text-xs"
                      >
                        <option value="h">hodin</option>
                        <option value="d">dní</option>
                        <option value="bd">pracovních dní</option>
                      </select>
                      <span className="text-xs text-muted-foreground">od posledního záznamu</span>
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3 pb-2 border-b border-border">
                    Podmínky
                  </div>

                  <div className="mb-4">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Co platí o záznamech v trackingu
                    </div>
                    <TrackingConditionsBuilder
                      conditions={trackingConditions}
                      onChange={setTrackingConditions}
                      allowCurrentRecord={triggerType === "automatic"}
                    />
                  </div>

                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Co dále platí
                    </div>
                    <VkrConditionsBuilder
                      conditions={vkrConditions}
                      onChange={setVkrConditions}
                    />
                  </div>
                </div>
              </>
            )}

          </div>
        </div>

        {/* RIGHT COLUMN — Akce */}
        <div className="flex w-[340px] shrink-0 flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Akce</div>


            {isTrackingRecords && (
              <div className="space-y-2">
                {severityActions.map((row) => {
                  const tag = actionTags.find((t) => t.id === row.actionTagId);
                  return (
                    <div key={row.id} className="rounded-lg border border-border bg-background p-2.5">
                      <div className="flex items-center gap-2 mb-1.5">
                        <input
                          type="checkbox"
                          checked={row.enabled}
                          onChange={(e) =>
                            setSeverityActions((prev) => prev.map((a) => (a.id === row.id ? { ...a, enabled: e.target.checked } : a)))
                          }
                        />
                        <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary flex-1">
                          {tag?.label ?? row.actionTagId}
                        </span>
                        <button
                          onClick={() => setSeverityActions((prev) => prev.filter((a) => a.id !== row.id))}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                      <Textarea
                        value={row.description}
                        onChange={(e) =>
                          setSeverityActions((prev) => prev.map((a) => (a.id === row.id ? { ...a, description: e.target.value } : a)))
                        }
                        placeholder="Co má operátor udělat…"
                        rows={2}
                        className="resize-none text-xs"
                        disabled={!row.enabled}
                      />
                    </div>
                  );
                })}
                <ActionTagPicker
                  excludeIds={severityActions.map((a) => a.actionTagId)}
                  onPick={(tag) =>
                    setSeverityActions((prev) => [...prev, { id: "sa_" + Date.now(), actionTagId: tag.id, enabled: true, description: "" }])
                  }
                />
              </div>
            )}

            {!isTrackingRecords && (
              <div className="rounded-xl border border-dashed border-border p-8 text-center">
                <div className="text-sm text-muted-foreground">Pro tuto oblast se akce nekonfigurují přes wizard.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

