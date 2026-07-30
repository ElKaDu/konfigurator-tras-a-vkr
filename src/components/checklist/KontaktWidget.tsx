import { useState } from "react";
import { Phone } from "lucide-react";
import { useKontakty, useChecklistItems, templateById } from "@/lib/checklist/store";
import { nextPlannedKontakt, formatKontaktDateTime } from "@/lib/checklist/derived";
import { KontaktSchedulerDialog } from "./KontaktSchedulerDialog";

export function KontaktWidget() {
  const kontakty = useKontakty();
  const items = useChecklistItems();
  const [scheduling, setScheduling] = useState(false);
  const next = nextPlannedKontakt(kontakty);

  if (!next) {
    return (
      <>
        <button
          onClick={() => setScheduling(true)}
          className="flex flex-1 min-w-[220px] items-center gap-3 rounded-lg border border-dashed border-input bg-card px-4 py-3 text-left hover:bg-muted"
        >
          <Phone className="size-5 shrink-0 text-muted-foreground" />
          <div>
            <div className="text-[13px] font-semibold">Naplánovat kontakt</div>
            <div className="text-[11px] text-muted-foreground">žádný zatím naplánovaný</div>
          </div>
        </button>
        {scheduling && <KontaktSchedulerDialog onClose={() => setScheduling(false)} />}
      </>
    );
  }

  const linkedTitles = next.linkedItemIds
    .map((id) => items.find((i) => i.id === id))
    .filter((i): i is NonNullable<typeof i> => !!i)
    .map((i) => templateById(i.templateId)?.title)
    .filter(Boolean);

  return (
    <div className="flex flex-1 min-w-[220px] items-center gap-3 rounded-lg border border-info bg-info/10 px-4 py-3">
      <Phone className="size-5 shrink-0 text-info-foreground" />
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold text-info-foreground">
          Kontakt naplánován — {formatKontaktDateTime(next.scheduledAt)}
        </div>
        <div className="truncate text-[11px] text-muted-foreground">
          {next.type === "customer" ? "Zákazník" : "Přepravce"} · {linkedTitles.length} položky: {linkedTitles.join(", ")}
        </div>
      </div>
    </div>
  );
}
