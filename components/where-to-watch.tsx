"use client";

import Image from "next/image";
import { ArrowUpRight, Globe } from "lucide-react";
import { regionName } from "@/lib/countries";
import { groupProviders } from "@/lib/providers";
import type { WatchProvider, WatchProviders } from "@/lib/tmdb";
import { useLang, useT } from "@/lib/use-lang";

export function ProviderLogos({
  providers,
  label,
  size = 32,
}: {
  providers: WatchProvider[];
  label: string;
  size?: number;
}) {
  const t = useT();
  return (
    <ul className="flex flex-wrap items-center gap-1.5" aria-label={label}>
      {providers.map((p) => {
        const title = p.category === "ads" ? `${p.name} (${t.withAds})` : p.name;
        const logo = p.logo ? (
          <Image
            src={p.logo}
            alt={p.name}
            width={size}
            height={size}
            className="rounded-md"
            style={{ width: size, height: size }}
          />
        ) : (
          <span className="text-xs text-ink-2">{p.name}</span>
        );
        return (
          <li key={p.id} title={title}>
            {p.url ? (
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${p.name} (${t.newTab})`}
                className="block rounded-md transition-opacity duration-150 hover:opacity-80"
              >
                {logo}
              </a>
            ) : (
              logo
            )}
          </li>
        );
      })}
    </ul>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <span className="w-32 shrink-0 text-sm text-ink-2">{label}</span>
      {children}
    </div>
  );
}

/**
 * Où regarder un titre dans la région choisie : gratuit, abonnement, location/achat, et à défaut
 * les pays où il est disponible. `hideFree` laisse l'appelant gérer la ligne gratuite.
 */
export function WhereToWatch({
  data,
  hideFree = false,
}: {
  data: WatchProviders;
  hideFree?: boolean;
}) {
  const t = useT();
  const lang = useLang();
  const { free, subscription, rentBuy } = groupProviders(data.providers);
  const country = (code: string) => regionName(code, lang);
  const empty = data.providers.length === 0;

  return (
    <div className="space-y-3">
      {!hideFree && free.length > 0 && (
        <Row label={t.free}>
          <ProviderLogos providers={free} label={t.freePlatforms} />
        </Row>
      )}
      {subscription.length > 0 && (
        <Row label={t.subscription}>
          <ProviderLogos providers={subscription} label={t.subscriptionPlatforms} />
        </Row>
      )}
      {rentBuy.length > 0 && (
        <Row label={t.rentBuy}>
          <ProviderLogos providers={rentBuy} label={t.rentBuyPlatforms} />
        </Row>
      )}

      {empty && (
        <p className="flex items-start gap-2 text-sm text-ink-2">
          <Globe className="mt-0.5 size-4 shrink-0" />
          {data.otherRegions.length > 0
            ? t.noOfferIn(country(data.region), data.otherRegions.map(country).join(", "))
            : t.noLegalOffer(country(data.region))}
        </p>
      )}

      {data.link && !empty && (
        <a
          href={data.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-ice transition-colors hover:text-ink"
        >
          {t.allOffers}
          <ArrowUpRight className="size-3.5" />
        </a>
      )}
    </div>
  );
}
