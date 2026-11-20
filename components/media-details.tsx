import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Star } from "lucide-react";
import { FadeIn } from "@/components/fade-in";
import { TrailerButton } from "@/components/trailer-button";
import { DICTS } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
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
  const lang = await getLang();
  const t = DICTS[lang];
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  let movie: MovieDetails | SeriesDetails;
  let videos: MovieVideo[];
  let watch: WatchProviders;
  try {
    [movie, videos, watch] = await Promise.all([
      type === "tv" ? getTvDetails(id, lang) : getMovieDetails(id, lang),
      getMovieVideos(id, type, lang),
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
          <Image src={backdrop} alt="" fill priority sizes="100vw" className="object-cover opacity-25" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/80 to-canvas/40" />
      </div>

      <div className="px-6 pb-16 pt-28 sm:px-8 lg:px-20">
        <Link
          href="/"
          className="mb-8 inline-flex min-h-11 items-center gap-2 text-sm text-ink-2 transition-colors duration-150 hover:text-ink"
        >
          <ArrowLeft className="size-4" />
          {t.back}
        </Link>

        <FadeIn className="flex flex-col gap-8 md:flex-row">
          <div className="relative aspect-[2/3] w-56 shrink-0 self-center overflow-hidden rounded-xl border border-line bg-surface md:w-72 md:self-start">
            {poster && (
              <Image src={poster} alt={movie.title} fill priority sizes="288px" className="object-cover" />
            )}
          </div>

          <div className="max-w-3xl">
            <h1 className="font-display text-balance text-5xl leading-[1.05] sm:text-6xl">{movie.title}</h1>
            {movie.tagline && <p className="mt-3 italic text-ink-2">{movie.tagline}</p>}

            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-2">
              <span className="flex items-center gap-1.5">
                <Star className="size-4 fill-current" />
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
                  {t.seasons(series.seasons)} · {t.episodes(series.episodes)}
                </span>
              )}
            </div>

            <ul className="mt-4 flex flex-wrap gap-2">
              {movie.genres.map((g) => (
                <li
                  key={g.id}
                  className="rounded-md border border-line px-2.5 py-1 text-xs text-ink-2"
                >
                  {g.name}
                </li>
              ))}
            </ul>

            <h2 className="font-display mt-10 text-2xl">{t.synopsis}</h2>
            <p className="mt-2 max-w-prose leading-relaxed text-ink-2">
              {movie.overview || t.synopsisMissing}
            </p>

            <h2 className="font-display mt-10 text-2xl">{t.whereToWatch}</h2>
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
            <h2 className="font-display mb-4 text-3xl">{t.cast}</h2>
            <ul className="flex gap-4 overflow-x-auto pb-2">
              {cast.map((c) => {
                const photo = tmdbImageUrl(c.profile_path, "w185");
                return (
                  <li key={c.id} className="w-28 shrink-0">
                    <div className="relative aspect-[2/3] overflow-hidden rounded-lg border border-line bg-surface">
                      {photo && (
                        <Image src={photo} alt={c.name} fill sizes="112px" className="object-cover" />
                      )}
                    </div>
                    <p className="mt-2 text-sm font-medium leading-tight">{c.name}</p>
                    <p className="text-xs text-ink-2">{c.character}</p>
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
