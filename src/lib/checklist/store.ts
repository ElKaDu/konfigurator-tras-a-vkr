import { useEffect, useState } from "react";
import type { ChecklistItem, ChecklistItemTemplate, ChecklistVkr, Kontakt } from "./types";
import { CHECKLIST_ITEMS, CHECKLIST_ITEM_TEMPLATES, CHECKLIST_KONTAKTY, CHECKLIST_VKRS } from "./seed";

type Listener = () => void;

function makeStore<T extends { id: string }>(seed: readonly T[], storageKey: string) {
  function loadInitial(): T[] {
    if (typeof window === "undefined") return [...seed];
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return [...seed];
      const parsed = JSON.parse(raw) as T[];
      return Array.isArray(parsed) ? parsed : [...seed];
    } catch {
      return [...seed];
    }
  }

  let state: T[] = [...seed];
  let hydrated = false;
  const listeners = new Set<Listener>();

  function ensureHydrated() {
    if (hydrated || typeof window === "undefined") return;
    state = loadInitial();
    hydrated = true;
  }

  function persist() {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(storageKey, JSON.stringify(state));
      } catch {
        /* ignore quota */
      }
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
// Templates — read-only v tomto prototypu
// ---------------------------------------------------------------------------

export function useChecklistItemTemplates(): ChecklistItemTemplate[] {
  return CHECKLIST_ITEM_TEMPLATES;
}

export function templateById(id: string): ChecklistItemTemplate | undefined {
  return CHECKLIST_ITEM_TEMPLATES.find((t) => t.id === id);
}

// ---------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------

const _items = makeStore<ChecklistItem>(CHECKLIST_ITEMS, "checklist_items_v1");

export function useChecklistItems(): ChecklistItem[] {
  return _items.useItems();
}

export const checklistItemsStore = {
  all: (): ChecklistItem[] => _items.getState(),
  byId: (id: string): ChecklistItem | undefined => _items.getState().find((i) => i.id === id),
  update(id: string, patch: Partial<ChecklistItem>): void {
    const cur = _items.getState();
    _items.setState(cur.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  },
  reset(): void {
    _items.setState([..._items.seed]);
  },
};

// ---------------------------------------------------------------------------
// Kontakty
// ---------------------------------------------------------------------------

const _kontakty = makeStore<Kontakt>(CHECKLIST_KONTAKTY, "checklist_kontakty_v1");

export function useKontakty(): Kontakt[] {
  return _kontakty.useItems();
}

export const kontaktyStore = {
  all: (): Kontakt[] => _kontakty.getState(),
  byId: (id: string): Kontakt | undefined => _kontakty.getState().find((k) => k.id === id),
  create(kontakt: Kontakt): void {
    _kontakty.setState([..._kontakty.getState(), kontakt]);
  },
  update(id: string, patch: Partial<Kontakt>): void {
    const cur = _kontakty.getState();
    _kontakty.setState(cur.map((k) => (k.id === id ? { ...k, ...patch } : k)));
  },
  reset(): void {
    _kontakty.setState([..._kontakty.seed]);
  },
};

// ---------------------------------------------------------------------------
// VkŘ vzniklé ze sledování
// ---------------------------------------------------------------------------

const _vkrs = makeStore<ChecklistVkr>(CHECKLIST_VKRS, "checklist_vkrs_v1");

export function useChecklistVkrs(): ChecklistVkr[] {
  return _vkrs.useItems();
}

export const checklistVkrStore = {
  all: (): ChecklistVkr[] => _vkrs.getState(),
  create(vkr: ChecklistVkr): void {
    _vkrs.setState([..._vkrs.getState(), vkr]);
  },
  /** Postupné odbavení — označí VkŘ za vyřešenou. Nemění navázanou ChecklistItem; to dělá volající
   *  (viz VkrCards), protože store nesmí znát detaily druhé domény sám od sebe. */
  resolve(id: string): void {
    const cur = _vkrs.getState();
    _vkrs.setState(cur.map((v) => (v.id === id ? { ...v, resolved: true } : v)));
  },
  reset(): void {
    _vkrs.setState([..._vkrs.seed]);
  },
};

/** Resetuje všechny tři stores na seed stav — použij pro tlačítko "Vrátit prototyp na začátek". */
export function resetChecklistPrototype(): void {
  checklistItemsStore.reset();
  kontaktyStore.reset();
  checklistVkrStore.reset();
}
