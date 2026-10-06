"use client";
/* eslint-disable @next/next/no-img-element -- pre-sized derivatives, see Shot.tsx */

import { PauseIcon, PlayIcon } from "@phosphor-icons/react/dist/ssr";
import { motion, useInView, useMotionValue, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { src, type Media } from "@/data/media";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/cn";
import { duration } from "@/lib/format";

/**
 * Plays the watermarked preview of a clip (854 px, max 14 s, no audio). Starts
 * on its own while it is on screen, pauses when it leaves. Portrait clips sit
 * on a blurred copy of their own poster so the stage never shows bare black.
 */
export function ClipPlayer({ m, autoplay = true, className }: { m: Media; autoplay?: boolean; className?: string }) {
  const { t } = useI18n();
  const wrap = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const clock = useRef<HTMLSpanElement>(null);
  const inView = useInView(wrap, { amount: 0.5 });
  const reduce = useReducedMotion();
  const [playing, setPlaying] = useState(false);
  const progress = useMotionValue(0);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (inView && autoplay && !reduce) v.play().catch(() => {});
    else v.pause();
  }, [inView, autoplay, reduce, m.id]);

  const toggle = () => {
    const v = video.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };

  const onTime = () => {
    const v = video.current;
    if (!v || !v.duration) return;
    progress.set(v.currentTime / v.duration);
    if (clock.current) clock.current.textContent = `${duration(v.currentTime)} / ${duration(v.duration)}`;
  };

  return (
    <div ref={wrap} className={cn("group/player relative overflow-hidden rounded-media bg-ink-1", className)}>
      <img src={src.thumb(m.id)} alt="" aria-hidden className="absolute inset-0 size-full scale-125 object-cover opacity-45 blur-2xl" />
      <video
        ref={video}
        key={m.id}
        src={src.video(m.id)}
        poster={src.thumb2(m.id)}
        muted
        loop
        playsInline
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={onTime}
        onClick={toggle}
        className="relative size-full cursor-pointer object-contain"
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] bg-gradient-to-t from-ink-0/85 to-transparent px-3 pb-3 pt-14 sm:px-4 sm:pb-4">
        <div className="pointer-events-auto flex items-center gap-3">
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? t.clips.pause : t.clips.play}
            className="grid size-10 shrink-0 place-items-center rounded-full bg-paper text-ink-0 transition-colors hover:bg-glow"
          >
            {playing ? <PauseIcon size={16} weight="fill" /> : <PlayIcon size={16} weight="fill" />}
          </button>
          <span ref={clock} className="t-hud w-[6.75rem] shrink-0 tabular-nums text-paper">
            00:00 / {duration(Math.min(m.duration ?? 0, 14))}
          </span>
          <div className="relative h-8 flex-1">
            <span className="absolute inset-x-0 top-1/2 h-px bg-white/30" />
            <motion.span className="absolute inset-x-0 top-1/2 -mt-px h-[3px] origin-left bg-paper" style={{ scaleX: progress }} />
            <input
              type="range"
              min={0}
              max={1000}
              defaultValue={0}
              aria-label={t.gallery.timeline}
              className="sr-range"
              onInput={(e) => {
                const v = video.current;
                if (v?.duration) v.currentTime = (Number(e.currentTarget.value) / 1000) * v.duration;
              }}
            />
          </div>
          <span className="t-hud shrink-0 text-paper-2">{Math.min(m.w, m.h)}p</span>
        </div>
      </div>
    </div>
  );
}
