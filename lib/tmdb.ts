import { cacheLife } from "next/cache";
import { providerUrl } from "@/lib/providers";

const LANGUAGE = "fr-FR";

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

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, accept: "application/json" },
  });
  if (!res.ok) {
    throw new TmdbError(res.status, `TMDB ${res.status} ${res.statusText} (${path})`);
  }
  return res.json() as Promise<T>;
}

/** Image TMDB complète. `size` : w185, w342, w500, w780, w1280, original… */
export function tmdbImageUrl(path: string | null, size = "w500"): string | null {
  if (!path) return null;
  return `${process.env.TMDB_IMAGE_BASE_URL}/${size}${path}`;
}

export async function getTrendingMovies(): Promise<Movie[]> {
  "use cache";
  cacheLife("hours");
  const data = await tmdbFetch<Paginated<Movie>>("/trending/movie/day");
  return data.results;
}

/** Table id → nom, pour afficher les genres des listes (qui ne contiennent que des genre_ids). */
export async function getGenreMap(): Promise<Record<number, string>> {
  "use cache";
  cacheLife("days");
  const data = await tmdbFetch<{ genres: Genre[] }>("/genre/movie/list");
  return Object.fromEntries(data.genres.map((g) => [g.id, g.name]));
}

/** Non mis en cache : dépend de la saisie utilisateur (le debounce est côté client). */
export async function searchMovies(query: string): Promise<Movie[]> {
  const q = query.trim();
  if (!q) return [];
  const data = await tmdbFetch<Paginated<Movie>>("/search/movie", {
    query: q,
    include_adult: "false",
  });
  return data.results;
}

/** Détails + casting (credits) en un seul appel. */
export async function getMovieDetails(id: number): Promise<MovieDetails> {
  "use cache";
  cacheLife("hours");
  return tmdbFetch<MovieDetails>(`/movie/${id}`, {
    append_to_response: "credits",
  });
}

/** Vidéos YouTube, en français d'abord puis en anglais si aucune VF n'existe. */
export async function getMovieVideos(id: number, type: MediaType = "movie"): Promise<MovieVideo[]> {
  "use cache";
  cacheLife("hours");
  let { results } = await tmdbFetch<Paginated<MovieVideo>>(`/${type}/${id}/videos`);
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

/**
 * Meilleur résultat TMDB pour une liste de titres candidats (français, original…),
 * ou null. Les fiches quasi vides (aucun vote) sont ignorées : ce sont presque
 * toujours de faux positifs de la recherche par titre.
 */
export async function findMedia(
  type: MediaType,
  titles: string[],
  year?: number,
): Promise<Media | null> {
  const yearParam = type === "movie" ? "primary_release_year" : "first_air_date_year";
  for (const title of titles) {
    const q = title.trim();
    if (!q) continue;
    const params: Record<string, string> = { query: q, include_adult: "false" };
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
export async function getTvDetails(id: number): Promise<SeriesDetails> {
  "use cache";
  cacheLife("hours");
  const raw = await tmdbFetch<TvDetailsRaw>(`/tv/${id}`, { append_to_response: "credits" });
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
