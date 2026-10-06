"use client";

import { useRef } from "react";
import { cn } from "@/lib/cn";
import { gsap, prefersReducedMotion, SplitText, useGSAP } from "@/lib/gsap";

type TextTag = "h1" | "h2" | "h3" | "p" | "span" | "div";

/** The tag is chosen by a prop; every candidate is a plain element that takes these props. */
type Poly = React.ComponentType<{ ref: React.Ref<HTMLElement>; "data-rv": string; className?: string; children?: React.ReactNode }>;

/**
 * Text that rises out of a line mask when it scrolls into view.
 * `by` picks the grain: whole lines, words, or single characters.
 * Hidden via [data-rv] until the split is ready (see globals.css) so nothing
 * flashes before the animation owns it.
 */
export function RevealText({
  as: Tag = "h2",
  children,
  className,
  by = "words",
  delay = 0,
  start = "top 88%",
  stagger,
}: {
  as?: TextTag;
  children: string;
  className?: string;
  by?: "lines" | "words" | "chars";
  delay?: number;
  start?: string;
  stagger?: number;
}) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (prefersReducedMotion()) {
        gsap.set(el, { autoAlpha: 1 });
        return;
      }
      const split = SplitText.create(el, {
        type: by === "chars" ? "lines,words,chars" : "lines,words",
        mask: "lines",
        autoSplit: true,
        onSplit(self) {
          gsap.set(el, { autoAlpha: 1 });
          const targets = by === "chars" ? self.chars : by === "words" ? self.words : self.lines;
          return gsap.from(targets, {
            yPercent: 115,
            duration: by === "chars" ? 0.9 : 1.15,
            ease: "expo.out",
            stagger: stagger ?? (by === "chars" ? 0.022 : by === "words" ? 0.05 : 0.11),
            delay,
            scrollTrigger: { trigger: el, start, toggleActions: "play none none none" },
          });
        },
      });
      return () => split.revert();
    },
    { scope: ref, dependencies: [children, by] },
  );

  const Comp = Tag as unknown as Poly;
  return (
    <Comp ref={ref} data-rv="" className={className}>
      {children}
    </Comp>
  );
}

/** A block that fades and rises when it scrolls into view. Children with [data-rv-item] stagger. */
export function RevealBlock({
  children,
  className,
  delay = 0,
  y = 40,
  start = "top 88%",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  start?: string;
  as?: "div" | "li" | "section" | "ul" | "ol" | "dl" | "article";
}) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const items = el.querySelectorAll<HTMLElement>("[data-rv-item]");
      const targets = items.length ? items : el;
      gsap.set(el, { autoAlpha: 1 });
      if (prefersReducedMotion()) return;
      gsap.from(targets, {
        y,
        autoAlpha: 0,
        duration: 1.1,
        ease: "expo.out",
        stagger: 0.08,
        delay,
        scrollTrigger: { trigger: el, start, toggleActions: "play none none none" },
      });
    },
    { scope: ref },
  );

  const Comp = Tag as unknown as Poly;
  return (
    <Comp ref={ref} data-rv="" className={className}>
      {children}
    </Comp>
  );
}

/** An image frame that opens like a shutter slit while the picture inside settles from a slight zoom. */
export function RevealFrame({
  children,
  className,
  start = "top 85%",
  zoom = true,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  start?: string;
  /** Settle the child from a slight zoom. Turn off when the child carries text. */
  zoom?: boolean;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      gsap.set(el, { autoAlpha: 1 });
      if (prefersReducedMotion()) return;
      const inner = el.firstElementChild;
      const tl = gsap.timeline({ delay, scrollTrigger: { trigger: el, start, toggleActions: "play none none none" } });
      tl.fromTo(el, { clipPath: "inset(48% 0% 48% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.5, ease: "expo.inOut" });
      if (inner && zoom) tl.fromTo(inner, { scale: 1.25 }, { scale: 1, duration: 1.9, ease: "expo.out" }, 0.1);
    },
    { scope: ref, dependencies: [zoom, delay, start] },
  );

  return (
    <div ref={ref} data-rv className={cn("overflow-hidden", className)}>
      {children}
    </div>
  );
}

/**
 * A sentence that lights up word by word as it crosses the viewport:
 * the scroll position is the reading position.
 */
export function ScrubWords({ children, className }: { children: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;
      const split = SplitText.create(el, {
        type: "words",
        autoSplit: true,
        onSplit(self) {
          return gsap.fromTo(
            self.words,
            { opacity: 0.14 },
            { opacity: 1, ease: "none", stagger: 0.08, scrollTrigger: { trigger: el, start: "top 78%", end: "bottom 42%", scrub: true } },
          );
        },
      });
      return () => split.revert();
    },
    { scope: ref, dependencies: [children] },
  );

  return (
    <p ref={ref} className={className}>
      {children}
    </p>
  );
}
