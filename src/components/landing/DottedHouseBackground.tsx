"use client";

import { useRef, type ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Landing-page backdrop: the original floating room geometry, but every mesh
 * is replaced with a high-density `THREE.Points` cloud so the model reads as
 * spinning ASCII / halftone art instead of a solid object. Sits behind the
 * landing wordmark.
 */

const POINT_COLOR = "#ffffff";
const BASE_OPACITY = 0.55;

interface DotPointsProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  size?: number;
  opacity?: number;
  children: ReactNode;
}

function DotPoints({
  position,
  rotation,
  size = 0.014,
  opacity = BASE_OPACITY,
  children,
}: DotPointsProps) {
  return (
    <points position={position} rotation={rotation}>
      {children}
      <pointsMaterial
        size={size}
        color={POINT_COLOR}
        transparent
        opacity={opacity}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

const FACE_SEG = 22;

function DottedRoom() {
  return (
    <group scale={0.85}>
      {/* Floor */}
      <DotPoints position={[0, -0.8, 0]} opacity={0.5}>
        <boxGeometry args={[3, 0.1, 3, FACE_SEG, 1, FACE_SEG]} />
      </DotPoints>

      {/* Back wall */}
      <DotPoints position={[0, 0.2, -1.45]} opacity={0.55}>
        <boxGeometry args={[3, 2, 0.1, FACE_SEG, FACE_SEG, 1]} />
      </DotPoints>

      {/* Left wall */}
      <DotPoints position={[-1.45, 0.2, 0]} opacity={0.55}>
        <boxGeometry args={[0.1, 2, 3, 1, FACE_SEG, FACE_SEG]} />
      </DotPoints>

      {/* Door frame on back wall */}
      <group position={[0.5, 0.1, -1.38]}>
        <DotPoints position={[0, 0, -0.02]} opacity={0.75}>
          <boxGeometry args={[1.0, 1.7, 0.06, 14, 18, 1]} />
        </DotPoints>
      </group>

      {/* Window opening on left wall */}
      <group position={[-1.38, 0.3, -0.5]} rotation={[0, Math.PI / 2, 0]}>
        <DotPoints opacity={0.4}>
          <boxGeometry args={[0.8, 0.8, 0.08, 12, 12, 1]} />
        </DotPoints>
        <DotPoints position={[0, 0, -0.03]} opacity={0.7}>
          <boxGeometry args={[0.9, 0.9, 0.04, 12, 12, 1]} />
        </DotPoints>
      </group>

      {/* Ramp indicator on floor */}
      <DotPoints
        position={[-0.5, -0.74, 0.8]}
        rotation={[-Math.PI / 2, 0, 0]}
        opacity={0.85}
        size={0.012}
      >
        <planeGeometry args={[0.8, 0.5, 14, 9]} />
      </DotPoints>

      {/* Grab bar on left wall */}
      <DotPoints
        position={[-1.38, -0.2, 0.5]}
        rotation={[0, 0, Math.PI / 2]}
        size={0.011}
        opacity={0.85}
      >
        <capsuleGeometry args={[0.03, 0.6, 6, 14]} />
      </DotPoints>

      {/* Counter w/ lowered accessible section */}
      <group position={[0.8, -0.3, 0.5]}>
        <DotPoints position={[0, 0.2, 0]} opacity={0.7}>
          <boxGeometry args={[0.8, 0.08, 0.5, 14, 1, 9]} />
        </DotPoints>
        <DotPoints position={[-0.6, 0, 0]} opacity={0.95}>
          <boxGeometry args={[0.4, 0.08, 0.5, 9, 1, 9]} />
        </DotPoints>
        <DotPoints position={[0, -0.15, 0]} opacity={0.4}>
          <boxGeometry args={[0.8, 0.5, 0.45, 12, 8, 7]} />
        </DotPoints>
      </group>

      {/* Signage plate on left wall */}
      <group position={[-1.38, 0.8, 0.3]} rotation={[0, Math.PI / 2, 0]}>
        <DotPoints opacity={0.85}>
          <boxGeometry args={[0.3, 0.2, 0.02, 9, 6, 1]} />
        </DotPoints>
      </group>
    </group>
  );
}

interface SpinningRoomProps {
  speed?: number;
}

function SpinningRoom({ speed = 0.12 }: SpinningRoomProps) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) {
      ref.current.rotation.y += dt * speed;
    }
  });
  return (
    <group ref={ref} position={[0, 0, 0]}>
      <DottedRoom />
    </group>
  );
}

export function DottedHouseBackground() {
  return (
    <div
      className="dotted-house-mask absolute inset-0 z-0"
      aria-hidden
    >
      <Canvas
        camera={{ position: [4.4, 2.2, 4.4], fov: 36 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ background: "transparent" }}
        dpr={[1, 2]}
        frameloop="always"
      >
        <SpinningRoom />
      </Canvas>
    </div>
  );
}
