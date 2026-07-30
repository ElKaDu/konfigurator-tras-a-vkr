import type { ChecklistCategory, ChecklistItem, ChecklistItemState, Kontakt } from "./types";
import { CHECKLIST_CATEGORY_ORDER, CHECKLIST_CATEGORY_LABELS } from "./types";
import { templateById } from "./store";
import { kontaktyStore } from "./store";

export function deriveItemState(item: ChecklistItem): ChecklistItemState {
  if (item.manuallyResolved) return "resolved";
  if (item.findingIsSuspicion || item.resolutionNeedsConfirm) return "waiting_contact";
  return "open";
}

/** Volat, jen když deriveItemState(item) === "waiting_contact". */
export function waitingContactDetail(item: ChecklistItem): "missing_resolution" | "needs_confirm" {
  return item.resolutionValue ? "needs_confirm" : "missing_resolution";
}

export function isResolved(item: ChecklistItem): boolean {
  return deriveItemState(item) === "resolved";
}

export interface CategoryCount {
  category: ChecklistCategory;
  label: string;
  resolved: number;
  total: number;
}

export function categoryCounts(items: ChecklistItem[]): CategoryCount[] {
  return CHECKLIST_CATEGORY_ORDER.map((category) => {
    const inCategory = items.filter((i) => templateById(i.templateId)?.category === category);
    return {
      category,
      label: CHECKLIST_CATEGORY_LABELS[category],
      resolved: inCategory.filter(isResolved).length,
      total: inCategory.length,
    };
  });
}

export type ChecklistStatusKind = "in_progress" | "waiting_contact" | "overdue" | "done";

export interface ChecklistStatus {
  kind: ChecklistStatusKind;
  label: string;
  resolvedCount: number;
  totalCount: number;
  progressPct: number;
}

export function computeChecklistStatus(items: ChecklistItem[]): ChecklistStatus {
  const resolvedCount = items.filter(isResolved).length;
  const totalCount = items.length;
  const progressPct = totalCount === 0 ? 0 : Math.round((resolvedCount / totalCount) * 100);

  if (resolvedCount === totalCount) {
    return { kind: "done", label: "Hotovo", resolvedCount, totalCount, progressPct };
  }

  const plannedKontakty = kontaktyStore.all().filter((k: Kontakt) => k.status === "planned");
  if (plannedKontakty.length > 0) {
    const now = Date.now();
    const overdue = plannedKontakty.some((k) => new Date(k.scheduledAt).getTime() < now);
    if (overdue) {
      return { kind: "overdue", label: "⏱ Po termínu kontaktu", resolvedCount, totalCount, progressPct };
    }
    return { kind: "waiting_contact", label: "⏱ Čeká na kontakt", resolvedCount, totalCount, progressPct };
  }

  return { kind: "in_progress", label: "V průběhu", resolvedCount, totalCount, progressPct };
}

/** Položky s nálezem nebo poznámkou, bez ohledu na stav — pro rozšířený panel Shrnutí. */
export function noteworthyItems(items: ChecklistItem[]): ChecklistItem[] {
  return items.filter((i) => !!i.findingValue || !!i.noteValue);
}

export function nextPlannedKontakt(kontakty: Kontakt[]): Kontakt | undefined {
  return kontakty
    .filter((k) => k.status === "planned")
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0];
}

export function formatKontaktDateTime(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" }).format(d);
}
