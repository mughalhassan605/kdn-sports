/* eslint-disable @next/next/no-img-element -- pre-sized derivatives, see Shot.tsx */
import { ArrowLeftIcon, CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import { RevealBlock } from "@/components/fx/Reveal";
import { MediaTile } from "@/components/gallery/MediaTile";
import { ClipPlayer } from "@/components/media/ClipPlayer";
import { Viewfinder } from "@/components/media/Shot";
import { AmbientSet } from "@/components/shell/Ambient";
import { BuyPanel } from "@/components/shop/BuyPanel";
import { Page } from "@/components/ui/Page";
import { getEvent } from "@/data/events";
import { detailPath, frameNo, getMedia, mediaOfEvent, src, type MediaType } from "@/data/media";
import { LLink } from "@/i18n/client";
import { getI18n } from "@/i18n/server";
import { spillVars } from "@/lib/ambient";

/** One photo or clip: the watermarked preview on the left, the buying decisions on the right. */
export async function MediaDetail({ id, type }: { id: string; type: MediaType }) {
  const { t } = await getI18n();
  const m = getMedia(id);
  if (!m || m.type !== type) notFound();
  const ev = getEvent(m.event)!;

  const siblings = mediaOfEvent(m.event);
  const at = siblings.findIndex((x) => x.id === m.id);
  const prev = siblings[at - 1];
  const next = siblings[at + 1];
  const near = siblings.filter((x) => x.id !== m.id).slice(Math.max(0, at - 3), Math.max(0, at - 3) + 6);
  const kind = m.type === "clip" ? t.gallery.clip : t.gallery.photo;

  return (
    <Page className="wrap pb-24 pt-24 md:pt-28">
      <AmbientSet palette={m.palette} level={0.4} />

      <nav className="flex items-center justify-between gap-4">
        <LLink href={`/events/${ev.slug}`} transitionTypes={["back"]} className="chip">
          <ArrowLeftIcon size={13} weight="bold" />
          {ev.title}
        </LLink>
        <div className="flex gap-2">
          {[
            [prev, t.detail.prev, CaretLeftIcon] as const,
            [next, t.detail.next, CaretRightIcon] as const,
          ].map(([target, label, Icon]) =>
            target ? (
              <LLink
                key={label}
                href={detailPath(target)}
                aria-label={label}
                className="grid size-10 place-items-center rounded-full border border-line-2 text-paper transition-colors hover:bg-white/10"
              >
                <Icon size={16} weight="bold" />
              </LLink>
            ) : (
              <span key={label} className="grid size-10 place-items-center rounded-full border border-line text-paper-3" aria-hidden>
                <Icon size={16} weight="bold" />
              </span>
            ),
          )}
        </div>
      </nav>

      <div className="mt-6 grid items-start gap-8 lg:grid-cols-12 lg:gap-10">
        <div className="lg:sticky lg:top-24 lg:col-span-8">
          <div className="spill" style={{ ...spillVars(m.palette), "--spill": 0.45 } as React.CSSProperties}>
            <div className="relative mx-auto" style={{ aspectRatio: m.w / m.h, maxHeight: "min(78svh, 54rem)", maxWidth: `min(100%, calc(min(78svh, 54rem) * ${m.w / m.h}))` }}>
              {m.type === "clip" ? (
                <ClipPlayer m={m} className="size-full" />
              ) : (
                <ViewTransition name={`m-${m.id}`} share="morph" default="none">
                  <img
                    src={src.preview(m.id)}
                    alt={`${kind} ${frameNo(m)}, ${ev.title}`}
                    width={m.w}
                    height={m.h}
                    fetchPriority="high"
                    decoding="async"
                    draggable={false}
                    className="size-full rounded-media object-cover"
                    style={{ backgroundColor: m.avg }}
                  />
                </ViewTransition>
              )}
              <Viewfinder on out />
            </div>
          </div>
          <p className="mt-6 text-center text-sm text-paper-3">{t.detail.watermark}</p>
        </div>

        <div className="lg:col-span-4">
          <BuyPanel m={m} eventTitle={ev.title} />
        </div>
      </div>

      {near.length > 0 && (
        <section className="mt-20">
          <h2 className="t-h3">{t.detail.more}</h2>
          <RevealBlock className="jgrid mt-5" y={24}>
            {near.map((x) => (
              <MediaTile key={x.id} m={x} sizes="(min-width: 64rem) 22vw, 50vw" />
            ))}
          </RevealBlock>
        </section>
      )}
    </Page>
  );
}
