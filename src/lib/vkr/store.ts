import { useEffect, useState } from "react";
import type { Rule } from "./types";
import { SEED_RULES } from "./mockData";

const KEY = "vkr_rules_v13";
const LEGACY_KEYS: string[] = ["vkr_rules_v10", "vkr_rules_v11", "vkr_rules_v12"];

type LegacyAction = Record<string, unknown> & {
  runWhen?: "always" | "on_problem" | "no_problem" | "occurred" | "not_occurred";
  runWhenField?: unknown;
  runWhenRouteCondition?: "fulfilled" | "not_fulfilled";
  captureTrackingEventTimestamp?: boolean;
};

function migrateRule(r: Record<string, unknown>): Rule {
  const legacyRuleRunWhen =
    (r as { runWhenProblem?: LegacyAction["runWhen"] }).runWhenProblem;
  const actions = ((r.actions as LegacyAction[] | undefined) ?? []).map((a) => {
    const {
      runWhen, runWhenField, runWhenRouteCondition, captureTrackingEventTimestamp: _drop,
      ...rest
    } = a;
    let condResult = runWhenRouteCondition;
    const src = runWhen ?? legacyRuleRunWhen;
    if (!condResult && src) {
      if (src === "on_problem" || src === "occurred") condResult = "not_fulfilled";
      else if (src === "no_problem" || src === "not_occurred") condResult = "fulfilled";
    }
    let fieldList: Array<unknown> | undefined;
    if (Array.isArray(runWhenField)) fieldList = runWhenField as unknown[];
    else if (runWhenField && typeof runWhenField === "object") fieldList = [runWhenField as unknown];
    return {
      ...rest,
      ...(condResult ? { runWhenRouteCondition: condResult } : {}),
      ...(fieldList && fieldList.length ? { runWhenField: fieldList } : {}),
    } as unknown;
  });
  const { runWhenProblem: _omit, ...ruleRest } = r as Record<string, unknown> & { runWhenProblem?: unknown };
  return { ...(ruleRest as unknown as Rule), actions: actions as Rule["actions"] };
}

function load(): Rule[] {
  if (typeof window === "undefined") return SEED_RULES;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Rule[];
    for (const k of LEGACY_KEYS) {
      const legacy = localStorage.getItem(k);
      if (legacy) {
        const parsed = JSON.parse(legacy) as Array<Record<string, unknown>>;
        return parsed.map(migrateRule);
      }
    }
    return SEED_RULES;
  } catch {
    return SEED_RULES;
  }
}

let state: Rule[] = SEED_RULES;
let hydrated = false;
const listeners = new Set<() => void>();

function persist() {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  state = load();
  hydrated = true;
}

export function useRules() {
  const [, force] = useState(0);
  useEffect(() => {
    hydrate();
    force((n) => n + 1);
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return state;
}

export const rulesStore = {
  all: () => state,
  upsert(rule: Rule) {
    const idx = state.findIndex((r) => r.id === rule.id);
    if (idx >= 0) state = state.map((r) => (r.id === rule.id ? { ...rule, updatedAt: new Date().toISOString() } : r));
    else state = [...state, { ...rule, runs30d: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }];
    persist();
  },
  toggle(id: string) {
    state = state.map((r) => (r.id === id ? { ...r, active: !r.active, updatedAt: new Date().toISOString() } : r));
    persist();
  },
  archive(id: string) {
    state = state.map((r) => (r.id === id ? { ...r, active: false, archivedAt: new Date().toISOString() } : r));
    persist();
  },
  unarchive(id: string) {
    state = state.map((r) => {
      if (r.id !== id) return r;
      const { archivedAt: _omit, ...rest } = r;
      return rest as Rule;
    });
    persist();
  },
  duplicate(id: string) {
    const src = state.find((r) => r.id === id);
    if (!src) return;
    const copy: Rule = {
      ...src,
      id: `id_${Math.random().toString(36).slice(2, 10)}`,
      name: `${src.name} (kopie)`,
      code: `${src.code}'`,
      active: false,
      archivedAt: undefined,
      runs30d: 0,
      lastRunAt: undefined,
      history: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    state = [...state, copy];
    persist();
  },
  reset() {
    state = SEED_RULES;
    persist();
  },
  replaceAll(rules: Rule[]) {
    state = rules;
    persist();
  },
};
