import type { Checkpoint, Segment } from "@/lib/model/types";
import { ROUTE_COMPLIANCE_SITUATIONS } from "@/lib/model/routeComplianceSituations";
import { formatTimeLimit } from "@/lib/model/formatTimeLimit";
import { SituaceCard } from "./SituaceCard";
import { MatchEditor } from "./MatchEditor";
import { TerminEditor } from "./TerminEditor";
import { TimeLimitEditor } from "./TimeLimitEditor";
import { DnesniDoruceniEditablePanel } from "./DnesniDoruceniEditablePanel";

export function BodDetailPanel({
  segment,
  checkpoint,
  onUpdate,
}: {
  segment: Segment;
  checkpoint: Checkpoint;
  onUpdate: (next: Checkpoint) => void;
}) {
  const isDnesniDoruceni = checkpoint.kind === "dnesni_doruceni";

  return (
    <div className="p-6 flex flex-col gap-6 max-w-3xl">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Typ bodu</div>
        <div className="inline-flex rounded-md border border-border overflow-hidden text-sm">
          <button
            onClick={() => onUpdate({ ...checkpoint, kind: "generic" })}
            className={isDnesniDoruceni ? "px-3 py-1.5 text-muted-foreground" : "px-3 py-1.5 bg-primary-soft text-primary font-medium"}
          >
            Běžný bod
          </button>
          <button
            onClick={() =>
              onUpdate({
                ...checkpoint,
                kind: "dnesni_doruceni",
                dnesniDoruceni: checkpoint.dnesniDoruceni ?? {
                  scan1: { match: {}, deadline: { id: "corr_" + Date.now() + "_s1", aspect: "record_event_time", mode: "fixed", anchorKind: "system_event", anchorLabel: "ADD (avizované doručení zákazníkovi)", operator: "within", fixedOp: "before", fixedTime: "08:00", fixedTz: "local" } },
                  limitProRadneZaznamy: { mode: "offset", offsetHours: 1 },
                  konecnyLimitScan1: { mode: "offset", offsetHours: 2 },
                  scan2: { match: {}, deadline: { id: "corr_" + Date.now() + "_s2", aspect: "record_event_time", mode: "offset", anchorKind: "checkpoint", anchorLabel: "od 1. fyzického scanu", operator: "within", value: 2, unit: "h" } },
                  konecnyLimitScan2: { mode: "offset", offsetHours: 1 },
                },
              })
            }
            className={isDnesniDoruceni ? "px-3 py-1.5 bg-primary-soft text-primary font-medium" : "px-3 py-1.5 text-muted-foreground"}
          >
            Dnešní doručení
          </button>
        </div>
      </div>

      {isDnesniDoruceni && checkpoint.dnesniDoruceni ? (
        <DnesniDoruceniEditablePanel
          segment={segment}
          checkpointId={checkpoint.id}
          config={checkpoint.dnesniDoruceni}
          onChange={(config) => onUpdate({ ...checkpoint, dnesniDoruceni: config })}
        />
      ) : null}

      {!isDnesniDoruceni && (
        <>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-sm font-semibold mb-3">Co musí být na záznamu</div>
            <MatchEditor value={checkpoint.match} onChange={(match) => onUpdate({ ...checkpoint, match })} />
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-sm font-semibold mb-3">Termín</div>
            <TerminEditor
              segment={segment}
              currentCheckpointId={checkpoint.id}
              value={checkpoint.correctness[0] ?? { id: "corr_" + checkpoint.id, aspect: "record_event_time", mode: "fixed", anchorKind: "system_event", anchorLabel: "Vyzvednutí zásilky", operator: "within", fixedOp: "before", fixedTime: "12:00", fixedTz: "local" }}
              onChange={(corr) => onUpdate({ ...checkpoint, correctness: [corr] })}
            />
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-sm font-semibold mb-3">Konečný limit</div>
            <TimeLimitEditor
              label="Konečný limit"
              value={checkpoint.konecnyLimit ?? { mode: "offset", offsetHours: 0 }}
              onChange={(limit) => onUpdate({ ...checkpoint, konecnyLimit: limit })}
            />
            <div className="text-xs text-muted-foreground mt-2">{formatTimeLimit(checkpoint.konecnyLimit ?? { mode: "offset", offsetHours: 0 })} — jediná kontrola tohoto bodu, žádná vazba na ADD/D.</div>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Situace, které z tohoto bodu mohou vzniknout
            </div>
            <div className="flex flex-col gap-3">
              <div className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
                <b className="text-foreground">Řádně nalezen do Termínu</b> — žádná věc k řešení, řetězec pokračuje na další bod.
              </div>
              <SituaceCard
                headline="Nenalezen do Termínu"
                situationId={ROUTE_COMPLIANCE_SITUATIONS.problemNaTrase.situationId}
                severityId={ROUTE_COMPLIANCE_SITUATIONS.problemNaTrase.severityId}
              />
              <SituaceCard
                headline="Objeví se později (reaktivně, po Konečném limitu)"
                situationId={ROUTE_COMPLIANCE_SITUATIONS.problemNaTrasePozde.situationId}
                severityId={ROUTE_COMPLIANCE_SITUATIONS.problemNaTrasePozde.severityId}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
