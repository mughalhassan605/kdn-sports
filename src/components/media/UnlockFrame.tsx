"use client";
/* eslint-disable @next/next/no-img-element -- pre-sized derivatives, see Shot.tsx */

import { animate, motion, useMotionTemplate, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

type Props = {
  /** Watermarked preview (public). */
  preview: string;
  /** Clean file: a marketing pick on the home page, the download route on an order. */
  clean: string;
  alt: string;
  unlocked: boolean;
  onDone?: () => void;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
  imgClassName?: string;
};

/**
 * The moment of purchase: a line of light crosses the frame and the watermark
 * is gone behind it, the way a print comes up in the developer tray.
 */
export function UnlockFrame({ preview, clean, alt, unlocked, onDone, delay = 0, className, style, imgClassName }: Props) {
  const p = useMotionValue(0);
  const pct = useTransform(p, (v) => v * 100);
  const clip = useMotionTemplate`inset(0 0 0 ${pct}%)`;
  const left = useMotionTemplate`${pct}%`;
  const lineOpacity = useTransform(p, [0, 0.03, 0.97, 1], [0, 1, 1, 0]);
  const reduce = useReducedMotion();
  const done = useRef(onDone);

  useEffect(() => {
    done.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (!unlocked) {
      p.set(0);
      return;
    }
    const controls = animate(p, 1, {
      duration: reduce ? 0 : 1.7,
      delay: reduce ? 0 : delay,
      ease: [0.76, 0, 0.24, 1],
      onComplete: () => done.current?.(),
    });
    return () => controls.stop();
  }, [unlocked, p, reduce, delay]);

  return (
    <div className={cn("relative overflow-hidden rounded-media bg-ink-2", className)} style={style}>
      <img src={clean} alt={alt} decoding="async" draggable={false} className={cn("size-full object-cover", imgClassName)} />
      <motion.img
        src={preview}
        alt=""
        aria-hidden
        decoding="async"
        draggable={false}
        style={{ clipPath: clip }}
        className={cn("absolute inset-0 size-full object-cover", imgClassName)}
      />
      <motion.span
        aria-hidden
        style={{ left, opacity: lineOpacity }}
        className="pointer-events-none absolute inset-y-0 z-[2] w-[2px] -translate-x-px bg-glow shadow-[0_0_28px_6px_rgb(212_255_63/0.55)]"
      >
        <span className="absolute inset-y-0 right-0 w-28 bg-gradient-to-l from-glow/25 to-transparent" />
      </motion.span>
    </div>
  );
}
