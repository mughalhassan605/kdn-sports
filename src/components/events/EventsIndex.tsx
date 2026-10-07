"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { RevealFrame } from "@/components/fx/Reveal";
import { LLink, useI18n } from "@/i18n/client";

// The events index is a static page; the sport filter lives in the query
// string and is applied here, so the page itself can come from the CDN.
// Until the query is read (prerender, first paint) everything shows unfiltered.

/** One event, pre-rendered on the server as a wide and as a regular poster. */
export type IndexedEvent = { slug: string; sport: string; lg: React.ReactNode; md: React.ReactNode };

const useSport = () => useSearchParams().get("sport") ?? undefined;

export function SportFilter({ sports }: { sports: string[] }) {
  return (
    <Suspense fallback={<Chips sports={sports} />}>
      <LiveChips sports={sports} />
    </Suspense>
  );
}

function LiveChips({ sports }: { sports: string[] }) {
  return <Chips sports={sports} active={useSport()} />;
}

function Chips({ sports, active }: { sports: string[]; active?: string }) {
  const { t } = useI18n();
  return (
    <ul className="mt-8 flex flex-wrap gap-2">
      <li>
        <LLink href="/events" scroll={false} className="chip" data-on={!active}>
          {t.events.allSports}
        </LLink>
      </li>
      {sports.map((s) => (
        <li key={s}>
          <LLink href={`/events?sport=${encodeURIComponent(s)}`} scroll={false} className="chip" data-on={active === s}>
            {s}
          </LLink>
        </li>
      ))}
    </ul>
  );
}

export function EventsGrid({ items }: { items: IndexedEvent[] }) {
  return (
    <Suspense fallback={<Grid items={items} />}>
      <LiveGrid items={items} />
    </Suspense>
  );
}

function LiveGrid({ items }: { items: IndexedEvent[] }) {
  return <Grid items={items} active={useSport()} />;
}

function Grid({ items, active }: { items: IndexedEvent[]; active?: string }) {
  const { t } = useI18n();
  const list = active ? items.filter((e) => e.sport === active) : items;

  if (list.length === 0) return <p className="panel p-8 text-paper-2">{t.events.empty}</p>;

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-12">
      {list.map((ev, i) => {
        const wide = i % 5 < 2;
        return (
          <RevealFrame
            key={ev.slug}
            zoom={false}
            start="top 95%"
            delay={(i % 3) * 0.08}
            className={`rounded-media ${wide ? (i % 5 === 0 ? "lg:col-span-7" : "lg:col-span-5") : "lg:col-span-4"}`}
          >
            {wide ? ev.lg : ev.md}
          </RevealFrame>
        );
      })}
    </div>
  );
}
