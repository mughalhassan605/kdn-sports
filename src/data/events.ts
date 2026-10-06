import type { L } from "@/i18n/config";
import { mediaOfEvent } from "./media";

export type EventInfo = {
  slug: string;
  title: string;
  sport: L;
  venue: L;
  city: string;
  /** ISO date of the event. */
  date: string;
  /** Media id used as poster. Must have a clean derivative (see COVERS in build-media.mjs). */
  cover: string;
  blurb: L;
  /** Invented placeholder event with stock media. Only "color-splash-jumping" is real KDN work (their sample gallery). */
  sample?: boolean;
};

export const events: EventInfo[] = [
  {
    slug: "fight-night",
    title: "Fight Night",
    sport: { de: "Boxen", en: "Boxing" },
    venue: { de: "Stadthalle", en: "Civic hall" },
    city: "Bielefeld",
    date: "2026-10-03",
    cover: "fn-001",
    blurb: {
      de: "Einlauf, Gong, Entscheidung. Jeder Kampf des Abends, Runde für Runde.",
      en: "Walk-in, bell, decision. Every fight of the night, round by round.",
    },
    sample: true,
  },
  {
    slug: "hallencup",
    title: "Hallencup",
    sport: { de: "Futsal", en: "Futsal" },
    venue: { de: "Sporthalle", en: "Sports hall" },
    city: "Minden",
    date: "2026-09-27",
    cover: "hc-001",
    blurb: {
      de: "Zwölf Teams, ein Parkett. Zweikämpfe, Tore und Jubel vom Hallencup.",
      en: "Twelve teams, one court. Duels, goals and celebrations from the Hallencup.",
    },
    sample: true,
  },
  {
    slug: "color-splash-jumping",
    title: "Color Splash Jumping",
    sport: { de: "Jumping Fitness", en: "Jumping Fitness" },
    venue: { de: "Looms", en: "Looms" },
    city: "Stadthagen",
    date: "2026-09-20",
    cover: "cs-000",
    blurb: {
      de: "Neonlicht, Trampoline und ein Raum voller Energie. Alle Fotos vom Color Splash Jumping im Looms.",
      en: "Neon light, trampolines and a room full of energy. Every photo from Color Splash Jumping at Looms.",
    },
  },
  {
    slug: "throwdown",
    title: "Fitness Throwdown",
    sport: { de: "Functional Fitness", en: "Functional fitness" },
    venue: { de: "Halle 4", en: "Hall 4" },
    city: "Bückeburg",
    date: "2026-07-25",
    cover: "td-001",
    blurb: {
      de: "Drei Workouts, ein Tag, kein Erbarmen. Die Bilder vom Throwdown, vom ersten Lift bis zur Siegerehrung.",
      en: "Three workouts, one day, no mercy. The Throwdown in pictures, from the first lift to the podium.",
    },
    sample: true,
  },
  {
    slug: "stadtlauf",
    title: "Sommerlauf 10K",
    sport: { de: "Laufen", en: "Running" },
    venue: { de: "Innenstadt", en: "City centre" },
    city: "Hannover",
    date: "2026-06-14",
    cover: "sl-001",
    blurb: {
      de: "Zehn Kilometer durch die Stadt. Finde dich über die Zeitleiste: einfach zu deiner Zielzeit springen.",
      en: "Ten kilometres through the city. Find yourself on the timeline: just jump to your finish time.",
    },
    sample: true,
  },
];

export const getEvent = (slug: string) => events.find((e) => e.slug === slug);

export function eventCounts(slug: string) {
  const items = mediaOfEvent(slug);
  return {
    photos: items.filter((m) => m.type === "photo").length,
    clips: items.filter((m) => m.type === "clip").length,
  };
}
