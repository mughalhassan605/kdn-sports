"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useFinePointer } from "@/lib/store";

/**
 * A small follower, not a replacement: the system cursor stays. It grows to a
 * ring over links and to a labelled disc over anything with [data-cursor].
 * Kept deliberately small (10 / 28 / 62 px).
 */
export function Cursor() {
  const fine = useFinePointer();
  const el = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = el.current;
    if (!fine || !node) return;
    const x = gsap.quickTo(node, "x", { duration: 0.45, ease: "power3" });
    const y = gsap.quickTo(node, "y", { duration: 0.45, ease: "power3" });

    const move = (e: PointerEvent) => {
      x(e.clientX);
      y(e.clientY);
      node.dataset.on = "1";
    };
    const over = (e: PointerEvent) => {
      const target = e.target as Element | null;
      const tagged = target?.closest<HTMLElement>("[data-cursor]");
      if (tagged) {
        node.dataset.mode = "label";
        if (label.current) label.current.textContent = tagged.dataset.cursor ?? "";
      } else if (target?.closest("a, button, [role='button'], input, label, summary")) {
        node.dataset.mode = "link";
      } else {
        node.dataset.mode = "";
      }
    };
    const leave = () => {
      node.dataset.on = "";
    };

    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerover", over, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerover", over);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, [fine]);

  if (!fine) return null;
  return (
    <div ref={el} className="cursor" aria-hidden>
      <span ref={label} />
    </div>
  );
}

/** Marks the document once React is running, so the reveal fail-safe in the boot script stands down. */
export function AppMounted() {
  useEffect(() => {
    document.documentElement.dataset.app = "1";
  }, []);
  return null;
}
