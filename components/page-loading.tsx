"use client";

import { useT } from "@/lib/use-lang";

/** Texte d'attente des pages dynamiques, dans la langue de l'utilisateur. */
export function PageLoading({ kind = "page" }: { kind?: "page" | "selection" }) {
  const t = useT();
  return (
    <p role="status" className="py-24 text-center text-ink-2">
      {kind === "selection" ? t.selectionLoading : t.loadingPage}
    </p>
  );
}
