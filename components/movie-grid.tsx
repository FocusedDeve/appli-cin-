import { MovieCard } from "@/components/movie-card";
import type { Movie } from "@/lib/tmdb";

// Une tuile sur 7 occupe 2×2 cases, pour casser la régularité de la grille.
const isLarge = (index: number) => index % 7 === 0;

export function MovieGrid({
  movies,
  genreMap,
}: {
  movies: Movie[];
  genreMap: Record<number, string>;
}) {
  return (
    <section className="px-6 py-12 sm:px-12 lg:px-20">
      <h2 className="font-display mb-6 text-2xl font-bold sm:text-3xl">
        Films tendances
      </h2>
      <div className="grid grid-flow-dense grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {movies.map((movie, i) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            large={isLarge(i)}
            genres={(movie.genre_ids ?? [])
              .map((id) => genreMap[id])
              .filter(Boolean)
              .slice(0, 3)}
          />
        ))}
      </div>
    </section>
  );
}
