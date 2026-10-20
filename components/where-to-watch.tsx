import Image from "next/image";
import { ExternalLink, Globe } from "lucide-react";
import { regionName } from "@/lib/countries";
import { groupProviders } from "@/lib/providers";
import type { WatchProvider, WatchProviders } from "@/lib/tmdb";

const regionNames = (codes: string[]) => codes.map(regionName).join(", ");

export function ProviderLogos({ providers, label }: { providers: WatchProvider[]; label: string }) {
  return (
    <ul className="flex flex-wrap items-center gap-2" aria-label={label}>
      {providers.map((p) => {
        const title = p.category === "ads" ? `${p.name} (avec publicité)` : p.name;
        const logo = p.logo ? (
          <Image src={p.logo} alt={p.name} width={36} height={36} className="size-9 rounded-lg" />
        ) : (
          <span className="text-xs text-gray-300">{p.name}</span>
        );
        return (
          <li key={p.id} title={title}>
            {p.url ? (
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg transition hover:ring-2 hover:ring-blue-500"
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
    <div className="flex flex-wrap items-center gap-3">
      <span className="w-32 shrink-0 text-sm text-gray-400">{label}</span>
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
  const { free, subscription, rentBuy } = groupProviders(data.providers);
  const empty = data.providers.length === 0;

  return (
    <div className="space-y-3">
      {!hideFree && free.length > 0 && (
        <Row label="Gratuit">
          <ProviderLogos providers={free} label="Plateformes gratuites" />
        </Row>
      )}
      {subscription.length > 0 && (
        <Row label="Avec abonnement">
          <ProviderLogos providers={subscription} label="Plateformes avec abonnement" />
        </Row>
      )}
      {rentBuy.length > 0 && (
        <Row label="Location / achat">
          <ProviderLogos providers={rentBuy} label="Location et achat" />
        </Row>
      )}

      {empty && (
        <p className="flex items-start gap-2 text-sm text-gray-400">
          <Globe className="mt-0.5 size-4 shrink-0" />
          {data.otherRegions.length > 0
            ? `Pas d'offre en ${regionName(data.region)}. Disponible en streaming : ${regionNames(data.otherRegions)}.`
            : `Aucune offre légale référencée en ${regionName(data.region)} pour le moment.`}
        </p>
      )}

      {data.link && !empty && (
        <a
          href={data.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-blue-300 hover:text-blue-200"
        >
          Toutes les offres sur JustWatch
          <ExternalLink className="size-3.5" />
        </a>
      )}
    </div>
  );
}
