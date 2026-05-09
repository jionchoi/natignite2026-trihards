"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";
import { Room } from "@frontend/components/floating-room";

interface PhotographerCfg {
  id: number;
  pos: [number, number, number];
  rotY: number;
}

const PHOTOGRAPHERS: PhotographerCfg[] = [
  { id: 0, pos: [-0.5, -0.58, 0.5], rotY: Math.atan2(0.9, -1.66) },
  { id: 1, pos: [0.5, -0.58, 0.0], rotY: Math.atan2(-1.66, -0.4) },
];

function Photographer({ cfg, flash }: { cfg: PhotographerCfg; flash: boolean }) {
  const dark = "#0e0e0e";
  const darkAlt = "#141414";

  return (
    <group position={cfg.pos} rotation={[0, cfg.rotY, 0]} scale={0.5}>
      <pointLight
        position={[0, 1.63, 0.6]}
        intensity={flash ? 80 : 0}
        color="#fff8e0"
        distance={12}
        decay={1.2}
      />

      <mesh position={[0, 1.05, 0]}>
        <capsuleGeometry args={[0.22, 0.72, 10, 24]} />
        <meshStandardMaterial color={dark} roughness={0.72} metalness={0.08} />
      </mesh>

      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.072, 0.09, 0.18, 20]} />
        <meshStandardMaterial color={darkAlt} roughness={0.8} />
      </mesh>

      <mesh position={[0, 1.695, -0.02]}>
        <sphereGeometry args={[0.205, 36, 36]} />
        <meshStandardMaterial color={darkAlt} roughness={0.78} />
      </mesh>
      <mesh position={[0, 1.815, -0.06]}>
        <sphereGeometry args={[0.21, 32, 20]} />
        <meshStandardMaterial color="#080808" roughness={1} />
      </mesh>

      <mesh position={[-0.28, 1.44, 0.28]} rotation={[1.1, 0, -0.08]}>
        <capsuleGeometry args={[0.055, 0.6, 8, 14]} />
        <meshStandardMaterial color={dark} roughness={0.72} metalness={0.08} />
      </mesh>
      <mesh position={[0.28, 1.44, 0.28]} rotation={[1.1, 0, 0.08]}>
        <capsuleGeometry args={[0.055, 0.6, 8, 14]} />
        <meshStandardMaterial color={dark} roughness={0.72} metalness={0.08} />
      </mesh>

      <mesh position={[0, 1.64, 0.46]}>
        <boxGeometry args={[0.31, 0.21, 0.1]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.2} metalness={0.7} />
      </mesh>
      <mesh position={[0.13, 1.64, 0.46]}>
        <boxGeometry args={[0.07, 0.23, 0.11]} />
        <meshStandardMaterial color="#0d0d0d" roughness={0.25} metalness={0.6} />
      </mesh>
      <mesh position={[0, 1.64, 0.52]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.057, 0.073, 0.09, 20]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.16} metalness={0.85} />
      </mesh>
      <mesh position={[0, 1.64, 0.566]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.039, 0.039, 0.006, 20]} />
        <meshStandardMaterial
          color="#1a3a88"
          roughness={0}
          metalness={1}
          transparent
          opacity={0.9}
        />
      </mesh>
      <mesh position={[0.09, 1.76, 0.46]}>
        <boxGeometry args={[0.08, 0.044, 0.022]} />
        <meshStandardMaterial
          color={flash ? "#ffffff" : "#999999"}
          emissive={flash ? "#ffffff" : "#111111"}
          emissiveIntensity={flash ? 6 : 0.05}
        />
      </mesh>
    </group>
  );
}

interface Waypoint {
  pos: [number, number, number];
  look: [number, number, number];
  fov: number;
  text: string;
  subtext: string;
  flashId?: number;
}

const WAYPOINTS: Waypoint[] = [
  {
    pos: [4, 2, 4],
    look: [0, 0, 0],
    fov: 35,
    text: "Mapping the room",
    subtext: "Estimating depth from your photo",
    flashId: 0,
  },
  {
    pos: [-1.6, 0.6, 1.8],
    look: [0.3, -0.1, -0.6],
    fov: 38,
    text: "Reading depth cues",
    subtext: "Cross-referencing perspective lines",
    flashId: 0,
  },
  {
    pos: [1.6, 0.4, 1.8],
    look: [-0.4, -0.2, -0.4],
    fov: 36,
    text: "Building the 3D view",
    subtext: "Reconstructing geometry from a single frame",
    flashId: 1,
  },
  {
    pos: [0.6, 0.0, 1.0],
    look: [0.5, 0.0, -1.4],
    fov: 32,
    text: "Inspecting the entrance",
    subtext: "Door width, thresholds, signage",
    flashId: 1,
  },
  {
    pos: [-1.4, -0.2, 0.6],
    look: [-1.4, -0.3, 0.5],
    fov: 38,
    text: "Checking pathways",
    subtext: "Clearances, obstacles, surface changes",
    flashId: 0,
  },
  {
    pos: [0, 2.6, 0.2],
    look: [0, -0.5, 0],
    fov: 50,
    text: "Surveying the floor plan",
    subtext: "Looking for accessible routes",
    flashId: 1,
  },
  {
    pos: [2.4, -0.1, 1.4],
    look: [0.8, -0.3, 0.5],
    fov: 32,
    text: "Reviewing fixtures",
    subtext: "Counters, grab bars, controls",
    flashId: 0,
  },
  {
    pos: [-2.2, 1.2, 2.2],
    look: [0, 0.2, -0.4],
    fov: 38,
    text: "Finding accessibility help",
    subtext: "Matching against ADA / built-environment guidance",
    flashId: 1,
  },
  {
    pos: [4, 2, 4],
    look: [0, 0, 0],
    fov: 35,
    text: "Drafting recommendations",
    subtext: "Prioritizing fixes by impact",
    flashId: 0,
  },
];

const WAYPOINT_DURATION_MS = 3200;
const FLASH_MS = 380;
const LERP = 0.045;

interface SceneCameraProps {
  waypointIndex: number;
}

function SceneCamera({ waypointIndex }: SceneCameraProps) {
  const { camera } = useThree();
  const lookTarget = useRef(new THREE.Vector3(...WAYPOINTS[0].look));
  const targetPos = useRef(new THREE.Vector3(...WAYPOINTS[0].pos));
  const targetLook = useRef(new THREE.Vector3(...WAYPOINTS[0].look));
  const targetFov = useRef(WAYPOINTS[0].fov);

  useEffect(() => {
    const wp = WAYPOINTS[waypointIndex];
    targetPos.current.set(wp.pos[0], wp.pos[1], wp.pos[2]);
    targetLook.current.set(wp.look[0], wp.look[1], wp.look[2]);
    targetFov.current = wp.fov;
  }, [waypointIndex]);

  useFrame(() => {
    camera.position.lerp(targetPos.current, LERP);
    lookTarget.current.lerp(targetLook.current, LERP);
    camera.lookAt(lookTarget.current);
    if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
      const persp = camera as THREE.PerspectiveCamera;
      persp.fov = THREE.MathUtils.lerp(persp.fov, targetFov.current, 0.06);
      persp.updateProjectionMatrix();
    }
  });

  return null;
}

interface SceneLoadingScreenProps {
  message?: string;
  className?: string;
}

export function SceneLoadingScreen({
  message,
  className,
}: SceneLoadingScreenProps) {
  const [idx, setIdx] = useState(0);
  const [activeFlash, setActiveFlash] = useState<number | null>(
    WAYPOINTS[0].flashId ?? null,
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setIdx((prev) => (prev + 1) % WAYPOINTS.length);
    }, WAYPOINT_DURATION_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const wp = WAYPOINTS[idx];
    setActiveFlash(wp.flashId ?? null);
    const t = setTimeout(() => setActiveFlash(null), FLASH_MS);
    return () => clearTimeout(t);
  }, [idx]);

  const current = WAYPOINTS[idx];

  return (
    <div
      className={`fixed inset-0 z-50 ${className ?? ""}`}
      aria-live="polite"
      aria-label="Analyzing your space"
    >
      <div className="absolute inset-0 bg-background" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 22%, rgba(0,0,0,0.82) 100%)",
        }}
      />

      <div className="absolute inset-0">
        <Canvas
          camera={{ position: [4, 2, 4], fov: 35 }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: "transparent" }}
        >
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
          <directionalLight
            position={[-3, 3, -3]}
            intensity={0.28}
            color="#1D9E75"
          />
          <pointLight position={[0, 2, 0]} intensity={0.38} />
          <Room />
          {PHOTOGRAPHERS.map((cfg) => (
            <Photographer
              key={cfg.id}
              cfg={cfg}
              flash={activeFlash === cfg.id}
            />
          ))}
          <SceneCamera waypointIndex={idx} />
          <Environment preset="city" />
        </Canvas>
      </div>

      <div className="absolute inset-x-0 bottom-16 sm:bottom-24 flex flex-col items-center gap-3 px-6 text-center pointer-events-none">
        <div
          key={current.text}
          className="flex flex-col items-center gap-2 animate-fade-in"
        >
          <h2 className="font-serif text-2xl sm:text-3xl text-foreground">
            {current.text}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-md">
            {current.subtext}
          </p>
        </div>
        {message ? (
          <p className="mt-1 text-xs text-muted-foreground/70 max-w-md">
            {message}
          </p>
        ) : null}
        <div className="mt-3 flex items-center gap-1.5">
          {WAYPOINTS.map((_, i) => (
            <span
              key={i}
              className={`h-1 rounded-full transition-all duration-500 ${
                i === idx
                  ? "w-6 bg-primary"
                  : i < idx
                    ? "w-2.5 bg-primary/60"
                    : "w-2.5 bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="absolute bottom-5 left-5 pointer-events-none">
        <span className="font-mono uppercase tracking-[0.25em] text-[9px] text-foreground/30">
          Accessify
        </span>
      </div>
    </div>
  );
}

export default SceneLoadingScreen;
