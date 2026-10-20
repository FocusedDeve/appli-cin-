import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Play, Star } from "lucide-react";
import type { Recommendation } from "@/app/actions";
import { groupProviders } from "@/lib/providers";
import { ProviderLogos, WhereToWatch } from "@/components/where-to-watch";

export function RecommendationCard({ recommendation: r }: { recommendation: Recommendation }) {
  const isSeries = r.type === "tv";
  const detailsHref = `/${r.type === "tv" ? "tv" : "movie"}/${r.id}`;
  const { free } = groupProviders(r.watch.providers);
  const hasFree = free.length > 0;

  return (
    <article className="flex flex-col gap-5 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-colors hover:border-blue-500/40 sm:flex-row sm:p-5">
      <Link
        href={detailsHref}
        className="relative mx-auto aspect-[2/3] w-40 shrink-0 overflow-hidden rounded-2xl bg-gray-900 sm:mx-0 sm:w-44"
      >
        {r.poster ? (
          <Image
            src={r.poster}
            alt={`Affiche de ${r.title}`}
            fill
            sizes="(min-width: 640px) 176px, 160px"
            className="object-cover"
          />
        ) : (
          <span className="flex size-full items-center justify-center p-3 text-center text-sm text-gray-500">
            Affiche indisponible
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="font-display text-2xl font-bold">
            <Link href={detailsHref} className="hover:text-blue-400">
              {r.title}
            </Link>
          </h2>
          <span className="text-gray-500">{r.year}</span>
          {isSeries && (
            <span className="rounded-full border border-blue-500/40 px-2 py-0.5 text-xs text-blue-300">
              Série
            </span>
          )}
          {r.rating > 0 && (
            <span className="flex items-center gap-1 text-sm text-yellow-400">
              <Star className="size-4 fill-current" />
              {r.rating.toFixed(1)}
            </span>
          )}
        </div>

        <p className="mt-3 rounded-2xl border border-blue-500/20 bg-blue-900/10 px-4 py-3 text-sm leading-relaxed text-blue-100">
          <span className="font-semibold">Pourquoi ce choix : </span>
          {r.reason}
        </p>

        {r.overview && (
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-gray-400">{r.overview}</p>
        )}

        <div className="mt-auto space-y-3 pt-4">
          {hasFree ? (
            <div className="flex flex-wrap items-center gap-4">
              <a
                href={r.watch.link ?? detailsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-blue-700 px-5 py-2.5 font-semibold text-white shadow-[0_0_24px_-4px_rgba(30,64,175,0.9)] transition hover:bg-blue-600"
              >
                <Play className="size-4 fill-current" />
                Regarder gratuitement
                <ExternalLink className="size-3.5 opacity-70" />
              </a>
              <ProviderLogos providers={free} label="Plateformes gratuites" />
            </div>
          ) : (
            <p className="text-sm italic text-gray-500">Non disponible gratuitement pour le moment</p>
          )}
          <WhereToWatch data={r.watch} hideFree />
        </div>
      </div>
    </article>
  );
}
