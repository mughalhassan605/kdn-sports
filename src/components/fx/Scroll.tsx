"use client";

import { useRef } from "react";
import { cn } from "@/lib/cn";
import { gsap, prefersReducedMotion, ScrollTrigger, useGSAP } from "@/lib/gsap";

/** Moves against the scroll for depth. `amount` is the total travel in percent of the element's height. */
export function Drift({ children, amount = 18, className }: { children: React.ReactNode; amount?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (!ref.current || prefersReducedMotion()) return;
      gsap.fromTo(
        ref.current,
        { yPercent: amount / 2 },
        { yPercent: -amount / 2, ease: "none", scrollTrigger: { trigger: ref.current, start: "top bottom", end: "bottom top", scrub: true } },
      );
    },
    { scope: ref },
  );
  return (
    <div ref={ref} className={cn("will-change-transform", className)}>
      {children}
    </div>
  );
}

/** A picture inside a fixed window that travels slower than the page. The child should be the image. */
export function Window({ children, className, shift = 9 }: { children: React.ReactNode; className?: string; shift?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const inner = ref.current?.firstElementChild;
      if (!inner || prefersReducedMotion()) return;
      gsap.fromTo(
        inner,
        { yPercent: -shift },
        { yPercent: shift, ease: "none", scrollTrigger: { trigger: ref.current, start: "top bottom", end: "bottom top", scrub: true } },
      );
    },
    { scope: ref },
  );
  return (
    <div ref={ref} className={cn("overflow-hidden", className)}>
      <div className="size-full scale-[1.22] will-change-transform">{children}</div>
    </div>
  );
}

/** Grows from an inset card to its full box as it comes up the screen: the frame opening wide. */
export function Expand({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (!ref.current || prefersReducedMotion()) return;
      gsap.fromTo(
        ref.current,
        { clipPath: "inset(9% 11% 9% 11% round 28px)" },
        {
          clipPath: "inset(0% 0% 0% 0% round 4px)",
          ease: "none",
          scrollTrigger: { trigger: ref.current, start: "top 95%", end: "top 18%", scrub: 0.4 },
        },
      );
    },
    { scope: ref },
  );
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/**
 * A strip that never stops: it runs on its own, and scrolling pushes it,
 * faster and in the direction of travel, leaning into the speed.
 * The track must contain its content twice.
 */
export function VelocityMarquee({ children, className, speed = 0.6 }: { children: React.ReactNode; className?: string; speed?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const wrap = ref.current;
      const track = wrap?.firstElementChild as HTMLElement | null;
      if (!wrap || !track || prefersReducedMotion()) return;

      let x = 0;
      let push = 0;
      let dir = -1;
      let paused = false;
      const setX = gsap.quickSetter(track, "x", "px");
      const setSkew = gsap.quickSetter(track, "skewX", "deg");

      const st = ScrollTrigger.create({
        trigger: wrap,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          const v = self.getVelocity();
          push = gsap.utils.clamp(-60, 60, v / 55);
          if (Math.abs(v) > 40) dir = v > 0 ? -1 : 1;
        },
      });

      const tick = (_time: number, delta: number) => {
        if (!st.isActive) return;
        const half = track.scrollWidth / 2;
        push *= 0.9;
        // Scrolling down pushes the strip left, scrolling up pushes it right; hovering parks the idle drift.
        x += ((paused ? 0 : dir * speed) - push) * (delta / 16.67);
        if (x <= -half) x += half;
        if (x > 0) x -= half;
        setX(x);
        setSkew(gsap.utils.clamp(-7, 7, push * 0.16));
      };
      gsap.ticker.add(tick);

      const enter = () => (paused = true);
      const leave = () => (paused = false);
      wrap.addEventListener("pointerenter", enter);
      wrap.addEventListener("pointerleave", leave);

      return () => {
        gsap.ticker.remove(tick);
        wrap.removeEventListener("pointerenter", enter);
        wrap.removeEventListener("pointerleave", leave);
      };
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={cn("overflow-hidden", className)}>
      <div className="flex w-max will-change-transform">{children}</div>
    </div>
  );
}
