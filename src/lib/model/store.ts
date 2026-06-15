import { useEffect, useState } from "react";
import type { CheckpointType, Route, Rule, SampleShipment } from "./types";
import {
  CHECKPOINT_TYPES,
  ROUTES,
  RULES,
  SAMPLE_SHIPMENTS,
} from "./seed";

// ---------------------------------------------------------------------------
// Generic helper — avoids repeating subscribe boilerplate in every store.
// Returns a tuple [getState, setState, useItems] where setState triggers all
// subscribed hooks to re-render.
// ---------------------------------------------------------------------------

type Listener = () => void;

function makeStore<T extends { id: string }>(seed: readonly T[]) {
  let state: T[] = [...seed];
  const listeners = new Set<Listener>();

  function notify() {
    listeners.forEach((l) => l());
  }

  function getState(): T[] {
    return state;
  }

  function setState(next: T[]): void {
    state = next;
    notify();
  }

  function useItems(): T[] {
    const [, force] = useState(0);
    useEffect(() => {
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

const _rules = makeStore<Rule>(RULES);

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
  reset(): void {
    _rules.setState([..._rules.seed]);
  },
};

// ---------------------------------------------------------------------------
// Routes store
// ---------------------------------------------------------------------------

const _routes = makeStore<Route>(ROUTES);

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
  reset(): void {
    _routes.setState([..._routes.seed]);
  },
};

// ---------------------------------------------------------------------------
// CheckpointTypes store
// ---------------------------------------------------------------------------

const _cts = makeStore<CheckpointType>(CHECKPOINT_TYPES);

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
