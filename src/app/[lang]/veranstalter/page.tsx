import type { Metadata } from "next";
import { RevealBlock, RevealFrame, RevealText } from "@/components/fx/Reveal";
import { Window } from "@/components/fx/Scroll";
import { Shot } from "@/components/media/Shot";
import { EnquiryForm } from "@/components/shop/EnquiryForm";
import { Page, PageHead } from "@/components/ui/Page";
import { mustMedia } from "@/data/media";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.nav.organisers, description: t.organisers.pageSub };
}

export default async function OrganisersPage() {
  const { t } = await getI18n();
  const image = mustMedia("fn-002");

  return (
    <Page>
      <PageHead title={t.organisers.pageTitle} sub={t.organisers.pageSub} palette={image.palette} />

      <section className="wrap pb-16">
        <RevealFrame start="top 95%" className="rounded-media">
          <Window className="h-[clamp(20rem,58svh,40rem)]" shift={8}>
            <Shot m={image} variant="clean" sizes="(min-width: 97.5rem) 1464px, 94vw" priority alt="" />
          </Window>
        </RevealFrame>
      </section>

      <section id="leistungen" className="wrap scroll-mt-24 pb-20">
        <RevealBlock as="ul" className="grid gap-px overflow-hidden rounded-panel border border-line bg-line md:grid-cols-3">
          {t.organisers.services.map((s) => (
            <li key={s.t} data-rv-item className="bg-ink-1/90 p-6 md:p-8">
              <h2 className="t-h3">{s.t}</h2>
              <p className="mt-3 text-paper-2">{s.d}</p>
            </li>
          ))}
        </RevealBlock>
      </section>

      <section className="wrap grid gap-12 pb-24 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5">
          <RevealText as="h2" className="t-h2">
            {t.organisers.processTitle}
          </RevealText>
          <RevealBlock as="ol" className="mt-8">
            {t.organisers.process.map((p, i) => (
              <li key={p.t} data-rv-item className="grid grid-cols-[2.75rem_minmax(0,1fr)] items-baseline gap-x-3 border-t border-line py-5 last:border-b">
                <span className="t-num text-[2.5rem] text-paper-3">{i + 1}</span>
                <span>
                  <span className="t-h3 block">{p.t}</span>
                  <span className="mt-1.5 block text-paper-2">{p.d}</span>
                </span>
              </li>
            ))}
          </RevealBlock>
        </div>
        <div className="lg:col-span-7">
          <EnquiryForm />
        </div>
      </section>
    </Page>
  );
}
