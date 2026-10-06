"use client";

import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { useMemo, useRef, useState } from "react";
import { RevealText } from "@/components/fx/Reveal";
import { SearchField } from "@/components/search/SearchField";
import { SearchResults, useHitKeys } from "@/components/search/SearchResults";
import { useSearchIndex } from "@/components/search/useSearchIndex";
import { LLink, useI18n } from "@/i18n/client";
import { fill } from "@/i18n/config";
import { search } from "@/lib/search";

const LIMITS = { event: 3, media: 6, page: 2 };

/**
 * Search on the home page, right under the opening: one big field, the sports
 * and cities as one-tap searches, and the first hits in place. The index only
 * loads once someone reaches for the field.
 */
export function SearchSection({ quick }: { quick: string[] }) {
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const [wanted, setWanted] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const keys = useHitKeys(input);
  const { docs, failed, retry } = useSearchIndex(wanted);
  const groups = useMemo(() => (docs ? search(docs, q) : null), [docs, q]);
  const term = q.trim();
  const more = groups && groups.total > LIMITS.event + LIMITS.media + LIMITS.page;

  const pick = (w: string) => {
    setWanted(true);
    setQ(w);
    input.current?.focus();
  };

  return (
    <section id="suche" aria-label={t.search.title} className="sec relative z-10 scroll-mt-16">
      <div className="wrap grid gap-8 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-5">
          <RevealText as="h2" by="chars" className="t-h2 max-w-[12ch]">
            {t.search.sectionTitle}
          </RevealText>
          <RevealText as="p" by="lines" delay={0.15} className="t-lede mt-5 max-w-[42ch]">
            {t.search.sectionSub}
          </RevealText>
        </div>

        <div className="lg:col-span-7" onKeyDown={keys}>
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              input.current?.blur();
            }}
          >
            <SearchField
              inputRef={input}
              size="lg"
              value={q}
              onChange={(v) => {
                setWanted(true);
                setQ(v);
              }}
              onFocus={() => setWanted(true)}
              onPointerEnter={() => setWanted(true)}
            />
          </form>

          {!term ? (
            <div className="mt-5">
              <p className="t-hud mb-3 text-paper-3">{t.search.quick}</p>
              <ul className="flex flex-wrap gap-2">
                {quick.map((w) => (
                  <li key={w}>
                    <button type="button" className="chip" onClick={() => pick(w)}>
                      {w}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : failed ? (
            <div className="mt-6">
              <p className="text-paper-2">{t.search.failed}</p>
              <button type="button" onClick={retry} className="btn btn-sm btn-line mt-4">
                {t.search.open}
              </button>
            </div>
          ) : !groups ? (
            <p className="t-hud mt-6 text-paper-3" role="status">
              {t.search.loading}
            </p>
          ) : (
            <div className="panel mt-4 p-3 md:p-4">
              <SearchResults groups={groups} query={q} limits={LIMITS} />
              {groups.total > 0 && (
                <LLink href={`/suche?q=${encodeURIComponent(term)}`} data-hit className="btn btn-sm btn-line mt-6">
                  {more ? fill(t.search.allN, { n: groups.total }) : t.search.all}
                  <ArrowRightIcon size={15} weight="bold" />
                </LLink>
              )}
              <p className="sr-only" aria-live="polite">
                {groups.total === 1 ? t.search.countOne : fill(t.search.count, { n: groups.total })}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
