import { headers } from "next/headers";

/*
 * Garde-fous du quota Gemini : limite par visiteur, détection d'un quota épuisé et petit cache.
 * L'état vit en mémoire de l'instance serveur : suffisant pour freiner les abus et les boucles,
 * mais chaque instance serverless a son propre compteur (une base partagée type Redis serait plus stricte).
 */

const hits = new Map<string, number[]>();

/** Identifiant du visiteur : IP derrière le proxy (Vercel renseigne x-forwarded-for), sinon « local ». */
async function clientKey(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

/** Vrai si le visiteur peut encore appeler `bucket` (fenêtre glissante) ; sinon il est refusé. */
export async function allowRequest(bucket: string, limit: number, windowMs: number): Promise<boolean> {
  const key = `${bucket}:${await clientKey()}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  // Nettoyage opportuniste pour que la table ne grossisse pas indéfiniment.
  if (hits.size > 5000) {
    for (const [k, times] of hits) {
      if (times.every((t) => now - t >= windowMs)) hits.delete(k);
    }
  }
  return true;
}

/** Détecte une erreur de quota ou de surcharge (429 / RESOURCE_EXHAUSTED / 503) dans la chaîne d'erreurs. */
export function isQuotaError(error: unknown): boolean {
  const seen = new Set<unknown>();
  let current: unknown = error;
  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    const e = current as { statusCode?: number; status?: number; message?: string; cause?: unknown; lastError?: unknown };
    if (e.statusCode === 429 || e.status === 429 || e.statusCode === 503) return true;
    if (/quota|resource_exhausted|rate.?limit|overloaded/i.test(e.message ?? "")) return true;
    current = e.lastError ?? e.cause;
  }
  return false;
}

/** Cache mémoire avec durée de vie et taille maximale (les plus anciennes entrées partent d'abord). */
export class TtlCache<V> {
  private store = new Map<string, { value: V; expires: number }>();

  constructor(
    private ttlMs: number,
    private maxEntries: number,
  ) {}

  get(key: string): V | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expires < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: V) {
    this.store.delete(key);
    this.store.set(key, { value, expires: Date.now() + this.ttlMs });
    while (this.store.size > this.maxEntries) {
      const oldest = this.store.keys().next().value;
      if (oldest === undefined) break;
      this.store.delete(oldest);
    }
  }
}
