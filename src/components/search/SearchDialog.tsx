"use client";

import { ArrowRightIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useScrollLock } from "@/components/shell/SmoothScroll";
import { LLink, useI18n } from "@/i18n/client";
import { fill } from "@/i18n/config";
import { search, type SearchDoc } from "@/lib/search";
import { ui, useUi } from "@/lib/store";
import { SearchField } from "./SearchField";
import { SearchResults, useHitKeys } from "./SearchResults";
import { useSearchIndex } from "./useSearchIndex";

const EASE = [0.16, 1, 0.3, 1] as const;
const LIMITS = { event: 4, media: 8, page: 4 };

const typing = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));

/** The search overlay. Opens from the header button, Ctrl/Cmd K or "/". */
export function SearchDialog() {
  const { searchOpen } = useUi();
  useScrollLock(searchOpen);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (searchOpen) ui.closeSearch();
        else ui.openSearch();
      } else if (e.key === "/" && !searchOpen && !typing(e.target)) {
        e.preventDefault();
        ui.openSearch();
      } else if (e.key === "Escape" && searchOpen) {
        ui.closeSearch();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchOpen]);

  return <AnimatePresence>{searchOpen && <Panel />}</AnimatePresence>;
}

function Panel() {
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const { docs, failed, retry } = useSearchIndex(true);
  const groups = useMemo(() => (docs ? search(docs, q) : null), [docs, q]);
  const keys = useHitKeys(input);
  const close = ui.closeSearch;
  const hasQuery = q.trim().length > 0;
  const more = groups && groups.total > LIMITS.event + LIMITS.media + LIMITS.page;

  // Give focus back to whatever opened the dialog.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    return () => opener?.focus?.();
  }, []);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={t.search.title}>
      <motion.button
        type="button"
        tabIndex={-1}
        aria-label={t.search.close}
        onClick={close}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="absolute inset-0 cursor-default bg-ink-0/75 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.35, ease: EASE }}
        onKeyDown={keys}
        className="absolute inset-x-0 top-0 mx-auto flex h-[100dvh] w-full max-w-3xl flex-col bg-ink-1 sm:top-[8vh] sm:h-auto sm:max-h-[84vh] sm:w-[calc(100%-2rem)] sm:rounded-panel sm:border sm:border-line"
      >
        <div className="flex items-center gap-2 border-b border-line p-3 sm:p-4">
          <SearchField inputRef={input} value={q} onChange={setQ} autoFocus className="flex-1" />
          <button
            type="button"
            onClick={close}
            aria-label={t.search.close}
            className="grid size-12 shrink-0 place-items-center rounded-full border border-line text-paper transition-colors hover:bg-white/10"
          >
            <XIcon size={18} weight="bold" />
          </button>
        </div>

        <div data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4">
          {failed ? (
            <div className="py-8">
              <p className="text-paper-2">{t.search.failed}</p>
              <button type="button" onClick={retry} className="btn btn-sm btn-line mt-4">
                {t.search.open}
              </button>
            </div>
          ) : !docs || !groups ? (
            <p className="t-hud py-8 text-paper-3" role="status">
              {t.search.loading}
            </p>
          ) : hasQuery ? (
            <>
              <SearchResults groups={groups} query={q} limits={LIMITS} onPick={close} />
              {more && (
                <LLink href={`/suche?q=${encodeURIComponent(q.trim())}`} data-hit onClick={close} className="btn btn-sm btn-line mt-6">
                  {fill(t.search.allN, { n: groups.total })}
                  <ArrowRightIcon size={15} weight="bold" />
                </LLink>
              )}
            </>
          ) : (
            <Suggestions
              docs={docs}
              onPick={(w) => {
                setQ(w);
                input.current?.focus();
              }}
              onOpen={close}
            />
          )}
          <p className="sr-only" aria-live="polite">
            {hasQuery && groups ? (groups.total === 1 ? t.search.countOne : fill(t.search.count, { n: groups.total })) : ""}
          </p>
        </div>

        <div className="hidden items-center justify-between gap-4 border-t border-line px-4 py-3 sm:flex">
          <span className="t-hud text-paper-3">{t.search.keys}</span>
          <kbd className="chip !h-6 !px-2">Esc</kbd>
        </div>
      </motion.div>
    </div>
  );
}

/** Before anything is typed: the sports and cities as one-tap searches, then the newest events. */
export function Suggestions({ docs, onPick, onOpen }: { docs: SearchDoc[]; onPick: (q: string) => void; onOpen?: () => void }) {
  const { t } = useI18n();
  const evs = docs.filter((d) => d.kind === "event").sort((a, b) => (b.rank ?? "").localeCompare(a.rank ?? ""));
  const quick = [...new Set(evs.flatMap((d) => (d.sub ?? "").split(" / ").slice(0, 2)))];
  const latest = evs.slice(0, 4).map((doc) => ({ doc, score: 1 }));

  return (
    <div className="space-y-8">
      <section>
        <h3 className="t-hud mb-3 text-paper-3">{t.search.quick}</h3>
        <ul className="flex flex-wrap gap-2">
          {quick.map((w) => (
            <li key={w}>
              <button type="button" data-hit className="chip" onClick={() => onPick(w)}>
                {w}
              </button>
            </li>
          ))}
        </ul>
      </section>
      <SearchResults groups={{ event: latest, media: [], page: [], total: latest.length }} query="" onPick={onOpen} />
    </div>
  );
}
