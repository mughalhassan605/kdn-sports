import { events, getEvent } from "@/data/events";
import { detailPath, frameNo, getMedia, media, src } from "@/data/media";
import { fill, type Locale } from "@/i18n/config";
import { de } from "@/i18n/dict/de";
import { en } from "@/i18n/dict/en";
import { dateLong, dateShort } from "@/lib/format";
import type { SearchDoc } from "@/lib/search";

const dicts = { de, en };

/** Both languages' words, so a German visitor typing "price" still finds the prices. */
const both = (pick: (t: typeof de) => string) => `${pick(de)} ${pick(en)}`;

/**
 * Everything the site search can find, in one language: every event, photo and
 * clip, the main pages and the FAQ. Built at build time (see /api/suche/[lang]).
 */
export function buildSearchIndex(locale: Locale): SearchDoc[] {
  const t = dicts[locale];
  const docs: SearchDoc[] = [];

  for (const ev of events) {
    docs.push({
      kind: "event",
      href: `/events/${ev.slug}`,
      title: ev.title,
      sub: `${ev.sport[locale]} / ${ev.city} / ${dateLong(ev.date, locale)}`,
      img: src.thumb(ev.cover),
      bg: getMedia(ev.cover)?.avg,
      terms: [ev.sport.de, ev.sport.en, ev.venue.de, ev.venue.en, dateLong(ev.date, "de"), dateLong(ev.date, "en"), dateShort(ev.date, locale), ev.blurb[locale], both((d) => d.search.words.events)].join(" "),
      rank: ev.date,
    });
  }

  for (const m of media) {
    const ev = getEvent(m.event);
    if (!ev) continue;
    const clip = m.type === "clip";
    const time = m.takenAt.slice(11, 16);
    docs.push({
      kind: m.type,
      href: detailPath(m),
      title: fill(clip ? t.search.clip : t.search.photo, { n: frameNo(m) }),
      sub: `${ev.title} / ${time}`,
      img: src.thumb(m.id),
      bg: m.avg,
      ratio: Math.round((m.w / m.h) * 1000) / 1000,
      terms: [ev.sport.de, ev.sport.en, ev.city, String(m.seq), time, dateLong(ev.date, locale), both((d) => (clip ? d.search.words.clip : d.search.words.photo))].join(" "),
      // Newest event first, then gallery order.
      rank: `${ev.date}:${String(99999 - m.seq).padStart(5, "0")}`,
    });
  }

  const pages: { href: string; title: string; sub: string; words: string }[] = [
    { href: "/events", title: t.nav.events, sub: t.events.indexSub, words: both((d) => d.search.words.events) },
    { href: "/clips", title: t.nav.clips, sub: t.clips.indexSub, words: both((d) => d.search.words.clips) },
    { href: "/preise", title: t.pricing.pageTitle, sub: t.pricing.pageSub, words: both((d) => d.search.words.pricing) },
    { href: "/veranstalter", title: t.nav.organisers, sub: t.organisers.pageSub, words: both((d) => d.search.words.organisers) },
    { href: "/ueber", title: t.nav.about, sub: t.about.body[0], words: both((d) => d.search.words.about) },
    { href: "/downloads", title: t.nav.downloads, sub: t.trust[3].d, words: both((d) => d.search.words.downloads) },
    { href: "/impressum", title: t.footer.imprint, sub: t.footer.legal, words: both((d) => d.search.words.legal) },
    { href: "/datenschutz", title: t.footer.privacy, sub: t.footer.legal, words: both((d) => d.search.words.legal) },
    { href: "/agb", title: t.footer.terms, sub: t.footer.legal, words: both((d) => d.search.words.legal) },
  ];
  for (const p of pages) docs.push({ kind: "page", href: p.href, title: p.title, sub: p.sub, terms: p.words });

  for (const item of t.faq.items) docs.push({ kind: "help", href: "/preise#faq", title: item.q, sub: item.a });

  return docs;
}
