"use client";

import Image from "next/image";
import Link from "next/link";
import { Bookmark, EyeOff, Star } from "lucide-react";
import type { Recommendation } from "@/app/actions";
import { useWatchlist } from "@/lib/user-data";
import { WatchActions } from "@/components/watch-actions";
import { useT } from "@/lib/use-lang";

/** Squelette fidèle à la carte finale : affiche, titre, métadonnées, note, accès. */
export function RecommendationCardSkeleton() {
  const t = useT();
  return (
    <div role="status" aria-label={t.loading} className="flex animate-pulse flex-row gap-4 sm:flex-col">
      <div className="aspect-[2/3] w-28 shrink-0 rounded-xl bg-surface sm:w-full" />
      <div className="flex-1 space-y-3 sm:mt-4">
        <div className="h-5 w-3/4 rounded bg-surface" />
        <div className="h-3.5 w-1/2 rounded bg-surface" />
        <div className="h-3.5 w-full rounded bg-surface" />
        <div className="h-3.5 w-5/6 rounded bg-surface" />
        <div className="h-7 w-24 rounded bg-surface" />
      </div>
    </div>
  );
}

type Props = {
  recommendation: Recommendation;
  /** Mode « à deux » : la note explique pourquoi ça plaira aux deux personnes. */
  duo?: boolean;
  /** Affiche le bouton « Déjà vu » (absent sur les pages partagées). */
  onSeen?: (recommendation: Recommendation) => void;
  /** Mise en avant du tirage au sort. */
  highlighted?: boolean;
};

const iconButton =
  "flex size-11 items-center justify-center rounded-lg border border-line bg-canvas/85 text-ink-2 transition-colors duration-150 hover:text-ink sm:size-9";

export function RecommendationCard({ recommendation: r, duo = false, onSeen, highlighted = false }: Props) {
  const watchlist = useWatchlist();
  const t = useT();
  const detailsHref = `/${r.type === "tv" ? "tv" : "movie"}/${r.id}`;
  const saved = watchlist.has(r.type, r.id);

  const actions = (
    <>
      {onSeen && (
        <button
          type="button"
          onClick={() => onSeen(r)}
          aria-label={t.seenReplace(r.title)}
          title={t.seenTitle}
          className={iconButton}
        >
          <EyeOff className="size-4" />
        </button>
      )}
      <button
        type="button"
        onClick={() =>
          watchlist.toggle({ id: r.id, type: r.type, title: r.title, year: r.year, rating: r.rating, poster: r.poster })
        }
        aria-pressed={saved}
        aria-label={saved ? t.removeFromList(r.title) : t.addToList(r.title)}
        title={saved ? t.removeTitle : t.laterTitle}
        className={`${iconButton} ${saved ? "border-line-strong !text-ice" : ""}`}
      >
        <Bookmark className={`size-4 ${saved ? "fill-current" : ""}`} />
      </button>
    </>
  );

  return (
    <article
      id={`card-${r.type}:${r.id}`}
      className={`group flex flex-row gap-4 rounded-xl transition-shadow duration-150 sm:flex-col sm:gap-0 ${
        highlighted ? "ring-2 ring-ice ring-offset-4 ring-offset-canvas" : ""
      }`}
    >
      <div className="relative w-28 shrink-0 sm:w-full">
        <Link
          href={detailsHref}
          className="relative block aspect-[2/3] overflow-hidden rounded-xl border border-line bg-surface"
        >
          {r.poster ? (
            <Image
              src={r.poster}
              alt={t.posterOf(r.title)}
              fill
              sizes="(min-width: 1024px) 320px, (min-width: 640px) 45vw, 112px"
              className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
            />
          ) : (
            <span className="flex size-full items-center justify-center p-3 text-center text-sm text-ink-2">
              {t.posterUnavailable}
            </span>
          )}
        </Link>
        <div className="absolute right-2 top-2 hidden gap-1.5 opacity-0 transition-opacity duration-150 focus-within:opacity-100 group-hover:opacity-100 sm:flex">
          {actions}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col sm:mt-4">
        <h2 className="font-display text-2xl leading-tight text-ink">
          <Link href={detailsHref} className="line-clamp-2 transition-colors hover:text-ice">
            {r.title}
          </Link>
        </h2>

        <p className="mt-1.5 flex items-center gap-2 text-sm text-ink-2">
          {r.year && <span>{r.year}</span>}
          <span aria-hidden>·</span>
          <span>{r.type === "tv" ? t.series : t.film}</span>
          {r.rating > 0 && (
            <>
              <span aria-hidden>·</span>
              <span className="flex items-center gap-1">
                <Star className="size-3.5 fill-current" />
                {r.rating.toFixed(1)}
              </span>
            </>
          )}
        </p>

        {r.reason ? (
          <p className="mt-3 line-clamp-2 border-l-2 border-navy pl-3 text-sm leading-relaxed text-ink">
            <span className="sr-only">{duo ? t.whyBoth : t.noralyNote}</span>
            {r.reason}
          </p>
        ) : (
          r.overview && <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-ink-2">{r.overview}</p>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <WatchActions variant="card" watch={r.watch} fallbackHref={detailsHref} />
          <div className="flex gap-1.5 sm:hidden">{actions}</div>
        </div>
      </div>
    </article>
  );
}
