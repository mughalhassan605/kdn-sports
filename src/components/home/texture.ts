import { useLoader, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";

/**
 * A TextureLoader that requests images like an <img> does. three.js asks for
 * CORS by default, which the media on our own origin does not need, and a CORS
 * request cannot reuse the plain preloads Next.js makes for prefetched pages:
 * the same print would download twice.
 */
class PlainTextureLoader extends THREE.TextureLoader {
  constructor(manager?: THREE.LoadingManager) {
    super(manager);
    this.crossOrigin = undefined as unknown as string;
  }
}

/** drei's useTexture with plain requests: loads through Suspense and uploads to the GPU right away. */
export function usePlainTexture<T extends string | string[]>(input: T): T extends string[] ? THREE.Texture[] : THREE.Texture {
  const gl = useThree((s) => s.gl);
  const result = useLoader(PlainTextureLoader, input);
  useEffect(() => {
    for (const t of Array.isArray(result) ? result : [result]) gl.initTexture(t);
  }, [gl, result]);
  return result as T extends string[] ? THREE.Texture[] : THREE.Texture;
}
