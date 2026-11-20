import { cacheLife } from "next/cache";
import { providerUrl } from "@/lib/providers";

import { DEFAULT_LANG, tmdbLocale, type Lang } from "@/lib/i18n";

/** Langue par défaut des appels TMDB ; chaque appel peut passer `language` pour la remplacer. */
const LANGUAGE = tmdbLocale(DEFAULT_LANG);

export type Movie = {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count?: number;
  genre_ids?: number[];
};

export type Genre = { id: number; name: string };

export type CastMember = {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
};

export type MovieDetails = Omit<Movie, "genre_ids"> & {
  tagline: string;
  runtime: number | null;
  genres: Genre[];
  credits: { cast: CastMember[] };
};

export type MovieVideo = {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
};

type Paginated<T> = { results: T[] };

export class TmdbError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function tmdbFetch<T>(
  path: string,
  params: Record<string, string> = {},
): Promise<T> {
  const baseUrl = process.env.TMDB_BASE_URL;
  const token = process.env.TMDB_ACCESS_TOKEN;
  if (!baseUrl || !token) {
    throw new Error("TMDB_BASE_URL / TMDB_ACCESS_TOKEN manquants dans .env.local");
  }

  const url = new URL(`${baseUrl}${path}`);
  url.searchParams.set("language", LANGUAGE);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  // Un TMDB lent ne doit pas bloquer indéfiniment, mais une première connexion peut être longue :
  // délai généreux, et une seconde tentative sur les erreurs réseau (timeout, connexion coupée).
  let res: Response | undefined;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, accept: "application/json" },
        signal: AbortSignal.timeout(20_000),
      });
      break;
    } catch (e) {
      if (attempt === 2) throw new TmdbError(504, `TMDB injoignable (${path}) : ${(e as Error).name}`);
    }
  }
  if (!res || !res.ok) {
    throw new TmdbError(res?.status ?? 504, `TMDB ${res?.status} ${res?.statusText} (${path})`);
  }
  return res.json() as Promise<T>;
}

/** Image TMDB complète. `size` : w185, w342, w500, w780, w1280, original… */
export function tmdbImageUrl(path: string | null, size = "w500"): string | null {
  if (!path) return null;
  return `${process.env.TMDB_IMAGE_BASE_URL}/${size}${path}`;
}

/** Film ou série trouvé par la recherche rapide (Ctrl K). */
export type SearchHit = { id: number; type: MediaType; title: string; year: string; poster_path: string | null };

type MultiResult = Partial<Omit<Movie, "title">> & {
  id: number;
  media_type: string;
  title?: string;
  name?: string;
  first_air_date?: string;
};

/** Non mis en cache : dépend de la saisie utilisateur (le debounce est côté client). Films et séries. */
export async function searchMedia(query: string, lang: Lang = DEFAULT_LANG): Promise<SearchHit[]> {
  const q = query.trim();
  if (!q) return [];
  const data = await tmdbFetch<Paginated<MultiResult>>("/search/multi", {
    query: q,
    include_adult: "false",
    language: tmdbLocale(lang),
  });
  return data.results
    .filter((r) => r.media_type === "movie" || r.media_type === "tv")
    .map((r) => ({
      id: r.id,
      type: r.media_type as MediaType,
      title: r.title ?? r.name ?? "",
      year: (r.release_date ?? r.first_air_date ?? "").slice(0, 4),
      poster_path: r.poster_path ?? null,
    }))
    .filter((r) => r.title);
}

/** Détails + casting (credits) en un seul appel. */
export async function getMovieDetails(id: number, lang: Lang = DEFAULT_LANG): Promise<MovieDetails> {
  "use cache";
  cacheLife("hours");
  return tmdbFetch<MovieDetails>(`/movie/${id}`, {
    append_to_response: "credits",
    language: tmdbLocale(lang),
  });
}

/** Vidéos YouTube, dans la langue demandée d'abord puis en anglais si aucune n'existe. */
export async function getMovieVideos(
  id: number,
  type: MediaType = "movie",
  lang: Lang = DEFAULT_LANG,
): Promise<MovieVideo[]> {
  "use cache";
  cacheLife("hours");
  let { results } = await tmdbFetch<Paginated<MovieVideo>>(`/${type}/${id}/videos`, {
    language: tmdbLocale(lang),
  });
  if (results.length === 0) {
    ({ results } = await tmdbFetch<Paginated<MovieVideo>>(`/${type}/${id}/videos`, {
      language: "en-US",
    }));
  }
  return results.filter((v) => v.site === "YouTube");
}

export type MediaType = "movie" | "tv";

export type WatchProvider = {
  id: number;
  name: string;
  logo: string | null;
  /** Site officiel de la plateforme, si connu. */
  url: string | null;
  /** free : gratuit, ads : gratuit avec publicité, flatrate : abonnement, rent : location, buy : achat. */
  category: "free" | "ads" | "flatrate" | "rent" | "buy";
};

export type WatchProviders = {
  /** Région des offres (ISO 3166-1). */
  region: string;
  /** Page JustWatch du titre pour la région. */
  link: string | null;
  providers: WatchProvider[];
  /** Autres pays où le titre est en streaming, renseignés si aucune offre dans la région. */
  otherRegions: string[];
};

/** Sans offre connue : repli quand TMDB ne répond pas, pour ne pas perdre la recommandation. */
export const noProviders = (region: string): WatchProviders => ({
  region,
  link: null,
  providers: [],
  otherRegions: [],
});

type RawProvider = { provider_id: number; provider_name: string; logo_path: string | null };
type RawRegion = { link?: string } & Partial<
  Record<"free" | "ads" | "flatrate" | "rent" | "buy", RawProvider[]>
>;

const CATEGORIES = ["free", "ads", "flatrate", "rent", "buy"] as const;

/** Plateformes (streaming, location, achat) d'un film ou d'une série pour une région. */
export async function getWatchProviders(
  id: number,
  type: MediaType,
  region: string,
): Promise<WatchProviders> {
  "use cache";
  cacheLife("hours");
  const data = await tmdbFetch<{ results: Record<string, RawRegion> }>(
    `/${type}/${id}/watch/providers`,
  );
  const entry = data.results[region];
  const providers = CATEGORIES.flatMap((category) =>
    (entry?.[category] ?? []).map((p) => ({
      id: p.provider_id,
      name: p.provider_name,
      logo: tmdbImageUrl(p.logo_path, "w92"),
      url: providerUrl(p.provider_id),
      category,
    })),
  );

  // Rien dans la région : on indique les pays où le titre est au moins en streaming.
  const otherRegions =
    providers.length > 0
      ? []
      : Object.entries(data.results)
          .filter(([code, r]) => code !== region && (r.free || r.ads || r.flatrate))
          .map(([code]) => code)
          .slice(0, 8);

  return { region, link: entry?.link ?? null, providers, otherRegions };
}

type TvResult = Omit<Movie, "title" | "release_date"> & { name: string; first_air_date: string };

/** Film ou série, ramené à la forme Movie (title / release_date). */
export type Media = Movie & { type: MediaType };

/** Fiche résumée d'un film ou d'une série à partir de son id (null si TMDB ne la connaît pas). */
export async function getMediaSummary(
  type: MediaType,
  id: number,
  lang: Lang = DEFAULT_LANG,
): Promise<Media | null> {
  "use cache";
  cacheLife("hours");
  try {
    const raw = await tmdbFetch<Movie | TvResult>(`/${type}/${id}`, {
      language: tmdbLocale(lang),
    });
    if ("name" in raw) {
      const { name, first_air_date, ...rest } = raw;
      return { ...rest, title: name, release_date: first_air_date, type };
    }
    return { ...raw, type };
  } catch (e) {
    if (e instanceof TmdbError && e.status === 404) return null;
    throw e;
  }
}

/**
 * Meilleur résultat TMDB pour une liste de titres candidats (français, original…),
 * ou null. Les fiches quasi vides (aucun vote) sont ignorées : ce sont presque
 * toujours de faux positifs de la recherche par titre.
 */
export async function findMedia(
  type: MediaType,
  titles: string[],
  year?: number,
  lang: Lang = DEFAULT_LANG,
): Promise<Media | null> {
  const yearParam = type === "movie" ? "primary_release_year" : "first_air_date_year";
  for (const title of titles) {
    const q = title.trim();
    if (!q) continue;
    const params: Record<string, string> = { query: q, include_adult: "false", language: tmdbLocale(lang) };
    // L'année donnée par le LLM peut être décalée d'un an : on retente sans filtre.
    for (const withYear of year ? [true, false] : [false]) {
      if (withYear) params[yearParam] = String(year);
      else delete params[yearParam];
      const { results } = await tmdbFetch<Paginated<Movie | TvResult>>(`/search/${type}`, params);
      const hit = results.find((m) => (m.vote_count ?? 0) >= 10);
      if (!hit) continue;
      if ("name" in hit) {
        const { name, first_air_date, ...rest } = hit;
        return { ...rest, title: name, release_date: first_air_date, type };
      }
      return { ...hit, type };
    }
  }
  return null;
}

type TvDetailsRaw = Omit<MovieDetails, "title" | "release_date" | "runtime"> & {
  name: string;
  first_air_date: string;
  episode_run_time: number[];
  number_of_seasons: number;
  number_of_episodes: number;
};

export type SeriesDetails = MovieDetails & { seasons: number; episodes: number };

/** Détails d'une série, ramenés à la forme MovieDetails (title / release_date / runtime). */
export async function getTvDetails(id: number, lang: Lang = DEFAULT_LANG): Promise<SeriesDetails> {
  "use cache";
  cacheLife("hours");
  const raw = await tmdbFetch<TvDetailsRaw>(`/tv/${id}`, {
    append_to_response: "credits",
    language: tmdbLocale(lang),
  });
  const { name, first_air_date, episode_run_time, number_of_seasons, number_of_episodes, ...rest } = raw;
  return {
    ...rest,
    title: name,
    release_date: first_air_date,
    runtime: episode_run_time?.[0] ?? null,
    seasons: number_of_seasons,
    episodes: number_of_episodes,
  };
}
