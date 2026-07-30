import { checklistItemsStore, kontaktyStore } from "./store";
import type { ChecklistItem } from "./types";

/**
 * Po každé změně findingIsSuspicion/resolutionNeedsConfirm dorovná navázání položky na
 * aktuálně naplánovaný kontakt (jeden call pro vše, co čeká), nebo ji odpojí, pokud už žádný
 * checkbox není zatržený.
 */
export function syncKontaktAttachment(next: ChecklistItem): void {
  const needsContact = next.findingIsSuspicion || next.resolutionNeedsConfirm;

  if (needsContact && !next.kontaktId) {
    const planned = kontaktyStore.all().find((k) => k.status === "planned");
    if (planned) {
      checklistItemsStore.update(next.id, { kontaktId: planned.id });
      if (!planned.linkedItemIds.includes(next.id)) {
        kontaktyStore.update(planned.id, { linkedItemIds: [...planned.linkedItemIds, next.id] });
      }
    }
    return;
  }

  if (!needsContact && next.kontaktId) {
    const kontakt = kontaktyStore.byId(next.kontaktId);
    if (kontakt) {
      kontaktyStore.update(kontakt.id, {
        linkedItemIds: kontakt.linkedItemIds.filter((id) => id !== next.id),
      });
    }
    checklistItemsStore.update(next.id, { kontaktId: undefined });
  }
}
