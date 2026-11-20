"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { ExcludedItem, SearchRequest } from "@/lib/search";
import { MAX_SEEN_IN_PROMPT } from "@/lib/search";
import type { MediaType } from "@/lib/tmdb";

/*
 * Persistance locale (aucun compte, aucune base). useSyncExternalStore renvoie une liste vide
 * au rendu serveur et à l'hydratation, puis les vraies données : pas de mismatch d'hydratation.
 * Les composants restent synchronisés entre eux (événement interne) et entre onglets (« storage »).
 */

const EVENT = "cinehub:storage";
const EMPTY: never[] = [];
const cache = new Map<string, { raw: string | null; value: unknown[] }>();

function readList<T>(key: string): T[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    // stockage indisponible (navigation privée, etc.)
  }
  const cached = cache.get(key);
  if (cached && cached.raw === raw) return cached.value as T[];
  let value: unknown[] = EMPTY;
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) value = parsed;
    } catch {
      // données corrompues : on repart d'une liste vide
    }
  }
  cache.set(key, { raw, value });
  return value as T[];
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

function useStoredList<T>(key: string, max: number) {
  const items = useSyncExternalStore(
    subscribe,
    () => readList<T>(key),
    () => EMPTY as T[],
  );
  const update = useCallback(
    (change: (current: T[]) => T[]) => {
      const next = change(readList<T>(key)).slice(0, max);
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // quota dépassé ou stockage bloqué : la liste reste inchangée
      }
      window.dispatchEvent(new Event(EVENT));
    },
    [key, max],
  );
  return [items, update] as const;
}

/* ---------- Watchlist « À voir plus tard » ---------- */

export type WatchlistItem = {
  id: number;
  type: MediaType;
  title: string;
  year: string;
  rating: number;
  poster: string | null;
};

export function useWatchlist() {
  const [items, update] = useStoredList<WatchlistItem>("cinehub_watchlist", 100);
  const has = useCallback(
    (type: MediaType, id: number) => items.some((i) => i.type === type && i.id === id),
    [items],
  );
  const toggle = useCallback(
    (item: WatchlistItem) =>
      update((list) =>
        list.some((i) => i.type === item.type && i.id === item.id)
          ? list.filter((i) => !(i.type === item.type && i.id === item.id))
          : [item, ...list],
      ),
    [update],
  );
  const remove = useCallback(
    (type: MediaType, id: number) => update((list) => list.filter((i) => !(i.type === type && i.id === id))),
    [update],
  );
  return { items, has, toggle, remove };
}

/* ---------- Œuvres « déjà vues » ---------- */

export function useSeenItems() {
  const [items, update] = useStoredList<ExcludedItem>("cinehub_seen_items", 300);
  const add = useCallback(
    (item: ExcludedItem) =>
      update((list) => [item, ...list.filter((i) => !(i.type === item.type && i.id === item.id))]),
    [update],
  );
  // Seules les plus récentes sont transmises à Gemini, pour ne pas alourdir le prompt.
  const recent = items.slice(0, MAX_SEEN_IN_PROMPT);
  return { items, recent, add };
}

/* ---------- Historique des ambiances ---------- */

export type HistoryEntry = { request: SearchRequest; at: number };

const sameRequest = (a: SearchRequest, b: SearchRequest) =>
  a.mode === "solo" && b.mode === "solo"
    ? a.prompt === b.prompt
    : a.mode === "duo" && b.mode === "duo" && a.first === b.first && a.second === b.second;

export function useHistory() {
  const [entries, update] = useStoredList<HistoryEntry>("cinehub_history", 5);
  const add = useCallback(
    (request: SearchRequest) =>
      update((list) => {
        // Pas de doublon consécutif : on rafraîchit simplement l'horodatage.
        const rest = list[0] && sameRequest(list[0].request, request) ? list.slice(1) : list;
        return [{ request, at: Date.now() }, ...rest];
      }),
    [update],
  );
  const clear = useCallback(() => update(() => []), [update]);
  return { entries, add, clear };
}
