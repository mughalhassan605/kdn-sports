"use client";

import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import { RevealBlock, RevealText } from "@/components/fx/Reveal";
import { TierScale } from "@/components/shop/TierScale";
import { PRICES, TIERS, tierFor, type Format, type License } from "@/data/pricing";
import { LLink, useI18n } from "@/i18n/client";
import { fill } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { money } from "@/lib/format";

const FORMATS: Format[] = ["web", "original", "hd", "uhd"];

/**
 * Prices as a board, not as plan cards: pick a licence, read four numbers,
 * then turn the scale to see what the volume discount does.
 */
export function PricingBoard({ withLink = true }: { withLink?: boolean }) {
  const { t, locale } = useI18n();
  const [license, setLicense] = useState<License>("personal");
  const [count, setCount] = useState(5);

  const unit = PRICES[license].original;
  const pct = tierFor(count)?.pct ?? 0;
  const each = Math.round(unit * (1 - pct / 100));
  const total = each * count;

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
      <div className="lg:col-span-5">
        <RevealText as="h2" className="t-h2 max-w-[13ch]">
          {t.pricing.title}
        </RevealText>
        <div role="group" aria-label={t.detail.license} className="mt-8 inline-flex rounded-full border border-line-2 p-1">
          {(["personal", "commercial"] as const).map((l) => (
            <button
              key={l}
              type="button"
              aria-pressed={license === l}
              onClick={() => setLicense(l)}
              className={cn(
                "h-10 rounded-full px-5 text-[0.9375rem] font-[640] transition-colors duration-300",
                license === l ? "bg-paper text-ink-0" : "text-paper-2 hover:text-paper",
              )}
            >
              {t.pricing[l]}
            </button>
          ))}
        </div>
        <p className="mt-4 max-w-[38ch] text-paper-2">{license === "personal" ? t.pricing.personalNote : t.pricing.commercialNote}</p>
        {withLink && (
          <LLink href="/preise" className="btn btn-sm btn-line mt-8">
            {t.pricing.more}
            <ArrowRightIcon size={15} weight="bold" />
          </LLink>
        )}
      </div>

      <RevealBlock className="lg:col-span-7">
        <dl data-rv-item className="grid grid-cols-2 gap-px overflow-hidden rounded-panel border border-line bg-line">
          {FORMATS.map((f) => (
            <div key={f} className="flex flex-col justify-between gap-8 bg-ink-1/90 p-5 md:p-6">
              <dt>
                <span className="t-h3 block">{t.pricing.formats[f].t}</span>
                <span className="mt-1.5 block text-sm text-paper-2">{t.pricing.formats[f].d}</span>
              </dt>
              <dd className="t-num text-[clamp(2.5rem,5.4vw,4.25rem)]">{money(PRICES[license][f], locale)}</dd>
            </div>
          ))}
        </dl>

        <div data-rv-item className="mt-2 rounded-panel border border-line bg-ink-1/90 p-5 md:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <label htmlFor="calc-count" className="t-h3">
              {t.pricing.calcTitle}
            </label>
            <span className="t-hud text-paper-3">{TIERS.map((x) => `${fill(t.pricing.tier, { n: x.min })} ${x.pct}%`).reverse().join(" / ")}</span>
          </div>

          <div className="mt-5">
            <TierScale count={count} />
            <input
              id="calc-count"
              type="range"
              min={1}
              max={10}
              step={1}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="range -mt-1"
              style={{ paddingInline: "calc(5% - 0.75rem)" }}
            />
          </div>

          <dl className="mt-3 grid grid-cols-3 gap-4 border-t border-line pt-5">
            <div>
              <dt className="t-hud text-paper-3">{t.pricing.formats.original.t}</dt>
              <dd className="t-num mt-2 text-[clamp(1.9rem,3.6vw,2.75rem)]">{count}</dd>
            </div>
            <div>
              <dt className="t-hud text-paper-3">{t.pricing.perPhoto}</dt>
              <dd className="t-num mt-2 text-[clamp(1.9rem,3.6vw,2.75rem)]">{money(each, locale)}</dd>
            </div>
            <div>
              <dt className="t-hud text-paper-3">
                {t.pricing.total}
                {pct > 0 && <span className="ml-2 text-glow">-{pct}%</span>}
              </dt>
              <dd className={cn("t-num mt-2 text-[clamp(1.9rem,3.6vw,2.75rem)] transition-colors duration-300", pct > 0 && "text-glow")}>{money(total, locale)}</dd>
            </div>
          </dl>
        </div>
        <p data-rv-item className="mt-3 text-sm text-paper-3">
          {t.pricing.vat}
        </p>
      </RevealBlock>
    </div>
  );
}
