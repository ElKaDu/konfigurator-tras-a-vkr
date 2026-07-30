import { checklistItemsStore, kontaktyStore } from "./store";
import type { ChecklistItem, Kontakt } from "./types";

/**
 * Po každé změně findingIsSuspicion/resolutionNeedsConfirm dorovná navázání položky na
 * rozjednaný nebo naplánovaný kontakt (jeden call pro vše, co čeká). Pokud žádný takový
 * neexistuje, založí nový "draft" — call bez termínu, který se v pravém sloupci hned zobrazí
 * k doplnění. Odpojí položku, pokud už žádný checkbox není zatržený.
 */
export function syncKontaktAttachment(next: ChecklistItem): void {
  const needsContact = next.findingIsSuspicion || next.resolutionNeedsConfirm;

  if (needsContact && !next.kontaktId) {
    const target = createDraftKontakt();
    checklistItemsStore.update(next.id, { kontaktId: target.id });
    if (!target.linkedItemIds.includes(next.id)) {
      kontaktyStore.update(target.id, { linkedItemIds: [...target.linkedItemIds, next.id] });
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

/** Založí prázdný rozjednaný call, nebo vrátí ten, co už existuje (nikdy dva zároveň). */
export function createDraftKontakt(): Kontakt {
  const existing = kontaktyStore.all().find((k) => k.status === "draft" || k.status === "planned");
  if (existing) return existing;
  const kontakt: Kontakt = {
    id: "kontakt_" + Date.now(),
    type: "customer",
    status: "draft",
    linkedItemIds: [],
  };
  kontaktyStore.create(kontakt);
  return kontakt;
}
