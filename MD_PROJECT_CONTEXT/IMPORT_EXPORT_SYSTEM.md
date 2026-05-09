# Import / Export System — Implementation Specification
**App:** Accessify (`natignite`) · Next.js 14 · React 18 · Three.js · Zustand · TypeScript  
**Spec date:** May 2026  
**For:** Codex agent — drop into existing `src/` infrastructure  

---

## 1. Overview

This document specifies a full import/export pipeline for Accessify's 3D accessibility mapping workflow. The system lets users:

1. **Import** a previously exported Accessify bundle (a ZIP file) and instantly reconstruct a full analysis session — bypassing the photo upload and Gemini API call entirely.
2. **Export** the current analysis session as a self-contained ZIP bundle that includes the OBJ mesh, depth map, texture, Gemini analysis, and a plain-text report.
3. **Export the procedural simulation** as a second, separately selectable bundle that includes the room geometry, fixture data, persona definitions, and a simulation-ready JSON manifest.

A single animated dropdown button lives in the top-right of the analysis toolbar and houses all three actions. The UI is designed to match and extend the existing Accessify design language.

---

## 2. Bundle Formats

### 2.1 Mesh Bundle (`accessify-mesh-{id}.zip`)

This is the primary export. It contains everything needed to reconstruct the MeshViewer session and re-hydrate the Zustand store.

```
accessify-mesh-{id}.zip
├── manifest.json          ← bundle metadata and format version
├── texture.jpg            ← original uploaded image (JPEG, max 4 MB re-encoded)
├── depth.png              ← depth map PNG data URL decoded to binary
├── model.obj              ← Three.js PlaneGeometry exported to Wavefront OBJ
├── model.mtl              ← material file referencing texture.jpg
├── analysis.json          ← full parsed Gemini analysis object (AnalysisSchema output)
├── report.md              ← the existing Markdown report text (already generated)
└── README.txt             ← human-readable guide for the bundle contents
```

#### `manifest.json` schema

```jsonc
{
  "accessifyVersion": "1.0",
  "bundleType": "mesh",          // "mesh" | "scene"
  "exportedAt": "<ISO 8601>",
  "sessionId": "<store id>",
  "spaceType": "<SpaceType enum value>",
  "imageWidth": 1280,
  "imageHeight": 853,
  "depthModelId": "onnx-community/depth-anything-v2-small",
  "geminiModel": "gemini-2.5-flash",
  "meshSegmentsX": 128,          // PlaneGeometry width segments used
  "meshSegmentsY": 86,           // PlaneGeometry height segments used
  "files": {
    "texture": "texture.jpg",
    "depth":   "depth.png",
    "obj":     "model.obj",
    "mtl":     "model.mtl",
    "analysis":"analysis.json",
    "report":  "report.md"
  }
}
```

---

### 2.2 Scene Bundle (`accessify-scene-{id}.zip`)

The second export option captures the procedural low-poly room scene produced by SceneViewer. This bundle is only available when Gemini has returned a `roomLayout` object.

```
accessify-scene-{id}.zip
├── manifest.json          ← bundle metadata (bundleType: "scene")
├── room-layout.json       ← raw roomLayout object from analysis.json
├── scene.obj              ← Three.js room geometry (floor + walls + fixtures) as OBJ
├── scene.mtl              ← material file for scene geometry
├── issues.json            ← issue list with relatedFixtureId links
├── personas.json          ← persona definitions from src/lib/personas.ts
├── analysis.json          ← full analysis (same as mesh bundle)
└── README.txt             ← human-readable simulation guide
```

#### `manifest.json` (scene variant)

Identical to the mesh manifest, plus:

```jsonc
{
  "bundleType": "scene",
  "roomLayout": {
    "fixtureCount": 7,
    "wallCount": 4,
    "floorPolygonPoints": 4
  },
  "personaIds": ["ambulatory", "wheelchair", "blind"],
  "files": {
    "roomLayout": "room-layout.json",
    "obj":        "scene.obj",
    "mtl":        "scene.mtl",
    "issues":     "issues.json",
    "personas":   "personas.json",
    "analysis":   "analysis.json"
  }
}
```

---

## 3. File & Directory Layout

All new files go inside `src/`. No changes to `frontend/` are required.

```
src/
├── components/
│   ├── io/
│   │   ├── ImportExportButton.tsx     ← the animated dropdown button component
│   │   ├── ImportExportButton.module.css ← scoped CSS animations
│   │   └── index.ts                  ← barrel export
│   └── viewer/
│       └── (existing files unchanged)
└── lib/
    ├── export/
    │   ├── exportMeshBundle.ts        ← generates mesh ZIP
    │   ├── exportSceneBundle.ts       ← generates scene ZIP
    │   ├── objExporter.ts             ← Three.js → OBJ serialiser
    │   └── index.ts                  ← barrel export
    └── import/
        ├── importBundle.ts            ← reads ZIP, validates, hydrates store
        └── index.ts                  ← barrel export
```

---

## 4. Dependencies

Add exactly one new runtime dependency:

```bash
npm install jszip
npm install --save-dev @types/jszip   # if needed; jszip ships its own types
```

`jszip` handles ZIP creation and reading entirely in the browser — no server round-trip, no new API route. Everything else (`three`, `zustand`, `zod`) is already installed.

> **Do not add** `three-stdlib` OBJExporter; implement a minimal custom OBJ serialiser instead (see §6.3) to avoid the deprecated `three-mesh-bvh` chain flagged in the audit.

---

## 5. Zustand Store Changes (`src/lib/store.ts`)

### 5.1 New state fields

Add to the existing store interface:

```ts
// Import/export lifecycle
importSource: 'none' | 'file';   // was this session loaded from a bundle?
exportStage: 'idle' | 'preparing' | 'zipping' | 'done' | 'error';
exportProgress: number;           // 0–1 float for progress indicator
exportError: string | null;
```

### 5.2 New actions

```ts
setImportSource: (source: 'none' | 'file') => void;
setExportStage: (stage: ExportStage) => void;
setExportProgress: (progress: number) => void;
setExportError: (error: string | null) => void;
resetExport: () => void;
```

### 5.3 Hydration action

Add a single bulk-hydration action for import:

```ts
hydrateFromBundle: (payload: BundleHydrationPayload) => void;
```

Where `BundleHydrationPayload` is:

```ts
interface BundleHydrationPayload {
  id: string;
  imageDataUrl: string;
  imageWidth: number;
  imageHeight: number;
  depthDataUrl: string;
  analysis: Analysis;            // validated through existing AnalysisSchema
  spaceType: SpaceType;
  importSource: 'file';
  stage: 'done';
}
```

This single action replaces the multi-step `setImage → setDepth → setAnalysis → setStage` sequence that the normal upload flow uses, ensuring the store arrives in a fully consistent state in one synchronous commit.

---

## 6. Library Implementation

### 6.1 `src/lib/export/objExporter.ts`

A minimal, self-contained OBJ serialiser. Does not depend on any Three.js add-on.

```ts
import * as THREE from 'three';

export interface OBJOutput {
  obj: string;   // .obj file text
  mtl: string;   // .mtl file text
}

/**
 * Serialise a single Three.js Mesh to Wavefront OBJ + MTL.
 * Handles indexed and non-indexed BufferGeometry.
 * Normals and UVs are included when present.
 */
export function meshToOBJ(
  mesh: THREE.Mesh,
  options: {
    materialName?: string;   // default 'accessify_mat'
    textureName?: string;    // filename referenced in MTL, default 'texture.jpg'
    objectName?: string;     // default 'AccessifyMesh'
  } = {}
): OBJOutput {
  const {
    materialName = 'accessify_mat',
    textureName  = 'texture.jpg',
    objectName   = 'AccessifyMesh',
  } = options;

  // Clone and apply world transform so coordinates are in world space
  const geometry = mesh.geometry.clone();
  geometry.applyMatrix4(mesh.matrixWorld);
  geometry.computeVertexNormals();

  const positions = geometry.attributes.position as THREE.BufferAttribute;
  const normals   = geometry.attributes.normal   as THREE.BufferAttribute | undefined;
  const uvs       = geometry.attributes.uv       as THREE.BufferAttribute | undefined;
  const index     = geometry.index;

  const lines: string[] = [
    `# Accessify 3D Mesh Export`,
    `# Generated: ${new Date().toISOString()}`,
    `mtllib model.mtl`,
    `o ${objectName}`,
    '',
  ];

  // Vertices
  for (let i = 0; i < positions.count; i++) {
    lines.push(
      `v ${positions.getX(i).toFixed(6)} ${positions.getY(i).toFixed(6)} ${positions.getZ(i).toFixed(6)}`
    );
  }

  // UVs
  if (uvs) {
    for (let i = 0; i < uvs.count; i++) {
      lines.push(`vt ${uvs.getX(i).toFixed(6)} ${uvs.getY(i).toFixed(6)}`);
    }
  }

  // Normals
  if (normals) {
    for (let i = 0; i < normals.count; i++) {
      lines.push(
        `vn ${normals.getX(i).toFixed(6)} ${normals.getY(i).toFixed(6)} ${normals.getZ(i).toFixed(6)}`
      );
    }
  }

  lines.push('', `usemtl ${materialName}`, 's off', '');

  // Faces (1-indexed in OBJ format)
  const faceIndices = index
    ? Array.from({ length: index.count }, (_, i) => index.getX(i))
    : Array.from({ length: positions.count }, (_, i) => i);

  for (let i = 0; i < faceIndices.length; i += 3) {
    const a = faceIndices[i]     + 1;
    const b = faceIndices[i + 1] + 1;
    const c = faceIndices[i + 2] + 1;

    const hasUV = !!uvs;
    const hasN  = !!normals;

    const fmt = (v: number) => {
      if (hasUV && hasN) return `${v}/${v}/${v}`;
      if (hasUV)         return `${v}/${v}`;
      if (hasN)          return `${v}//${v}`;
      return `${v}`;
    };

    lines.push(`f ${fmt(a)} ${fmt(b)} ${fmt(c)}`);
  }

  const obj = lines.join('\n');

  const mtl = [
    `# Accessify Material`,
    `newmtl ${materialName}`,
    `Ka 1.000 1.000 1.000`,
    `Kd 1.000 1.000 1.000`,
    `Ks 0.000 0.000 0.000`,
    `d 1.0`,
    `illum 1`,
    `map_Kd ${textureName}`,
  ].join('\n');

  return { obj, mtl };
}
```

---

### 6.2 `src/lib/export/exportMeshBundle.ts`

```ts
import JSZip from 'jszip';
import * as THREE from 'three';
import { useStore } from '@/lib/store';
import { meshToOBJ } from './objExporter';
import { generateMarkdownReport } from '@/lib/report'; // existing utility

/**
 * Grab the live MeshViewer mesh ref, serialise everything, and download.
 * Call this from the ImportExportButton onClick handler.
 *
 * @param meshRef  - React ref to the THREE.Mesh inside MeshViewer
 * @param segments - { x, y } segment counts used when constructing the geometry
 */
export async function exportMeshBundle(
  meshRef: React.RefObject<THREE.Mesh | null>,
  segments: { x: number; y: number } = { x: 128, y: 86 }
): Promise<void> {
  const store = useStore.getState();

  const {
    id,
    imageDataUrl,
    imageWidth,
    imageHeight,
    depthDataUrl,
    analysis,
    userContext,
  } = store;

  if (!analysis || !imageDataUrl || !depthDataUrl) {
    throw new Error('Analysis not complete. Cannot export yet.');
  }

  store.setExportStage('preparing');
  store.setExportProgress(0.05);

  const zip = new JSZip();

  // --- texture.jpg ---
  // Re-encode the imageDataUrl as binary JPEG for smaller file size.
  const textureBlob = await dataUrlToBlob(imageDataUrl, 'image/jpeg', 0.9);
  zip.file('texture.jpg', textureBlob);
  store.setExportProgress(0.2);

  // --- depth.png ---
  const depthBlob = await dataUrlToBlob(depthDataUrl, 'image/png');
  zip.file('depth.png', depthBlob);
  store.setExportProgress(0.35);

  // --- model.obj + model.mtl ---
  if (meshRef.current) {
    const { obj, mtl } = meshToOBJ(meshRef.current, {
      materialName: 'accessify_mat',
      textureName:  'texture.jpg',
      objectName:   'AccessifyMesh',
    });
    zip.file('model.obj', obj);
    zip.file('model.mtl', mtl);
  } else {
    // Fallback: write a placeholder OBJ with a comment.
    zip.file('model.obj', `# Mesh reference unavailable at export time\n`);
    zip.file('model.mtl', '');
  }
  store.setExportProgress(0.55);

  // --- analysis.json ---
  zip.file('analysis.json', JSON.stringify(analysis, null, 2));
  store.setExportProgress(0.65);

  // --- report.md ---
  const reportMd = generateMarkdownReport(analysis, userContext);
  zip.file('report.md', reportMd);
  store.setExportProgress(0.75);

  // --- manifest.json ---
  const manifest = {
    accessifyVersion: '1.0',
    bundleType:       'mesh',
    exportedAt:       new Date().toISOString(),
    sessionId:        id,
    spaceType:        userContext.spaceType,
    imageWidth,
    imageHeight,
    depthModelId:     'onnx-community/depth-anything-v2-small',
    geminiModel:      'gemini-2.5-flash',
    meshSegmentsX:    segments.x,
    meshSegmentsY:    segments.y,
    files: {
      texture:  'texture.jpg',
      depth:    'depth.png',
      obj:      'model.obj',
      mtl:      'model.mtl',
      analysis: 'analysis.json',
      report:   'report.md',
    },
  };
  zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  // --- README.txt ---
  zip.file('README.txt', meshBundleReadme(manifest));
  store.setExportProgress(0.85);

  // --- Generate and download ZIP ---
  store.setExportStage('zipping');
  const blob = await zip.generateAsync(
    { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } },
    (meta) => {
      store.setExportProgress(0.85 + meta.percent / 100 * 0.14);
    }
  );
  store.setExportProgress(1.0);
  store.setExportStage('done');

  triggerDownload(blob, `accessify-mesh-${id.slice(0, 8)}.zip`);

  // Reset after short delay so UI can show completion state
  setTimeout(() => store.resetExport(), 2500);
}

// ---------- helpers ----------

async function dataUrlToBlob(
  dataUrl: string,
  mimeType: string,
  quality?: number
): Promise<Blob> {
  // For re-encoding with quality, use Canvas API
  if (quality !== undefined && mimeType === 'image/jpeg') {
    const img = await loadImage(dataUrl);
    const canvas = document.createElement('canvas');
    canvas.width  = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Canvas toBlob failed'))),
        mimeType,
        quality
      );
    });
  }

  // Raw base64 → Uint8Array → Blob
  const base64 = dataUrl.split(',')[1];
  const binary  = atob(base64);
  const bytes   = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mimeType });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = reject;
    img.src     = src;
  });
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function meshBundleReadme(manifest: Record<string, unknown>): string {
  return `ACCESSIFY MESH BUNDLE
=====================
Bundle type : Mesh
Exported at : ${manifest.exportedAt}
Session ID  : ${manifest.sessionId}
Space type  : ${manifest.spaceType}

FILES
-----
texture.jpg    Original uploaded photo (JPEG)
depth.png      Depth map produced by ${manifest.depthModelId}
model.obj      3D displaced mesh in Wavefront OBJ format
model.mtl      Material definition referencing texture.jpg
analysis.json  Full Gemini accessibility analysis (JSON)
report.md      Human-readable accessibility report (Markdown)
manifest.json  Bundle metadata

IMPORTING
---------
Open Accessify and click the Import / Export button at the top of
the analysis view, then choose "Import". Select this ZIP file.
Accessify will reconstruct the full analysis session without
re-running the AI or depth model.

OBJ FORMAT
----------
The model.obj file is a standard Wavefront OBJ. It can be opened in
Blender, Meshlab, or any OBJ-compatible 3D viewer. Point the viewer
at texture.jpg for correct appearance.

DISCLAIMER
----------
This analysis is AI-generated and should be verified by a qualified
accessibility consultant before making accessibility decisions.
`;
}
```

---

### 6.3 `src/lib/export/exportSceneBundle.ts`

```ts
import JSZip from 'jszip';
import * as THREE from 'three';
import { useStore } from '@/lib/store';
import { meshToOBJ } from './objExporter';
import { PERSONAS } from '@/lib/personas'; // existing export

/**
 * Collect all scene meshes from SceneViewer and export as a ZIP.
 *
 * @param sceneRef - React ref to the THREE.Scene inside SceneViewer
 */
export async function exportSceneBundle(
  sceneRef: React.RefObject<THREE.Scene | null>
): Promise<void> {
  const store = useStore.getState();
  const { id, analysis, userContext } = store;

  if (!analysis?.roomLayout) {
    throw new Error('No room layout available. Cannot export scene bundle.');
  }

  store.setExportStage('preparing');
  store.setExportProgress(0.05);

  const zip = new JSZip();

  // --- Collect scene geometry as OBJ ---
  if (sceneRef.current) {
    const combinedObj  = collectSceneOBJ(sceneRef.current);
    zip.file('scene.obj', combinedObj.obj);
    zip.file('scene.mtl', combinedObj.mtl);
  } else {
    zip.file('scene.obj', '# Scene reference unavailable at export time\n');
    zip.file('scene.mtl', '');
  }
  store.setExportProgress(0.35);

  // --- room-layout.json ---
  zip.file('room-layout.json', JSON.stringify(analysis.roomLayout, null, 2));

  // --- issues.json ---
  zip.file('issues.json', JSON.stringify(analysis.issues, null, 2));

  // --- personas.json ---
  zip.file('personas.json', JSON.stringify(PERSONAS, null, 2));

  // --- analysis.json ---
  zip.file('analysis.json', JSON.stringify(analysis, null, 2));
  store.setExportProgress(0.65);

  // --- manifest.json ---
  const manifest = {
    accessifyVersion: '1.0',
    bundleType:       'scene',
    exportedAt:       new Date().toISOString(),
    sessionId:        id,
    spaceType:        userContext.spaceType,
    geminiModel:      'gemini-2.5-flash',
    roomLayout: {
      fixtureCount:        analysis.roomLayout.fixtures?.length ?? 0,
      wallCount:           analysis.roomLayout.walls?.length    ?? 0,
      floorPolygonPoints:  analysis.roomLayout.floor?.polygon?.length ?? 0,
    },
    personaIds: Object.keys(PERSONAS),
    files: {
      roomLayout: 'room-layout.json',
      obj:        'scene.obj',
      mtl:        'scene.mtl',
      issues:     'issues.json',
      personas:   'personas.json',
      analysis:   'analysis.json',
    },
  };
  zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  // --- README.txt ---
  zip.file('README.txt', sceneBundleReadme(manifest));
  store.setExportProgress(0.80);

  // --- Generate and download ---
  store.setExportStage('zipping');
  const blob = await zip.generateAsync(
    { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } },
    (meta) => {
      store.setExportProgress(0.80 + meta.percent / 100 * 0.19);
    }
  );
  store.setExportProgress(1.0);
  store.setExportStage('done');

  const a = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = `accessify-scene-${id.slice(0, 8)}.zip`;
  a.click();

  setTimeout(() => store.resetExport(), 2500);
}

/**
 * Walk the THREE.Scene, find all Mesh children, serialise as a single OBJ.
 * Each mesh becomes a named object group.
 */
function collectSceneOBJ(scene: THREE.Scene): { obj: string; mtl: string } {
  const objLines: string[] = [
    `# Accessify Scene Export`,
    `# Generated: ${new Date().toISOString()}`,
    `mtllib scene.mtl`,
    '',
  ];
  const mtlLines: string[] = [
    `# Accessify Scene Materials`,
  ];

  let vertexOffset = 0;
  const materialsSeen = new Set<string>();

  scene.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    if (!child.visible) return;

    const geom  = child.geometry.clone();
    geom.applyMatrix4(child.matrixWorld);
    geom.computeVertexNormals();

    const positions = geom.attributes.position as THREE.BufferAttribute;
    const normals   = geom.attributes.normal   as THREE.BufferAttribute | undefined;
    const uvs       = geom.attributes.uv       as THREE.BufferAttribute | undefined;
    const index     = geom.index;

    // Determine material name
    const mat = Array.isArray(child.material) ? child.material[0] : child.material;
    const matName: string = (mat as THREE.MeshStandardMaterial).name || `mat_${child.uuid.slice(0, 6)}`;

    // Add material definition once
    if (!materialsSeen.has(matName)) {
      materialsSeen.add(matName);
      const color = (mat as THREE.MeshStandardMaterial).color ?? new THREE.Color(0.8, 0.8, 0.8);
      mtlLines.push(
        ``,
        `newmtl ${matName}`,
        `Ka ${color.r.toFixed(3)} ${color.g.toFixed(3)} ${color.b.toFixed(3)}`,
        `Kd ${color.r.toFixed(3)} ${color.g.toFixed(3)} ${color.b.toFixed(3)}`,
        `Ks 0.000 0.000 0.000`,
        `d 1.0`,
        `illum 1`
      );
    }

    objLines.push(`o ${child.name || child.uuid.slice(0, 8)}`);

    // Vertices
    for (let i = 0; i < positions.count; i++) {
      objLines.push(
        `v ${positions.getX(i).toFixed(6)} ${positions.getY(i).toFixed(6)} ${positions.getZ(i).toFixed(6)}`
      );
    }

    // Normals
    if (normals) {
      for (let i = 0; i < normals.count; i++) {
        objLines.push(
          `vn ${normals.getX(i).toFixed(6)} ${normals.getY(i).toFixed(6)} ${normals.getZ(i).toFixed(6)}`
        );
      }
    }

    objLines.push(`usemtl ${matName}`, `s off`);

    // Faces (offset by already-written vertex count)
    const faceIdx = index
      ? Array.from({ length: index.count }, (_, i) => index.getX(i))
      : Array.from({ length: positions.count }, (_, i) => i);

    for (let i = 0; i < faceIdx.length; i += 3) {
      const a = faceIdx[i]     + 1 + vertexOffset;
      const b = faceIdx[i + 1] + 1 + vertexOffset;
      const c = faceIdx[i + 2] + 1 + vertexOffset;
      const hasN = !!normals;
      const fmt = (v: number) => (hasN ? `${v}//${v}` : `${v}`);
      objLines.push(`f ${fmt(a)} ${fmt(b)} ${fmt(c)}`);
    }

    objLines.push('');
    vertexOffset += positions.count;
    geom.dispose();
  });

  return { obj: objLines.join('\n'), mtl: mtlLines.join('\n') };
}

function sceneBundleReadme(manifest: Record<string, unknown>): string {
  return `ACCESSIFY SCENE BUNDLE
======================
Bundle type : Procedural Simulation Scene
Exported at : ${manifest.exportedAt}
Session ID  : ${manifest.sessionId}
Space type  : ${manifest.spaceType}

FILES
-----
scene.obj        Low-poly procedural room geometry (Wavefront OBJ)
scene.mtl        Material definitions for scene.obj
room-layout.json Gemini-generated room layout (floor, walls, fixtures)
issues.json      Accessibility issues with fixture links
personas.json    Persona definitions (ambulatory, wheelchair, blind)
analysis.json    Full Gemini analysis
manifest.json    Bundle metadata

SIMULATION
----------
The room-layout.json contains floor polygon, wall segments, and
fixture placements generated by the Gemini accessibility analysis.
The scene.obj is derived from these definitions using Accessify's
procedural SceneViewer renderer.

To replay the simulation: import this ZIP into Accessify using the
Import / Export button, then open the Simulation view.

PERSONAS
--------
- ambulatory : Standard walking; reports mobility and obstacle issues
- wheelchair  : Reports ramp, door-width, turning-radius, and reach issues
- blind/cane  : Reports signage, lighting, and wayfinding issues

DISCLAIMER
----------
AI-generated geometry is approximate and may not reflect true spatial
measurements. Always verify with on-site measurement and a qualified
accessibility consultant.
`;
}
```

---

### 6.4 `src/lib/import/importBundle.ts`

```ts
import JSZip from 'jszip';
import { useStore } from '@/lib/store';
import { AnalysisSchema } from '@/lib/schemas';
import type { Analysis } from '@/lib/schemas';

export type BundleType = 'mesh' | 'scene';

export interface ImportResult {
  bundleType: BundleType;
  sessionId:  string;
}

/**
 * Reads a ZIP file dropped by the user, validates the manifest,
 * extracts assets, and hydrates the Zustand store.
 *
 * Returns the session ID so the caller can router.push(`/analyze/${id}`).
 */
export async function importBundle(file: File): Promise<ImportResult> {
  const store = useStore.getState();

  // 1. Unzip
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(file);
  } catch {
    throw new Error('Could not read ZIP file. Make sure it is a valid Accessify bundle.');
  }

  // 2. Read and validate manifest
  const manifestFile = zip.file('manifest.json');
  if (!manifestFile) {
    throw new Error('Missing manifest.json. This does not appear to be an Accessify bundle.');
  }
  const manifestText = await manifestFile.async('string');
  let manifest: Record<string, unknown>;
  try {
    manifest = JSON.parse(manifestText);
  } catch {
    throw new Error('manifest.json is not valid JSON.');
  }

  if (manifest.accessifyVersion !== '1.0') {
    throw new Error(`Unsupported bundle version: "${manifest.accessifyVersion}". Expected "1.0".`);
  }

  const bundleType = manifest.bundleType as BundleType;
  if (bundleType !== 'mesh' && bundleType !== 'scene') {
    throw new Error(`Unknown bundleType: "${bundleType}".`);
  }

  // 3. Read and validate analysis.json
  const analysisFile = zip.file('analysis.json');
  if (!analysisFile) throw new Error('Missing analysis.json in bundle.');
  const analysisText = await analysisFile.async('string');
  let rawAnalysis: unknown;
  try {
    rawAnalysis = JSON.parse(analysisText);
  } catch {
    throw new Error('analysis.json is not valid JSON.');
  }

  let analysis: Analysis;
  try {
    analysis = AnalysisSchema.parse(rawAnalysis);
  } catch (e) {
    throw new Error(`analysis.json failed schema validation: ${(e as Error).message}`);
  }

  // 4. Read texture (required for mesh bundles)
  let imageDataUrl = '';
  if (bundleType === 'mesh') {
    const textureFile = zip.file('texture.jpg');
    if (!textureFile) throw new Error('Missing texture.jpg in mesh bundle.');
    const textureBytes = await textureFile.async('uint8array');
    imageDataUrl = uint8ToDataUrl(textureBytes, 'image/jpeg');
  }

  // 5. Read depth map (required for mesh bundles)
  let depthDataUrl = '';
  if (bundleType === 'mesh') {
    const depthFile = zip.file('depth.png');
    if (!depthFile) throw new Error('Missing depth.png in mesh bundle.');
    const depthBytes = await depthFile.async('uint8array');
    depthDataUrl = uint8ToDataUrl(depthBytes, 'image/png');
  }

  // 6. Derive image dimensions from the manifest (avoid loading image in Node/SSR)
  const imageWidth  = (manifest.imageWidth  as number) || 1280;
  const imageHeight = (manifest.imageHeight as number) || 853;

  // 7. Hydrate store
  const sessionId = (manifest.sessionId as string) || crypto.randomUUID();

  store.hydrateFromBundle({
    id:           sessionId,
    imageDataUrl,
    imageWidth,
    imageHeight,
    depthDataUrl,
    analysis,
    spaceType:    (manifest.spaceType as string) as import('@/lib/schemas').SpaceType,
    importSource: 'file',
    stage:        'done',
  });

  return { bundleType, sessionId };
}

function uint8ToDataUrl(bytes: Uint8Array, mimeType: string): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return `data:${mimeType};base64,${btoa(binary)}`;
}
```

---

## 7. UI Component

### 7.1 `src/components/io/ImportExportButton.tsx`

Design direction: **cold-chrome precision**. Matches Accessify's dark glassmorphism aesthetic (existing dark background, teal/blue accent palette). The button is a pill with a subtle frosted-glass background. On click, a drawer slides down with three labelled options. Each option has an icon, a label, and a sub-label. Hover states animate the icon. A progress bar replaces the button label during active export.

```tsx
'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ArrowUpTrayIcon, ArrowDownTrayIcon, CubeIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
// If heroicons is not installed, use lucide-react equivalents:
// import { Upload, Download, Box, ChevronDown } from 'lucide-react';
import { useStore } from '@/lib/store';
import { exportMeshBundle }  from '@/lib/export/exportMeshBundle';
import { exportSceneBundle } from '@/lib/export/exportSceneBundle';
import { importBundle }      from '@/lib/import/importBundle';
import { useRouter }         from 'next/navigation';
import styles from './ImportExportButton.module.css';
import type * as THREE from 'three';

interface ImportExportButtonProps {
  /** Ref to the live THREE.Mesh in MeshViewer — needed for OBJ export */
  meshRef?: React.RefObject<THREE.Mesh | null>;
  /** Ref to the live THREE.Scene in SceneViewer — needed for scene OBJ export */
  sceneRef?: React.RefObject<THREE.Scene | null>;
  /** Whether we are currently on the analysis page (enables export) */
  analysisReady?: boolean;
}

export function ImportExportButton({
  meshRef,
  sceneRef,
  analysisReady = false,
}: ImportExportButtonProps) {
  const router  = useRouter();
  const [open,  setOpen]  = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef  = useRef<HTMLDivElement>(null);

  const analysis     = useStore((s) => s.analysis);
  const exportStage  = useStore((s) => s.exportStage);
  const exportProgress = useStore((s) => s.exportProgress);
  const hasScene     = !!analysis?.roomLayout;

  const isExporting  = exportStage === 'preparing' || exportStage === 'zipping';
  const exportDone   = exportStage === 'done';

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Import handler
  const handleImportClick = () => {
    setOpen(false);
    fileInputRef.current?.click();
  };

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setError(null);
      try {
        const result = await importBundle(file);
        router.push(`/analyze/${result.sessionId}`);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        // Reset the input so the same file can be re-selected
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [router]
  );

  // Export handlers
  const handleExportMesh = async () => {
    setOpen(false);
    setError(null);
    try {
      await exportMeshBundle(meshRef ?? { current: null });
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleExportScene = async () => {
    setOpen(false);
    setError(null);
    try {
      await exportSceneBundle(sceneRef ?? { current: null });
    } catch (err) {
      setError((err as Error).message);
    }
  };

  // Button label based on export state
  const buttonLabel = isExporting
    ? exportStage === 'preparing' ? 'Preparing…' : 'Compressing…'
    : exportDone
    ? 'Downloaded ✓'
    : 'Import / Export';

  return (
    <div className={styles.wrapper} ref={dropdownRef}>
      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".zip"
        className="sr-only"
        onChange={handleFileChange}
        aria-label="Import Accessify bundle"
      />

      {/* Main pill button */}
      <button
        className={`${styles.pill} ${open ? styles.pillOpen : ''} ${exportDone ? styles.pillDone : ''}`}
        onClick={() => !isExporting && setOpen((v) => !v)}
        disabled={isExporting}
        aria-haspopup="true"
        aria-expanded={open}
      >
        {/* Progress bar (visible during export) */}
        {isExporting && (
          <span
            className={styles.progressBar}
            style={{ transform: `scaleX(${exportProgress})` }}
          />
        )}

        <span className={styles.pillLabel}>{buttonLabel}</span>
        <ChevronDownIcon
          className={`${styles.caret} ${open ? styles.caretUp : ''}`}
          aria-hidden
        />
      </button>

      {/* Dropdown panel */}
      <div
        className={`${styles.dropdown} ${open ? styles.dropdownOpen : ''}`}
        role="menu"
        aria-label="Import or export options"
      >
        {/* ── Import ── */}
        <button
          className={styles.option}
          onClick={handleImportClick}
          role="menuitem"
        >
          <span className={styles.optionIcon}>
            <ArrowUpTrayIcon className={styles.icon} aria-hidden />
          </span>
          <span className={styles.optionText}>
            <span className={styles.optionLabel}>Import</span>
            <span className={styles.optionSub}>Load a previous Accessify bundle (.zip)</span>
          </span>
        </button>

        <div className={styles.divider} aria-hidden />

        {/* ── Export 3D Mesh ── */}
        <button
          className={`${styles.option} ${!analysisReady ? styles.optionDisabled : ''}`}
          onClick={analysisReady ? handleExportMesh : undefined}
          role="menuitem"
          disabled={!analysisReady}
          title={!analysisReady ? 'Analysis must complete before exporting' : undefined}
        >
          <span className={styles.optionIcon}>
            <ArrowDownTrayIcon className={styles.icon} aria-hidden />
          </span>
          <span className={styles.optionText}>
            <span className={styles.optionLabel}>Export 3D Mesh</span>
            <span className={styles.optionSub}>OBJ · depth map · analysis · report</span>
          </span>
          <span className={styles.badge}>ZIP</span>
        </button>

        {/* ── Export Procedural Scene ── */}
        <button
          className={`${styles.option} ${!hasScene ? styles.optionDisabled : ''}`}
          onClick={hasScene ? handleExportScene : undefined}
          role="menuitem"
          disabled={!hasScene}
          title={!hasScene ? 'No room layout available for this analysis' : undefined}
        >
          <span className={styles.optionIcon}>
            <CubeIcon className={styles.icon} aria-hidden />
          </span>
          <span className={styles.optionText}>
            <span className={styles.optionLabel}>Export Simulation Scene</span>
            <span className={styles.optionSub}>Room geometry · personas · layout JSON</span>
          </span>
          <span className={styles.badge}>ZIP</span>
        </button>
      </div>

      {/* Inline error display */}
      {error && (
        <p className={styles.errorMsg} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
```

---

### 7.2 `src/components/io/ImportExportButton.module.css`

```css
/* ── Wrapper ── */
.wrapper {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: flex-end;
  z-index: 50;
}

/* ── Pill button ── */
.pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  position: relative;
  overflow: hidden;
  padding: 9px 18px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.07);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  color: rgba(255, 255, 255, 0.88);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.01em;
  cursor: pointer;
  transition:
    background 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease,
    transform 120ms ease;
  white-space: nowrap;
  user-select: none;
}

.pill:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.22);
  box-shadow: 0 0 0 1px rgba(56, 189, 248, 0.15), 0 4px 16px rgba(0, 0, 0, 0.25);
}

.pill:active {
  transform: scale(0.97);
}

.pillOpen {
  background: rgba(255, 255, 255, 0.13);
  border-color: rgba(56, 189, 248, 0.35);
  box-shadow: 0 0 0 1px rgba(56, 189, 248, 0.25), 0 4px 20px rgba(0, 0, 0, 0.3);
}

.pillDone {
  border-color: rgba(52, 211, 153, 0.45);
  color: rgb(110, 231, 183);
}

.pill:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Progress bar inside pill */
.progressBar {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(56, 189, 248, 0.18), rgba(99, 102, 241, 0.15));
  transform-origin: left center;
  transform: scaleX(0);
  transition: transform 400ms cubic-bezier(0.22, 1, 0.36, 1);
  pointer-events: none;
  border-radius: inherit;
}

.pillLabel {
  position: relative;
  z-index: 1;
}

/* Caret icon */
.caret {
  width: 14px;
  height: 14px;
  opacity: 0.6;
  transition: transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 180ms ease;
  flex-shrink: 0;
}

.caretUp {
  transform: rotate(180deg);
  opacity: 1;
}

/* ── Dropdown ── */
.dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 300px;
  background: rgba(15, 23, 42, 0.88);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 8px;
  box-shadow:
    0 0 0 1px rgba(56, 189, 248, 0.08),
    0 8px 32px rgba(0, 0, 0, 0.45),
    0 2px 8px rgba(0, 0, 0, 0.3);

  /* Hidden state */
  opacity: 0;
  transform: translateY(-6px) scale(0.97);
  pointer-events: none;
  transform-origin: top right;
  transition:
    opacity 200ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.dropdownOpen {
  opacity: 1;
  transform: translateY(0) scale(1);
  pointer-events: auto;
}

/* ── Option rows ── */
.option {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 11px 12px;
  border-radius: 10px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  text-align: left;
  transition: background 150ms ease, color 150ms ease;
  position: relative;
}

.option:hover {
  background: rgba(56, 189, 248, 0.1);
  color: rgb(255, 255, 255);
}

.option:hover .icon {
  transform: scale(1.12) translateY(-1px);
  color: rgb(125, 211, 252);
}

.optionDisabled {
  opacity: 0.38;
  cursor: not-allowed;
  pointer-events: none;
}

/* Icon wrapper */
.optionIcon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}

.icon {
  width: 16px;
  height: 16px;
  transition: transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1), color 150ms ease;
}

/* Option text */
.optionText {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.optionLabel {
  font-size: 13px;
  font-weight: 500;
  line-height: 1.3;
}

.optionSub {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.42);
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ZIP badge */
.badge {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(56, 189, 248, 0.15);
  color: rgb(125, 211, 252);
  border: 1px solid rgba(56, 189, 248, 0.2);
  flex-shrink: 0;
}

/* Divider */
.divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.07);
  margin: 4px 12px;
}

/* Error message */
.errorMsg {
  margin-top: 8px;
  max-width: 300px;
  font-size: 12px;
  color: rgb(252, 129, 129);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  padding: 8px 12px;
  line-height: 1.5;
}
```

---

## 8. Integration Points

### 8.1 MeshViewer — expose mesh ref

In `src/components/viewer/MeshViewer.tsx`, the mesh created for the displaced photo plane needs to be forwarded to the parent via a ref. Add a `meshRef` prop:

```tsx
// In MeshViewer.tsx props:
interface MeshViewerProps {
  // ... existing props
  meshRef?: React.RefObject<THREE.Mesh | null>;
}

// Inside the Three.js scene setup, after creating the mesh:
if (props.meshRef) {
  props.meshRef.current = displacedMesh; // assign the live mesh
}
```

### 8.2 SceneViewer — expose scene ref

In `src/components/viewer/SceneViewer.tsx`, expose the Three.js scene:

```tsx
interface SceneViewerProps {
  // ... existing props
  sceneRef?: React.RefObject<THREE.Scene | null>;
}

// Inside the @react-three/fiber <Canvas>:
function SceneCapture({ sceneRef }: { sceneRef?: React.RefObject<THREE.Scene | null> }) {
  const { scene } = useThree();
  useEffect(() => {
    if (sceneRef) sceneRef.current = scene;
    return () => { if (sceneRef) sceneRef.current = null; };
  }, [scene, sceneRef]);
  return null;
}

// Add inside <Canvas>:
<SceneCapture sceneRef={props.sceneRef} />
```

### 8.3 AnalyzeView — wire up the button

In `src/app/analyze/[id]/AnalyzeView.tsx`:

```tsx
import { useRef } from 'react';
import { ImportExportButton } from '@/components/io';
import type * as THREE from 'three';

// Inside the component:
const meshRef  = useRef<THREE.Mesh | null>(null);
const stage    = useStore((s) => s.stage);

// In JSX, place the button in the top toolbar area:
<div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
  <h1 className="text-sm font-medium text-white/70">Accessibility Analysis</h1>
  <ImportExportButton
    meshRef={meshRef}
    analysisReady={stage === 'done'}
  />
</div>

// Pass meshRef down to MeshViewer:
<MeshViewer meshRef={meshRef} {/* ...other props */} />
```

### 8.4 SceneView — wire up the button

In `src/app/analyze/[id]/scene/SceneView.tsx` (or `page.tsx`):

```tsx
const sceneRef = useRef<THREE.Scene | null>(null);

// Toolbar:
<ImportExportButton
  sceneRef={sceneRef}
  analysisReady={true}
/>

// Pass to viewer:
<SceneViewer sceneRef={sceneRef} {/* ...other props */} />
```

### 8.5 Home page — import from landing

Optionally, add the `ImportExportButton` to the home page (`src/app/page.tsx`) in import-only mode (no `analysisReady`, no `meshRef`). This lets users start a session directly from a bundle without uploading a new photo:

```tsx
<ImportExportButton />
```

When there is no `analysisReady`, the two export options render as disabled and the user can only trigger Import.

---

## 9. Import Flow — End-to-End

```
User clicks Import → file picker opens
  ↓
User selects *.zip file
  ↓
importBundle(file) runs:
  1. JSZip.loadAsync(file)           — unzip in browser memory
  2. Parse & validate manifest.json  — format version check
  3. Parse & validate analysis.json  — run through AnalysisSchema (Zod)
  4. Decode texture.jpg → imageDataUrl
  5. Decode depth.png   → depthDataUrl
  6. store.hydrateFromBundle(payload) — single synchronous commit
  ↓
router.push(`/analyze/${sessionId}`)
  ↓
AnalyzeView mounts, reads store, stage === 'done'
  → MeshViewer renders immediately with imported texture + depth
  → Analysis panel renders imported Gemini findings
  → No depth estimation or Gemini API call made
```

---

## 10. Export Flow — End-to-End

### Mesh export

```
User clicks Export 3D Mesh
  ↓
exportMeshBundle(meshRef) runs:
  store.setExportStage('preparing')
  1. dataUrlToBlob(imageDataUrl)     → texture blob
  2. dataUrlToBlob(depthDataUrl)     → depth blob
  3. meshToOBJ(meshRef.current)      → obj string + mtl string
  4. JSON.stringify(analysis)        → analysis.json text
  5. generateMarkdownReport(...)     → report.md text
  6. Build manifest.json + README.txt
  store.setExportStage('zipping')
  7. zip.generateAsync(...)          → Blob (with per-chunk progress)
  store.setExportStage('done')
  8. triggerDownload(blob, filename)
  → setTimeout → store.resetExport()
```

Progress (0 → 1) flows into `store.exportProgress`, which drives the pill's `progressBar` `scaleX` transform in real time.

### Scene export

Identical flow; replace step 3 with `collectSceneOBJ(sceneRef.current)` and the other scene-specific files.

---

## 11. Zustand Store Additions — Full Diff

Add to `src/lib/store.ts`:

```ts
// State additions (add to AppState interface)
importSource:    'none' | 'file';
exportStage:     'idle' | 'preparing' | 'zipping' | 'done' | 'error';
exportProgress:  number;
exportError:     string | null;

// Initial state values
importSource:   'none',
exportStage:    'idle',
exportProgress: 0,
exportError:    null,

// Actions (add to the store creator)
setImportSource: (source) => set({ importSource: source }),
setExportStage:  (stage)  => set({ exportStage: stage }),
setExportProgress: (p)    => set({ exportProgress: p }),
setExportError:  (e)      => set({ exportError: e }),
resetExport: () => set({ exportStage: 'idle', exportProgress: 0, exportError: null }),

hydrateFromBundle: (payload) => set({
  id:           payload.id,
  imageDataUrl: payload.imageDataUrl,
  imageWidth:   payload.imageWidth,
  imageHeight:  payload.imageHeight,
  depthDataUrl: payload.depthDataUrl,
  analysis:     payload.analysis,
  userContext: {
    ...get().userContext,
    spaceType: payload.spaceType,
  },
  importSource: payload.importSource,
  stage:        payload.stage,
  error:        null,
}),
```

---

## 12. Error Handling Strategy

| Failure point | Behaviour |
|---|---|
| ZIP file is not a valid ZIP | `importBundle` throws; caught in `handleFileChange`; shown in `errorMsg` |
| `manifest.json` missing or bad version | Same |
| `analysis.json` fails Zod validation | Same, with schema error message |
| `texture.jpg` or `depth.png` missing | Same |
| Export called before analysis done | `exportMeshBundle` throws; caught in click handler; shown in `errorMsg` |
| `meshRef.current` is null at export time | Fallback placeholder OBJ written; export continues |
| `sceneRef.current` is null at export time | Same |
| JSZip compression fails | Caught by outer try/catch; `store.setExportError` called; stage → `'error'` |

All errors displayed inline below the button via the `errorMsg` CSS class. No modal required.

---

## 13. Accessibility (a11y)

- The pill button has `aria-haspopup="true"` and `aria-expanded` toggled on open/close.
- The dropdown has `role="menu"` and each option has `role="menuitem"`.
- Disabled options have the HTML `disabled` attribute (not just CSS opacity), excluding them from focus order.
- The hidden file input has `aria-label="Import Accessify bundle"`.
- The error paragraph has `role="alert"` for screen reader announcement.
- Keyboard: `Tab` focuses the pill; `Enter`/`Space` opens the dropdown; `Escape` closes it (add `keydown` handler for Escape to `setOpen(false)`).

---

## 14. Performance Considerations

- **OBJ export** runs synchronously on the main thread. For a 128×86-segment plane (11,008 vertices, ~21,000 faces) this takes roughly 15–80 ms on a modern device. No worker needed.
- **Scene OBJ** traverses the full Three.js scene graph. For the procedural room (< 200 meshes typical), this is also fast. If the scene grows, move to a `Worker` using `OffscreenCanvas`-style message passing.
- **JSZip compression** (`DEFLATE level 6`) runs synchronously but can block for 1–3 seconds on large textures. The `onUpdate` callback drives the progress bar to keep the UI responsive. If blocking is unacceptable, use `generateAsync` with a 0-ms `setTimeout` yield between chunks — JSZip supports this via its internal streaming.
- **Import** decodes base64 strings into `Uint8Array` on the main thread. For a 4 MB texture this is fast (< 50 ms). The `hydrateFromBundle` Zustand call is synchronous and instant.
- **No server round-trip** occurs for any import/export operation. Everything is client-side.

---

## 15. Testing Checklist

Once implemented, verify:

- [ ] Export button disabled when `stage !== 'done'`
- [ ] Export Simulation Scene option disabled when `analysis.roomLayout` is null/undefined
- [ ] Progress bar animates from 0 → 1 during export
- [ ] Button label changes to "Downloading…" / "Downloaded ✓" on completion
- [ ] Downloaded ZIP opens correctly in system archive manager
- [ ] `model.obj` opens in Blender with correct texture mapping
- [ ] `analysis.json` parses through `AnalysisSchema` without errors
- [ ] Re-importing an exported mesh bundle reconstructs the full session (no API call made)
- [ ] Importing a corrupted ZIP shows an inline error, does not crash
- [ ] Importing a bundle with a wrong `accessifyVersion` shows a clear error
- [ ] File input resets after import so the same file can be re-imported
- [ ] Dropdown closes when clicking outside
- [ ] Keyboard: Escape closes the dropdown
- [ ] Screen reader announces the dropdown state and each option
- [ ] No memory leak from `URL.createObjectURL` (revoked after 60 s)

---

## 16. Future Extensions

These are out of scope for the initial implementation but should be considered in the architecture:

- **GLB/glTF export** — Three.js has `GLTFExporter` in `three/examples/jsm`. This would give a more compact, widely supported format as a second export target. Add as a fourth dropdown option: "Export 3D Mesh (glTF)".
- **Bundle versioning** — `accessifyVersion` in the manifest enables forward-compatible import logic. When new fields are added, bump the version and add a migration path in `importBundle.ts`.
- **Cloud sync** — Today the bundle is a local download. A future `Share` option could upload the ZIP to S3 and return a shareable URL, solving the session persistence problem flagged in the audit.
- **Drag-and-drop import** — Add a `dragover`/`drop` listener to the home page hero area as a secondary import path alongside the button.
- **Progress toast** — Replace the inline `errorMsg` with the `sonner` toast library (already in `frontend/` but not in `src/`). This gives dismissible, stacked notifications without cluttering the toolbar.
