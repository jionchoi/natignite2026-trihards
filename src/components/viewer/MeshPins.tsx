"use client";

import { Html, Line, Billboard } from "@react-three/drei";
import * as THREE from "three";
import { type Issue } from "@/lib/schemas";
import { type Severity, SEVERITY_LABEL } from "@/lib/severity";
import { CATEGORY_LABEL } from "@/lib/categories";
import { cn } from "@/lib/cn";
import { useMeshGeometry } from "./useMeshGeometry";

interface MeshPinsProps {
  imageUrl: string;
  depthUrl: string;
  displacement: number;
  issues: Issue[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

const SEVERITY_HEX: Record<Severity, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
  info: "#3b82f6",
};

const SEVERITY_BG: Record<Severity, string> = {
  critical: "bg-severity-critical",
  high: "bg-severity-high",
  medium: "bg-severity-medium",
  low: "bg-severity-low",
  info: "bg-severity-info",
};

const SEVERITY_BORDER: Record<Severity, string> = {
  critical: "border-severity-critical/50",
  high: "border-severity-high/50",
  medium: "border-severity-medium/50",
  low: "border-severity-low/50",
  info: "border-severity-info/50",
};

export function MeshPins({
  imageUrl,
  depthUrl,
  displacement,
  issues,
  selectedId,
  onSelect,
}: MeshPinsProps) {
  const { width, height, sampleDepth } = useMeshGeometry(imageUrl, depthUrl);
  if (!sampleDepth) return null;

  const pinned = issues.filter((i) => i.locationHint);

  return (
    <group>
      {pinned.map((issue) => {
        const loc = issue.locationHint!;
        const u = Math.max(0, Math.min(1, loc.x));
        const vImage = Math.max(0, Math.min(1, loc.y));
        // UV.v=1 is the top of the image (flipY=true) and image y=0 is top.
        const v = 1 - vImage;

        const x3d = -width / 2 + u * width;
        const y3d = -height / 2 + v * height;
        const d = sampleDepth(u, v);
        // Match GPU displacement (z = scale*sample + bias, bias = -displacement)
        // and offset slightly toward camera so the dot sits on top of the
        // displaced surface rather than embedded in it.
        const zSurface = displacement * d - displacement;
        const z3d = zSurface + 0.015;

        const isSelected = selectedId === issue.id;
        const color = SEVERITY_HEX[issue.severity];

        // Bubble offset in 3D — push toward image center horizontally so the
        // info card stays inside the canvas no matter where the pin lives.
        const horizontalOffset = u < 0.5 ? 0.22 : -0.22;
        const verticalOffset = v < 0.5 ? 0.22 : -0.22;
        const bubblePos: [number, number, number] = [
          x3d + horizontalOffset,
          y3d + verticalOffset,
          z3d + 0.08,
        ];

        const radius = isSelected ? 0.026 : 0.018;

        return (
          <group key={issue.id}>
            {/* Pin dot — real 3D sphere so it's occluded by the cube walls
                and obeys depth, "stuck" onto the photo's displaced surface. */}
            <mesh
              position={[x3d, y3d, z3d]}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(isSelected ? null : issue.id);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                document.body.style.cursor = "";
              }}
            >
              <sphereGeometry args={[radius, 20, 20]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={isSelected ? 0.9 : 0.55}
                roughness={0.4}
                metalness={0.0}
                toneMapped={false}
              />
            </mesh>

            {/* Halo ring (always faces camera) for the selected pin. */}
            {isSelected ? (
              <Billboard position={[x3d, y3d, z3d]}>
                <mesh>
                  <ringGeometry
                    args={[radius * 1.6, radius * 2.2, 48]}
                  />
                  <meshBasicMaterial
                    color={color}
                    side={THREE.DoubleSide}
                    transparent
                    opacity={0.5}
                    toneMapped={false}
                  />
                </mesh>
              </Billboard>
            ) : null}

            {isSelected ? (
              <>
                {/* Connector line from the bubble's 3D anchor down to the
                    pin dot — gives the floating bubble a clear pointer. */}
                <Line
                  points={[
                    [x3d, y3d, z3d],
                    bubblePos,
                  ]}
                  color={color}
                  lineWidth={1.6}
                  toneMapped={false}
                />

                {/* Mini info bubble — anchored at the offset point so the
                    line ends at one of its corners. */}
                <Html
                  position={bubblePos}
                  zIndexRange={[100, 0]}
                  style={{ pointerEvents: "none" }}
                >
                  <div
                    onPointerDown={(e) => e.stopPropagation()}
                    onWheel={(e) => e.stopPropagation()}
                    style={{
                      // Anchor the bubble corner closest to the pin to the
                      // line endpoint, so the connector visually meets it.
                      transform:
                        horizontalOffset > 0
                          ? verticalOffset > 0
                            ? "translate(8px, -100%) translateY(-8px)"
                            : "translate(8px, 8px)"
                          : verticalOffset > 0
                            ? "translate(-100%, -100%) translate(-8px, -8px)"
                            : "translate(-100%, 8px) translateX(-8px)",
                    }}
                    className={cn(
                      "pointer-events-auto w-72 rounded-lg border bg-bg-elevated/95 p-3 text-left shadow-2xl backdrop-blur",
                      SEVERITY_BORDER[issue.severity],
                    )}
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <span
                        className={cn(
                          "h-2 w-2 shrink-0 rounded-full",
                          SEVERITY_BG[issue.severity],
                        )}
                      />
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-fg">
                        {SEVERITY_LABEL[issue.severity]}
                      </span>
                      <span className="text-[10px] text-fg-subtle">
                        {CATEGORY_LABEL[issue.category]}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(null);
                        }}
                        aria-label="Close"
                        className="ml-auto text-fg-subtle hover:text-fg"
                      >
                        ×
                      </button>
                    </div>
                    <h4 className="text-sm font-medium leading-snug text-fg">
                      {issue.title}
                    </h4>
                    <p className="mt-1.5 line-clamp-3 text-xs text-fg-muted">
                      {issue.description}
                    </p>
                    {issue.recommendation ? (
                      <p className="mt-2 line-clamp-3 text-xs text-fg">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-fg-subtle">
                          Fix:
                        </span>{" "}
                        {issue.recommendation}
                      </p>
                    ) : null}
                    <p className="mt-2 text-[10px] text-fg-subtle">
                      See the labeled photo below for full details.
                    </p>
                  </div>
                </Html>
              </>
            ) : null}
          </group>
        );
      })}
    </group>
  );
}
