"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/i18n/client";
import { localePath, locales, stripLocale } from "@/i18n/config";
import { cn } from "@/lib/cn";

export function LangSwitch({ className }: { className?: string }) {
  const { locale, t } = useI18n();
  const path = stripLocale(usePathname());
  return (
    <div role="group" aria-label={t.nav.language} className={cn("flex items-center rounded-full border border-line p-[3px]", className)}>
      {locales.map((l) => (
        // No prefetch: switching language is rare, and the router's segment prefetch across the
        // locale rewrite asks for a segment that does not exist (a 404 on every English page).
        <Link
          key={l}
          href={localePath(l, path)}
          prefetch={false}
          hrefLang={l}
          aria-current={l === locale ? "true" : undefined}
          className="t-hud grid h-7 min-w-9 place-items-center rounded-full px-2 text-paper-2 transition-colors hover:text-paper aria-[current=true]:bg-paper aria-[current=true]:text-ink-0"
        >
          {l}
        </Link>
      ))}
    </div>
  );
}
