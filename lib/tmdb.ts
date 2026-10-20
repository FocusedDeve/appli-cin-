import { cacheLife } from "next/cache";

const LANGUAGE = "fr-FR";

export type Movie = {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
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
    throw new Error(`TMDB ${res.status} ${res.statusText} (${path})`);
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
export async function getMovieVideos(id: number): Promise<MovieVideo[]> {
  "use cache";
  cacheLife("hours");
  let { results } = await tmdbFetch<Paginated<MovieVideo>>(`/movie/${id}/videos`);
  if (results.length === 0) {
    ({ results } = await tmdbFetch<Paginated<MovieVideo>>(`/movie/${id}/videos`, {
      language: "en-US",
    }));
  }
  return results.filter((v) => v.site === "YouTube");
}
