import type { Metadata } from "next";
import { RevealBlock } from "@/components/fx/Reveal";
import { MediaTile } from "@/components/gallery/MediaTile";
import { Page, PageHead } from "@/components/ui/Page";
import { clips } from "@/data/media";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.nav.clips, description: t.clips.indexSub };
}

export default async function ClipsPage() {
  const { t } = await getI18n();
  return (
    <Page>
      <PageHead title={t.clips.title} sub={t.clips.indexSub} palette={clips[0].palette} />
      <section className="wrap pb-24">
        <RevealBlock className="jgrid" start="top 95%" y={30}>
          {clips.map((m, i) => (
            <MediaTile key={m.id} m={m} priority={i < 3} sizes="(min-width: 64rem) 30vw, 50vw" />
          ))}
        </RevealBlock>
      </section>
    </Page>
  );
}
