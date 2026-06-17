import { useMemo, useState } from "react";
import { X, Mail, FileEdit, AlertCircle, Pencil, ListChecks, Hand, Bell, PlayCircle, History as HistoryIcon, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Action, ConditionGroup, Condition, Rule } from "@/lib/vkr/types";
import { isGroup } from "@/lib/vkr/types";
import { fieldById, OPERATOR_LABELS, TRIGGER_LABELS, ACTION_LABELS, stateOperatorLabel, durationAnchorLabel, describeSchedule } from "@/lib/vkr/fields";
import { FOLDERS } from "@/lib/vkr/mockData";
import { cn } from "@/lib/utils";

const ACTION_ICON: Record<string, typeof Mail> = {
  create_vkr: ListChecks,
  send_email: Mail,
  set_field: FileEdit,
  change_phase: FileEdit,
  update_vkr: Bell,
  add_note: FileEdit,
  request_field_from_operator: ListChecks,
};

const ACTION_TAG: Record<string, { label: string; cls: string }> = {
  create_vkr: { label: "Vytvořit VkŘ", cls: "bg-warning/20 text-warning-foreground" },
  send_email: { label: "Email", cls: "bg-info/15 text-info-foreground" },
  set_field: { label: "Změnit pole", cls: "bg-success/20 text-success-foreground" },
  change_phase: { label: "Změnit fázi", cls: "bg-success/20 text-success-foreground" },
  update_vkr: { label: "Eskalovat", cls: "bg-destructive/15 text-destructive" },
  add_note: { label: "Poznámka", cls: "bg-muted text-muted-foreground" },
  request_field_from_operator: { label: "Vyžádat vyplnění pole", cls: "bg-warning/20 text-warning-foreground" },
};

export function RuleDetailPanel({
  rule, onClose, onEdit,
}: {
  rule: Rule | null;
  onClose: () => void;
  onEdit: (rule: Rule) => void;
}) {
  if (!rule) {
    return (
      <aside className="hidden h-full w-[460px] shrink-0 border-l border-border bg-surface xl:flex xl:flex-col">
        <div className="m-auto max-w-[260px] text-center text-sm text-muted-foreground">
          <AlertCircle className="mx-auto mb-3 size-6 text-muted-foreground/60" />
          Vyber pravidlo ze seznamu pro zobrazení detailu, shrnutí, testu a historie.
        </div>
      </aside>
    );
  }

  const folder = FOLDERS.find((f) => f.id === rule.folderId);

  return (
    <aside className="flex h-full w-[460px] shrink-0 flex-col border-l border-border bg-surface">
      <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            <Hand className="size-3.5" /> {rule.code} · {folder?.code} {folder?.name}
          </div>
          <h3 className="mt-1 text-base font-semibold leading-snug">{rule.name}</h3>
        </div>
        <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <X className="size-4" />
        </button>
      </div>

      <Tabs defaultValue="summary" className="flex min-h-0 flex-1 flex-col">
        <TabsList className="mx-5 grid w-auto grid-cols-3">
          <TabsTrigger value="summary" className="text-xs"><Sparkles className="mr-1 size-3.5" />Shrnutí</TabsTrigger>
          <TabsTrigger value="test" className="text-xs"><PlayCircle className="mr-1 size-3.5" />Test</TabsTrigger>
          <TabsTrigger value="history" className="text-xs"><HistoryIcon className="mr-1 size-3.5" />Historie</TabsTrigger>
        </TabsList>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
          <TabsContent value="summary" className="mt-0 space-y-5">
            <SummaryTab rule={rule} />
          </TabsContent>
          <TabsContent value="test" className="mt-0">
            <TestTab rule={rule} />
          </TabsContent>
          <TabsContent value="history" className="mt-0">
            <HistoryTab rule={rule} />
          </TabsContent>
        </div>
      </Tabs>

      <div className="flex items-center gap-2 border-t border-border bg-surface p-4">
        <button
          onClick={() => onEdit(rule)}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Pencil className="size-4" /> Upravit pravidlo
        </button>
      </div>
    </aside>
  );
}

/* ============ Shrnutí ============ */

function SummaryTab({ rule }: { rule: Rule }) {
  return (
    <>
      {rule.description && (
        <p className="rounded-lg bg-muted/60 px-3 py-2.5 text-sm leading-relaxed text-foreground/80">
          {rule.description}
        </p>
      )}

      <NaturalLanguageSummary rule={rule} />

      <Section label="Spouštěč" color="warning">
        <div className="text-sm font-medium">{TRIGGER_LABELS[rule.trigger.type]}</div>
        <TriggerSummary rule={rule} />
      </Section>

      <Section label="Podmínky">
        <ConditionSummary node={rule.conditionGroup} depth={0} />
      </Section>




      <Section label="Akce">
        <div className="space-y-2">
          {rule.actions.map((a) => <ActionCard key={a.id} action={a} />)}
        </div>
      </Section>

      {rule.throttleHours && (
        <Section label="Throttle">
          <div className="text-xs text-muted-foreground">
            Max. 1× za <span className="font-medium text-foreground">{rule.throttleHours} h</span> pro každou zásilku.
          </div>
        </Section>
      )}
    </>
  );
}

function NaturalLanguageSummary({ rule }: { rule: Rule }) {
  const txt = useMemo(() => describeRule(rule), [rule]);
  return (
    <div className="rounded-xl border border-primary/20 bg-primary-soft/40 p-3.5">
      <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
        <Sparkles className="size-3" /> Lidsky čitelně
      </div>
      <p className="text-sm leading-relaxed text-foreground">{txt}</p>
    </div>
  );
}

function describeRule(rule: Rule): string {
  const t = rule.trigger;
  let trig = "";
  if (t.type === "schedule") {
    trig = describeSchedule(t.schedule, (id) => fieldById(id)?.label ?? id ?? "");
  } else if (t.type === "manual") {
    trig = "Ručně";
  } else {
    trig = "Vždy když je splněna podmínka";
  }

  const condCount = countConditions(rule.conditionGroup);
  const op = rule.conditionGroup.operator === "AND" ? "všechny" : "alespoň jedna z";
  const cond = condCount === 0 ? "bez dalších podmínek" : `pokud ${op} ${condCount} podmínek je splněna`;

  const wait = "";

  const create = rule.actions.find((a) => a.type === "create_vkr");
  const update = rule.actions.find((a) => a.type === "update_vkr");
  let actText = "proveď nastavené akce";
  if (create) actText = `vytvoř VkŘ „${create.title}" (priorita ${create.priority ?? "medium"})`;
  else if (update) actText = `eskaluj VkŘ „${update.vkrNameContains}" na prioritu ${update.newPriority}`;

  return `${trig} ${cond}${wait} — ${actText}.`;
}

/* ============ JSON ============ */

function JsonTab({ rule }: { rule: Rule }) {
  const json = JSON.stringify(rule, null, 2);
  return (
    <div className="space-y-2">
      <button
        onClick={() => navigator.clipboard.writeText(json)}
        className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium hover:bg-muted"
      >
        Zkopírovat JSON
      </button>
      <pre className="overflow-auto rounded-lg border border-border bg-muted/40 p-3 text-[11px] leading-relaxed">
        <code>{json}</code>
      </pre>
    </div>
  );
}

/* ============ Test ============ */

const MOCK_SHIPMENTS = [
  { ref: "BYT-2026-1142", desc: "FedEx Express → DE, deklarovaná 9 400 EUR" },
  { ref: "BYT-2026-1117", desc: "UPS World → USA, mimo EU, plná moc chybí" },
  { ref: "BYT-2026-1099", desc: "FedEx Eco → CH, v celním řízení > 2 dny" },
  { ref: "BYT-2026-1075", desc: "DSV Pallet → SK, netrackovaná" },
  { ref: "BYT-2026-1063", desc: "Schenker → IT, weight změněna z 120 → 138 kg" },
];

function TestTab({ rule }: { rule: Rule }) {
  const [selected, setSelected] = useState<string>(MOCK_SHIPMENTS[0].ref);
  const [result, setResult] = useState<null | { met: boolean; lines: Array<{ ok: boolean; text: string }> }>(null);

  const run = () => {
    // Mock: deterministicky podle hash refu × ruleId, ať to vypadá realisticky
    const seed = (selected + rule.id).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const lines = flatten(rule.conditionGroup).map((c, i) => ({
      ok: (seed + i) % 3 !== 0,
      text: leafText(c),
    }));
    const met = lines.length === 0 || lines.every((l) => l.ok);
    setResult({ met, lines });
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
        {MOCK_SHIPMENTS.map((s) => (
          <option key={s.ref} value={s.ref}>{s.ref} — {s.desc}</option>
        ))}
      </select>
      <button
        onClick={run}
        className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Spustit dry run
      </button>

      {result && (
        <div className={cn(
          "rounded-lg border p-3",
          result.met ? "border-success/40 bg-success/10" : "border-destructive/40 bg-destructive/10",
        )}>
          <div className="mb-2 text-sm font-semibold">
            {result.met ? "✓ Podmínky splněny — akce by byla provedena" : "✗ Podmínky nesplněny"}
          </div>
          <ul className="space-y-1 text-xs">
            {result.lines.map((l, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className={l.ok ? "text-success-foreground" : "text-destructive"}>{l.ok ? "✓" : "✗"}</span>
                <span className={l.ok ? "" : "text-muted-foreground line-through"}>{l.text}</span>
              </li>
            ))}
          </ul>
          {result.met && (
            <div className="mt-3 rounded border border-border bg-background p-2 text-xs">
              <div className="font-semibold">Provedené akce (dry):</div>
              {rule.actions.map((a) => (
                <div key={a.id}>• {ACTION_LABELS[a.type]}{a.title ? `: „${a.title}"` : ""}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ============ Historie ============ */

function HistoryTab({ rule }: { rule: Rule }) {
  const entries = rule.history ?? [];
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Posledních {entries.length} spuštění</span>
        <span>Celkem za 30 dní: <span className="font-mono font-semibold text-foreground">{rule.runs30d}</span></span>
      </div>
      {entries.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
          Žádné záznamy.
        </div>
      )}
      {entries.map((e, i) => (
        <div key={i} className="rounded-lg border border-border bg-background p-2.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-semibold">{e.shipmentRef}</span>
            <span className="text-[11px] text-muted-foreground">{new Date(e.at).toLocaleString("cs-CZ")}</span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-[11px]">
            <span className={cn(
              "rounded px-1.5 py-0.5 font-semibold uppercase tracking-wider",
              e.conditionsMet ? "bg-success/20 text-success-foreground" : "bg-muted text-muted-foreground",
            )}>
              {e.conditionsMet ? "splněno" : "nesplněno"}
            </span>
            <span className="text-muted-foreground">
              {e.outcome === "vkr_created" ? "→ VkŘ vytvořena" : e.outcome === "throttled" ? "→ throttled" : e.outcome === "deduplicated" ? "→ deduplikováno" : `→ ${e.outcome}`}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============ Shared ============ */

function Section({ label, color, children }: { label: string; color?: "warning" | "info"; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className={cn(
        "inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]",
        color === "warning" && "bg-warning/20 text-warning-foreground",
        color === "info" && "bg-info/15 text-info-foreground",
        !color && "text-muted-foreground",
      )}>
        {label}
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function TriggerSummary({ rule }: { rule: Rule }) {
  const t = rule.trigger;
  if (t.type === "schedule") {
    return <div className="text-xs text-muted-foreground">{describeSchedule(t.schedule, (id) => fieldById(id)?.label ?? id ?? "")}</div>;
  }
  if (t.type === "condition_met") {
    return <div className="text-xs text-muted-foreground">Vyhodnocuje se při každé změně dat — viz podmínky níže.</div>;
  }
  if (t.type === "manual") {
    return <div className="text-xs text-muted-foreground">Pravidlo spouští operátor ručně.</div>;
  }
  return null;
}

function ConditionSummary({ node, depth }: { node: ConditionGroup | Condition; depth: number }) {
  if (isGroup(node)) {
    if (node.children.length === 0) return <div className="text-xs italic text-muted-foreground">Bez podmínek — spustí se vždy.</div>;
    return (
      <div className={cn("space-y-1.5", depth > 0 && "rounded-lg border border-border p-2")}>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-primary">
          {node.operator === "AND" ? "Všechny podmínky musí platit" : "Alespoň jedna musí platit"}
        </div>
        {node.children.map((c, i) => <ConditionSummary key={i} node={c} depth={depth + 1} />)}
      </div>
    );
  }
  return <div className="rounded-lg border border-border bg-background px-3 py-2 text-sm">{leafText(node)}</div>;
}

function leafText(c: Condition): string {
  if (c.kind === "field_state_duration") {
    const f = fieldById(c.fieldId);
    const stateLbl = stateOperatorLabel(c.stateOperator);
    const v = Array.isArray(c.stateValue) ? c.stateValue.join(", ") : c.stateValue ?? "";
    const needsVal = c.stateOperator === "equals" || c.stateOperator === "not_equals" || c.stateOperator === "is_any_of" || c.stateOperator === "is_none_of";
    const m = c.durationMinutes ?? 0;
    const dur = m % 1440 === 0 ? `${m / 1440} dní` : m % 60 === 0 ? `${m / 60} h` : `${m} min`;
    const dir = (c.durationDirection ?? "elapsed") === "elapsed" ? "uplynulo" : "zbývá";
    const prep = (c.durationDirection ?? "elapsed") === "elapsed" ? "od" : "do";
    let anchorLbl = durationAnchorLabel(c.durationAnchor);
    if (c.durationAnchor === "field_datetime") {
      anchorLbl = fieldById(c.anchorFieldId)?.label ?? "(pole)";
    } else if (c.durationAnchor === "literal_date") {
      anchorLbl = c.anchorLiteralDate ?? "(datum)";
    }
    const stateText = c.stateOperator === "any" ? "" : ` ${stateLbl}${needsVal && v ? ` ${v}` : ""}`;
    return `${f?.label ?? c.fieldId}${stateText} — ${dir} více než ${dur} ${prep} ${anchorLbl}`;
  }
  if (c.kind === "route_compliance") {
    const variantLbl: Record<string, string> = {
      advanced_route_condition: "Pokročilá podmínka trasy",
      record_vs_checkpoint: "Stav záznamu vůči checkpointu",
      general_compliance: "Obecná kontrola souladu",
      checkpoint_duration: "Doba trvání checkpointu",
      field_value_repeated: "Hodnota pole na N záznamech",
    };
    const head = variantLbl[c.routeCheck ?? "advanced_route_condition"] ?? "Soulad s trasou";
    if (c.routeCheck === "general_compliance" && c.generalCheck) {
      return `${head}: ${c.generalCheck === "unrecognized_location" ? "místo není na trase" : "status není na trase"}`;
    }
    if (c.routeCheck === "advanced_route_condition") {
      return c.problemTypeId ? `${head}: vybraná podmínka` : `${head}: (nevybráno)`;
    }
    if (c.routeCheck === "record_vs_checkpoint") {
      return `${head}: ${c.recordScope ?? "last"} × ${c.matchMode ?? "matches"} × ${c.checkpointLabel ?? "(label?)"}`;
    }
    if (c.routeCheck === "checkpoint_duration") {
      return `${head}: ${c.checkpointLabel ?? "(label?)"} ${c.durationComparator === "lt" ? "<" : ">"} ${c.checkpointDurationThreshold ?? "normal"} práh`;
    }
    if (c.routeCheck === "field_value_repeated") {
      return `${head}: ${c.fieldValueTrackingFieldId ?? "(pole?)"} = „${c.fieldValueExpected ?? ""}" na > ${c.fieldValueCount ?? 0} ${c.fieldValueMode === "consecutive" ? "po sobě" : "jakýchkoli"}`;
    }
    return head;
  }
  if (c.presetLabel) return c.presetLabel;
  const f = fieldById(c.fieldId);
  const opLabel = c.operator ? OPERATOR_LABELS[c.operator] : "";
  const v = Array.isArray(c.value) ? c.value.join(", ") : c.value;
  return `${f?.label ?? c.fieldId} ${opLabel}${v !== undefined && v !== "" ? ` ${v}` : ""}`;
}

function ActionCard({ action }: { action: Action }) {
  const Icon = ACTION_ICON[action.type] ?? FileEdit;
  const tag = ACTION_TAG[action.type];
  const title = action.type === "create_vkr" ? action.title : ACTION_LABELS[action.type];
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 grid size-7 place-items-center rounded-md bg-primary-soft text-primary"><Icon className="size-4" /></span>
          <div className="min-w-0">
            <div className="text-sm font-medium leading-snug">{title}</div>
            {action.type === "create_vkr" && action.description && <div className="mt-0.5 text-xs text-muted-foreground">{action.description}</div>}
            {action.type === "send_email" && <div className="mt-0.5 text-xs text-muted-foreground">{action.subject}</div>}
            {action.type === "update_vkr" && <div className="mt-0.5 text-xs text-muted-foreground">VkŘ „{action.vkrNameContains}" → priorita {action.newPriority}</div>}
            {action.type === "add_note" && <div className="mt-0.5 text-xs text-muted-foreground">{action.noteText}</div>}
            {action.type === "request_field_from_operator" && (
              <div className="mt-0.5 text-xs text-muted-foreground">
                Pole: <span className="font-medium">{fieldById(action.requestFieldId)?.label ?? action.requestFieldId ?? "—"}</span>
                {action.requestPrompt && <> · „{action.requestPrompt}"</>}
                {action.nextRuleHint && <> · navazuje: {action.nextRuleHint}</>}
              </div>
            )}
          </div>
        </div>
        <span className={cn("shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", tag.cls)}>{tag.label}</span>
      </div>
      {action.runWhenRouteCondition && (
        <div className="mt-2 flex flex-wrap items-center gap-1 text-[10px]">
          <span className="text-muted-foreground">Spustit jen když:</span>
          <span className="rounded bg-warning/20 px-1.5 py-0.5 font-semibold text-warning-foreground">
            podmínka trasy {action.runWhenRouteCondition === "fulfilled" ? "splněna" : "nesplněna"}
          </span>
        </div>
      )}
      {action.type === "create_vkr" && (
        <div className="mt-2.5 grid grid-cols-2 gap-2 border-t border-border pt-2.5 text-[11px]">
          <Meta label="Priorita" value={action.priority?.toUpperCase()} />
          <Meta label="Dedup" value={action.deduplicate ? "Ano" : "Ne"} />
        </div>
      )}
    </div>
  );
}

function Meta({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value ?? "—"}</span>
    </div>
  );
}

function countConditions(g: ConditionGroup): number {
  return g.children.reduce((n, c) => n + (isGroup(c) ? countConditions(c) : 1), 0);
}

function flatten(g: ConditionGroup): Condition[] {
  const out: Condition[] = [];
  for (const c of g.children) {
    if (isGroup(c)) out.push(...flatten(c));
    else out.push(c);
  }
  return out;
}

function formatMinutes(min: number) {
  if (min < 60) return `${min} min`;
  if (min % 60 === 0) return `${min / 60} h`;
  return `${Math.floor(min / 60)} h ${min % 60} min`;
}
