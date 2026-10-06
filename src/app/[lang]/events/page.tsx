import type { Metadata } from "next";
import { EventCard } from "@/components/events/EventCard";
import { EventsGrid, SportFilter } from "@/components/events/EventsIndex";
import { Page, PageHead } from "@/components/ui/Page";
import { events } from "@/data/events";
import { mustMedia } from "@/data/media";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.events.indexTitle, description: t.events.indexSub };
}

// Static: the ?sport= filter is applied in the browser (see EventsIndex).
export default async function EventsPage() {
  const { t, locale } = await getI18n();
  const sports = [...new Set(events.map((e) => e.sport[locale]))];
  const items = events.map((ev, i) => ({
    slug: ev.slug,
    sport: ev.sport[locale],
    lg: <EventCard ev={ev} t={t} locale={locale} size="lg" priority={i < 2} className="min-h-[380px] lg:min-h-[470px]" />,
    md: <EventCard ev={ev} t={t} locale={locale} size="md" className="min-h-[320px] lg:min-h-[360px]" />,
  }));

  return (
    <Page>
      <PageHead title={t.events.indexTitle} sub={t.events.indexSub} palette={mustMedia(events[0].cover).palette}>
        <SportFilter sports={sports} />
      </PageHead>

      <section className="wrap pb-24">
        <EventsGrid items={items} />
      </section>
    </Page>
  );
}
