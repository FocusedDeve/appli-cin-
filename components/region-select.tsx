"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import {
  COUNTRIES,
  DEFAULT_REGION,
  REGION_COOKIE,
  isRegion,
  regionFromLocale,
  regionName,
} from "@/lib/countries";

function readCookie(): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${REGION_COOKIE}=([A-Z]{2})`));
  return match ? match[1] : null;
}

/** Choix du pays dont on affiche les plateformes de streaming (cookie lu côté serveur). */
export function RegionSelect() {
  const router = useRouter();
  const [region, setRegion] = useState<string | null>(null);

  useEffect(() => {
    const saved = readCookie();
    const detected = regionFromLocale(navigator.language);
    // La valeur dépend du navigateur, inconnue au rendu serveur : un setState dans l'effet est voulu.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRegion(isRegion(saved) ? saved : (detected ?? DEFAULT_REGION));
  }, []);

  if (!region) return null;

  const options: readonly string[] = COUNTRIES.includes(region as (typeof COUNTRIES)[number])
    ? COUNTRIES
    : [region, ...COUNTRIES];

  return (
    <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-300 backdrop-blur-md">
      <Globe className="size-4" />
      <span className="sr-only">Pays pour les plateformes de streaming</span>
      <select
        value={region}
        onChange={(e) => {
          const next = e.target.value;
          setRegion(next);
          document.cookie = `${REGION_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
          router.refresh();
        }}
        className="max-w-32 bg-transparent focus:outline-none"
      >
        {options.map((code) => (
          <option key={code} value={code} className="bg-gray-900">
            {regionName(code)}
          </option>
        ))}
      </select>
    </label>
  );
}
