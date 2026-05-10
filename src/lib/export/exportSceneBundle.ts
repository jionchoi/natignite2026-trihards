"use client";

import JSZip from "jszip";
import * as THREE from "three";
import { useSession } from "@/lib/store";
import {
  ALL_PERSONAS,
  PERSONA_CATEGORIES,
  PERSONA_COLOR,
  PERSONA_LABEL,
  PERSONA_SHORT,
} from "@/lib/personas";
import { fixed, sanitizeName } from "./objExporter";

type SceneRef = Readonly<{ current: THREE.Scene | null }>;

interface SceneManifest {
  accessifyVersion: "1.0";
  bundleType: "scene";
  exportedAt: string;
  sessionId: string;
  spaceType: string;
  notes?: string;
  geminiModel: string;
  roomLayout: {
    fixtureCount: number;
    wallCount: number;
    floorPolygonPoints: number;
  };
  personaIds: string[];
  files: {
    roomLayout: string;
    obj: string;
    mtl: string;
    issues: string;
    personas: string;
    analysis: string;
  };
}

export async function exportSceneBundle(sceneRef: SceneRef): Promise<void> {
  const store = useSession.getState();
  const { id, analysis, context } = store;

  if (!id || !analysis?.roomLayout) {
    throw new Error("No procedural room layout is available for this analysis.");
  }

  store.resetExport();
  store.setExportStage("preparing");
  store.setExportProgress(0.08);

  const zip = new JSZip();

  if (sceneRef.current) {
    const { obj, mtl } = collectSceneOBJ(sceneRef.current);
    zip.file("scene.obj", obj);
    zip.file("scene.mtl", mtl);
  } else {
    zip.file("scene.obj", "# Scene reference unavailable at export time\n");
    zip.file("scene.mtl", "");
  }
  store.setExportProgress(0.36);

  zip.file("room-layout.json", JSON.stringify(analysis.roomLayout, null, 2));
  zip.file("issues.json", JSON.stringify(analysis.issues, null, 2));
  zip.file("personas.json", JSON.stringify(getPersonaDefinitions(), null, 2));
  zip.file("analysis.json", JSON.stringify(analysis, null, 2));
  store.setExportProgress(0.66);

  const manifest: SceneManifest = {
    accessifyVersion: "1.0",
    bundleType: "scene",
    exportedAt: new Date().toISOString(),
    sessionId: id,
    spaceType: context.spaceType,
    notes: context.notes || undefined,
    geminiModel: "gemini-2.5-flash",
    roomLayout: {
      fixtureCount: analysis.roomLayout.fixtures.length,
      wallCount: analysis.roomLayout.walls.length,
      floorPolygonPoints: analysis.roomLayout.floor.polygon.length,
    },
    personaIds: ALL_PERSONAS,
    files: {
      roomLayout: "room-layout.json",
      obj: "scene.obj",
      mtl: "scene.mtl",
      issues: "issues.json",
      personas: "personas.json",
      analysis: "analysis.json",
    },
  };
  zip.file("manifest.json", JSON.stringify(manifest, null, 2));
  zip.file("README.txt", sceneBundleReadme(manifest));
  store.setExportProgress(0.82);

  store.setExportStage("zipping");
  const blob = await zip.generateAsync(
    { type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } },
    (meta) => {
      store.setExportProgress(0.82 + (meta.percent / 100) * 0.17);
    },
  );

  store.setExportProgress(1);
  store.setExportStage("done");
  triggerDownload(blob, `accessify-scene-${id.slice(0, 8)}.zip`);
  window.setTimeout(() => useSession.getState().resetExport(), 2500);
}

function collectSceneOBJ(scene: THREE.Scene): { obj: string; mtl: string } {
  scene.updateMatrixWorld(true);

  const objLines: string[] = [
    "# Accessify Scene Export",
    `# Generated: ${new Date().toISOString()}`,
    "mtllib scene.mtl",
    "",
  ];
  const mtlLines: string[] = ["# Accessify Scene Materials"];
  const materialsSeen = new Set<string>();
  let vertexOffset = 0;
  let uvOffset = 0;
  let normalOffset = 0;

  scene.traverse((child) => {
    if (!(child instanceof THREE.Mesh) || !child.visible) return;

    const geometry = child.geometry.clone();
    geometry.applyMatrix4(child.matrixWorld);
    geometry.computeVertexNormals();

    const positions = geometry.attributes.position as THREE.BufferAttribute | undefined;
    if (!positions) {
      geometry.dispose();
      return;
    }

    const normals = geometry.attributes.normal as THREE.BufferAttribute | undefined;
    const uvs = geometry.attributes.uv as THREE.BufferAttribute | undefined;
    const index = geometry.index;
    const material = Array.isArray(child.material) ? child.material[0] : child.material;
    const materialName = sanitizeName(material?.name || `mat_${child.uuid.slice(0, 8)}`, "scene_mat");

    if (!materialsSeen.has(materialName)) {
      materialsSeen.add(materialName);
      const color = materialColor(material);
      mtlLines.push(
        "",
        `newmtl ${materialName}`,
        `Ka ${fixed(color.r)} ${fixed(color.g)} ${fixed(color.b)}`,
        `Kd ${fixed(color.r)} ${fixed(color.g)} ${fixed(color.b)}`,
        "Ks 0.000000 0.000000 0.000000",
        "d 1.0",
        "illum 1",
      );
    }

    objLines.push(`o ${sanitizeName(child.name || child.uuid.slice(0, 8), "scene_mesh")}`);
    for (let i = 0; i < positions.count; i++) {
      objLines.push(
        `v ${fixed(positions.getX(i))} ${fixed(positions.getY(i))} ${fixed(positions.getZ(i))}`,
      );
    }

    if (uvs) {
      for (let i = 0; i < uvs.count; i++) {
        objLines.push(`vt ${fixed(uvs.getX(i))} ${fixed(uvs.getY(i))}`);
      }
    }

    if (normals) {
      for (let i = 0; i < normals.count; i++) {
        objLines.push(
          `vn ${fixed(normals.getX(i))} ${fixed(normals.getY(i))} ${fixed(normals.getZ(i))}`,
        );
      }
    }

    objLines.push(`usemtl ${materialName}`, "s off");

    const faceIndices = index
      ? Array.from({ length: index.count }, (_, i) => index.getX(i))
      : Array.from({ length: positions.count }, (_, i) => i);

    for (let i = 0; i + 2 < faceIndices.length; i += 3) {
      const a = faceIndices[i];
      const b = faceIndices[i + 1];
      const c = faceIndices[i + 2];
      objLines.push(
        `f ${sceneVertex(a, vertexOffset, uvOffset, normalOffset, !!uvs, !!normals)} ${sceneVertex(b, vertexOffset, uvOffset, normalOffset, !!uvs, !!normals)} ${sceneVertex(c, vertexOffset, uvOffset, normalOffset, !!uvs, !!normals)}`,
      );
    }

    objLines.push("");
    vertexOffset += positions.count;
    uvOffset += uvs?.count ?? 0;
    normalOffset += normals?.count ?? 0;
    geometry.dispose();
  });

  return { obj: objLines.join("\n"), mtl: mtlLines.join("\n") };
}

function sceneVertex(
  localIndex: number,
  vertexOffset: number,
  uvOffset: number,
  normalOffset: number,
  hasUV: boolean,
  hasNormal: boolean,
): string {
  const v = localIndex + 1 + vertexOffset;
  const vt = localIndex + 1 + uvOffset;
  const vn = localIndex + 1 + normalOffset;
  if (hasUV && hasNormal) return `${v}/${vt}/${vn}`;
  if (hasUV) return `${v}/${vt}`;
  if (hasNormal) return `${v}//${vn}`;
  return `${v}`;
}

function materialColor(material: THREE.Material | undefined): THREE.Color {
  const maybeColor = material as THREE.Material & { color?: THREE.Color };
  return maybeColor?.color ?? new THREE.Color(0.8, 0.82, 0.85);
}

function getPersonaDefinitions() {
  return ALL_PERSONAS.map((id) => ({
    id,
    label: PERSONA_LABEL[id],
    shortLabel: PERSONA_SHORT[id],
    color: PERSONA_COLOR[id],
    issueCategories: PERSONA_CATEGORIES[id],
  }));
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function sceneBundleReadme(manifest: SceneManifest): string {
  return `ACCESSIFY SCENE BUNDLE
======================
Bundle type : Procedural Simulation Scene
Exported at : ${manifest.exportedAt}
Session ID  : ${manifest.sessionId}
Space type  : ${manifest.spaceType}

FILES
-----
scene.obj        Low-poly procedural room geometry
scene.mtl        Material definitions for scene.obj
room-layout.json Inferred room layout with floor, walls, and fixtures
issues.json      Accessibility issues with fixture links
personas.json    Persona definitions used by the simulation
analysis.json    Full accessibility analysis JSON
manifest.json    Bundle metadata

SIMULATION
----------
Import this ZIP in Accessify to open the procedural scene without re-running
the AI analysis. Geometry is approximate and should be verified on site.
`;
}
