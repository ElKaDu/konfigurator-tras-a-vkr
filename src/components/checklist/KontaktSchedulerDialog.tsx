import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useChecklistItems, checklistItemsStore, kontaktyStore, templateById } from "@/lib/checklist/store";
import { deriveItemState } from "@/lib/checklist/derived";
import type { KontaktType } from "@/lib/checklist/types";

export function KontaktSchedulerDialog({ onClose }: { onClose: () => void }) {
  const items = useChecklistItems();
  const eligible = items.filter((i) => deriveItemState(i) === "waiting_contact" && !i.kontaktId);

  const [type, setType] = useState<KontaktType>("customer");
  const [scheduledAt, setScheduledAt] = useState(defaultDateTimeLocal());
  const [note, setNote] = useState("");

  function submit() {
    const id = "kontakt_" + Date.now();
    const itemIds = eligible.map((i) => i.id);
    kontaktyStore.create({
      id,
      type,
      scheduledAt: new Date(scheduledAt).toISOString(),
      note: note || undefined,
      status: "planned",
      linkedItemIds: itemIds,
    });
    itemIds.forEach((itemId) => {
      checklistItemsStore.update(itemId, { kontaktId: id });
    });
    onClose();
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Naplánovat kontakt</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Typ</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as KontaktType)}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            >
              <option value="customer">Zákazník</option>
              <option value="carrier">Přepravce</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Termín</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Poznámka</label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Co se bude probírat…" />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Tento call se týká {eligible.length} {eligible.length === 1 ? "položky" : "položek"} — připojily se samy
            </label>
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-border p-2">
              {eligible.length === 0 && (
                <p className="px-1 py-2 text-xs text-muted-foreground">Žádná položka zatím nečeká na kontakt.</p>
              )}
              {eligible.map((i) => {
                const tpl = templateById(i.templateId);
                return (
                  <div key={i.id} className="rounded px-1.5 py-1 text-[13px]">
                    {tpl?.title}
                  </div>
                );
              })}
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Seznam je jen náhled — co se má na call probrat, se řeší checkboxem přímo u položky.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Zrušit
          </Button>
          <Button onClick={submit} disabled={eligible.length === 0}>
            Naplánovat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function defaultDateTimeLocal(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
