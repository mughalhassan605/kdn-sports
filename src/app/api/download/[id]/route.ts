import { readFile } from "node:fs/promises";
import path from "node:path";
import type { NextRequest } from "next/server";
import { getMedia } from "@/data/media";
import { verifyOrder } from "@/lib/server/orders";

// The only way to a clean original. A valid order token that contains this
// item is required; everything else gets a 403.

const ROOT = path.join(process.cwd(), "media-src");
let sources: Record<string, string> | null = null;

async function sourceOf(id: string) {
  sources ??= JSON.parse(await readFile(path.join(ROOT, "sources.json"), "utf8")) as Record<string, string>;
  return sources[id];
}

export async function GET(req: NextRequest, ctx: RouteContext<"/api/download/[id]">) {
  const { id } = await ctx.params;
  const token = req.nextUrl.searchParams.get("t") ?? "";
  const inline = req.nextUrl.searchParams.has("inline");

  const order = verifyOrder(token);
  const item = getMedia(id);
  if (!order || !item || !order.i.some(([mid]) => mid === id)) {
    return new Response("Forbidden", { status: 403 });
  }

  const rel = await sourceOf(id);
  if (!rel) return new Response("Not found", { status: 404 });

  const file = await readFile(path.join(ROOT, rel));
  const ext = path.extname(rel).toLowerCase();
  const type = ext === ".mp4" ? "video/mp4" : "image/jpeg";
  const name = `kdn-production-${item.event}-${String(item.seq).padStart(4, "0")}${ext}`;

  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": type,
      "Content-Length": String(file.byteLength),
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${name}"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
