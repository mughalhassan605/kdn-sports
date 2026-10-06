import type { Metadata } from "next";
import { Checkout } from "@/components/shop/Checkout";
import { Page, PageHead } from "@/components/ui/Page";
import { mustMedia } from "@/data/media";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.checkout.title, robots: { index: false } };
}

export default async function CheckoutPage() {
  const { t } = await getI18n();
  return (
    <Page>
      <PageHead title={t.checkout.title} palette={mustMedia("sl-001").palette} />
      <section className="wrap pb-24">
        <Checkout />
      </section>
    </Page>
  );
}
