import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr";
import { Shot, Viewfinder } from "@/components/media/Shot";
import { HoverLight } from "@/components/ui/HoverLight";
import { eventCounts, type EventInfo } from "@/data/events";
import { mustMedia } from "@/data/media";
import { LLink } from "@/i18n/client";
import type { Locale } from "@/i18n/config";
import type { Dict } from "@/i18n/dict/de";
import { cn } from "@/lib/cn";
import { dateParts } from "@/lib/format";

/** An event as a poster: the cover fills the card, the date runs condensed in the corner, the title expanded below. */
export function EventCard({
  ev,
  t,
  locale,
  size = "md",
  sizes,
  className,
  priority,
}: {
  ev: EventInfo;
  t: Dict;
  locale: Locale;
  size?: "md" | "lg";
  sizes?: string;
  className?: string;
  priority?: boolean;
}) {
  const cover = mustMedia(ev.cover);
  const d = dateParts(ev.date, locale);
  const c = eventCounts(ev.slug);
  const lg = size === "lg";

  return (
    <HoverLight palette={cover.palette} className={cn("h-full", className)}>
      <LLink
        href={`/events/${ev.slug}`}
        data-cursor={t.cursor.open}
        className="vf-host group relative flex h-full min-h-[inherit] flex-col justify-between overflow-hidden rounded-media bg-ink-2"
      >
        <Shot
          m={cover}
          variant="clean"
          sizes={sizes ?? (lg ? "(min-width: 64rem) 55vw, 94vw" : "(min-width: 64rem) 33vw, 94vw")}
          priority={priority}
          alt=""
          className="absolute inset-0 transition-transform duration-[1.4s] ease-out-expo group-hover:scale-[1.05]"
        />
        <span className="absolute inset-0 bg-gradient-to-t from-ink-0 via-ink-0/35 to-ink-0/30" aria-hidden />
        <Viewfinder />

        <span className={cn("relative z-[3] flex items-start justify-between gap-4", lg ? "p-5 md:p-7" : "p-4 md:p-5")}>
          <span className="t-hud pt-1 text-paper">
            {ev.sport[locale]} / {ev.city}
          </span>
          <span className="flex items-start gap-2">
            <span className={cn("t-num", lg ? "text-[4rem] md:text-[5.25rem]" : "text-[3.25rem]")}>{d.day}</span>
            <span className="t-hud pt-1 leading-[1.4] text-paper">
              {d.month}
              <br />
              {d.year}
            </span>
          </span>
        </span>

        <span className={cn("relative z-[3] block", lg ? "p-5 md:p-7" : "p-4 md:p-5")}>
          <span className={cn("block text-paper", lg ? "t-h2" : "t-h3 uppercase")}>{ev.title}</span>
          {lg && <span className="mt-3 hidden max-w-[46ch] text-paper-2 md:block">{ev.blurb[locale]}</span>}
          <span className="mt-4 flex items-end justify-between gap-4">
            <span className="t-hud flex flex-wrap gap-x-4 gap-y-1 text-paper-2">
              <span>
                {c.photos} {t.events.photos}
              </span>
              {c.clips > 0 && (
                <span>
                  {c.clips} {t.events.clips}
                </span>
              )}
            </span>
            <span
              className={cn(
                "grid shrink-0 place-items-center rounded-full bg-paper text-ink-0 transition-[background-color,transform] duration-500 ease-out-expo group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:bg-glow",
                lg ? "size-12" : "size-10",
              )}
              aria-hidden
            >
              <ArrowUpRightIcon size={lg ? 20 : 17} weight="bold" />
            </span>
          </span>
        </span>
      </LLink>
    </HoverLight>
  );
}
