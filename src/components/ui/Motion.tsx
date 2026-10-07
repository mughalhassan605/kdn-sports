"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { cn } from "@/lib/cn";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Rises into place once, when it enters the viewport. */
export function Reveal({
  children,
  delay = 0,
  y = 26,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "li" | "section" | "article";
}) {
  const reduce = useReducedMotion();
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.8, delay, ease: EASE }}
    >
      {children}
    </Tag>
  );
}

/**
 * Headline lines that "zoom in": each line rises out of a mask while its
 * width axis opens from condensed to the set width, like a lens being turned.
 */
export function ZoomLines({ lines, className, delay = 0 }: { lines: string[]; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <span className={cn("block", className)}>
      {lines.map((line, i) => (
        <span key={line} className="block overflow-hidden pb-[0.08em] pt-[0.04em]">
          <motion.span
            className="block origin-left whitespace-nowrap max-md:whitespace-normal"
            initial={reduce ? false : { y: "105%", fontStretch: "62%", opacity: 0.4 }}
            animate={{ y: 0, fontStretch: "var(--zoom-to, 125%)", opacity: 1 }}
            transition={{ duration: 1.15, delay: delay + i * 0.12, ease: EASE }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/** The footer wordmark: its width follows the scroll until it fills the measure. */
export function ZoomWord({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const stretch = useTransform(scrollYProgress, [0, 1], ["62%", "125%"]);
  // Reduced motion is settled in CSS: a JS branch here would render differently on server and client.
  return (
    <motion.div ref={ref} aria-hidden style={{ fontStretch: stretch }} className={cn("motion-reduce:![font-stretch:125%]", className)}>
      {text}
    </motion.div>
  );
}

/** Drifts its child against the scroll for depth. `shift` is the total travel in percent of its own height. */
export function Parallax({ children, shift = 10, className }: { children: React.ReactNode; shift?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [`${-shift}%`, `${shift}%`]);
  return (
    <div ref={ref} className={cn("overflow-hidden", className)}>
      <motion.div style={{ y: reduce ? 0 : y }} className="size-full scale-[1.22] will-change-transform">
        {children}
      </motion.div>
    </div>
  );
}
