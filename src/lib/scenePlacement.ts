import type { Fixture, RoomLayout } from "@/lib/schemas";

export function pointInPolygon(
  x: number,
  z: number,
  polygon: [number, number][],
): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const zi = polygon[i][1];
    const xj = polygon[j][0];
    const zj = polygon[j][1];
    const intersect =
      (zi > z) !== (zj > z) &&
      x < ((xj - xi) * (z - zi)) / (zj - zi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function polygonCentroid(polygon: [number, number][]): [number, number] {
  let sx = 0,
    sz = 0;
  for (const [x, z] of polygon) {
    sx += x;
    sz += z;
  }
  const n = polygon.length || 1;
  return [sx / n, sz / n];
}

/** Pull a point toward the floor centroid until it lies inside the polygon. */
export function clampIntoFloor(
  x: number,
  z: number,
  polygon: [number, number][],
): [number, number] {
  if (pointInPolygon(x, z, polygon)) return [x, z];
  const [cx, cz] = polygonCentroid(polygon);
  for (let step = 0; step <= 20; step++) {
    const t = step / 20;
    const nx = x + (cx - x) * t;
    const nz = z + (cz - z) * t;
    if (pointInPolygon(nx, nz, polygon)) return [nx, nz];
  }
  return [cx, cz];
}

/** Nudge away from existing fixtures so suggested props do not stack on sinks/doors. */
export function nudgeAwayFromFixtures(
  x: number,
  z: number,
  fixtures: Fixture[],
  polygon: [number, number][],
): [number, number] {
  let px = x;
  let pz = z;
  const pad = 0.45;

  for (let iter = 0; iter < 12; iter++) {
    let moved = false;
    for (const f of fixtures) {
      const fx = f.position[0];
      const fz = f.position[2];
      const dx = px - fx;
      const dz = pz - fz;
      const dist = Math.hypot(dx, dz);
      const half = Math.hypot(f.size[0], f.size[2]) / 2 + pad;
      if (dist < 1e-6 || dist >= half) continue;
      moved = true;
      const push = ((half - dist) / dist) * 1.15;
      px += dx * push;
      pz += dz * push;
    }
    if (!moved) break;
  }

  return clampIntoFloor(px, pz, polygon);
}

export function summarizeLayoutForPrompt(layout: RoomLayout): string {
  const verts = layout.floor.polygon.map(([x, z]) => `[${x.toFixed(2)},${z.toFixed(2)}]`).join(", ");
  const fixtures = layout.fixtures
    .map(
      (f) =>
        `- ${f.id}: ${f.type}${f.label ? ` (${f.label})` : ""} center [${f.position.map((n) => n.toFixed(2)).join(",")}] size [${f.size.map((n) => n.toFixed(2)).join(",")}]`,
    )
    .join("\n");
  return `Floor polygon xz vertices (meters, ordered): ${verts}\n\nExisting fixtures:\n${fixtures || "(none)"}`;
}
