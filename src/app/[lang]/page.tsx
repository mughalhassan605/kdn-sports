import { ClipsShowcase } from "@/components/home/ClipsShowcase";
import { DevelopStage } from "@/components/home/develop/DevelopStage";
import { EventsBento } from "@/components/home/EventsBento";
import { Faq } from "@/components/home/Faq";
import { Finale } from "@/components/home/Finale";
import type { FlightItem } from "@/components/home/flight/FlightScene";
import { FlightStage } from "@/components/home/flight/FlightStage";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Manifesto } from "@/components/home/Manifesto";
import { MediaFinderSection } from "@/components/home/MediaFinderSection";
import { OrganisersBand } from "@/components/home/OrganisersBand";
import { PricingBoard } from "@/components/home/PricingBoard";
import { SearchSection } from "@/components/home/SearchSection";
import { Strip } from "@/components/home/Strip";
import { TrustBand } from "@/components/home/TrustBand";
import { AmbientZone } from "@/components/shell/Ambient";
import { events, getEvent } from "@/data/events";
import { mediaOfEvent, mustMedia, src, type Media } from "@/data/media";
import { site } from "@/data/site";
import { getI18n } from "@/i18n/server";
import { dateLong } from "@/lib/format";

/** The hero print. A different picture from the landing, so the flight goes somewhere. */
const HERO = "td-001";
const DEVELOP = "hc-001";

const flightItem = (m: Media): FlightItem => ({
  id: m.id,
  // Marketing picks fly clean; everything else flies as its marked thumbnail.
  url: m.clean ? src.cleanM(m.id) : src.thumb(m.id),
  urlSmall: src.thumb(m.id),
  ratio: m.w / m.h,
  palette: m.palette,
  seq: m.seq,
});

// The home page (see docs/DIRECTION.md):
//   opening   loader, arrival, archive flight, landing     FlightStage (WebGL, pinned)
//   search    find an event, a photo or an answer          SearchSection
//   galleries                                              EventsBento
//   develop   the product, scrubbed by the scroll          DevelopStage (WebGL, pinned)
//   then film strip + clips, statement, prices, organisers, trust, questions, close.
// The two pinned scenes fall back to static sections for reduced motion and missing WebGL.
export default async function Home() {
  const { locale } = await getI18n();
  const featured = getEvent(site.featuredEvent)!;
  const hero = mustMedia(HERO);
  const final = mustMedia(featured.cover);
  const develop = mustMedia(DEVELOP);

  // One photo from each gallery in turn: every sport passes the camera.
  const perEvent = events.map((e) => mediaOfEvent(e.slug).filter((m) => m.type === "photo" && m.seq > 0));
  const mixed = Array.from({ length: 6 }, (_, round) => perEvent.map((list) => list[round]))
    .flat()
    .filter((m): m is Media => Boolean(m) && m.id !== hero.id && m.id !== final.id);

  const quick = [...new Set([...events.map((e) => e.sport[locale]), ...events.map((e) => e.city)])];

  const tunnel = mixed.slice(0, 10);
  const wall = mixed.slice(0, 24).map((m) => ({ id: m.id, avg: m.avg }));

  return (
    <>
      <FlightStage
        hero={{ ...flightItem(hero), url: src.clean(hero.id), urlSmall: src.cleanM(hero.id) }}
        items={tunnel.map(flightItem)}
        final={{ ...flightItem(final), url: src.clean(final.id), urlSmall: src.cleanM(final.id) }}
        landing={{
          title: featured.title,
          meta: `${featured.sport[locale]} / ${featured.city} / ${dateLong(featured.date, locale)}`,
          href: `/events/${featured.slug}`,
        }}
        fallback={<Hero />}
      />
      <SearchSection quick={quick} />
      <EventsBento />
      <DevelopStage
        preview={src.preview(develop.id)}
        clean={src.clean(develop.id)}
        ratio={develop.w / develop.h}
        palette={develop.palette}
        fallback={<HowItWorks />}
      />
      <Strip />
      <MediaFinderSection />
      <ClipsShowcase />
      <Manifesto />
      <AmbientZone as="section" palette={mustMedia("sl-001").palette} level={0.26} className="sec">
        <div className="wrap">
          <PricingBoard />
        </div>
      </AmbientZone>
      <OrganisersBand />
      <TrustBand />
      <AmbientZone as="section" palette={mustMedia("td-002").palette} level={0.22} className="sec">
        <div className="wrap">
          <Faq />
        </div>
      </AmbientZone>
      <Finale items={wall} palette={final.palette} />
    </>
  );
}
