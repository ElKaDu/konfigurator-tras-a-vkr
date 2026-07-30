import { useChecklistItems, useKontakty, kontaktyStore, templateById } from "@/lib/checklist/store";
import { noteworthyItems, formatKontaktDateTime } from "@/lib/checklist/derived";
import type { Kontakt } from "@/lib/checklist/types";

export function ShrnutiNalezuPanel() {
  const items = useChecklistItems();
  const kontakty = useKontakty();
  const noteworthy = noteworthyItems(items);

  // Rozjednané cally (draft) sem nepatří — v shrnutí má být jen to, co má termín nebo proběhlo.
  const relevantKontakty = kontakty.filter((k) => k.status !== "draft");

  if (relevantKontakty.length === 0 && noteworthy.length === 0) return null;

  const sortedKontakty = [...relevantKontakty].sort(
    (a, b) => new Date(b.scheduledAt ?? 0).getTime() - new Date(a.scheduledAt ?? 0).getTime(),
  );

  return (
    <div className="rounded-lg border border-border bg-card p-3.5">
      <p className="mb-2.5 text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">Shrnutí</p>

      {sortedKontakty.length > 0 && (
        <div className="mb-3 flex flex-col gap-2.5 border-b border-border pb-3">
          {sortedKontakty.map((k) => (
            <KontaktRow key={k.id} kontakt={k} />
          ))}
        </div>
      )}

      {noteworthy.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {noteworthy.map((item) => {
            const tpl = templateById(item.templateId);
            return (
              <div key={item.id} className="border-b border-border pb-2.5 last:border-0 last:pb-0">
                <div className="text-[12.5px] font-semibold">{tpl?.title}</div>
                {item.findingValue && (
                  <div className="mt-0.5 text-[11.5px] text-foreground">
                    <b>Nález:</b> {item.findingValue}
                  </div>
                )}
                {item.resolutionValue && (
                  <div className="text-[11.5px] text-foreground">
                    <b>Řešení:</b> {item.resolutionValue}
                  </div>
                )}
                {item.noteValue && (
                  <div className="text-[11.5px] text-muted-foreground">
                    <b>Poznámka:</b> {item.noteValue}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function KontaktRow({ kontakt }: { kontakt: Kontakt }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-[12px]">
        <span className="font-semibold">
          {kontakt.type === "customer" ? "Zákazník" : kontakt.type === "carrier" ? "Přepravce" : "Typ nezvolen"} ·{" "}
          {formatKontaktDateTime(kontakt.scheduledAt)}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide ${
            kontakt.status === "done" ? "bg-success/15 text-success-foreground" : "bg-warning/15 text-warning-foreground"
          }`}
        >
          {kontakt.status === "done" ? "proběhl" : "naplánován"}
        </span>
      </div>
      <textarea
        value={kontakt.note ?? ""}
        onChange={(e) => kontaktyStore.update(kontakt.id, { note: e.target.value || undefined })}
        rows={1}
        placeholder="Poznámka k callu…"
        aria-label="Poznámka k callu"
        className="mt-1 w-full rounded-md border border-input bg-transparent px-2 py-1 text-[11.5px]"
      />
    </div>
  );
}
