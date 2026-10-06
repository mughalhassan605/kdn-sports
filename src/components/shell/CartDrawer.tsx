"use client";

import { ArrowRightIcon, ShoppingBagIcon, TrashIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { Shot } from "@/components/media/Shot";
import { TierScale } from "@/components/shop/TierScale";
import { getEvent } from "@/data/events";
import { detailPath, frameNo, getMedia } from "@/data/media";
import { priceOf } from "@/data/pricing";
import { LLink, useI18n } from "@/i18n/client";
import { fill } from "@/i18n/config";
import { money } from "@/lib/format";
import { cart, ui, useCart, useUi } from "@/lib/store";
import { useScrollLock } from "./SmoothScroll";

const EASE = [0.16, 1, 0.3, 1] as const;

export function CartDrawer() {
  const { t, locale } = useI18n();
  const { cartOpen } = useUi();
  const { lines, summary } = useCart();

  useScrollLock(cartOpen);

  useEffect(() => {
    if (!cartOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") ui.closeCart();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cartOpen]);

  return (
    <AnimatePresence>
      {cartOpen && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={t.cart.title}>
          <motion.button
            type="button"
            aria-label={t.nav.close}
            onClick={ui.closeCart}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 cursor-default bg-ink-0/70 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.5, ease: EASE }}
            className="absolute inset-y-0 right-0 flex w-full max-w-[440px] flex-col border-l border-line bg-ink-1"
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5">
              <h2 className="t-h3">{t.cart.title}</h2>
              <div className="flex items-center gap-3">
                {lines.length > 0 && <span className="t-hud text-paper-3">{fill(t.cart.items, { n: lines.length })}</span>}
                <button
                  type="button"
                  autoFocus
                  onClick={ui.closeCart}
                  aria-label={t.nav.close}
                  className="grid size-10 place-items-center rounded-full border border-line text-paper transition-colors hover:bg-white/10"
                >
                  <XIcon size={18} weight="bold" />
                </button>
              </div>
            </div>

            {lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-start justify-center gap-4 px-8">
                <ShoppingBagIcon size={36} className="text-paper-3" />
                <p className="t-h3">{t.cart.empty}</p>
                <p className="max-w-[28ch] text-paper-2">{t.cart.emptyHint}</p>
                <LLink href="/events" onClick={ui.closeCart} className="btn btn-paper mt-2">
                  {t.cart.browse}
                  <ArrowRightIcon size={16} weight="bold" />
                </LLink>
              </div>
            ) : (
              <>
                <ul data-lenis-prevent className="flex-1 overflow-y-auto overscroll-contain px-5">
                  <AnimatePresence initial={false}>
                    {lines.map((l) => {
                      const m = getMedia(l.id);
                      if (!m) return null;
                      const ev = getEvent(m.event);
                      const kind = m.type === "clip" ? t.gallery.clip : t.gallery.photo;
                      return (
                        <motion.li
                          key={l.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: 40 }}
                          transition={{ duration: 0.35, ease: EASE }}
                          className="flex gap-4 border-b border-line py-4"
                        >
                          <LLink
                            href={detailPath(m)}
                            onClick={ui.closeCart}
                            className="relative size-[76px] shrink-0 overflow-hidden rounded-media bg-ink-2"
                          >
                            <Shot m={m} sizes="76px" alt="" />
                          </LLink>
                          <div className="flex min-w-0 flex-1 flex-col justify-between">
                            <div>
                              <p className="truncate font-[620] capitalize text-paper">
                                {kind} {frameNo(m)}
                              </p>
                              <p className="truncate text-sm text-paper-3">{ev?.title}</p>
                            </div>
                            <p className="t-hud text-paper-2">
                              {t.pricing[l.license]} / {t.pricing.formats[l.format].t}
                            </p>
                          </div>
                          <div className="flex flex-col items-end justify-between">
                            <span className="font-[620] tabular-nums text-paper">{money(priceOf(l), locale)}</span>
                            <button
                              type="button"
                              onClick={() => cart.remove(l.id)}
                              aria-label={`${t.cart.remove}: ${kind} ${frameNo(m)}`}
                              className="grid size-8 place-items-center rounded-full text-paper-3 transition-colors hover:bg-white/10 hover:text-paper"
                            >
                              <TrashIcon size={16} />
                            </button>
                          </div>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>

                <div className="shrink-0 border-t border-line bg-ink-1 px-5 pb-5 pt-4">
                  <TierScale count={summary.photoCount} />
                  <p className="mt-2 text-sm text-paper-2">
                    {summary.next ? fill(t.cart.nextTier, { n: summary.next.min - summary.photoCount, p: summary.next.pct }) : t.cart.maxTier}
                  </p>
                  <dl className="mt-4 space-y-1.5 text-[0.9375rem]">
                    <div className="flex justify-between">
                      <dt>{t.cart.subtotal}</dt>
                      <dd className="tabular-nums text-paper">{money(summary.subtotal, locale)}</dd>
                    </div>
                    {summary.discount > 0 && (
                      <div className="flex justify-between text-glow">
                        <dt>
                          {t.cart.discount} {summary.discountPct}%
                        </dt>
                        <dd className="tabular-nums">-{money(summary.discount, locale)}</dd>
                      </div>
                    )}
                    <div className="flex items-end justify-between pt-2">
                      <dt className="text-paper">
                        {t.cart.total} <span className="text-sm text-paper-3">{t.cart.vat}</span>
                      </dt>
                      <dd className="t-num text-[2.25rem]">{money(summary.total, locale)}</dd>
                    </div>
                  </dl>
                  <LLink href="/kasse" onClick={ui.closeCart} className="btn btn-glow mt-4 w-full">
                    {t.cart.checkout}
                    <ArrowRightIcon size={16} weight="bold" />
                  </LLink>
                </div>
              </>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

export function Toast() {
  const { t } = useI18n();
  const { toast } = useUi();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[55] flex justify-center px-4" aria-live="polite">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="panel pointer-events-auto flex items-center gap-3 rounded-full py-1.5 pl-5 pr-1.5 text-sm text-paper"
          >
            {toast.text}
            <button type="button" onClick={ui.openCart} className="btn btn-sm btn-glow">
              {t.nav.cart}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
