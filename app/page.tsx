import { Hero } from "@/components/hero";
import { MovieGrid } from "@/components/movie-grid";
import { getGenreMap, getTrendingMovies } from "@/lib/tmdb";

export default async function Home() {
  const [trending, genreMap] = await Promise.all([
    getTrendingMovies(),
    getGenreMap(),
  ]);
  const featured = trending.find((m) => m.backdrop_path) ?? trending[0];
  // Le film du Hero n'est pas répété dans la grille.
  const rest = trending.filter((m) => m.id !== featured?.id);

  return (
    <main className="flex-1">
      {featured && <Hero movie={featured} />}
      <MovieGrid movies={rest} genreMap={genreMap} />
    </main>
  );
}
