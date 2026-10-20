import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Star } from "lucide-react";
import { FadeIn } from "@/components/fade-in";
import { TrailerButton } from "@/components/trailer-button";
import { getRegion } from "@/lib/region";
import { WhereToWatch } from "@/components/where-to-watch";
import {
  getMovieDetails,
  getMovieVideos,
  getTvDetails,
  getWatchProviders,
  tmdbImageUrl,
  TmdbError,
  type MediaType,
  type MovieDetails,
  type MovieVideo,
  type SeriesDetails,
  type WatchProviders,
} from "@/lib/tmdb";

function pickTrailer(videos: MovieVideo[]) {
  const trailers = videos.filter((v) => v.type === "Trailer");
  return trailers.find((v) => v.official) ?? trailers[0] ?? videos[0];
}

export async function MediaContent({
  type,
  params,
}: {
  type: MediaType;
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  let movie: MovieDetails | SeriesDetails;
  let videos: MovieVideo[];
  let watch: WatchProviders;
  try {
    [movie, videos, watch] = await Promise.all([
      type === "tv" ? getTvDetails(id) : getMovieDetails(id),
      getMovieVideos(id, type),
      getWatchProviders(id, type, await getRegion()),
    ]);
  } catch (e) {
    if (e instanceof TmdbError && e.status === 404) notFound();
    throw e;
  }

  const series = type === "tv" ? (movie as SeriesDetails) : null;
  const backdrop = tmdbImageUrl(movie.backdrop_path, "w1280");
  const poster = tmdbImageUrl(movie.poster_path, "w500");
  const trailer = pickTrailer(videos);
  const year = movie.release_date?.slice(0, 4);
  const cast = movie.credits.cast.slice(0, 12);

  return (
    <>
      <div className="absolute inset-x-0 top-0 -z-10 h-[70vh] overflow-hidden">
        {backdrop && (
          <Image src={backdrop} alt="" fill priority sizes="100vw" className="object-cover opacity-40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/70 to-gray-950/30" />
      </div>

      <div className="px-6 pb-16 pt-28 sm:px-12 lg:px-20">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-gray-300 transition hover:text-white"
        >
          <ArrowLeft className="size-4" />
          Retour
        </Link>

        <FadeIn className="flex flex-col gap-8 md:flex-row">
          <div className="relative aspect-[2/3] w-56 shrink-0 self-center overflow-hidden rounded-2xl bg-gray-900 ring-1 ring-white/10 md:w-72 md:self-start">
            {poster && (
              <Image src={poster} alt={movie.title} fill priority sizes="288px" className="object-cover" />
            )}
          </div>

          <div className="max-w-3xl">
            <h1 className="font-display text-4xl font-bold sm:text-5xl">{movie.title}</h1>
            {movie.tagline && <p className="mt-2 italic text-gray-400">{movie.tagline}</p>}

            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-300">
              <span className="flex items-center gap-1.5">
                <Star className="size-4 fill-blue-600 text-blue-600" />
                {movie.vote_average.toFixed(1)}
              </span>
              {year && <span>{year}</span>}
              {movie.runtime ? (
                <span className="flex items-center gap-1.5">
                  <Clock className="size-4" />
                  {Math.floor(movie.runtime / 60)} h {String(movie.runtime % 60).padStart(2, "0")}
                </span>
              ) : null}
              {series && (
                <span>
                  {series.seasons} saison{series.seasons > 1 ? "s" : ""} · {series.episodes} épisodes
                </span>
              )}
            </div>

            <ul className="mt-4 flex flex-wrap gap-2">
              {movie.genres.map((g) => (
                <li
                  key={g.id}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs backdrop-blur-md"
                >
                  {g.name}
                </li>
              ))}
            </ul>

            <h2 className="font-display mt-8 text-xl font-semibold">Synopsis</h2>
            <p className="mt-2 leading-relaxed text-gray-300">
              {movie.overview || "Synopsis indisponible en français."}
            </p>

            <h2 className="font-display mt-8 text-xl font-semibold">Où regarder</h2>
            <div className="mt-3">
              <WhereToWatch data={watch} />
            </div>

            {trailer && (
              <div className="mt-8">
                <TrailerButton videoKey={trailer.key} title={movie.title} />
              </div>
            )}
          </div>
        </FadeIn>

        {cast.length > 0 && (
          <section className="mt-14">
            <h2 className="font-display mb-4 text-2xl font-semibold">Casting</h2>
            <ul className="flex gap-4 overflow-x-auto pb-2">
              {cast.map((c) => {
                const photo = tmdbImageUrl(c.profile_path, "w185");
                return (
                  <li key={c.id} className="w-28 shrink-0">
                    <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-gray-900 ring-1 ring-white/5">
                      {photo && (
                        <Image src={photo} alt={c.name} fill sizes="112px" className="object-cover" />
                      )}
                    </div>
                    <p className="mt-2 text-sm font-medium leading-tight">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.character}</p>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
