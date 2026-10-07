"use client";

import { ArrowUpRightIcon, DownloadSimpleIcon, ListIcon, MagnifyingGlassIcon, ShoppingBagIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { loadSearchIndex } from "@/components/search/useSearchIndex";
import { site } from "@/data/site";
import { LLink, useI18n } from "@/i18n/client";
import { stripLocale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { ui, useCart, useOrders } from "@/lib/store";
import { LangSwitch } from "./LangSwitch";
import { Logo } from "./Logo";
import { useScrollLock } from "./SmoothScroll";

const NAV = [
  { href: "/events", key: "events" },
  { href: "/store", key: "store" },
  { href: "/clips", key: "clips" },
  { href: "/preise", key: "pricing" },
  { href: "/veranstalter", key: "organisers" },
] as const;

export function Header() {
  const { t, locale } = useI18n();
  const path = stripLocale(usePathname());
  const { scrollY } = useScroll();
  const [solid, setSolid] = useState(false);
  const [menu, setMenu] = useState(false);
  const { lines } = useCart();
  const myOrders = useOrders();

  useMotionValueEvent(scrollY, "change", (y) => setSolid(y > 16));
  useScrollLock(menu);

  const close = () => setMenu(false);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 border-b transition-[background-color,border-color] duration-300",
        solid || menu ? "border-line bg-ink-0/80 backdrop-blur-xl" : "border-transparent",
      )}
    >
      <div className="wrap flex h-16 items-center justify-between gap-4">
        <LLink href="/" aria-label={site.name} onClick={close} className="shrink-0">
          <Logo />
        </LLink>

        <nav aria-label={t.nav.menu} className="hidden lg:block">
          <ul className="flex items-center gap-5 xl:gap-7">
            {NAV.map((n) => (
              <li key={n.href}>
                <LLink
                  href={n.href}
                  aria-current={path.startsWith(n.href) ? "page" : undefined}
                  className="block py-2 text-[0.9375rem] font-[620] text-paper-2 transition-colors hover:text-paper aria-[current=page]:text-paper"
                >
                  <span className="zoom zoom-sm" data-text={t.nav[n.key]}>
                    <span className="zoom-in">{t.nav[n.key]}</span>
                  </span>
                </LLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              close();
              ui.openSearch();
            }}
            // Fetch the index on intent, so the dialog opens with it in hand.
            onPointerEnter={() => loadSearchIndex(locale).catch(() => {})}
            onFocus={() => loadSearchIndex(locale).catch(() => {})}
            aria-label={t.search.open}
            aria-keyshortcuts="Control+K Meta+K /"
            title={`${t.search.open} (/)`}
            className="grid size-10 place-items-center rounded-full border border-line-2 text-paper transition-colors hover:bg-white/10 xl:flex xl:w-auto xl:gap-2 xl:pl-3.5 xl:pr-2"
          >
            <MagnifyingGlassIcon size={18} weight="bold" />
            <span className="hidden text-[0.875rem] font-[620] text-paper-2 xl:inline">{t.search.open}</span>
            <kbd className="t-hud hidden h-6 min-w-6 place-items-center rounded-full border border-line px-1.5 text-paper-3 xl:grid">/</kbd>
          </button>
          <LangSwitch className="hidden sm:flex" />
          {myOrders.length > 0 && (
            <LLink
              href="/downloads"
              aria-label={t.nav.downloads}
              title={t.nav.downloads}
              className="hidden size-10 place-items-center rounded-full border border-line text-paper transition-colors hover:bg-white/10 md:grid"
            >
              <DownloadSimpleIcon size={18} weight="bold" />
            </LLink>
          )}
          <button
            type="button"
            onClick={ui.openCart}
            aria-label={`${t.nav.cart}: ${lines.length}`}
            className="relative grid size-10 place-items-center rounded-full border border-line-2 text-paper transition-colors hover:bg-white/10"
          >
            <ShoppingBagIcon size={18} weight="bold" />
            {lines.length > 0 && (
              <span className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-glow px-1 font-mono text-[10px] font-bold leading-none text-glow-ink">
                {lines.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setMenu((v) => !v)}
            aria-expanded={menu}
            aria-controls="mobile-menu"
            aria-label={menu ? t.nav.close : t.nav.menu}
            className="grid size-10 place-items-center rounded-full border border-line-2 text-paper transition-colors hover:bg-white/10 lg:hidden"
          >
            {menu ? <XIcon size={18} weight="bold" /> : <ListIcon size={18} weight="bold" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menu && (
          <motion.div
            id="mobile-menu"
            data-lenis-prevent
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-0 bottom-0 top-16 overflow-y-auto border-t border-line bg-ink-0 lg:hidden"
          >
            <nav aria-label={t.nav.menu} className="wrap flex min-h-full flex-col justify-between gap-10 py-8">
              <ul>
                {[...NAV, { href: "/ueber", key: "about" } as const].map((n, i) => (
                  <motion.li
                    key={n.href}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 + i * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="border-b border-line"
                  >
                    <LLink href={n.href} onClick={close} className="flex items-center justify-between gap-4 py-5">
                      <span className="t-h1">{t.nav[n.key]}</span>
                      <ArrowUpRightIcon size={22} className="shrink-0 text-paper-3" />
                    </LLink>
                  </motion.li>
                ))}
              </ul>
              <div className="flex items-center justify-between gap-4">
                <LangSwitch />
                <a href={`mailto:${site.email}`} className="t-hud text-paper-2">
                  {site.email}
                </a>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
