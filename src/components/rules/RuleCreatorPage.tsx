import { useEffect, useMemo, useState } from "react";
import { Lock, Zap, Clock } from "@/components/ui/icon";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Textarea } from "@/components/ui/textarea";
import { useRules, rulesStore, useSituations, useActionTags } from "@/lib/model/store";
import { priorityLabel, isPriorityHigh } from "@/lib/model/ruleDisplay";
import { cn } from "@/lib/utils";
import type { Area, Priority, Rule, Situation, Severity, Condition } from "@/lib/model/types";
import { VkrConditionsBuilder } from "@/components/rules/editors/VkrConditionsBuilder";
import type { VkrCondition } from "@/lib/vkr/vkrConditionCatalog";
import { TrackingIncomingConditionsBuilder } from "@/components/rules/editors/TrackingIncomingConditionsBuilder";
import { TrackingHistoricalConditionsBuilder } from "@/components/rules/editors/TrackingHistoricalConditionsBuilder";
import { isHistoricalConditionRow } from "@/lib/model/trackingFields";


type TrackingTriggerType = "automatic" | "timer";

interface RuleCreatorUiState {
  selectedSituationId: string | null;
  selectedSeverityId: string | null;
  triggerType: TrackingTriggerType;
  trackingConditions: Condition[];
  noMovementDuration: number;
  noMovementUnit: "h" | "d" | "bd";
  vkrConditions: VkrCondition[];
}

type RuleCreatorInitialState = RuleCreatorUiState & {
  selectedArea: Area;
  ruleName: string;
  ruleDescription: string;
};

function inferTriggerType(rule?: Rule): TrackingTriggerType {
  if (!rule || rule.area !== "tracking_records") return "automatic";
  return rule.trigger.kind === "schedule" ? "timer" : "automatic";
}

function trackingConditionsFromRule(rule?: Rule): Condition[] {
  if (!rule) return [];
  return rule.conditions.filter((c) => c.kind === "field" || c.kind === "tracking_aggregate");
}

function getInitialFormState(rule?: Rule): RuleCreatorInitialState {
  const ui = (rule?.uiState ?? {}) as Partial<RuleCreatorUiState>;

  return {
    selectedArea: rule?.area ?? "tracking_records",
    ruleName: rule?.name ?? "",
    ruleDescription: rule?.description ?? "",
    selectedSituationId: ui.selectedSituationId ?? rule?.situationId ?? null,
    selectedSeverityId: ui.selectedSeverityId ?? rule?.severityId ?? null,
    triggerType: ui.triggerType ?? inferTriggerType(rule),
    trackingConditions: ui.trackingConditions ?? trackingConditionsFromRule(rule),
    noMovementDuration: ui.noMovementDuration ?? 72,
    noMovementUnit: ui.noMovementUnit ?? "h",
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
  const [ruleName, setRuleName] = useState(initialState.ruleName);
  const [ruleDescription, setRuleDescription] = useState(initialState.ruleDescription);
  const [vkrConditions, setVkrConditions] = useState<VkrCondition[]>(initialState.vkrConditions);

  useEffect(() => {
    setSelectedSituationId(initialState.selectedSituationId);
    setSelectedSeverityId(initialState.selectedSeverityId);
    setTriggerType(initialState.triggerType);
    setTrackingConditions(initialState.trackingConditions);
    setNoMovementDuration(initialState.noMovementDuration);
    setNoMovementUnit(initialState.noMovementUnit);
    setRuleName(initialState.ruleName);
    setRuleDescription(initialState.ruleDescription);
    setVkrConditions(initialState.vkrConditions);
  }, [initialState]);

  const isTrackingRecords = selectedArea === "tracking_records";

  const situations = useSituations();
  const actionTags = useActionTags();
  const selectedSituationObj: Situation | undefined = situations.find((s) => s.id === selectedSituationId);
  const selectedSeverityObj: Severity | undefined = selectedSituationObj?.severities.find((s) => s.id === selectedSeverityId);

  function handleSelectSituation(situationId: string) {
    setSelectedSituationId(situationId);
    const nextSituation = situations.find((s) => s.id === situationId);
    const firstSeverity = nextSituation?.severities[0];
    setSelectedSeverityId(firstSeverity?.id ?? null);
  }

  function handleSelectSeverity(severity: Severity) {
    setSelectedSeverityId(severity.id);
  }

  useEffect(() => {
    if (isEdit || !initialSituationId) return;
    setSelectedSituationId(initialSituationId);
    const situation = situations.find((s) => s.id === initialSituationId);
    const severity = situation?.severities.find((s) => s.id === initialSeverityId) ?? situation?.severities[0];
    if (severity) {
      setSelectedSeverityId(severity.id);
    }
    // Only run once on mount for the "+ Pravidlo pro tuto závažnost" entry point — deliberately
    // excludes `situations` from deps so it doesn't re-fire and clobber user edits on every store update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppShell
      current="rules"
      title={ruleName || (ruleId ? "Úprava pravidla" : "Nové pravidlo")}
      backTo="/"
    >
      <div className="grid items-start gap-5 py-1 lg:grid-cols-[340px_minmax(0,1fr)]">
        {/* LEVÝ SLOUPEC — Situace, Závažnost, Akce */}
        <div className="flex flex-col gap-5">
          <div className="rounded-md bg-card px-6 py-5 elevation-2">
            {/* Situace + Závažnost (tracking_records) */}
            {isTrackingRecords && (
              <div>
                <div className="text-overline mb-2">Situace</div>
                <select
                  value={selectedSituationId ?? ""}
                  onChange={(e) => handleSelectSituation(e.target.value)}
                  className="mb-4 h-[42px] w-full rounded-md border border-input bg-card px-3 text-sm outline-none transition-colors focus:border-primary"
                >
                  <option value="" disabled>— vyber situaci —</option>
                  {situations.filter((s) => s.area === "tracking_records").map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>

                {selectedSituationObj && (
                  <>
                    <div className="text-overline mb-2">Závažnost</div>
                    <div className="flex flex-col gap-1.5">
                      {selectedSituationObj.severities.map((sev) => {
                        const isSelected = selectedSeverityId === sev.id;
                        return (
                          <button
                            key={sev.id}
                            onClick={() => handleSelectSeverity(sev)}
                            className={cn(
                              "flex items-center gap-2 rounded-md border px-3 py-2.5 text-left text-sm font-medium transition-colors",
                              isSelected
                                ? "border-primary bg-primary-soft text-primary"
                                : "border-input text-foreground hover:border-primary/40 hover:bg-muted/50",
                            )}
                          >
                            <span className="min-w-0 flex-1 truncate">{sev.name}</span>
                            {/* Priorita pravidla se dědí odsud, tak ať je vidět rovnou u závažnosti. */}
                            <span
                              className={cn(
                                "inline-flex h-6 shrink-0 items-center rounded-full px-2.5 text-[13px] font-medium leading-5",
                                isPriorityHigh(sev.priority)
                                  ? "bg-destructive/12 text-destructive"
                                  : "bg-muted text-muted-foreground",
                              )}
                            >
                              {priorityLabel(sev.priority)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

          </div>

          {/* Akce se dědí ze Závažnosti, proto sedí hned pod ní. */}
          <div className="rounded-md bg-card px-6 py-5 elevation-2">
            <div className="space-y-4">
            <div className="text-overline">Akce</div>

            {isTrackingRecords && !selectedSeverityObj && (
              <div className="rounded-md border border-dashed border-input p-8 text-center">
                <div className="text-sm text-muted-foreground">Vyber situaci a závažnost v levém sloupci.</div>
              </div>
            )}

            {isTrackingRecords && selectedSeverityObj && selectedSeverityObj.actions.length === 0 && (
              <div className="rounded-md border border-dashed border-input p-8 text-center">
                <div className="text-sm text-muted-foreground">Tato závažnost nemá žádné výchozí akce.</div>
              </div>
            )}

            {isTrackingRecords && selectedSeverityObj && selectedSeverityObj.actions.length > 0 && (
              <div className="space-y-2">
                {selectedSeverityObj.actions.map((a) => {
                  const tag = actionTags.find((t) => t.id === a.actionTagId);
                  return (
                    <div key={a.id} className="rounded-md border border-border bg-muted/50 p-3">
                      <span className="inline-flex h-6 items-center rounded-full bg-primary-soft px-2.5 text-[13px] font-medium leading-5 text-accent-foreground">
                        {tag?.label ?? a.actionTagId}
                      </span>
                      {a.description && (
                        <p className="mt-2 text-[13px] leading-[19px] text-muted-foreground">
                          {a.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {!isTrackingRecords && (
              <div className="rounded-md border border-dashed border-input p-8 text-center">
                <div className="text-sm text-muted-foreground">Pro tuto oblast se akce nekonfigurují přes wizard.</div>
              </div>
            )}
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              disabled={!ruleName}
              onClick={() => {
                const id = existingRule?.id ?? ("rule_" + Date.now());
                const code = existingRule?.code ?? ("R" + Math.floor(Math.random() * 90 + 10));

                const trackingTrigger = triggerType === "timer"
                  ? { kind: "schedule" as const, label: "Časový plán — kontroluje periodicky" }
                  : { kind: "condition_met" as const, label: "Reaktivní — při každém novém tracking záznamu" };

                const trackingConditionsOut: Rule["conditions"] =
                  triggerType === "timer"
                    ? trackingConditions.filter(isHistoricalConditionRow)
                    : trackingConditions;

                const trackingActionsOut: Rule["actions"] = (selectedSeverityObj?.actions ?? []).map((a) => ({
                  id: a.id,
                  type: "create_vkr",
                  title: ruleName,
                  vkrText: a.description || undefined,
                  actionTagId: a.actionTagId,
                }));

                const rulePriority: Priority = isTrackingRecords
                  ? (selectedSeverityObj?.priority ?? existingRule?.priority ?? "medium")
                  : (existingRule?.priority ?? "medium");

                rulesStore.upsert({
                  id,
                  code,
                  name: ruleName,
                  description: ruleDescription || undefined,
                  area: selectedArea,
                  priority: rulePriority,
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
                    vkrConditions,
                  },
                });
                toast.success(isEdit ? "Pravidlo upraveno" : "Pravidlo uloženo");

                // Vstup přes "+ Pravidlo pro tuto závažnost" — po uložení zpět na detail Situace, ze které uživatel přišel.
                if (!isEdit && isTrackingRecords && initialSituationId) {
                  navigate({ to: "/situace/$id", params: { id: initialSituationId } });
                } else {
                  navigate({ to: "/" });
                }
              }}
              className={cn(
                "w-full rounded-md px-4 py-2.5 text-[15px] font-medium transition-colors",
                ruleName
                  ? "bg-primary text-primary-foreground elevation-1 hover:bg-[#7E4EE6]"
                  : "cursor-not-allowed bg-muted text-muted-foreground"
              )}
            >
              {isEdit ? "Uložit změny" : "Uložit pravidlo"}
            </button>
            
          </div>
        </div>

        {/* PROSTŘEDNÍ SLOUPEC — Nastavení, Spouštěč, Podmínky */}
        <div className="min-w-0 rounded-md bg-card elevation-2">
          <div className="divide-y divide-border">
            {/* Meta — název, popis */}
            <div className="space-y-4 px-6 py-5">
              <div className="text-overline">Nastavení pravidla</div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Název pravidla</label>
                <input
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="Pojmenuj pravidlo…"
                  className="h-[42px] w-full rounded-md border border-input bg-card px-3.5 text-sm outline-none transition-colors focus:border-primary"
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
            </div>

            {!isTrackingRecords && (
              <div className="m-6 rounded-md border border-dashed border-input p-8 text-center">
                <div className="text-sm text-muted-foreground">
                  Konfigurace podmínek pro tuto oblast bude přidána později.
                </div>
              </div>
            )}

            {isTrackingRecords && !selectedSeverityId && (
              <div className="m-6 rounded-md border border-dashed border-input p-8 text-center">
                <div className="text-sm text-muted-foreground">Vyber situaci a závažnost v levém sloupci.</div>
              </div>
            )}

            {isTrackingRecords && selectedSeverityId && (
              <>
                <div className="px-6 py-5">
                  <div className="text-overline mb-2">Spouštěč</div>
                  <div className="inline-flex gap-2">
                    <button
                      onClick={() => setTriggerType("automatic")}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md border px-4 py-2 text-sm font-medium transition-colors",
                        triggerType === "automatic"
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input text-muted-foreground hover:border-primary hover:text-primary",
                      )}
                    >
                      <Zap size={16} /> Automaticky
                    </button>
                    <button
                      onClick={() => setTriggerType("timer")}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md border px-4 py-2 text-sm font-medium transition-colors",
                        triggerType === "timer"
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input text-muted-foreground hover:border-primary hover:text-primary",
                      )}
                    >
                      <Clock size={16} /> Časovač
                    </button>
                  </div>
                  <p className="mt-2.5 text-[13px] leading-[18px] text-muted-foreground">
                    {triggerType === "automatic"
                      ? "Vyhodnotí se při každém novém tracking záznamu."
                      : "Kontroluje periodicky, jestli od posledního záznamu neuplynula nastavená doba."}
                  </p>
                </div>

                {triggerType === "timer" && (
                  <div className="px-6 py-5">
                    <div className="text-overline mb-2">Zásilka nemá nový záznam déle než</div>
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
                    <div className="mt-2.5 flex items-start gap-2 rounded-lg border border-dashed border-emerald-600/40 bg-emerald-600/5 px-2.5 py-2">
                      <Lock className="size-3.5 shrink-0 mt-0.5 text-emerald-700" />
                      <p className="text-[11px] leading-relaxed text-foreground">
                        <span className="font-medium">Nastavená doba se nepočítá</span>
                        , pokud je zásilka na clení, nebo má jiný administrativní status.
                      </p>
                    </div>
                  </div>
                )}

                <div className="px-6 py-5">
                  <div className="text-overline mb-3">Podmínky</div>

                  {triggerType === "automatic" && (
                    <div className="mb-3.5 rounded-md border border-border bg-muted/50 p-4 space-y-2.5">
                      <div className="text-overline">
                        Podmínky pro příchozí záznam
                      </div>
                      <TrackingIncomingConditionsBuilder
                        conditions={trackingConditions}
                        onChange={setTrackingConditions}
                      />
                    </div>
                  )}

                  <div className="mb-3.5 rounded-md border border-border bg-muted/50 p-4 space-y-2.5">
                    <div className="text-overline">
                      Podmínky pro historické záznamy
                    </div>
                    <TrackingHistoricalConditionsBuilder
                      conditions={trackingConditions}
                      onChange={setTrackingConditions}
                      triggerType={triggerType}
                    />
                  </div>

                  <div className="rounded-md border border-border bg-muted/50 p-4 space-y-2.5">
                    <div className="text-overline">
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

      </div>
    </AppShell>
  );
}
