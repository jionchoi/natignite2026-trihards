"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { type RoomLayout } from "@/lib/schemas";
import { Fixture } from "./Fixture";
import { SceneHoverChrome, type HoverInfo } from "./SceneObjectHover";

const WALL_ACCENT = "#7d8b96";
const FLOOR_ACCENT = "#5d6e78";
const FLOOR_THICKNESS = 0.18;
const FLOOR_MARGIN = 0.4;

interface RoomSceneProps {
  layout: RoomLayout;
  onFixtureMove?: (id: string, position: [number, number, number]) => void;
  onFixtureRotate?: (id: string, rotationY: number) => void;
  onFixtureDragStart?: () => void;
  onFixtureDragEnd?: () => void;
  onHoverChange?: (info: HoverInfo | null) => void;
}

export function RoomScene({
  layout,
  onFixtureMove,
  onFixtureRotate,
  onFixtureDragStart,
  onFixtureDragEnd,
  onHoverChange,
}: RoomSceneProps) {
  const floorBox = useMemo(() => {
    // Gemini's floor polygon and wall coordinates often don't share an origin,
    // which leaves a polygon-shaped floor offset from the walls. Derive the
    // floor's footprint from the actual building extents (walls + fixtures +
    // any floor polygon points) so the slab is guaranteed to sit underneath
    // everything visible.
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    const accept = (x: number, z: number) => {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    };
    for (const w of layout.walls) {
      accept(w.start[0], w.start[1]);
      accept(w.end[0], w.end[1]);
    }
    for (const f of layout.fixtures) {
      const halfW = f.size[0] / 2;
      const halfD = f.size[2] / 2;
      accept(f.position[0] - halfW, f.position[2] - halfD);
      accept(f.position[0] + halfW, f.position[2] + halfD);
    }
    for (const [x, z] of layout.floor.polygon) {
      accept(x, z);
    }
    if (!Number.isFinite(minX)) {
      minX = -2;
      maxX = 2;
      minZ = -2;
      maxZ = 2;
    }
    minX -= FLOOR_MARGIN;
    maxX += FLOOR_MARGIN;
    minZ -= FLOOR_MARGIN;
    maxZ += FLOOR_MARGIN;
    return {
      cx: (minX + maxX) / 2,
      cz: (minZ + maxZ) / 2,
      sizeX: Math.max(maxX - minX, 0.5),
      sizeZ: Math.max(maxZ - minZ, 0.5),
    };
  }, [layout.floor.polygon, layout.walls, layout.fixtures]);

  return (
    <group>
      <SceneHoverChrome
        title="Floor"
        subtitle="Walkable area estimated from your photo (layout is approximate)"
        accentColor={FLOOR_ACCENT}
        pinLocalY={0.04}
        onHoverChange={onHoverChange}
      >
        {/* Slab centered on the building footprint. Top face sits at y=0
            (where walls and fixtures already start) so the building visibly
            rests on top of the floor. */}
        <mesh
          position={[floorBox.cx, -FLOOR_THICKNESS / 2, floorBox.cz]}
          receiveShadow
          castShadow
        >
          <boxGeometry
            args={[floorBox.sizeX, FLOOR_THICKNESS, floorBox.sizeZ]}
          />
          <meshStandardMaterial color="#2a3338" roughness={0.95} />
        </mesh>
      </SceneHoverChrome>

      <gridHelper
        args={[40, 40, "#3a4750", "#1d262c"]}
        position={[0, 0.002, 0]}
      />

      {layout.walls.map((wall, idx) => (
        <Wall key={idx} wall={wall} onHoverChange={onHoverChange} />
      ))}

      {layout.fixtures.map((fixture) => (
        <Fixture
          key={fixture.id}
          fixture={fixture}
          onMove={onFixtureMove}
          onRotate={onFixtureRotate}
          onDragStart={onFixtureDragStart}
          onDragEnd={onFixtureDragEnd}
          onHoverChange={onHoverChange}
        />
      ))}
    </group>
  );
}

function Wall({
  wall,
  onHoverChange,
}: {
  wall: { start: [number, number]; end: [number, number]; height: number };
  onHoverChange?: (info: HoverInfo | null) => void;
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
        onHoverChange={onHoverChange}
      >
        <mesh castShadow receiveShadow>
          <boxGeometry args={[length, wall.height, thickness]} />
          <meshStandardMaterial color="#3a414a" roughness={0.85} />
        </mesh>
      </SceneHoverChrome>
    </group>
  );
}
