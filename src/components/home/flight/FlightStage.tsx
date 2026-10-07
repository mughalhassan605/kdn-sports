"use client";

import { ArrowRightIcon, ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useScrollLock } from "@/components/shell/SmoothScroll";
import { site } from "@/data/site";
import { LLink, useI18n } from "@/i18n/client";
import { ambient } from "@/lib/ambient";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { useLiteMode, usePrefersReducedMotion, useWebGL } from "@/lib/store";
import type { FlightItem, FlightState } from "./FlightScene";
import { heroRect, sourceOf, stagePixels } from "./layout";

const FlightScene = dynamic(() => import("./FlightScene"), { ssr: false });

// The full loader (counter, shutter) plays once per tab. Coming back to the
// home page later only opens the shutter as soon as the hero print is there.
const INTRO_KEY = "kdn.intro.v1";
let introSeen = false;

function hasSeenIntro() {
  if (introSeen) return true;
  try {
    introSeen = window.sessionStorage.getItem(INTRO_KEY) === "1";
  } catch {
    /* storage blocked: play the full intro */
  }
  return introSeen;
}

function markIntroSeen() {
  introSeen = true;
  try {
    window.sessionStorage.setItem(INTRO_KEY, "1");
  } catch {
    /* storage blocked: the module flag still covers this visit */
  }
}

// Measured once per page load: a resize re-lays the prints but never swaps their files.
let measured = 0;
const measurePixels = () => measured || (measured = stagePixels());
const noop = () => () => {};

type Props = {
  hero: FlightItem;
  items: FlightItem[];
  final: FlightItem;
  /** The gallery the flight lands on. */
  landing: { title: string; meta: string; href: string };
  /** Rendered instead when motion is reduced or WebGL is missing. */
  fallback: React.ReactNode;
};

const pad = (n: number, l: number) => String(n).padStart(l, "0");

/**
 * The opening, on one pinned stage:
 *   loader   focus brackets and a counter fed by real texture loading
 *   arrival  the hero print develops from a mosaic, the headline rises
 *   flight   the camera travels through the archive and lands on the newest
 *            gallery, which fills the frame.
 * The focus brackets are the through-line: around the hero, a reticle in
 * flight, locked on the landing.
 */
export function FlightStage({ hero, items, final, landing, fallback }: Props) {
  const { t } = useI18n();
  const reduce = usePrefersReducedMotion();
  const webgl = useWebGL();
  const lite = useLiteMode();
  const still = reduce || !webgl || lite;

  const root = useRef<HTMLElement>(null);
  const fx = useRef<FlightState>({ progress: 0, velocity: 0, pixel: 1, heroIn: 0, px: 0, py: 0 });
  const api = useRef<{ load: (pct: number) => void; ready: () => void } | null>(null);
  // The scene can report before the fonts are ready and the timeline exists: remember it.
  const pending = useRef({ pct: 0, ready: false });
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(!still);
  const [stream, setStream] = useState(false);
  const pixels = useSyncExternalStore(noop, measurePixels, () => 0);

  useScrollLock(!still && loading);

  // Safety unlock: guarantees scroll is never permanently locked
  useEffect(() => {
    if (still) {
      setLoading(false);
      return;
    }
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [still]);

  // Start the hero download while three.js is still on its way; the scene then finds it in the cache.
  useEffect(() => {
    if (still || !pixels) return;
    const warm = new Image();
    warm.src = sourceOf(hero, pixels);
  }, [still, pixels, hero]);

  const onLoad = useCallback((pct: number) => {
    pending.current.pct = pct;
    api.current?.load(pct);
  }, []);
  const onReady = useCallback(() => {
    pending.current.ready = true;
    api.current?.ready();
    // Download the rest of the archive now; it goes on the GPU once the opening is over.
    for (const item of [...items, final]) {
      const warm = new Image();
      warm.src = sourceOf(item, measurePixels());
    }
  }, [items, final]);
  const onNear = useCallback((item: FlightItem) => ambient.base(item.palette, 0.38), []);

  useGSAP(
    (context) => {
      const el = root.current;
      if (!el) return;
      const q = gsap.utils.selector(el);
      const state = fx.current;
      let dead = false;
      let cleanup = () => {};

      // Lines are measured, so wait for the real font before splitting.
      const build = () => {
        if (dead) return;
        context.add(() => {
          const box = q(".fl-box")[0];
          const h1 = q(".fl-h1")[0];
          const stretch = getComputedStyle(h1).fontStretch;

          const heroSplit = SplitText.create(h1, { type: "lines,words,chars", mask: "lines" });
          const said = SplitText.create(q(".fl-said"), { type: "lines,words,chars", mask: "lines" });
          const landed = SplitText.create(q(".fl-land-title"), { type: "lines,words", mask: "lines" });

          // The bracket box in three poses: reticle, around the hero print, locked on the whole frame.
          type Rect = { left: number; top: number; width: number; height: number };
          const stage = () => q(".fl-stage")[0].getBoundingClientRect();
          const reticle = (): Rect => {
            const r = stage();
            const size = Math.min(r.width, r.height) * 0.13;
            return { left: (r.width - size) / 2, top: (r.height - size) / 2, width: size, height: size };
          };
          const aroundHero = (): Rect => {
            const r = stage();
            const p = heroRect(hero.ratio, r.width / r.height);
            const m = 14;
            return {
              left: (p.left / 100) * r.width - m,
              top: (p.top / 100) * r.height - m,
              width: (p.width / 100) * r.width + m * 2,
              height: (p.height / 100) * r.height + m * 2,
            };
          };
          const locked = (): Rect => {
            const r = stage();
            const m = r.width < 768 ? 14 : 26;
            return { left: m, top: m + 56, width: r.width - m * 2, height: r.height - m * 2 - 56 };
          };
          // Function-based values, so a resize re-measures them.
          const pose = (fn: () => Rect) => ({
            left: () => fn().left,
            top: () => fn().top,
            width: () => fn().width,
            height: () => fn().height,
          });

          gsap.set(el, { autoAlpha: 1 });
          gsap.set(box, { ...aroundHero(), autoAlpha: 0 });
          gsap.set(q(".fl-said"), { autoAlpha: 1 });
          gsap.set(said.chars, { yPercent: 120 });

          // The scroll owns the outer wrappers, the intro owns what is inside
          // them, so the two can overlap without fighting over a property.
          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: el,
              start: "top top",
              end: "bottom bottom",
              scrub: 0.5,
              invalidateOnRefresh: true,
              onUpdate: (self) => {
                state.progress = self.progress;
                state.velocity = self.getVelocity();
                if (self.progress > 0.002) setStream(true);
              },
              onToggle: (self) => setActive(self.isActive),
            },
          });

          tl.to(q(".fl-out"), { autoAlpha: 0, y: -70, duration: 0.08, ease: "power1.in" }, 0.005)
            .fromTo(box, pose(aroundHero), { ...pose(reticle), duration: 0.1, ease: "power2.inOut", immediateRender: false }, 0.02)
            .to(said.chars, { yPercent: 0, stagger: 0.002, duration: 0.06, ease: "power3.out" }, 0.2)
            .to(said.chars, { yPercent: -120, stagger: 0.002, duration: 0.06, ease: "power3.in" }, 0.5)
            .fromTo(box, pose(reticle), { ...pose(locked), duration: 0.12, ease: "power2.inOut", immediateRender: false }, 0.68)
            .fromTo(q(".fl-land"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.05 }, 0.8)
            .from(landed.lines, { yPercent: 115, stagger: 0.012, duration: 0.07, ease: "power3.out" }, 0.81)
            .from(q(".fl-land-rise"), { autoAlpha: 0, y: 26, stagger: 0.012, duration: 0.05, ease: "power2.out" }, 0.84)
            .to(q(".fl-box i"), { borderColor: "#d4ff3f", duration: 0.02 }, 0.86)
            .set({}, {}, 1);

          const onMove = (e: PointerEvent) => {
            state.px = (e.clientX / window.innerWidth) * 2 - 1;
            state.py = -((e.clientY / window.innerHeight) * 2 - 1);
          };
          window.addEventListener("pointermove", onMove, { passive: true });

          const arrive = (instant: boolean) => {
            setLoading(false);
            markIntroSeen();
            if (instant) {
              setStream(true);
              gsap.set(q(".ld"), { autoAlpha: 0 });
              gsap.set(state, { pixel: 0, heroIn: 1 });
              gsap.set(q(".fl-box-in"), { autoAlpha: 1, scale: 1 });
              gsap.set(box, { autoAlpha: 1 });
              return;
            }
            gsap.set(box, { autoAlpha: 1 });
            gsap
              .timeline()
              .to(q(".ld-count"), { yPercent: -120, duration: 0.35, ease: "expo.in" })
              .to(q(".ld-mark"), { scale: 0.6, autoAlpha: 0, duration: 0.25, ease: "expo.in" }, "<")
              .to(q(".ld-note"), { autoAlpha: 0, duration: 0.2 }, "<")
              .to(q(".ld-top"), { yPercent: -101, duration: 0.55, ease: "expo.inOut" }, "-=0.15")
              .to(q(".ld-bot"), { yPercent: 101, duration: 0.55, ease: "expo.inOut" }, "<")
              .set(q(".ld"), { autoAlpha: 0 })
              .to(state, { heroIn: 1, duration: 0.5, ease: "power2.out" }, "-=0.5")
              .to(state, { pixel: 0, duration: 1.2, ease: "expo.out" }, "<0.1")
              .fromTo(h1, { fontStretch: "62%" }, { fontStretch: stretch, duration: 0.9, ease: "expo.out" }, "<0.1")
              .from(heroSplit.chars, { yPercent: 120, stagger: 0.015, duration: 0.8, ease: "expo.out" }, "<")
              .fromTo(q(".fl-box-in"), { scale: 0.2, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.8, ease: "expo.inOut" }, "<0.1")
              .from(q(".fl-rise"), { y: 34, autoAlpha: 0, stagger: 0.05, duration: 0.7, ease: "expo.out" }, "<0.2")
              .call(() => setStream(true));
          };

          // A reload that restores a scroll position mid-page skips the loader.
          const skip = window.scrollY > 40;
          // Seen it already in this tab: no counter, just the shutter once the hero is there.
          const brief = hasSeenIntro();
          if (brief) gsap.set(q(".ld-count, .ld-mark, .ld-note"), { autoAlpha: 0 });
          const counter = { v: 0 };
          const countEl = q(".ld-num")[0];
          let done = skip;
          let sceneReady = false;

          const aim = (target: number, duration = 0.4) =>
            gsap.to(counter, {
              v: target,
              duration,
              ease: "power2.out",
              overwrite: true,
              onUpdate: () => {
                countEl.textContent = pad(Math.round(counter.v), 3);
              },
              onComplete: () => {
                if (target >= 100 && !done) {
                  done = true;
                  arrive(false);
                }
              },
            });

          const finish = () => {
            if (done) return;
            if (brief) {
              done = true;
              arrive(false);
            } else aim(100, 0.25);
          };

          api.current = {
            load: (pct) => {
              if (!brief && !done && !sceneReady) aim(Math.min(100, 25 + pct * 0.75), 0.3);
            },
            ready: () => {
              sceneReady = true;
              finish();
            },
          };

          if (skip) arrive(true);
          else if (pending.current.ready) finish();
          else if (!brief) aim(75, 0.4);

          // Never trap a visitor behind the loader: open in 1.2s max!
          gsap.delayedCall(brief ? 0.8 : 1.2, finish);

          cleanup = () => {
            window.removeEventListener("pointermove", onMove);
            api.current = null;
            heroSplit.revert();
            said.revert();
            landed.revert();
          };
        });
      };

      document.fonts.ready.then(build);

      return () => {
        dead = true;
        cleanup();
      };
    },
    { scope: root, dependencies: [still], revertOnUpdate: true },
  );

  if (still) return <>{fallback}</>;

  return (
    <section ref={root} data-rv className="relative h-[300svh] md:h-[330svh]" aria-label={site.name}>
      <div className="fl-stage sticky top-0 h-[100svh] overflow-hidden">
        {pixels > 0 && (
          <FlightScene hero={hero} items={items} final={final} state={fx} active={active} pixels={pixels} stream={stream} onLoad={onLoad} onReady={onReady} onNear={onNear} />
        )}

        {/* A soft floor of shade so type stays readable over any print. */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-0/85 via-transparent to-ink-0/40" aria-hidden />

        {/* arrival */}
        <div className="fl-out wrap absolute inset-0 flex flex-col justify-end pb-8 pt-24 md:pb-12">
          <LLink href={landing.href} className="chip fl-rise self-start">
            {t.hero.chip}: {landing.title}
            <ArrowRightIcon size={13} weight="bold" />
          </LLink>
          <h1 className="fl-h1 t-hero mt-5 [text-shadow:0_2px_40px_rgb(8_8_10/0.55)]">
            {[t.hero.line1, t.hero.line2].map((line) => (
              <span key={line} className="block md:whitespace-nowrap">
                {line}
              </span>
            ))}
          </h1>
          <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <p className="t-lede fl-rise max-w-[42ch] text-paper [text-shadow:0_1px_24px_rgb(8_8_10/0.8)]">{t.hero.sub}</p>
            <div className="fl-rise flex shrink-0 flex-wrap gap-3">
              <LLink href="/events" className="btn btn-paper">
                {t.hero.cta}
                <ArrowRightIcon size={16} weight="bold" />
              </LLink>
              <a href="#ablauf" className="btn btn-line">
                {t.hero.cta2}
              </a>
            </div>
          </div>
        </div>

        {/* flight: one line the camera flies through */}
        <div className="pointer-events-none absolute inset-0 grid place-items-center px-5 text-center" aria-hidden>
          <p className="fl-said t-h1 invisible text-paper [text-shadow:0_2px_50px_rgb(8_8_10/0.7)]">{t.flight.s1}</p>
        </div>
        <p className="sr-only">{t.flight.s1}</p>

        {/* landing: the newest gallery fills the frame */}
        <div className="fl-land invisible absolute inset-0">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-0 via-ink-0/45 to-transparent" aria-hidden />
          <div className="wrap absolute inset-x-0 bottom-0 flex flex-col gap-6 pb-10 md:flex-row md:items-end md:justify-between md:pb-14">
            <div>
              <p className="fl-land-rise t-hud text-paper-2">{landing.meta}</p>
              <p className="fl-land-title t-h1 mt-3 text-paper">{landing.title}</p>
            </div>
            <div className="fl-land-rise flex shrink-0 flex-wrap gap-3">
              <LLink href={landing.href} className="btn btn-paper" data-cursor={t.cursor.open}>
                {t.events.open}
                <ArrowUpRightIcon size={16} weight="bold" />
              </LLink>
              <LLink href="/events" className="btn btn-line">
                {t.events.all}
              </LLink>
            </div>
          </div>
        </div>

        {/* The focus brackets. */}
        <div className="fl-box pointer-events-none invisible absolute" aria-hidden>
          <div className="fl-box-in absolute inset-0">
            <i className="absolute left-0 top-0 size-4 border-l-[1.5px] border-t-[1.5px] border-paper" />
            <i className="absolute right-0 top-0 size-4 border-r-[1.5px] border-t-[1.5px] border-paper" />
            <i className="absolute bottom-0 left-0 size-4 border-b-[1.5px] border-l-[1.5px] border-paper" />
            <i className="absolute bottom-0 right-0 size-4 border-b-[1.5px] border-r-[1.5px] border-paper" />
          </div>
        </div>

        {/* loader: two shutter blades and a counter fed by texture loading */}
        <div className="ld absolute inset-0 z-[5]" role="status" aria-label={t.loader.label}>
          <div className="ld-top absolute inset-x-0 top-0 h-1/2 bg-ink-0" />
          <div className="ld-bot absolute inset-x-0 bottom-0 h-1/2 bg-ink-0" />
          <div className="ld-mark absolute left-1/2 top-1/2 size-16 -translate-x-1/2 -translate-y-1/2">
            <i className="absolute left-0 top-0 size-4 border-l-2 border-t-2 border-paper" />
            <i className="absolute right-0 top-0 size-4 border-r-2 border-t-2 border-paper" />
            <i className="absolute bottom-0 left-0 size-4 border-b-2 border-l-2 border-paper" />
            <i className="absolute bottom-0 right-0 size-4 border-b-2 border-r-2 border-paper" />
            <i className="absolute left-1/2 top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-glow" />
          </div>
          <div className="wrap absolute inset-x-0 bottom-6 flex items-end justify-between overflow-hidden md:bottom-10">
            <span className="ld-note t-hud pb-3 text-paper-3">{t.loader.label}</span>
            <span className="ld-count t-num block text-[clamp(5rem,17vw,15rem)]">
              <span className="ld-num">000</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
