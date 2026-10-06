"use client";

import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { LLink, useI18n } from "@/i18n/client";
import { fill } from "@/i18n/config";
import { dateLong, money } from "@/lib/format";
import { useOrders } from "@/lib/store";

/** Orders placed on this device. The signed link in the order email is the real key; this is a convenience. */
export function MyOrders() {
  const { t, locale } = useI18n();
  const list = useOrders();

  if (list.length === 0) {
    return (
      <div className="panel flex flex-col items-start gap-4 p-8 md:p-12">
        <p className="t-h3">{t.order.mineEmpty}</p>
        <LLink href="/events" className="btn btn-paper">
          {t.cart.browse}
          <ArrowRightIcon size={16} weight="bold" />
        </LLink>
      </div>
    );
  }

  return (
    <ul>
      {list.map((o) => (
        <li key={o.token} className="border-t border-line last:border-b">
          <LLink href={`/bestellung/${o.token}`} className="group flex flex-wrap items-center justify-between gap-x-8 gap-y-2 py-5">
            <span className="t-h3">{o.no}</span>
            <span className="text-paper-2">{dateLong(new Date(o.at).toISOString(), locale)}</span>
            <span className="text-paper-2">{fill(t.cart.items, { n: o.count })}</span>
            <span className="tabular-nums text-paper">{money(o.total, locale)}</span>
            <span className="btn btn-sm btn-line group-hover:bg-white/10">
              {t.order.open}
              <ArrowRightIcon size={15} weight="bold" />
            </span>
          </LLink>
        </li>
      ))}
    </ul>
  );
}
