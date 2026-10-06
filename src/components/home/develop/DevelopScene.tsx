"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { usePlainTexture } from "../texture";

/** Written by the DOM stage from scroll, read here every frame. */
export type DevelopState = { dissolve: number; pixel: number };

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Simplex noise by Ian McEwan / Stefan Gustavson (MIT), the usual 2D variant.
const FRAG = /* glsl */ `
  uniform sampler2D uPreview;
  uniform sampler2D uClean;
  uniform float uDissolve;
  uniform float uPixel;
  uniform float uTime;
  uniform float uAspect;
  varying vec2 vUv;

  vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 uv = vUv;

    // The preview side can sit behind a mosaic: "you have not found it yet".
    vec2 puv = uv;
    if (uPixel > 0.002) {
      float cells = mix(220.0, 12.0, pow(uPixel, 0.65));
      vec2 grid = vec2(cells * uAspect, cells);
      puv = (floor(uv * grid) + 0.5) / grid;
    }
    vec3 preview = texture2D(uPreview, puv).rgb;
    vec3 clean = texture2D(uClean, uv).rgb;

    // A front that crosses from left to right with a liquid, uneven edge.
    vec2 nuv = vec2(uv.x * uAspect, uv.y);
    float n = snoise(nuv * 2.4 + vec2(0.0, uTime * 0.06)) * 0.5 + 0.5;
    float fine = snoise(nuv * 9.0 - vec2(uTime * 0.04, 0.0)) * 0.5 + 0.5;
    float field = uv.x * 0.7 + n * 0.22 + fine * 0.08;
    float front = uDissolve * 1.22 - 0.11;
    float mask = smoothstep(front - 0.012, front + 0.012, field);

    vec3 col = mix(clean, preview, mask);

    // The light on the front, in the accent colour, with a soft trailing bloom.
    float live = step(0.001, uDissolve) * step(uDissolve, 0.999);
    float line = smoothstep(0.035, 0.0, abs(field - front)) * live;
    float bloom = smoothstep(0.22, 0.0, front - field) * step(field, front) * live;
    col += vec3(0.83, 1.0, 0.25) * (line * 0.95 + bloom * 0.1);

    gl_FragColor = vec4(col, 1.0);
  }
`;

function Print({ preview, clean, ratio, state }: { preview: string; clean: string; ratio: number; state: React.RefObject<DevelopState> }) {
  const [a, b] = usePlainTexture([preview, clean]);
  const viewport = useThree((s) => s.viewport);
  const mesh = useRef<THREE.Mesh>(null);

  const uniforms = useMemo(
    () => ({
      uPreview: { value: a },
      uClean: { value: b },
      uDissolve: { value: 0 },
      uPixel: { value: 0 },
      uTime: { value: 0 },
      uAspect: { value: ratio },
    }),
    [a, b, ratio],
  );

  useFrame((three) => {
    if (!mesh.current) return;
    const u = (mesh.current.material as THREE.ShaderMaterial).uniforms;
    u.uDissolve.value = state.current.dissolve;
    u.uPixel.value = state.current.pixel;
    u.uTime.value = three.clock.elapsedTime;
  });

  return (
    <mesh ref={mesh} scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial vertexShader={VERT} fragmentShader={FRAG} uniforms={uniforms} />
    </mesh>
  );
}

export default function DevelopScene({
  preview,
  clean,
  ratio,
  state,
  active,
}: {
  preview: string;
  clean: string;
  ratio: number;
  state: React.RefObject<DevelopState>;
  active: boolean;
}) {
  return (
    <Canvas
      className="!absolute inset-0"
      orthographic
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 5], zoom: 1 }}
      gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
      frameloop={active ? "always" : "never"}
      aria-hidden
    >
      <Suspense fallback={null}>
        <Print preview={preview} clean={clean} ratio={ratio} state={state} />
      </Suspense>
    </Canvas>
  );
}
