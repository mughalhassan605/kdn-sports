import type { Metadata } from "next";
import { MyOrders } from "@/components/shop/MyOrders";
import { Page, PageHead } from "@/components/ui/Page";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.order.mine, robots: { index: false } };
}

export default async function DownloadsPage() {
  const { t } = await getI18n();
  return (
    <Page>
      <PageHead title={t.order.mine} />
      <section className="wrap pb-24">
        <MyOrders />
      </section>
    </Page>
  );
}
