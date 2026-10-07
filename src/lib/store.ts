"use client";

import { useSyncExternalStore } from "react";
import { summarize, type CartLine } from "@/data/pricing";

// Tiny external stores (cart, orders, drawer). useSyncExternalStore keeps the
// server render on the empty snapshot and swaps in localStorage after hydration.

function createStore<T>(initial: T, key?: string) {
  let state = initial;
  let loaded = !key;
  const listeners = new Set<() => void>();

  const read = () => {
    if (loaded || typeof window === "undefined") return;
    loaded = true;
    try {
      const raw = window.localStorage.getItem(key!);
      if (raw) state = JSON.parse(raw) as T;
    } catch {
      /* private mode or corrupt value: start empty */
    }
  };

  const emit = () => listeners.forEach((l) => l());

  const onStorage = (e: StorageEvent) => {
    if (e.key !== key) return;
    loaded = false;
    state = initial;
    read();
    emit();
  };

  return {
    get() {
      read();
      return state;
    },
    getServer: () => initial,
    set(next: T) {
      read();
      state = next;
      if (key) {
        try {
          window.localStorage.setItem(key, JSON.stringify(state));
        } catch {
          /* storage full or blocked: keep the in-memory state */
        }
      }
      emit();
    },
    subscribe(l: () => void) {
      listeners.add(l);
      if (key && listeners.size === 1) window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(l);
        if (key && listeners.size === 0) window.removeEventListener("storage", onStorage);
      };
    },
  };
}

// ---------------------------------------------------------------------- cart

const EMPTY: CartLine[] = [];
const cartStore = createStore<CartLine[]>(EMPTY, "kdn.cart.v1");

export const cart = {
  add(line: CartLine) {
    const rest = cartStore.get().filter((l) => l.id !== line.id);
    cartStore.set([...rest, line]);
  },
  addMany(lines: CartLine[]) {
    const ids = new Set(lines.map((l) => l.id));
    cartStore.set([...cartStore.get().filter((l) => !ids.has(l.id)), ...lines]);
  },
  remove(id: string) {
    cartStore.set(cartStore.get().filter((l) => l.id !== id));
  },
  clear() {
    cartStore.set(EMPTY);
  },
};

export function useCart() {
  const lines = useSyncExternalStore(cartStore.subscribe, cartStore.get, cartStore.getServer);
  return { lines, summary: summarize(lines), has: (id: string) => lines.some((l) => l.id === id), line: (id: string) => lines.find((l) => l.id === id) };
}

// -------------------------------------------------------------------- orders

export type StoredOrder = { token: string; no: string; at: number; count: number; total: number };

const NO_ORDERS: StoredOrder[] = [];
const orderStore = createStore<StoredOrder[]>(NO_ORDERS, "kdn.orders.v1");

export const orders = {
  add(o: StoredOrder) {
    orderStore.set([o, ...orderStore.get().filter((x) => x.token !== o.token)].slice(0, 20));
  },
};

export function useOrders() {
  return useSyncExternalStore(orderStore.subscribe, orderStore.get, orderStore.getServer);
}

// ------------------------------------------------------------------------ ui

type Ui = { cartOpen: boolean; searchOpen: boolean; toast: { id: number; text: string } | null };
const UI: Ui = { cartOpen: false, searchOpen: false, toast: null };
const uiStore = createStore<Ui>(UI);
let toastId = 0;
let toastTimer: ReturnType<typeof setTimeout> | undefined;

export const ui = {
  openCart: () => uiStore.set({ ...uiStore.get(), cartOpen: true, toast: null }),
  closeCart: () => uiStore.set({ ...uiStore.get(), cartOpen: false }),
  openSearch: () => uiStore.set({ ...uiStore.get(), searchOpen: true, cartOpen: false, toast: null }),
  closeSearch: () => uiStore.set({ ...uiStore.get(), searchOpen: false }),
  toast(text: string) {
    clearTimeout(toastTimer);
    uiStore.set({ ...uiStore.get(), toast: { id: ++toastId, text } });
    toastTimer = setTimeout(() => uiStore.set({ ...uiStore.get(), toast: null }), 2600);
  },
};

export function useUi() {
  return useSyncExternalStore(uiStore.subscribe, uiStore.get, uiStore.getServer);
}

// ----------------------------------------------------------- media queries

function mediaStore(query: string) {
  return {
    subscribe(l: () => void) {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", l);
      return () => mq.removeEventListener("change", l);
    },
    get: () => window.matchMedia(query).matches,
  };
}

const finePointer = mediaStore("(hover: hover) and (pointer: fine)");
const reducedMotion = mediaStore("(prefers-reduced-motion: reduce)");

export const useFinePointer = () => useSyncExternalStore(finePointer.subscribe, finePointer.get, () => false);
export const usePrefersReducedMotion = () => useSyncExternalStore(reducedMotion.subscribe, reducedMotion.get, () => false);

const noop = () => () => {};
/** False during server render and hydration, true afterwards. */
export const useIsClient = () => useSyncExternalStore(noop, () => true, () => false);

// ------------------------------------------------------------------ webgl

let webglSupport: boolean | null = null;

function detectWebGL() {
  if (webglSupport !== null) return webglSupport;
  try {
    const c = document.createElement("canvas");
    webglSupport = !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    webglSupport = false;
  }
  return webglSupport;
}

/** True on the server and until proven otherwise, so the WebGL stage is the default render. */
export const useWebGL = () => useSyncExternalStore(noop, detectWebGL, () => true);

// -------------------------------------------------------------- lite mode

type NetworkInfo = { saveData?: boolean; effectiveType?: string };
let liteMode: boolean | null = null;

function detectLite() {
  if (liteMode !== null) return liteMode;
  const nav = navigator as Navigator & { connection?: NetworkInfo; deviceMemory?: number };
  const net = nav.connection;
  liteMode = Boolean(net?.saveData || /2g|3g/.test(net?.effectiveType ?? "") || (nav.deviceMemory !== undefined && nav.deviceMemory < 4));
  return liteMode;
}

/**
 * True when the visitor asked to save data, is on a slow connection or on a
 * low-memory phone: the WebGL stages then give way to their static versions
 * and three.js is never downloaded. False on the server and during hydration.
 */
export const useLiteMode = () => useSyncExternalStore(noop, detectLite, () => false);
