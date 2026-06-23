import en from "./en";
import de from "./de";
import es from "./es";
import zh from "./zh";

export type LocaleKey = "en" | "de" | "es" | "zh";
export type LocaleDict = typeof en;
export const LOCALE_COOKIE = "locale";

export const locales: Record<LocaleKey, LocaleDict> = { en, de, es, zh };

export async function getLocale(): Promise<LocaleDict> {
  const { cookies } = await import("next/headers");
  const store = await cookies();
  const key = (store.get(LOCALE_COOKIE)?.value ?? "en") as LocaleKey;
  return locales[key] ?? en;
}
