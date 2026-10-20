import { NextResponse, type NextRequest } from "next/server";
import { searchMovies, tmdbImageUrl } from "@/lib/tmdb";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2 || q.length > 100) {
    return NextResponse.json({ results: [] });
  }

  try {
    const movies = await searchMovies(q);
    return NextResponse.json({
      results: movies.slice(0, 8).map((m) => ({
        id: m.id,
        title: m.title,
        year: m.release_date?.slice(0, 4) ?? "",
        poster: tmdbImageUrl(m.poster_path, "w92"),
      })),
    });
  } catch (e) {
    console.error("[api/search]", e);
    return NextResponse.json({ error: "Recherche indisponible" }, { status: 502 });
  }
}
