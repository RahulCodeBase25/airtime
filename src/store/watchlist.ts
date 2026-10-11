"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type SavedShow = { id: number; name: string; image: string | null; channel: string; addedAt: number };

type WatchlistState = {
  shows: SavedShow[];
  has: (id: number) => boolean;
  toggle: (show: Omit<SavedShow, "addedAt">) => boolean;
  remove: (id: number) => void;
};

// Saved in the browser (localStorage). Private mode or blocked storage just
// means the list lasts for this visit only.
const safeStorage = createJSONStorage(() => {
  try {
    const k = "__airtime_test";
    localStorage.setItem(k, "1");
    localStorage.removeItem(k);
    return localStorage;
  } catch {
    const mem = new Map<string, string>();
    return { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => void mem.set(k, v), removeItem: (k) => void mem.delete(k) };
  }
});

export const useWatchlist = create<WatchlistState>()(
  persist(
    (set, get) => ({
      shows: [],
      has: (id) => get().shows.some((s) => s.id === id),
      toggle: (show) => {
        const exists = get().has(show.id);
        set({ shows: exists ? get().shows.filter((s) => s.id !== show.id) : [{ ...show, addedAt: Date.now() }, ...get().shows] });
        return !exists;
      },
      remove: (id) => set({ shows: get().shows.filter((s) => s.id !== id) }),
    }),
    { name: "airtime-watchlist", storage: safeStorage, partialize: (s) => ({ shows: s.shows }) }
  )
);
