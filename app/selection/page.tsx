import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import type { Recommendation } from "@/app/actions";
import { NoralyAvatar } from "@/components/noraly-avatar";
import { PageLoading } from "@/components/page-loading";
import { RecommendationCard } from "@/components/recommendation-card";
import { DICTS } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import { parseItems } from "@/lib/search";
import { getRegion } from "@/lib/region";
import { getMediaSummary, getWatchProviders, tmdbImageUrl } from "@/lib/tmdb";

function cleanQuery(q: string | string[] | undefined): string {
  const text = Array.isArray(q) ? q[0] : q;
  return (text ?? "").trim().slice(0, 200);
}

export async function generateMetadata({ searchParams }: PageProps<"/selection">): Promise<Metadata> {
  const params = await searchParams;
  const lang = await getLang();
  const t = DICTS[lang];
  const refs = parseItems(params.items);
  const summaries = (
    await Promise.all(refs.slice(0, 3).map((r) => getMediaSummary(r.type, r.id, lang).catch(() => null)))
  ).filter((m) => m !== null);

  const title = t.selectionMetaTitle;
  const query = cleanQuery(params.q);
  const description =
    summaries.length > 0
      ? `${query ? `« ${query} » : ` : ""}${summaries.map((m) => m.title).join(", ")}${refs.length > 3 ? t.andMore : ""}.`
      : t.selectionMetaFallback;
  const image = tmdbImageUrl(summaries[0]?.poster_path ?? null, "w500");

  return {
    title,
    description,
    openGraph: { title, description, type: "website", images: image ? [{ url: image }] : [] },
    twitter: { card: image ? "summary_large_image" : "summary", title, description, images: image ? [image] : [] },
  };
}

export default function SelectionPage({ searchParams }: PageProps<"/selection">) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-24 pt-28 sm:px-8">
      <Suspense fallback={<PageLoading kind="selection" />}>
        <SelectionContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function SelectionContent({ searchParams }: { searchParams: PageProps<"/selection">["searchParams"] }) {
  const params = await searchParams;
  const refs = parseItems(params.items);
  const query = cleanQuery(params.q);
  const region = await getRegion();
  const lang = await getLang();
  const t = DICTS[lang];

  const items = (
    await Promise.all(
      refs.map(async (ref): Promise<Recommendation | null> => {
        try {
          const media = await getMediaSummary(ref.type, ref.id, lang);
          if (!media) return null;
          return {
            id: media.id,
            type: ref.type,
            title: media.title,
            year: media.release_date?.slice(0, 4) ?? "",
            reason: "",
            overview: media.overview,
            rating: media.vote_average,
            poster: tmdbImageUrl(media.poster_path, "w500"),
            watch: await getWatchProviders(media.id, ref.type, region),
          };
        } catch (e) {
          console.error("[selection]", ref, e);
          return null;
        }
      }),
    )
  ).filter((r) => r !== null);

  return (
    <>
      <header className="flex flex-col items-center text-center">
        <NoralyAvatar size={48} />
        <h1 className="font-display mt-6 text-balance text-4xl leading-[1.05] sm:text-5xl">
          {t.selectionTitle}
        </h1>
        {query && <p className="mt-3 max-w-xl text-ink-2">{t.selectionFor(query)}</p>}
        <Link
          href="/"
          className="mt-6 inline-flex h-11 items-center rounded-xl bg-navy px-6 text-sm font-medium text-ink transition-colors duration-150 hover:bg-navy-hover"
        >
          {t.makeMine}
        </Link>
      </header>

      {items.length === 0 ? (
        <p className="mt-12 text-center text-ink-2">
          {t.selectionEmpty}
        </p>
      ) : (
        <ul className="mt-12 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((r) => (
            <li key={`${r.type}:${r.id}`}>
              <RecommendationCard recommendation={r} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
