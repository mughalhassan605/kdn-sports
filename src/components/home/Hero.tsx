import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { CompareSplit } from "@/components/media/CompareSplit";
import { Viewfinder } from "@/components/media/Shot";
import { AmbientZone } from "@/components/shell/Ambient";
import { getEvent } from "@/data/events";
import { mustMedia, src } from "@/data/media";
import { site } from "@/data/site";
import { LLink } from "@/i18n/client";
import { getI18n } from "@/i18n/server";
import { spillVars } from "@/lib/ambient";

export async function Hero() {
  const { t } = await getI18n();
  const m = mustMedia(site.heroMedia);
  const ev = getEvent(site.featuredEvent)!;

  return (
    <AmbientZone as="section" palette={m.palette} level={0.4} className="relative overflow-x-clip">
      <div className="wrap flex min-h-[100dvh] flex-col justify-end pb-6 pt-24 lg:pb-8 lg:pt-[5.5rem]">
        <LLink href={`/events/${ev.slug}`} className="chip rise self-start">
          {t.hero.chip}: {ev.title}
          <ArrowRightIcon size={13} weight="bold" />
        </LLink>

        <h1 className="t-hero mt-5">
          {[t.hero.line1, t.hero.line2].map((line, i) => (
            <span key={line} className="zoom-line-mask">
              <span className="zoom-line md:whitespace-nowrap" style={{ "--i": i, "--d": "120ms" } as React.CSSProperties}>
                {line}
              </span>
            </span>
          ))}
        </h1>

        <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-end md:justify-between lg:mt-7">
          <p className="t-lede rise max-w-[44ch] text-paper-2" style={{ "--d": "520ms" } as React.CSSProperties}>
            {t.hero.sub}
          </p>
          <div className="rise flex shrink-0 flex-wrap gap-3" style={{ "--d": "620ms" } as React.CSSProperties}>
            <LLink href="/events" className="btn btn-paper">
              {t.hero.cta}
              <ArrowRightIcon size={16} weight="bold" />
            </LLink>
            <a href="#ablauf" className="btn btn-line">
              {t.hero.cta2}
            </a>
          </div>
        </div>

        <div className="spill mt-7 lg:mt-8" style={{ ...spillVars(m.palette), "--spill": 0.42 } as React.CSSProperties}>
          <div className="shutter" style={{ "--d": "380ms" } as React.CSSProperties}>
            <CompareSplit
              lo={src.lo(m.id)}
              hi={src.clean(m.id)}
              hiSet={`${src.cleanM(m.id)} 960w, ${src.clean(m.id)} 1920w`}
              sizes="(min-width: 97.5rem) 1464px, 94vw"
              alt={`${ev.title}, ${ev.venue.de} ${ev.city}`}
              label={t.hero.drag}
              leftTag={t.hero.preview}
              rightTag={t.hero.original}
              focal="55% 30%"
              className="aspect-[4/3] w-full sm:aspect-[16/9] lg:aspect-auto lg:h-[clamp(17rem,calc(100dvh-29rem),36rem)]"
            />
          </div>
          <Viewfinder on out />
        </div>

        <div className="rise mt-4 flex items-start justify-between gap-6" style={{ "--d": "900ms" } as React.CSSProperties}>
          <p className="text-sm text-paper-3">{t.hero.previewNote}</p>
          <p className="text-right text-sm text-paper-3">{t.hero.originalNote}</p>
        </div>
      </div>
    </AmbientZone>
  );
}
