import type { WatchProvider } from "@/lib/tmdb";

/**
 * Site officiel des principales plateformes (ids TMDB). TMDB ne fournit
 * qu'un lien JustWatch par film : ceci permet de rendre chaque logo cliquable.
 */
const PROVIDER_URLS: Record<number, string> = {
  8: "https://www.netflix.com/",
  1796: "https://www.netflix.com/",
  119: "https://www.primevideo.com/",
  10: "https://www.primevideo.com/",
  350: "https://tv.apple.com/",
  2: "https://tv.apple.com/",
  337: "https://www.disneyplus.com/",
  283: "https://www.crunchyroll.com/",
  381: "https://www.canalplus.com/",
  58: "https://www.canalvod.com/",
  234: "https://www.arte.tv/fr/",
  2744: "https://madelen.ina.fr/",
  61: "https://video-a-la-demande.orange.fr/",
  192: "https://www.youtube.com/",
  35: "https://rakuten.tv/fr",
  11: "https://mubi.com/",
  415: "https://animationdigitalnetwork.com/",
  147: "https://www.m6plus.fr/",
  1754: "https://www.tf1.fr/",
  538: "https://watch.plex.tv/fr",
  300: "https://pluto.tv/",
  531: "https://www.paramountplus.com/",
  15: "https://www.hulu.com/",
  1899: "https://www.max.com/",
  386: "https://www.peacocktv.com/",
  73: "https://tubitv.com/",
  613: "https://www.amazon.com/freevee",
  207: "https://therokuchannel.roku.com/",
  38: "https://www.bbc.co.uk/iplayer",
  41: "https://www.itv.com/",
  103: "https://www.channel4.com/",
  21: "https://www.stan.com.au/",
  230: "https://www.crave.ca/",
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
