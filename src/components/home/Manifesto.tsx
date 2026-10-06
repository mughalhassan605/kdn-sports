import { ScrubWords } from "@/components/fx/Reveal";
import { Drift } from "@/components/fx/Scroll";
import { Shot, Viewfinder } from "@/components/media/Shot";
import { AmbientZone } from "@/components/shell/Ambient";
import { HoverLight } from "@/components/ui/HoverLight";
import { mustMedia } from "@/data/media";
import { getI18n } from "@/i18n/server";

const SIDE = ["sl-002", "fn-004"];

/**
 * A quiet scene between two loud ones: one statement that lights up word by
 * word as it is scrolled, with two prints drifting past at their own speed.
 */
export async function Manifesto() {
  const { t } = await getI18n();
  const [a, b] = SIDE.map(mustMedia);

  return (
    <AmbientZone as="section" palette={a.palette} level={0.26} className="sec overflow-x-clip">
      <div className="wrap grid items-center gap-10 lg:grid-cols-12 lg:gap-8">
        <ScrubWords className="text-[clamp(1.6rem,3.55vw,3.4rem)] font-[730] leading-[1.07] tracking-[-0.02em] text-paper [font-stretch:108%] lg:col-span-8">
          {t.manifesto}
        </ScrubWords>

        <div className="relative hidden h-[34rem] lg:col-span-4 lg:block" aria-hidden>
          <Drift amount={34} className="absolute right-0 top-0 w-[62%]">
            <HoverLight palette={a.palette} className="vf-host relative overflow-hidden rounded-media" style={{ aspectRatio: a.w / a.h }}>
              <Shot m={a} variant="clean" sizes="22vw" />
              <Viewfinder />
            </HoverLight>
          </Drift>
          <Drift amount={-22} className="absolute bottom-0 left-0 w-[54%]">
            <HoverLight palette={b.palette} className="vf-host relative overflow-hidden rounded-media" style={{ aspectRatio: b.w / b.h }}>
              <Shot m={b} variant="clean" sizes="18vw" />
              <Viewfinder />
            </HoverLight>
          </Drift>
        </div>
      </div>
    </AmbientZone>
  );
}
