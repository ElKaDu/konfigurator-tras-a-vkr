export function triggerLabel(kind: string): string {
  if (kind === "condition_met") return "Podmínka";
  if (kind === "schedule") return "Časovač";
  return "Manuálně";
}

export function priorityLabel(p: string): string {
  return p.toUpperCase();
}

export function isPriorityHigh(p: string): boolean {
  return p === "high" || p === "urgent";
}
