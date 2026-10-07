"use client";

import { useProgress } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { usePlainTexture } from "../texture";
import { ARRIVE, cameraZ, finalSlot, FOV, heroSlot, smoothstep, sourceOf, tunnelSlots, type Slot } from "./layout";

export type FlightItem = {
  id: string;
  url: string;
  /** A lighter derivative for small or low-density screens (the hero and the landing fill most of the frame). */
  urlSmall?: string;
  ratio: number;
  palette: string[];
  seq: number;
};

/** Mutable state written by the DOM stage (scroll, intro tweens) and read every frame here. */
export type FlightState = { progress: number; velocity: number; pixel: number; heroIn: number; px: number; py: number };

type Props = {
  hero: FlightItem;
  items: FlightItem[];
  final: FlightItem;
  state: React.RefObject<FlightState>;
  active: boolean;
  /** Device pixels across the stage, measured once by the DOM stage (see stagePixels). */
  pixels: number;
  /** The opening is over (or the visitor scrolls): time to put the rest of the archive on the GPU. */
  stream: boolean;
  onReady: () => void;
  onLoad: (pct: number) => void;
  /** The print nearest to the camera changed: the page light follows it. */
  onNear: (item: FlightItem) => void;
};

const VERT = /* glsl */ `
  uniform float uBend;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 p = position;
    float c = uv.x - 0.5;
    // Speed bends the print like film pulled through a gate.
    p.z -= c * c * uBend * 1.5;
    p.y += sin(uv.x * 3.14159) * uBend * 0.05;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const FRAG = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uOpacity;
  uniform float uShift;
  uniform float uPixel;
  uniform float uAspect;
  uniform float uDim;
  varying vec2 vUv;
  void main() {
    vec2 uv = vUv;
    // "Developing": the picture starts as a coarse mosaic and resolves to full sharpness.
    if (uPixel > 0.002) {
      float cells = mix(260.0, 9.0, pow(uPixel, 0.6));
      vec2 grid = vec2(cells * uAspect, cells);
      uv = (floor(uv * grid) + 0.5) / grid;
    }
    float s = uShift + uPixel * 0.012;
    vec3 col;
    col.r = texture2D(uMap, uv + vec2(s, 0.0)).r;
    col.g = texture2D(uMap, uv).g;
    col.b = texture2D(uMap, uv - vec2(s, 0.0)).b;
    col *= uDim;
    gl_FragColor = vec4(col, uOpacity);
  }
`;

type Uniforms = Record<"uMap" | "uOpacity" | "uShift" | "uPixel" | "uBend" | "uAspect" | "uDim", THREE.IUniform>;

type PrintProps = { item: FlightItem; slot: Slot; pixels: number; index: number; register: (index: number, mesh: THREE.Mesh | null) => void; onLoaded?: () => void };

/** One print. It suspends on its own texture, so a slow file never holds up the others. */
function Print({ item, slot, pixels, index, register, onLoaded }: PrintProps) {
  const [url] = useState(() => sourceOf(item, pixels));
  const texture = usePlainTexture(url);
  const uniforms = useMemo<Uniforms>(
    () => ({
      uMap: { value: texture },
      uOpacity: { value: 0 },
      uShift: { value: 0 },
      uPixel: { value: 0 },
      uBend: { value: 0 },
      uAspect: { value: item.ratio },
      uDim: { value: 1 },
    }),
    [texture, item.ratio],
  );

  useEffect(() => {
    onLoaded?.();
  }, [onLoaded]);

  return (
    <mesh
      ref={(m) => register(index, m)}
      position={[slot.x, slot.y, slot.z]}
      scale={[slot.w, slot.h, 1]}
    >
      <planeGeometry args={[1, 1, 18, 1]} />
      <shaderMaterial vertexShader={VERT} fragmentShader={FRAG} uniforms={uniforms} transparent depthWrite={false} depthTest={false} />
    </mesh>
  );
}

function Prints({ hero, items, final, state, pixels, stream, onReady, onNear }: Omit<Props, "active" | "onLoad">) {
  const all = useMemo(() => [hero, ...items, final], [hero, items, final]);
  const size = useThree((s) => s.size);
  const aspect = size.width / size.height;
  // The hero is all the opening needs: the rest of the archive follows once the shutter has opened,
  // so seventeen texture uploads never compete with the opening animation.
  const [heroIn, setHeroIn] = useState(false);
  const heroLoaded = useCallback(() => {
    setHeroIn(true);
    onReady();
  }, [onReady]);

  const { slots, camEnd } = useMemo(() => {
    const fin = finalSlot(items.length, final.ratio, aspect);
    const list: Slot[] = [heroSlot(hero.ratio, aspect), ...tunnelSlots(items.map((i) => i.ratio), aspect), fin.slot];
    return { slots: list, camEnd: fin.camEnd };
  }, [hero.ratio, items, final.ratio, aspect]);

  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  const smooth = useRef({ v: 0, px: 0, py: 0, near: -1, tick: 0 });
  const register = useCallback((i: number, m: THREE.Mesh | null) => {
    meshes.current[i] = m;
  }, []);

  useFrame((three, dt) => {
    const st = state.current;
    const sm = smooth.current;
    const k = 1 - Math.exp(-dt * 6);

    const vTarget = Math.max(-1, Math.min(1, st.velocity / 2600));
    sm.v += (vTarget - sm.v) * k;
    sm.px += (st.px - sm.px) * k * 0.6;
    sm.py += (st.py - sm.py) * k * 0.6;

    const camZ = cameraZ(st.progress, camEnd);
    const settle = smoothstep(ARRIVE - 0.1, ARRIVE, st.progress); // no parallax once the last print fills the frame
    three.camera.position.set(sm.px * 0.24 * (1 - settle), sm.py * 0.15 * (1 - settle), camZ);
    three.camera.rotation.set(sm.py * 0.02 * (1 - settle), -sm.px * 0.03 * (1 - settle), 0);

    const last = slots.length - 1;
    let near = -1;
    let nearD = 99;

    for (let i = 0; i < slots.length; i++) {
      const mesh = meshes.current[i];
      if (!mesh) continue;
      const u = (mesh.material as THREE.ShaderMaterial).uniforms;
      const d = camZ - slots[i].z;
      let opacity: number;
      let dim = 1;

      if (i === 0) {
        opacity = smoothstep(0.3, 1.5, d) * st.heroIn;
        u.uPixel.value = st.pixel;
        mesh.scale.set(slots[0].w * (1 + st.pixel * 0.1), slots[0].h * (1 + st.pixel * 0.1), 1);
      } else if (i === last) {
        opacity = 1 - smoothstep(11, 19, d);
      } else {
        opacity = (1 - smoothstep(9, 15, d)) * smoothstep(0.3, 1.5, d);
        dim = 1 - smoothstep(2.5, 13, d) * 0.62;
        if (d > 1.1 && d < nearD) {
          nearD = d;
          near = i;
        }
      }

      mesh.visible = opacity > 0.003;
      u.uOpacity.value = opacity;
      u.uDim.value = dim;
      u.uShift.value = Math.abs(sm.v) * 0.014;
      u.uBend.value = i === last ? 0 : sm.v * 1.1;
    }

    // Report the nearest print a few times a second: frame counter and ambient light follow the flight.
    if (++sm.tick % 8 === 0) {
      const idx = st.progress > ARRIVE - 0.04 ? last : st.progress < 0.05 ? 0 : near;
      if (idx >= 0 && idx !== sm.near) {
        sm.near = idx;
        onNear(all[idx]);
      }
    }
  });

  return (
    <>
      {slots.map((s, i) =>
        i === 0 || (heroIn && stream) ? (
          <Suspense key={all[i].id + i} fallback={null}>
            <Print item={all[i]} slot={s} pixels={pixels} index={i} register={register} onLoaded={i === 0 ? heroLoaded : undefined} />
          </Suspense>
        ) : null,
      )}
    </>
  );
}

// Subscribes outside React: the loading manager reports while other components
// are rendering, and a state update there would be an update-during-render.
function LoadReport({ onLoad }: { onLoad: (pct: number) => void }) {
  useEffect(() => {
    onLoad(useProgress.getState().progress);
    return useProgress.subscribe((s) => onLoad(s.progress));
  }, [onLoad]);
  return null;
}

export default function FlightScene({ active, onLoad, ...rest }: Props) {
  return (
    <Canvas
      className="!absolute inset-0 pointer-events-none"
      dpr={[1, 1.25]}
      camera={{ fov: FOV, near: 0.1, far: 60, position: [0, 0, 0] }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      frameloop={active ? "always" : "never"}
      aria-hidden
    >
      <LoadReport onLoad={onLoad} />
      <Suspense fallback={null}>
        <Prints {...rest} />
      </Suspense>
    </Canvas>
  );
}
