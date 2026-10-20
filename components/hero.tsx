import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { FadeIn } from "@/components/fade-in";
import { tmdbImageUrl, type Movie } from "@/lib/tmdb";

export function Hero({ movie }: { movie: Movie }) {
  const backdrop = tmdbImageUrl(movie.backdrop_path, "w1280");
  const year = movie.release_date?.slice(0, 4);

  return (
    <section className="relative h-[85vh] min-h-[480px] w-full overflow-hidden">
      {backdrop && (
        <Image
          src={backdrop}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/50 to-gray-950/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-gray-950/80 via-transparent to-transparent" />

      <div className="relative flex h-full items-end px-6 pb-16 sm:px-12 lg:px-20">
        <FadeIn className="max-w-2xl">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-blue-500">
            Tendance du jour
          </p>
          <h1 className="font-display text-4xl font-bold leading-tight sm:text-6xl">
            {movie.title}
          </h1>
          <div className="mt-4 flex items-center gap-4 text-sm text-gray-300">
            <span className="flex items-center gap-1.5">
              <Star className="size-4 fill-blue-600 text-blue-600" />
              {movie.vote_average.toFixed(1)}
            </span>
            {year && <span>{year}</span>}
          </div>
          {movie.overview && (
            <p className="mt-4 line-clamp-4 text-base leading-relaxed text-gray-300 sm:text-lg">
              {movie.overview}
            </p>
          )}
          <Link
            href={`/movie/${movie.id}`}
            className="mt-6 inline-flex items-center rounded-xl bg-blue-700 px-5 py-3 font-medium transition hover:bg-blue-600"
          >
            Voir la fiche
          </Link>
        </FadeIn>
      </div>
    </section>
  );
}
