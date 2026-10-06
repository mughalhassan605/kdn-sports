import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import { RevealBlock, RevealFrame, ScrubWords } from "@/components/fx/Reveal";
import { Window } from "@/components/fx/Scroll";
import { Shot } from "@/components/media/Shot";
import { Page, PageHead } from "@/components/ui/Page";
import { mustMedia } from "@/data/media";
import { LLink } from "@/i18n/client";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.nav.about, description: t.about.body[0] };
}

// PLACEHOLDER copy: the facts about KDN (who, since when, where) have to come from the client.
export default async function AboutPage() {
  const { t } = await getI18n();
  const image = mustMedia("fn-003");

  return (
    <Page>
      <PageHead title={t.about.title} palette={image.palette} />
      <section className="wrap grid gap-10 pb-20 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <ScrubWords className="text-[clamp(1.5rem,2.9vw,2.6rem)] font-[720] leading-[1.1] tracking-[-0.02em] text-paper [font-stretch:108%]">{t.about.body[0]}</ScrubWords>
          <p className="t-lede mt-8 max-w-[54ch] text-paper-2">{t.about.body[1]}</p>
          <RevealBlock as="dl" className="mt-10">
            {t.about.facts.map((f) => (
              <div key={f.k} data-rv-item className="grid gap-x-6 gap-y-1 border-t border-line py-4 last:border-b sm:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
                <dt className="t-hud pt-1 text-paper-3">{f.k}</dt>
                <dd className="t-h3">{f.v}</dd>
              </div>
            ))}
          </RevealBlock>
          <LLink href="/veranstalter" className="btn btn-paper mt-10">
            {t.organisers.cta}
            <ArrowRightIcon size={16} weight="bold" />
          </LLink>
        </div>
        <RevealFrame start="top 95%" className="rounded-media lg:col-span-5">
          <Window className="h-[clamp(22rem,70svh,44rem)]" shift={9}>
            <Shot m={image} variant="clean" sizes="(min-width: 64rem) 40vw, 94vw" alt="" />
          </Window>
        </RevealFrame>
      </section>
    </Page>
  );
}
