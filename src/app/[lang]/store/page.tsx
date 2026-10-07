import type { Metadata } from "next";
import { MediaFinder } from "@/components/shop/MediaFinder";
import { Page, PageHead } from "@/components/ui/Page";
import { events } from "@/data/events";
import { media } from "@/data/media";
import { locales } from "@/i18n/config";
import { getI18n } from "@/i18n/server";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t.store.title,
    description: t.store.sub,
  };
}

export default async function StorePage() {
  const { t } = await getI18n();

  return (
    <Page>
      <PageHead
        title={t.store.title}
        sub={t.store.sub}
        palette={media[0]?.palette}
      />
      <section className="wrap pb-24">
        <MediaFinder media={media} events={events} />
      </section>
    </Page>
  );
}
