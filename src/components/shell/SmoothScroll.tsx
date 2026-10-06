"use client";

import { ReactLenis, useLenis } from "lenis/react";
import { useEffect } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { usePrefersReducedMotion } from "@/lib/store";

// Lenis smooths the wheel only; touch scrolling stays native and nothing is
// ever blocked or snapped. GSAP's ticker drives Lenis so scrubbed timelines
// and the smoothed scroll position share one clock.
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const reduced = usePrefersReducedMotion();
  return (
    <ReactLenis root options={{ lerp: 0.1, smoothWheel: !reduced, anchors: true, autoRaf: false }}>
      <Bridge />
      {children}
    </ReactLenis>
  );
}

function Bridge() {
  const lenis = useLenis();
  useEffect(() => {
    if (!lenis) return;
    const tick = (time: number) => lenis.raf(time * 1000);
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      lenis.off("scroll", ScrollTrigger.update);
      gsap.ticker.remove(tick);
    };
  }, [lenis]);
  return null;
}

/** Freezes page scroll while an overlay (drawer, menu, loader) is open. */
export function useScrollLock(active: boolean) {
  const lenis = useLenis();
  useEffect(() => {
    if (!active || !lenis) return;
    lenis.stop();
    return () => lenis.start();
  }, [active, lenis]);
}

/** Scroll the page to a Y position, through Lenis when it is driving. */
export function useScrollTo() {
  const lenis = useLenis();
  return (top: number, immediate = false) => {
    if (lenis) lenis.scrollTo(top, { immediate, duration: 0.9 });
    else window.scrollTo({ top, behavior: immediate ? "instant" : "smooth" });
  };
}
