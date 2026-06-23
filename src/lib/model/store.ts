import { useEffect, useState } from "react";
import type { CheckpointType, Route, Rule, SampleShipment, Segment } from "./types";
import {
  CHECKPOINT_TYPES,
  ROUTES,
  RULES,
  SAMPLE_SHIPMENTS,
  SEGMENTS,
} from "./seed";

// ---------------------------------------------------------------------------
// Generic helper — avoids repeating subscribe boilerplate in every store.
// Optional `storageKey` enables localStorage persistence so user-entered
// data survives reloads. Bump the version suffix in the key to discard
// stale shapes after a model change.
// ---------------------------------------------------------------------------

type Listener = () => void;

function makeStore<T extends { id: string }>(seed: readonly T[], storageKey?: string) {
  function loadInitial(): T[] {
    if (typeof window === "undefined" || !storageKey) return [...seed];
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return [...seed];
      const parsed = JSON.parse(raw) as T[];
      if (!Array.isArray(parsed)) return [...seed];
      return parsed;
    } catch {
      return [...seed];
    }
  }

  let state: T[] = [...seed];
  let hydrated = false;
  const listeners = new Set<Listener>();

  function ensureHydrated() {
    if (hydrated || typeof window === "undefined" || !storageKey) return;
    state = loadInitial();
    hydrated = true;
  }

  function persist() {
    if (typeof window !== "undefined" && storageKey) {
      try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch { /* ignore quota */ }
    }
  }

  function notify() {
    listeners.forEach((l) => l());
  }

  function getState(): T[] {
    ensureHydrated();
    return state;
  }

  function setState(next: T[]): void {
    state = next;
    persist();
    notify();
  }

  function useItems(): T[] {
    const [, force] = useState(0);
    useEffect(() => {
      ensureHydrated();
      force((n) => n + 1);
      const l = () => force((n) => n + 1);
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    }, []);
    return state;
  }

  return { getState, setState, useItems, seed };
}

// ---------------------------------------------------------------------------
// Rules store
// ---------------------------------------------------------------------------

const _rules = makeStore<Rule>(RULES, "model_rules_v1");

export function useRules(): Rule[] {
  return _rules.useItems();
}

export const rulesStore = {
  all: (): Rule[] => _rules.getState(),
  byId: (id: string): Rule | undefined =>
    _rules.getState().find((r) => r.id === id),
  upsert(rule: Rule): void {
    const cur = _rules.getState();
    const idx = cur.findIndex((r) => r.id === rule.id);
    _rules.setState(
      idx >= 0 ? cur.map((r) => (r.id === rule.id ? rule : r)) : [...cur, rule]
    );
  },
  remove(id: string): void {
    _rules.setState(_rules.getState().filter((r) => r.id !== id));
  },
  reset(): void {
    _rules.setState([..._rules.seed]);
  },
  replaceAll(next: Rule[]): void {
    _rules.setState(next);
  },
};

// ---------------------------------------------------------------------------
// Routes store
// ---------------------------------------------------------------------------

const _routes = makeStore<Route>(ROUTES, "model_routes_v1");

export function useRoutes(): Route[] {
  return _routes.useItems();
}

export const routesStore = {
  all: (): Route[] => _routes.getState(),
  byId: (id: string): Route | undefined =>
    _routes.getState().find((r) => r.id === id),
  upsert(route: Route): void {
    const cur = _routes.getState();
    const idx = cur.findIndex((r) => r.id === route.id);
    _routes.setState(
      idx >= 0
        ? cur.map((r) => (r.id === route.id ? route : r))
        : [...cur, route]
    );
  },
  remove(id: string): void {
    _routes.setState(_routes.getState().filter((r) => r.id !== id));
  },
  reset(): void {
    _routes.setState([..._routes.seed]);
  },
  replaceAll(next: Route[]): void {
    _routes.setState(next);
  },
};

// ---------------------------------------------------------------------------
// CheckpointTypes store
// ---------------------------------------------------------------------------

const _cts = makeStore<CheckpointType>(CHECKPOINT_TYPES, "model_checkpoint_types_v1");

export function useCheckpointTypes(): CheckpointType[] {
  return _cts.useItems();
}

export const checkpointTypesStore = {
  all: (): CheckpointType[] => _cts.getState(),
  byId: (id: string): CheckpointType | undefined =>
    _cts.getState().find((ct) => ct.id === id),
  upsert(ct: CheckpointType): void {
    const cur = _cts.getState();
    const idx = cur.findIndex((c) => c.id === ct.id);
    _cts.setState(
      idx >= 0 ? cur.map((c) => (c.id === ct.id ? ct : c)) : [...cur, ct]
    );
  },
  remove(id: string): void {
    _cts.setState(_cts.getState().filter((ct) => ct.id !== id));
  },
  replaceAll(next: CheckpointType[]): void {
    _cts.setState(next);
  },
};

// ---------------------------------------------------------------------------
// SampleShipments store (read-only per spec — no upsert/reset)
// ---------------------------------------------------------------------------

const _ships = makeStore<SampleShipment>(SAMPLE_SHIPMENTS);

export function useSampleShipments(): SampleShipment[] {
  return _ships.useItems();
}

export const sampleShipmentsStore = {
  all: (): SampleShipment[] => _ships.getState(),
  byId: (id: string): SampleShipment | undefined =>
    _ships.getState().find((s) => s.id === id),
};

// ---------------------------------------------------------------------------
// Segments store
// ---------------------------------------------------------------------------

const _segments = makeStore<Segment>(SEGMENTS, "model_segments_v1");

export function useSegments(): Segment[] {
  return _segments.useItems();
}

export const segmentsStore = {
  all: (): Segment[] => _segments.getState(),
  byId: (id: string): Segment | undefined =>
    _segments.getState().find((s) => s.id === id),
  upsert(seg: Segment): void {
    const cur = _segments.getState();
    const idx = cur.findIndex((s) => s.id === seg.id);
    _segments.setState(idx >= 0 ? cur.map((s) => (s.id === seg.id ? seg : s)) : [...cur, seg]);
  },
  remove(id: string): void {
    _segments.setState(_segments.getState().filter((s) => s.id !== id));
  },
  reset(): void {
    _segments.setState([..._segments.seed]);
  },
  replaceAll(next: Segment[]): void {
    _segments.setState(next);
  },
};

// ---------------------------------------------------------------------------
// Usage helpers
// ---------------------------------------------------------------------------

export function isSegmentUsed(segId: string): { used: boolean; count: number } {
  const count = _routes.getState().filter((r) => r.segmentIds.includes(segId)).length;
  return { used: count > 0, count };
}

export function isCheckpointTypeUsed(ctId: string): { used: boolean; count: number } {
  const count = _segments.getState().filter((s) =>
    s.checkpoints.some((cp) => cp.checkpointTypeId === ctId)
  ).length;
  return { used: count > 0, count };
}
