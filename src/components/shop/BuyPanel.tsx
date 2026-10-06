"use client";

import { ArrowRightIcon, CheckIcon, DownloadSimpleIcon, FlagIcon, PlusIcon } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import { frameNo, src, type Media } from "@/data/media";
import { defaultFormat, formatsFor, PRICES, type Format, type License } from "@/data/pricing";
import { site } from "@/data/site";
import { LLink, useI18n } from "@/i18n/client";
import { cn } from "@/lib/cn";
import { aspectLabel, clock, dateLong, duration, money } from "@/lib/format";
import { cart, ui, useCart } from "@/lib/store";

/** Licence, format, price, cart. Everything a buyer decides, in the order they decide it. */
export function BuyPanel({ m, eventTitle }: { m: Media; eventTitle: string }) {
  const { t, locale } = useI18n();
  const { line } = useCart();
  const inCart = line(m.id);
  const [license, setLicense] = useState<License>("personal");
  const [format, setFormat] = useState<Format>(defaultFormat(m.type));

  // What sits in the cart wins over the local pick, so the panel never contradicts it.
  const curLicense = inCart?.license ?? license;
  const curFormat = inCart?.format ?? format;
  const price = PRICES[curLicense][curFormat];
  const kind = m.type === "clip" ? t.gallery.clip : t.gallery.photo;

  const choose = (next: { license?: License; format?: Format }) => {
    const l = next.license ?? curLicense;
    const f = next.format ?? curFormat;
    setLicense(l);
    setFormat(f);
    if (inCart) cart.add({ id: m.id, license: l, format: f });
  };

  const facts: [string, string][] = [
    [t.detail.taken, `${dateLong(m.takenAt, locale)}, ${clock(m.takenAt)}`],
    m.type === "clip" ? [t.detail.length, duration(m.duration ?? 0)] : [t.detail.ratio, `${aspectLabel(m.w, m.h)} ${m.w >= m.h ? t.detail.landscape : t.detail.portrait}`],
    [t.detail.file, m.type === "clip" ? "MP4" : "JPG"],
    [t.detail.by, site.name],
  ];

  return (
    <div className="panel p-5 md:p-7">
      <p className="t-hud text-paper-3">{eventTitle}</p>
      <h1 className="t-h2 mt-2 capitalize">
        {kind} {frameNo(m)}
      </h1>

      <fieldset className="mt-7">
        <legend className="t-hud text-paper-3">{t.detail.license}</legend>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {(["personal", "commercial"] as const).map((l) => (
            <button
              key={l}
              type="button"
              aria-pressed={curLicense === l}
              onClick={() => choose({ license: l })}
              className={cn(
                "rounded-panel border px-4 py-3 text-left transition-colors duration-300",
                curLicense === l ? "border-paper bg-paper text-ink-0" : "border-line-2 text-paper hover:border-white/45",
              )}
            >
              <span className="block font-[650]">{t.pricing[l]}</span>
            </button>
          ))}
        </div>
        <p className="mt-2.5 text-sm text-paper-2">{curLicense === "personal" ? t.pricing.personalNote : t.pricing.commercialNote}</p>
      </fieldset>

      <fieldset className="mt-6">
        <legend className="t-hud text-paper-3">{t.detail.format}</legend>
        <div className="mt-3 space-y-2">
          {formatsFor(m.type).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={curFormat === f}
              onClick={() => choose({ format: f })}
              className={cn(
                "flex w-full items-center justify-between gap-4 rounded-panel border px-4 py-3 text-left transition-colors duration-300",
                curFormat === f ? "border-glow bg-glow/10" : "border-line-2 hover:border-white/45",
              )}
            >
              <span>
                <span className="block font-[650] text-paper">{t.pricing.formats[f].t}</span>
                <span className="block text-sm text-paper-2">{t.pricing.formats[f].d}</span>
              </span>
              <span className="shrink-0 tabular-nums text-paper">{money(PRICES[curLicense][f], locale)}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-7 flex items-end justify-between gap-4 border-t border-line pt-5">
        <span className="t-num text-[3.5rem]">{money(price, locale)}</span>
        <span className="pb-1 text-sm text-paper-3">{t.detail.vat}</span>
      </div>

      <div className="mt-4 grid gap-2">
        {inCart ? (
          <>
            <button type="button" onClick={ui.openCart} className="btn btn-glow w-full">
              <CheckIcon size={16} weight="bold" />
              {t.detail.inCart}
            </button>
            <LLink href="/kasse" className="btn btn-paper w-full">
              {t.detail.toCheckout}
              <ArrowRightIcon size={16} weight="bold" />
            </LLink>
          </>
        ) : (
          <button
            type="button"
            onClick={() => {
              cart.add({ id: m.id, license: curLicense, format: curFormat });
              ui.toast(t.cart.added);
            }}
            className="btn btn-glow w-full"
          >
            <PlusIcon size={16} weight="bold" />
            {t.detail.add}
          </button>
        )}
        <a href={m.type === "clip" ? src.video(m.id) : src.preview(m.id)} download={`kdn-vorschau-${m.id}`} className="btn btn-line w-full">
          <DownloadSimpleIcon size={16} weight="bold" />
          {t.detail.previewDl}
        </a>
      </div>
      <p className="mt-2.5 text-sm text-paper-3">{t.detail.previewDlNote}</p>

      <dl className="mt-7 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-line pt-5">
        {facts.map(([k, v]) => (
          <div key={k}>
            <dt className="t-hud text-paper-3">{k}</dt>
            <dd className="mt-1 text-[0.9375rem] text-paper">{v}</dd>
          </div>
        ))}
      </dl>

      <a href={`mailto:${site.email}?subject=${encodeURIComponent(`${kind} ${frameNo(m)} (${m.id})`)}`} className="link-u mt-6 inline-flex items-center gap-2 text-sm text-paper-3">
        <FlagIcon size={14} />
        {t.detail.report}
      </a>
    </div>
  );
}
