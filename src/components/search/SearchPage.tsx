"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useRef, useState } from "react";
import { useI18n } from "@/i18n/client";
import { fill, localePath } from "@/i18n/config";
import { search, type SearchDoc } from "@/lib/search";
import { Suggestions } from "./SearchDialog";
import { SearchField } from "./SearchField";
import { SearchResults, useHitKeys } from "./SearchResults";

/** The /suche page. The query lives in ?q= so a search can be shared; the page itself is static. */
export function SearchPage({ index }: { index: SearchDoc[] }) {
  return (
    <Suspense fallback={<View index={index} initial="" />}>
      <Live index={index} />
    </Suspense>
  );
}

function Live({ index }: { index: SearchDoc[] }) {
  return <View index={index} initial={useSearchParams().get("q") ?? ""} />;
}

function View({ index, initial }: { index: SearchDoc[]; initial: string }) {
  const { t, locale } = useI18n();
  const [q, setQ] = useState(initial);
  // Follow the address when it changes from outside (the header dialog's "see all" link).
  const [seen, setSeen] = useState(initial);
  if (initial !== seen) {
    setSeen(initial);
    setQ(initial);
  }
  const input = useRef<HTMLInputElement>(null);
  const keys = useHitKeys(input);
  const groups = useMemo(() => search(index, q), [index, q]);
  const hasQuery = q.trim().length > 0;

  const change = (v: string) => {
    const term = v.trim();
    setQ(v);
    // Remember what goes into the address, so its echo does not eat a trailing space while typing.
    setSeen(term);
    // Keep the address in step without a navigation (Next.js syncs useSearchParams with it).
    const path = localePath(locale, "/suche");
    window.history.replaceState(null, "", term ? `${path}?q=${encodeURIComponent(term)}` : path);
  };

  return (
    <div onKeyDown={keys}>
      <form role="search" onSubmit={(e) => e.preventDefault()} className="max-w-3xl">
        <SearchField inputRef={input} size="lg" value={q} onChange={change} autoFocus={!initial} />
      </form>

      <div className="mt-8 md:mt-10">
        {hasQuery ? (
          <>
            <p className="t-hud mb-6 text-paper-3" aria-live="polite">
              {groups.total === 1 ? t.search.countOne : fill(t.search.count, { n: groups.total })}
            </p>
            <SearchResults groups={groups} query={q} size="lg" />
          </>
        ) : (
          <Suggestions
            docs={index}
            onPick={(w) => {
              change(w);
              input.current?.focus();
            }}
          />
        )}
      </div>
    </div>
  );
}
