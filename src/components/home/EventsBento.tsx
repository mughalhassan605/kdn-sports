import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { EventCard } from "@/components/events/EventCard";
import { RevealBlock, RevealFrame, RevealText } from "@/components/fx/Reveal";
import { AmbientZone } from "@/components/shell/Ambient";
import { events } from "@/data/events";
import { mustMedia } from "@/data/media";
import { LLink } from "@/i18n/client";
import { getI18n } from "@/i18n/server";

/** Five galleries, five cells: two wide posters, then three. Each one opens like a shutter. */
export async function EventsBento() {
  const { t, locale } = await getI18n();
  const sports = [...new Set(events.map((e) => e.sport[locale]))];
  const spans = ["lg:col-span-7", "lg:col-span-5", "lg:col-span-4", "lg:col-span-4", "lg:col-span-4"];

  return (
    <AmbientZone as="section" palette={mustMedia(events[1].cover).palette} className="sec">
      <div className="wrap">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <RevealText as="h2" by="chars" className="t-h2">
            {t.events.title}
          </RevealText>
          <LLink href="/events" className="btn btn-sm btn-line shrink-0">
            {t.events.all}
            <ArrowRightIcon size={15} weight="bold" />
          </LLink>
        </div>

        <RevealBlock as="ul" className="mt-6 flex flex-wrap gap-2" y={18}>
          {sports.map((s) => (
            <li key={s} data-rv-item>
              {/* No prefetch: the router's segment prefetch of a static page with a query, behind the locale rewrite, asks for a segment that does not exist (404). */}
              <LLink href={`/events?sport=${encodeURIComponent(s)}`} prefetch={false} className="chip">
                {s}
              </LLink>
            </li>
          ))}
        </RevealBlock>

        <div className="mt-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-12">
          {events.slice(0, 5).map((ev, i) => (
            <RevealFrame key={ev.slug} zoom={false} delay={(i % 3) * 0.08} className={`rounded-media ${i === 0 ? "sm:col-span-2" : ""} ${spans[i]}`}>
              <EventCard ev={ev} t={t} locale={locale} size={i < 2 ? "lg" : "md"} className={i < 2 ? "min-h-[380px] lg:min-h-[470px]" : "min-h-[320px] lg:min-h-[360px]"} />
            </RevealFrame>
          ))}
        </div>
      </div>
    </AmbientZone>
  );
}
