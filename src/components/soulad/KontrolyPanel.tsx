import type { Checkpoint } from "@/lib/model/types";
import { ROUTE_COMPLIANCE_SITUATIONS } from "@/lib/model/routeComplianceSituations";
import { formatTimeLimit } from "@/lib/model/formatTimeLimit";
import { KontrolaCard } from "./KontrolaCard";
import { Vetev } from "./Vetev";
import { SituaceCard } from "./SituaceCard";
import { DnesniDoruceniKontroly } from "./DnesniDoruceniKontroly";

export function KontrolyPanel({ checkpoint }: { checkpoint: Checkpoint }) {
  return (
    <div className="flex flex-col gap-3.5 opacity-90">
      <div className="flex items-center gap-2">
        <div className="text-sm font-semibold text-muted-foreground">Jak to bude fungovat</div>
        <span className="rounded-full border border-dashed border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          jen náhled
        </span>
      </div>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-[11px] text-muted-foreground">
        <span>🔒 Situace, Závažnost a Akce se needitují tady — nastavují se v Django adminu.</span>
        <a
          href="/zadani-pro-programatory.html"
          target="_blank"
          rel="noreferrer"
          className="ml-auto shrink-0 font-semibold text-primary hover:underline"
        >
          Zadání pro programátory →
        </a>
      </div>

      {checkpoint.kind === "dnesni_doruceni" && checkpoint.dnesniDoruceni ? (
        <DnesniDoruceniKontroly config={checkpoint.dnesniDoruceni} />
      ) : (
        <KontrolaCard
          cislo={1}
          nazev="Konečný limit"
          casovani={formatTimeLimit(checkpoint.konecnyLimit ?? { mode: "offset", offsetHours: 0 })}
          pravidlo="Jediná kontrola tohoto bodu — časovač, žádný mezistupeň, žádná vazba na ADD/D."
        >
          <Vetev kind="ok" label="✓ Řádně nalezen do Termínu">
            <p className="text-xs text-muted-foreground">Žádná věc k řešení — řetězec pokračuje na další bod.</p>
          </Vetev>
          <Vetev kind="warn" label="! Nenalezen do Termínu">
            <SituaceCard
              headline="Vzniká věc k řešení"
              situationId={ROUTE_COMPLIANCE_SITUATIONS.problemNaTrase.situationId}
              severityId={ROUTE_COMPLIANCE_SITUATIONS.problemNaTrase.severityId}
            />
          </Vetev>
          <Vetev kind="neutral" label="ℹ Objeví se později (reaktivně)">
            <p className="text-xs text-muted-foreground mb-2">Kdykoli po Termínu, pokud záznam jinak splňuje podmínky:</p>
            <SituaceCard
              headline="Vzniká věc k řešení (informativní)"
              situationId={ROUTE_COMPLIANCE_SITUATIONS.problemNaTrasePozde.situationId}
              severityId={ROUTE_COMPLIANCE_SITUATIONS.problemNaTrasePozde.severityId}
            />
          </Vetev>
        </KontrolaCard>
      )}
    </div>
  );
}
