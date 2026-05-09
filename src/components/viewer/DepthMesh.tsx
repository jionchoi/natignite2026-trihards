"use client";

import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { useMeshGeometry } from "./useMeshGeometry";

interface DepthMeshProps {
  imageUrl: string;
  depthUrl: string;
  displacement?: number;
  segments?: number;
  wireframe?: boolean;
  meshRef?: MutableRefObject<THREE.Mesh | null>;
}

export function DepthMesh({
  imageUrl,
  depthUrl,
  displacement = 1.2,
  segments = 384,
  wireframe = false,
  meshRef,
}: DepthMeshProps) {
  const { colorMap, width, height, sampleDepth } = useMeshGeometry(
    imageUrl,
    depthUrl,
  );
  const frontMeshRef = useRef<THREE.Mesh | null>(null);

  const boxDepth = Math.max(displacement, 0.4);
  const cubeColor = "#1a1d24";

  const frontGeometry = useMemo(() => {
    if (!sampleDepth) return null;

    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    const halfW = width / 2;
    const halfH = height / 2;

    for (let y = 0; y <= segments; y++) {
      const v = y / segments;
      for (let x = 0; x <= segments; x++) {
        const u = x / segments;
        positions.push(
          -halfW + u * width,
          -halfH + v * height,
          -displacement + sampleDepth(u, v) * displacement,
        );
        uvs.push(u, v);
      }
    }

    for (let y = 0; y < segments; y++) {
      for (let x = 0; x < segments; x++) {
        const a = y * (segments + 1) + x;
        const b = a + 1;
        const c = a + segments + 1;
        const d = c + 1;
        indices.push(a, b, d, a, d, c);
      }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geom.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    return geom;
  }, [sampleDepth, width, height, segments, displacement]);

  // Skirt walls (top/bottom/left/right) hugging the carved photo edge, plus a
  // back wall. No fixed rectangular side walls — the cube outline tracks the
  // room's actual extent.
  const shellGeometry = useMemo(() => {
    if (!sampleDepth) return null;
    const halfW = width / 2;
    const halfH = height / 2;
    const dispZ = (u: number, v: number) =>
      -displacement + sampleDepth(u, v) * displacement;

    const positions: number[] = [];
    const indices: number[] = [];

    type StripPt = (t: number) => [number, number, number];
    const pushStrip = (
      front: StripPt,
      back: StripPt,
      segs: number,
      flip = false,
    ) => {
      const start = positions.length / 3;
      for (let i = 0; i <= segs; i++) {
        const t = i / segs;
        const [fx, fy, fz] = front(t);
        const [bx, by, bz] = back(t);
        positions.push(fx, fy, fz, bx, by, bz);
      }
      for (let i = 0; i < segs; i++) {
        const a = start + i * 2;
        const b = a + 1;
        const c = a + 2;
        const d = a + 3;
        if (flip) indices.push(a, d, b, a, c, d);
        else indices.push(a, b, d, a, d, c);
      }
    };

    // Match photo plane's edge resolution so the skirt's front edge coincides
    // with the displaced plane vertex-for-vertex (no visible gap).
    const segs = segments;

    // Top edge (y = +halfH, sampled at v=1)
    pushStrip(
      (t) => [-halfW + t * width, halfH, dispZ(t, 1)],
      (t) => [-halfW + t * width, halfH, -boxDepth],
      segs,
    );
    // Bottom edge (y = -halfH, sampled at v=0)
    pushStrip(
      (t) => [-halfW + t * width, -halfH, dispZ(t, 0)],
      (t) => [-halfW + t * width, -halfH, -boxDepth],
      segs,
      true,
    );
    // Left edge (x = -halfW, sampled at u=0)
    pushStrip(
      (t) => [-halfW, -halfH + t * height, dispZ(0, t)],
      (t) => [-halfW, -halfH + t * height, -boxDepth],
      segs,
      true,
    );
    // Right edge (x = +halfW, sampled at u=1)
    pushStrip(
      (t) => [halfW, -halfH + t * height, dispZ(1, t)],
      (t) => [halfW, -halfH + t * height, -boxDepth],
      segs,
    );

    // Back wall (single quad at z = -boxDepth)
    {
      const start = positions.length / 3;
      positions.push(
        -halfW, -halfH, -boxDepth,
         halfW, -halfH, -boxDepth,
         halfW,  halfH, -boxDepth,
        -halfW,  halfH, -boxDepth,
      );
      indices.push(start, start + 2, start + 1, start, start + 3, start + 2);
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geom.setIndex(indices);
    geom.computeVertexNormals();
    return geom;
  }, [sampleDepth, width, height, displacement, boxDepth, segments]);

  useEffect(() => {
    return () => {
      shellGeometry?.dispose();
    };
  }, [shellGeometry]);

  useEffect(() => {
    return () => {
      frontGeometry?.dispose();
    };
  }, [frontGeometry]);

  useEffect(() => {
    const mesh = frontMeshRef.current;
    if (mesh) {
      mesh.userData.accessifySegments = { x: segments, y: segments };
    }
    if (meshRef) {
      meshRef.current = mesh;
      return () => {
        if (meshRef.current === mesh) meshRef.current = null;
      };
    }
    return undefined;
  }, [frontGeometry, meshRef, segments]);

  return (
    <group>
      {/* Front face — depth-displaced inward, photo carved into the cube. */}
      {frontGeometry ? (
        <mesh ref={frontMeshRef} geometry={frontGeometry} position={[0, 0, 0]}>
          <meshStandardMaterial
            map={colorMap}
            wireframe={wireframe}
            side={THREE.DoubleSide}
            roughness={0.7}
            metalness={0.05}
          />
        </mesh>
      ) : null}

      {/* Cube shell: skirts hug the carved edge, back wall closes the box. */}
      {shellGeometry ? (
        <mesh geometry={shellGeometry}>
          <meshStandardMaterial
            color={cubeColor}
            side={THREE.DoubleSide}
            roughness={0.9}
            wireframe={wireframe}
          />
        </mesh>
      ) : null}
    </group>
  );
}
