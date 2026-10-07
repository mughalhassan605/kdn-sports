import { isLocale, locales } from "@/i18n/config";
import { buildSearchIndex } from "@/lib/server/search-index";

// One static JSON file per language, written at build time and served from the CDN.
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function GET(_req: Request, { params }: RouteContext<"/api/suche/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) return new Response(null, { status: 404 });
  return Response.json(buildSearchIndex(lang));
}
