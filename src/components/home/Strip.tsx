import { VelocityMarquee } from "@/components/fx/Scroll";
import { Shot, Viewfinder } from "@/components/media/Shot";
import { HoverLight } from "@/components/ui/HoverLight";
import { events } from "@/data/events";
import { detailPath, frameNo, mediaOfEvent, ratio } from "@/data/media";
import { LLink } from "@/i18n/client";
import { getI18n } from "@/i18n/server";

/** The one strip on the page: the newest frames running past like film, pushed along by the scroll. */
export async function Strip() {
  const { t } = await getI18n();
  // One frame from each gallery in turn, so every sport shows up in the strip.
  const perEvent = events.map((e) => mediaOfEvent(e.slug).filter((m) => m.type === "photo" && m.seq > 0));
  const items = Array.from({ length: 5 }, (_, round) => perEvent.map((list) => list[round])).flat().filter(Boolean).slice(0, 15);

  const row = (hidden: boolean) =>
    items.map((m) => (
      <HoverLight key={`${m.id}-${hidden}`} palette={m.palette} className="h-full shrink-0 pr-2" style={{ aspectRatio: ratio(m) }}>
        <LLink
          href={detailPath(m)}
          tabIndex={hidden ? -1 : undefined}
          aria-label={`${t.gallery.photo} ${frameNo(m)}`}
          data-cursor={t.cursor.view}
          className="vf-host group relative block size-full overflow-hidden rounded-media"
        >
          <Shot m={m} sizes="320px" className="transition-transform duration-700 ease-out-expo group-hover:scale-[1.05]" />
          <Viewfinder />
        </LLink>
      </HoverLight>
    ));

  return (
    <section aria-label={t.strip.label} className="relative z-10 border-y border-line bg-ink-0/40 py-2">
      <VelocityMarquee>
        <div className="flex h-[150px] md:h-[220px]">{row(false)}</div>
        <div className="flex h-[150px] md:h-[220px]" aria-hidden>
          {row(true)}
        </div>
      </VelocityMarquee>
    </section>
  );
}
