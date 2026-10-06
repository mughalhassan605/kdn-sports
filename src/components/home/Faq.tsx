"use client";

import { PlusIcon } from "@phosphor-icons/react/dist/ssr";
import { AnimatePresence, motion } from "motion/react";
import { useId, useState } from "react";
import { RevealBlock, RevealText } from "@/components/fx/Reveal";
import { site } from "@/data/site";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/cn";

export function Faq() {
  const { t } = useI18n();
  const [open, setOpen] = useState<number | null>(0);
  const uid = useId();

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
      <div className="lg:col-span-4">
        <RevealText as="h2" className="t-h2">
          {t.faq.title}
        </RevealText>
        <p className="mt-6 text-paper-2">
          {t.faq.contact}
          <br />
          <a href={`mailto:${site.email}`} className="link-u text-paper">
            {site.email}
          </a>
        </p>
      </div>

      <RevealBlock as="ul" className="lg:col-span-8">
        {t.faq.items.map((item, i) => {
          const on = open === i;
          return (
            <li key={item.q} data-rv-item className="border-t border-line last:border-b">
              <h3>
                <button
                  type="button"
                  aria-expanded={on}
                  aria-controls={`${uid}-${i}`}
                  onClick={() => setOpen(on ? null : i)}
                  className="group flex w-full items-center justify-between gap-6 py-5 text-left"
                >
                  <span className={cn("t-h3 transition-colors duration-300", on ? "text-paper" : "text-paper-2 group-hover:text-paper")}>{item.q}</span>
                  <span
                    className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-full border transition-[transform,background-color,border-color,color] duration-500 ease-out-expo",
                      on ? "rotate-45 border-paper bg-paper text-ink-0" : "border-line-2 text-paper",
                    )}
                  >
                    <PlusIcon size={15} weight="bold" />
                  </span>
                </button>
              </h3>
              <AnimatePresence initial={false}>
                {on && (
                  <motion.div
                    id={`${uid}-${i}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="max-w-[62ch] pb-6 text-paper-2">{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </RevealBlock>
    </div>
  );
}
