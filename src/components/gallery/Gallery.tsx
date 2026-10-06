"use client";

import { ArrowRightIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import type { Media } from "@/data/media";
import { defaultFormat } from "@/data/pricing";
import { useI18n } from "@/i18n/client";
import { fill } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { minutesOfDay } from "@/lib/format";
import { cart, ui } from "@/lib/store";
import { MediaTile } from "./MediaTile";
import { Timeline } from "./Timeline";

type Filter = "all" | "photo" | "clip";
type Size = "s" | "m" | "l";

/** The working surface of an event: filter, pick a tile size, multi-select, and a time ruler to find your slot. */
export function Gallery({ items }: { items: Media[] }) {
  const { t } = useI18n();
  const grid = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [size, setSize] = useState<Size>("m");
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const shown = items.filter((m) => filter === "all" || m.type === filter);
  const hasClips = items.some((m) => m.type === "clip");

  const toggle = (id: string) => setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const stopSelecting = () => {
    setSelecting(false);
    setSelected([]);
  };
  const addSelected = () => {
    cart.addMany(
      selected.map((id) => {
        const m = items.find((x) => x.id === id)!;
        return { id, license: "personal" as const, format: defaultFormat(m.type) };
      }),
    );
    stopSelecting();
    ui.openCart();
  };

  const filters: [Filter, string][] = [
    ["all", t.gallery.all],
    ["photo", t.gallery.photos],
    ...(hasClips ? ([["clip", t.gallery.clips]] as [Filter, string][]) : []),
  ];

  return (
    <section className="relative pb-28">
      <div className="sticky top-16 z-30 border-y border-line bg-ink-0/85 backdrop-blur-xl">
        <div className="wrap flex h-14 items-center justify-between gap-3">
          <div className="flex items-center gap-1.5" role="group" aria-label={t.gallery.all}>
            {filters.map(([f, label]) => (
              <button key={f} type="button" className="chip" aria-pressed={filter === f} onClick={() => setFilter(f)}>
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-1 sm:flex" role="group" aria-label={t.gallery.density}>
              {(["s", "m", "l"] as const).map((s) => (
                <button key={s} type="button" className="chip !px-0 w-8 justify-center" aria-pressed={size === s} aria-label={`${t.gallery.density} ${s.toUpperCase()}`} onClick={() => setSize(s)}>
                  {s}
                </button>
              ))}
            </div>
            <button type="button" className="chip" aria-pressed={selecting} onClick={() => (selecting ? stopSelecting() : setSelecting(true))}>
              {selecting ? t.gallery.done : t.gallery.select}
            </button>
          </div>
        </div>
      </div>

      <div className="wrap mt-3">
        <p className="mb-3 text-sm text-paper-3">{t.gallery.bundleHint}</p>
        <div ref={grid} className="jgrid" data-size={size}>
          {shown.map((m, i) => (
            <MediaTile
              key={m.id}
              m={m}
              priority={i < 6}
              sizes="(min-width: 64rem) 30vw, 50vw"
              selecting={selecting}
              selected={selected.includes(m.id)}
              onToggle={toggle}
            />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selecting && selected.length > 0 ? (
          <motion.div
            key="bar"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-0 bottom-4 z-[35] flex justify-center px-4"
          >
            <div className="panel flex h-14 items-center gap-3 rounded-full pl-5 pr-2">
              <span className="text-[0.9375rem] font-[620] text-paper">{fill(t.gallery.selected, { n: selected.length })}</span>
              <button type="button" onClick={addSelected} className="btn btn-sm btn-glow">
                {t.gallery.addSelected}
                <ArrowRightIcon size={15} weight="bold" />
              </button>
              <button type="button" onClick={() => setSelected([])} aria-label={t.gallery.clear} className="grid size-10 place-items-center rounded-full text-paper-2 transition-colors hover:bg-white/10 hover:text-paper">
                <XIcon size={16} weight="bold" />
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {shown.length > 3 && !(selecting && selected.length > 0) && (
        <Timeline grid={grid} marks={shown.map((m) => ({ id: m.id, min: minutesOfDay(m.takenAt), clip: m.type === "clip" }))} />
      )}
      <span className={cn("sr-only")} aria-live="polite">
        {fill(t.gallery.selected, { n: selected.length })}
      </span>
    </section>
  );
}
