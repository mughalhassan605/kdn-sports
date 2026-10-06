"use client";

import { ArrowRightIcon, ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import { ClipPlayer } from "@/components/media/ClipPlayer";
import { Shot } from "@/components/media/Shot";
import { AmbientZone } from "@/components/shell/Ambient";
import { RevealBlock, RevealFrame, RevealText } from "@/components/fx/Reveal";
import { getEvent } from "@/data/events";
import { clips, detailPath, frameNo } from "@/data/media";
import { PRICES } from "@/data/pricing";
import { LLink, useI18n } from "@/i18n/client";
import { spillVars } from "@/lib/ambient";
import { cn } from "@/lib/cn";
import { duration, money } from "@/lib/format";

// Landscape clips first: they fill the stage.
const LIST = [...clips].sort((a, b) => Number(b.w > b.h) - Number(a.w > a.h) || (b.duration ?? 0) - (a.duration ?? 0));

/** One stage, one playlist. Picking a clip swaps the stage and relights the page. */
export function ClipsShowcase() {
  const { t, locale } = useI18n();
  const [id, setId] = useState(LIST[0].id);
  const m = LIST.find((c) => c.id === id) ?? LIST[0];
  const ev = getEvent(m.event);

  return (
    <AmbientZone as="section" palette={m.palette} className="sec overflow-x-clip">
      <div className="wrap">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <RevealText as="h2" by="chars" className="t-h2">
              {t.clips.title}
            </RevealText>
            <RevealText as="p" by="lines" delay={0.15} className="t-lede mt-4 max-w-[46ch]">
              {t.clips.sub}
            </RevealText>
          </div>
          <LLink href="/clips" className="btn btn-sm btn-line">
            {t.clips.all}
            <ArrowRightIcon size={15} weight="bold" />
          </LLink>
        </div>

        <div className="mt-8 grid gap-6 md:mt-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-8">
            <div className="spill" style={{ ...spillVars(m.palette), "--spill": 0.34 } as React.CSSProperties}>
              <RevealFrame className="rounded-media">
                <ClipPlayer m={m} className="aspect-video w-full" />
              </RevealFrame>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
              <p className="t-h3">
                {ev?.title}
                <span className="t-hud ml-3 text-paper-3">
                  {ev?.sport[locale]} / {ev?.city}
                </span>
              </p>
              <LLink href={detailPath(m)} className="btn btn-sm btn-paper">
                {t.clips.view}
                <ArrowUpRightIcon size={15} weight="bold" />
              </LLink>
            </div>
          </div>

          <RevealBlock as="ul" className="lg:col-span-4">
            {LIST.map((c) => {
              const e = getEvent(c.event);
              const on = c.id === id;
              return (
                <li key={c.id} data-rv-item className="border-t border-line last:border-b">
                  <button
                    type="button"
                    data-cursor={t.cursor.play}
                    onClick={() => setId(c.id)}
                    aria-pressed={on}
                    className={cn(
                      "group relative flex w-full items-center gap-4 py-3.5 text-left transition-colors duration-300",
                      on ? "text-paper" : "text-paper-2 hover:text-paper",
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn("absolute -top-px left-0 h-px bg-glow transition-[width] duration-700 ease-out-expo", on ? "w-full" : "w-0")}
                    />
                    <span className="relative block aspect-video w-[104px] shrink-0 overflow-hidden rounded-media bg-ink-2">
                      <Shot m={c} sizes="104px" className={cn("transition-[opacity,transform] duration-500", on ? "opacity-100" : "opacity-70 group-hover:opacity-100")} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-[640]">{e?.title}</span>
                      <span className="t-hud mt-1.5 block text-paper-3">
                        {t.gallery.clip} {frameNo(c)} / {duration(c.duration ?? 0)}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm tabular-nums">{money(PRICES.personal.hd, locale)}</span>
                  </button>
                </li>
              );
            })}
          </RevealBlock>
        </div>
      </div>
    </AmbientZone>
  );
}
