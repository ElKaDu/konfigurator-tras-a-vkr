import { useState } from "react";
import { Sparkles, Wand2, Loader2, Check, RefreshCw, ArrowRight, Zap, Filter, Hourglass, Play } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { suggestRule, PHASES, type AISuggestion } from "@/lib/vkr/aiSuggest.functions";
import { FIELDS, TRIGGER_LABELS, ACTION_LABELS, OPERATOR_LABELS } from "@/lib/vkr/fields";
import { cn } from "@/lib/utils";

const uid = () => `id_${Math.random().toString(36).slice(2, 10)}`;

export function AIWizard({ onApply }: { onApply: (s: AISuggestion) => void }) {
  const [phase, setPhase] = useState<(typeof PHASES)[number]["id"]>("objednani");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null);
  const call = useServerFn(suggestRule);

  const phaseLabel = PHASES.find((p) => p.id === phase)?.label ?? phase;

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setSuggestion(null);
    try {
      const result = await call({ data: { phase, phaseLabel, prompt: prompt.trim() } });
      setSuggestion(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Neznámá chyba");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary-soft/40 to-primary-soft/10 p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground">
          <Sparkles className="size-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">AI asistent</h3>
          <p className="text-xs text-muted-foreground">Popiš, co chceš řešit — vyplním nastavení, název i popis.</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            1. Které fáze se VkŘ týká
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PHASES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPhase(p.id)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  phase === p.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground hover:border-primary/40 hover:bg-primary-soft",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            2. Co potřebuješ řešit
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Např. Když u zásilky mimo EU chybí plná moc 2 hodiny po vytvoření, vytvoř úkol operátorovi s vysokou prioritou."
            className="min-h-[80px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/70 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={generate}
            disabled={loading || !prompt.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
            {loading ? "Generuji…" : suggestion ? "Vygenerovat znovu" : "Vygenerovat návrh"}
          </button>
          {suggestion && (
            <button
              type="button"
              onClick={() => { onApply(suggestion); }}
              className="inline-flex items-center gap-2 rounded-lg border border-success/40 bg-success/15 px-3.5 py-2 text-sm font-medium text-success-foreground hover:bg-success/25"
            >
              <Check className="size-4" /> Použít návrh
            </button>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}

        {suggestion && (
          <SuggestionPreview suggestion={suggestion} />
        )}
      </div>
    </div>
  );
}

function SuggestionPreview({ suggestion }: { suggestion: AISuggestion }) {
  return (
    <div className="space-y-3 rounded-lg border border-border bg-background p-3">
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Navržený název</div>
        <div className="mt-0.5 text-sm font-semibold">{suggestion.name}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">{suggestion.description}</div>
      </div>

      <SchemaDiagram suggestion={suggestion} />

      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Shrnutí (názvy polí ze systému)</div>
        <div className="mt-1 rounded-md bg-muted/50 p-2.5 text-xs leading-relaxed text-foreground">
          <NaturalSummary suggestion={suggestion} />
        </div>
      </div>
    </div>
  );
}

function SchemaDiagram({ suggestion }: { suggestion: AISuggestion }) {
  const condCount = suggestion.conditionGroup.children.length;
  return (
    <div className="flex flex-wrap items-stretch gap-2">
      <DiagramBox icon={Zap} title="Spouštěč" body={TRIGGER_LABELS[suggestion.trigger.type] ?? suggestion.trigger.type} accent="bg-info/15 border-info/30 text-info-foreground" />
      <Arrow />
      <DiagramBox
        icon={Filter}
        title={`Podmínky (${suggestion.conditionGroup.operator})`}
        body={condCount === 0 ? "bez podmínek" : `${condCount} ${condCount === 1 ? "podmínka" : condCount < 5 ? "podmínky" : "podmínek"}`}
        accent="bg-primary-soft border-primary/30 text-primary"
      />
      <Arrow />
      <DiagramBox
        icon={Play}
        title={`Akce (${suggestion.actions.length})`}
        body={suggestion.actions.map((a) => ACTION_LABELS[a.type] ?? a.type).join(", ")}
        accent="bg-success/15 border-success/30 text-success-foreground"
      />
    </div>
  );
}

function DiagramBox({ icon: Icon, title, body, accent }: { icon: typeof Zap; title: string; body: string; accent: string }) {
  return (
    <div className={cn("flex min-w-[140px] flex-1 flex-col gap-1 rounded-lg border px-3 py-2", accent)}>
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider opacity-80">
        <Icon className="size-3" /> {title}
      </div>
      <div className="text-xs font-medium leading-tight">{body}</div>
    </div>
  );
}

function Arrow() {
  return (
    <div className="flex items-center text-muted-foreground/60">
      <ArrowRight className="size-4" />
    </div>
  );
}

function fieldLabel(id?: string) {
  if (!id) return "?";
  const f = FIELDS.find((x) => x.id === id);
  return f ? `„${f.label}"` : id;
}

function fmtValue(v: unknown): string {
  if (v === undefined || v === null || v === "") return "";
  if (typeof v === "boolean") return v ? "Ano" : "Ne";
  if (Array.isArray(v)) return v.join(", ");
  return String(v);
}

function condText(c: { fieldId: string; operator: string; value?: unknown }): string {
  const opLabel = OPERATOR_LABELS[c.operator] ?? c.operator;
  const val = fmtValue(c.value);
  return `${fieldLabel(c.fieldId)} ${opLabel}${val ? ` „${val}"` : ""}`;
}

function NaturalSummary({ suggestion }: { suggestion: AISuggestion }) {
  const t = suggestion.trigger;
  const trig = TRIGGER_LABELS[t.type] ?? t.type;
  const trigDetail = t.schedule?.timeOfDay ? ` v ${t.schedule.timeOfDay}` : "";

  const conds = suggestion.conditionGroup.children
    .map((c) => ("kind" in c ? condText(c) : `(${c.children.map(condText).join(c.operator === "OR" ? " NEBO " : " A ")})`))
    .join(suggestion.conditionGroup.operator === "OR" ? " NEBO " : " A ");

  const wait = "";

  const actions = suggestion.actions
    .map((a) => {
      const lbl = ACTION_LABELS[a.type] ?? a.type;
      if (a.type === "create_vkr") return `vytvoří se VkŘ „${a.title ?? "(bez názvu)"}" s prioritou ${a.priority ?? "medium"}`;
      if (a.type === "send_email") return `odešle se e-mail „${a.subject ?? "(bez předmětu)"}"`;
      if (a.type === "set_field") return `nastaví se ${fieldLabel(a.fieldId)} na „${a.fieldValue ?? ""}"`;
      if (a.type === "change_phase") return `změní se fáze na „${a.toPhase ?? ""}"`;
      return lbl.toLowerCase();
    })
    .join("; ");

  return (
    <>
      <strong>Když</strong> nastane „{trig}"{trigDetail}
      {conds && <>{" "}<strong>a platí</strong> {conds}</>}
      ,{wait} <strong>pak</strong> {actions}.
    </>
  );
}
