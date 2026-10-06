import raw from "./generated/media.json";

// Written by scripts/build-media.mjs. Public derivatives live in /public/media,
// originals stay in /media-src and are only reachable through /api/download.

export type MediaType = "photo" | "clip";

export type Media = {
  id: string;
  type: MediaType;
  event: string;
  /** Frame number inside its event (gallery order). */
  seq: number;
  w: number;
  h: number;
  /** Local capture time, ISO without zone. Demo data until EXIF is wired in. */
  takenAt: string;
  /** Three light colours of the frame; they drive the ambient glow. */
  palette: string[];
  avg: string;
  /** A clean, un-watermarked marketing derivative exists for this item. */
  clean: boolean;
  duration?: number;
  fps?: number;
  /** Stock placeholder, not KDN material. Replace before launch. */
  sample?: boolean;
  credit?: string;
};

export const media = raw as Media[];

const byId = new Map(media.map((m) => [m.id, m]));

export const getMedia = (id: string) => byId.get(id);

export function mustMedia(id: string) {
  const m = byId.get(id);
  if (!m) throw new Error(`Unknown media id: ${id}`);
  return m;
}

export const mediaOfEvent = (slug: string) =>
  media.filter((m) => m.event === slug).sort((a, b) => a.takenAt.localeCompare(b.takenAt));

export const clips = media.filter((m) => m.type === "clip");
export const photos = media.filter((m) => m.type === "photo");

export const src = {
  thumb: (id: string) => `/media/${id}-t.webp`,
  thumb2: (id: string) => `/media/${id}-t2.webp`,
  preview: (id: string) => `/media/${id}-p.jpg`,
  clean: (id: string) => `/media/${id}-c.webp`,
  cleanM: (id: string) => `/media/${id}-cm.webp`,
  lo: (id: string) => `/media/${id}-lo.jpg`,
  video: (id: string) => `/media/${id}-v.mp4`,
};

export const ratio = (m: Pick<Media, "w" | "h">) => m.w / m.h;

/** "0127": the frame number people quote when they ask about a picture. */
export const frameNo = (m: Pick<Media, "seq">) => String(m.seq).padStart(4, "0");

export const detailPath = (m: Pick<Media, "id" | "type">) => `/${m.type === "clip" ? "clip" : "foto"}/${m.id}`;
