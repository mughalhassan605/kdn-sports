"use client";
/* eslint-disable @next/next/no-img-element -- pre-sized derivatives, see Shot.tsx */

import { ArrowsHorizontalIcon } from "@phosphor-icons/react/dist/ssr";
import { animate, motion, useMotionTemplate, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

type Props = {
  /** Watermarked, low resolution. */
  lo: string;
  /** Clean original (a marketing pick). */
  hi: string;
  hiSet?: string;
  sizes?: string;
  alt: string;
  label: string;
  /** Short tags inside the top corners: what each side is. */
  leftTag?: string;
  rightTag?: string;
  /** object-position shared by both layers so they register exactly. */
  focal?: string;
  rest?: number;
  className?: string;
};

/**
 * The product in one gesture: left of the handle is what everyone sees for
 * free, right of it is what a buyer downloads. A full-size range input sits on
 * top, so dragging, tapping and arrow keys all work natively.
 */
export function CompareSplit({ lo, hi, hiSet, sizes, alt, label, leftTag, rightTag, focal = "50% 50%", rest = 54, className }: Props) {
  const pos = useMotionValue(100);
  const right = useTransform(pos, (v) => 100 - v);
  const clip = useMotionTemplate`inset(0 ${right}% 0 0)`;
  const left = useMotionTemplate`${pos}%`;
  const input = useRef<HTMLInputElement>(null);
  const intro = useRef<ReturnType<typeof animate> | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) {
      pos.set(rest);
      return;
    }
    intro.current = animate(pos, [100, 30, rest], {
      duration: 2.4,
      times: [0, 0.6, 1],
      ease: [0.76, 0, 0.24, 1],
      delay: 1.1,
      onComplete: () => {
        if (input.current) input.current.value = String(rest);
      },
    });
    return () => intro.current?.stop();
  }, [pos, reduce, rest]);

  return (
    <div className={cn("relative select-none overflow-hidden rounded-media bg-ink-2", className)}>
      <img
        src={hi}
        srcSet={hiSet}
        sizes={sizes}
        alt={alt}
        fetchPriority="high"
        decoding="async"
        draggable={false}
        className="absolute inset-0 size-full object-cover"
        style={{ objectPosition: focal }}
      />
      <motion.div className="absolute inset-0" style={{ clipPath: clip }} aria-hidden>
        <img src={lo} alt="" decoding="async" draggable={false} className="size-full object-cover" style={{ objectPosition: focal }} />
      </motion.div>

      {leftTag && (
        <span className="t-hud pointer-events-none absolute left-3 top-3 z-[3] rounded-full bg-ink-0/70 px-2.5 py-1.5 text-paper backdrop-blur-sm sm:left-4 sm:top-4">
          {leftTag}
        </span>
      )}
      {rightTag && (
        <span className="t-hud pointer-events-none absolute right-3 top-3 z-[3] rounded-full bg-ink-0/70 px-2.5 py-1.5 text-glow backdrop-blur-sm sm:right-4 sm:top-4">
          {rightTag}
        </span>
      )}

      <motion.div className="pointer-events-none absolute inset-y-0 z-[3] w-px bg-paper" style={{ left }} aria-hidden>
        <span className="absolute left-1/2 top-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-paper text-ink-0 shadow-[0_0_0_6px_rgb(8_8_10/0.35)]">
          <ArrowsHorizontalIcon size={20} weight="bold" />
        </span>
      </motion.div>

      <input
        ref={input}
        type="range"
        min={2}
        max={98}
        step={0.1}
        defaultValue={rest}
        aria-label={label}
        className="sr-range z-[4] touch-pan-y"
        onPointerDown={() => intro.current?.stop()}
        onInput={(e) => {
          intro.current?.stop();
          pos.set(Number(e.currentTarget.value));
        }}
      />
    </div>
  );
}
