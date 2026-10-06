"use client";

import { ArrowRightIcon, CircleNotchIcon, InfoIcon } from "@phosphor-icons/react/dist/ssr";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Shot } from "@/components/media/Shot";
import { TierScale } from "@/components/shop/TierScale";
import { getEvent } from "@/data/events";
import { frameNo, getMedia } from "@/data/media";
import { priceOf } from "@/data/pricing";
import { paymentMethods, type PaymentMethod } from "@/data/site";
import { LLink, useI18n } from "@/i18n/client";
import { localePath } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { money } from "@/lib/format";
import { cart, orders, useCart, useIsClient } from "@/lib/store";

/**
 * One page, no account: an email for the link, a payment method, the summary.
 * DEMO: /api/checkout prices the cart and signs an order without taking money.
 */
export function Checkout() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const ready = useIsClient();
  const { lines, summary } = useCart();
  const [email, setEmail] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("paypal");
  const [state, setState] = useState<"idle" | "paying" | "failed">("idle");
  const [invalid, setInvalid] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    setState("paying");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), method, lines }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const order = (await res.json()) as { token: string; no: string; at: number; total: number; count: number };
      orders.add({ token: order.token, no: order.no, at: order.at, count: order.count, total: order.total });
      cart.clear();
      router.push(localePath(locale, `/bestellung/${order.token}`));
    } catch {
      setState("failed");
    }
  };

  if (ready && lines.length === 0 && state !== "paying") {
    return (
      <div className="panel flex flex-col items-start gap-4 p-8 md:p-12">
        <p className="t-h2">{t.checkout.emptyTitle}</p>
        <p className="max-w-[40ch] text-paper-2">{t.cart.emptyHint}</p>
        <LLink href="/events" className="btn btn-paper mt-2">
          {t.cart.browse}
          <ArrowRightIcon size={16} weight="bold" />
        </LLink>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-8 lg:grid-cols-12">
      <div className="space-y-8 lg:col-span-7">
        <section className="panel p-5 md:p-7">
          <h2 className="t-h3">{t.checkout.contact}</h2>
          <div className="mt-5 grid gap-2">
            <label htmlFor="co-email" className="t-hud text-paper-2">
              {t.checkout.email}
            </label>
            <input
              id="co-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={invalid}
              aria-describedby="co-email-help"
              className="field"
            />
            <p id="co-email-help" className={cn("text-sm", invalid ? "text-rec" : "text-paper-3")}>
              {invalid ? t.checkout.invalidEmail : t.checkout.emailHelp}
            </p>
          </div>
        </section>

        <section className="panel p-5 md:p-7">
          <h2 className="t-h3">{t.checkout.method}</h2>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3" role="radiogroup" aria-label={t.checkout.method}>
            {paymentMethods.map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={method === m}
                onClick={() => setMethod(m)}
                className={cn(
                  "flex h-14 items-center justify-center rounded-panel border px-3 text-[0.9375rem] font-[650] transition-colors duration-300",
                  method === m ? "border-glow bg-glow/10 text-paper" : "border-line-2 text-paper-2 hover:border-white/45 hover:text-paper",
                )}
              >
                {t.checkout.methods[m]}
              </button>
            ))}
          </div>
          <p className="mt-5 flex items-start gap-2.5 rounded-panel border border-line bg-ink-2 px-4 py-3 text-sm text-paper-2">
            <InfoIcon size={17} className="mt-0.5 shrink-0 text-glow" />
            {t.checkout.demo}
          </p>
        </section>
      </div>

      <aside className="lg:col-span-5">
        <div className="panel p-5 md:sticky md:top-24 md:p-7">
          <h2 className="t-h3">{t.checkout.summary}</h2>
          <ul className="mt-4 max-h-[19rem] overflow-y-auto overscroll-contain pr-1" data-lenis-prevent>
            {lines.map((l) => {
              const m = getMedia(l.id);
              if (!m) return null;
              return (
                <li key={l.id} className="flex items-center gap-3 border-b border-line py-3 last:border-b-0">
                  <span className="relative block size-14 shrink-0 overflow-hidden rounded-media bg-ink-2">
                    <Shot m={m} sizes="56px" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-[620] capitalize text-paper">
                      {m.type === "clip" ? t.gallery.clip : t.gallery.photo} {frameNo(m)}
                    </span>
                    <span className="block truncate text-sm text-paper-3">
                      {getEvent(m.event)?.title} / {t.pricing[l.license]} / {t.pricing.formats[l.format].t}
                    </span>
                  </span>
                  <span className="shrink-0 tabular-nums text-paper">{money(priceOf(l), locale)}</span>
                </li>
              );
            })}
          </ul>

          <TierScale count={summary.photoCount} className="mt-5" />
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
              <dd className="t-num text-[2.75rem]">{money(summary.total, locale)}</dd>
            </div>
          </dl>

          <button type="submit" disabled={state === "paying" || lines.length === 0} className="btn btn-glow mt-5 h-14 w-full text-base">
            {state === "paying" ? (
              <>
                <CircleNotchIcon size={18} weight="bold" className="animate-spin" />
                {t.checkout.paying}
              </>
            ) : (
              <>
                {t.checkout.pay}
                <ArrowRightIcon size={18} weight="bold" />
              </>
            )}
          </button>
          {state === "failed" && (
            <p role="alert" className="mt-3 text-sm text-rec">
              {t.checkout.failed}
            </p>
          )}
          <p className="mt-4 text-sm text-paper-3">{t.checkout.legal}</p>
        </div>
      </aside>
    </form>
  );
}
