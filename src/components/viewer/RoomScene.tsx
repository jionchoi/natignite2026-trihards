"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { type RoomLayout } from "@/lib/schemas";
import { Fixture } from "./Fixture";
import { SceneHoverChrome } from "./SceneObjectHover";

const WALL_ACCENT = "#7d8b96";
const FLOOR_ACCENT = "#5d6e78";

interface RoomSceneProps {
  layout: RoomLayout;
}

export function RoomScene({ layout }: RoomSceneProps) {
  const floorGeometry = useMemo(() => {
    const shape = new THREE.Shape(
      layout.floor.polygon.map(([x, z]) => new THREE.Vector2(x, z)),
    );
    const geom = new THREE.ShapeGeometry(shape);
    // Lay the shape flat on the y=0 plane (rotation -PI/2 around X).
    geom.rotateX(-Math.PI / 2);
    geom.computeBoundingBox();
    return geom;
  }, [layout.floor.polygon]);

  const floorPinY =
    floorGeometry.boundingBox?.max.y != null
      ? floorGeometry.boundingBox.max.y + 0.02
      : 0.04;

  return (
    <group>
      <SceneHoverChrome
        title="Floor"
        subtitle="Walkable area estimated from your photo (layout is approximate)"
        accentColor={FLOOR_ACCENT}
        pinLocalY={floorPinY}
        htmlLift={0.16}
        distanceFactor={15}
      >
        <mesh geometry={floorGeometry} receiveShadow>
          <meshStandardMaterial color="#2a3338" roughness={0.95} />
        </mesh>
      </SceneHoverChrome>

      <gridHelper
        args={[40, 40, "#3a4750", "#1d262c"]}
        position={[0, 0.001, 0]}
      />

      {layout.walls.map((wall, idx) => (
        <Wall key={idx} wall={wall} />
      ))}

      {layout.fixtures.map((fixture) => (
        <Fixture key={fixture.id} fixture={fixture} />
      ))}
    </group>
  );
}

function Wall({
  wall,
}: {
  wall: { start: [number, number]; end: [number, number]; height: number };
}) {
  const [x1, z1] = wall.start;
  const [x2, z2] = wall.end;
  const dx = x2 - x1;
  const dz = z2 - z1;
  const length = Math.sqrt(dx * dx + dz * dz);
  if (length < 1e-4) return null;

  const cx = (x1 + x2) / 2;
  const cz = (z1 + z2) / 2;
  const angle = Math.atan2(dz, dx);
  const thickness = 0.08;

  return (
    <group position={[cx, wall.height / 2, cz]} rotation={[0, -angle, 0]}>
      <SceneHoverChrome
        title="Wall"
        subtitle="Room boundary estimated from your photo"
        accentColor={WALL_ACCENT}
        pinLocalY={wall.height / 2 + 0.03}
        htmlLift={0.18}
        distanceFactor={12}
      >
        <mesh castShadow receiveShadow>
          <boxGeometry args={[length, wall.height, thickness]} />
          <meshStandardMaterial color="#3a414a" roughness={0.85} />
        </mesh>
      </SceneHoverChrome>
    </group>
  );
}
