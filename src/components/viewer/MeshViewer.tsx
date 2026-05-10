"use client";

import { Suspense, useRef, useState, type MutableRefObject } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type * as THREE from "three";
import { DepthMesh } from "./DepthMesh";
import { LightingRig } from "./LightingRig";
import { MeshPins } from "./MeshPins";
import { ViewerControls } from "./ViewerControls";
import { Spinner } from "@/components/ui/Spinner";
import { type Issue } from "@/lib/schemas";

interface MeshViewerProps {
  imageUrl: string;
  depthUrl: string | null;
  issues?: Issue[];
  selectedIssueId?: string | null;
  onSelectIssue?: (id: string | null) => void;
  meshRef?: MutableRefObject<THREE.Mesh | null>;
  className?: string;
}

export function MeshViewer({
  imageUrl,
  depthUrl,
  issues = [],
  selectedIssueId = null,
  onSelectIssue,
  meshRef,
  className,
}: MeshViewerProps) {
  const controlsRef = useRef<any>(null);
  const [wireframe, setWireframe] = useState(false);
  const [displacement, setDisplacement] = useState(1.2);
  const [autoRotate, setAutoRotate] = useState(true);

  const onReset = () => controlsRef.current?.reset?.();

  const handleSelect = (id: string | null) => {
    onSelectIssue?.(id);
  };

  const pinnedIssues = issues.filter((i) => i.locationHint);

  return (
    <div className={className}>
      <div className="relative h-full w-full overflow-hidden rounded-xl border border-border bg-black">
        {depthUrl ? (
          <Canvas
            camera={{ position: [0.4, 0.25, 1.7], fov: 38 }}
            dpr={[1, 2]}
            gl={{ antialias: true, preserveDrawingBuffer: true }}
          >
            <color attach="background" args={["#06070a"]} />
            <LightingRig />
            <Suspense fallback={null}>
              <DepthMesh
                imageUrl={imageUrl}
                depthUrl={depthUrl}
                wireframe={wireframe}
                displacement={displacement}
                meshRef={meshRef}
              />
              {pinnedIssues.length > 0 ? (
                <MeshPins
                  imageUrl={imageUrl}
                  depthUrl={depthUrl}
                  displacement={displacement}
                  issues={pinnedIssues}
                  selectedId={selectedIssueId}
                  onSelect={handleSelect}
                />
              ) : null}
            </Suspense>
            <OrbitControls
              ref={controlsRef}
              enableDamping
              dampingFactor={0.1}
              minDistance={0.5}
              maxDistance={4}
              autoRotate={autoRotate}
              autoRotateSpeed={3.0}
            />
          </Canvas>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-fg-muted">
            <Spinner size="lg" />
            <p className="text-sm">Building 3D view…</p>
          </div>
        )}
        {depthUrl && pinnedIssues.length > 0 ? (
          <div className="pointer-events-none absolute left-3 top-3 rounded-md border border-border bg-bg-elevated/80 px-2 py-1 text-[11px] text-fg-muted backdrop-blur">
            {pinnedIssues.length} pin{pinnedIssues.length === 1 ? "" : "s"} ·
            click to inspect
          </div>
        ) : null}
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center px-3">
          <div className="pointer-events-auto">
            {depthUrl ? (
              <ViewerControls
                wireframe={wireframe}
                onWireframeToggle={() => setWireframe((v) => !v)}
                displacement={displacement}
                onDisplacementChange={setDisplacement}
                onReset={onReset}
                autoRotate={autoRotate}
                onAutoRotateToggle={() => setAutoRotate((v) => !v)}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
