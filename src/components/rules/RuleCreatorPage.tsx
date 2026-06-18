import { useState } from "react";
import { Lock, Clock, MapPin, AlertTriangle, Zap, ChevronDown, ChevronUp, Plus, X, Radio, PauseCircle, LocateFixed } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { AREAS } from "@/lib/model/areas";
import { resolveAreaIcon } from "@/components/common/areaIcons";
import { useSegments, useCheckpointTypes, useRules, rulesStore } from "@/lib/model/store";
import { cn } from "@/lib/utils";
import type { Area } from "@/lib/model/types";

type Situation = "delivery_day" | "unexpected_location" | "missed_milestone" | "too_long" | "other";
type CheckInterval = "30min" | "1h" | "2h" | "6h";
type ThresholdLevel = "warn" | "critical";
interface SkipCondition { id: string; ruleId: string; outcome: "positive" | "negative" | "any"; }

type TrackingSituation = "tracking_event" | "no_movement" | "stuck_location";
interface TrackingConditionRow { id: string; field: string; operator: string; value: string; }
type StuckMatchMode = "locationId" | "city" | "countryCode";

const TRACKING_SITUATION_CARDS: { id: TrackingSituation; icon: React.ReactNode; label: string; trigger: string }[] = [
  {
    id: "tracking_event",
    icon: <Radio className="size-4" />,
    label: "Přišel konkrétní tracking záznam",
    trigger: "Reaktivní — při každém novém záznamu",
  },
  {
    id: "no_movement",
    icon: <PauseCircle className="size-4" />,
    label: "Zásilka bez pohybu po stanovenou dobu",
    trigger: "Časový plán — kontroluje periodicky",
  },
  {
    id: "stuck_location",
    icon: <LocateFixed className="size-4" />,
    label: "Zásilka zaseknutá na jednom místě",
    trigger: "Reaktivní — při každém novém záznamu",
  },
];

const TRACKING_FIELDS: { value: string; label: string; group: string }[] = [
  { value: "eventType", label: "Typ záznamu (eventType)", group: "Typ a status" },
  { value: "derivedStatus", label: "Odvozený status", group: "Typ a status" },
  { value: "derivedStatusCode", label: "Kód odvozeného statusu", group: "Typ a status" },
  { value: "eventDescription", label: "Popis události", group: "Typ a status" },
  { value: "exceptionCode", label: "Kód výjimky", group: "Výjimka" },
  { value: "exceptionDescription", label: "Popis výjimky", group: "Výjimka" },
  { value: "locationType", label: "Typ místa", group: "Lokace" },
  { value: "locationId", label: "ID místa", group: "Lokace" },
  { value: "city", label: "Město", group: "Lokace" },
  { value: "countryCode", label: "Kód země", group: "Lokace" },
  { value: "postalCode", label: "PSČ", group: "Lokace" },
  { value: "deliveryAttempts", label: "Počet pokusů o doručení", group: "Doručení" },
  { value: "eventTime", label: "Čas záznamu (eventTime)", group: "Čas" },
];

const TRACKING_OPERATORS = ["je jedním z", "není žádným z", "je", "není", "obsahuje", "je větší než", "je menší nebo rovno"];

const SITUATION_CARDS: {
  id: Situation;
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
    label: "Zásilka zmeškala milník",
    trigger: "Reaktivní (condition_met)",
  },
  {
    id: "too_long",
    icon: <Clock className="size-4" />,
    label: "Zásilka příliš dlouho na milníku",
    trigger: "Časový plán — interval (schedule)",
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
}

export function RuleCreatorPage() {
  const segments = useSegments();
  const checkpointTypes = useCheckpointTypes();
  const rules = useRules();

  const [selectedArea, setSelectedArea] = useState<Area>("route_compliance");
  const [selectedSituation, setSelectedSituation] = useState<Situation | null>(null);

  // Tracking records state
  const [selectedTrackingSituation, setSelectedTrackingSituation] = useState<TrackingSituation | null>(null);
  const [trackingConditions, setTrackingConditions] = useState<TrackingConditionRow[]>([
    { id: "tc_1", field: "derivedStatus", operator: "je jedním z", value: "" },
  ]);
  const [noMovementDuration, setNoMovementDuration] = useState(72);
  const [noMovementUnit, setNoMovementUnit] = useState<"h" | "d" | "bd">("h");
  const [ignoreClearance, setIgnoreClearance] = useState(true);
  const [stuckCount, setStuckCount] = useState(4);
  const [stuckMatchMode, setStuckMatchMode] = useState<StuckMatchMode>("city");
  const [stuckInclude, setStuckInclude] = useState<TrackingConditionRow[]>([]);
  const [stuckExclude, setStuckExclude] = useState<TrackingConditionRow[]>([]);
  const [ruleName, setRuleName] = useState("");
  const [priority, setPriority] = useState("medium");
  const [active, setActive] = useState(true);

  // Situation-specific state
  const [deliveryMilestone, setDeliveryMilestone] = useState("ct_first_scan");
  const [checkTimes, setCheckTimes] = useState<string[]>(["08:00", "10:00"]);
  const [skipConditions, setSkipConditions] = useState<SkipCondition[]>([]);
  const [tooLongMilestone, setTooLongMilestone] = useState("");
  const [tooLongThreshold, setTooLongThreshold] = useState<ThresholdLevel>("warn");
  const [checkInterval, setCheckInterval] = useState<CheckInterval>("1h");

  // Actions
  const [fulfilledActions, setFulfilledActions] = useState<BranchAction[]>([]);
  const [notFulfilledActions, setNotFulfilledActions] = useState<BranchAction[]>([
    { id: "act_1", type: "create_vkr", title: "Soulad s trasou — nesplněno · {{shipment.reference}}" },
  ]);
  const [trackingActions, setTrackingActions] = useState<BranchAction[]>([]);
  const [advancedOpen, setAdvancedOpen] = useState<Record<string, boolean>>({});

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
  const triggerLabel = getTriggerLabel(selectedSituation, checkInterval);
  const trackingTriggerLabel = getTrackingTriggerLabel(selectedTrackingSituation);

  return (
    <div className="flex h-screen w-screen flex-col bg-background text-foreground">
      <AppHeader current="rules" />

      <div className="flex flex-1 min-h-0">
        {/* LEFT COLUMN — Oblast + Situace + Meta */}
        <div className="flex w-[280px] shrink-0 flex-col border-r border-border">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Oblast */}
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Oblast</div>
              <div className="flex flex-col gap-1">
                {AREAS.map((area) => {
                  const Icon = resolveAreaIcon(area.icon);
                  const isSelected = selectedArea === area.id;
                  if (!area.enabled) {
                    return (
                      <div
                        key={area.id}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 opacity-40 cursor-not-allowed"
                      >
                        <Icon className="size-4 shrink-0 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground truncate">{area.label}</span>
                        <span className="ml-auto text-[10px] text-muted-foreground shrink-0">brzy</span>
                      </div>
                    );
                  }
                  return (
                    <button
                      key={area.id}
                      onClick={() => { setSelectedArea(area.id); setSelectedSituation(null); }}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors",
                        isSelected ? "bg-primary-soft text-primary" : "hover:bg-muted text-foreground"
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="text-sm truncate">{area.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Situace (tracking_records) */}
            {isTrackingRecords && (
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Situace</div>
                <div className="flex flex-col gap-1.5">
                  {TRACKING_SITUATION_CARDS.map((card) => {
                    const isSelected = selectedTrackingSituation === card.id;
                    return (
                      <button
                        key={card.id}
                        onClick={() => setSelectedTrackingSituation(card.id)}
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
                const id = "rule_" + Date.now();
                rulesStore.upsert({
                  id,
                  code: "R" + Math.floor(Math.random() * 90 + 10),
                  name: ruleName,
                  area: selectedArea,
                  active,
                  priority: priority as any,
                  trigger: { kind: "condition_met", label: triggerLabel },
                  conditions: [],
                  actions: [...fulfilledActions, ...notFulfilledActions].map((a) => ({
                    id: a.id,
                    type: a.type as any,
                    title: a.title,
                    runWhenRouteCondition: fulfilledActions.includes(a) ? "fulfilled" : "not_fulfilled",
                  })),
                });
                alert("Pravidlo uloženo (prototyp — navigace není dokončena).");
              }}
              className={cn(
                "w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                ruleName ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              Uložit pravidlo
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
                <label className="text-xs text-muted-foreground mb-1 block">Priorita</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
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

            {isTrackingRecords && !selectedTrackingSituation && (
              <div className="rounded-xl border border-dashed border-border p-8 text-center">
                <div className="text-sm text-muted-foreground">Vyber situaci v levém sloupci.</div>
              </div>
            )}

            {isTrackingRecords && selectedTrackingSituation && (
              <>
                <div className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                  <Lock className="size-3.5 text-muted-foreground shrink-0" />
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Spouštěč:</span> {trackingTriggerLabel}
                  </div>
                </div>

                {selectedTrackingSituation === "tracking_event" && (
                  <TrackingEventConfig
                    conditions={trackingConditions}
                    onConditions={setTrackingConditions}
                  />
                )}
                {selectedTrackingSituation === "no_movement" && (
                  <NoMovementConfig
                    duration={noMovementDuration}
                    onDuration={setNoMovementDuration}
                    unit={noMovementUnit}
                    onUnit={setNoMovementUnit}
                    ignoreClearance={ignoreClearance}
                    onIgnoreClearance={setIgnoreClearance}
                  />
                )}
                {selectedTrackingSituation === "stuck_location" && (
                  <StuckLocationConfig
                    count={stuckCount}
                    onCount={setStuckCount}
                    matchMode={stuckMatchMode}
                    onMatchMode={setStuckMatchMode}
                    include={stuckInclude}
                    onInclude={setStuckInclude}
                    exclude={stuckExclude}
                    onExclude={setStuckExclude}
                  />
                )}
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
                {/* Locked trigger */}
                <div className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                  <Lock className="size-3.5 text-muted-foreground shrink-0" />
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Spouštěč:</span> {triggerLabel}
                  </div>
                </div>

                {/* Situation-specific config */}
                {selectedSituation === "delivery_day" && (
                  <DeliveryDayConfig
                    milestone={deliveryMilestone}
                    onMilestoneChange={setDeliveryMilestone}
                    checkTimes={checkTimes}
                    onToggleTime={toggleTime}
                    checkpointTypes={checkpointTypes}
                    skipConditions={skipConditions}
                    onSkipConditions={setSkipConditions}
                    availableRules={rules}
                  />
                )}

                {selectedSituation === "unexpected_location" && (
                  <AutoSummary text="Podmínka je nastavena automaticky. Systém při každém příchozím tracking záznamu zkontroluje, zda země nebo lokace odpovídá některému bodu na standardní trase zásilky." />
                )}

                {selectedSituation === "missed_milestone" && (
                  <AutoSummary text="Podmínka je nastavena automaticky. Systém sleduje každý milník definovaný na trase zásilky. Jakmile uplyne časový limit milníku a zásilka nemá platný tracking záznam, podmínka se splní. Časové limity nastavuješ v editoru trasy." />
                )}

                {selectedSituation === "too_long" && (
                  <TooLongConfig
                    milestones={milestonesWithThresholds}
                    selected={tooLongMilestone}
                    onSelect={setTooLongMilestone}
                    threshold={tooLongThreshold}
                    onThreshold={setTooLongThreshold}
                    interval={checkInterval}
                    onInterval={setCheckInterval}
                  />
                )}
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
                />
              </>
            )}

            {isTrackingRecords && (
              <ActionBranch
                label="Podmínka splněna"
                variant="fulfilled"
                actions={trackingActions}
                advancedOpen={advancedOpen}
                onToggleAdvanced={(id) => setAdvancedOpen((p) => ({ ...p, [id]: !p[id] }))}
                onAdd={() => setTrackingActions((prev) => [...prev, { id: "ta_" + Date.now(), type: "create_vkr", title: "" }])}
                onRemove={(id) => setTrackingActions((prev) => prev.filter((a) => a.id !== id))}
                onChangeType={(id, type) =>
                  setTrackingActions((prev) => prev.map((a) => a.id === id ? { ...a, type } : a))
                }
                onChangeTitle={(id, title) =>
                  setTrackingActions((prev) => prev.map((a) => a.id === id ? { ...a, title } : a))
                }
              />
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
  milestone, onMilestoneChange, checkTimes, onToggleTime, checkpointTypes,
  skipConditions, onSkipConditions, availableRules,
}: {
  milestone: string;
  onMilestoneChange: (v: string) => void;
  checkTimes: string[];
  onToggleTime: (t: string) => void;
  checkpointTypes: { id: string; name: string }[];
  skipConditions: SkipCondition[];
  onSkipConditions: (v: SkipCondition[]) => void;
  availableRules: { id: string; name: string }[];
}) {
  const TIMES = ["08:00", "09:00", "10:00"];

  function addSkip() {
    onSkipConditions([
      ...skipConditions,
      { id: "skip_" + Date.now(), ruleId: availableRules[0]?.id ?? "", outcome: "positive" },
    ]);
  }

  function updateSkip(id: string, patch: Partial<SkipCondition>) {
    onSkipConditions(skipConditions.map((s) => s.id === id ? { ...s, ...patch } : s));
  }

  function removeSkip(id: string) {
    onSkipConditions(skipConditions.filter((s) => s.id !== id));
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs font-medium mb-2">Výběr milníku</div>
        <div className="space-y-1.5">
          {checkpointTypes.slice(0, 2).map((ct) => (
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
      <div>
        <div className="text-xs font-medium mb-2">Časy kontroly</div>
        <div className="flex gap-2">
          {TIMES.map((t) => (
            <button
              key={t}
              onClick={() => onToggleTime(t)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                checkTimes.includes(t) ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
        Časová zóna: automaticky dle cílové země zásilky.
      </div>

      {/* Přeskočení běhu */}
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Přeskočení běhu
        </div>

        {skipConditions.length === 0 && (
          <div className="rounded-lg border border-dashed border-border px-3 py-2.5 text-xs text-muted-foreground italic mb-2">
            Žádné podmínky přeskočení.
          </div>
        )}

        {skipConditions.map((skip) => (
          <div key={skip.id} className="mb-2 flex items-center gap-2">
            <span className="text-xs text-muted-foreground shrink-0">Pokud pravidlo</span>
            <select
              value={skip.ruleId}
              onChange={(e) => updateSkip(skip.id, { ruleId: e.target.value })}
              className="flex-1 min-w-0 rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none"
            >
              {availableRules.length === 0 && (
                <option value="">— žádná pravidla —</option>
              )}
              {availableRules.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            <span className="text-xs text-muted-foreground shrink-0">dopadlo</span>
            <select
              value={skip.outcome}
              onChange={(e) => updateSkip(skip.id, { outcome: e.target.value as SkipCondition["outcome"] })}
              className="rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none"
            >
              <option value="positive">pozitivně</option>
              <option value="negative">negativně</option>
              <option value="any">jakkoliv</option>
            </select>
            <button onClick={() => removeSkip(skip.id)} className="text-muted-foreground hover:text-foreground shrink-0">
              <X className="size-3.5" />
            </button>
          </div>
        ))}

        <button
          onClick={addSkip}
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <Plus className="size-3" /> přidat přeskočení
        </button>
      </div>

      <div className="rounded-lg bg-muted/30 border border-border px-3 py-2 text-xs text-muted-foreground leading-relaxed">
        Kontrola proběhne pouze v den, kdy carrier avizuje doručení. Pokud předchozí kontrola uspěla, pozdější se přeskočí automaticky.
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
  label, variant, actions, advancedOpen, onToggleAdvanced, onAdd, onRemove, onChangeType, onChangeTitle,
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
            {action.type === "create_vkr" && (
              <div className="mt-2 text-[10px] text-muted-foreground">
                Pokud VkŘ se stejným názvem existuje, nová se nevytvoří.
              </div>
            )}
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
                  <div className="font-medium text-foreground mb-1">Vyhodnotit jen pokud</div>
                  <button className="flex items-center gap-1 text-primary text-xs hover:underline">
                    <Plus className="size-3" /> přidat podmínku
                  </button>
                </div>
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

/* ─── Tracking configs ───────────────────────────────────── */

function TrackingFieldSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const groups = Array.from(new Set(TRACKING_FIELDS.map((f) => f.group)));
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded border border-border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
      style={{ minWidth: 160 }}
    >
      {groups.map((g) => (
        <optgroup key={g} label={g}>
          {TRACKING_FIELDS.filter((f) => f.group === g).map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

function TrackingConditionBuilder({
  conditions,
  onConditions,
  simple = false,
}: {
  conditions: TrackingConditionRow[];
  onConditions: (rows: TrackingConditionRow[]) => void;
  simple?: boolean;
}) {
  function addRow() {
    onConditions([...conditions, { id: "tc_" + Date.now(), field: "derivedStatus", operator: "je jedním z", value: "" }]);
  }
  function removeRow(id: string) {
    if (conditions.length <= 1 && !simple) return;
    onConditions(conditions.filter((r) => r.id !== id));
  }
  function update(id: string, patch: Partial<TrackingConditionRow>) {
    onConditions(conditions.map((r) => r.id === id ? { ...r, ...patch } : r));
  }

  return (
    <div className="space-y-1.5">
      {conditions.map((row, idx) => (
        <div key={row.id}>
          {idx > 0 && (
            <div className="flex items-center gap-2 my-1">
              <div className="flex-1 border-t border-dashed border-border" />
              <span className="text-[10px] font-bold text-primary bg-primary-soft/30 border border-primary/20 rounded px-1.5 py-0.5">A</span>
              <div className="flex-1 border-t border-dashed border-border" />
            </div>
          )}
          <div className="flex items-center gap-1.5 flex-wrap">
            <TrackingFieldSelect value={row.field} onChange={(v) => update(row.id, { field: v })} />
            <select
              value={row.operator}
              onChange={(e) => update(row.id, { operator: e.target.value })}
              className="rounded border border-border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
              style={{ minWidth: 120 }}
            >
              {TRACKING_OPERATORS.map((op) => <option key={op}>{op}</option>)}
            </select>
            <input
              value={row.value}
              onChange={(e) => update(row.id, { value: e.target.value })}
              placeholder="hodnota…"
              className="flex-1 min-w-[100px] rounded border border-border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
            <button
              onClick={() => removeRow(row.id)}
              disabled={conditions.length <= 1 && !simple}
              className="text-muted-foreground hover:text-foreground disabled:opacity-30"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      ))}
      <button
        onClick={addRow}
        className="mt-1 flex items-center gap-1 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
      >
        <Plus className="size-3" /> přidat podmínku
      </button>
    </div>
  );
}

function TrackingEventConfig({
  conditions, onConditions,
}: {
  conditions: TrackingConditionRow[];
  onConditions: (rows: TrackingConditionRow[]) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Nový záznam musí splňovat
        </div>
        <TrackingConditionBuilder conditions={conditions} onConditions={onConditions} />
      </div>
      <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2.5 text-xs text-blue-700 leading-relaxed">
        Více podmínek se vyhodnocuje jako <strong>A (AND)</strong>. Pro alternativy (status A nebo B) zadej hodnoty do jedné podmínky oddělené čárkou.
      </div>
    </div>
  );
}

function NoMovementConfig({
  duration, onDuration, unit, onUnit, ignoreClearance, onIgnoreClearance,
}: {
  duration: number;
  onDuration: (v: number) => void;
  unit: "h" | "d" | "bd";
  onUnit: (v: "h" | "d" | "bd") => void;
  ignoreClearance: boolean;
  onIgnoreClearance: (v: boolean) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Zásilka nemá nový záznam déle než
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            value={duration}
            onChange={(e) => onDuration(Number(e.target.value))}
            className="w-20 rounded border border-border bg-background px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <select
            value={unit}
            onChange={(e) => onUnit(e.target.value as "h" | "d" | "bd")}
            className="rounded border border-border bg-background px-2 py-1.5 text-xs focus:outline-none"
          >
            <option value="h">hodin</option>
            <option value="d">dní</option>
            <option value="bd">pracovních dní</option>
          </select>
          <span className="text-xs text-muted-foreground">od posledního záznamu</span>
        </div>
      </div>

      <div className="border-t border-border" />

      <div
        className="flex items-center gap-3 cursor-pointer"
        onClick={() => onIgnoreClearance(!ignoreClearance)}
      >
        <button
          className={cn(
            "relative inline-block h-5 w-9 rounded-full transition-colors shrink-0",
            ignoreClearance ? "bg-primary" : "bg-muted"
          )}
        >
          <span className={cn(
            "absolute top-0.5 size-4 rounded-full bg-white transition-all shadow",
            ignoreClearance ? "right-0.5" : "left-0.5"
          )} />
        </button>
        <span className="text-xs text-muted-foreground leading-snug">
          Ignorovat dobu na celním řízení (stav = Celní řízení se nezapočítává)
        </span>
      </div>

      <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2.5 text-xs text-blue-700 leading-relaxed">
        Systém nemá pro tuto situaci přirozený spouštěč. Podmínka se kontroluje v pravidelném časovém plánu — typicky 2× denně.
      </div>
    </div>
  );
}

function StuckLocationConfig({
  count, onCount, matchMode, onMatchMode, include, onInclude, exclude, onExclude,
}: {
  count: number;
  onCount: (v: number) => void;
  matchMode: StuckMatchMode;
  onMatchMode: (v: StuckMatchMode) => void;
  include: TrackingConditionRow[];
  onInclude: (rows: TrackingConditionRow[]) => void;
  exclude: TrackingConditionRow[];
  onExclude: (rows: TrackingConditionRow[]) => void;
}) {
  const MATCH_OPTIONS: { id: StuckMatchMode; label: string; sub: string }[] = [
    { id: "locationId", label: "ID místa", sub: "locationId" },
    { id: "city", label: "Město", sub: "city" },
    { id: "countryCode", label: "Kód země", sub: "countryCode" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Počet po sobě jdoucích záznamů ze stejného místa
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={2}
            value={count}
            onChange={(e) => onCount(Number(e.target.value))}
            className="w-20 rounded border border-border bg-background px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <span className="text-xs text-muted-foreground">po sobě jdoucích záznamů</span>
        </div>
      </div>

      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Shoda místa podle</div>
        <div className="flex gap-2">
          {MATCH_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => onMatchMode(opt.id)}
              className={cn(
                "flex-1 rounded-lg border px-3 py-2 text-center text-xs font-medium transition-colors",
                matchMode === opt.id
                  ? "border-primary bg-primary-soft/30 text-primary"
                  : "border-border hover:border-primary/30 text-muted-foreground hover:text-foreground"
              )}
            >
              <div>{opt.label}</div>
              <div className={cn("text-[10px]", matchMode === opt.id ? "text-primary/70" : "text-muted-foreground")}>{opt.sub}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-border" />

      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Záznamy obsahují statusy <span className="font-normal normal-case">(volitelně)</span>
        </div>
        <TrackingConditionBuilder conditions={include} onConditions={onInclude} simple />
        {include.length === 0 && (
          <button
            onClick={() => onInclude([{ id: "inc_" + Date.now(), field: "derivedStatus", operator: "je jedním z", value: "" }])}
            className="mt-1 flex items-center gap-1 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <Plus className="size-3" /> přidat status k zahrnutí
          </button>
        )}
      </div>

      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Záznamy neobsahují statusy <span className="font-normal normal-case">(volitelně)</span>
        </div>
        {exclude.length > 0 && (
          <TrackingConditionBuilder conditions={exclude} onConditions={onExclude} simple />
        )}
        {exclude.length === 0 && (
          <button
            onClick={() => onExclude([{ id: "exc_" + Date.now(), field: "derivedStatus", operator: "je jedním z", value: "" }])}
            className="mt-1 flex items-center gap-1 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <Plus className="size-3" /> přidat status k vyloučení
          </button>
        )}
      </div>

      <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2.5 text-xs text-blue-700 leading-relaxed">
        Systém porovnává posledních N záznamů. Záznamy bez lokace (např. „Label created") se přeskakují.
      </div>
    </div>
  );
}

/* ─── Helpers ────────────────────────────────────────────── */

function getTrackingTriggerLabel(situation: TrackingSituation | null): string {
  switch (situation) {
    case "tracking_event": return "Reaktivní — při každém novém tracking záznamu";
    case "no_movement": return "Časový plán (schedule) — systém kontroluje periodicky";
    case "stuck_location": return "Reaktivní — při každém novém tracking záznamu";
    default: return "—";
  }
}

function getTriggerLabel(situation: Situation | null, interval: CheckInterval): string {
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
    case "too_long": return `Časový plán — každých ${intervalLabel[interval]}`;
    case "other": return "—";
  }
}
