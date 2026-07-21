import type { DnesniDoruceniConfig } from "@/lib/model/types";
import { ROUTE_COMPLIANCE_SITUATIONS } from "@/lib/model/routeComplianceSituations";
import { formatTimeLimit } from "@/lib/model/formatTimeLimit";
import { KontrolaCard } from "./KontrolaCard";
import { Vetev } from "./Vetev";
import { SituaceCard } from "./SituaceCard";

export function DnesniDoruceniKontroly({ config }: { config: DnesniDoruceniConfig }) {
  return (
    <div className="flex flex-col gap-3.5">
      <KontrolaCard
        cislo={1}
        nazev="Limit pro řádné záznamy"
        casovani={formatTimeLimit(config.limitProRadneZaznamy)}
        pravidlo="Až do tohoto limitu sledujeme, jestli se objeví řádný záznam — tedy záznam se shodou a vlastním časem ≤ Termín. Datum doručení od přepravce (D) se tady ještě nekontroluje — poprvé se vyhodnotí až v Konečném limitu."
      >
        <Vetev kind="ok" label="✓ Řádný záznam se objevil">
          <p className="text-xs text-muted-foreground">Žádná věc k řešení — pokračuje se na 2. fyzický scan.</p>
        </Vetev>
        <Vetev kind="warn" label="! Řádný záznam se neobjevil">
          <p className="text-xs text-muted-foreground">Žádná věc k řešení — čeká se do Konečného limitu, kde se poprvé vyhodnotí i D.</p>
        </Vetev>
      </KontrolaCard>

      <KontrolaCard
        cislo={2}
        nazev="Konečný limit"
        casovani={formatTimeLimit(config.konecnyLimitScan1)}
        pravidlo="Poslední kontrola tohoto scanu — vlastní čas záznamu už nerozhoduje, jde jen o to, jestli řádný záznam nakonec dorazil."
      >
        <Vetev kind="warn" label="! Řádný záznam se neobjevil ani teď">
          <SituaceCard
            headline="Vzniká věc k řešení"
            situationId={ROUTE_COMPLIANCE_SITUATIONS.zpozdenaZasilka.situationId}
            severityId={ROUTE_COMPLIANCE_SITUATIONS.zpozdenaZasilka.severityId}
          />
        </Vetev>
        <Vetev kind="ok" label="✓ Řádný záznam se objevil">
          <p className="text-xs text-muted-foreground mb-2">Ještě nic nevzniká — nejdřív se znovu ověří D:</p>
          <div className="border-l-2 border-border pl-2.5 mb-2">
            <p className="text-[11px] text-muted-foreground">
              <b className="text-foreground">D = dnes</b> → žádná věc k řešení, pokračuje se na 2. fyzický scan.
            </p>
          </div>
          <div className="border-l-2 border-warning pl-2.5">
            <p className="text-[11px] text-muted-foreground mb-2">
              <b className="text-foreground">D ≠ dnes, posunulo se</b> → vzniká věc k řešení:
            </p>
            <SituaceCard
              headline="Vzniká věc k řešení"
              situationId={ROUTE_COMPLIANCE_SITUATIONS.zpozdenaZasilka.situationId}
              severityId={ROUTE_COMPLIANCE_SITUATIONS.zpozdenaZasilka.severityId}
            />
          </div>
        </Vetev>
      </KontrolaCard>

      <KontrolaCard
        cislo={3}
        nazev="2. scan — Konečný limit"
        casovani={formatTimeLimit(config.konecnyLimitScan2)}
        pravidlo="Jednostupňové, žádný mezistupeň jako u 1. scanu — jde o to, jestli 2. scan řádně dorazil do termínu finální kontroly (ne jen jestli dorazil vůbec)."
      >
        <Vetev kind="ok" label="✓ Řádně dorazil do termínu finální kontroly">
          <SituaceCard
            headline="Informativní"
            situationId={ROUTE_COMPLIANCE_SITUATIONS.dnesniDoruceni.situationId}
            severityId={ROUTE_COMPLIANCE_SITUATIONS.dnesniDoruceni.severityId}
          />
        </Vetev>
        <Vetev kind="warn" label="! Nedorazil řádně do termínu finální kontroly">
          <SituaceCard
            headline="Vzniká věc k řešení"
            situationId={ROUTE_COMPLIANCE_SITUATIONS.zpozdenaZasilka.situationId}
            severityId={ROUTE_COMPLIANCE_SITUATIONS.zpozdenaZasilka.severityId}
          />
        </Vetev>
      </KontrolaCard>
    </div>
  );
}
