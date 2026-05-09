"use client";

import { Suspense, useLayoutEffect, useMemo, useState } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { SceneSuggestionItem } from "@/lib/sceneSuggestions";
import { SCENE_ROOM_SCALE } from "@/lib/sceneScale";
import { SceneHoverChrome } from "./SceneObjectHover";

const ACCENT = "#1D9E75";

function OnlineModelMesh({ item }: { item: SceneSuggestionItem }) {
  const { scene } = useGLTF(item.glbUrl);
  const clone = useMemo(() => scene.clone(true), [scene]);
  const [pinY, setPinY] = useState(item.size[1]);

  useLayoutEffect(() => {
    clone.traverse((ch) => {
      const m = ch as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });

    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    box.getSize(size);
    const sx = item.size[0] / Math.max(size.x, 1e-6);
    const sy = item.size[1] / Math.max(size.y, 1e-6);
    const sz = item.size[2] / Math.max(size.z, 1e-6);
    const s = Math.min(sx, sy, sz) * 0.94;
    clone.scale.setScalar(s);

    const after = new THREE.Box3().setFromObject(clone);
    const cx = (after.min.x + after.max.x) / 2;
    const cz = (after.min.z + after.max.z) / 2;
    clone.position.set(-cx, -after.min.y, -cz);

    setPinY(after.max.y - after.min.y);
  }, [clone, item.glbUrl, item.size]);

  const wx = item.position[0] * SCENE_ROOM_SCALE;
  const wy = item.position[1];
  const wz = item.position[2] * SCENE_ROOM_SCALE;

  return (
    <group position={[wx, wy, wz]} rotation={[0, item.rotationY, 0]}>
      <SceneHoverChrome
        title={item.label}
        subtitle={item.reason}
        accentColor={ACCENT}
        pinLocalY={pinY}
      >
        <primitive object={clone} />
      </SceneHoverChrome>
    </group>
  );
}

function PlacementFallback({ item }: { item: SceneSuggestionItem }) {
  const [w, h, d] = item.size;
  const hx = h * 0.6;
  const wx = item.position[0] * SCENE_ROOM_SCALE;
  const wy = item.position[1];
  const wz = item.position[2] * SCENE_ROOM_SCALE;

  return (
    <group position={[wx, wy, wz]} rotation={[0, item.rotationY, 0]}>
      <SceneHoverChrome
        title={item.label}
        subtitle={item.reason}
        accentColor={ACCENT}
        pinLocalY={hx}
      >
        <mesh position={[0, hx / 2, 0]} castShadow>
          <boxGeometry args={[w * 0.6, hx, d * 0.6]} />
          <meshStandardMaterial
            color="#5a7ab8"
            roughness={0.75}
            transparent
            opacity={0.35}
          />
        </mesh>
      </SceneHoverChrome>
    </group>
  );
}

export function OnlinePlacements({
  items,
}: {
  items: SceneSuggestionItem[];
}) {
  return (
    <group>
      {items.map((item) => (
        <Suspense key={item.id} fallback={<PlacementFallback item={item} />}>
          <OnlineModelMesh item={item} />
        </Suspense>
      ))}
    </group>
  );
}
