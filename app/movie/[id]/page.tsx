import { Suspense } from "react";
import { MediaContent } from "@/components/media-details";

export default function MoviePage({ params }: PageProps<"/movie/[id]">) {
  return (
    <main className="relative flex-1">
      <Suspense fallback={<div className="pt-32 text-center text-gray-500">Chargement…</div>}>
        <MediaContent type="movie" params={params} />
      </Suspense>
    </main>
  );
}
