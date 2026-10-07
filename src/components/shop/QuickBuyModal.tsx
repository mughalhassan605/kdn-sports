"use client";

import {
  ArrowRightIcon,
  CircleNotchIcon,
  DownloadSimpleIcon,
  LockKeyIcon,
  ShieldCheckIcon,
  XIcon,
} from "@phosphor-icons/react/dist/ssr";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Shot } from "@/components/media/Shot";
import { useScrollLock } from "@/components/shell/SmoothScroll";
import { getEvent } from "@/data/events";
import { frameNo, type Media } from "@/data/media";
import { defaultFormat, formatsFor, PRICES, type Format, type License } from "@/data/pricing";
import { paymentMethods, type PaymentMethod } from "@/data/site";
import { useI18n } from "@/i18n/client";
import { localePath } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { money } from "@/lib/format";
import { orders } from "@/lib/store";

const EASE = [0.16, 1, 0.3, 1] as const;

type Props = {
  media: Media | null;
  onClose: () => void;
};

export function QuickBuyModal({ media: m, onClose }: Props) {
  const { t, locale } = useI18n();
  const router = useRouter();

  const [license, setLicense] = useState<License>("personal");
  const [format, setFormat] = useState<Format>("original");
  const [email, setEmail] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("paypal");
  const [state, setState] = useState<"idle" | "paying" | "failed">("idle");
  const [invalidEmail, setInvalidEmail] = useState(false);

  // Sync default format whenever media changes
  useEffect(() => {
    if (m) {
      setLicense("personal");
      setFormat(defaultFormat(m.type));
      setState("idle");
      setInvalidEmail(false);
    }
  }, [m]);

  useScrollLock(Boolean(m));

  useEffect(() => {
    if (!m) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [m, onClose]);

  if (!m) return null;

  const ev = getEvent(m.event);
  const price = PRICES[license][format];
  const kind = m.type === "clip" ? t.gallery.clip : t.gallery.photo;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setInvalidEmail(true);
      return;
    }
    setInvalidEmail(false);
    setState("paying");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          method,
          lines: [{ id: m.id, license, format }],
        }),
      });

      if (!res.ok) throw new Error(String(res.status));

      const order = (await res.json()) as {
        token: string;
        no: string;
        at: number;
        total: number;
        count: number;
      };

      orders.add({
        token: order.token,
        no: order.no,
        at: order.at,
        count: order.count,
        total: order.total,
      });

      onClose();
      router.push(localePath(locale, `/bestellung/${order.token}`));
    } catch {
      setState("failed");
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5" role="dialog" aria-modal="true" aria-label={t.store.quickBuy.title}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
          className="fixed inset-0 bg-ink-0/80 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="relative max-h-[92svh] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-panel border border-line bg-ink-1 p-5 shadow-2xl sm:p-7"
          data-lenis-prevent
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="grid size-6 place-items-center rounded-full bg-glow/20 text-glow">
                  <LockKeyIcon size={14} weight="bold" />
                </span>
                <span className="t-hud text-glow">{t.store.payNotice}</span>
              </div>
              <h2 className="t-h3 mt-1.5 capitalize">
                {kind} {frameNo(m)} &bull; {ev?.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t.nav.close}
              className="grid size-9 place-items-center rounded-full border border-line text-paper-2 transition-colors hover:bg-white/10 hover:text-paper"
            >
              <XIcon size={16} weight="bold" />
            </button>
          </div>

          <form onSubmit={submit} noValidate className="mt-5 space-y-6">
            {/* Preview Banner */}
            <div className="grid gap-4 sm:grid-cols-12 sm:items-center">
              <div className="relative aspect-[4/3] overflow-hidden rounded-media border border-line sm:col-span-5">
                <Shot m={m} sizes="240px" className="size-full object-cover" />
                <div className="absolute inset-0 grid place-items-center bg-ink-0/30 p-2 text-center backdrop-blur-[1px]">
                  <span className="rounded-full bg-ink-0/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-paper">
                    Wasserzeichen-Vorschau
                  </span>
                </div>
              </div>
              <div className="space-y-1.5 sm:col-span-7">
                <p className="text-sm text-paper-2">
                  <span className="font-semibold text-paper">Original-Download:</span> Ohne Wasserzeichen, in voller Auflösung und Farbtiefe.
                </p>
                <p className="flex items-center gap-2 text-xs text-paper-3">
                  <ShieldCheckIcon size={15} weight="fill" className="text-glow" />
                  {t.store.quickBuy.instantAccess}
                </p>
              </div>
            </div>

            {/* License Picker */}
            <fieldset>
              <legend className="t-hud text-paper-3">{t.detail.license}</legend>
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                {(["personal", "commercial"] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    aria-pressed={license === l}
                    onClick={() => setLicense(l)}
                    className={cn(
                      "rounded-panel border p-3 text-left transition-colors duration-200",
                      license === l
                        ? "border-paper bg-paper text-ink-0 shadow"
                        : "border-line-2 text-paper hover:border-white/40",
                    )}
                  >
                    <span className="block font-semibold">{t.pricing[l]}</span>
                    <span className={cn("block text-xs mt-0.5", license === l ? "text-ink-2" : "text-paper-3")}>
                      {l === "personal" ? "Für Privat & Social Media" : "Kommerziell & Sponsoring"}
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Format Picker */}
            <fieldset>
              <legend className="t-hud text-paper-3">{t.detail.format}</legend>
              <div className="mt-2.5 space-y-2">
                {formatsFor(m.type).map((f) => (
                  <button
                    key={f}
                    type="button"
                    aria-pressed={format === f}
                    onClick={() => setFormat(f)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-panel border p-3 text-left transition-colors duration-200",
                      format === f ? "border-glow bg-glow/10" : "border-line-2 hover:border-white/40",
                    )}
                  >
                    <div>
                      <span className="block font-semibold text-paper">{t.pricing.formats[f].t}</span>
                      <span className="block text-xs text-paper-3">{t.pricing.formats[f].d}</span>
                    </div>
                    <span className="font-mono text-base font-bold tabular-nums text-paper">
                      {money(PRICES[license][f], locale)}
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label htmlFor="qb-email" className="t-hud text-paper-3">
                {t.store.quickBuy.emailPrompt}
              </label>
              <input
                id="qb-email"
                type="email"
                required
                value={email}
                placeholder="name@beispiel.de"
                onChange={(e) => setEmail(e.target.value)}
                className="field"
              />
              {invalidEmail && (
                <p className="text-xs text-rec">{t.checkout.invalidEmail}</p>
              )}
            </div>

            {/* Payment Method Selector */}
            <fieldset>
              <legend className="t-hud text-paper-3">{t.checkout.method}</legend>
              <div className="mt-2.5 grid grid-cols-3 gap-2">
                {paymentMethods.map((pm) => (
                  <button
                    key={pm}
                    type="button"
                    onClick={() => setMethod(pm)}
                    className={cn(
                      "flex h-11 items-center justify-center rounded-panel border px-2 text-xs font-semibold transition-colors duration-200",
                      method === pm ? "border-glow bg-glow/15 text-paper" : "border-line-2 text-paper-2 hover:border-white/40",
                    )}
                  >
                    {t.checkout.methods[pm]}
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Price & Submit Action */}
            <div className="border-t border-line pt-4">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="t-hud block text-paper-3">Gesamtbetrag</span>
                  <span className="text-xs text-paper-3">{t.detail.vat}</span>
                </div>
                <span className="t-num text-3xl font-bold text-glow">{money(price, locale)}</span>
              </div>

              <button
                type="submit"
                disabled={state === "paying"}
                className="btn btn-glow mt-4 h-13 w-full text-base font-bold"
              >
                {state === "paying" ? (
                  <>
                    <CircleNotchIcon size={18} weight="bold" className="animate-spin" />
                    {t.store.quickBuy.processing}
                  </>
                ) : (
                  <>
                    <DownloadSimpleIcon size={18} weight="bold" />
                    {t.store.quickBuy.payNow}
                    <ArrowRightIcon size={16} weight="bold" />
                  </>
                )}
              </button>

              {state === "failed" && (
                <p className="mt-2 text-center text-xs text-rec">{t.checkout.failed}</p>
              )}

              <p className="mt-3 text-center text-xs text-paper-3">
                {t.store.quickBuy.secureCheckout} &bull; Kein Abo
              </p>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
