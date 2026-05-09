"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { type Category } from "@/lib/categories";
import {
  type Persona,
  ALL_PERSONAS,
  PERSONA_CATEGORIES,
  PERSONA_COLOR,
  PERSONA_SHORT,
} from "@/lib/personas";
import { treadCount } from "@/lib/stairs";
import { Agent } from "./Agent";

export interface IssueZone {
  issueId: string;
  title: string;
  category: Category;
  position: THREE.Vector3;
}

export interface ReportEvent {
  issueId: string;
  persona: Persona;
  ts: number;
}

export type BlockerShape =
  | { kind: "box"; halfW: number; halfD: number; rotY: number }
  | { kind: "cylinder"; radius: number };

export interface Blocker {
  x: number;
  z: number;
  shape: BlockerShape;
  // If set, this blocker only blocks the listed personas (e.g. a step blocks
  // wheelchair users but is walkable for ambulatory/blind users).
  blocksOnly?: Persona[];
}

export interface Walkable {
  type: "step" | "ramp";
  x: number;
  z: number;
  halfW: number;
  halfD: number;
  rotY: number;
  height: number;
}

interface AgentSimulationProps {
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  issueZones: IssueZone[];
  obstacles?: Blocker[];
  walkables?: Walkable[];
  personas?: Persona[];
  onReport: (e: ReportEvent) => void;
  speed?: number;
}

interface AgentState {
  persona: Persona;
  position: THREE.Vector3;
  target: THREE.Vector3;
  rotation: number;
  pause: number;
  speakingMessage: string | null;
  reported: Set<string>;
  // Smoothed Y position so the agent visibly steps up/down on ramps and steps
  // instead of teleporting vertically.
  visualY: number;
}

const ENCOUNTER_RADIUS = 0.8;
const PAUSE_DURATION = 3.0;
const NEW_TARGET_RADIUS = 0.3;

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

// Margin keeps agents from clipping into a fixture's edge.
const COLLISION_PAD = 0.25;

// Angles tried (in this order) when the straight path is blocked. ±45° first,
// then ±90°, then ±135°, then a full reverse — matches how a person scans for
// an opening when they bump into something.
const AVOIDANCE_OFFSETS = [
  Math.PI / 4,
  -Math.PI / 4,
  Math.PI / 2,
  -Math.PI / 2,
  (Math.PI * 3) / 4,
  -(Math.PI * 3) / 4,
  Math.PI,
];

function isInsideBlocker(
  x: number,
  z: number,
  obstacles: Blocker[],
  persona: Persona | null,
): boolean {
  for (const o of obstacles) {
    if (o.blocksOnly && persona && !o.blocksOnly.includes(persona)) continue;
    if (o.shape.kind === "cylinder") {
      const dx = x - o.x;
      const dz = z - o.z;
      const r = o.shape.radius + COLLISION_PAD;
      if (dx * dx + dz * dz < r * r) return true;
    } else {
      // Rotated AABB: transform the world point into the box's local frame and
      // compare against the half-extents. Without this rotated counters and
      // doors leak through their corners.
      const cos = Math.cos(-o.shape.rotY);
      const sin = Math.sin(-o.shape.rotY);
      const dx = x - o.x;
      const dz = z - o.z;
      const lx = dx * cos - dz * sin;
      const lz = dx * sin + dz * cos;
      if (
        Math.abs(lx) < o.shape.halfW + COLLISION_PAD &&
        Math.abs(lz) < o.shape.halfD + COLLISION_PAD
      ) {
        return true;
      }
    }
  }
  return false;
}

function isOpenSpot(
  x: number,
  z: number,
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number },
  obstacles: Blocker[],
  persona: Persona | null,
): boolean {
  return (
    x > bounds.minX &&
    x < bounds.maxX &&
    z > bounds.minZ &&
    z < bounds.maxZ &&
    !isInsideBlocker(x, z, obstacles, persona)
  );
}

// Height of any walkable surface at (x, z). Floor is 0; a step lifts the agent
// to its full height; a ramp interpolates linearly along its local +z axis.
function surfaceHeightAt(
  x: number,
  z: number,
  walkables: Walkable[],
): number {
  let max = 0;
  for (const w of walkables) {
    const cos = Math.cos(-w.rotY);
    const sin = Math.sin(-w.rotY);
    const dx = x - w.x;
    const dz = z - w.z;
    const lx = dx * cos - dz * sin;
    const lz = dx * sin + dz * cos;
    if (Math.abs(lx) >= w.halfW || Math.abs(lz) >= w.halfD) continue;
    let h: number;
    if (w.type === "step") {
      // Multi-tread staircase: front (local +z) is the highest tread, back
      // (local -z) is the lowest. Splitting the footprint into N equal slices
      // lets the agent's foot land on each tread instead of warping to the
      // top in one frame.
      const treads = treadCount(w.height);
      const treadDepth = (2 * w.halfD) / treads;
      const distFromBack = lz + w.halfD; // 0..2*halfD
      const idx = Math.min(
        treads - 1,
        Math.max(0, Math.floor(distFromBack / treadDepth)),
      );
      h = ((idx + 1) * w.height) / treads;
    } else {
      // Ramp surface: low (y=0) at local -z, high (y=height) at local +z.
      // Matches the triangular prism in Fixture.tsx (RampMesh).
      const t = (lz + w.halfD) / (2 * w.halfD);
      h = Math.max(0, Math.min(1, t)) * w.height;
    }
    if (h > max) max = h;
  }
  return max;
}

export function AgentSimulation({
  bounds,
  issueZones,
  obstacles = [],
  walkables = [],
  personas = ALL_PERSONAS,
  onReport,
  speed = 0.6,
}: AgentSimulationProps) {
  const newRandomPoint = useMemo(
    () => (persona: Persona | null = null) => {
      // Try a few times to land outside any blocker so agents don't spawn
      // their target inside furniture. `persona === null` means treat
      // every blocker as blocking (used when picking arbitrary navigation
      // points without a specific agent).
      for (let attempt = 0; attempt < 12; attempt++) {
        const x = rand(bounds.minX, bounds.maxX);
        const z = rand(bounds.minZ, bounds.maxZ);
        if (!isInsideBlocker(x, z, obstacles, persona)) {
          return new THREE.Vector3(x, 0, z);
        }
      }
      return new THREE.Vector3(
        rand(bounds.minX, bounds.maxX),
        0,
        rand(bounds.minZ, bounds.maxZ),
      );
    },
    [bounds, obstacles],
  );

  const agentsRef = useRef<AgentState[]>([]);
  if (agentsRef.current.length < personas.length) {
    // Append new agents for added personas; keep existing agents in place so
    // adding a person doesn't teleport everyone to a fresh random position.
    for (let i = agentsRef.current.length; i < personas.length; i++) {
      const persona = personas[i];
      const start = newRandomPoint(persona);
      agentsRef.current.push({
        persona,
        position: start,
        target: newRandomPoint(persona),
        rotation: Math.random() * Math.PI * 2,
        pause: 0,
        speakingMessage: null,
        reported: new Set<string>(),
        visualY: 0,
      });
    }
  } else if (agentsRef.current.length > personas.length) {
    agentsRef.current = agentsRef.current.slice(0, personas.length);
  }

  const groupRefs = useRef<(THREE.Group | null)[]>([]);
  // React state for which agents currently have a speech bubble (sparse).
  const [bubbles, setBubbles] = useState<Record<number, string | undefined>>({});

  useFrame((_, deltaRaw) => {
    const delta = Math.min(deltaRaw, 0.1);
    const agents = agentsRef.current;

    for (let i = 0; i < agents.length; i++) {
      const a = agents[i];

      if (a.pause > 0) {
        a.pause -= delta;
        if (a.pause <= 0) {
          a.speakingMessage = null;
          setBubbles((prev) => {
            if (prev[i] === undefined) return prev;
            const next = { ...prev };
            delete next[i];
            return next;
          });
        }
      } else {
        // Steer toward target
        const dx = a.target.x - a.position.x;
        const dz = a.target.z - a.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < NEW_TARGET_RADIUS) {
          a.target = newRandomPoint(a.persona);
        } else {
          const step = speed * delta;
          const candX = a.position.x + (dx / dist) * step;
          const candZ = a.position.z + (dz / dist) * step;

          if (isOpenSpot(candX, candZ, bounds, obstacles, a.persona)) {
            a.position.x = candX;
            a.position.z = candZ;
          } else {
            // Blocked. Scan for an open direction starting at the smallest
            // turn (±45°) and project a fresh near-term target along it so the
            // agent visibly changes heading and walks around the fixture.
            const heading = Math.atan2(dx, dz);
            let foundAngle: number | null = null;
            for (const off of AVOIDANCE_OFFSETS) {
              const ang = heading + off;
              const tryX = a.position.x + Math.sin(ang) * step;
              const tryZ = a.position.z + Math.cos(ang) * step;
              if (isOpenSpot(tryX, tryZ, bounds, obstacles, a.persona)) {
                a.position.x = tryX;
                a.position.z = tryZ;
                foundAngle = ang;
                break;
              }
            }
            if (foundAngle !== null) {
              const reach = 1.6;
              a.target = new THREE.Vector3(
                a.position.x + Math.sin(foundAngle) * reach,
                0,
                a.position.z + Math.cos(foundAngle) * reach,
              );
            } else {
              a.target = newRandomPoint(a.persona);
            }
          }

          // Rotate toward the (possibly updated) heading.
          const ndx = a.target.x - a.position.x;
          const ndz = a.target.z - a.position.z;
          const targetRot = Math.atan2(ndx, ndz);
          let dr = targetRot - a.rotation;
          while (dr > Math.PI) dr -= 2 * Math.PI;
          while (dr < -Math.PI) dr += 2 * Math.PI;
          a.rotation += dr * Math.min(1, delta * 6);
        }

        // Encounter check
        for (const zone of issueZones) {
          if (a.reported.has(zone.issueId)) continue;
          if (!PERSONA_CATEGORIES[a.persona].includes(zone.category)) continue;
          const ddx = zone.position.x - a.position.x;
          const ddz = zone.position.z - a.position.z;
          if (ddx * ddx + ddz * ddz < ENCOUNTER_RADIUS * ENCOUNTER_RADIUS) {
            a.reported.add(zone.issueId);
            a.pause = PAUSE_DURATION;
            a.speakingMessage = zone.title;
            const idx = i;
            setBubbles((prev) => ({ ...prev, [idx]: zone.title }));
            onReport({
              issueId: zone.issueId,
              persona: a.persona,
              ts: Date.now(),
            });
            break;
          }
        }
      }

      // Vertical step-up / step-down on walkable surfaces. Lerping (rather
      // than snapping) gives a brief lift so it reads as climbing rather than
      // teleporting.
      const targetY = surfaceHeightAt(a.position.x, a.position.z, walkables);
      a.visualY += (targetY - a.visualY) * Math.min(1, delta * 8);

      const g = groupRefs.current[i];
      if (g) {
        g.position.set(a.position.x, a.visualY, a.position.z);
        g.rotation.y = a.rotation;
      }
    }
  });

  // Reset reported sets when the issue zones change (e.g. layout regenerated).
  useEffect(() => {
    for (const a of agentsRef.current) a.reported = new Set();
  }, [issueZones]);

  return (
    <group>
      {agentsRef.current.map((a, i) => {
        const accent = PERSONA_COLOR[a.persona];
        return (
          <group
            key={i}
            ref={(el) => {
              groupRefs.current[i] = el;
            }}
          >
            <Agent persona={a.persona} />
            {bubbles[i] ? (
              <Html
                position={[0, 1.55, 0]}
                center
                distanceFactor={6}
                zIndexRange={[0, 100]}
              >
                <div
                  className="pointer-events-none rounded-md border bg-bg-elevated/95 px-2 py-1 text-[11px] font-medium text-fg shadow-xl backdrop-blur whitespace-nowrap"
                  style={{ borderColor: accent }}
                >
                  <span
                    className="mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle"
                    style={{ background: accent }}
                  />
                  <span className="text-fg-subtle">
                    {PERSONA_SHORT[a.persona]}
                  </span>
                  {" · "}
                  {bubbles[i]}
                </div>
              </Html>
            ) : null}
          </group>
        );
      })}
    </group>
  );
}
