"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LANGS, type Lang } from "@/lib/i18n";
import { setLang, useLang, useT } from "@/lib/use-lang";

/** Bascule FR / EN : l'interface change aussitôt, le serveur est rafraîchi pour les pages dynamiques. */
export function LanguageSelect() {
  const router = useRouter();
  const lang = useLang();
  const t = useT();

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  function choose(next: Lang) {
    if (next === lang) return;
    setLang(next);
    router.refresh();
  }

  return (
    <div role="group" aria-label={t.language} className="flex h-11 items-center rounded-lg px-1">
      {LANGS.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => choose(code)}
          aria-pressed={lang === code}
          lang={code}
          className={`h-11 min-w-9 rounded-lg px-2 text-sm font-medium uppercase transition-colors duration-150 ${
            lang === code ? "text-ink" : "text-ink-2 hover:text-ink"
          }`}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
