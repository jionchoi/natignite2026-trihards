"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { type Issue, type RoomLayout } from "@/lib/schemas";
import { type Persona } from "@/lib/personas";
import { SCENE_ROOM_SCALE } from "@/lib/sceneScale";
import type { SceneSuggestionItem } from "@/lib/sceneSuggestions";
import { RoomScene } from "./RoomScene";
import { OnlinePlacements } from "./OnlinePlacements";
import {
  AgentSimulation,
  type Blocker,
  type IssueZone,
  type ReportEvent,
  type Walkable,
} from "./AgentSimulation";

interface SceneViewerProps {
  layout: RoomLayout;
  issues?: Issue[];
  simRunning?: boolean;
  personas?: Persona[];
  speed?: number;
  onReport?: (e: ReportEvent) => void;
  /** AI-suggested props loaded as GLBs from curated online URLs */
  onlinePlacements?: SceneSuggestionItem[];
  className?: string;
}

// Spread the room out so agents have walking room. Fixtures keep their real
// size and human-scale wall heights stay put — only floor/wall extents and
// fixture xz placements scale.

export function SceneViewer({
  layout,
  issues = [],
  simRunning = false,
  personas,
  speed,
  onReport,
  onlinePlacements = [],
  className,
}: SceneViewerProps) {
  const controlsRef = useRef<any>(null);

  const scaledLayout = useMemo<RoomLayout>(
    () => ({
      floor: {
        polygon: layout.floor.polygon.map(
          ([x, z]) =>
            [x * SCENE_ROOM_SCALE, z * SCENE_ROOM_SCALE] as [number, number],
        ),
      },
      walls: layout.walls.map((w) => ({
        start: [
          w.start[0] * SCENE_ROOM_SCALE,
          w.start[1] * SCENE_ROOM_SCALE,
        ] as [number, number],
        end: [
          w.end[0] * SCENE_ROOM_SCALE,
          w.end[1] * SCENE_ROOM_SCALE,
        ] as [number, number],
        height: w.height,
      })),
      fixtures: layout.fixtures.map((f) => ({
        ...f,
        position: [
          f.position[0] * SCENE_ROOM_SCALE,
          f.position[1],
          f.position[2] * SCENE_ROOM_SCALE,
        ] as [number, number, number],
      })),
    }),
    [layout],
  );

  const { camPos, target, distance, bounds } = useMemo(() => {
    let minX = Infinity,
      maxX = -Infinity,
      minZ = Infinity,
      maxZ = -Infinity;
    for (const [x, z] of scaledLayout.floor.polygon) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    }
    const cx = (minX + maxX) / 2;
    const cz = (minZ + maxZ) / 2;
    const sizeX = maxX - minX;
    const sizeZ = maxZ - minZ;
    const wallHeight =
      scaledLayout.walls.reduce((acc, w) => Math.max(acc, w.height), 0) || 2.7;
    const dist = Math.max(Math.max(sizeX, sizeZ, wallHeight) * 1.6, 4);
    return {
      bounds: {
        minX: minX + 0.5,
        maxX: maxX - 0.5,
        minZ: minZ + 0.5,
        maxZ: maxZ - 0.5,
      },
      camPos: [
        cx + dist * 0.7,
        wallHeight / 2 + dist * 0.55,
        cz + dist * 0.7,
      ] as [number, number, number],
      target: [cx, wallHeight / 3, cz] as [number, number, number],
      distance: dist,
    };
  }, [scaledLayout]);

  const issueZones = useMemo<IssueZone[]>(() => {
    if (!issues.length || !scaledLayout.fixtures.length) return [];
    const fixturesById = new Map(scaledLayout.fixtures.map((f) => [f.id, f]));
    const zones: IssueZone[] = [];
    for (const issue of issues) {
      if (!issue.relatedFixtureId) continue;
      const fx = fixturesById.get(issue.relatedFixtureId);
      if (!fx) continue;
      zones.push({
        issueId: issue.id,
        title: issue.title,
        category: issue.category,
        position: new THREE.Vector3(fx.position[0], 0, fx.position[2]),
      });
    }
    return zones;
  }, [issues, scaledLayout.fixtures]);

  // Preload GLBs for any AI-suggested online props so they don't pop in late.
  useEffect(() => {
    if (!onlinePlacements.length) return;
    const urls = [...new Set(onlinePlacements.map((p) => p.glbUrl))];
    for (const u of urls) useGLTF.preload(u);
  }, [onlinePlacements]);

  // Per-fixture collision data. Solid furniture is a hard blocker for everyone;
  // ramps are walkable surfaces (no blocker); steps are walkable for ambulatory
  // and blind users but block wheelchairs. Online props are appended as plain
  // box blockers so agents route around them too.
  const { obstacles, walkables } = useMemo(() => {
    const obstacles: Blocker[] = [];
    const walkables: Walkable[] = [];
    for (const f of scaledLayout.fixtures) {
      // Wall-mounted / decorative — never block agents on the floor.
      if (f.type === "grab_bar" || f.type === "signage") continue;

      const x = f.position[0];
      const z = f.position[2];
      const halfW = f.size[0] / 2;
      const halfD = f.size[2] / 2;
      const rotY = f.rotationY ?? 0;

      if (f.type === "ramp") {
        walkables.push({
          type: "ramp",
          x,
          z,
          halfW,
          halfD,
          rotY,
          height: f.size[1],
        });
        continue;
      }
      if (f.type === "step") {
        walkables.push({
          type: "step",
          x,
          z,
          halfW,
          halfD,
          rotY,
          height: f.size[1],
        });
        // Wheelchair users can't roll up a step — keep them off it.
        obstacles.push({
          x,
          z,
          shape: { kind: "box", halfW, halfD, rotY },
          blocksOnly: ["wheelchair"],
        });
        continue;
      }
      if (f.type === "column") {
        // Column geometry is a cylinder; use a circular footprint so corners
        // don't phantom-block adjacent walking space.
        obstacles.push({
          x,
          z,
          shape: { kind: "cylinder", radius: Math.min(halfW, halfD) },
        });
        continue;
      }
      obstacles.push({
        x,
        z,
        shape: { kind: "box", halfW, halfD, rotY },
      });
    }
    for (const p of onlinePlacements) {
      obstacles.push({
        x: p.position[0] * SCENE_ROOM_SCALE,
        z: p.position[2] * SCENE_ROOM_SCALE,
        shape: {
          kind: "box",
          halfW: p.size[0] / 2,
          halfD: p.size[2] / 2,
          rotY: 0,
        },
      });
    }
    return { obstacles, walkables };
  }, [scaledLayout.fixtures, onlinePlacements]);

  return (
    <div className={className}>
      <div className="relative h-full w-full overflow-hidden rounded-xl border border-border bg-black">
        <Canvas
          camera={{ position: camPos, fov: 45 }}
          dpr={[1, 2]}
          shadows
          gl={{ antialias: true }}
        >
          <color attach="background" args={["#0a0d12"]} />
          <ambientLight intensity={0.55} />
          <directionalLight
            position={[8, 12, 6]}
            intensity={1.1}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <directionalLight position={[-6, 6, -4]} intensity={0.3} />
          <hemisphereLight args={["#dde9f1", "#1a1f24", 0.4]} />

          <Suspense fallback={null}>
            <RoomScene layout={scaledLayout} />

            {onlinePlacements.length > 0 ? (
              <OnlinePlacements items={onlinePlacements} />
            ) : null}

            {/* Issue zones — soft pulsing rings on the floor */}
            {issueZones.map((z) => (
              <mesh
                key={z.issueId}
                position={[z.position.x, 0.005, z.position.z]}
                rotation={[-Math.PI / 2, 0, 0]}
              >
                <ringGeometry args={[0.55, 0.8, 32]} />
                <meshBasicMaterial
                  color="#ff7a3a"
                  transparent
                  opacity={0.55}
                />
              </mesh>
            ))}

            {simRunning ? (
              <AgentSimulation
                bounds={bounds}
                issueZones={issueZones}
                obstacles={obstacles}
                walkables={walkables}
                personas={personas}
                speed={speed}
                onReport={onReport ?? (() => {})}
              />
            ) : null}
          </Suspense>
          <OrbitControls
            ref={controlsRef}
            target={target}
            enableDamping
            dampingFactor={0.1}
            minDistance={1}
            maxDistance={Math.max(distance * 3, 20)}
            maxPolarAngle={Math.PI / 2 - 0.05}
          />
        </Canvas>
        <div className="pointer-events-none absolute left-3 top-3 rounded-md border border-border bg-bg-elevated/80 px-2 py-1 text-[11px] text-fg-muted backdrop-blur">
          Procedural · low-poly approximation
          {onlinePlacements.length > 0 ? (
            <>
              {" · "}
              {onlinePlacements.length} online GLB prop
              {onlinePlacements.length === 1 ? "" : "s"}
            </>
          ) : null}
          {issueZones.length > 0 ? (
            <>
              {" · "}
              {issueZones.length} issue zone
              {issueZones.length === 1 ? "" : "s"}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
