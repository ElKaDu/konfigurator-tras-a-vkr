import { useEffect, useState } from "react";
import type { Route } from "./types";
import { SEED_ROUTES } from "./mockData";

const KEY = "routes_v13";
const LEGACY_KEYS: string[] = ["routes_v10", "routes_v11", "routes_v12"];

type LegacyCheckpoint = Record<string, unknown> & { required?: boolean };

function migrateRoute(r: Record<string, unknown>): Route {
  const cps = ((r.checkpoints as LegacyCheckpoint[] | undefined) ?? []).map((cp) => {
    const { required: _omit, ...rest } = cp;
    return rest as unknown;
  });
  return { ...(r as unknown as Route), checkpoints: cps as Route["checkpoints"] };
}

function load(): Route[] {
  if (typeof window === "undefined") return SEED_ROUTES;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Route[];
    for (const k of LEGACY_KEYS) {
      const legacy = localStorage.getItem(k);
      if (legacy) {
        const parsed = JSON.parse(legacy) as Array<Record<string, unknown>>;
        return parsed.map(migrateRoute);
      }
    }
    return SEED_ROUTES;
  } catch {
    return SEED_ROUTES;
  }
}

let state: Route[] = SEED_ROUTES;
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

export function useRoutes() {
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

export const routesStore = {
  all: () => state,
  upsert(route: Route) {
    const idx = state.findIndex((r) => r.id === route.id);
    if (idx >= 0) state = state.map((r) => (r.id === route.id ? { ...route, updatedAt: new Date().toISOString() } : r));
    else state = [...state, { ...route, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }];
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
      return rest as Route;
    });
    persist();
  },
  duplicate(id: string) {
    const src = state.find((r) => r.id === id);
    if (!src) return;
    const copy: Route = {
      ...src,
      id: `rid_${Math.random().toString(36).slice(2, 10)}`,
      name: `${src.name} (kopie)`,
      code: `${src.code}'`,
      active: false,
      archivedAt: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    state = [...state, copy];
    persist();
  },
  remove(id: string) {
    state = state.filter((r) => r.id !== id);
    persist();
  },
  reset() {
    state = SEED_ROUTES;
    persist();
  },
  replaceAll(routes: Route[]) {
    state = routes;
    persist();
  },
};
