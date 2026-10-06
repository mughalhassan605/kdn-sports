import type { Locale } from "@/i18n/config";

const tag = (l: Locale) => (l === "de" ? "de-DE" : "en-GB");

export function money(cents: number, locale: Locale) {
  return new Intl.NumberFormat(tag(locale), { style: "currency", currency: "EUR" }).format(cents / 100);
}

/** "20.09.2026" / "20/09/2026" */
export function dateShort(iso: string, locale: Locale) {
  return new Intl.DateTimeFormat(tag(locale), { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${iso.slice(0, 10)}T00:00:00Z`),
  );
}

/** "20. September 2026" / "20 September 2026" */
export function dateLong(iso: string, locale: Locale) {
  return new Intl.DateTimeFormat(tag(locale), { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${iso.slice(0, 10)}T00:00:00Z`),
  );
}

export function dateParts(iso: string, locale: Locale) {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  return {
    day: String(d.getUTCDate()).padStart(2, "0"),
    month: new Intl.DateTimeFormat(tag(locale), { month: "short", timeZone: "UTC" }).format(d).replace(".", ""),
    year: String(d.getUTCFullYear()),
  };
}

/** Capture times are stored as local wall-clock ISO strings: read the clock digits directly. */
export const clock = (iso: string) => iso.slice(11, 16);

export const minutesOfDay = (iso: string) => Number(iso.slice(11, 13)) * 60 + Number(iso.slice(14, 16)) + Number(iso.slice(17, 19) || 0) / 60;

export function duration(sec: number) {
  const s = Math.max(0, Math.round(sec));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function aspectLabel(w: number, h: number) {
  const r = w / h;
  const known: [number, string][] = [
    [3 / 2, "3:2"], [2 / 3, "2:3"], [4 / 3, "4:3"], [3 / 4, "3:4"], [16 / 9, "16:9"], [9 / 16, "9:16"], [1, "1:1"], [5 / 4, "5:4"], [4 / 5, "4:5"],
  ];
  const hit = known.find(([v]) => Math.abs(v - r) < 0.03);
  return hit ? hit[1] : `${r.toFixed(2)}:1`;
}
