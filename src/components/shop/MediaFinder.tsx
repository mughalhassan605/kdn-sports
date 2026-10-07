"use client";

import {
  CheckIcon,
  DownloadSimpleIcon,
  LockKeyIcon,
  MagnifyingGlassIcon,
  PlayIcon,
  PlusIcon,
  ShieldCheckIcon,
  XIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useMemo, useState } from "react";
import { Shot } from "@/components/media/Shot";
import { type EventInfo } from "@/data/events";
import { detailPath, frameNo, ratio, src, type Media } from "@/data/media";
import { PRICES } from "@/data/pricing";
import { LLink, useI18n } from "@/i18n/client";
import { fill } from "@/i18n/config";
import { ambient } from "@/lib/ambient";
import { cn } from "@/lib/cn";
import { duration, money } from "@/lib/format";
import { cart, ui, useCart, useFinePointer } from "@/lib/store";
import { QuickBuyModal } from "./QuickBuyModal";

type Props = {
  media: Media[];
  events: EventInfo[];
};

export function MediaFinder({ media, events }: Props) {
  const { t, locale } = useI18n();
  const { has } = useCart();
  const fine = useFinePointer();

  // Filters state
  const [typeFilter, setTypeFilter] = useState<"all" | "photo" | "clip">("all");
  const [sportFilter, setSportFilter] = useState<string>("all");
  const [orientationFilter, setOrientationFilter] = useState<"all" | "landscape" | "portrait">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredClip, setHoveredClip] = useState<string | null>(null);

  // Quick Buy state
  const [quickBuyMedia, setQuickBuyMedia] = useState<Media | null>(null);

  // Event map for fast lookup
  const eventMap = useMemo(() => new Map(events.map((e) => [e.slug, e])), [events]);

  // Unique sports
  const sports = useMemo(() => {
    const map = new Map<string, string>();
    events.forEach((e) => {
      map.set(e.sport[locale], e.slug);
    });
    return Array.from(map.entries());
  }, [events, locale]);

  // Filtered media calculation
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return media.filter((m) => {
      // 1. Type
      if (typeFilter !== "all" && m.type !== typeFilter) return false;

      // 2. Sport / Event
      if (sportFilter !== "all") {
        const ev = eventMap.get(m.event);
        if (!ev || ev.sport[locale].toLowerCase() !== sportFilter.toLowerCase()) {
          return false;
        }
      }

      // 3. Orientation
      if (orientationFilter === "landscape" && m.w < m.h) return false;
      if (orientationFilter === "portrait" && m.w >= m.h) return false;

      // 4. Search Query
      if (q) {
        const ev = eventMap.get(m.event);
        const frameStr = String(m.seq).padStart(4, "0");
        const matchId = m.id.toLowerCase().includes(q);
        const matchSeq = frameStr.includes(q);
        const matchEventTitle = ev?.title.toLowerCase().includes(q);
        const matchSport = ev?.sport[locale].toLowerCase().includes(q);
        const matchCity = ev?.city.toLowerCase().includes(q);

        if (!matchId && !matchSeq && !matchEventTitle && !matchSport && !matchCity) {
          return false;
        }
      }

      return true;
    });
  }, [media, typeFilter, sportFilter, orientationFilter, searchQuery, eventMap, locale]);

  const hasActiveFilters = typeFilter !== "all" || sportFilter !== "all" || orientationFilter !== "all" || searchQuery.trim() !== "";

  const resetFilters = () => {
    setTypeFilter("all");
    setSportFilter("all");
    setOrientationFilter("all");
    setSearchQuery("");
  };

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
    <div className="space-y-8">
      {/* How it works 3-step banner */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            title: t.store.steps.step1Title,
            desc: t.store.steps.step1Desc,
            badge: "01",
          },
          {
            title: t.store.steps.step2Title,
            desc: t.store.steps.step2Desc,
            badge: "02",
          },
          {
            title: t.store.steps.step3Title,
            desc: t.store.steps.step3Desc,
            badge: "03",
          },
        ].map((s) => (
          <div key={s.badge} className="rounded-panel border border-line bg-ink-2/60 p-4 backdrop-blur-sm">
            <span className="font-mono text-xs font-bold text-glow">{s.badge}</span>
            <h3 className="mt-1 font-[650] text-paper">{s.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-paper-2">{s.desc}</p>
          </div>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="panel space-y-5 p-5 md:p-6">
        {/* Search input + Type Selector */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Search box */}
          <div className="relative flex-1">
            <MagnifyingGlassIcon size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-paper-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.store.searchPlaceholder}
              className="field h-12 w-full pl-10 pr-9 text-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label={t.search.clear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-paper-3 hover:text-paper"
              >
                <XIcon size={16} />
              </button>
            )}
          </div>

          {/* Type tabs (All / Photos / Clips) */}
          <div className="flex shrink-0 items-center gap-1 rounded-panel border border-line bg-ink-2 p-1">
            {(["all", "photo", "clip"] as const).map((tp) => {
              const active = typeFilter === tp;
              const label = tp === "all" ? t.store.types.all : tp === "photo" ? t.store.types.photos : t.store.types.clips;
              return (
                <button
                  key={tp}
                  type="button"
                  onClick={() => setTypeFilter(tp)}
                  aria-pressed={active}
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
        </div>

        {/* Filters Row: Sports & Orientation */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line/60 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="t-hud text-xs text-paper-3">{t.store.filterSport}:</span>
            <button
              type="button"
              onClick={() => setSportFilter("all")}
              className={cn("chip text-xs", sportFilter === "all" && "border-glow bg-glow/15 text-paper")}
            >
              {t.store.allSports}
            </button>
            {sports.map(([sportName]) => (
              <button
                key={sportName}
                type="button"
                onClick={() => setSportFilter(sportName)}
                className={cn("chip text-xs", sportFilter === sportName && "border-glow bg-glow/15 text-paper")}
              >
                {sportName}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="t-hud text-xs text-paper-3">{t.store.filterOrientation}:</span>
            {(["all", "landscape", "portrait"] as const).map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => setOrientationFilter(o)}
                className={cn(
                  "chip text-xs",
                  orientationFilter === o && "border-glow bg-glow/15 text-paper",
                )}
              >
                {t.store.orientations[o]}
              </button>
            ))}
          </div>
        </div>

        {/* Counter & Reset row */}
        <div className="flex items-center justify-between border-t border-line/60 pt-3 text-xs">
          <p className="text-paper-3" aria-live="polite">
            {filtered.length === 1
              ? t.store.resultsCountOne
              : fill(t.store.resultsCount, { n: filtered.length })}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-glow underline-offset-4 hover:underline"
            >
              {t.store.resetFilters}
            </button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {filtered.length === 0 ? (
        <div className="panel flex flex-col items-center justify-center p-12 text-center">
          <p className="t-h3">{t.store.noResults}</p>
          <p className="mt-2 max-w-[42ch] text-sm text-paper-2">{t.store.noResultsHint}</p>
          <button type="button" onClick={resetFilters} className="btn btn-paper mt-6">
            {t.store.resetFilters}
          </button>
        </div>
      ) : (
        /* Media Grid */
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
          {filtered.map((m) => {
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
                {/* Visual Preview */}
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

                  {/* Watermark overlay indication */}
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

                  {/* Quick Cart Plus Button */}
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

                {/* Card Meta & Actions */}
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

                  {/* Pay & Download Action */}
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
      )}

      {/* Quick Buy Checkout Modal */}
      <QuickBuyModal
        media={quickBuyMedia}
        onClose={() => setQuickBuyMedia(null)}
      />
    </div>
  );
}
