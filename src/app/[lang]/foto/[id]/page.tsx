import type { Metadata } from "next";
import { MediaDetail } from "@/components/detail/MediaDetail";
import { getEvent } from "@/data/events";
import { frameNo, getMedia, media } from "@/data/media";
import { locales } from "@/i18n/config";
import { getI18n } from "@/i18n/server";

export function generateStaticParams() {
  return locales.flatMap((lang) => media.filter((m) => m.type === "photo").map((m) => ({ lang, id: m.id })));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/foto/[id]">): Promise<Metadata> {
  const { id } = await params;
  const { t } = await getI18n();
  const m = getMedia(id);
  if (!m) return {};
  return { title: `${t.gallery.photo} ${frameNo(m)}, ${getEvent(m.event)?.title ?? ""}`, robots: { index: false } };
}

export default async function Page({ params }: PageProps<"/[lang]/foto/[id]">) {
  const { id } = await params;
  return <MediaDetail id={id} type="photo" />;
}
