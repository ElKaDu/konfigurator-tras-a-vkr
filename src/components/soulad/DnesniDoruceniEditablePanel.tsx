import type { DnesniDoruceniConfig, Segment } from "@/lib/model/types";
import { ROUTE_COMPLIANCE_SITUATIONS } from "@/lib/model/routeComplianceSituations";
import { formatTimeLimit } from "@/lib/model/formatTimeLimit";
import { SituaceCard } from "./SituaceCard";
import { MatchEditor } from "./MatchEditor";
import { TerminEditor } from "./TerminEditor";
import { TimeLimitEditor } from "./TimeLimitEditor";

export function DnesniDoruceniEditablePanel({
  segment,
  checkpointId,
  config,
  onChange,
}: {
  segment: Segment;
  checkpointId: string;
  config: DnesniDoruceniConfig;
  onChange: (next: DnesniDoruceniConfig) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
        Vstupní brána: bod se vyhodnocuje jen když <b className="text-foreground">ADD = dnes</b>. Datum
        doručení od přepravce (D) se poprvé vyhodnocuje až v Konečném limitu 1. scanu.
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="text-sm font-semibold mb-3">1. fyzický scan</div>
        <MatchEditor
          value={config.scan1.match}
          onChange={(match) => onChange({ ...config, scan1: { ...config.scan1, match } })}
        />
        <div className="mt-3">
          <div className="text-xs text-muted-foreground mb-1">Termín (nejpozdější možný vlastní čas)</div>
          <TerminEditor
            segment={segment}
            currentCheckpointId={checkpointId}
            value={config.scan1.deadline}
            onChange={(deadline) => onChange({ ...config, scan1: { ...config.scan1, deadline } })}
          />
        </div>
        <div className="mt-3 flex flex-col gap-2">
          <TimeLimitEditor
            label="Limit pro řádné záznamy"
            value={config.limitProRadneZaznamy}
            onChange={(limit) => onChange({ ...config, limitProRadneZaznamy: limit })}
          />
          <TimeLimitEditor
            label="Konečný limit"
            value={config.konecnyLimitScan1}
            onChange={(limit) => onChange({ ...config, konecnyLimitScan1: limit })}
          />
        </div>
        <div className="mt-3 rounded-md border border-dashed border-border p-2.5 text-xs text-muted-foreground">
          Až do Limitu pro řádné záznamy: žádná VkŘ, ať se řádný záznam objeví, nebo ne. Mezi Limitem pro
          řádné záznamy a Konečným limitem: pořád žádná VkŘ, jen se čeká. D se vyhodnocuje výhradně
          v Konečném limitu — pokud záznam nedorazil vůbec, nebo dorazil a D se posunulo, vzniká „Zpožděná
          zásilka" (viz karty níže).
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="text-sm font-semibold mb-3">2. fyzický scan</div>
        <MatchEditor
          value={config.scan2.match}
          onChange={(match) => onChange({ ...config, scan2: { ...config.scan2, match } })}
          showZipMatchesDestination
        />
        <div className="mt-3">
          <div className="text-xs text-muted-foreground mb-1">Termín (scan1 + posun)</div>
          <TerminEditor
            segment={segment}
            currentCheckpointId={checkpointId}
            value={config.scan2.deadline}
            onChange={(deadline) => onChange({ ...config, scan2: { ...config.scan2, deadline } })}
          />
        </div>
        <div className="mt-3">
          <TimeLimitEditor
            label="Konečný limit"
            value={config.konecnyLimitScan2}
            onChange={(limit) => onChange({ ...config, konecnyLimitScan2: limit })}
          />
        </div>
        <div className="mt-3 rounded-md border border-dashed border-border p-2.5 text-xs text-muted-foreground">
          Jednostupňové, žádný mezistupeň — jde o to, jestli 2. scan řádně dorazil do termínu finální
          kontroly (ne jen jestli dorazil vůbec). Aktuální hodnota: {formatTimeLimit(config.konecnyLimitScan2)}.
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Situace, které z tohoto bodu mohou vzniknout
        </div>
        <div className="flex flex-col gap-3">
          <SituaceCard
            headline="1. i 2. scan v pořádku"
            situationId={ROUTE_COMPLIANCE_SITUATIONS.dnesniDoruceni.situationId}
            severityId={ROUTE_COMPLIANCE_SITUATIONS.dnesniDoruceni.severityId}
          />
          <SituaceCard
            headline="Cokoli z plánu nevyšlo (scan chybí/pozdě, nebo D se posunulo)"
            situationId={ROUTE_COMPLIANCE_SITUATIONS.zpozdenaZasilka.situationId}
            severityId={ROUTE_COMPLIANCE_SITUATIONS.zpozdenaZasilka.severityId}
          />
        </div>
      </div>
    </div>
  );
}
