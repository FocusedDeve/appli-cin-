"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Dices, Star, X } from "lucide-react";
import { getTrailerKey, type Recommendation } from "@/app/actions";
import { TrailerButton } from "@/components/trailer-button";
import { NoralyAvatar } from "@/components/noraly-avatar";
import { WatchActions } from "@/components/watch-actions";
import { useScrollLock } from "@/lib/use-scroll-lock";
import { useLang, useT } from "@/lib/use-lang";

function LazyTrailer({ recommendation: r }: { recommendation: Recommendation }) {
  const lang = useLang();
  const [key, setKey] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getTrailerKey(r.type, r.id, lang).then((value) => {
      if (active) setKey(value);
    });
    return () => {
      active = false;
    };
  }, [r.type, r.id, lang]);

  return key ? <TrailerButton videoKey={key} title={r.title} /> : null;
}

/** « Le choix de Noraly » : le gagnant du tirage au sort. */
export function ChoiceModal({
  recommendation: r,
  duo,
  onClose,
  onRetry,
  canRetry,
}: {
  recommendation: Recommendation;
  duo: boolean;
  onClose: () => void;
  onRetry: () => void;
  canRetry: boolean;
}) {
  const detailsHref = `/${r.type}/${r.id}`;
  const t = useT();
  useScrollLock(true);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      {/* Fond cliquable séparé : un clic dans la bande-annonce ne doit pas fermer cette modale. */}
      <div className="absolute inset-0 bg-black/75" onClick={onClose} />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={t.noralyChoice}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative my-auto w-full max-w-2xl rounded-2xl border border-line bg-surface p-5 sm:p-7"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t.close}
          className="absolute right-3 top-3 flex size-11 items-center justify-center rounded-lg text-ink-2 transition-colors hover:bg-elevated hover:text-ink"
        >
          <X className="size-5" />
        </button>

        <div className="flex items-center gap-3 pr-12">
          <NoralyAvatar size={44} />
          <h2 className="font-display text-2xl text-ink sm:text-3xl">{t.noralyChoice}</h2>
        </div>

        <div className="mt-6 flex flex-col gap-5 sm:flex-row">
          <div className="relative mx-auto aspect-[2/3] w-40 shrink-0 overflow-hidden rounded-xl border border-line bg-canvas sm:mx-0 sm:w-44">
            {r.poster ? (
              <Image src={r.poster} alt={t.posterOf(r.title)} fill sizes="176px" className="object-cover" />
            ) : (
              <span className="flex size-full items-center justify-center p-3 text-center text-sm text-ink-2">
                {t.posterUnavailable}
              </span>
            )}
          </div>
          <div className="flex flex-1 flex-col gap-4">
            <div>
              <h3 className="font-display text-3xl leading-tight text-ink">
                <Link href={detailsHref} className="transition-colors hover:text-ice">
                  {r.title}
                </Link>
              </h3>
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
            </div>
            {r.reason && (
              <p className="border-l-2 border-navy pl-3 text-sm leading-relaxed text-ink">
                <span className="sr-only">{duo ? t.whyBoth : t.noralyNote}</span>
                {r.reason}
              </p>
            )}
            <WatchActions watch={r.watch} fallbackHref={detailsHref} />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-5">
          <LazyTrailer recommendation={r} />
          {canRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-line px-5 text-sm text-ink-2 transition-colors duration-150 hover:border-line-strong hover:text-ink"
            >
              <Dices className="size-4" />
              {t.retryDraw}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
