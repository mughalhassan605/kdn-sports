import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { Shot } from "@/components/media/Shot";
import { AmbientZone } from "@/components/shell/Ambient";
import { RevealBlock, RevealText } from "@/components/fx/Reveal";
import { Expand, Window } from "@/components/fx/Scroll";
import { mustMedia } from "@/data/media";
import { LLink } from "@/i18n/client";
import { getI18n } from "@/i18n/server";

const IMAGE = "fn-002";

/** The second audience: people who run events. One wide frame of a full room, the offer set into it. */
export async function OrganisersBand() {
  const { t } = await getI18n();
  const m = mustMedia(IMAGE);

  return (
    <AmbientZone as="section" palette={m.palette} className="sec">
      <div className="wrap">
        <Expand className="relative flex min-h-[620px] items-end overflow-hidden rounded-media lg:min-h-[700px]">
          <Window className="absolute inset-0" shift={8}>
            <Shot m={m} variant="clean" sizes="(min-width: 97.5rem) 1464px, 94vw" alt="" />
          </Window>
          <span className="absolute inset-0 bg-gradient-to-t from-ink-0 via-ink-0/70 to-ink-0/10 lg:bg-gradient-to-r lg:from-ink-0/95 lg:via-ink-0/70 lg:to-transparent" aria-hidden />

          <div className="relative z-[3] w-full max-w-[700px] p-5 md:p-10 lg:p-14">
            <RevealText as="h2" by="chars" start="top 70%" className="t-h2">
              {t.organisers.title}
            </RevealText>
            <RevealText as="p" by="lines" start="top 70%" delay={0.2} className="t-lede mt-5 max-w-[44ch] text-paper-2">
              {t.organisers.body}
            </RevealText>
            <RevealBlock as="ul" start="top 62%" className="mt-8">
              {t.organisers.services.map((s) => (
                <li key={s.t} data-rv-item className="grid gap-x-6 gap-y-1 border-t border-line-2 py-4 sm:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
                  <span className="t-h3">{s.t}</span>
                  <span className="text-paper-2">{s.d}</span>
                </li>
              ))}
            </RevealBlock>
            <LLink href="/veranstalter" className="btn btn-paper mt-6">
              {t.organisers.cta}
              <ArrowRightIcon size={16} weight="bold" />
            </LLink>
          </div>
        </Expand>
      </div>
    </AmbientZone>
  );
}
