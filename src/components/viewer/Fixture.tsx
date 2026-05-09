"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { type Fixture as FixtureData, type FixtureType } from "@/lib/schemas";
import { treadCount } from "@/lib/stairs";
import { SceneHoverChrome } from "./SceneObjectHover";

interface FixtureProps {
  fixture: FixtureData;
}

function humanFixtureType(type: FixtureType): string {
  const labels: Record<FixtureType, string> = {
    door: "Door",
    toilet: "Toilet",
    sink: "Sink",
    grab_bar: "Grab bar",
    signage: "Signage",
    seating: "Seating",
    counter: "Counter",
    obstacle: "Obstacle / clutter",
    column: "Column",
    ramp: "Ramp",
    step: "Step / level change",
    other: "Object",
  };
  return labels[type];
}

const COLORS: Record<FixtureType, string> = {
  door: "#a87a4f",
  toilet: "#dde3e6",
  sink: "#c8cfd4",
  grab_bar: "#f5c84b",
  signage: "#4fc66c",
  seating: "#7a6a5a",
  counter: "#9097a0",
  obstacle: "#ff6b4a",
  column: "#4a525c",
  ramp: "#5a8eef",
  step: "#787f88",
  other: "#6a727c",
};

export function Fixture({ fixture }: FixtureProps) {
  const [w, h, d] = fixture.size;
  const [px, py, pz] = fixture.position;
  const color = COLORS[fixture.type];
  const kind = humanFixtureType(fixture.type);
  const customLabel = fixture.label?.trim();
  const title = customLabel || kind;
  const subtitle = customLabel
    ? `${kind} · placed from your photo (layout estimate)`
    : `${kind} · inferred from your photo`;

  // The geometry switch puts each shape's bottom at local y = 0 (so fixtures
  // sit cleanly on the floor). Gemini supplies position as the *center* of the
  // bounding box, so subtract h/2 from the outer y to land the fixture
  // correctly. For wall-mounted fixtures Gemini's center y still represents
  // the bar's vertical midpoint, so the same arithmetic works.
  return (
    <group
      position={[px, py - h / 2, pz]}
      rotation={[0, fixture.rotationY ?? 0, 0]}
    >
      <SceneHoverChrome
        title={title}
        subtitle={subtitle}
        accentColor={color}
        pinLocalY={h}
        htmlLift={0.2}
        distanceFactor={11}
      >
        <FixtureGeometry type={fixture.type} size={[w, h, d]} color={color} />
      </SceneHoverChrome>
    </group>
  );
}

function FixtureGeometry({
  type,
  size,
  color,
}: {
  type: FixtureType;
  size: [number, number, number];
  color: string;
}) {
  const [w, h, d] = size;

  switch (type) {
    case "door": {
      // Frame + recessed panel + a pair of hinges on the strike side.
      return (
        <group position={[0, h / 2, 0]}>
          <mesh castShadow>
            <boxGeometry args={[w, h, d]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
          <mesh position={[0, 0, d / 2 + 0.005]}>
            <boxGeometry args={[w * 0.7, h * 0.85, 0.01]} />
            <meshStandardMaterial color="#7a5836" roughness={0.6} />
          </mesh>
          <mesh position={[w * 0.3, 0, d / 2 + 0.02]}>
            <sphereGeometry args={[0.025, 12, 12]} />
            <meshStandardMaterial color="#d4b86a" metalness={0.6} roughness={0.3} />
          </mesh>
          {/* Hinges */}
          {[h * 0.32, -h * 0.32].map((y, i) => (
            <mesh
              key={i}
              position={[-w / 2 - 0.005, y, 0]}
              rotation={[0, 0, Math.PI / 2]}
            >
              <cylinderGeometry args={[0.018, 0.018, 0.08, 8]} />
              <meshStandardMaterial color="#3a3f46" metalness={0.7} roughness={0.4} />
            </mesh>
          ))}
        </group>
      );
    }
    case "toilet": {
      // Cylindrical bowl + seat ring + tank with a flush button.
      const bowlR = Math.min(w, d) * 0.42;
      return (
        <group position={[0, h / 2, 0]}>
          {/* Bowl base */}
          <mesh position={[0, -h * 0.18, d * 0.08]} castShadow>
            <cylinderGeometry args={[bowlR, bowlR * 0.9, h * 0.55, 24]} />
            <meshStandardMaterial color={color} roughness={0.4} />
          </mesh>
          {/* Seat ring */}
          <mesh position={[0, h * 0.12, d * 0.08]} castShadow>
            <torusGeometry args={[bowlR * 0.95, h * 0.05, 12, 24]} />
            <meshStandardMaterial color="#f1f3f4" roughness={0.45} />
          </mesh>
          {/* Tank */}
          <mesh position={[0, h * 0.2, -d * 0.3]} castShadow>
            <boxGeometry args={[w * 0.95, h * 0.6, d * 0.25]} />
            <meshStandardMaterial color={color} roughness={0.4} />
          </mesh>
          {/* Flush button */}
          <mesh position={[0, h * 0.45, -d * 0.18]}>
            <cylinderGeometry args={[w * 0.08, w * 0.08, 0.015, 16]} />
            <meshStandardMaterial color="#a8b0b8" metalness={0.6} roughness={0.3} />
          </mesh>
        </group>
      );
    }
    case "sink": {
      // Counter slab + recessed basin + faucet + two valve handles.
      return (
        <group position={[0, h / 2, 0]}>
          <mesh castShadow>
            <boxGeometry args={[w, h * 0.3, d]} />
            <meshStandardMaterial color={color} roughness={0.4} />
          </mesh>
          {/* Recessed basin (darker hollow) */}
          <mesh position={[0, h * 0.06, 0]}>
            <boxGeometry args={[w * 0.78, h * 0.08, d * 0.78]} />
            <meshStandardMaterial color="#171c20" roughness={0.6} />
          </mesh>
          {/* Faucet spout */}
          <mesh position={[0, h * 0.4, -d * 0.4]} castShadow>
            <cylinderGeometry args={[0.015, 0.015, h * 0.5, 12]} />
            <meshStandardMaterial color="#8a9099" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Spout neck (curved-ish horizontal) */}
          <mesh
            position={[0, h * 0.6, -d * 0.28]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.015, 0.015, d * 0.25, 12]} />
            <meshStandardMaterial color="#8a9099" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Valve handles flanking the spout */}
          {[-1, 1].map((s) => (
            <mesh
              key={s}
              position={[s * w * 0.18, h * 0.32, -d * 0.4]}
              rotation={[0, 0, 0]}
            >
              <cylinderGeometry args={[0.025, 0.025, 0.05, 12]} />
              <meshStandardMaterial color="#c5cad0" metalness={0.6} roughness={0.3} />
            </mesh>
          ))}
        </group>
      );
    }
    case "grab_bar": {
      // Horizontal cylinder along x with end mounts.
      return (
        <group position={[0, h / 2, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[d / 2, d / 2, w, 16]} />
            <meshStandardMaterial color={color} metalness={0.55} roughness={0.4} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh
              key={s}
              position={[(s * w) / 2, 0, 0]}
              rotation={[0, 0, Math.PI / 2]}
            >
              <cylinderGeometry args={[d * 0.9, d * 0.9, 0.02, 12]} />
              <meshStandardMaterial color="#c39a2c" metalness={0.7} roughness={0.4} />
            </mesh>
          ))}
        </group>
      );
    }
    case "signage": {
      // Thin emissive plate on a small post.
      return (
        <group position={[0, h / 2, 0]}>
          <mesh castShadow>
            <boxGeometry args={[w, h, d]} />
            <meshStandardMaterial
              color={color}
              roughness={0.6}
              emissive={color}
              emissiveIntensity={0.18}
            />
          </mesh>
          <mesh position={[0, -h * 0.1, -d * 0.5 - 0.01]}>
            <boxGeometry args={[w * 0.9, h * 0.7, 0.005]} />
            <meshStandardMaterial color="#0e1316" roughness={0.5} />
          </mesh>
        </group>
      );
    }
    case "seating": {
      // Bench-style block. If tall enough to be a chair, add a backrest and
      // four legs so it reads as seating instead of a generic block.
      const isChair = h > 0.55;
      return (
        <group>
          {/* Seat slab */}
          <mesh position={[0, isChair ? h * 0.55 : h / 2, 0]} castShadow>
            <boxGeometry
              args={[w, isChair ? h * 0.12 : h, d]}
            />
            <meshStandardMaterial color={color} roughness={0.85} />
          </mesh>
          {isChair ? (
            <>
              {/* Backrest */}
              <mesh
                position={[0, h * 0.8, -d * 0.45]}
                castShadow
              >
                <boxGeometry args={[w, h * 0.5, d * 0.08]} />
                <meshStandardMaterial color={color} roughness={0.85} />
              </mesh>
              {/* Four legs */}
              {[
                [w * 0.42, d * 0.42],
                [-w * 0.42, d * 0.42],
                [w * 0.42, -d * 0.42],
                [-w * 0.42, -d * 0.42],
              ].map(([lx, lz], i) => (
                <mesh
                  key={i}
                  position={[lx, h * 0.25, lz]}
                  castShadow
                >
                  <boxGeometry args={[w * 0.06, h * 0.5, d * 0.06]} />
                  <meshStandardMaterial color="#3c3530" roughness={0.85} />
                </mesh>
              ))}
            </>
          ) : null}
        </group>
      );
    }
    case "counter": {
      // Cabinet body with recessed toe-kick, dark stone top, and a vertical
      // seam to suggest cabinet doors.
      const kick = Math.min(0.08, h * 0.15);
      return (
        <group position={[0, h / 2, 0]}>
          {/* Cabinet body sitting above the toe-kick */}
          <mesh position={[0, kick / 2, 0]} castShadow>
            <boxGeometry args={[w, h - kick, d]} />
            <meshStandardMaterial color={color} roughness={0.6} />
          </mesh>
          {/* Recessed toe-kick (darker, slightly inset) */}
          <mesh position={[0, -h / 2 + kick / 2, 0]}>
            <boxGeometry args={[w * 0.96, kick, d * 0.94]} />
            <meshStandardMaterial color="#3c4148" roughness={0.7} />
          </mesh>
          {/* Stone-look countertop */}
          <mesh position={[0, h / 2 + 0.01, 0]} receiveShadow>
            <boxGeometry args={[w * 1.04, 0.025, d * 1.06]} />
            <meshStandardMaterial color="#1f262c" roughness={0.35} />
          </mesh>
          {/* Vertical seam between cabinet doors */}
          <mesh position={[0, kick / 2, d / 2 + 0.005]}>
            <boxGeometry args={[0.01, h - kick, 0.005]} />
            <meshStandardMaterial color="#1a1f24" roughness={0.5} />
          </mesh>
        </group>
      );
    }
    case "obstacle": {
      // Hazard-striped block — keep the emissive marker.
      return (
        <mesh position={[0, h / 2, 0]} castShadow>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial
            color={color}
            roughness={0.7}
            emissive={color}
            emissiveIntensity={0.2}
          />
        </mesh>
      );
    }
    case "column": {
      // Cylindrical shaft with a square base and capital plate.
      const r = Math.min(w, d) / 2;
      return (
        <group position={[0, h / 2, 0]}>
          {/* Base plate */}
          <mesh position={[0, -h / 2 + 0.02, 0]} receiveShadow>
            <boxGeometry args={[w * 1.15, 0.04, d * 1.15]} />
            <meshStandardMaterial color="#2a2f35" roughness={0.7} />
          </mesh>
          {/* Shaft */}
          <mesh castShadow>
            <cylinderGeometry args={[r, r, h - 0.08, 24]} />
            <meshStandardMaterial color={color} roughness={0.65} />
          </mesh>
          {/* Capital plate */}
          <mesh position={[0, h / 2 - 0.02, 0]} castShadow>
            <boxGeometry args={[w * 1.15, 0.04, d * 1.15]} />
            <meshStandardMaterial color="#2a2f35" roughness={0.7} />
          </mesh>
        </group>
      );
    }
    case "ramp": {
      return <RampMesh w={w} h={h} d={d} color={color} />;
    }
    case "step": {
      return <StairsMesh w={w} h={h} d={d} color={color} />;
    }
    case "other":
    default:
      return (
        <mesh position={[0, h / 2, 0]} castShadow>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
      );
  }
}

function RampMesh({
  w,
  h,
  d,
  color,
}: {
  w: number;
  h: number;
  d: number;
  color: string;
}) {
  const geometry = useMemo(() => {
    // Triangular profile in the local XY plane. Floor edge at y=0 from
    // x=-d/2 to x=d/2, then up the front face to (d/2, h), close.
    const shape = new THREE.Shape();
    shape.moveTo(-d / 2, 0);
    shape.lineTo(d / 2, 0);
    shape.lineTo(d / 2, h);
    shape.closePath();
    const geom = new THREE.ExtrudeGeometry(shape, {
      depth: w,
      bevelEnabled: false,
    });
    // Extrude pushes along +Z. Rotate so the prism's width axis becomes world
    // X; the slope then rises from world -Z (back) to +Z (front), matching
    // surfaceHeightAt() in AgentSimulation.
    geom.rotateY(-Math.PI / 2);
    geom.translate(w / 2, 0, 0);
    geom.computeVertexNormals();
    return geom;
  }, [w, h, d]);
  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color={color} roughness={0.8} />
    </mesh>
  );
}

function StairsMesh({
  w,
  h,
  d,
  color,
}: {
  w: number;
  h: number;
  d: number;
  color: string;
}) {
  const treads = treadCount(h);
  const geometry = useMemo(() => {
    const treadH = h / treads;
    const treadDepth = d / treads;
    // Trace a staircase silhouette: along the floor, up the high front face,
    // then walk back down the steps to the start. Counter-clockwise so
    // ExtrudeGeometry caps face outward.
    const shape = new THREE.Shape();
    shape.moveTo(-d / 2, 0);
    shape.lineTo(d / 2, 0);
    shape.lineTo(d / 2, h);
    for (let i = 1; i <= treads; i++) {
      const x = d / 2 - i * treadDepth;
      const yTop = h - (i - 1) * treadH;
      const yBot = h - i * treadH;
      shape.lineTo(x, yTop);
      shape.lineTo(x, yBot);
    }
    shape.closePath();
    const geom = new THREE.ExtrudeGeometry(shape, {
      depth: w,
      bevelEnabled: false,
    });
    geom.rotateY(-Math.PI / 2);
    geom.translate(w / 2, 0, 0);
    geom.computeVertexNormals();
    return geom;
  }, [w, h, d, treads]);

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color={color} roughness={0.8} />
    </mesh>
  );
}
