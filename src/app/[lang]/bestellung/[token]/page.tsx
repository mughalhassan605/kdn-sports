import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import { OrderView, type OrderItem } from "@/components/shop/OrderView";
import { Page, PageHead } from "@/components/ui/Page";
import { getEvent } from "@/data/events";
import { frameNo, getMedia } from "@/data/media";
import { site } from "@/data/site";
import { LLink } from "@/i18n/client";
import { getI18n } from "@/i18n/server";
import { dateLong, money } from "@/lib/format";
import { verifyOrder } from "@/lib/server/orders";

export const metadata: Metadata = { robots: { index: false } };

// The token is the order (see lib/server/orders.ts): nothing to look up, only a signature to check.
export default async function OrderPage({ params }: PageProps<"/[lang]/bestellung/[token]">) {
  const { token: raw } = await params;
  const token = decodeURIComponent(raw);
  const { t, locale } = await getI18n();
  const order = verifyOrder(token);

  if (!order) {
    return (
      <Page>
        <PageHead title={t.order.invalid} sub={t.order.invalidHint} />
        <section className="wrap pb-24">
          <a href={`mailto:${site.email}`} className="btn btn-paper">
            {site.email}
          </a>
        </section>
      </Page>
    );
  }

  const items: OrderItem[] = order.i.flatMap(([id, license, format]) => {
    const m = getMedia(id);
    if (!m) return [];
    return [{ id, type: m.type, w: m.w, h: m.h, frame: frameNo(m), event: getEvent(m.event)?.title ?? "", license, format }];
  });
  const first = getMedia(order.i[0]?.[0] ?? "");

  return (
    <Page>
      <PageHead title={t.order.title} sub={t.order.sub} palette={first?.palette}>
        <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4">
          {[
            [t.order.number, order.n],
            [t.order.paid, `${money(order.t, locale)}, ${dateLong(new Date(order.c).toISOString(), locale)}`],
            [t.order.sentTo, order.e],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="t-hud text-paper-3">{k}</dt>
              <dd className="mt-1.5 text-paper">{v}</dd>
            </div>
          ))}
        </dl>
      </PageHead>
      <section className="wrap pb-24">
        <OrderView token={token} no={order.n} at={order.c} total={order.t} items={items} />
        <LLink href="/events" className="btn btn-line mt-14">
          {t.cart.browse}
          <ArrowRightIcon size={16} weight="bold" />
        </LLink>
      </section>
    </Page>
  );
}
