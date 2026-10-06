import { CheckIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import { RevealBlock, RevealText } from "@/components/fx/Reveal";
import { Faq } from "@/components/home/Faq";
import { PricingBoard } from "@/components/home/PricingBoard";
import { Page, PageHead } from "@/components/ui/Page";
import { mustMedia } from "@/data/media";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.pricing.pageTitle, description: t.pricing.pageSub };
}

export default async function PricingPage() {
  const { t } = await getI18n();
  const mark = (ok: boolean) =>
    ok ? (
      <span className="inline-flex items-center gap-2 text-paper">
        <CheckIcon size={16} weight="bold" className="text-glow" />
        <span className="max-sm:sr-only">{t.pricing.yes}</span>
      </span>
    ) : (
      <span className="inline-flex items-center gap-2 text-paper-3">
        <XIcon size={16} weight="bold" />
        <span className="max-sm:sr-only">{t.pricing.no}</span>
      </span>
    );

  return (
    <Page>
      <PageHead title={t.pricing.pageTitle} sub={t.pricing.pageSub} palette={mustMedia("sl-001").palette} />
      <section className="wrap pb-20">
        <PricingBoard withLink={false} />
      </section>

      <section className="wrap pb-24">
        <RevealText as="h2" className="t-h2">
          {t.pricing.licenseTitle}
        </RevealText>
        <RevealBlock className="mt-8 overflow-hidden rounded-panel border border-line">
          <table className="w-full text-left text-[0.9375rem]">
            <thead>
              <tr className="bg-ink-1/90">
                <th className="p-4 md:p-5" />
                <th className="t-h3 p-4 md:p-5">{t.pricing.personal}</th>
                <th className="t-h3 p-4 md:p-5">{t.pricing.commercial}</th>
              </tr>
            </thead>
            <tbody>
              {t.pricing.rows.map((r) => (
                <tr key={r.k} data-rv-item className="border-t border-line bg-ink-1/60">
                  <th scope="row" className="p-4 font-normal text-paper-2 md:p-5">
                    {r.k}
                  </th>
                  <td className="p-4 md:p-5">{mark(r.p)}</td>
                  <td className="p-4 md:p-5">{mark(r.c)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </RevealBlock>
      </section>

      <section className="sec">
        <div className="wrap">
          <Faq />
        </div>
      </section>
    </Page>
  );
}
