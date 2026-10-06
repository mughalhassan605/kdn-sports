"use client";

import { ArrowCounterClockwiseIcon, CircleNotchIcon, LockSimpleIcon, LockSimpleOpenIcon, PlayIcon } from "@phosphor-icons/react/dist/ssr";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Viewfinder } from "@/components/media/Shot";
import { UnlockFrame } from "@/components/media/UnlockFrame";
import { AmbientZone } from "@/components/shell/Ambient";
import { Reveal } from "@/components/ui/Motion";
import { mustMedia, src } from "@/data/media";
import { useI18n } from "@/i18n/client";
import { spillVars } from "@/lib/ambient";
import { cn } from "@/lib/cn";

type Phase = "preview" | "paying" | "unlocking" | "done";

const DEMO = "hc-001";
const stepOf: Record<Phase, number> = { preview: 1, paying: 2, unlocking: 3, done: 3 };

/** The four steps, with the real unlock playing beside them. The list follows the demo. */
export function HowItWorks() {
  const { t } = useI18n();
  const m = mustMedia(DEMO);
  const [phase, setPhase] = useState<Phase>("preview");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const play = () => {
    setPhase("paying");
    timer.current = setTimeout(() => setPhase("unlocking"), 1100);
  };
  const reset = () => {
    clearTimeout(timer.current);
    setPhase("preview");
  };

  const active = stepOf[phase];
  const unlocked = phase === "unlocking" || phase === "done";

  return (
    <AmbientZone as="section" palette={m.palette} className="sec scroll-mt-16 overflow-x-clip" id="ablauf">
      <div className="wrap grid items-center gap-10 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-5">
          <h2 className="t-h2 max-w-[14ch]">{t.how.title}</h2>
          <ol className="mt-8 md:mt-10">
            {t.how.steps.map((s, i) => (
              <li
                key={s.t}
                aria-current={i === active ? "step" : undefined}
                className={cn(
                  "relative grid grid-cols-[2.75rem_minmax(0,1fr)] items-baseline gap-x-3 border-t border-line py-5 transition-colors duration-500 last:border-b",
                  i === active ? "text-paper" : "text-paper-3",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "absolute -top-px left-0 h-px bg-glow transition-[width] duration-700 ease-out-expo",
                    i === active ? "w-full" : "w-0",
                  )}
                />
                <span className={cn("t-num text-[2.5rem] transition-colors duration-500", i === active ? "text-glow" : "text-paper-3")}>{i + 1}</span>
                <span>
                  <span className={cn("t-h3 block transition-colors duration-500", i === active ? "text-paper" : "text-paper-2")}>{s.t}</span>
                  <span className="mt-1.5 block max-w-[40ch] text-[0.9375rem] text-paper-2">{s.d}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        <Reveal className="lg:col-span-7">
          <div className="spill relative" style={{ ...spillVars(m.palette), "--spill": 0.4 } as React.CSSProperties}>
            <UnlockFrame
              preview={src.preview(m.id)}
              clean={src.clean(m.id)}
              alt=""
              unlocked={unlocked}
              onDone={() => setPhase("done")}
              className="aspect-[3/2] w-full"
            />
            <Viewfinder on out tone={phase === "done" ? "glow" : undefined} />

            <span
              className={cn(
                "t-hud absolute left-3 top-3 z-[3] flex items-center gap-1.5 rounded-full bg-ink-0/70 px-2.5 py-1.5 backdrop-blur-sm transition-colors duration-500 sm:left-4 sm:top-4",
                phase === "done" ? "text-glow" : "text-paper",
              )}
            >
              {phase === "done" ? <LockSimpleOpenIcon size={13} weight="bold" /> : <LockSimpleIcon size={13} weight="bold" />}
              {phase === "done" ? t.how.unlocked : t.how.locked}
            </span>

            <div className="absolute inset-x-0 bottom-4 z-[3] flex justify-center px-4 sm:bottom-6">
              <AnimatePresence mode="wait" initial={false}>
                {phase === "preview" && (
                  <motion.button
                    key="play"
                    type="button"
                    onClick={play}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.3 }}
                    className="btn btn-glow"
                  >
                    <PlayIcon size={15} weight="fill" />
                    {t.how.play}
                  </motion.button>
                )}
                {phase === "paying" && (
                  <motion.span
                    key="paying"
                    role="status"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.3 }}
                    className="panel flex h-12 items-center gap-2.5 rounded-full px-5 text-[0.9375rem] font-[620] text-paper"
                  >
                    <CircleNotchIcon size={16} weight="bold" className="animate-spin" />
                    {t.checkout.paying}
                  </motion.span>
                )}
                {phase === "done" && (
                  <motion.button
                    key="reset"
                    type="button"
                    onClick={reset}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.3 }}
                    className="btn btn-sm btn-line"
                  >
                    <ArrowCounterClockwiseIcon size={15} weight="bold" />
                    {t.how.reset}
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </Reveal>
      </div>
    </AmbientZone>
  );
}
