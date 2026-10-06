"use client";

import { CheckIcon, PlayIcon, PlusIcon } from "@phosphor-icons/react/dist/ssr";
import { useState, ViewTransition } from "react";
import { Shot, Viewfinder } from "@/components/media/Shot";
import { detailPath, frameNo, ratio, src, type Media } from "@/data/media";
import { defaultFormat } from "@/data/pricing";
import { LLink, useI18n } from "@/i18n/client";
import { fill } from "@/i18n/config";
import { ambient } from "@/lib/ambient";
import { cn } from "@/lib/cn";
import { duration, minutesOfDay } from "@/lib/format";
import { cart, ui, useCart, useFinePointer } from "@/lib/store";

type Props = {
  m: Media;
  sizes?: string;
  /** Select mode: a click toggles the tile instead of opening it. */
  selecting?: boolean;
  selected?: boolean;
  onToggle?: (id: string) => void;
  priority?: boolean;
};

/**
 * One frame in a gallery. Hovering lights the page with its colours; clips
 * start playing their watermarked preview. The plus adds it to the cart
 * without leaving the grid.
 */
export function MediaTile({ m, sizes, selecting, selected, onToggle, priority }: Props) {
  const { t } = useI18n();
  const { has } = useCart();
  const fine = useFinePointer();
  const [hover, setHover] = useState(false);
  const inCart = has(m.id);
  const kind = m.type === "clip" ? t.gallery.clip : t.gallery.photo;

  const toggleCart = () => {
    if (inCart) cart.remove(m.id);
    else {
      cart.add({ id: m.id, license: "personal", format: defaultFormat(m.type) });
      ui.toast(t.cart.added);
    }
  };

  return (
    <div
      data-tile={m.id}
      data-min={minutesOfDay(m.takenAt)}
      className="vf-host group/tile relative overflow-hidden rounded-media bg-ink-2"
      style={{ "--ar": ratio(m), backgroundColor: m.avg } as React.CSSProperties}
      onPointerEnter={() => {
        ambient.hover(m.palette);
        setHover(true);
      }}
      onPointerLeave={() => {
        ambient.leave();
        setHover(false);
      }}
    >
      <LLink
        href={detailPath(m)}
        transitionTypes={["open"]}
        aria-label={fill(t.gallery.openItem, { kind, n: frameNo(m) })}
        data-cursor={selecting ? undefined : m.type === "clip" ? t.cursor.play : t.cursor.view}
        className="block size-full"
        onClick={
          selecting
            ? (e) => {
                e.preventDefault();
                onToggle?.(m.id);
              }
            : undefined
        }
      >
        <ViewTransition name={`m-${m.id}`} share="morph" default="none">
          <Shot m={m} sizes={sizes} priority={priority} className="transition-transform duration-700 ease-out-expo group-hover/tile:scale-[1.04]" />
        </ViewTransition>
        {m.type === "clip" && hover && fine && (
          <video src={src.video(m.id)} muted loop playsInline autoPlay className="absolute inset-0 size-full object-cover" />
        )}
      </LLink>

      <Viewfinder on={selected} tone={selected ? "glow" : undefined} />

      {m.type === "clip" && (
        <span className="t-hud pointer-events-none absolute left-2.5 top-2.5 z-[3] flex items-center gap-1.5 rounded-full bg-ink-0/70 px-2 py-1 text-paper backdrop-blur-sm">
          <PlayIcon size={10} weight="fill" />
          {duration(m.duration ?? 0)}
        </span>
      )}

      {selecting ? (
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute right-2.5 top-2.5 z-[3] grid size-7 place-items-center rounded-full border transition-colors duration-200",
            selected ? "border-glow bg-glow text-glow-ink" : "border-paper/70 bg-ink-0/40 text-transparent",
          )}
        >
          <CheckIcon size={14} weight="bold" />
        </span>
      ) : (
        <button
          type="button"
          onClick={toggleCart}
          aria-pressed={inCart}
          aria-label={`${inCart ? t.detail.remove : t.gallery.add}: ${kind} ${frameNo(m)}`}
          className={cn(
            "absolute bottom-2.5 right-2.5 z-[3] grid size-9 place-items-center rounded-full transition-[opacity,background-color,color,transform] duration-300 focus-visible:opacity-100 active:scale-95 group-hover/tile:opacity-100 [@media(hover:none)]:opacity-100",
            inCart ? "bg-glow text-glow-ink opacity-100" : "bg-paper text-ink-0 opacity-0 hover:bg-glow",
          )}
        >
          {inCart ? <CheckIcon size={16} weight="bold" /> : <PlusIcon size={16} weight="bold" />}
        </button>
      )}
    </div>
  );
}
