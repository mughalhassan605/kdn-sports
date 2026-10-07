"use client";

import {
  ArrowRightIcon,
  CheckIcon,
  DownloadSimpleIcon,
  LockKeyIcon,
  PlayIcon,
  PlusIcon,
  SparkleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useMemo, useState } from "react";
import { RevealText } from "@/components/fx/Reveal";
import { Shot } from "@/components/media/Shot";
import { QuickBuyModal } from "@/components/shop/QuickBuyModal";
import { events } from "@/data/events";
import { detailPath, frameNo, media, src, type Media } from "@/data/media";
import { PRICES } from "@/data/pricing";
import { LLink, useI18n } from "@/i18n/client";
import { fill } from "@/i18n/config";
import { ambient } from "@/lib/ambient";
import { cn } from "@/lib/cn";
import { duration, money } from "@/lib/format";
import { cart, ui, useCart, useFinePointer } from "@/lib/store";

export function MediaFinderSection() {
  const { t, locale } = useI18n();
  const { has } = useCart();
  const fine = useFinePointer();

  const [typeFilter, setTypeFilter] = useState<"all" | "photo" | "clip">("all");
  const [sportFilter, setSportFilter] = useState<string>("all");
  const [quickBuyMedia, setQuickBuyMedia] = useState<Media | null>(null);
  const [hoveredClip, setHoveredClip] = useState<string | null>(null);

  const eventMap = useMemo(() => new Map(events.map((e) => [e.slug, e])), []);

  // Distinct sports
  const sports = useMemo(() => {
    const list: string[] = [];
    events.forEach((e) => {
      const s = e.sport[locale];
      if (!list.includes(s)) list.push(s);
    });
    return list;
  }, [locale]);

  // Curated items matching filters (capped at 8 for the homepage preview)
  const items = useMemo(() => {
    return media
      .filter((m) => {
        if (typeFilter !== "all" && m.type !== typeFilter) return false;
        if (sportFilter !== "all") {
          const ev = eventMap.get(m.event);
          if (!ev || ev.sport[locale] !== sportFilter) return false;
        }
        return true;
      })
      .slice(0, 8);
  }, [typeFilter, sportFilter, eventMap, locale]);

  const toggleCart = (m: Media) => {
    if (has(m.id)) {
      cart.remove(m.id);
    } else {
      cart.add({
        id: m.id,
        license: "personal",
        format: m.type === "clip" ? "hd" : "original",
      });
      ui.toast(t.cart.added);
    }
  };

  return (
    <section id="media-store" aria-label={t.store.title} className="sec relative z-10 scroll-mt-16">
      <div className="wrap space-y-8">
        {/* Section Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-glow">
              <SparkleIcon size={16} weight="fill" />
              <span className="t-hud text-glow">{t.store.title}</span>
            </div>
            <RevealText as="h2" by="chars" className="t-h2 mt-2">
              Finde, bezahle &amp; lade deine Medien
            </RevealText>
            <p className="t-lede mt-3 max-w-[50ch] text-paper-2">
              {t.store.sub}
            </p>
          </div>

          <LLink href="/store" className="btn btn-paper shrink-0">
            <span>Alle Medien durchsuchen</span>
            <ArrowRightIcon size={16} weight="bold" />
          </LLink>
        </div>

        {/* Live Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-panel border border-line bg-ink-1 p-3 md:p-4">
          {/* Type Selector */}
          <div className="flex items-center gap-1.5">
            {(["all", "photo", "clip"] as const).map((tp) => {
              const active = typeFilter === tp;
              const label = tp === "all" ? t.store.types.all : tp === "photo" ? t.store.types.photos : t.store.types.clips;
              return (
                <button
                  key={tp}
                  type="button"
                  onClick={() => setTypeFilter(tp)}
                  className={cn(
                    "rounded-panel px-3.5 py-1.5 text-xs font-semibold transition-colors duration-200",
                    active ? "bg-paper text-ink-0 shadow" : "text-paper-2 hover:text-paper",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Sports Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSportFilter("all")}
              className={cn("chip text-xs", sportFilter === "all" && "border-glow bg-glow/15 text-paper")}
            >
              {t.store.allSports}
            </button>
            {sports.map((sp) => (
              <button
                key={sp}
                type="button"
                onClick={() => setSportFilter(sp)}
                className={cn("chip text-xs", sportFilter === sp && "border-glow bg-glow/15 text-paper")}
              >
                {sp}
              </button>
            ))}
          </div>
        </div>

        {/* Media Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
          {items.map((m) => {
            const ev = eventMap.get(m.event);
            const inCart = has(m.id);
            const startingPrice = m.type === "clip" ? PRICES.personal.hd : PRICES.personal.web;
            const kind = m.type === "clip" ? t.gallery.clip : t.gallery.photo;

            return (
              <div
                key={m.id}
                className="group relative flex flex-col overflow-hidden rounded-panel border border-line bg-ink-2 transition-all duration-300 hover:border-white/30"
                onPointerEnter={() => {
                  ambient.hover(m.palette);
                  if (m.type === "clip") setHoveredClip(m.id);
                }}
                onPointerLeave={() => {
                  ambient.leave();
                  if (m.type === "clip") setHoveredClip(null);
                }}
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-ink-3">
                  <LLink href={detailPath(m)} className="block size-full">
                    <Shot m={m} sizes="(min-width: 64rem) 25vw, (min-width: 48rem) 33vw, 50vw" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    {m.type === "clip" && hoveredClip === m.id && fine && (
                      <video
                        src={src.video(m.id)}
                        muted
                        loop
                        playsInline
                        autoPlay
                        className="absolute inset-0 size-full object-cover"
                      />
                    )}
                  </LLink>

                  {/* Watermark Tag */}
                  <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-2">
                    <span className="flex items-center gap-1 rounded-full bg-ink-0/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-paper backdrop-blur-sm">
                      <LockKeyIcon size={10} weight="bold" />
                      {m.type === "clip" ? "Clip" : "Foto"}
                    </span>
                    {m.type === "clip" && (
                      <span className="flex items-center gap-1 rounded-full bg-ink-0/80 px-2 py-0.5 text-[10px] font-semibold text-paper backdrop-blur-sm">
                        <PlayIcon size={9} weight="fill" />
                        {duration(m.duration ?? 0)}
                      </span>
                    )}
                  </div>

                  {/* Cart button */}
                  <button
                    type="button"
                    onClick={() => toggleCart(m)}
                    aria-label={inCart ? t.detail.remove : t.gallery.add}
                    className={cn(
                      "absolute bottom-2 right-2 z-10 grid size-8 place-items-center rounded-full transition-all duration-200 active:scale-95",
                      inCart ? "bg-glow text-glow-ink opacity-100" : "bg-ink-0/80 text-paper opacity-0 group-hover:opacity-100 hover:bg-paper hover:text-ink-0",
                    )}
                  >
                    {inCart ? <CheckIcon size={15} weight="bold" /> : <PlusIcon size={15} weight="bold" />}
                  </button>
                </div>

                {/* Card Meta & Pay Action */}
                <div className="flex flex-1 flex-col justify-between p-3">
                  <div>
                    <div className="flex items-baseline justify-between gap-2">
                      <h4 className="truncate text-xs font-[650] capitalize text-paper">
                        {kind} {frameNo(m)}
                      </h4>
                      <span className="font-mono text-xs font-bold tabular-nums text-glow">
                        {fill(t.store.fromPrice, { price: money(startingPrice, locale) })}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-paper-3">
                      {ev?.title} &bull; {ev?.sport[locale]}
                    </p>
                  </div>

                  <div className="mt-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setQuickBuyMedia(m)}
                      className="btn btn-sm btn-glow flex h-9 w-full items-center justify-center gap-1.5 px-2 text-xs font-bold"
                    >
                      <DownloadSimpleIcon size={14} weight="bold" />
                      <span>{t.store.payAndDownload}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA banner */}
        <div className="flex flex-col items-center justify-between gap-4 rounded-panel border border-line bg-gradient-to-r from-ink-1 via-ink-2 to-ink-1 p-6 sm:flex-row">
          <div>
            <h3 className="font-[650] text-paper">Suchst du nach einem bestimmten Foto oder Event?</h3>
            <p className="mt-1 text-xs text-paper-2">
              Nutze den kompletten Media Store mit allen Filtern und Bildnummer-Suche.
            </p>
          </div>
          <LLink href="/store" className="btn btn-glow shrink-0">
            <span>Kompletten Store öffnen</span>
            <ArrowRightIcon size={16} weight="bold" />
          </LLink>
        </div>
      </div>

      <QuickBuyModal
        media={quickBuyMedia}
        onClose={() => setQuickBuyMedia(null)}
      />
    </section>
  );
}
