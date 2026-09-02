import { findSeverityById } from "./store";
import type { Action, Priority, Rule } from "./types";

/** Názvy spouštěčů — stejné, jaké si uživatel vybírá v editoru pravidla. */
export function triggerLabel(kind: string): string {
  if (kind === "condition_met") return "Automaticky";
  if (kind === "schedule") return "Časovač";
  return "Manuálně";
}

const PRIORITY_LABELS: Record<string, string> = {
  low: "Nízká",
  medium: "Vyšší",
  high: "Vysoká",
  urgent: "Urgentní",
};

export function priorityLabel(p: string): string {
  return PRIORITY_LABELS[p] ?? p;
}

export function isPriorityHigh(p: string): boolean {
  return p === "high" || p === "urgent";
}

/**
 * Needitovatelná priorita pravidla. Pokud má pravidlo severityId, vrací VŽDY
 * aktuální prioritu ze Závažnosti (živý odkaz, stejný princip jako resolveRuleActions),
 * ne uloženou kopii. Bez severityId (ostatní oblasti mimo tracking) padá zpět na rule.priority.
 */
export function resolveRulePriority(rule: Rule): Priority {
  if (rule.severityId) {
    const severity = findSeverityById(rule.severityId);
    if (severity) return severity.priority;
  }
  return rule.priority;
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
