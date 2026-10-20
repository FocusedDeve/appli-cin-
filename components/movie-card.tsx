import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { tmdbImageUrl, type Movie } from "@/lib/tmdb";

export function MovieCard({
  movie,
  genres,
  large = false,
}: {
  movie: Movie;
  genres: string[];
  large?: boolean;
}) {
  const poster = tmdbImageUrl(movie.poster_path, large ? "w780" : "w500");
  const year = movie.release_date?.slice(0, 4);

  return (
    <Link
      href={`/movie/${movie.id}`}
      className={`group relative block overflow-hidden rounded-2xl bg-gray-900 ring-1 ring-white/5 transition-shadow hover:ring-blue-600/60 ${
        large ? "col-span-2 row-span-2" : ""
      }`}
    >
      <div className={large ? "aspect-[2/3] md:aspect-auto md:h-full" : "aspect-[2/3]"}>
        {poster ? (
          <Image
            src={poster}
            alt={movie.title}
            fill
            sizes={
              large
                ? "(min-width: 768px) 50vw, 100vw"
                : "(min-width: 1024px) 25vw, 50vw"
            }
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-4 text-center text-sm text-gray-500">
            {movie.title}
          </div>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 translate-y-2 border-t border-white/10 bg-white/10 p-4 opacity-0 backdrop-blur-md transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
        <h3 className="font-display line-clamp-2 text-base font-semibold">
          {movie.title}
        </h3>
        <div className="mt-1 flex items-center gap-3 text-sm text-gray-200">
          <span className="flex items-center gap-1">
            <Star className="size-3.5 fill-blue-500 text-blue-500" />
            {movie.vote_average.toFixed(1)}
          </span>
          {year && <span>{year}</span>}
        </div>
        {genres.length > 0 && (
          <p className="mt-1 line-clamp-1 text-xs text-gray-300">
            {genres.join(" · ")}
          </p>
        )}
      </div>
    </Link>
  );
}
