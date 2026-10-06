import { lang } from "next/root-params";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "./config";
import { de, type Dict } from "./dict/de";
import { en } from "./dict/en";

const dicts: Record<Locale, Dict> = { de, en };

export const dictFor = (locale: Locale) => dicts[locale];

/** Locale of the current request, from the [lang] root segment. Server Components only. */
export async function getLocale(): Promise<Locale> {
  const l = await lang();
  if (!isLocale(l)) notFound();
  return l;
}

export async function getI18n() {
  const locale = await getLocale();
  return { locale, t: dicts[locale] };
}
