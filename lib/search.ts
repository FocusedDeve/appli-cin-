import type { MediaType } from "@/lib/tmdb";

/** Demande de recommandations : une envie (solo) ou deux envies à concilier (à deux). */
export type SearchRequest =
  | { mode: "solo"; prompt: string }
  | { mode: "duo"; first: string; second: string };

export const MODIFIERS = [
  { id: "darker", label: "Plus sombre", hint: "Ton plus noir, plus intense, plus dérangeant que la demande de base." },
  {
    id: "hidden-gem",
    label: "Pépite cachée",
    hint:
      "Évite les blockbusters et les classiques ultra-connus (par exemple Inception, Interstellar, Parasite) : " +
      "privilégie des œuvres moins grand public mais très bien notées.",
  },
  {
    id: "short",
    label: "Plus court (< 1h40)",
    hint: "Uniquement des films de moins de 1h40 (100 minutes), ou des séries aux épisodes courts.",
  },
  { id: "recent", label: "Plus récent (2020+)", hint: "Uniquement des œuvres sorties en 2020 ou après." },
] as const;

export type ModifierId = (typeof MODIFIERS)[number]["id"];

export function isModifier(value: unknown): value is ModifierId {
  return MODIFIERS.some((m) => m.id === value);
}

/** Œuvre à ne pas reproposer (déjà vue ou déjà affichée). */
export type ExcludedItem = { id: number; type: MediaType; title: string };

export const MAX_SEEN_IN_PROMPT = 50;
export const MAX_SELECTION_ITEMS = 15;

export type MediaRef = { id: number; type: MediaType };

/** Lit `movie:550,tv:1399` : ignore les entrées invalides et les doublons. */
export function parseItems(raw: string | string[] | undefined): MediaRef[] {
  const text = Array.isArray(raw) ? raw[0] : raw;
  if (!text) return [];
  const seen = new Set<string>();
  const refs: MediaRef[] = [];
  for (const part of text.split(",")) {
    const match = /^(movie|tv):(\d{1,9})$/.exec(part.trim());
    if (!match || seen.has(part.trim())) continue;
    seen.add(part.trim());
    refs.push({ type: match[1] as MediaType, id: Number(match[2]) });
    if (refs.length >= MAX_SELECTION_ITEMS) break;
  }
  return refs;
}
