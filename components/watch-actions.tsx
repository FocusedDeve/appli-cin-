"use client";

import { ArrowUpRight } from "lucide-react";
import { groupProviders } from "@/lib/providers";
import type { WatchProviders } from "@/lib/tmdb";
import { ProviderLogos, WhereToWatch } from "@/components/where-to-watch";
import { useT } from "@/lib/use-lang";

/**
 * Accès au visionnage. `card` : une seule ligne (gratuit, sinon abonnement, sinon constat).
 * `full` : toutes les offres (modale du choix de Noraly).
 */
export function WatchActions({
  watch,
  fallbackHref,
  variant = "full",
}: {
  watch: WatchProviders;
  fallbackHref: string;
  variant?: "card" | "full";
}) {
  const t = useT();
  const { free, subscription } = groupProviders(watch.providers);

  if (variant === "card") {
    const shown = free.length > 0 ? free : subscription;
    if (shown.length === 0) {
      return <p className="text-sm text-ink-2">{t.noOffer}</p>;
    }
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-xs text-ink-2">{free.length > 0 ? t.free : t.subscription}</span>
        <ProviderLogos
          providers={shown.slice(0, 4)}
          label={free.length > 0 ? t.freePlatforms : t.subscriptionPlatforms}
          size={28}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {free.length > 0 ? (
        <div className="flex flex-wrap items-center gap-4">
          <a
            href={watch.link ?? fallbackHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-navy px-5 text-sm font-medium text-ink transition-colors duration-150 hover:bg-navy-hover"
          >
            {t.watchFree}
            <ArrowUpRight className="size-4" />
          </a>
          <ProviderLogos providers={free} label={t.freePlatforms} />
        </div>
      ) : (
        <p className="text-sm text-ink-2">{t.notFree}</p>
      )}
      <WhereToWatch data={watch} hideFree />
    </div>
  );
}
