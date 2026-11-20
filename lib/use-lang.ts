"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_LANG, DICTS, LANG_COOKIE, isLang, type Dict, type Lang } from "@/lib/i18n";

const listeners = new Set<() => void>();

function readCookie(): Lang | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${LANG_COOKIE}=([a-z]{2})`));
  return match && isLang(match[1]) ? match[1] : null;
}

/** Cookie choisi, sinon anglais. */
function getSnapshot(): Lang {
  return readCookie() ?? DEFAULT_LANG;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Langue de l'interface. Anglais par défaut, puis le choix de l'utilisateur (cookie) à l'hydratation. */
export function useLang(): Lang {
  return useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_LANG);
}

export function useT(): Dict {
  return DICTS[useLang()];
}

/** Change la langue : cookie (lu côté serveur) puis notification des composants. */
export function setLang(lang: Lang) {
  document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
  listeners.forEach((l) => l());
}
