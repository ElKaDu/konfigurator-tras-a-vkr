/**
 * Sdílený slovník typů problémů (např. „Možné zpoždění zásilky v den doručení",
 * „Dlouho na clení"). Operátor je vybírá v editoru trasy (sekce 4) a v editoru
 * pravidla VkŘ (podmínka „Soulad s obchodní trasou").
 *
 * Jméno je case-insensitive unikátní — `upsertByName` zabrání typo-duplikátům.
 */

import { useEffect, useState } from "react";
import type { Route } from "./types";

export interface ProblemType {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

const KEY = "problem_types_v1";

/** Default slovník — naplní se při prvním načtení, pokud je localStorage prázdný. */
const SEED_PROBLEM_TYPES: ProblemType[] = [
  { id: "pt_late_today", name: "Možné zpoždění zásilky v den doručení", description: "Některý z klíčových checkpointů v den doručení nedoběhl.", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "pt_customs_stuck", name: "Dlouho na clení", description: "Zásilka uvízla v celním řízení déle, než je pro danou trasu obvyklé.", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "pt_hub_stuck", name: "Uvíznutí v hubu", description: "Zásilka stojí v hubu déle, než stanovuje optimální trasa.", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "pt_wrong_place", name: "Doručení na špatné místo", description: "Tracking ukazuje zásilku mimo očekávané místo trasy.", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

function load(): ProblemType[] {
  if (typeof window === "undefined") return SEED_PROBLEM_TYPES;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return SEED_PROBLEM_TYPES;
    return JSON.parse(raw) as ProblemType[];
  } catch {
    return SEED_PROBLEM_TYPES;
  }
}

let state: ProblemType[] = SEED_PROBLEM_TYPES;
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

const newId = () => `pt_${Math.random().toString(36).slice(2, 10)}`;

export const problemTypesStore = {
  all: () => state,
  byId(id: string): ProblemType | undefined {
    return state.find((p) => p.id === id);
  },
  /** Vrátí existující typ podle jména (case-insensitive) NEBO vytvoří nový. */
  upsertByName(name: string, description?: string): ProblemType {
    const trimmed = name.trim();
    if (!trimmed) throw new Error("Název typu problému nesmí být prázdný.");
    const existing = state.find((p) => p.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      if (description && existing.description !== description) {
        state = state.map((p) => p.id === existing.id ? { ...p, description, updatedAt: new Date().toISOString() } : p);
        persist();
        return state.find((p) => p.id === existing.id)!;
      }
      return existing;
    }
    const fresh: ProblemType = {
      id: newId(),
      name: trimmed,
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    state = [...state, fresh];
    persist();
    return fresh;
  },
  update(id: string, patch: Partial<Pick<ProblemType, "name" | "description">>) {
    state = state.map((p) => p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p);
    persist();
  },
  remove(id: string) {
    state = state.filter((p) => p.id !== id);
    persist();
  },
  reset() {
    state = SEED_PROBLEM_TYPES;
    persist();
  },
};

export function useProblemTypes(): ProblemType[] {
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

/** Kolik tras (mimo archiv) používá daný typ problému. */
export function usageCountByRoute(typeId: string, routes: Route[]): number {
  let n = 0;
  for (const r of routes) {
    if (r.archivedAt) continue;
    if (r.problems?.some((p) => p.problemTypeId === typeId)) n++;
  }
  return n;
}
