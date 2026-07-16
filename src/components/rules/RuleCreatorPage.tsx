import { useEffect, useMemo, useState } from "react";
import { Lock, Clock, MapPin, AlertTriangle, Zap, ChevronDown, ChevronUp, Plus, X, Settings2 } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { Textarea } from "@/components/ui/textarea";
import { AREAS } from "@/lib/model/areas";
import { resolveAreaIcon } from "@/components/common/areaIcons";
import { useSegments, useCheckpointTypes, useRules, rulesStore, useSituations, situationsStore, useActionTags } from "@/lib/model/store";
import { cn } from "@/lib/utils";
import type { Area, Priority, ActionType, Rule, Situation, Severity, Condition } from "@/lib/model/types";
import { TRACKING_FIELDS, TRACKING_OPERATORS } from "@/lib/model/trackingFields";
import { ScheduleEditor, type ScheduleItem } from "@/components/rules/editors/ScheduleEditor";
import { VkrConditionsBuilder } from "@/components/rules/editors/VkrConditionsBuilder";
import type { VkrCondition } from "@/lib/vkr/vkrConditionCatalog";
import { RouteScopePicker, DEFAULT_ROUTE_SCOPE, type RouteScope } from "@/components/rules/editors/RouteScopePicker";
import { MilestoneTypePicker } from "@/components/rules/editors/MilestoneTypePicker";
import { TrackingTimeValueEditor, DEFAULT_TIME_SPEC, type TrackingTimeSpec } from "@/components/rules/editors/TrackingTimeValueEditor";
import { CurrentRecordConditionsBuilder } from "@/components/rules/editors/CurrentRecordConditionsBuilder";
import { TrackingHistoryConditionsBuilder } from "@/components/rules/editors/TrackingHistoryConditionsBuilder";
import { ActionTagPicker } from "@/components/situations/ActionTagPicker";


type RouteUiSituation = "delivery_day" | "unexpected_location" | "missed_milestone" | "other";
type CheckInterval = "30min" | "1h" | "2h" | "6h";
type ThresholdLevel = "warn" | "critical";


type TrackingTriggerType = "automatic" | "timer";
interface TrackingConditionRow { id: string; field: string; operator: string; value: string; timeSpec?: TrackingTimeSpec; }

const SITUATION_CARDS: {
  id: RouteUiSituation;
  icon: React.ReactNode;
  label: string;
  trigger: string;
  disabled?: boolean;
}[] = [
  {
    id: "delivery_day",
    icon: <Clock className="size-4" />,
    label: "Kontrola v den doručení",
    trigger: "Časový plán (schedule)",
  },
  {
    id: "unexpected_location",
    icon: <MapPin className="size-4" />,
    label: "Zásilka v neočekávané lokaci",
    trigger: "Reaktivní (condition_met)",
  },
  {
    id: "missed_milestone",
    icon: <AlertTriangle className="size-4" />,
    label: "Kontrola splnění milníku",
    trigger: "Reaktivní (condition_met)",
  },
  {
    id: "other",
    icon: <Zap className="size-4" />,
    label: "Jiná situace",
    trigger: "—",
    disabled: true,
  },
];

const ACTION_TYPES = [
  { id: "create_vkr", label: "Vytvořit VkŘ" },
  { id: "send_email", label: "Poslat e-mail" },
  { id: "set_field", label: "Nastavit pole" },
  { id: "change_phase", label: "Změnit fázi" },
  { id: "add_note", label: "Přidat poznámku" },
  { id: "update_vkr", label: "Aktualizovat VkŘ" },
  { id: "request_field_from_operator", label: "Vyžádat pole od operátora" },
];

interface BranchAction {
  id: string;
  type: string;
  title: string;
  vkrText?: string;
  /** Podmínky zásilky — akce se spustí jen pokud platí AND seznam. */
  shipmentConditions?: VkrCondition[];
}

interface SeverityActionRow {
  id: string;
  actionTagId: string;
  enabled: boolean;
  description: string;
}

interface RuleCreatorUiState {
  selectedSituation: RouteUiSituation | null;
  selectedSituationId: string | null;
  selectedSeverityId: string | null;
  triggerType: TrackingTriggerType;
  currentRecordConditions: Condition[];
  historyConditions: Condition[];
  noMovementDuration: number;
  noMovementUnit: "h" | "d" | "bd";
  severityActions: SeverityActionRow[];
  deliveryMilestone: string;
  checkTimes: string[];
  scheduleItems: ScheduleItem[];
  vkrConditions: VkrCondition[];
  routeScope: RouteScope;
  missedMilestoneType?: string;
  
  tooLongMilestone: string;
  tooLongThreshold: ThresholdLevel;
  checkInterval: CheckInterval;
  fulfilledActions: BranchAction[];
  notFulfilledActions: BranchAction[];
  trackingActions: BranchAction[];
}

type RuleCreatorInitialState = RuleCreatorUiState & {
  selectedArea: Area;
  ruleName: string;
  ruleDescription: string;
  priority: Priority;
  active: boolean;
};

const DEFAULT_TRACKING_CONDITIONS: TrackingConditionRow[] = [
  { id: "tc_1", field: "derivedStatus", operator: "je jedním z", value: "" },
];

const DEFAULT_NOT_FULFILLED_ACTIONS: BranchAction[] = [
  { id: "act_1", type: "create_vkr", title: "Soulad s trasou — nesplněno · {{shipment.reference}}" },
];

function cloneActions(actions: BranchAction[]): BranchAction[] {
  return actions.map((a) => ({ ...a }));
}

function toBranchAction(action: Rule["actions"][number]): BranchAction {
  return { id: action.id, type: action.type, title: action.title ?? "", vkrText: action.vkrText };
}

function routeCheckpointFromRule(rule?: Rule): string | undefined {
  const condition = rule?.conditions.find((c) => c.kind === "route_compliance" && c.mode === "checkpoint_type");
  return condition?.kind === "route_compliance" ? condition.checkpointTypeId : undefined;
}

function inferRouteSituation(rule?: Rule): RouteUiSituation | null {
  if (!rule || rule.area !== "route_compliance") return null;
  const name = rule.name.toLocaleLowerCase("cs-CZ");
  const triggerLabel = rule.trigger.label.toLocaleLowerCase("cs-CZ");
  const general = rule.conditions.find((c) => c.kind === "route_compliance" && c.mode === "general");
  if (general?.kind === "route_compliance" && general.generalCheck === "unrecognized_location") return "unexpected_location";
  if (name.includes("den doručení") || name.includes("doručení v den") || triggerLabel.includes("den doručení")) return "delivery_day";
  if (name.includes("dlouho") || triggerLabel.includes("interval") || triggerLabel.includes("každých")) return "missed_milestone";
  return "missed_milestone";
}

function inferTriggerType(rule?: Rule): TrackingTriggerType {
  if (!rule || rule.area !== "tracking_records") return "automatic";
  return rule.trigger.kind === "schedule" ? "timer" : "automatic";
}

function currentRecordConditionsFromRule(rule?: Rule): Condition[] {
  if (!rule) return [];
  return rule.conditions.filter(
    (c) => c.kind === "field" || (c.kind === "tracking_aggregate" && c.valueMode === "same_repeats")
  );
}

function historyConditionsFromRule(rule?: Rule): Condition[] {
  if (!rule) return [];
  return rule.conditions.filter((c) => c.kind === "tracking_aggregate" && c.valueMode === "specific");
}

function severityActionRowsFromRule(rule?: Rule): SeverityActionRow[] {
  if (!rule || rule.area !== "tracking_records") return [];
  return rule.actions
    .filter((a) => a.actionTagId)
    .map((a) => ({ id: a.id, actionTagId: a.actionTagId!, enabled: true, description: a.vkrText ?? "" }));
}

function getInitialFormState(rule?: Rule): RuleCreatorInitialState {
  const ui = (rule?.uiState ?? {}) as Partial<RuleCreatorUiState>;
  const fulfilledFromRule = rule?.actions.filter((a) => a.runWhenRouteCondition === "fulfilled").map(toBranchAction) ?? [];
  const notFulfilledFromRule = rule?.actions.filter((a) => a.runWhenRouteCondition !== "fulfilled").map(toBranchAction) ?? [];
  const checkpointId = routeCheckpointFromRule(rule);

  return {
    selectedArea: rule?.area ?? "route_compliance",
    ruleName: rule?.name ?? "",
    ruleDescription: rule?.description ?? "",
    priority: rule?.priority ?? "medium",
    active: rule?.active ?? true,
    selectedSituation: ui.selectedSituation ?? inferRouteSituation(rule),
    selectedSituationId: ui.selectedSituationId ?? rule?.situationId ?? null,
    selectedSeverityId: ui.selectedSeverityId ?? rule?.severityId ?? null,
    triggerType: ui.triggerType ?? inferTriggerType(rule),
    currentRecordConditions: ui.currentRecordConditions ?? currentRecordConditionsFromRule(rule),
    historyConditions: ui.historyConditions ?? historyConditionsFromRule(rule),
    noMovementDuration: ui.noMovementDuration ?? 72,
    noMovementUnit: ui.noMovementUnit ?? "h",
    severityActions: ui.severityActions ?? severityActionRowsFromRule(rule),
    deliveryMilestone: ui.deliveryMilestone ?? checkpointId ?? "ct_first_scan",
    checkTimes: ui.checkTimes ?? ["08:00", "10:00"],
    scheduleItems: (ui.scheduleItems as ScheduleItem[] | undefined) ?? [
      { id: "s_t1", kind: "time_of_day", time: "08:00", tzMode: "destination" },
      { id: "s_t2", kind: "time_of_day", time: "09:00", tzMode: "destination" },
    ],
    vkrConditions: (ui.vkrConditions as VkrCondition[] | undefined) ?? convertLegacyVkrConditions(ui),
    routeScope: (ui.routeScope as RouteScope | undefined) ?? { ...DEFAULT_ROUTE_SCOPE },
    missedMilestoneType: ui.missedMilestoneType ?? checkpointId,
    
    tooLongMilestone: ui.tooLongMilestone ?? checkpointId ?? "",
    tooLongThreshold: ui.tooLongThreshold ?? "warn",
    checkInterval: ui.checkInterval ?? "1h",
    fulfilledActions: ui.fulfilledActions ?? fulfilledFromRule,
    notFulfilledActions: ui.notFulfilledActions ?? (notFulfilledFromRule.length > 0 ? notFulfilledFromRule : cloneActions(DEFAULT_NOT_FULFILLED_ACTIONS)),
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
  void initialSituationId; // wired up in Task 17
  void initialSeverityId; // wired up in Task 17
  const segments = useSegments();
  const checkpointTypes = useCheckpointTypes();
  const rules = useRules();
  const navigate = useNavigate();

  const existingRule = ruleId ? rules.find((r) => r.id === ruleId) : undefined;
  const initialState = useMemo(() => getInitialFormState(existingRule), [existingRule]);
  const isEdit = !!ruleId;

  const [selectedArea, setSelectedArea] = useState<Area>(
    initialState.selectedArea
  );
  const [selectedSituation, setSelectedSituation] = useState<RouteUiSituation | null>(
    initialState.selectedSituation
  );

  // Tracking records state
  const [selectedSituationId, setSelectedSituationId] = useState<string | null>(initialState.selectedSituationId);
  const [selectedSeverityId, setSelectedSeverityId] = useState<string | null>(initialState.selectedSeverityId);
  const [triggerType, setTriggerType] = useState<TrackingTriggerType>(initialState.triggerType);
  const [currentRecordConditions, setCurrentRecordConditions] = useState<Condition[]>(initialState.currentRecordConditions);
  const [historyConditions, setHistoryConditions] = useState<Condition[]>(initialState.historyConditions);
  const [noMovementDuration, setNoMovementDuration] = useState(initialState.noMovementDuration);
  const [noMovementUnit, setNoMovementUnit] = useState<"h" | "d" | "bd">(initialState.noMovementUnit);
  const [severityActions, setSeverityActions] = useState<SeverityActionRow[]>(initialState.severityActions);
  const [ruleName, setRuleName] = useState(initialState.ruleName);
  const [ruleDescription, setRuleDescription] = useState(initialState.ruleDescription);
  const [priority, setPriority] = useState<Priority>(initialState.priority);
  const [active, setActive] = useState(initialState.active);

  // Situation-specific state
  const [deliveryMilestone, setDeliveryMilestone] = useState(initialState.deliveryMilestone);
  const [checkTimes, setCheckTimes] = useState<string[]>(initialState.checkTimes);
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>(initialState.scheduleItems);
  const [vkrConditions, setVkrConditions] = useState<VkrCondition[]>(initialState.vkrConditions);
  const [routeScope, setRouteScope] = useState<RouteScope>(initialState.routeScope);
  const [missedMilestoneType, setMissedMilestoneType] = useState<string | undefined>(initialState.missedMilestoneType);
  
  const [tooLongMilestone, setTooLongMilestone] = useState(initialState.tooLongMilestone);
  const [tooLongThreshold, setTooLongThreshold] = useState<ThresholdLevel>(initialState.tooLongThreshold);
  const [checkInterval, setCheckInterval] = useState<CheckInterval>(initialState.checkInterval);

  // Actions
  const [fulfilledActions, setFulfilledActions] = useState<BranchAction[]>(
    initialState.fulfilledActions
  );
  const [notFulfilledActions, setNotFulfilledActions] = useState<BranchAction[]>(
    initialState.notFulfilledActions
  );
  const [advancedOpen, setAdvancedOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setSelectedArea(initialState.selectedArea);
    setSelectedSituation(initialState.selectedSituation);
    setSelectedSituationId(initialState.selectedSituationId);
    setSelectedSeverityId(initialState.selectedSeverityId);
    setTriggerType(initialState.triggerType);
    setCurrentRecordConditions(initialState.currentRecordConditions);
    setHistoryConditions(initialState.historyConditions);
    setNoMovementDuration(initialState.noMovementDuration);
    setNoMovementUnit(initialState.noMovementUnit);
    setSeverityActions(initialState.severityActions);
    setRuleName(initialState.ruleName);
    setRuleDescription(initialState.ruleDescription);
    setPriority(initialState.priority);
    setActive(initialState.active);
    setDeliveryMilestone(initialState.deliveryMilestone);
    setCheckTimes(initialState.checkTimes);
    setScheduleItems(initialState.scheduleItems);
    setVkrConditions(initialState.vkrConditions);
    setRouteScope(initialState.routeScope);
    setMissedMilestoneType(initialState.missedMilestoneType);
    
    setTooLongMilestone(initialState.tooLongMilestone);
    setTooLongThreshold(initialState.tooLongThreshold);
    setCheckInterval(initialState.checkInterval);
    setFulfilledActions(initialState.fulfilledActions);
    setNotFulfilledActions(initialState.notFulfilledActions);
  }, [initialState]);

  // Milestones with thresholds (for "too_long" situation)
  const milestonesWithThresholds = segments
    .flatMap((s) => s.checkpoints)
    .filter((cp) => cp.warnAfterHours || cp.criticalAfterHours)
    .map((cp) => ({
      id: cp.id,
      label: checkpointTypes.find((ct) => ct.id === cp.checkpointTypeId)?.name ?? cp.checkpointTypeId,
      warnAfterHours: cp.warnAfterHours,
      criticalAfterHours: cp.criticalAfterHours,
    }));

  function addAction(branch: "fulfilled" | "not_fulfilled") {
    const newAction: BranchAction = { id: "act_" + Date.now(), type: "create_vkr", title: "" };
    if (branch === "fulfilled") setFulfilledActions((prev) => [...prev, newAction]);
    else setNotFulfilledActions((prev) => [...prev, newAction]);
  }

  function removeAction(branch: "fulfilled" | "not_fulfilled", id: string) {
    if (branch === "fulfilled") setFulfilledActions((prev) => prev.filter((a) => a.id !== id));
    else setNotFulfilledActions((prev) => prev.filter((a) => a.id !== id));
  }

  function toggleTime(t: string) {
    setCheckTimes((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  }

  const isRouteCompliance = selectedArea === "route_compliance";
  const isTrackingRecords = selectedArea === "tracking_records";

  const situations = useSituations();
  const actionTags = useActionTags();
  const selectedSituationObj: Situation | undefined = situations.find((s) => s.id === selectedSituationId);
  const selectedSeverityObj: Severity | undefined = selectedSituationObj?.severities.find((s) => s.id === selectedSeverityId);

  function applySeverityTemplate(severity: Severity) {
    setRuleName(severity.vkrTitle);
    setRuleDescription(severity.vkrDescription ?? "");
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

  const triggerLabel = getTriggerLabel(selectedSituation, checkInterval);

  return (
    <div className="flex h-screen w-screen flex-col bg-background text-foreground">
      <AppHeader current="rules" />

      {/* OBLAST — vodorovná lišta */}
      <div className="flex items-center gap-1.5 border-b border-border bg-muted/20 px-4 py-2 overflow-x-auto">
        {AREAS.map((area) => {
          const Icon = resolveAreaIcon(area.icon);
          const isSelected = selectedArea === area.id;
          if (!area.enabled) {
            return (
              <div
                key={area.id}
                className="flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs opacity-40 cursor-not-allowed"
              >
                <Icon className="size-3.5 text-muted-foreground" />
                <span className="text-muted-foreground whitespace-nowrap">{area.label}</span>
                <span className="text-[10px] text-muted-foreground">brzy</span>
              </div>
            );
          }
          return (
            <button
              key={area.id}
              onClick={() => { setSelectedArea(area.id); setSelectedSituation(null); }}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
                isSelected ? "bg-primary-soft text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-3.5" />
              {area.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-1 min-h-0">
        {/* LEFT COLUMN — Situace + Závažnost (tracking) / Situace (route_compliance) */}
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

            {/* Situace (only for route_compliance) */}
            {isRouteCompliance && (
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Situace</div>
                <div className="flex flex-col gap-1.5">
                  {SITUATION_CARDS.map((card) => {
                    const isSelected = selectedSituation === card.id;
                    if (card.disabled) {
                      return (
                        <div
                          key={card.id}
                          className="flex items-start gap-2.5 rounded-lg border border-border px-3 py-2.5 opacity-40 cursor-not-allowed"
                        >
                          <span className="mt-0.5 text-muted-foreground">{card.icon}</span>
                          <div>
                            <div className="text-xs font-medium text-muted-foreground">{card.label}</div>
                            <div className="text-[10px] text-muted-foreground">nedostupné</div>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <button
                        key={card.id}
                        onClick={() => setSelectedSituation(card.id)}
                        className={cn(
                          "flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors",
                          isSelected
                            ? "border-primary bg-primary-soft/40 text-primary"
                            : "border-border hover:border-primary/30 hover:bg-muted/30 text-foreground"
                        )}
                      >
                        <span className={cn("mt-0.5", isSelected ? "text-primary" : "text-muted-foreground")}>{card.icon}</span>
                        <div>
                          <div className="text-xs font-medium">{card.label}</div>
                          <div className={cn("text-[10px]", isSelected ? "text-primary/70" : "text-muted-foreground")}>{card.trigger}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

          {/* Save button */}
          <div className="border-t border-border p-4 space-y-2">
            <button
              disabled={!ruleName || !selectedArea}
              onClick={() => {
                const id = existingRule?.id ?? ("rule_" + Date.now());
                const code = existingRule?.code ?? ("R" + Math.floor(Math.random() * 90 + 10));
                rulesStore.upsert({
                  id,
                  code,
                  name: ruleName,
                  description: ruleDescription || undefined,
                  area: selectedArea,
                  active,
                  priority: priority as Priority,
                  trigger: { kind: "condition_met", label: triggerLabel },
                  conditions: [],
                  actions: [...fulfilledActions, ...notFulfilledActions].map((a) => ({
                    id: a.id,
                    type: a.type as ActionType,
                    title: a.title,
                    vkrText: a.vkrText,
                    runWhenRouteCondition: fulfilledActions.includes(a) ? "fulfilled" : "not_fulfilled",
                  })),
                  uiState: {
                    selectedSituation,
                    selectedTrackingSituation,
                    deliveryMilestone,
                    checkTimes,
                    scheduleItems,
                    vkrConditions,
                    routeScope,
                    missedMilestoneType,
                    
                    tooLongMilestone,
                    tooLongThreshold,
                    checkInterval,
                    trackingConditions,
                    noMovementDuration,
                    noMovementUnit,
                    ignoreClearance,
                    stuckCount,
                    stuckMatchMode,
                    stuckInclude,
                    stuckExclude,
                    fulfilledActions,
                    notFulfilledActions,
                    trackingActions,
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

            {!isRouteCompliance && !isTrackingRecords && (
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

                {triggerType === "automatic" && (
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Podmínky současného záznamu
                    </div>
                    <CurrentRecordConditionsBuilder
                      conditions={currentRecordConditions}
                      onChange={setCurrentRecordConditions}
                    />
                  </div>
                )}

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
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Podmínky na historii záznamů
                  </div>
                  <TrackingHistoryConditionsBuilder
                    conditions={historyConditions}
                    onChange={setHistoryConditions}
                  />
                </div>

                {/* Podmínky z ostatních entit — sdíleno pro všechny tracking situace */}
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Podmínky z ostatních entit
                  </div>
                  <div className="text-[11px] text-muted-foreground mb-2">
                    Pravidlo se uplatní jen pro zásilky odpovídající těmto podmínkám (zákazník, zásilka…).
                  </div>
                  <VkrConditionsBuilder
                    conditions={vkrConditions}
                    onChange={setVkrConditions}
                  />
                </div>
              </>
            )}

            {isRouteCompliance && !selectedSituation && (
              <div className="rounded-xl border border-dashed border-border p-8 text-center">
                <div className="text-sm text-muted-foreground">
                  Vyber situaci v levém sloupci.
                </div>
              </div>
            )}

            {isRouteCompliance && selectedSituation && (
              <>
                {/* Locked trigger + Pokročilé mockup */}
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                  <Lock className="size-3.5 text-muted-foreground shrink-0" />
                  <div className="text-sm text-muted-foreground flex-1 min-w-0">
                    <span className="font-medium text-foreground">Spouštěč:</span> {triggerLabel}
                  </div>
                  <button
                    disabled
                    title="Brzy: ruční úprava triggeru (plán, podmínka, manuální)."
                    className="flex items-center gap-1 rounded-md border border-dashed border-border px-2 py-1 text-[11px] text-muted-foreground opacity-60 cursor-not-allowed"
                  >
                    <Settings2 className="size-3" /> Pokročilé
                  </button>
                </div>

                {/* Situation-specific config */}
                {selectedSituation === "delivery_day" && (
                  <>
                    <RouteScopePicker value={routeScope} onChange={setRouteScope} />
                    <DeliveryDayConfig
                      milestone={deliveryMilestone}
                      onMilestoneChange={setDeliveryMilestone}
                      scheduleItems={scheduleItems}
                      onScheduleItems={setScheduleItems}
                      checkpointTypes={checkpointTypes}
                    />
                  </>
                )}

                {selectedSituation === "unexpected_location" && (
                  <>
                    <RouteScopePicker value={routeScope} onChange={setRouteScope} />
                    <AutoSummary text="Podmínka je nastavena automaticky. Systém při každém příchozím tracking záznamu zkontroluje, zda země nebo lokace odpovídá některému bodu na standardní trase zásilky." />
                  </>
                )}

                {selectedSituation === "missed_milestone" && (
                  <>
                    <RouteScopePicker value={routeScope} onChange={setRouteScope} allowExclude />
                    <MilestoneTypePicker value={missedMilestoneType} onChange={setMissedMilestoneType} />
                    <AutoSummary text="Podmínka je nastavena automaticky. Systém sleduje vybraný typ milníku na trase zásilky. Jakmile uplyne časový limit a zásilka nemá platný tracking záznam, podmínka se splní. Časové limity nastavuješ v editoru trasy." />
                  </>
                )}

                {/* Podmínky věci k řešení (v prostředním sloupci) */}
                <VkrConditionsBuilder
                  conditions={vkrConditions}
                  onChange={setVkrConditions}
                />
              </>
            )}


          </div>
        </div>

        {/* RIGHT COLUMN — Akce */}
        <div className="flex w-[340px] shrink-0 flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Akce</div>


            {isRouteCompliance && (
              <>
                <ActionBranch
                  label="Podmínka splněna"
                  variant="fulfilled"
                  actions={fulfilledActions}
                  advancedOpen={advancedOpen}
                  onToggleAdvanced={(id) => setAdvancedOpen((p) => ({ ...p, [id]: !p[id] }))}
                  onAdd={() => addAction("fulfilled")}
                  onRemove={(id) => removeAction("fulfilled", id)}
                  onChangeType={(id, type) =>
                    setFulfilledActions((prev) => prev.map((a) => a.id === id ? { ...a, type } : a))
                  }
                  onChangeTitle={(id, title) =>
                    setFulfilledActions((prev) => prev.map((a) => a.id === id ? { ...a, title } : a))
                  }
                  onChangeVkrText={(id, vkrText) =>
                    setFulfilledActions((prev) => prev.map((a) => a.id === id ? { ...a, vkrText } : a))
                  }
                  onChangeShipmentConditions={(id, shipmentConditions) =>
                    setFulfilledActions((prev) => prev.map((a) => a.id === id ? { ...a, shipmentConditions } : a))
                  }
                />
                <ActionBranch
                  label="Podmínka nesplněna"
                  variant="not_fulfilled"
                  actions={notFulfilledActions}
                  advancedOpen={advancedOpen}
                  onToggleAdvanced={(id) => setAdvancedOpen((p) => ({ ...p, [id]: !p[id] }))}
                  onAdd={() => addAction("not_fulfilled")}
                  onRemove={(id) => removeAction("not_fulfilled", id)}
                  onChangeType={(id, type) =>
                    setNotFulfilledActions((prev) => prev.map((a) => a.id === id ? { ...a, type } : a))
                  }
                  onChangeTitle={(id, title) =>
                    setNotFulfilledActions((prev) => prev.map((a) => a.id === id ? { ...a, title } : a))
                  }
                  onChangeVkrText={(id, vkrText) =>
                    setNotFulfilledActions((prev) => prev.map((a) => a.id === id ? { ...a, vkrText } : a))
                  }
                  onChangeShipmentConditions={(id, shipmentConditions) =>
                    setNotFulfilledActions((prev) => prev.map((a) => a.id === id ? { ...a, shipmentConditions } : a))
                  }
                />
              </>
            )}

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

            {!isRouteCompliance && !isTrackingRecords && (
              <div className="rounded-xl border border-dashed border-border p-8 text-center">
                <div className="text-sm text-muted-foreground">Nejdříve vyber oblast vlevo.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Situation configs ──────────────────────────────────── */

function DeliveryDayConfig({
  milestone, onMilestoneChange, scheduleItems, onScheduleItems, checkpointTypes,
}: {
  milestone: string;
  onMilestoneChange: (v: string) => void;
  scheduleItems: ScheduleItem[];
  onScheduleItems: (v: ScheduleItem[]) => void;
  checkpointTypes: { id: string; name: string }[];
}) {
  const selectedMilestoneLabel =
    checkpointTypes.find((ct) => ct.id === milestone)?.name;


  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs font-medium mb-2">Výběr milníku</div>
        <div className="space-y-1.5">
          {checkpointTypes.map((ct) => (
            <label key={ct.id} className="flex items-center gap-2.5 cursor-pointer rounded-lg border border-border px-3 py-2 hover:bg-muted/30">
              <input
                type="radio"
                name="delivery_milestone"
                value={ct.id}
                checked={milestone === ct.id}
                onChange={() => onMilestoneChange(ct.id)}
                className="accent-primary"
              />
              <span className="text-sm">{ct.name}</span>
            </label>
          ))}
        </div>
      </div>

      <ScheduleEditor
        items={scheduleItems}
        onChange={onScheduleItems}
        milestoneLabel={selectedMilestoneLabel}
      />


      <div className="rounded-lg bg-muted/30 border border-border px-3 py-2 text-xs text-muted-foreground leading-relaxed">
        Kontrola proběhne pouze v den, kdy carrier avizuje doručení. Pokud předchozí kontrola dnes uspěla, pozdější se přeskočí automaticky.
      </div>
    </div>
  );
}

function TooLongConfig({
  milestones, selected, onSelect, threshold, onThreshold, interval, onInterval,
}: {
  milestones: { id: string; label: string; warnAfterHours?: number; criticalAfterHours?: number }[];
  selected: string;
  onSelect: (v: string) => void;
  threshold: ThresholdLevel;
  onThreshold: (v: ThresholdLevel) => void;
  interval: CheckInterval;
  onInterval: (v: CheckInterval) => void;
}) {
  const INTERVALS: { id: CheckInterval; label: string }[] = [
    { id: "30min", label: "30 min" },
    { id: "1h", label: "1 h" },
    { id: "2h", label: "2 h" },
    { id: "6h", label: "6 h" },
  ];

  const selectedMs = milestones.find((m) => m.id === selected);

  return (
    <div className="space-y-4">
      {milestones.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          Žádné milníky nemají nastavené prahy. Nastav je v editoru úseku.
        </div>
      ) : (
        <div>
          <div className="text-xs font-medium mb-2">Výběr milníku</div>
          <div className="space-y-1.5">
            {milestones.map((m) => (
              <label key={m.id} className="flex items-center gap-2.5 cursor-pointer rounded-lg border border-border px-3 py-2 hover:bg-muted/30">
                <input
                  type="radio"
                  name="too_long_milestone"
                  value={m.id}
                  checked={selected === m.id}
                  onChange={() => onSelect(m.id)}
                  className="accent-primary"
                />
                <div>
                  <div className="text-sm">{m.label}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {m.warnAfterHours && <span className="text-amber-600">Dlouho: {m.warnAfterHours} h</span>}
                    {m.warnAfterHours && m.criticalAfterHours && " · "}
                    {m.criticalAfterHours && <span className="text-red-600">Kriticky: {m.criticalAfterHours} h</span>}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="text-xs font-medium mb-2">Vyhodnocovat jako</div>
        <div className="flex gap-2">
          <button
            onClick={() => onThreshold("warn")}
            className={cn(
              "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
              threshold === "warn" ? "border-amber-500 bg-amber-50 text-amber-700" : "border-border hover:bg-muted"
            )}
          >
            Dlouho {selectedMs?.warnAfterHours && <span className="font-normal text-xs">({selectedMs.warnAfterHours} h)</span>}
          </button>
          <button
            onClick={() => onThreshold("critical")}
            className={cn(
              "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
              threshold === "critical" ? "border-red-500 bg-red-50 text-red-700" : "border-border hover:bg-muted"
            )}
          >
            Kriticky dlouho {selectedMs?.criticalAfterHours && <span className="font-normal text-xs">({selectedMs.criticalAfterHours} h)</span>}
          </button>
        </div>
      </div>

      <div>
        <div className="text-xs font-medium mb-2">Interval kontroly</div>
        <div className="flex gap-1.5 flex-wrap">
          {INTERVALS.map((i) => (
            <button
              key={i.id}
              onClick={() => onInterval(i.id)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                interval === i.id ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
              )}
            >
              {i.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg bg-muted/30 border border-border px-3 py-2 text-xs text-muted-foreground leading-relaxed">
        Pravidlo se spouští opakovaně v nastaveném intervalu. Podmínka se splní, pokud zásilka na milníku setrvává déle, než odpovídá zvolenému prahu.
      </div>
    </div>
  );
}

function AutoSummary({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 px-4 py-4 text-sm text-muted-foreground leading-relaxed">
      {text}
    </div>
  );
}

/* ─── Action Branch ──────────────────────────────────────── */

function ActionBranch({
  label, variant, actions, advancedOpen, onToggleAdvanced, onAdd, onRemove, onChangeType, onChangeTitle, onChangeVkrText, onChangeShipmentConditions,
}: {
  label: string;
  variant: "fulfilled" | "not_fulfilled";
  actions: BranchAction[];
  advancedOpen: Record<string, boolean>;
  onToggleAdvanced: (id: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onChangeType: (id: string, type: string) => void;
  onChangeTitle: (id: string, title: string) => void;
  onChangeVkrText: (id: string, vkrText: string) => void;
  onChangeShipmentConditions: (id: string, conditions: VkrCondition[]) => void;
}) {
  const isFulfilled = variant === "fulfilled";
  return (
    <div className={cn(
      "rounded-xl border overflow-hidden",
      isFulfilled ? "border-green-200" : "border-red-200"
    )}>
      <div className={cn(
        "px-3 py-2 text-xs font-semibold",
        isFulfilled ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
      )}>
        {label}
      </div>
      <div className="p-3 space-y-2">
        {actions.length === 0 && (
          <div className="text-xs text-muted-foreground italic">Žádná akce.</div>
        )}
        {actions.map((action) => (
          <div key={action.id} className="rounded-lg border border-border bg-background p-2.5">
            <div className="flex items-center gap-2 mb-2">
              <select
                value={action.type}
                onChange={(e) => onChangeType(action.id, e.target.value)}
                className="flex-1 rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none"
              >
                {ACTION_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
              <button onClick={() => onRemove(action.id)} className="text-muted-foreground hover:text-foreground">
                <X className="size-3.5" />
              </button>
            </div>
            {(action.type === "create_vkr" || action.type === "update_vkr") && (
              <input
                value={action.title}
                onChange={(e) => onChangeTitle(action.id, e.target.value)}
                placeholder={action.type === "create_vkr" ? "Název VkŘ · {{shipment.reference}}" : "VkŘ obsahuje název…"}
                className="w-full rounded border border-border bg-muted/30 px-2 py-1 text-xs focus:outline-none"
              />
            )}
            <div className="mt-2">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">
                Text věci k řešení (volitelný)
              </label>
              <Textarea
                value={action.vkrText ?? ""}
                onChange={(e) => onChangeVkrText(action.id, e.target.value)}
                placeholder="Co má operátor udělat / co se stalo…"
                rows={2}
                className="resize-none text-xs"
              />
            </div>
            {action.type === "create_vkr" && (
              <div className="mt-2 text-[10px] text-muted-foreground">
                Pokud VkŘ se stejným názvem existuje, nová se nevytvoří.
              </div>
            )}
            {/* Podmínky zásilky — per akce */}
            <div className="mt-2">
              <VkrConditionsBuilder
                conditions={action.shipmentConditions ?? []}
                onChange={(next) => onChangeShipmentConditions(action.id, next)}
                title="Podmínky zásilky"
                emptyText="Bez podmínek — akce se spustí vždy, když je vyhodnocena větev."
              />
            </div>
            {/* Advanced toggle */}
            <button
              onClick={() => onToggleAdvanced(action.id)}
              className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
            >
              {advancedOpen[action.id] ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
              Pokročilé nastavení
            </button>
            {advancedOpen[action.id] && (
              <div className="mt-2 space-y-2 rounded-md bg-muted/30 p-2 text-xs text-muted-foreground">
                <div>
                  <div className="font-medium text-foreground">Deduplikace</div>
                  <div>Při vytvoření VkŘ se přeskočí, pokud již existuje stejný název.</div>
                </div>
              </div>
            )}
          </div>
        ))}
        <button
          onClick={onAdd}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/30 transition-colors"
        >
          <Plus className="size-3.5" /> Přidat akci
        </button>
      </div>
    </div>
  );
}

/* ─── Helpers ────────────────────────────────────────────── */

function getTriggerLabel(situation: RouteUiSituation | null, interval: CheckInterval): string {
  if (!situation) return "—";
  const intervalLabel: Record<CheckInterval, string> = {
    "30min": "30 min",
    "1h": "1 h",
    "2h": "2 h",
    "6h": "6 h",
  };
  switch (situation) {
    case "delivery_day": return "Časový plán — v den doručení";
    case "unexpected_location": return "Reaktivní — při každém tracking záznamu";
    case "missed_milestone": return "Reaktivní — při překročení časového limitu milníku";
    case "other": return "—";
  }
}

/* ─── Migrace starých VkŘ podmínek ──────────────────────── */

type LegacyCarrierDate = { enabled: boolean; operator: "is_today" | "is_tomorrow" | "within_days"; days?: number };
type LegacyCustomer = { enabled: boolean; operator: "is" | "is_not"; value: "new" | "longterm" };

function convertLegacyVkrConditions(ui: Partial<RuleCreatorUiState> & {
  vkrConditionCarrierDate?: LegacyCarrierDate;
  vkrConditionCustomer?: LegacyCustomer;
}): VkrCondition[] {
  const out: VkrCondition[] = [];
  const cd = ui.vkrConditionCarrierDate;
  if (cd?.enabled) {
    out.push({
      id: "vc_legacy_carrier",
      fieldId: "carrier_announced_delivery_at",
      operator: cd.operator,
      value: cd.operator === "within_days" ? String(cd.days ?? 3) : "",
    });
  }
  const cu = ui.vkrConditionCustomer;
  if (cu?.enabled) {
    out.push({
      id: "vc_legacy_customer",
      fieldId: "customer.tenure",
      operator: cu.operator,
      value: cu.value,
    });
  }
  return out;
}

