import * as THREE from "three";

export interface OBJOutput {
  obj: string;
  mtl: string;
}

interface MeshToOBJOptions {
  materialName?: string;
  textureName?: string;
  objectName?: string;
  mtllibName?: string;
}

export function meshToOBJ(
  mesh: THREE.Mesh,
  options: MeshToOBJOptions = {},
): OBJOutput {
  const {
    materialName = "accessify_mat",
    textureName = "texture.jpg",
    objectName = "AccessifyMesh",
    mtllibName = "model.mtl",
  } = options;

  mesh.updateMatrixWorld(true);

  const geometry = mesh.geometry.clone();
  geometry.applyMatrix4(mesh.matrixWorld);
  geometry.computeVertexNormals();

  const positions = geometry.attributes.position as THREE.BufferAttribute;
  const normals = geometry.attributes.normal as THREE.BufferAttribute | undefined;
  const uvs = geometry.attributes.uv as THREE.BufferAttribute | undefined;
  const index = geometry.index;

  const lines: string[] = [
    "# Accessify 3D Mesh Export",
    `# Generated: ${new Date().toISOString()}`,
    `mtllib ${mtllibName}`,
    `o ${sanitizeName(objectName, "AccessifyMesh")}`,
    "",
  ];

  for (let i = 0; i < positions.count; i++) {
    lines.push(
      `v ${fixed(positions.getX(i))} ${fixed(positions.getY(i))} ${fixed(positions.getZ(i))}`,
    );
  }

  if (uvs) {
    lines.push("");
    for (let i = 0; i < uvs.count; i++) {
      lines.push(`vt ${fixed(uvs.getX(i))} ${fixed(uvs.getY(i))}`);
    }
  }

  if (normals) {
    lines.push("");
    for (let i = 0; i < normals.count; i++) {
      lines.push(
        `vn ${fixed(normals.getX(i))} ${fixed(normals.getY(i))} ${fixed(normals.getZ(i))}`,
      );
    }
  }

  lines.push("", `usemtl ${sanitizeName(materialName, "accessify_mat")}`, "s off", "");

  const faceIndices = index
    ? Array.from({ length: index.count }, (_, i) => index.getX(i))
    : Array.from({ length: positions.count }, (_, i) => i);

  for (let i = 0; i + 2 < faceIndices.length; i += 3) {
    const a = faceIndices[i] + 1;
    const b = faceIndices[i + 1] + 1;
    const c = faceIndices[i + 2] + 1;
    lines.push(`f ${formatVertex(a, !!uvs, !!normals)} ${formatVertex(b, !!uvs, !!normals)} ${formatVertex(c, !!uvs, !!normals)}`);
  }

  geometry.dispose();

  const safeMaterialName = sanitizeName(materialName, "accessify_mat");
  const mtl = [
    "# Accessify Material",
    `newmtl ${safeMaterialName}`,
    "Ka 1.000 1.000 1.000",
    "Kd 1.000 1.000 1.000",
    "Ks 0.000 0.000 0.000",
    "d 1.0",
    "illum 1",
    `map_Kd ${textureName}`,
  ].join("\n");

  return { obj: lines.join("\n"), mtl };
}

export function sanitizeName(value: string, fallback: string): string {
  const cleaned = value.trim().replace(/[^a-zA-Z0-9_.-]+/g, "_");
  return cleaned || fallback;
}

export function fixed(value: number): string {
  return Number.isFinite(value) ? value.toFixed(6) : "0.000000";
}

function formatVertex(index: number, hasUV: boolean, hasNormal: boolean): string {
  if (hasUV && hasNormal) return `${index}/${index}/${index}`;
  if (hasUV) return `${index}/${index}`;
  if (hasNormal) return `${index}//${index}`;
  return `${index}`;
}
