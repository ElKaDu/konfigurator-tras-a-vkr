import { useState } from "react";
import type { ChecklistItemTemplate } from "@/lib/checklist/types";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export type ResolutionOutcome =
  | { kind: "ok" }
  | { kind: "found"; finding: string; resolution: string }
  | { kind: "found_waiting_delivery"; finding: string; resolution: string }
  | { kind: "needs_contact"; finding: string };

export function ItemResolutionForm({
  template,
  mode,
  onSubmit,
  onCancel,
}: {
  template: ChecklistItemTemplate;
  /** "initial" = první průchod (nabízí podezření → kontakt). "after_contact" = po proběhlém callu
   *  (nabízí "pořád nejasné → nový kontakt" místo podezření). */
  mode: "initial" | "after_contact";
  onSubmit: (outcome: ResolutionOutcome) => void;
  onCancel: () => void;
}) {
  const [reporting, setReporting] = useState(false);
  const [finding, setFinding] = useState("");
  const [resolution, setResolution] = useState(template.resolutionOptions[0] ?? "");
  const [isSuspicion, setIsSuspicion] = useState(false);
  const [waitingDelivery, setWaitingDelivery] = useState(false);

  if (!reporting) {
    return (
      <div className="mt-2.5 flex gap-2">
        <Button size="sm" onClick={() => onSubmit({ kind: "ok" })}>
          ✓ V pořádku
        </Button>
        <Button size="sm" variant="outline" onClick={() => setReporting(true)}>
          ⚠ Nahlásit nález
        </Button>
        {mode === "after_contact" && (
          <Button size="sm" variant="outline" onClick={() => onSubmit({ kind: "needs_contact", finding: "" })}>
            📞 Pořád nejasné — další kontakt
          </Button>
        )}
      </div>
    );
  }

  function submit() {
    if (mode === "initial" && isSuspicion) {
      onSubmit({ kind: "needs_contact", finding });
      return;
    }
    if (waitingDelivery) {
      onSubmit({ kind: "found_waiting_delivery", finding, resolution });
      return;
    }
    onSubmit({ kind: "found", finding, resolution });
  }

  const submitLabel =
    mode === "initial" && isSuspicion
      ? "Naplánovat kontakt"
      : waitingDelivery
        ? "Uložit — čeká na dodání"
        : "Uzavřít nález";

  return (
    <div className="mt-2.5 rounded-lg border border-border bg-background p-3">
      <label className="mb-2 block text-xs font-medium text-muted-foreground">Co je špatně (nález)</label>
      <Textarea value={finding} onChange={(e) => setFinding(e.target.value)} rows={2} className="mb-3" />

      <label className="mb-2 block text-xs font-medium text-muted-foreground">Řešení</label>
      <select
        value={resolution}
        onChange={(e) => setResolution(e.target.value)}
        className="mb-3 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
      >
        {template.resolutionOptions.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>

      {mode === "initial" && (
        <label className="mb-2 flex items-center gap-2 text-xs">
          <input type="checkbox" checked={isSuspicion} onChange={(e) => setIsSuspicion(e.target.checked)} />
          Jde jen o podezření — potřebuji to nejdřív probrat s klientem
        </label>
      )}

      {!isSuspicion && (
        <label className="mb-3 flex items-center gap-2 text-xs">
          <input type="checkbox" checked={waitingDelivery} onChange={(e) => setWaitingDelivery(e.target.checked)} />
          Řešení čeká na dodání něčeho (dokument, registrace)
        </label>
      )}

      <div className="flex gap-2">
        <Button size="sm" onClick={submit} disabled={!finding.trim()}>
          {submitLabel}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Zrušit
        </Button>
      </div>
    </div>
  );
}
