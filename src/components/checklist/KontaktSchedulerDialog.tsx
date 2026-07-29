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
import { useChecklistItems, checklistItemsStore, kontaktyStore } from "@/lib/checklist/store";
import { templateById } from "@/lib/checklist/store";
import type { KontaktType } from "@/lib/checklist/types";

export function KontaktSchedulerDialog({
  preselectedItemIds,
  onClose,
}: {
  preselectedItemIds: string[];
  onClose: () => void;
}) {
  const items = useChecklistItems();
  const selectable = items.filter(
    (i) => i.state === "open" || (i.state === "waiting_contact" && preselectedItemIds.includes(i.id))
  );

  const [type, setType] = useState<KontaktType>("customer");
  const [scheduledAt, setScheduledAt] = useState(defaultDateTimeLocal());
  const [note, setNote] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set(preselectedItemIds));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function submit() {
    const id = "kontakt_" + Date.now();
    kontaktyStore.create({
      id,
      type,
      scheduledAt: new Date(scheduledAt).toISOString(),
      note: note || undefined,
      status: "planned",
      linkedItemIds: [...selected],
    });
    selected.forEach((itemId) => {
      checklistItemsStore.update(itemId, { state: "waiting_contact", kontaktId: id });
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
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Navázané položky</label>
            <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-md border border-border p-2">
              {selectable.length === 0 && (
                <p className="px-1 py-2 text-xs text-muted-foreground">Žádné otevřené položky k výběru.</p>
              )}
              {selectable.map((i) => {
                const tpl = templateById(i.templateId);
                return (
                  <label key={i.id} className="flex items-center gap-2 rounded px-1.5 py-1 text-[13px] hover:bg-muted">
                    <input type="checkbox" checked={selected.has(i.id)} onChange={() => toggle(i.id)} />
                    {tpl?.title}
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Zrušit
          </Button>
          <Button onClick={submit} disabled={selected.size === 0}>
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
