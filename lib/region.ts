import { cookies, headers } from "next/headers";
import {
  DEFAULT_REGION,
  REGION_COOKIE,
  isRegion,
  regionFromLocale,
} from "@/lib/countries";

/**
 * Région de l'utilisateur : choix explicite (cookie), sinon pays de son navigateur
 * (Accept-Language, ex. "fr-CA" → CA), sinon la France. À appeler dans un contexte dynamique.
 */
export async function getRegion(): Promise<string> {
  const fromCookie = (await cookies()).get(REGION_COOKIE)?.value;
  if (isRegion(fromCookie)) return fromCookie;
  const acceptLanguage = (await headers()).get("accept-language") ?? "";
  for (const part of acceptLanguage.split(",")) {
    const region = regionFromLocale(part.split(";")[0].trim());
    if (region) return region;
  }
  return DEFAULT_REGION;
}
