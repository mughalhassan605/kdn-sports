"use client";

import { useInView } from "motion/react";
import { useEffect, useRef } from "react";
import { ambient } from "@/lib/ambient";
import { cn } from "@/lib/cn";

export function AmbientLayer() {
  return (
    <>
      <div id="ambient" className="ambient" aria-hidden />
      <div className="ambient-shade" aria-hidden />
    </>
  );
}

/** While this block sits across the middle of the viewport, its palette lights the page. */
export function AmbientZone({
  palette,
  level = 0.3,
  as: Tag = "div",
  className,
  children,
  ...rest
}: {
  palette: string[];
  level?: number;
  as?: "div" | "section" | "header";
  className?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { margin: "-45% 0px -45% 0px" });
  const key = palette.join();

  useEffect(() => {
    if (inView) ambient.base(key.split(","), level);
  }, [inView, key, level]);

  return (
    <Tag ref={ref as React.RefObject<never>} className={cn(className)} {...rest}>
      {children}
    </Tag>
  );
}

/** Sets the base light once, for pages that are a single scene (detail, checkout). */
export function AmbientSet({ palette, level = 0.3 }: { palette: string[]; level?: number }) {
  const key = palette.join();
  useEffect(() => {
    ambient.base(key.split(","), level);
  }, [key, level]);
  return null;
}
