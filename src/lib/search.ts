// Site search: the index is a flat list of documents built on the server
// (src/lib/server/search-index.ts) and matched in the browser, so results
// appear while typing without a request per keystroke.

export type SearchKind = "event" | "photo" | "clip" | "page" | "help";

export type SearchDoc = {
  kind: SearchKind;
  /** App path without the locale prefix ("/events/hallencup"). */
  href: string;
  title: string;
  sub?: string;
  /** Thumbnail and the colour shown while it loads. */
  img?: string;
  bg?: string;
  /** Width / height of the thumbnail. */
  ratio?: number;
  /** More words that should find this document; not shown. */
  terms?: string;
  /** Sort key inside a group, larger first (event date, capture time). */
  rank?: string;
};

export type SearchHit = { doc: SearchDoc; score: number };
export type SearchGroups = { event: SearchHit[]; media: SearchHit[]; page: SearchHit[]; total: number };

/** Lowercase, no accents, ß as ss, no soft hyphens. Keeps one output character per input character except ß. */
export function fold(s: string) {
  return s
    .toLowerCase()
    .replace(/­/g, "")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

// "Bückeburg", "Bueckeburg" and "Buckeburg" all meet as "buckeburg".
const loose = (s: string) => fold(s).replace(/ae/g, "a").replace(/oe/g, "o").replace(/ue/g, "u");

// Words, numbers and clock times ("18:30") are the tokens.
const words = (s: string) => s.match(/[a-z0-9]+(?::[0-9]+)?/g) ?? [];

export const queryTokens = (q: string) => [...new Set(words(loose(q)))];

type Prepared = { doc: SearchDoc; title: string[]; rest: string[] };

const prepared = new WeakMap<SearchDoc[], Prepared[]>();

function prepare(index: SearchDoc[]) {
  let list = prepared.get(index);
  if (!list) {
    list = index.map((doc) => ({
      doc,
      title: words(loose(doc.title)),
      rest: words(loose(`${doc.sub ?? ""} ${doc.terms ?? ""}`)),
    }));
    prepared.set(index, list);
  }
  return list;
}

/** Edit distance, stopping early once it is past `max`. */
function within(a: string, b: string, max: number) {
  if (Math.abs(a.length - b.length) > max) return false;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      best = Math.min(best, cur[j]);
    }
    if (best > max) return false;
    prev = cur;
  }
  return prev[b.length] <= max;
}

/** How well one query token meets one word: 3 exact, 2 start of word, 1 inside or one typo away, 0 not at all. */
function quality(token: string, word: string) {
  if (word === token) return 3;
  if (/^\d+$/.test(token)) {
    // Frame numbers match with or without leading zeros; "18" finds the times "18:xx".
    if (/^\d+$/.test(word) && Number(word) === Number(token)) return 3;
    return word.startsWith(`${token}:`) ? 2 : 0;
  }
  if (word.startsWith(token)) return 2;
  if (token.includes(":")) return 0;
  if (token.length >= 4 && word.includes(token)) return 1;
  if (token.length >= 5 && (within(token, word, 1) || within(token, word.slice(0, token.length), 1))) return 1;
  return 0;
}

/** Best match in a list of words. Without `loose`, only whole words and word starts count. */
function best(token: string, list: string[], loose: boolean) {
  let q = 0;
  for (const w of list) {
    const m = quality(token, w);
    if (m > 1 || loose) q = Math.max(q, m);
    if (q === 3) break;
  }
  return q;
}

/**
 * Every token has to match somewhere; title matches count double. Matches
 * inside a word and typos only count in the title, so "lauf" finds the
 * "Sommerlauf" but not every text that mentions an "Einlauf".
 */
function scoreOf(p: Prepared, tokens: string[]) {
  let score = 0;
  for (const token of tokens) {
    const t = best(token, p.title, true) * 2;
    const r = t === 6 ? 0 : best(token, p.rest, false);
    const s = Math.max(t, r);
    if (s === 0) return 0;
    score += s;
  }
  return score;
}

const byScore = (a: SearchHit, b: SearchHit) => b.score - a.score || (b.doc.rank ?? "").localeCompare(a.doc.rank ?? "");

/** Runs a query against the index. An empty query returns empty groups. */
export function search(index: SearchDoc[], q: string): SearchGroups {
  const tokens = queryTokens(q);
  const groups: SearchGroups = { event: [], media: [], page: [], total: 0 };
  if (tokens.length === 0) return groups;

  for (const p of prepare(index)) {
    const score = scoreOf(p, tokens);
    if (!score) continue;
    const hit = { doc: p.doc, score };
    if (p.doc.kind === "event") groups.event.push(hit);
    else if (p.doc.kind === "photo" || p.doc.kind === "clip") groups.media.push(hit);
    else groups.page.push(hit);
  }
  groups.event.sort(byScore);
  groups.media.sort(byScore);
  groups.page.sort(byScore);
  groups.total = groups.event.length + groups.media.length + groups.page.length;
  return groups;
}

/** Character ranges of `text` that start one of the query tokens, for highlighting. */
export function marks(text: string, q: string): [number, number][] {
  const tokens = words(fold(q));
  if (tokens.length === 0) return [];
  // Fold character by character so positions map back to the original text.
  let folded = "";
  const at: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const f = fold(text[i]);
    for (let k = 0; k < f.length; k++) at.push(i);
    folded += f;
  }
  const out: [number, number][] = [];
  for (const m of folded.matchAll(/[a-z0-9]+(?::[0-9]+)?/g)) {
    const word = m[0];
    const token = tokens.find((t) => word.startsWith(t));
    if (!token) continue;
    const start = at[m.index];
    const end = at[m.index + token.length - 1] + 1;
    out.push([start, end]);
  }
  return out;
}
