"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Bookmark, Star, Trash2, X } from "lucide-react";
import { useWatchlist } from "@/lib/user-data";
import { useScrollLock } from "@/lib/use-scroll-lock";
import { useT } from "@/lib/use-lang";

/** Bouton « Ma liste » du header + panneau latéral des œuvres à voir plus tard. */
export function WatchlistButton() {
  const [open, setOpen] = useState(false);
  const { items, remove } = useWatchlist();
  const t = useT();
  useScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-11 items-center gap-2 rounded-lg px-3 text-sm text-ink-2 transition-colors duration-150 hover:bg-elevated hover:text-ink"
      >
        <Bookmark className="size-4" />
        <span className="hidden sm:inline">{t.myList}</span>
        <span className="sr-only sm:hidden">{t.myList}</span>
        {items.length > 0 && <span className="text-xs font-medium text-ice">{items.length}</span>}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex justify-end bg-black/75"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setOpen(false)}
          >
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label={t.myList}
              className="flex h-full w-full max-w-md flex-col border-l border-line bg-surface"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-line py-2 pl-5 pr-2">
                <h2 className="font-display text-2xl text-ink">
                  {t.myList}
                  {items.length > 0 && <span className="ml-2 font-sans text-sm text-ink-2">{items.length}</span>}
                </h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={t.close}
                  className="flex size-11 items-center justify-center rounded-lg text-ink-2 transition-colors hover:bg-elevated hover:text-ink"
                >
                  <X className="size-5" />
                </button>
              </div>

              {items.length === 0 ? (
                <p className="m-auto max-w-xs px-6 text-center leading-relaxed text-ink-2">
                  {t.emptyList}
                </p>
              ) : (
                <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
                  {items.map((item) => {
                    const href = `/${item.type}/${item.id}`;
                    return (
                      <li key={`${item.type}:${item.id}`} className="flex gap-4 py-4">
                        <Link
                          href={href}
                          onClick={() => setOpen(false)}
                          className="relative aspect-[2/3] w-14 shrink-0 overflow-hidden rounded-lg border border-line bg-canvas"
                        >
                          {item.poster && (
                            <Image src={item.poster} alt={t.posterOf(item.title)} fill sizes="56px" className="object-cover" />
                          )}
                        </Link>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <Link
                            href={href}
                            onClick={() => setOpen(false)}
                            className="font-display truncate text-xl leading-tight text-ink transition-colors hover:text-ice"
                          >
                            {item.title}
                          </Link>
                          <p className="mt-1 flex items-center gap-2 text-sm text-ink-2">
                            {item.year}
                            <span aria-hidden>·</span>
                            {item.type === "tv" ? t.series : t.film}
                            {item.rating > 0 && (
                              <>
                                <span aria-hidden>·</span>
                                <span className="flex items-center gap-1">
                                  <Star className="size-3.5 fill-current" />
                                  {item.rating.toFixed(1)}
                                </span>
                              </>
                            )}
                          </p>
                          <Link
                            href={href}
                            onClick={() => setOpen(false)}
                            className="mt-auto inline-flex min-h-11 items-center text-sm text-ice transition-colors hover:text-ink"
                          >
                            {t.detailsTrailer}
                          </Link>
                        </div>
                        <button
                          type="button"
                          onClick={() => remove(item.type, item.id)}
                          aria-label={t.removeFromList(item.title)}
                          className="flex size-11 shrink-0 items-center justify-center self-start rounded-lg text-ink-2 transition-colors hover:bg-elevated hover:text-ink"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
