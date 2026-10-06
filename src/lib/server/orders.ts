import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { Format, License } from "@/data/pricing";

// Stateless order tokens: the signed payload is the order. No database needed
// for the demo, and the download route can verify a purchase on its own.
// In production ORDER_SECRET must be set and a payment provider webhook, not
// the browser, has to trigger signOrder.

const SECRET = process.env.ORDER_SECRET ?? "kdn-dev-secret-not-for-production";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export type OrderPayload = {
  /** Order number shown to the customer. */
  n: string;
  /** Email the link was sent to. */
  e: string;
  /** Created at, epoch ms. */
  c: number;
  /** Payment method id. */
  m: string;
  /** Lines: [mediaId, license, format]. */
  i: [string, License, Format][];
  /** Total paid, euro cents. */
  t: number;
};

const mac = (body: string) => createHmac("sha256", SECRET).update(body).digest("base64url");

export const newOrderNumber = () => `KDN-${randomBytes(3).toString("hex").toUpperCase()}`;

export function signOrder(payload: OrderPayload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  // "~" rather than ".": a dot in the path would make the proxy treat the URL as a file.
  return `${body}~${mac(body)}`;
}

export function verifyOrder(token: string): OrderPayload | null {
  const [body, sig] = token.split("~");
  if (!body || !sig) return null;
  const expected = Buffer.from(mac(body));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as OrderPayload;
    if (Date.now() - payload.c > MAX_AGE_MS) return null;
    return payload;
  } catch {
    return null;
  }
}
