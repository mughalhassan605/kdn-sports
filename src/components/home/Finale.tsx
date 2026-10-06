"use client";
/* eslint-disable @next/next/no-img-element -- pre-sized derivatives, see Shot.tsx */

import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { useRef } from "react";
import { src } from "@/data/media";
import { LLink, useI18n } from "@/i18n/client";
import { ambient } from "@/lib/ambient";
import { gsap, prefersReducedMotion, SplitText, useGSAP } from "@/lib/gsap";

export type WallItem = { id: string; avg: string };

/**
 * The close. A wall of prints comes up tile by tile behind one line and one
 * button; the focus brackets settle on the button. No pin: it plays once as
 * the section arrives and the wall keeps drifting with the scroll.
 */
export function Finale({ items, palette }: { items: WallItem[]; palette: string[] }) {
  const { t } = useI18n();
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const q = gsap.utils.selector(el);
      gsap.set(el, { autoAlpha: 1 });
      if (prefersReducedMotion()) return;

      const title = q(".fn-title")[0];
      const stretch = getComputedStyle(title).fontStretch;
      const split = SplitText.create(title, { type: "lines,words,chars", mask: "lines" });

      gsap
        .timeline({
          scrollTrigger: {
            trigger: el,
            start: "top 62%",
            toggleActions: "play none none none",
            onEnter: () => ambient.base(palette, 0.34),
            onEnterBack: () => ambient.base(palette, 0.34),
          },
        })
        .from(q(".fn-tile"), { autoAlpha: 0, scale: 0.72, duration: 1.2, ease: "expo.out", stagger: { each: 0.035, from: "center", grid: "auto" } })
        .fromTo(title, { fontStretch: "62%" }, { fontStretch: stretch, duration: 1.5, ease: "expo.out" }, 0.25)
        .from(split.chars, { yPercent: 120, stagger: 0.022, duration: 1.1, ease: "expo.out" }, 0.25)
        .from(q(".fn-cta"), { autoAlpha: 0, y: 28, duration: 0.9, ease: "expo.out" }, 0.8)
        .fromTo(q(".fn-box"), { inset: "-44px -60px", autoAlpha: 0 }, { inset: "-12px -14px", autoAlpha: 1, duration: 1.1, ease: "expo.out" }, 0.95)
        .to(q(".fn-box i"), { borderColor: "#d4ff3f", duration: 0.3 }, 1.7);

      gsap.fromTo(
        q(".fn-wall"),
        { yPercent: -7 },
        { yPercent: 7, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } },
      );

      return () => split.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} data-rv className="relative flex min-h-[100svh] items-center justify-center overflow-hidden py-24">
      <div className="fn-wall absolute -inset-y-[8%] inset-x-0 grid grid-cols-3 grid-rows-5 gap-1.5 p-1.5 sm:grid-cols-4 md:grid-cols-6 md:grid-rows-4 md:gap-2 md:p-2" aria-hidden>
        {items.map((m, i) => (
          <div
            key={m.id}
            className={`fn-tile overflow-hidden rounded-media ${i >= 15 ? "max-sm:hidden" : ""} ${i >= 20 ? "max-md:hidden" : ""}`}
            style={{ backgroundColor: m.avg }}
          >
            <img src={src.thumb(m.id)} alt="" loading="lazy" decoding="async" draggable={false} className="size-full object-cover" />
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-ink-0/75" aria-hidden />

      <div className="wrap relative text-center">
        <h2 className="fn-title t-hero mx-auto max-w-[16ch]">
          {t.finale.line1} {t.finale.line2}
        </h2>
        <div className="fn-cta relative mt-8 inline-block md:mt-10">
          <LLink href="/events" className="btn btn-glow h-14 px-8 text-base">
            {t.hero.cta}
            <ArrowRightIcon size={18} weight="bold" />
          </LLink>
          <span className="fn-box pointer-events-none absolute" style={{ inset: "-12px -14px" }} aria-hidden>
            <i className="absolute left-0 top-0 size-3.5 border-l-[1.5px] border-t-[1.5px] border-paper" />
            <i className="absolute right-0 top-0 size-3.5 border-r-[1.5px] border-t-[1.5px] border-paper" />
            <i className="absolute bottom-0 left-0 size-3.5 border-b-[1.5px] border-l-[1.5px] border-paper" />
            <i className="absolute bottom-0 right-0 size-3.5 border-b-[1.5px] border-r-[1.5px] border-paper" />
          </span>
        </div>
      </div>
    </section>
  );
}
