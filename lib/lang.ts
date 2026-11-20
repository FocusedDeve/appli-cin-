import { cookies } from "next/headers";
import { DEFAULT_LANG, LANG_COOKIE, isLang, type Lang } from "@/lib/i18n";

/** Langue de l'utilisateur côté serveur : cookie, sinon anglais. Contexte dynamique uniquement. */
export async function getLang(): Promise<Lang> {
  const fromCookie = (await cookies()).get(LANG_COOKIE)?.value;
  return isLang(fromCookie) ? fromCookie : DEFAULT_LANG;
}
