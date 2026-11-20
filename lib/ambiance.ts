"use client";

import { useEffect, useState } from "react";
import { DICTS, type Dict } from "@/lib/i18n";
import { useLang } from "@/lib/use-lang";

const CACHE_KEY = "cinehub_weather";
/** Posé dès qu'on a demandé la position une fois : on ne redemande jamais (accordée, refusée ou ignorée). */
const ASKED_KEY = "cinehub_geo_asked";
const CACHE_MS = 30 * 60 * 1000;

type Weather = { code: number; isDay: boolean };

/** Moment de la journée d'après l'heure locale du navigateur. */
type Moment = "morning" | "afternoon" | "evening" | "night";

function momentOfDay(hour: number): Moment {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  if (hour >= 18 && hour < 23) return "evening";
  return "night";
}

/** Traduit un code météo WMO (Open-Meteo) en complément de phrase. */
function weatherPhrase({ code, isDay }: Weather, t: Dict) {
  const w = t.weather;
  if (code === 0 || code === 1) return isDay ? w.sunny : w.clearNight;
  if (code === 2 || code === 3) return w.cloudy;
  if (code === 45 || code === 48) return w.fog;
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return w.snow;
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return w.rain;
  if (code >= 95) return w.storm;
  return "";
}

function readCache(): Weather | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { at, weather } = JSON.parse(raw) as { at: number; weather: Weather };
    return Date.now() - at < CACHE_MS ? weather : null;
  } catch {
    return null;
  }
}

function storage(action: () => void) {
  try {
    action();
  } catch {}
}

async function permissionState(): Promise<PermissionState | "unknown"> {
  try {
    return (await navigator.permissions.query({ name: "geolocation" })).state;
  } catch {
    return "unknown";
  }
}

/**
 * Météo actuelle, ou null. La fenêtre d'autorisation n'apparaît qu'une seule fois : si la position
 * a déjà été demandée (puis refusée ou ignorée), on n'insiste plus. Si elle est accordée, la
 * permission persiste et aucune nouvelle fenêtre n'apparaît.
 */
async function fetchWeather(signal: AbortSignal): Promise<Weather | null> {
  if (!("geolocation" in navigator)) return null;
  const state = await permissionState();
  if (state === "denied") return null;
  if (state !== "granted") {
    let asked = false;
    storage(() => {
      asked = localStorage.getItem(ASKED_KEY) !== null;
    });
    if (asked) return null;
    storage(() => localStorage.setItem(ASKED_KEY, String(Date.now())));
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          // Coordonnées arrondies (~10 km) : la précision n'apporte rien à la météo.
          const lat = coords.latitude.toFixed(1);
          const lon = coords.longitude.toFixed(1);
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=weather_code,is_day`,
            { signal },
          );
          if (!res.ok) return resolve(null);
          const data = await res.json();
          resolve({ code: data.current.weather_code, isDay: data.current.is_day === 1 });
        } catch {
          resolve(null);
        }
      },
      () => resolve(null),
      { timeout: 8000, maximumAge: CACHE_MS },
    );
  });
}

/**
 * Fin de phrase du titre : « ce soir sous la pluie ». Rend « aujourd'hui » au rendu serveur,
 * puis l'heure locale, puis la météo si la géolocalisation est accordée (sinon l'heure seule).
 * Le changement de langue ne relance ni la géolocalisation ni la requête météo.
 */
export function useAmbiance(): string {
  const t = DICTS[useLang()];
  const [now, setNow] = useState<{ moment: Moment; weather: Weather | null } | null>(null);

  useEffect(() => {
    const moment = momentOfDay(new Date().getHours());
    const cached = readCache();
    // Valeurs propres au navigateur, inconnues au rendu serveur : un setState dans l'effet est voulu.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow({ moment, weather: cached });
    if (cached) return;

    const controller = new AbortController();
    fetchWeather(controller.signal).then((weather) => {
      if (controller.signal.aborted || !weather) return;
      storage(() => localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), weather })));
      setNow({ moment, weather });
    });
    return () => controller.abort();
  }, []);

  if (!now) return t.moments.fallback;
  const phrase = now.weather ? weatherPhrase(now.weather, t) : "";
  return phrase ? `${t.moments[now.moment]} ${phrase}` : t.moments[now.moment];
}
