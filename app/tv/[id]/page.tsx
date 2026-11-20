import { PageLoading } from "@/components/page-loading";
import { Suspense } from "react";
import { MediaContent } from "@/components/media-details";

export default function TvPage({ params }: PageProps<"/tv/[id]">) {
  return (
    <main className="relative flex-1">
      <Suspense fallback={<div className="pt-32"><PageLoading /></div>}>
        <MediaContent type="tv" params={params} />
      </Suspense>
    </main>
  );
}
