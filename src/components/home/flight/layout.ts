// Pure geometry of the archive flight, shared by the WebGL scene and the DOM
// overlay (the focus brackets have to land exactly on the hero print).
// World units; the camera looks down -Z with a 50° vertical field of view.

export const FOV = 50;
const TAN = Math.tan((FOV / 2) * (Math.PI / 180));

/** Visible height / width of the frustum at a distance from the camera. */
export const visH = (d: number) => 2 * TAN * d;
export const visW = (d: number, aspect: number) => visH(d) * aspect;

export type Slot = { x: number; y: number; z: number; w: number; h: number };

const GOLDEN = 2.399963;
const FIRST = 8.5;
const GAP = 2.5;

/** The hero print: large and right of centre on wide screens, centred above the type on tall ones. */
export function heroSlot(ratio: number, aspect: number): Slot {
  const wide = aspect >= 1;
  const d = wide ? 4.3 : 6.4;
  const vw = visW(d, aspect);
  const vh = visH(d);
  // Fit inside a box of the frustum, whatever the print's orientation.
  const boxW = vw * (wide ? 0.52 : 0.88);
  const boxH = vh * (wide ? 0.72 : 0.44);
  const w = Math.min(boxW, boxH * ratio);
  const h = w / ratio;
  return { x: wide ? vw * 0.2 : 0, y: wide ? 0.06 : vh * 0.13, z: -d, w, h };
}

/** Where the hero print sits on screen, in percent of the stage. */
export function heroRect(ratio: number, aspect: number) {
  const s = heroSlot(ratio, aspect);
  const d = -s.z;
  const vw = visW(d, aspect);
  const vh = visH(d);
  return {
    left: 50 + ((s.x - s.w / 2) / vw) * 100,
    top: 50 - ((s.y + s.h / 2) / vh) * 100,
    width: (s.w / vw) * 100,
    height: (s.h / vh) * 100,
  };
}

/** The prints the camera flies past: a loose spiral that keeps the middle of the frame clear for type. */
export function tunnelSlots(ratios: number[], aspect: number): Slot[] {
  const wide = aspect >= 1;
  return ratios.map((ratio, i) => {
    const a = i * GOLDEN + 0.6;
    const rx = (wide ? 2.75 : 1.2) + (i % 3) * (wide ? 0.5 : 0.22);
    const ry = (wide ? 1.2 : 2.2) + (i % 2) * 0.38;
    const long = (wide ? 1.9 : 1.55) + (i % 4) * 0.14;
    const w = ratio >= 1 ? long : long * ratio;
    const h = ratio >= 1 ? long / ratio : long;
    return { x: Math.cos(a) * rx, y: Math.sin(a) * ry, z: -(FIRST + i * GAP), w, h };
  });
}

/** The last print fills the frame exactly: it becomes the first poster of the events ring. */
export function finalSlot(count: number, ratio: number, aspect: number) {
  const w = 3;
  const h = w / ratio;
  const z = -(FIRST + count * GAP + 5.5);
  // Cover fit: stop where the print is at least as large as the frustum on both axes.
  const dEnd = Math.min(w / (2 * TAN * aspect), h / (2 * TAN)) * 0.992;
  return { slot: { x: 0, y: 0, z, w, h } as Slot, camEnd: z + dEnd };
}

/** Progress at which the camera has arrived in front of the last print. */
export const ARRIVE = 0.82;

/** Camera Z for a scroll progress 0..1: a short hold on the hero, a steady flight, then it rests on the last print. */
export function cameraZ(progress: number, camEnd: number) {
  const t = Math.min(1, Math.max(0, (progress - 0.04) / (ARRIVE - 0.04)));
  const smooth = t * t * (3 - 2 * t);
  return camEnd * (t * 0.55 + smooth * 0.45);
}

export const smoothstep = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
