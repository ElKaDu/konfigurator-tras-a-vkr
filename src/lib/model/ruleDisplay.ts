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
      return (severity.actions ?? []).map((a) => ({
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

/* ── Čitelný popis podmínek pro detail pravidla ───────────────────────── */

import { TRACKING_FIELDS, isIncomingConditionRow, isHistoricalConditionRow } from "@/lib/model/trackingFields";
import { findVkrField, findVkrOperator, type VkrCondition } from "@/lib/vkr/vkrConditionCatalog";

const trackingFieldLabel = (id: string) =>
  TRACKING_FIELDS.find((f) => f.value === id)?.label ?? id;

export interface ConditionGroup {
  label: string;
  items: string[];
}

/**
 * Podmínky pravidla ve stejném členění, jaké má editor: příchozí záznam,
 * historické záznamy, co dále platí. Prázdné skupiny se nevracejí.
 * „Co dále platí" žije v uiState, ne v rule.conditions — proto ten samostatný zdroj.
 */
export function describeRuleConditions(rule: Rule): ConditionGroup[] {
  const groups: ConditionGroup[] = [];

  const incoming = rule.conditions.filter(isIncomingConditionRow).map((c) => {
    const value = c.value?.trim();
    return `${trackingFieldLabel(c.fieldId)} ${c.operator}${value ? ` ${value}` : ""}`;
  });
  if (incoming.length) groups.push({ label: "Příchozí záznam", items: incoming });

  const historical = rule.conditions.filter(isHistoricalConditionRow).map((c) => {
    const negated = c.mode === "not_contains";
    const scope = c.scope === "anywhere" ? "kdekoliv v historii" : "jen předchozí záznam";
    const value = c.expectedValue?.trim();
    return `${trackingFieldLabel(c.trackingFieldId)} ${negated ? "není" : "je"}${value ? ` ${value}` : ""} — ${scope}`;
  });
  if (historical.length) groups.push({ label: "Historické záznamy", items: historical });

  const vkr = (rule.uiState?.vkrConditions as VkrCondition[] | undefined) ?? [];
  const extra = vkr.map((c) => {
    const field = findVkrField(c.fieldId);
    const operator = findVkrOperator(c.fieldId, c.operator);
    const value = c.value?.trim();
    return [field?.label ?? c.fieldId, operator?.label ?? c.operator, value, operator?.valueSuffix]
      .filter(Boolean)
      .join(" ");
  });
  if (extra.length) groups.push({ label: "Co dále platí", items: extra });

  return groups;
}
