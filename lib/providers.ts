import type { WatchProvider } from "@/lib/tmdb";

/**
 * Site officiel des principales plateformes (ids TMDB, région FR). TMDB ne fournit
 * qu'un lien JustWatch par film : ceci permet de rendre chaque logo cliquable.
 */
const PROVIDER_URLS: Record<number, string> = {
  8: "https://www.netflix.com/fr/",
  1796: "https://www.netflix.com/fr/",
  119: "https://www.primevideo.com/",
  10: "https://www.primevideo.com/",
  350: "https://tv.apple.com/fr",
  2: "https://tv.apple.com/fr",
  337: "https://www.disneyplus.com/fr-fr",
  283: "https://www.crunchyroll.com/fr",
  381: "https://www.canalplus.com/",
  58: "https://www.canalvod.com/",
  234: "https://www.arte.tv/fr/",
  2744: "https://madelen.ina.fr/",
  61: "https://video-a-la-demande.orange.fr/",
  192: "https://www.youtube.com/",
  35: "https://rakuten.tv/fr",
  11: "https://mubi.com/fr",
  415: "https://animationdigitalnetwork.com/",
  147: "https://www.m6plus.fr/",
  1754: "https://www.tf1.fr/",
  538: "https://watch.plex.tv/fr",
  300: "https://pluto.tv/fr",
  531: "https://www.paramountplus.com/fr/",
  1967: "https://molotov.tv/",
};

export function providerUrl(id: number): string | null {
  return PROVIDER_URLS[id] ?? null;
}

function unique(list: WatchProvider[]): WatchProvider[] {
  return list.filter((p, i) => list.findIndex((other) => other.id === p.id) === i);
}

/** Regroupe les plateformes par type d'offre, un même service n'apparaissant qu'une fois par groupe. */
export function groupProviders(providers: WatchProvider[]) {
  const by = (...categories: WatchProvider["category"][]) =>
    unique(providers.filter((p) => categories.includes(p.category)));
  return {
    free: by("free", "ads"),
    subscription: by("flatrate"),
    rentBuy: by("rent", "buy"),
  };
}
