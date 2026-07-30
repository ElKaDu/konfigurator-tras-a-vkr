import { useChecklistItems, useKontakty, kontaktyStore, templateById } from "@/lib/checklist/store";
import { formatKontaktDateTime } from "@/lib/checklist/derived";
import { createDraftKontakt } from "@/lib/checklist/kontaktSync";
import type { ChecklistItem, Kontakt, KontaktType } from "@/lib/checklist/types";
import { Button } from "@/components/ui/button";

export function CallPanel() {
  const kontakty = useKontakty();
  const items = useChecklistItems();

  const active = kontakty.find((k) => k.status === "draft" || k.status === "planned");
  const done = kontakty.filter((k) => k.status === "done");

  return (
    <div className="flex flex-col gap-3">
      {active ? (
        <ActiveCallCard kontakt={active} items={items} />
      ) : (
        <div className="rounded-lg border border-dashed border-input bg-card p-3.5 text-center">
          <button
            onClick={() => createDraftKontakt()}
            className="text-[12px] font-bold text-primary hover:underline"
          >
            + Naplánovat kontakt ručně
          </button>
        </div>
      )}

      {done.map((k) => (
        <DoneCallCard key={k.id} kontakt={k} />
      ))}
    </div>
  );
}

function ActiveCallCard({ kontakt, items }: { kontakt: Kontakt; items: ChecklistItem[] }) {
  const linked = kontakt.linkedItemIds
    .map((id) => items.find((i) => i.id === id))
    .filter((i): i is ChecklistItem => !!i);

  const isPlanned = !!kontakt.scheduledAt;

  function patch(fields: Partial<Kontakt>) {
    kontaktyStore.update(kontakt.id, fields);
  }

  function markDone() {
    kontaktyStore.update(kontakt.id, { status: "done" });
  }

  return (
    <div className="rounded-lg border border-info bg-info/10 p-3.5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[10.5px] font-bold uppercase tracking-wide text-info-foreground">
          📞 Plánování callu
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide ${
            isPlanned ? "bg-success/15 text-success-foreground" : "bg-warning/15 text-warning-foreground"
          }`}
        >
          {isPlanned ? "naplánováno" : "rozjednáno"}
        </span>
      </div>

      <div className="mb-2 rounded-md bg-surface p-2">
        {linked.length === 0 && (
          <p className="text-[11px] text-muted-foreground">
            Zatím nic k probrání — zatrhni „podezření“ nebo „potvrdit s klientem“ u položky.
          </p>
        )}
        {linked.map((item) => {
          const hasFindingContext = item.findingIsSuspicion && item.findingValue;
          const hasResolutionContext = item.resolutionNeedsConfirm && item.resolutionValue;
          const findingPending = item.findingIsSuspicion && !item.findingValue;
          const resolutionPending = item.resolutionNeedsConfirm && !item.resolutionValue;
          return (
            <div key={item.id} className="py-0.5 text-[11px]">
              <b>{templateById(item.templateId)?.title}</b>
              {hasFindingContext && <> — nález: {item.findingValue}</>}
              {hasResolutionContext && <> — řešení: {item.resolutionValue}</>}
              {findingPending && <> — podezření zatrženo, nález se doplňuje</>}
              {resolutionPending && <> — čeká na potvrzení řešení</>}
            </div>
          );
        })}
      </div>

      <div className="mb-1.5">
        <label className="mb-0.5 block text-[9.5px] font-bold uppercase tracking-wide text-muted-foreground">
          Typ
        </label>
        <select
          value={kontakt.type ?? ""}
          onChange={(e) => patch({ type: (e.target.value || undefined) as KontaktType | undefined })}
          aria-label="Typ kontaktu"
          className="w-full rounded-md border border-input bg-surface px-2 py-1.5 text-[11.5px]"
        >
          <option value="">— nevybráno —</option>
          <option value="customer">Zákazník</option>
          <option value="carrier">Přepravce</option>
        </select>
      </div>

      <div className="mb-1.5">
        <label className="mb-0.5 block text-[9.5px] font-bold uppercase tracking-wide text-muted-foreground">
          Termín
        </label>
        <input
          type="datetime-local"
          value={toDateTimeLocal(kontakt.scheduledAt)}
          onChange={(e) =>
            patch({
              scheduledAt: e.target.value ? new Date(e.target.value).toISOString() : undefined,
              status: e.target.value ? "planned" : "draft",
            })
          }
          aria-label="Termín kontaktu"
          className="w-full rounded-md border border-input bg-surface px-2 py-1.5 text-[11.5px]"
        />
      </div>

      <div className="mb-2">
        <label className="mb-0.5 block text-[9.5px] font-bold uppercase tracking-wide text-muted-foreground">
          Poznámka
        </label>
        <textarea
          value={kontakt.note ?? ""}
          onChange={(e) => patch({ note: e.target.value || undefined })}
          rows={2}
          placeholder="Co se bude probírat…"
          aria-label="Poznámka k callu"
          className="w-full rounded-md border border-input bg-surface px-2 py-1.5 text-[11.5px]"
        />
      </div>

      <Button size="sm" className="w-full" onClick={markDone} disabled={!isPlanned}>
        ✓ Call proběhl
      </Button>
    </div>
  );
}

function DoneCallCard({ kontakt }: { kontakt: Kontakt }) {
  return (
    <div className="rounded-lg border border-border bg-muted p-3.5">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">📞 Call</span>
        <span className="rounded-full bg-success/15 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-success-foreground">
          proběhlo
        </span>
      </div>
      <div className="text-[11.5px] font-semibold">
        {kontaktTypeLabel(kontakt.type)} · {formatKontaktDateTime(kontakt.scheduledAt)}
      </div>
      {kontakt.note && <div className="mt-1 text-[11px] text-muted-foreground">{kontakt.note}</div>}
    </div>
  );
}

function kontaktTypeLabel(type: KontaktType | undefined): string {
  if (type === "customer") return "Zákazník";
  if (type === "carrier") return "Přepravce";
  return "Typ nezvolen";
}

/** ISO → hodnota pro <input type="datetime-local"> ("2026-07-31T10:00"). Prázdný string pro draft. */
function toDateTimeLocal(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
