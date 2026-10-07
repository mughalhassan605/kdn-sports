import type { Metadata } from "next";
import { SearchPage } from "@/components/search/SearchPage";
import { Page, PageHead } from "@/components/ui/Page";
import { events } from "@/data/events";
import { mustMedia } from "@/data/media";
import { getI18n } from "@/i18n/server";
import { buildSearchIndex } from "@/lib/server/search-index";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.search.title, description: t.search.sub };
}

export default async function SearchRoute() {
  const { t, locale } = await getI18n();
  return (
    <Page>
      <PageHead title={t.search.title} sub={t.search.sub} palette={mustMedia(events[2].cover).palette} />
      <section className="wrap min-h-[50svh] pb-24">
        <SearchPage index={buildSearchIndex(locale)} />
      </section>
    </Page>
  );
}
