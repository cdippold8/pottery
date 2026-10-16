"use client";

import { createContext, useCallback, useContext, useSyncExternalStore } from "react";

const STORAGE_KEY = "pottery-request-cart";

// localStorage's own "storage" event only fires in OTHER tabs, not the one
// that made the change -- this set covers same-tab subscribers (the
// provider itself) so every reader updates together regardless of which
// tab/component triggered the write.
const listeners = new Set<() => void>();

function parseIds(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

// useSyncExternalStore requires getSnapshot to return a referentially
// stable value when the underlying data hasn't changed, or it re-renders
// forever -- cache the last parsed array against the raw string that
// produced it.
let cachedRaw: string | null | undefined;
let cachedIds: string[] = [];

function getSnapshot(): string[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedIds = parseIds(raw);
  }
  return cachedIds;
}

// Matches the server's "no cart" render, so hydration never has to
// reconcile a mismatch against client-only storage.
function getServerSnapshot(): string[] {
  return [];
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function writeIds(next: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private browsing / storage disabled -- the cart just won't persist
    // across reloads, which is a reasonable degradation.
  }
  cachedRaw = undefined; // force the next getSnapshot() to re-read/re-parse
  listeners.forEach((callback) => callback());
}

type CartContextValue = {
  ids: string[];
  has: (id: string) => boolean;
  add: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export default function CartProvider({ children }: { children: React.ReactNode }) {
  const ids = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const add = useCallback((id: string) => {
    const current = getSnapshot();
    if (current.includes(id)) return;
    writeIds([...current, id]);
  }, []);

  const remove = useCallback((id: string) => {
    writeIds(getSnapshot().filter((x) => x !== id));
  }, []);

  const clear = useCallback(() => writeIds([]), []);

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  return <CartContext.Provider value={{ ids, has, add, remove, clear }}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
