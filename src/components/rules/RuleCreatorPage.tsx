import { useState } from "react";
import { Lock, Clock, MapPin, AlertTriangle, Zap, ChevronDown, ChevronUp, Plus, X } from "lucide-react";
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
  const triggerLabel = getTriggerLabel(selectedSituation, checkInterval);

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

            {/* Meta */}
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Nastavení pravidla</div>
              <div className="space-y-3">
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
            </div>
          </div>

          {/* Save button */}
          <div className="border-t border-border p-4">
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
          </div>
        </div>

        {/* MIDDLE COLUMN — Spouštěč + Podmínky */}
        <div className="flex flex-1 min-w-0 flex-col border-r border-border">
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {!isRouteCompliance && (
              <div className="rounded-xl border border-dashed border-border p-8 text-center">
                <div className="text-sm text-muted-foreground">
                  Konfigurace podmínek pro tuto oblast bude přidána později.
                </div>
              </div>
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

            {isRouteCompliance ? (
              <>
                {/* Fulfilled branch */}
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

                {/* Not fulfilled branch */}
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
            ) : (
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

/* ─── Helpers ────────────────────────────────────────────── */

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
