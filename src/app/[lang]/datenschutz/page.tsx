import type { Metadata } from "next";
import { Page, PageHead } from "@/components/ui/Page";
import { site } from "@/data/site";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.footer.privacy, robots: { index: false } };
}

// PLACEHOLDER: legally required in Germany. The real text has to come from the client's lawyer or a generator they trust.
export default async function LegalPage() {
  const { t } = await getI18n();
  return (
    <Page>
      <PageHead title={t.footer.privacy} />
      <section className="wrap pb-28">
        <div className="panel max-w-[70ch] p-6 text-paper-2 md:p-8">
          <p>{t.legal.placeholder}</p>
          <p className="mt-4">
            {site.name}, <a href={`mailto:${site.email}`} className="link-u text-paper">{site.email}</a>
          </p>
        </div>
      </section>
    </Page>
  );
}
