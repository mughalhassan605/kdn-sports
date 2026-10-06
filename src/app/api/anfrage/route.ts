import { z } from "zod";

// Booking enquiries from organisers. The demo validates and logs; wire a mailer
// (Resend, Postmark, SMTP) here before launch. `website` is a honeypot.

const Body = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  event: z.string().trim().min(2).max(160),
  date: z.string().trim().max(40).optional().default(""),
  place: z.string().trim().max(160).optional().default(""),
  size: z.string().trim().max(40).optional().default(""),
  message: z.string().trim().max(4000).optional().default(""),
  website: z.string().max(0).optional().default(""),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "invalid", fields: Object.keys(z.flattenError(parsed.error).fieldErrors) }, { status: 400 });
  }
  const enquiry = { ...parsed.data, website: undefined };
  console.log("[anfrage]", enquiry);
  return Response.json({ ok: true });
}
