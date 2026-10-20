/** Pays proposés dans le sélecteur de région (codes ISO 3166-1, ceux gérés par TMDB). */
export const COUNTRIES = [
  "FR", "BE", "CH", "CA", "LU", "MC", "MA", "DZ", "TN", "SN", "CI", "CM", "CD", "MG", "HT",
  "US", "GB", "IE", "DE", "AT", "ES", "IT", "PT", "NL", "SE", "NO", "DK", "FI", "PL", "RO",
  "GR", "TR", "BR", "MX", "AR", "CO", "CL", "AU", "NZ", "IN", "JP", "KR", "ZA", "NG", "EG",
] as const;

export const DEFAULT_REGION = "FR";
export const REGION_COOKIE = "region";

export function isRegion(value: string | undefined | null): value is string {
  return !!value && /^[A-Z]{2}$/.test(value);
}

/** Pays déduit d'une langue de navigateur ("fr-CA" → "CA"), ou null. */
export function regionFromLocale(locale: string | undefined | null): string | null {
  const code = locale?.split(/[-_]/)[1]?.toUpperCase();
  return isRegion(code) ? code : null;
}

export function regionName(code: string): string {
  return new Intl.DisplayNames(["fr"], { type: "region" }).of(code) ?? code;
}
