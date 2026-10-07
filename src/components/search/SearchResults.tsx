"use client";
/* eslint-disable @next/next/no-img-element -- pre-sized derivatives, see Shot.tsx */

import { ArrowUpRightIcon, FileTextIcon, PlayIcon, QuestionIcon } from "@phosphor-icons/react/dist/ssr";
import { LLink, useI18n } from "@/i18n/client";
import { fill } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { marks, type SearchDoc, type SearchGroups, type SearchHit } from "@/lib/search";

type Limits = { event: number; media: number; page: number };

/**
 * Search hits in three groups: events as rows with their poster, photos and
 * clips as a contact sheet, pages and FAQ answers as rows. Every hit carries
 * [data-hit] so the arrow keys can walk through them (see useHitKeys).
 */
export function SearchResults({
  groups,
  query,
  limits,
  onPick,
  size = "md",
}: {
  groups: SearchGroups;
  query: string;
  limits?: Limits;
  onPick?: () => void;
  size?: "md" | "lg";
}) {
  const { t } = useI18n();
  const ev = limits ? groups.event.slice(0, limits.event) : groups.event;
  const md = limits ? groups.media.slice(0, limits.media) : groups.media;
  const pg = limits ? groups.page.slice(0, limits.page) : groups.page;

  if (groups.total === 0) {
    return (
      <div className="py-8">
        <p className="t-h3">{fill(t.search.none, { q: query.trim() })}</p>
        <p className="mt-2 max-w-[48ch] text-paper-2">{t.search.noneHint}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {ev.length > 0 && (
        <Group title={t.search.groups.event} count={groups.event.length}>
          <ul className={cn("grid gap-1", size === "lg" && "md:grid-cols-2 md:gap-2")}>
            {ev.map((h) => (
              <li key={h.doc.href}>
                <Row hit={h} query={query} onPick={onPick} size={size} />
              </li>
            ))}
          </ul>
        </Group>
      )}

      {md.length > 0 && (
        <Group title={t.search.groups.media} count={groups.media.length}>
          <ul className={cn("grid grid-cols-3 gap-1.5 sm:grid-cols-4", size === "lg" && "md:grid-cols-5 lg:grid-cols-6 lg:gap-2")}>
            {md.map((h) => (
              <li key={h.doc.href}>
                <Tile doc={h.doc} onPick={onPick} />
              </li>
            ))}
          </ul>
        </Group>
      )}

      {pg.length > 0 && (
        <Group title={t.search.groups.page} count={groups.page.length}>
          <ul className="grid gap-1">
            {pg.map((h) => (
              <li key={h.doc.href + h.doc.title}>
                <Row hit={h} query={query} onPick={onPick} size={size} />
              </li>
            ))}
          </ul>
        </Group>
      )}
    </div>
  );
}

function Group({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="t-hud mb-3 flex items-baseline justify-between gap-4 text-paper-3">
        <span>{title}</span>
        <span className="tabular-nums">{count}</span>
      </h3>
      {children}
    </section>
  );
}

const rowClass =
  "group flex items-center gap-4 rounded-panel p-2 outline-offset-0 transition-colors hover:bg-white/[0.06] focus-visible:bg-white/[0.06]";

function Row({ hit, query, onPick, size }: { hit: SearchHit; query: string; onPick?: () => void; size: "md" | "lg" }) {
  const { doc } = hit;
  const poster = doc.kind === "event";
  const Icon = doc.kind === "help" ? QuestionIcon : FileTextIcon;

  return (
    <LLink href={doc.href} data-hit onClick={onPick} className={rowClass}>
      {poster ? (
        <span
          className={cn("relative block shrink-0 overflow-hidden rounded-media", size === "lg" ? "aspect-[3/2] w-28 md:w-36" : "aspect-[3/2] w-24")}
          style={{ backgroundColor: doc.bg }}
        >
          {doc.img && <img src={doc.img} alt="" loading="lazy" decoding="async" className="size-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-105" />}
        </span>
      ) : (
        <span className="grid size-10 shrink-0 place-items-center rounded-full border border-line text-paper-2">
          <Icon size={17} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className={cn("block text-paper", poster ? "t-h3 uppercase" : "font-[640]")}>
          <Highlight text={doc.title} query={query} />
        </span>
        {doc.sub && (
          <span className={cn("mt-1 block", poster ? "t-hud text-paper-3" : "line-clamp-2 text-sm text-paper-2")}>
            <Highlight text={doc.sub} query={query} />
          </span>
        )}
      </span>
      <ArrowUpRightIcon
        size={17}
        aria-hidden
        className="shrink-0 text-paper-3 transition-[color,transform] duration-500 ease-out-expo group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-paper group-focus-visible:text-paper"
      />
    </LLink>
  );
}

function Tile({ doc, onPick }: { doc: SearchDoc; onPick?: () => void }) {
  return (
    <LLink
      href={doc.href}
      data-hit
      onClick={onPick}
      aria-label={`${doc.title}, ${doc.sub ?? ""}`}
      className="group relative block aspect-[4/3] overflow-hidden rounded-media"
      style={{ backgroundColor: doc.bg }}
    >
      {doc.img && <img src={doc.img} alt="" loading="lazy" decoding="async" className="size-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-105" />}
      <span className="absolute inset-0 bg-gradient-to-t from-ink-0/85 via-transparent to-transparent" aria-hidden />
      {doc.kind === "clip" && (
        <span className="absolute left-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-ink-0/70 text-paper backdrop-blur-sm" aria-hidden>
          <PlayIcon size={10} weight="fill" />
        </span>
      )}
      <span className="t-hud absolute inset-x-2 bottom-1.5 truncate text-paper" aria-hidden>
        {doc.title}
      </span>
    </LLink>
  );
}

/** The parts of the text that start a query word, lifted out. */
function Highlight({ text, query }: { text: string; query: string }) {
  const ranges = marks(text, query);
  if (ranges.length === 0) return <>{text}</>;
  const out: React.ReactNode[] = [];
  let at = 0;
  ranges.forEach(([s, e], i) => {
    if (s > at) out.push(text.slice(at, s));
    out.push(
      <mark key={i} className="rounded-[3px] bg-white/15 text-paper">
        {text.slice(s, e)}
      </mark>,
    );
    at = e;
  });
  if (at < text.length) out.push(text.slice(at));
  return <>{out}</>;
}

/** Arrow keys walk from the input through the hits and back. Attach to a box around both. */
export function useHitKeys(input: React.RefObject<HTMLInputElement | null>) {
  return (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const hits = [...e.currentTarget.querySelectorAll<HTMLElement>("[data-hit]")];
    if (hits.length === 0) return;
    const i = hits.indexOf(document.activeElement as HTMLElement);
    if (i === -1 && document.activeElement !== input.current) return;
    e.preventDefault();
    if (e.key === "ArrowDown") (hits[i + 1] ?? hits[hits.length - 1]).focus();
    else if (i <= 0) input.current?.focus();
    else hits[i - 1].focus();
  };
}
