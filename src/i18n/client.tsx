"use client";

import Link from "next/link";
import { createContext, useContext, type ComponentProps } from "react";
import { localePath, type Locale } from "./config";
import type { Dict } from "./dict/de";

type Ctx = { locale: Locale; t: Dict };
const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ locale, t, children }: Ctx & { children: React.ReactNode }) {
  return <I18nContext.Provider value={{ locale, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

/** next/link that keeps the visitor in their language. `href` is an app path ("/events"). */
export function LLink({ href, ...rest }: Omit<ComponentProps<typeof Link>, "href"> & { href: string }) {
  const { locale } = useI18n();
  const target = href.startsWith("/") ? localePath(locale, href) : href;
  return <Link href={target} {...rest} />;
}
