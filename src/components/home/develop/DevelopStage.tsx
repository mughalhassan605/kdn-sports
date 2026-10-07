"use client";
/* eslint-disable @next/next/no-img-element -- pre-sized derivatives, see Shot.tsx */

import { DownloadSimpleIcon, LockSimpleIcon, LockSimpleOpenIcon } from "@phosphor-icons/react/dist/ssr";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { paymentMethods } from "@/data/site";
import { useI18n } from "@/i18n/client";
import { ambient } from "@/lib/ambient";
import { cn } from "@/lib/cn";
import { gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";
import { useLiteMode, usePrefersReducedMotion, useWebGL } from "@/lib/store";
import type { DevelopState } from "./DevelopScene";

const DevelopScene = dynamic(() => import("./DevelopScene"), { ssr: false });

type Props = {
  preview: string;
  clean: string;
  ratio: number;
  palette: string[];
  /** Rendered instead when motion is reduced or WebGL is missing. */
  fallback: React.ReactNode;
};

/**
 * The product explained by the scroll itself: four steps on the
 * left, one print on the right. Scrolling finds it (the mosaic resolves),
 * pays for it, and develops it: a front of light crosses the frame and the
 * watermark is gone behind it.
 */
export function DevelopStage({ preview, clean, ratio, palette, fallback }: Props) {
  const { t } = useI18n();
  const reduce = usePrefersReducedMotion();
  const webgl = useWebGL();
  const lite = useLiteMode();
  const still = reduce || !webgl || lite;
  const root = useRef<HTMLElement>(null);
  const fx = useRef<DevelopState>({ dissolve: 0, pixel: 0.9 });
  const step = useRef(0);
  const [active, setActive] = useState(false);
  // The shader (and its two textures) only loads once the scene is a screen away, not with the page.
  const [near, setNear] = useState(false);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const el = root.current;
    if (!el || near) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "100% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [still, near]);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const q = gsap.utils.selector(el);
      const state = fx.current;
      const title = SplitText.create(q(".dv-title"), { type: "lines,words", mask: "lines" });

      gsap.set(el, { autoAlpha: 1 });
      gsap.set(q(".dv-pay, .dv-done"), { autoAlpha: 0 });

      const setStep = (i: number) => {
        if (i === step.current) return;
        step.current = i;
        setCurrent(i);
      };

      gsap
        .timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: el,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.5,
            onUpdate: (self) => {
              const p = self.progress;
              setStep(p < 0.28 ? 0 : p < 0.47 ? 1 : p < 0.64 ? 2 : 3);
            },
          },
        })
        // 1 find: the mosaic resolves into the preview
        .fromTo(state, { pixel: 0.9 }, { pixel: 0, duration: 0.24, ease: "power2.out" }, 0.06)
        // 3 pay
        .fromTo(q(".dv-pay"), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.04 }, 0.47)
        .fromTo(q(".dv-method"), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, stagger: 0.012, duration: 0.03 }, 0.48)
        .to(q(".dv-method-on"), { backgroundColor: "#d4ff3f", color: "#11150a", borderColor: "#d4ff3f", duration: 0.02 }, 0.57)
        .to(q(".dv-pay"), { autoAlpha: 0, y: -14, duration: 0.03 }, 0.63)
        // 4 develop
        .fromTo(state, { dissolve: 0 }, { dissolve: 1, duration: 0.25, ease: "power1.inOut" }, 0.65)
        .to(q(".dv-lock"), { autoAlpha: 0, duration: 0.02 }, 0.88)
        .to(q(".dv-done"), { autoAlpha: 1, duration: 0.03 }, 0.9)
        .to(q(".dv-corner"), { borderColor: "#d4ff3f", duration: 0.02 }, 0.9)
        .set({}, {}, 1);

      // Render the shader for as long as any part of the scene is on screen, and light the page from the print.
      ScrollTrigger.create({
        trigger: el,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => {
          setActive(self.isActive);
          if (self.isActive) ambient.base(palette, 0.3);
        },
      });

      // The headline and the frame arrive as the scene comes up.
      gsap.from(title.lines, {
        yPercent: 115,
        stagger: 0.1,
        duration: 1.2,
        ease: "expo.out",
        scrollTrigger: { trigger: el, start: "top 55%", toggleActions: "play none none none" },
      });
      gsap.fromTo(
        q(".dv-frame"),
        { clipPath: "inset(48% 0% 48% 0%)" },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 1.5,
          ease: "expo.inOut",
          scrollTrigger: { trigger: el, start: "top 60%", toggleActions: "play none none none" },
        },
      );

      return () => title.revert();
    },
    { scope: root, dependencies: [still, palette.join()], revertOnUpdate: true },
  );

  if (still) return <>{fallback}</>;

  return (
    <section ref={root} data-rv id="ablauf" className="relative h-[250svh] scroll-mt-0">
      <div className="sticky top-0 h-[100svh] overflow-hidden">

        <div className="wrap relative grid h-full content-center gap-x-8 gap-y-5 pb-6 pt-20 lg:grid-cols-12 lg:grid-rows-[auto_auto] lg:pb-10 lg:pt-24">
          <h2 className="dv-title t-h2 max-w-[14ch] lg:col-span-5 lg:row-start-1 lg:self-end">{t.how.title}</h2>

          {/* Phones show one step at a time under the print; desktop keeps the full list beside it. */}
          <ol className="max-lg:order-3 max-lg:min-h-[6.5rem] lg:col-span-5 lg:row-start-2 lg:mt-4 lg:self-start">
            {t.how.steps.map((s, i) => (
              <li
                key={s.t}
                aria-current={i === current ? "step" : undefined}
                className={cn(
                  "relative grid-cols-[2.25rem_minmax(0,1fr)] items-baseline gap-x-3 border-t border-line py-3 transition-colors duration-500 lg:grid lg:grid-cols-[2.75rem_minmax(0,1fr)] lg:py-5 lg:last:border-b",
                  i === current ? "grid text-paper" : "hidden text-paper-3",
                )}
              >
                <span aria-hidden className={cn("absolute -top-px left-0 h-px bg-glow transition-[width] duration-700 ease-out-expo", i === current ? "w-full" : "w-0")} />
                <span className={cn("t-num text-[2rem] transition-colors duration-500 lg:text-[2.5rem]", i === current ? "text-glow" : "text-paper-3")}>{i + 1}</span>
                <span>
                  <span className={cn("t-h3 block transition-colors duration-500", i === current ? "text-paper" : "text-paper-2")}>{s.t}</span>
                  <span className="mt-1.5 block max-w-[40ch] text-[0.9375rem] text-paper-2">{s.d}</span>
                </span>
              </li>
            ))}
          </ol>

          <div className="relative max-lg:order-2 lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1 lg:self-center">
            <div className="relative mx-auto w-full max-w-[min(100%,calc((100svh-21rem)*var(--ratio)))] lg:max-w-[min(100%,calc((100svh-11rem)*var(--ratio)))]" style={{ aspectRatio: ratio, "--ratio": ratio } as React.CSSProperties}>
              <div className="dv-frame absolute inset-0 overflow-hidden rounded-media bg-ink-2">
                {/* Until the shader has its textures, the preview is simply there. */}
                <img src={preview} alt="" className="absolute inset-0 size-full object-cover" loading="lazy" decoding="async" />
                {near && <DevelopScene preview={preview} clean={clean} ratio={ratio} state={fx} active={active} />}
              </div>

              {/* focus brackets, outside the print */}
              <span className="pointer-events-none absolute -inset-3" aria-hidden>
                <i className="dv-corner absolute left-0 top-0 size-4 border-l-[1.5px] border-t-[1.5px] border-paper" />
                <i className="dv-corner absolute right-0 top-0 size-4 border-r-[1.5px] border-t-[1.5px] border-paper" />
                <i className="dv-corner absolute bottom-0 left-0 size-4 border-b-[1.5px] border-l-[1.5px] border-paper" />
                <i className="dv-corner absolute bottom-0 right-0 size-4 border-b-[1.5px] border-r-[1.5px] border-paper" />
              </span>

              <span className="dv-lock t-hud absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-ink-0/70 px-2.5 py-1.5 text-paper backdrop-blur-sm sm:left-4 sm:top-4">
                <LockSimpleIcon size={13} weight="bold" />
                {t.how.locked}
              </span>
              <span className="dv-done t-hud invisible absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-glow px-2.5 py-1.5 text-glow-ink sm:left-4 sm:top-4">
                <LockSimpleOpenIcon size={13} weight="bold" />
                {t.how.unlocked}
              </span>

              <div className="dv-pay invisible absolute inset-x-0 bottom-4 flex flex-wrap justify-center gap-2 px-3 sm:bottom-6">
                {paymentMethods.slice(0, 4).map((m, i) => (
                  <span key={m} className={cn("dv-method chip !h-9 !bg-ink-0/75 backdrop-blur-sm", i === 0 && "dv-method-on")}>
                    {t.checkout.methods[m]}
                  </span>
                ))}
              </div>
              <div className="dv-done invisible absolute inset-x-0 bottom-4 flex justify-center sm:bottom-6">
                <span className="btn btn-sm btn-glow pointer-events-none">
                  <DownloadSimpleIcon size={15} weight="bold" />
                  {t.order.download}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
