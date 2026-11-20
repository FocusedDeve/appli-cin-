"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Search } from "lucide-react";
import { useScrollLock } from "@/lib/use-scroll-lock";
import { useLang, useT } from "@/lib/use-lang";

type Result = { id: number; type: "movie" | "tv"; title: string; year: string; poster: string | null };

const DEBOUNCE_MS = 300;

export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const lang = useLang();
  const t = useT();
  useScrollLock(open);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [active, setActive] = useState(0);

  const trimmed = query.trim();
  const searchable = trimmed.length >= 2;

  // Recherche avec debounce ; l'AbortController annule la requête précédente.
  useEffect(() => {
    if (!open || !searchable) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}&lang=${lang}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setResults(data.results);
        setActive(0);
        setLoading(false);
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setError(true);
        setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [open, searchable, trimmed, lang]);

  const close = () => {
    setQuery("");
    setResults([]);
    setError(false);
    setLoading(false);
    onClose();
  };

  const go = (result: Result) => {
    router.push(`/${result.type}/${result.id}`);
    close();
  };

  const visible = searchable ? results : [];

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") close();
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, visible.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && visible[active]) {
      go(visible[active]);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 px-4 pt-[15vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => e.target === e.currentTarget && close()}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={t.paletteAria}
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-surface shadow-lg shadow-black/50"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onKeyDown={onKeyDown}
          >
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search className="size-5 text-ink-2" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.palettePlaceholder}
                className="h-14 flex-1 bg-transparent text-base text-ink placeholder:text-ink-2 focus:outline-none"
              />
              {loading && <Loader2 className="size-4 animate-spin text-ice" />}
            </div>

            <ul className="max-h-[50vh] overflow-y-auto p-2">
              {visible.map((r, i) => (
                <li key={`${r.type}:${r.id}`}>
                  <button
                    type="button"
                    onClick={() => go(r)}
                    onMouseEnter={() => setActive(i)}
                    className={`flex w-full items-center gap-3 rounded-xl p-2 text-left transition ${
                      i === active ? "bg-elevated" : ""
                    }`}
                  >
                    <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md bg-elevated">
                      {r.poster && (
                        <Image src={r.poster} alt="" fill sizes="40px" className="object-cover" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{r.title}</p>
                      {r.year && <p className="text-sm text-ink-2">{r.year}</p>}
                    </div>
                  </button>
                </li>
              ))}
              {searchable && !loading && !error && results.length === 0 && (
                <li className="p-4 text-center text-sm text-ink-2">
                  {t.paletteNoResult(trimmed)}
                </li>
              )}
              {error && (
                <li className="p-4 text-center text-sm text-red-400">
                  {t.paletteError}
                </li>
              )}
              {!searchable && (
                <li className="p-4 text-center text-sm text-ink-2">
                  {t.paletteHint}
                </li>
              )}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
