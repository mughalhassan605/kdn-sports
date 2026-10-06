// Media pipeline.
//
// Originals live in /media-src (never served). This script bakes the public
// derivatives into /public/media and writes src/data/generated/media.json:
//
//   <id>-t.webp   thumb  520w, small centre mark
//   <id>-t2.webp  thumb 1040w, small centre mark
//   <id>-p.jpg    preview, long edge 1100, tiled watermark, low quality
//   <id>-c.webp   clean 1920w  (marketing picks only, see COVERS)
//   <id>-cm.webp  clean  960w  (marketing picks only)
//   <id>-lo.jpg   360w watermarked, heavily compressed (hero compare only)
//   <id>-v.mp4    clip preview 854w, watermark burned in, max 14 s, no audio
//
// The watermark is composited into the pixels. Nothing in /public is clean
// except the marketing picks listed in COVERS.
//
// Run: node scripts/build-media.mjs

import sharp from "sharp";
import ffmpegPath from "ffmpeg-static";
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "media-src");
const OUT = path.join(ROOT, "public", "media");
const GEN = path.join(ROOT, "src", "data", "generated");

// Gallery order of the Color Splash set (frame number = position in the client gallery).
const kdnOrder = JSON.parse(await fs.readFile(path.join(SRC, "kdn-order.json"), "utf8"));

const EVENTS = [
  { slug: "color-splash-jumping", prefix: "cs", date: "2026-09-20", start: "18:00", stepSec: 58 },
  { slug: "stadtlauf", prefix: "sl", date: "2026-06-14", start: "10:00", stepSec: 540, files: "stock-run", clips: ["stock-run-clip"], sample: true },
  { slug: "fight-night", prefix: "fn", date: "2026-10-03", start: "19:30", stepSec: 660, files: "stock-box", clips: ["stock-box-clip"], sample: true },
  { slug: "hallencup", prefix: "hc", date: "2026-09-27", start: "11:00", stepSec: 780, files: "stock-fut", clips: ["stock-fut-clip"], sample: true },
  { slug: "throwdown", prefix: "td", date: "2026-07-25", start: "09:30", stepSec: 600, files: "stock-fit", clips: ["stock-fit-clip", "stock-fit-clip2"], sample: true },
];

// Clean derivatives are public by design: only shots the photographer would use as marketing.
const COVERS = new Set([
  "cs-000", // gallery cover
  "cs-009", "cs-021", "cs-023", "cs-025", "cs-032", "cs-045", "cs-077", "cs-078",
  // Stock placeholders: all clean, they are not KDN material anyway.
  ...["sl", "fn", "hc", "td"].flatMap((p) => [1, 2, 3, 4, 5].map((n) => `${p}-00${n}`)),
  "sl-c01", "fn-c01", "hc-c01", "td-c01", "td-c02",
]);
const HERO = "fn-001";

const credits = existsSync(path.join(SRC, "credits.json"))
  ? JSON.parse(await fs.readFile(path.join(SRC, "credits.json"), "utf8"))
  : [];
const creditFor = (file) => credits.find((c) => c.file === file)?.author;

const pad = (n, l = 3) => String(n).padStart(l, "0");

function isoAt(date, start, offsetSec) {
  const [h, m] = start.split(":").map(Number);
  const total = h * 3600 + m * 60 + offsetSec;
  const hh = pad(Math.floor(total / 3600) % 24, 2);
  const mm = pad(Math.floor((total % 3600) / 60), 2);
  const ss = pad(total % 60, 2);
  return `${date}T${hh}:${mm}:${ss}`;
}

// ---------------------------------------------------------------- watermark

const FONT = "Helvetica Neue, Helvetica, Arial, sans-serif";

function tileSvg(w, h, strength = 1) {
  const fs = Math.round(Math.max(w, h) / 36);
  const tw = Math.round(fs * 19);
  const th = Math.round(fs * 5.6);
  const text = (x, y, label) =>
    `<text x="${x}" y="${y}" font-family="${FONT}" font-weight="700" font-size="${fs}" letter-spacing="${(fs * 0.14).toFixed(1)}" fill="#fff" fill-opacity="${(0.3 * strength).toFixed(2)}" stroke="#000" stroke-opacity="${(0.2 * strength).toFixed(2)}" stroke-width="${(fs / 26).toFixed(2)}" paint-order="stroke">${label}</text>`;
  const cfs = Math.round(Math.min(w, h) / 6.2);
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <defs>
        <pattern id="p" width="${tw}" height="${th}" patternUnits="userSpaceOnUse" patternTransform="rotate(-24)">
          ${text(0, fs, "KDN PRODUCTION")}
          ${text(Math.round(fs * 9.6), Math.round(fs + th / 2), "VORSCHAU")}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#p)"/>
      <text x="${w / 2}" y="${h / 2}" text-anchor="middle" dominant-baseline="central" font-family="${FONT}" font-weight="700" font-size="${cfs}" letter-spacing="${(cfs * 0.06).toFixed(1)}" fill="#fff" fill-opacity="${(0.24 * strength).toFixed(2)}" stroke="#000" stroke-opacity="${(0.22 * strength).toFixed(2)}" stroke-width="${(cfs / 40).toFixed(2)}" paint-order="stroke">KDN</text>
    </svg>`,
  );
}

function markSvg(w, h) {
  const cfs = Math.round(Math.min(w, h) / 9);
  const sub = Math.round(cfs / 3.6);
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <g font-family="${FONT}" font-weight="700" text-anchor="middle" fill="#fff" stroke="#000" paint-order="stroke">
        <text x="${w / 2}" y="${h / 2}" dominant-baseline="central" font-size="${cfs}" letter-spacing="${(cfs * 0.08).toFixed(1)}" fill-opacity=".3" stroke-opacity=".2" stroke-width="${(cfs / 34).toFixed(2)}">KDN</text>
        <text x="${w / 2}" y="${h / 2 + cfs * 0.72}" dominant-baseline="central" font-size="${sub}" letter-spacing="${(sub * 0.3).toFixed(1)}" fill-opacity=".34" stroke-opacity=".2" stroke-width="${(sub / 16).toFixed(2)}">VORSCHAU</text>
      </g>
    </svg>`,
  );
}

// ------------------------------------------------------------------ palette

function hexOf([r, g, b]) {
  return "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
}

function rgbToHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return [h, s, l];
}

function hslToRgb([h, s, l]) {
  const f = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [f(p, q, h + 1 / 3) * 255, f(p, q, h) * 255, f(p, q, h - 1 / 3) * 255];
}

// Three "light sources" of a frame: the vivid, bright clusters, normalised so they read as glow.
async function paletteOf(input) {
  const { data } = await sharp(input).resize(28, 28, { fit: "fill" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const px = [];
  for (let i = 0; i < data.length; i += 3) px.push([data[i], data[i + 1], data[i + 2]]);
  const k = 6;
  let centers = Array.from({ length: k }, (_, i) => px[Math.floor(((i + 0.5) * px.length) / k)].slice());
  let assign = new Array(px.length).fill(0);
  for (let iter = 0; iter < 10; iter++) {
    px.forEach((p, i) => {
      let best = 0, bd = Infinity;
      centers.forEach((c, j) => {
        const d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2;
        if (d < bd) { bd = d; best = j; }
      });
      assign[i] = best;
    });
    centers = centers.map((c, j) => {
      const mine = px.filter((_, i) => assign[i] === j);
      if (!mine.length) return c;
      return [0, 1, 2].map((ch) => mine.reduce((a, p) => a + p[ch], 0) / mine.length);
    });
  }
  const clusters = centers
    .map((c, j) => {
      const count = assign.filter((a) => a === j).length;
      const [h, s, l] = rgbToHsl(c);
      return { c, count, h, s, l, score: Math.sqrt(count) * (s + 0.12) * (l > 0.1 && l < 0.92 ? 1 : 0.2) };
    })
    .filter((c) => c.count > 0)
    .sort((a, b) => b.score - a.score);
  const picked = [];
  for (const c of clusters) {
    const hueDist = (a, b) => Math.min(Math.abs(a - b), 1 - Math.abs(a - b));
    if (picked.every((p) => hueDist(p.h, c.h) > 0.06 || Math.abs(p.l - c.l) > 0.25)) picked.push(c);
    if (picked.length === 3) break;
  }
  while (picked.length < 3) picked.push(picked[picked.length - 1] ?? clusters[0]);
  const glow = picked.map((c) => {
    const s = c.s < 0.08 ? c.s : Math.min(0.92, Math.max(0.62, c.s * 1.15));
    const l = Math.min(0.62, Math.max(0.46, c.l));
    return hexOf(hslToRgb([c.h, s, l]));
  });
  const avg = [0, 1, 2].map((ch) => px.reduce((a, p) => a + p[ch], 0) / px.length);
  const [ah, as, al] = rgbToHsl(avg);
  return { palette: glow, avg: hexOf(hslToRgb([ah, Math.min(as, 0.5), Math.min(al, 0.2)])) };
}

// ------------------------------------------------------------------- photos

async function buildStill(input, id, { clean, hero }) {
  const base = sharp(input, { failOn: "none" }).rotate();
  const meta = await base.metadata();
  const w = meta.width, h = meta.height;

  for (const [suffix, width, q] of [["t", 520, 70], ["t2", 1040, 66]]) {
    const buf = await base.clone().resize({ width, withoutEnlargement: true }).toBuffer({ resolveWithObject: true });
    await sharp(buf.data)
      .composite([{ input: markSvg(buf.info.width, buf.info.height) }])
      .webp({ quality: q, effort: 5 })
      .toFile(path.join(OUT, `${id}-${suffix}.webp`));
  }

  const long = 1100;
  const pv = await base.clone().resize({ width: w >= h ? long : undefined, height: h > w ? long : undefined, withoutEnlargement: true }).toBuffer({ resolveWithObject: true });
  await sharp(pv.data)
    .composite([{ input: tileSvg(pv.info.width, pv.info.height) }])
    .jpeg({ quality: 58, mozjpeg: true })
    .toFile(path.join(OUT, `${id}-p.jpg`));

  if (clean) {
    await base.clone().resize({ width: 1920, withoutEnlargement: true }).webp({ quality: 80, effort: 5 }).toFile(path.join(OUT, `${id}-c.webp`));
    await base.clone().resize({ width: 960, withoutEnlargement: true }).webp({ quality: 76, effort: 5 }).toFile(path.join(OUT, `${id}-cm.webp`));
  }

  if (hero) {
    const lo = await base.clone().resize({ width: 360 }).toBuffer({ resolveWithObject: true });
    await sharp(lo.data)
      .composite([{ input: tileSvg(lo.info.width, lo.info.height, 1.15) }])
      .jpeg({ quality: 34, mozjpeg: true })
      .toFile(path.join(OUT, `${id}-lo.jpg`));
  }

  return { w, h, ...(await paletteOf(input)) };
}

// -------------------------------------------------------------------- clips

function probe(file) {
  const r = spawnSync(ffmpegPath, ["-hide_banner", "-i", file], { encoding: "utf8" });
  const s = r.stderr;
  const d = /Duration: (\d+):(\d+):(\d+\.\d+)/.exec(s);
  const v = /Video:.*?(\d{3,5})x(\d{3,5})/.exec(s);
  const f = /([\d.]+) fps/.exec(s);
  return {
    duration: d ? +d[1] * 3600 + +d[2] * 60 + +d[3] : 0,
    w: v ? +v[1] : 1920,
    h: v ? +v[2] : 1080,
    fps: f ? Math.round(+f[1]) : 25,
  };
}

async function buildClip(input, id, { clean }) {
  const info = probe(input);
  const frame = spawnSync(
    ffmpegPath,
    ["-hide_banner", "-loglevel", "error", "-ss", (info.duration * 0.35).toFixed(2), "-i", input, "-frames:v", "1", "-f", "image2pipe", "-vcodec", "png", "-"],
    { maxBuffer: 1 << 28 },
  );
  if (frame.status !== 0 || !frame.stdout.length) throw new Error(`poster failed for ${id}`);
  const still = await buildStill(frame.stdout, id, { clean, hero: false });

  const pw = 854;
  const ph = Math.round((pw * info.h) / info.w / 2) * 2;
  const wm = path.join(OUT, `.wm-${id}.png`);
  await sharp(tileSvg(pw, ph, 1.05)).png().toFile(wm);
  const out = path.join(OUT, `${id}-v.mp4`);
  const r = spawnSync(
    ffmpegPath,
    [
      "-hide_banner", "-loglevel", "error", "-y",
      "-i", input, "-i", wm,
      "-filter_complex", `[0:v]scale=${pw}:${ph},fps=25[v];[v][1:v]overlay=0:0[o]`,
      "-map", "[o]", "-t", "14", "-an",
      "-c:v", "libx264", "-preset", "medium", "-crf", "31", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
      out,
    ],
    { encoding: "utf8" },
  );
  await fs.rm(wm, { force: true });
  if (r.status !== 0) throw new Error(`preview failed for ${id}: ${r.stderr}`);
  return { ...still, w: info.w, h: info.h, duration: Math.round(info.duration * 10) / 10, fps: info.fps };
}

// --------------------------------------------------------------------- main

await fs.mkdir(OUT, { recursive: true });
await fs.mkdir(GEN, { recursive: true });

const items = [];
const sources = {}; // id -> original file (private), read by the download route

for (const ev of EVENTS) {
  let stills = [];
  if (ev.slug === "color-splash-jumping") {
    stills = [
      { file: "photos/kdn-cover.jpg", seq: 0 },
      ...kdnOrder.picked
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((p) => ({ file: `photos/kdn-${p.id}.jpg`, seq: p.order + 1 })),
    ];
  } else {
    const all = (await fs.readdir(path.join(SRC, "photos"))).filter((f) => f.startsWith(ev.files)).sort();
    stills = all.map((f, i) => ({ file: `photos/${f}`, seq: i + 1 }));
  }

  for (const s of stills) {
    const id = `${ev.prefix}-${pad(s.seq)}`;
    const r = await buildStill(path.join(SRC, s.file), id, { clean: COVERS.has(id), hero: id === HERO });
    sources[id] = s.file;
    items.push({
      id, type: "photo", event: ev.slug, seq: s.seq,
      w: r.w, h: r.h, takenAt: isoAt(ev.date, ev.start, s.seq * ev.stepSec),
      palette: r.palette, avg: r.avg, clean: COVERS.has(id),
      ...(ev.sample ? { sample: true, credit: creditFor(path.basename(s.file)) } : {}),
    });
    process.stdout.write(".");
  }

  for (const [i, c] of (ev.clips ?? []).entries()) {
    const id = `${ev.prefix}-c${pad(i + 1, 2)}`;
    const file = `videos/${c}.mp4`;
    const r = await buildClip(path.join(SRC, file), id, { clean: COVERS.has(id) });
    sources[id] = file;
    items.push({
      id, type: "clip", event: ev.slug, seq: i + 1,
      w: r.w, h: r.h, takenAt: isoAt(ev.date, ev.start, (i + 1) * ev.stepSec + 200),
      palette: r.palette, avg: r.avg, clean: COVERS.has(id),
      duration: r.duration, fps: r.fps,
      ...(ev.sample ? { sample: true, credit: "Mixkit" } : {}),
    });
    process.stdout.write("v");
  }
}

await fs.writeFile(path.join(GEN, "media.json"), JSON.stringify(items, null, 1));
await fs.writeFile(path.join(SRC, "sources.json"), JSON.stringify(sources, null, 1));
console.log(`\n${items.length} items -> public/media, src/data/generated/media.json`);
