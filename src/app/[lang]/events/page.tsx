import type { Metadata } from "next";
import { EventCard } from "@/components/events/EventCard";
import { RevealFrame } from "@/components/fx/Reveal";
import { Page, PageHead } from "@/components/ui/Page";
import { events } from "@/data/events";
import { mustMedia } from "@/data/media";
import { LLink } from "@/i18n/client";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.events.indexTitle, description: t.events.indexSub };
}

export default async function EventsPage({ searchParams }: PageProps<"/[lang]/events">) {
  const { t, locale } = await getI18n();
  const { sport } = await searchParams;
  const active = typeof sport === "string" ? sport : undefined;
  const sports = [...new Set(events.map((e) => e.sport[locale]))];
  const list = active ? events.filter((e) => e.sport[locale] === active) : events;

  return (
    <Page>
      <PageHead title={t.events.indexTitle} sub={t.events.indexSub} palette={mustMedia(events[0].cover).palette}>
        <ul className="mt-8 flex flex-wrap gap-2">
          <li>
            <LLink href="/events" className="chip" data-on={!active}>
              {t.events.allSports}
            </LLink>
          </li>
          {sports.map((s) => (
            <li key={s}>
              <LLink href={`/events?sport=${encodeURIComponent(s)}`} className="chip" data-on={active === s}>
                {s}
              </LLink>
            </li>
          ))}
        </ul>
      </PageHead>

      <section className="wrap pb-24">
        {list.length === 0 ? (
          <p className="panel p-8 text-paper-2">{t.events.empty}</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-12">
            {list.map((ev, i) => {
              const wide = i % 5 < 2;
              return (
                <RevealFrame
                  key={ev.slug}
                  zoom={false}
                  start="top 95%"
                  delay={(i % 3) * 0.08}
                  className={`rounded-media ${wide ? (i % 5 === 0 ? "lg:col-span-7" : "lg:col-span-5") : "lg:col-span-4"}`}
                >
                  <EventCard ev={ev} t={t} locale={locale} size={wide ? "lg" : "md"} priority={i < 2} className={wide ? "min-h-[380px] lg:min-h-[470px]" : "min-h-[320px] lg:min-h-[360px]"} />
                </RevealFrame>
              );
            })}
          </div>
        )}
      </section>
    </Page>
  );
}
