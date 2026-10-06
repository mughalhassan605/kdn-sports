"use client";

import { DownloadSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import { useInView } from "motion/react";
import { useEffect, useRef } from "react";
import { Viewfinder } from "@/components/media/Shot";
import { UnlockFrame } from "@/components/media/UnlockFrame";
import { src } from "@/data/media";
import type { Format, License } from "@/data/pricing";
import { useI18n } from "@/i18n/client";
import { orders } from "@/lib/store";

export type OrderItem = { id: string; type: "photo" | "clip"; w: number; h: number; frame: string; event: string; license: License; format: Format };

type Props = {
  token: string;
  no: string;
  at: number;
  total: number;
  items: OrderItem[];
};

const fileUrl = (id: string, token: string, inline = false) => `/api/download/${id}?t=${encodeURIComponent(token)}${inline ? "&inline" : ""}`;

function Item({ item, token, index }: { item: OrderItem; token: string; index: number }) {
  const { t } = useI18n();
  const ref = useRef<HTMLLIElement>(null);
  const seen = useInView(ref, { once: true, amount: 0.35 });
  const kind = item.type === "clip" ? t.gallery.clip : t.gallery.photo;

  return (
    <li ref={ref} className="vf-host">
      <div className="relative">
        {item.type === "clip" ? (
          <video src={fileUrl(item.id, token, true)} poster={src.thumb2(item.id)} controls playsInline preload="none" className="aspect-video w-full rounded-media bg-ink-2 object-contain" />
        ) : (
          <UnlockFrame
            preview={src.preview(item.id)}
            clean={fileUrl(item.id, token, true)}
            alt={`${kind} ${item.frame}`}
            unlocked={seen}
            delay={0.25 + (index % 3) * 0.15}
            className="w-full"
            style={{ aspectRatio: item.w / item.h }}
          />
        )}
        <Viewfinder on tone="glow" />
      </div>
      <div className="mt-3 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate font-[650] capitalize text-paper">
            {kind} {item.frame}
          </p>
          <p className="truncate text-sm text-paper-3">
            {item.event} / {t.pricing[item.license]} / {t.pricing.formats[item.format].t}
          </p>
        </div>
        <a href={fileUrl(item.id, token)} className="btn btn-sm btn-glow shrink-0">
          <DownloadSimpleIcon size={15} weight="bold" />
          {t.order.download}
        </a>
      </div>
    </li>
  );
}

/** The bought files. Each print develops as it scrolls into view, then offers its original. */
export function OrderView({ token, no, at, total, items }: Props) {
  // Remember the order on this device so "Downloads" can find it again.
  useEffect(() => {
    orders.add({ token, no, at, count: items.length, total });
  }, [token, no, at, total, items.length]);

  return (
    <ul className="grid gap-x-4 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, i) => (
        <Item key={item.id} item={item} token={token} index={i} />
      ))}
    </ul>
  );
}
