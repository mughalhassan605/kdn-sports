"use client";

import { useEffect, useRef, useState } from "react";
import { useScrollTo } from "@/components/shell/SmoothScroll";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/cn";
import { ScrollTrigger } from "@/lib/gsap";

type Mark = { id: string; min: number; clip: boolean };

const hhmm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(Math.floor(min % 60)).padStart(2, "0")}`;

/**
 * Photos are sorted by capture time, and people know when they were on the
 * floor. So the gallery gets what a video editor has: a time ruler. One tick
 * per frame; the playhead follows the scroll; a click or drag jumps there.
 */
export function Timeline({ marks, grid }: { marks: Mark[]; grid: React.RefObject<HTMLDivElement | null> }) {
  const { t } = useI18n();
  const scrollTo = useScrollTo();
  const track = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLSpanElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(false);

  const start = Math.min(...marks.map((m) => m.min));
  const end = Math.max(...marks.map((m) => m.min));
  const span = Math.max(1, end - start);
  const pct = (min: number) => ((min - start) / span) * 100;
  const key = marks.map((m) => m.id).join();

  useEffect(() => {
    const el = grid.current;
    if (!el) return;
    let tops: { top: number; min: number }[] = [];

    const measure = () => {
      tops = [...el.querySelectorAll<HTMLElement>("[data-tile]")]
        .map((tile) => ({ top: tile.getBoundingClientRect().top + window.scrollY, min: Number(tile.dataset.min) }))
        .sort((a, b) => a.top - b.top);
    };
    const update = () => {
      if (!tops.length) return;
      const line = window.scrollY + window.innerHeight * 0.5;
      let current = tops[0];
      for (const item of tops) {
        if (item.top > line) break;
        current = item;
      }
      if (head.current) head.current.style.left = `${pct(current.min)}%`;
      if (label.current) label.current.textContent = hhmm(current.min);
    };

    measure();
    update();
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top 70%",
      end: "bottom 60%",
      onToggle: (self) => setShown(self.isActive),
      onUpdate: update,
      onRefresh: () => {
        measure();
        update();
      },
    });
    return () => st.kill();
    // pct depends only on the marks, which `key` stands for
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid, key]);

  const jump = (clientX: number, immediate: boolean) => {
    const el = grid.current;
    const bar = track.current;
    if (!el || !bar) return;
    const r = bar.getBoundingClientRect();
    const target = start + Math.min(1, Math.max(0, (clientX - r.left) / r.width)) * span;
    let best: HTMLElement | null = null;
    let bestDiff = Infinity;
    el.querySelectorAll<HTMLElement>("[data-tile]").forEach((tile) => {
      const diff = Math.abs(Number(tile.dataset.min) - target);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = tile;
      }
    });
    if (best) scrollTo((best as HTMLElement).getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.35, immediate);
  };

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center px-4 transition-[opacity,transform] duration-500 ease-out-expo",
        shown ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
      )}
    >
      <div className={cn("panel flex h-12 w-full max-w-[680px] items-center gap-4 rounded-full px-5", shown && "pointer-events-auto")} role="group" aria-label={t.gallery.timeline}>
        <span ref={label} className="t-hud w-11 shrink-0 tabular-nums text-paper">
          {hhmm(start)}
        </span>
        <div
          ref={track}
          className="relative h-full flex-1 cursor-ew-resize touch-none"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            jump(e.clientX, false);
          }}
          onPointerMove={(e) => {
            if (e.buttons === 1) jump(e.clientX, true);
          }}
        >
          <span className="absolute inset-x-0 top-1/2 h-px bg-line-2" />
          {marks.map((m) => (
            <span
              key={m.id}
              className={cn("absolute top-1/2 w-px -translate-y-1/2", m.clip ? "h-4 bg-glow" : "h-2.5 bg-paper/55")}
              style={{ left: `${pct(m.min)}%` }}
            />
          ))}
          <span ref={head} className="absolute top-1/2 h-7 w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-paper transition-[left] duration-300 ease-out" style={{ left: "0%" }} />
        </div>
        <span className="t-hud w-11 shrink-0 text-right tabular-nums text-paper-3">{hhmm(end)}</span>
      </div>
    </div>
  );
}
