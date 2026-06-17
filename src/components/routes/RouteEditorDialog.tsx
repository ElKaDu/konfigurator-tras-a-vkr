import { useEffect, useState } from "react";
import { Plus, Trash2, ChevronUp, ChevronDown, AlertTriangle, X, GitBranch, Lock, Copy } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { routesStore, useRoutes } from "@/lib/routes/store";
import type { Route, Checkpoint, CheckpointMatch, RouteZipRange } from "@/lib/routes/types";
import { findSignatureCollisions, TRANSPORT_VARIANTS, listZipScenarios, zipRangesKey } from "@/lib/routes/types";
import { CARRIER_PROVIDERS } from "@/lib/vkr/fields";
import { COUNTRY_OPTIONS } from "@/lib/routes/countries";
import { OBSERVED_CATALOG, type ObservedField } from "@/lib/routes/observedCatalog";
import { describeMatchInline } from "@/lib/routes/describe";
import { TimezoneSelect } from "@/components/ui/timezone-select";
import { ProblemsEditor } from "./ProblemsEditor";

const uid = () => `id_${Math.random().toString(36).slice(2, 10)}`;


export function RouteEditorDialog({
  open,
  route,
  parentRoute,
  onClose,
}: {
  open: boolean;
  route: Route | null;
  /** Pokud je vyplněno, vytváříme alternativní cestu této hlavní trasy. */
  parentRoute?: Route | null;
  onClose: () => void;
}) {
  const allRoutes = useRoutes();
  const [draft, setDraft] = useState<Route | null>(null);

  useEffect(() => {
    if (!open) return;
    if (route) {
      setDraft(route);
      return;
    }
    if (parentRoute) {
      setDraft({
        id: uid(),
        code: `${parentRoute.code}-ALT`,
        name: `${parentRoute.name} (alternativa)`,
        description: "",
        active: true,
        parentRouteId: parentRoute.id,
        carriers: [...parentRoute.carriers],
        serviceTypes: [...parentRoute.serviceTypes],
        destCountries: [...parentRoute.destCountries],
        checkpoints: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return;
    }
    setDraft({
      id: uid(),
      code: "R-" + Math.random().toString(36).slice(2, 6).toUpperCase(),
      name: "",
      description: "",
      active: true,
      carriers: [],
      serviceTypes: [],
      destCountries: [],
      checkpoints: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }, [open, route, parentRoute]);

  if (!draft) return null;

  const isVariant = !!draft.parentRouteId;
  const parent = isVariant ? allRoutes.find((r) => r.id === draft.parentRouteId) ?? parentRoute ?? null : null;
  const coverageLocked = isVariant;

  const collisions = findSignatureCollisions(draft, allRoutes, draft.id);

  const canSave =
    draft.name.trim().length > 0 &&
    draft.carriers.length > 0 &&
    draft.serviceTypes.length > 0 &&
    draft.destCountries.length > 0 &&
    collisions.length === 0;

  const save = () => {
    routesStore.upsert(draft);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-hidden p-0">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle className="flex items-center gap-2 text-lg">
            {isVariant && <GitBranch className="size-4 text-primary" />}
            {route ? (isVariant ? "Upravit alternativní cestu" : "Upravit trasu") : (isVariant ? "Nová alternativní cesta" : "Nová trasa")}
            {parent && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                k trase <span className="font-mono">{parent.code}</span> {parent.name}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[calc(92vh-130px)] space-y-6 overflow-y-auto px-6 py-5">
          {/* Sekce 1 — základ */}
          <SectionHeader number={1} title="Základní informace" />
          <div className="grid grid-cols-2 gap-3">

            <Field label="Aktivní">
              <select
                value={draft.active ? "1" : "0"}
                onChange={(e) => setDraft({ ...draft, active: e.target.value === "1" })}
                className="input"
              >
                <option value="1">Ano</option>
                <option value="0">Ne</option>
              </select>
            </Field>
            <Field label="Název" full>
              <input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className="input"
                placeholder={isVariant ? "Např. UPS Express CA — alternativa přes Memphis" : "Např. UPS Express — CZ → CA"}
              />
            </Field>
            <Field label="Popis" full>
              <textarea
                value={draft.description ?? ""}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                className="input min-h-[60px]"
              />
            </Field>
          </div>

          {/* Sekce 2 — aplikovatelnost */}
          <SectionHeader number={2} title="Aplikovatelnost (dopravce × varianta přepravy × cílová země)" />
          {coverageLocked && (
            <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 p-2.5 text-xs">
              <Lock className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground">
                Alternativní cesta musí mít <strong>stejné pokrytí</strong> jako hlavní trasa — dopravce, varianta přepravy i cílová země jsou převzaty z parenta a nelze je měnit.
              </span>
            </div>
          )}
          <div className={cn("space-y-3", coverageLocked && "pointer-events-none opacity-60")}>
            <MultiChips
              label="Dopravci"
              options={CARRIER_PROVIDERS}
              value={draft.carriers}
              onChange={(v) => setDraft({ ...draft, carriers: v })}
            />
            <MultiChips
              label="Varianta přepravy"
              options={TRANSPORT_VARIANTS}
              value={draft.serviceTypes}
              onChange={(v) => setDraft({ ...draft, serviceTypes: v })}
            />
            <MultiChips
              label="Cílové země"
              options={COUNTRY_OPTIONS}
              value={draft.destCountries}
              onChange={(v) => setDraft({ ...draft, destCountries: v })}
              showCode
            />

            <div className="rounded-lg border border-dashed border-border bg-muted/30 p-2.5 text-[11px] text-muted-foreground">
              <div className="font-semibold text-foreground">PSČ rozsahy se nastavují na jednotlivých checkpointech.</div>
              Pro celou trasu žádný PSČ filtr není — pokud má checkpoint platit jen pro konkrétní PSČ (např. „Out for delivery Winnipeg" jen pro R2x–R3x), nastav rozsah přímo u checkpointu níže.
            </div>


            <div className="rounded-lg border border-border bg-muted/40 p-2.5 text-xs">
              <div className="font-semibold text-foreground">
                {draft.carriers.length * draft.serviceTypes.length * draft.destCountries.length} kombinací pokryto
              </div>
              {collisions.length > 0 && (
                <div className="mt-1.5 flex items-start gap-2 rounded-md bg-destructive/10 p-2 text-destructive">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                  <div>
                    <div className="font-semibold">Kolize — některé kombinace jsou už pokryté jinou trasou:</div>
                    <ul className="mt-1 space-y-0.5">
                      {collisions.slice(0, 6).map((c, i) => (
                        <li key={i}>
                          <span className="font-mono">{c.signature.carrier} · {c.signature.serviceType} · {c.signature.destCountry}</span>
                          {" → "}
                          <span className="font-semibold">{c.route.code} {c.route.name}</span>
                        </li>
                      ))}
                      {collisions.length > 6 && <li>…a další {collisions.length - 6}</li>}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* (Sekce 3 níže) */}

          {/* Sekce 3 — Nastavení optimální trasy */}
          <SectionHeader number={3} title={`Nastavení optimální trasy — checkpointy (${draft.checkpoints.length})`} />
          <CheckpointsEditor
            checkpoints={draft.checkpoints}
            onChange={(c) => setDraft({ ...draft, checkpoints: c })}
          />


          {/* Sekce 4 — pokročilé podmínky (dříve „problémové situace") */}
          <SectionHeader number={4} title="Pokročilé podmínky na trase" />

          <ProblemsEditor
            problems={draft.problems}
            checkpoints={draft.checkpoints}
            onChange={(p) => setDraft({ ...draft, problems: p })}
          />


          {/* Sekce 5 — poznámky */}
          <SectionHeader number={5} title="Poznámky" />
          <textarea
            value={draft.notes ?? ""}
            onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            className="input min-h-[60px]"
            placeholder="Interní poznámka…"
          />

          {!isVariant && (
            <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
              <div className="mb-1 flex items-center gap-1.5 font-semibold text-foreground">
                <GitBranch className="size-3.5" /> Alternativní cesty
              </div>
              Alternativní cesty (varianty s jinou trasou checkpointů, ale stejným pokrytím) se přidávají z detailu hlavní trasy po uložení.
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border bg-muted/30 px-6 py-3">
          <div className="text-xs text-muted-foreground">
            {draft.checkpoints.length} checkpointů{isVariant ? " · alternativní cesta" : ""}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted">
              Zrušit
            </button>
            <button
              onClick={save}
              disabled={!canSave}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
              title={!canSave ? "Vyplň název a aplikovatelnost; odstraň kolize." : undefined}
            >
              {isVariant ? "Uložit alternativní cestu" : "Uložit trasu"}
            </button>
          </div>
        </div>

        <style>{`.input{width:100%;border:1px solid hsl(var(--border));background:var(--color-background);border-radius:0.5rem;padding:0.5rem 0.75rem;font-size:0.875rem;outline:none;}
        .input:focus{border-color:var(--color-primary);box-shadow:0 0 0 2px color-mix(in oklab, var(--color-primary) 18%, transparent);}`}</style>
      </DialogContent>
    </Dialog>
  );
}

/* ----------- Helpers ----------- */

function SectionHeader({ number, title }: { number: number; title: string }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <span className="grid size-6 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{number}</span>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">{title}</h3>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <label className={cn("flex flex-col gap-1", full && "col-span-2")}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function MultiChips({
  label,
  options,
  value,
  onChange,
  compact,
  showCode,
}: {
  label: string;
  options: Array<{ value: string; label: string }>;
  value: string[];
  onChange: (v: string[]) => void;
  compact?: boolean;
  showCode?: boolean;
}) {
  const [search, setSearch] = useState("");
  const filtered = options.filter((o) =>
    !search || o.value.toLowerCase().includes(search.toLowerCase()) || o.label.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label} <span className="text-foreground/60">({value.length})</span></span>
        {options.length > 8 && (
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Hledat…"
            className="h-7 w-40 rounded-md border border-border bg-background px-2 text-xs"
          />
        )}
      </div>
      <div className={cn("flex flex-wrap gap-1.5 rounded-lg border border-border bg-background p-2", compact && "max-h-32 overflow-y-auto")}>
        {filtered.map((o) => {
          const on = value.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(on ? value.filter((x) => x !== o.value) : [...value, o.value])}
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-xs",
                on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/40",
              )}
              title={o.label}
            >
              {showCode ? <span className="font-mono">{o.value}</span> : o.label}
              {showCode && <span className="ml-1 text-[10px] opacity-70">{o.label}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ----------- Checkpoints ----------- */

function CheckpointsEditor({ checkpoints, onChange }: { checkpoints: Checkpoint[]; onChange: (cs: Checkpoint[]) => void }) {
  const scenarios = listZipScenarios(checkpoints);
  // Taby zobrazujeme jen pokud existuje aspoň jeden konkrétní PSČ scénář (kromě „bez omezení").
  const showTabs = scenarios.length > 1;
  const [activeKey, setActiveKey] = useState<string>("__ANY__");

  const activeScenario = scenarios.find((s) => s.key === activeKey) ?? scenarios[0];

  // Pro daný PSČ scénář: zobrazujeme checkpointy, které mají buď stejné PSČ, NEBO jsou bez omezení.
  const visibleCheckpoints = checkpoints.filter((cp) => {
    if (!showTabs) return true;
    if (activeKey === "__ANY__") return true;
    const cpKey = zipRangesKey(cp.appliesWhenDestZip);
    return cpKey === activeKey || cpKey === "__ANY__";
  });

  const update = (id: string, patch: Partial<Checkpoint>) =>
    onChange(checkpoints.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const remove = (id: string) => onChange(checkpoints.filter((c) => c.id !== id));
  const duplicate = (id: string) => {
    const idx = checkpoints.findIndex((c) => c.id === id);
    if (idx < 0) return;
    const src = checkpoints[idx];
    const copy: Checkpoint = { ...src, id: uid(), label: `${src.label} (kopie)` };
    const arr = [...checkpoints];
    arr.splice(idx + 1, 0, copy);
    onChange(arr);
  };
  const move = (id: string, dir: -1 | 1) => {
    const idx = checkpoints.findIndex((c) => c.id === id);
    if (idx < 0) return;
    const j = idx + dir;
    if (j < 0 || j >= checkpoints.length) return;
    const arr = [...checkpoints];
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    onChange(arr);
  };
  const add = () => {
    // Když je aktivní konkrétní PSČ scénář (tab), nový checkpoint dostane jeho rozsah jako default.
    const ranges = showTabs && activeScenario && activeScenario.key !== "__ANY__" ? activeScenario.ranges : undefined;
    onChange([
      ...checkpoints,
      {
        id: uid(),
        label: `Checkpoint ${checkpoints.length + 1}`,
        match: {},
        appliesWhenDestZip: ranges,
      },
    ]);
  };

  return (
    <div className="space-y-2">
      {/* PSČ scénář — taby (jen když některý checkpoint má PSČ větev) */}
      {showTabs && (
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-background p-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">PSČ scénář:</span>
          {scenarios.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setActiveKey(s.key)}
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-xs",
                activeKey === s.key ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/40",
              )}
              title={s.key === "__ANY__" ? "Checkpointy společné pro všechny PSČ" : `Pro PSČ ${s.label}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}


      {visibleCheckpoints.map((cp) => {
        const i = checkpoints.indexOf(cp);
        return (
          <div key={cp.id} className="rounded-xl border border-border bg-muted/30 p-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="grid size-6 place-items-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">{i + 1}</span>
              <input
                value={cp.label}
                onChange={(e) => update(cp.id, { label: e.target.value })}
                className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-sm font-medium"
                placeholder="Popisek checkpointu"
              />
              <button onClick={() => move(cp.id, -1)} className="rounded p-1 text-muted-foreground hover:bg-background" title="Posunout nahoru">
                <ChevronUp className="size-3.5" />
              </button>
              <button onClick={() => move(cp.id, 1)} className="rounded p-1 text-muted-foreground hover:bg-background" title="Posunout dolů">
                <ChevronDown className="size-3.5" />
              </button>
              <button onClick={() => duplicate(cp.id)} className="rounded p-1 text-muted-foreground hover:bg-background" title="Duplikovat checkpoint">
                <Copy className="size-3.5" />
              </button>
              <button onClick={() => remove(cp.id)} className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                <Trash2 className="size-3.5" />
              </button>
            </div>

            <div>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">CO se musí stát (match)</div>
              <MatchEditor
                match={cp.match}
                onChange={(m) => update(cp.id, { match: m })}
              />
              <div className="mt-1 text-[11px] italic text-muted-foreground">{describeMatchInline(cp.match)}</div>
            </div>




            <ZipMatchEditor cp={cp} onChange={(patch) => update(cp.id, patch)} />
            <ExpectedDurationEditor cp={cp} onChange={(patch) => update(cp.id, patch)} />

            <CheckpointZipEditor
              countries={[]}
              value={cp.appliesWhenDestZip ?? []}
              onChange={(v) => update(cp.id, { appliesWhenDestZip: v.length ? v : undefined })}
            />

          </div>
        );
      })}

      <button
        onClick={add}
        className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:bg-primary-soft hover:text-primary"
      >
        <Plus className="size-3" /> Přidat checkpoint
        {activeKey !== "__ANY__" && <span className="text-[10px] opacity-70">do scénáře „{activeScenario?.label}"</span>}
      </button>
    </div>
  );
}

/* ----------- Match editor (tagged inputs over observed catalog) -----------
 *  Pole = `ParSerPackageActivityDetailSchema` BEZ časových polí
 *  (status_date/time/datetime/datetime_local). Časový aspekt řeší jen problémové
 *  podmínky trasy. */

const MATCH_TAG_FIELDS: Array<{ key: keyof CheckpointMatch; label: string; catalog: ObservedField }> = [
  { key: "status", label: "Status", catalog: "status" },
  { key: "statusCode", label: "Status code", catalog: "statusCode" },
  { key: "statusType", label: "Typ statusu", catalog: "statusType" },
  { key: "exceptionCode", label: "Kód výjimky", catalog: "exceptionCode" },
  { key: "locationCity", label: "Město", catalog: "locationCity" },
  { key: "locationCountry", label: "Země (název)", catalog: "locationCountry" },
  { key: "locationCountryCode", label: "Kód země (ISO2)", catalog: "locationCountryCode" },
  { key: "locationPostalCode", label: "PSČ lokace", catalog: "locationPostalCode" },
  { key: "locationProvinceCode", label: "Kód provincie / kraj", catalog: "locationProvinceCode" },
  { key: "locationSlic", label: "SLIC", catalog: "locationSlic" },
  { key: "locationId", label: "ID lokace", catalog: "locationId" },
  { key: "locationType", label: "Typ lokace", catalog: "locationType" },
  { key: "ancillaryAction", label: "Ancillary — akce", catalog: "ancillaryAction" },
  { key: "ancillaryReason", label: "Ancillary — důvod", catalog: "ancillaryReason" },
];

const MATCH_TEXT_FIELDS: Array<{ key: keyof CheckpointMatch; label: string; placeholder: string }> = [
  { key: "statusDescription", label: "Popis statusu (contains)", placeholder: "např. proclení" },
  { key: "simplifiedDescription", label: "Zjednodušený popis (contains)", placeholder: "" },
  { key: "exceptionDescription", label: "Popis výjimky (contains)", placeholder: "" },
  { key: "ancillaryActionDescription", label: "Ancillary — popis akce (contains)", placeholder: "" },
  { key: "ancillaryReasonDescription", label: "Ancillary — popis důvodu (contains)", placeholder: "" },
];

function MatchEditor({ match, onChange }: { match: CheckpointMatch; onChange: (m: CheckpointMatch) => void }) {
  const latest = match.latest ?? true;
  return (
    <div className="space-y-2 rounded-lg border border-border bg-background p-2">
      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={latest}
          onChange={(e) => onChange({ ...match, latest: e.target.checked })}
        />
        <span className="text-muted-foreground">Pouze aktuální aktivita (<span className="font-mono">latest = true</span>)</span>
      </label>
      {MATCH_TAG_FIELDS.map((f) => (
        <ObservedTagInput
          key={f.key}
          label={f.label}
          values={(match[f.key] as string[] | undefined) ?? []}
          onChange={(vals) => onChange({ ...match, [f.key]: vals.length ? vals : undefined })}
          catalog={f.catalog}
        />
      ))}
      {MATCH_TEXT_FIELDS.map((f) => (
        <label key={f.key} className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{f.label}</span>
          <input
            value={(match[f.key] as string | undefined) ?? ""}
            onChange={(e) => onChange({ ...match, [f.key]: e.target.value || undefined })}
            placeholder={f.placeholder}
            className="rounded border border-border bg-background px-2 py-1 text-xs"
          />
        </label>
      ))}
    </div>
  );
}

function ObservedTagInput({
  label,
  values,
  onChange,
  catalog,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  catalog: ObservedField;
}) {
  const [input, setInput] = useState("");
  const opts = OBSERVED_CATALOG[catalog];
  const matches = input
    ? opts.filter((o) => o.value.toLowerCase().includes(input.toLowerCase()) || (o.label ?? "").toLowerCase().includes(input.toLowerCase())).slice(0, 6)
    : [];

  const addVal = (v: string) => {
    const t = v.trim();
    if (!t || values.includes(t)) return;
    onChange([...values, t]);
    setInput("");
  };

  return (
    <div>
      <div className="mb-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="flex flex-wrap items-center gap-1">
        {values.map((v) => {
          const lbl = opts.find((o) => o.value === v)?.label;
          return (
            <span key={v} className="inline-flex items-center gap-1 rounded-md bg-primary-soft px-1.5 py-0.5 text-[11px] text-primary">
              <span className="font-mono font-semibold">{v}</span>
              {lbl && <span className="opacity-70 max-w-[140px] truncate">{lbl}</span>}
              <button onClick={() => onChange(values.filter((x) => x !== v))} className="rounded hover:bg-primary/20">
                <X className="size-2.5" />
              </button>
            </span>
          );
        })}
        <div className="relative">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); addVal(input); }
            }}
            placeholder="přidat…"
            className="w-32 rounded border border-border bg-background px-2 py-0.5 text-[11px]"
          />
          {matches.length > 0 && (
            <div className="absolute left-0 top-full z-10 mt-0.5 w-64 rounded-md border border-border bg-background shadow-lg">
              {matches.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => addVal(m.value)}
                  className="flex w-full items-center justify-between gap-2 px-2 py-1 text-left text-[11px] hover:bg-muted"
                >
                  <span className="font-mono font-semibold">{m.value}</span>
                  <span className="flex-1 truncate text-muted-foreground">{m.label}</span>
                  <span className="font-mono text-[9px] text-muted-foreground/70">{m.count}×</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* Timing/Anchor editor odstraněn — checkpoint nemá `timing`. Čas žije v problémových podmínkách trasy. */


/* ----------- PSČ rozsahy pro checkpoint (větvení uvnitř trasy) ----------- */
function CheckpointZipEditor({ countries, value, onChange }: { countries: string[]; value: RouteZipRange[]; onChange: (v: RouteZipRange[]) => void }) {
  const choices = countries.length > 0 ? countries : COUNTRY_OPTIONS.map((c) => c.value);
  const add = () => onChange([...value, { country: choices[0] ?? "", prefix: "" }]);
  const update = (i: number, patch: Partial<RouteZipRange>) => onChange(value.map((r, idx) => idx === i ? { ...r, ...patch } : r));
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  return (
    <div className="mt-2 rounded-lg border border-dashed border-border bg-muted/30 p-2.5">
      <div className="mb-1.5 flex items-center justify-between">
        <div className="text-[11px] font-semibold text-foreground">
          Platí jen pro PSČ <span className="font-normal text-muted-foreground">(větvení uvnitř trasy — např. „jen Winnipeg R2x–R3x")</span>
        </div>
        <button type="button" onClick={add} className="inline-flex items-center gap-1 rounded border border-border bg-background px-2 py-0.5 text-xs text-muted-foreground hover:text-primary">
          <Plus className="size-3" /> přidat
        </button>
      </div>
      {value.length === 0 && (
        <div className="text-[11px] italic text-muted-foreground">Bez rozsahu = checkpoint platí pro všechny zásilky v cílových zemích trasy.</div>
      )}
      <div className="space-y-1.5">
        {value.map((r, i) => (
          <div key={i} className="flex flex-wrap items-center gap-1.5 text-xs">
            <select
              value={r.country}
              onChange={(e) => update(i, { country: e.target.value })}
              className="rounded border border-border bg-background px-2 py-0.5 text-xs"
            >
              {choices.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input
              type="text"
              placeholder="prefix (např. 902)"
              value={r.prefix ?? ""}
              onChange={(e) => update(i, { prefix: e.target.value || undefined, from: undefined, to: undefined })}
              className="w-[110px] rounded border border-border bg-background px-2 py-0.5 text-xs"
            />
            <span className="text-muted-foreground">nebo</span>
            <input
              type="text"
              placeholder="od"
              value={r.from ?? ""}
              onChange={(e) => update(i, { from: e.target.value || undefined, prefix: undefined })}
              className="w-[80px] rounded border border-border bg-background px-2 py-0.5 text-xs"
            />
            <span className="text-muted-foreground">–</span>
            <input
              type="text"
              placeholder="do"
              value={r.to ?? ""}
              onChange={(e) => update(i, { to: e.target.value || undefined, prefix: undefined })}
              className="w-[80px] rounded border border-border bg-background px-2 py-0.5 text-xs"
            />
            <button type="button" onClick={() => remove(i)} className="ml-auto rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
              <X className="size-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Pravidla shody odstraněna — nahrazeno ProblemsEditor. */

/* ============ ZipMatchEditor (PSČ = cílové PSČ) ============ */

function ZipMatchEditor({ cp, onChange }: { cp: Checkpoint; onChange: (patch: Partial<Checkpoint>) => void }) {
  const zm = cp.match.zipMatchesDestination;
  const [expanded, setExpanded] = useState<boolean>(!!zm);
  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => { setExpanded(true); onChange({ match: { ...cp.match, zipMatchesDestination: { mode: "exact" } } }); }}
        className="mt-2 inline-flex items-center gap-1 rounded-md border border-dashed border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground hover:border-primary/40 hover:text-primary"
      >
        + PSČ lokace = cílové PSČ zásilky
      </button>
    );
  }
  const setMode = (mode: "exact" | "prefix") =>
    onChange({ match: { ...cp.match, zipMatchesDestination: { mode, prefixLength: mode === "prefix" ? (zm?.prefixLength ?? 3) : undefined } } });
  return (
    <div className="mt-2 rounded-md border border-border bg-background/60 p-2 text-xs">
      <div className="mb-1 flex items-center justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          PSČ lokace musí odpovídat cílovému PSČ zásilky
        </div>
        <button
          type="button"
          onClick={() => { setExpanded(false); onChange({ match: { ...cp.match, zipMatchesDestination: undefined } }); }}
          className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="size-3" />
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-1.5">
          <input type="radio" checked={zm?.mode === "exact"} onChange={() => setMode("exact")} />
          Plná shoda PSČ
        </label>
        <label className="flex items-center gap-1.5">
          <input type="radio" checked={zm?.mode === "prefix"} onChange={() => setMode("prefix")} />
          Shoda prvních
          <input
            type="number"
            min={1}
            max={5}
            value={zm?.prefixLength ?? 3}
            disabled={zm?.mode !== "prefix"}
            onChange={(e) => onChange({ match: { ...cp.match, zipMatchesDestination: { mode: "prefix", prefixLength: Math.min(5, Math.max(1, Number(e.target.value))) } } })}
            className="w-12 rounded border border-border bg-background px-1 py-0.5 text-center text-xs disabled:opacity-50"
          />
          číslic PSČ
        </label>
      </div>
    </div>
  );
}

/* ============ ExpectedDurationEditor (Očekávaná doba trvání) ============ */

function ExpectedDurationEditor({ cp, onChange }: { cp: Checkpoint; onChange: (patch: Partial<Checkpoint>) => void }) {
  const ed = cp.expectedDuration;
  const [expanded, setExpanded] = useState<boolean>(!!ed);
  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => { setExpanded(true); onChange({ expectedDuration: { normal: { value: 2, unit: "hours" } } }); }}
        className="mt-2 inline-flex items-center gap-1 rounded-md border border-dashed border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground hover:border-primary/40 hover:text-primary"
      >
        + Očekávaná doba trvání
      </button>
    );
  }
  const patch = (next: Checkpoint["expectedDuration"]) => onChange({ expectedDuration: next });
  return (
    <div className="mt-2 rounded-md border border-border bg-background/60 p-2 text-xs">
      <div className="mb-1 flex items-center justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Očekávaná doba trvání
        </div>
        <button
          type="button"
          onClick={() => { setExpanded(false); patch(undefined); }}
          className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="size-3" />
        </button>
      </div>
      <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1.5 text-xs">
        <div className="text-muted-foreground">Standardní</div>
        <DurationRow
          value={ed!.normal}
          onChange={(v) => patch({ ...ed!, normal: v })}
        />
        <div className="text-muted-foreground">Kritická</div>
        {ed?.critical ? (
          <div className="flex items-center gap-1.5">
            <DurationRow value={ed.critical} onChange={(v) => patch({ ...ed!, critical: v })} />
            <button type="button" onClick={() => patch({ normal: ed.normal })} className="rounded p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Odebrat kritický práh">
              <X className="size-3" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => patch({ ...ed!, critical: { value: 4, unit: "hours" } })}
            className="justify-self-start rounded border border-dashed border-border bg-background px-1.5 py-0.5 text-[11px] text-muted-foreground hover:border-primary/40 hover:text-primary"
          >
            + Přidat kritický práh
          </button>
        )}
      </div>
    </div>
  );
}

function DurationRow({
  value, onChange,
}: { value: { value: number; unit: "minutes" | "hours" | "days" | "business_days"; dayMode?: "calendar" | "business" }; onChange: (v: { value: number; unit: "minutes" | "hours" | "days" | "business_days"; dayMode?: "calendar" | "business" }) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        min={0}
        value={value.value}
        onChange={(e) => onChange({ ...value, value: Math.max(0, Number(e.target.value)) })}
        className="w-16 rounded border border-border bg-background px-1.5 py-0.5 text-right text-xs"
      />
      <select
        value={value.unit}
        onChange={(e) => {
          const unit = e.target.value as "minutes" | "hours" | "days";
          onChange({ ...value, unit, dayMode: unit === "days" ? value.dayMode : undefined });
        }}
        className="rounded border border-border bg-background px-2 py-0.5 text-xs"
      >
        <option value="minutes">minut</option>
        <option value="hours">hodin</option>
        <option value="days">dní</option>
      </select>
      {value.unit === "days" && (
        <select
          value={value.dayMode ?? "calendar"}
          onChange={(e) => onChange({ ...value, dayMode: e.target.value as "calendar" | "business" })}
          className="rounded border border-border bg-background px-2 py-0.5 text-xs"
        >
          <option value="calendar">kalendářní</option>
          <option value="business">pracovní</option>
        </select>
      )}
    </div>
  );
}
