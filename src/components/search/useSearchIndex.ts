"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/client";
import type { Locale } from "@/i18n/config";
import type { SearchDoc } from "@/lib/search";

// One request per language and page load, shared by the header dialog and
// the search section. A failed load is forgotten so the next try refetches.
const loads = new Map<Locale, Promise<SearchDoc[]>>();

export function loadSearchIndex(locale: Locale) {
  let p = loads.get(locale);
  if (!p) {
    p = fetch(`/api/suche/${locale}`).then((r) => {
      if (!r.ok) throw new Error(`search index: ${r.status}`);
      return r.json() as Promise<SearchDoc[]>;
    });
    p.catch(() => loads.delete(locale));
    loads.set(locale, p);
  }
  return p;
}

/** The search index once `enabled` (or straight away when the page already rendered it). */
export function useSearchIndex(enabled: boolean, initial?: SearchDoc[]) {
  const { locale } = useI18n();
  const [loaded, setLoaded] = useState<{ locale: Locale; docs: SearchDoc[] } | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const docs = initial ?? (loaded?.locale === locale ? loaded.docs : null);

  useEffect(() => {
    if (!enabled || docs) return;
    let live = true;
    loadSearchIndex(locale).then(
      (list) => live && setLoaded({ locale, docs: list }),
      () => live && setFailed(true),
    );
    return () => {
      live = false;
    };
  }, [enabled, docs, locale, attempt]);

  const retry = () => {
    setFailed(false);
    setAttempt((n) => n + 1);
  };

  return { docs, failed: failed && !docs, retry };
}
