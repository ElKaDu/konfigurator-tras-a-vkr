import { findSeverityById } from "./store";
import type { Action, Rule } from "./types";

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

/**
 * Needitovatelné akce navázané na pravidlo. Pokud má pravidlo severityId, vrací VŽDY
 * aktuální akce ze Závažnosti (živý odkaz — viz docs/superpowers/specs/2026-07-24-akce-needitovatelne-design.md),
 * ne uloženou kopii. Bez severityId (ostatní oblasti mimo tracking) padá zpět na rule.actions.
 */
export function resolveRuleActions(rule: Rule): Action[] {
  if (rule.severityId) {
    const severity = findSeverityById(rule.severityId);
    if (severity) {
      return severity.actions.map((a) => ({
        id: a.id,
        type: "create_vkr",
        title: rule.name,
        vkrText: a.description || undefined,
        actionTagId: a.actionTagId,
      }));
    }
  }
  return rule.actions;
}
