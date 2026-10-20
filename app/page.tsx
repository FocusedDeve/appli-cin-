import { Hero } from "@/components/hero";
import { getTrendingMovies } from "@/lib/tmdb";

export default async function Home() {
  const trending = await getTrendingMovies();
  const featured = trending.find((m) => m.backdrop_path) ?? trending[0];

  return <main className="flex-1">{featured && <Hero movie={featured} />}</main>;
}
