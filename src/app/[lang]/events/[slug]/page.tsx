import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RevealText } from "@/components/fx/Reveal";
import { Window } from "@/components/fx/Scroll";
import { Gallery } from "@/components/gallery/Gallery";
import { Shot } from "@/components/media/Shot";
import { AmbientSet } from "@/components/shell/Ambient";
import { Page } from "@/components/ui/Page";
import { eventCounts, events, getEvent } from "@/data/events";
import { mediaOfEvent, mustMedia } from "@/data/media";
import { LLink } from "@/i18n/client";
import { locales } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { dateLong } from "@/lib/format";

export function generateStaticParams() {
  return locales.flatMap((lang) => events.map((e) => ({ lang, slug: e.slug })));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/events/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { locale } = await getI18n();
  const ev = getEvent(slug);
  return ev ? { title: ev.title, description: ev.blurb[locale] } : {};
}

export default async function EventPage({ params }: PageProps<"/[lang]/events/[slug]">) {
  const { slug } = await params;
  const { t, locale } = await getI18n();
  const ev = getEvent(slug);
  if (!ev) notFound();

  const cover = mustMedia(ev.cover);
  const items = mediaOfEvent(slug);
  const c = eventCounts(slug);

  return (
    <Page>
      <AmbientSet palette={cover.palette} level={0.34} />
      <header className="relative flex min-h-[64svh] items-end overflow-hidden pt-24">
        <Window className="absolute inset-0" shift={10}>
          <Shot m={cover} variant="clean" sizes="100vw" priority alt="" />
        </Window>
        <span className="absolute inset-0 bg-gradient-to-t from-ink-0 via-ink-0/55 to-ink-0/30" aria-hidden />

        <div className="wrap relative pb-9 md:pb-12">
          <LLink href="/events" transitionTypes={["back"]} className="chip">
            <ArrowLeftIcon size={13} weight="bold" />
            {t.gallery.back}
          </LLink>
          <RevealText as="h1" by="chars" start="top 100%" className="t-hero mt-5 max-w-[14ch]">
            {ev.title}
          </RevealText>
          <div className="mt-6 flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
            <p className="t-lede max-w-[50ch] text-paper-2">{ev.blurb[locale]}</p>
            <dl className="flex gap-8">
              {[
                [ev.sport[locale], `${ev.venue[locale]}, ${ev.city}`],
                [dateLong(ev.date, locale), `${c.photos} ${t.events.photos}${c.clips ? `, ${c.clips} ${t.events.clips}` : ""}`],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="t-hud text-paper">{k}</dt>
                  <dd className="mt-1.5 text-sm text-paper-2">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </header>

      <Gallery items={items} />
    </Page>
  );
}
