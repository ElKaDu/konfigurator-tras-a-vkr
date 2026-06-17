import { useState } from "react";
import { X, MapPin, Pencil, AlertCircle, GitBranch, CheckCircle2, Circle, Plus, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Route } from "@/lib/routes/types";
import { getVariants, listZipScenarios, zipRangesKey } from "@/lib/routes/types";
import { useRoutes } from "@/lib/routes/store";
import { useProblemTypes } from "@/lib/routes/problemTypes";
import { describeMatchInline, describeProblemCondition } from "@/lib/routes/describe";

export function RouteDetailPanel({
  route, onClose, onEdit, onAddAlternative, onSelectRoute,
}: {
  route: Route | null;
  onClose: () => void;
  onEdit: (r: Route) => void;
  onAddAlternative?: (parent: Route) => void;
  onSelectRoute?: (id: string) => void;
}) {
  const allRoutes = useRoutes();
  const problemTypes = useProblemTypes();
  const [activeZipKey, setActiveZipKey] = useState<string>("__ANY__");

  if (!route) {
    return (
      <aside className="hidden h-full w-[460px] shrink-0 border-l border-border bg-surface xl:flex xl:flex-col">
        <div className="m-auto max-w-[260px] text-center text-sm text-muted-foreground">
          <AlertCircle className="mx-auto mb-3 size-6 text-muted-foreground/60" />
          Vyber trasu ze seznamu pro zobrazení checkpointů, alternativ a parametrů.
        </div>
      </aside>
    );
  }

  const variants = route.parentRouteId ? [] : getVariants(route.id, allRoutes);
  const parent = route.parentRouteId ? allRoutes.find((r) => r.id === route.parentRouteId) ?? null : null;
  const zipScenarios = listZipScenarios(route.checkpoints);
  const visibleCheckpoints = route.checkpoints.filter((cp) => {
    if (activeZipKey === "__ANY__") return true;
    const k = zipRangesKey(cp.appliesWhenDestZip);
    return k === activeZipKey || k === "__ANY__";
  });

  return (
    <aside className="flex h-full w-[460px] shrink-0 flex-col border-l border-border bg-surface">
      <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            <MapPin className="size-3.5" /> {route.code}
            {parent && (
              <span className="inline-flex items-center gap-1 rounded bg-warning/20 px-1.5 py-0.5 text-[10px] font-semibold normal-case tracking-normal text-warning-foreground">
                <GitBranch className="size-3" /> alternativní cesta
              </span>
            )}
          </div>
          <h3 className="mt-1 text-base font-semibold leading-snug">{route.name}</h3>
          {parent && (
            <button
              onClick={() => onSelectRoute?.(parent.id)}
              className="mt-1 text-xs text-primary hover:underline"
            >
              ↑ Hlavní trasa: <span className="font-mono">{parent.code}</span> {parent.name}
            </button>
          )}
        </div>
        <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <X className="size-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3 space-y-5">
        {route.description && (
          <p className="rounded-lg bg-muted/60 px-3 py-2.5 text-sm leading-relaxed text-foreground/80">
            {route.description}
          </p>
        )}

        <Section label="Aplikovatelnost">
          <Pair label="Dopravci" values={route.carriers} />
          <Pair label="Varianta přepravy" values={route.serviceTypes} />
          <Pair label="Cílové země" values={route.destCountries} mono />
          <div className="text-[11px] text-muted-foreground">
            = {route.carriers.length * route.serviceTypes.length * route.destCountries.length} kombinací pokryto
            {parent && <span className="italic"> · dědí z hlavní trasy</span>}
          </div>
        </Section>

        <Section label={`Optimální trasa — checkpointy (${route.checkpoints.length})`}>
          {zipScenarios.length > 1 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">PSČ scénář:</span>
              {zipScenarios.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setActiveZipKey(s.key)}
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[10px]",
                    activeZipKey === s.key ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/40",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
          <ol className="space-y-2">
            {visibleCheckpoints.map((cp) => {
              const i = route.checkpoints.indexOf(cp);
              return (
              <li key={cp.id} className="rounded-lg border border-border bg-background p-3">
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium leading-snug">{cp.label}</span>
                    </div>

                    <div className="mt-1 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground/70">Match:</span> {describeMatchInline(cp.match)}
                    </div>
                    {/* Timing checkpointu odstraněn — čas žije v problémových podmínkách trasy. */}
                    {cp.appliesWhenDestZip && cp.appliesWhenDestZip.length > 0 && (
                      <div className="mt-0.5 text-[11px] text-muted-foreground italic">
                        Platí jen pro PSČ: {cp.appliesWhenDestZip.map((z) => `${z.country} ${z.prefix ?? `${z.from ?? ""}–${z.to ?? ""}`}`).join(", ")}
                      </div>
                    )}
                  </div>
                </div>
              </li>
              );
            })}
            {route.checkpoints.length === 0 && (
              <li className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                Trasa nemá žádné checkpointy. Otevři editor a přidej alespoň jeden.
              </li>
            )}
          </ol>
        </Section>

        <Section label="Pokročilé podmínky na trase">
          {(!route.problems || route.problems.length === 0) ? (
            <div className="rounded-lg border border-dashed border-border p-3 text-center text-[11px] italic text-muted-foreground">
              Žádná problémová situace zatím není definována.
            </div>
          ) : (
            <div className="space-y-2">
              {route.problems.map((p, idx) => {
                const type = problemTypes.find((t) => t.id === p.problemTypeId);
                return (
                  <details key={idx} className="rounded-lg border border-warning/40 bg-warning/10 p-2.5">
                    <summary className="cursor-pointer text-sm font-medium leading-snug">
                      <span className="inline-flex items-center gap-1.5">
                        <AlertTriangle className="size-3.5 text-warning-foreground" />
                        {type?.name ?? <span className="italic text-muted-foreground">(typ nevybrán)</span>}
                      </span>
                      <span className="ml-2 text-[10px] text-muted-foreground">
                        spojka: {p.logic.operator} · {p.logic.items.length} podmínek
                      </span>
                    </summary>
                    {type?.description && <div className="mt-1 text-[11px] text-muted-foreground italic">{type.description}</div>}
                    <ul className="mt-2 space-y-0.5 pl-1 text-[11px] text-foreground/80">
                      {p.logic.items.map((it, k) => (
                        <li key={k}>• {describeProblemCondition(it, route.checkpoints)}</li>
                      ))}
                      {p.logic.items.length === 0 && <li className="italic text-muted-foreground">— žádné podmínky</li>}
                    </ul>
                  </details>
                );
              })}
            </div>
          )}
        </Section>

        {!parent && (
          <Section label={`Alternativní cesty (${variants.length})`}>
            <p className="text-[11px] text-muted-foreground">
              Alternativní cesty popisují, kudy zásilka občas jede místo hlavní trasy. Mají stejné pokrytí (dopravce, varianta přepravy, cílová země) a liší se jen v checkpointech.
            </p>
            <div className="space-y-1.5">
              {variants.map((a) => (
                <button
                  key={a.id}
                  onClick={() => onSelectRoute?.(a.id)}
                  className="flex w-full items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-left text-xs hover:border-primary/40 hover:bg-muted/40"
                >
                  <GitBranch className="size-3.5 text-muted-foreground" />
                  <span className="font-mono font-semibold text-muted-foreground">{a.code}</span>
                  <span className="flex-1 truncate">{a.name}</span>
                  <span className="text-[10px] text-muted-foreground">{a.checkpoints.length} cp.</span>
                </button>
              ))}
              {variants.length === 0 && (
                <div className="rounded-lg border border-dashed border-border p-3 text-center text-[11px] text-muted-foreground">
                  Žádné alternativní cesty zatím nejsou.
                </div>
              )}
              {onAddAlternative && (
                <button
                  onClick={() => onAddAlternative(route)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:bg-primary-soft hover:text-primary"
                >
                  <Plus className="size-3" /> Přidat alternativní cestu
                </button>
              )}
            </div>
          </Section>
        )}

        {route.notes && (
          <Section label="Poznámky">
            <p className="text-xs text-muted-foreground italic">{route.notes}</p>
          </Section>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-border bg-surface p-4">
        <button
          onClick={() => onEdit(route)}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Pencil className="size-4" /> Upravit trasu
        </button>
      </div>
    </aside>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Pair({ label, values, mono }: { label: string; values: string[]; mono?: boolean }) {
  return (
    <div className="flex flex-wrap items-baseline gap-2 text-sm">
      <span className="text-xs text-muted-foreground">{label}:</span>
      <div className="flex flex-wrap gap-1">
        {values.map((v) => (
          <span key={v} className={cn(
            "rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-semibold",
            mono && "font-mono",
          )}>
            {v}
          </span>
        ))}
        {values.length === 0 && <span className="text-xs italic text-muted-foreground">(žádná)</span>}
      </div>
    </div>
  );
}
