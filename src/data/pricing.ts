import type { Media } from "./media";

// PLACEHOLDER PRICING. Every number in this file is an example for the design
// and has to be set by KDN Sports before launch. Amounts are euro cents, VAT included.

export type License = "personal" | "commercial";
export type Format = "web" | "original" | "hd" | "uhd";

export const licenses: License[] = ["personal", "commercial"];

export const formatsFor = (type: Media["type"]): Format[] => (type === "clip" ? ["hd", "uhd"] : ["web", "original"]);

export const defaultFormat = (type: Media["type"]): Format => (type === "clip" ? "hd" : "original");

export const PRICES: Record<License, Record<Format, number>> = {
  personal: { web: 490, original: 790, hd: 1490, uhd: 2490 },
  commercial: { web: 2900, original: 4900, hd: 7900, uhd: 12900 },
};

/** Volume discount on photos, highest tier first. Clips are never discounted. */
export const TIERS = [
  { min: 10, pct: 30 },
  { min: 5, pct: 20 },
  { min: 3, pct: 10 },
] as const;

export type CartLine = { id: string; license: License; format: Format };

export const priceOf = (line: Pick<CartLine, "license" | "format">) => PRICES[line.license][line.format];

export const isPhotoFormat = (f: Format) => f === "web" || f === "original";

export function tierFor(photoCount: number) {
  return TIERS.find((t) => photoCount >= t.min) ?? null;
}

export function nextTier(photoCount: number) {
  const ascending = [...TIERS].reverse();
  return ascending.find((t) => photoCount < t.min) ?? null;
}

export function summarize(lines: CartLine[]) {
  const photoLines = lines.filter((l) => isPhotoFormat(l.format));
  const subtotal = lines.reduce((a, l) => a + priceOf(l), 0);
  const photoSubtotal = photoLines.reduce((a, l) => a + priceOf(l), 0);
  const tier = tierFor(photoLines.length);
  const discount = tier ? Math.round((photoSubtotal * tier.pct) / 100) : 0;
  return {
    count: lines.length,
    photoCount: photoLines.length,
    subtotal,
    discount,
    discountPct: tier?.pct ?? 0,
    total: subtotal - discount,
    next: nextTier(photoLines.length),
  };
}
