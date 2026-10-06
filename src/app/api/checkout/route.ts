import { z } from "zod";
import { getMedia } from "@/data/media";
import { formatsFor, summarize, type CartLine } from "@/data/pricing";
import { paymentMethods } from "@/data/site";
import { newOrderNumber, signOrder } from "@/lib/server/orders";

// DEMO CHECKOUT. No money moves here: the route prices the cart on the server
// and returns a signed order token. A real integration replaces this with a
// payment session (Stripe / PayPal / Klarna) and signs the order in the
// provider's webhook after the payment is confirmed.

const Body = z.object({
  email: z.string().trim().email().max(200),
  method: z.enum(paymentMethods),
  lines: z
    .array(
      z.object({
        id: z.string().max(40),
        license: z.enum(["personal", "commercial"]),
        format: z.enum(["web", "original", "hd", "uhd"]),
      }),
    )
    .min(1)
    .max(80),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid" }, { status: 400 });

  const { email, method } = parsed.data;
  const lines: CartLine[] = [];
  for (const l of parsed.data.lines) {
    const m = getMedia(l.id);
    if (!m || !formatsFor(m.type).includes(l.format)) return Response.json({ error: "invalid" }, { status: 400 });
    if (!lines.some((x) => x.id === l.id)) lines.push(l);
  }

  const { total } = summarize(lines);
  const no = newOrderNumber();
  const at = Date.now();
  const token = signOrder({ n: no, e: email, c: at, m: method, i: lines.map((l) => [l.id, l.license, l.format]), t: total });

  return Response.json({ token, no, at, total, count: lines.length });
}
