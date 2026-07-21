import type { DnesniDoruceniConfig, Segment } from "@/lib/model/types";
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
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="text-sm font-semibold mb-3">2. fyzický scan</div>
        <MatchEditor
          value={config.scan2.match}
          onChange={(match) => onChange({ ...config, scan2: { ...config.scan2, match } })}
          showZipMatchesDestination
        />
        <div className="mt-3">
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
      </div>
    </div>
  );
}
