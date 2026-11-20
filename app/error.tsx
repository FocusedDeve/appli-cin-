"use client";

import Link from "next/link";
import { useT } from "@/lib/use-lang";

/** Page d'erreur : un TMDB injoignable ne doit pas afficher l'écran d'erreur brut de Next.js. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();
  console.error(error);
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 pt-24 text-center">
      <h1 className="font-display text-4xl leading-tight text-ink">{t.errorTitle}</h1>
      <p className="mt-3 leading-relaxed text-ink-2">{t.errorBody}</p>
      <div className="mt-8 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="h-11 rounded-xl bg-navy px-6 text-sm font-medium text-ink transition-colors duration-150 hover:bg-navy-hover"
        >
          {t.retry}
        </button>
        <Link
          href="/"
          className="inline-flex h-11 items-center rounded-xl border border-line px-6 text-sm text-ink-2 transition-colors duration-150 hover:border-line-strong hover:text-ink"
        >
          {t.back}
        </Link>
      </div>
    </main>
  );
}
