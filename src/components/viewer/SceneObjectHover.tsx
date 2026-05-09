"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Html } from "@react-three/drei";
import { useThree } from "@react-three/fiber";

/**
 * Shared hover callout: pinpoint sphere + HTML card + caret (matches suggested-prop UX).
 */
export function SceneHoverChrome({
  title,
  subtitle,
  accentColor,
  pinLocalY,
  htmlLift = 0.22,
  /** With transform=false (drei default), scale ∝ distanceFactor — larger = bigger on screen. */
  distanceFactor = 12,
  children,
}: {
  title: string;
  subtitle?: string;
  accentColor: string;
  pinLocalY: number;
  /** Vertical offset from pin to HTML anchor */
  htmlLift?: number;
  distanceFactor?: number;
  children: ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  const gl = useThree((s) => s.gl);

  useEffect(() => {
    gl.domElement.style.cursor = hovered ? "pointer" : "";
    return () => {
      gl.domElement.style.cursor = "";
    };
  }, [hovered, gl]);

  return (
    <group
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
      }}
    >
      {children}
      {hovered ? (
        <>
          <mesh position={[0, pinLocalY, 0]} castShadow={false}>
            <sphereGeometry args={[0.045, 14, 14]} />
            <meshStandardMaterial
              color={accentColor}
              emissive={accentColor}
              emissiveIntensity={0.42}
              roughness={0.35}
              metalness={0.15}
            />
          </mesh>
          <Html
            position={[0, pinLocalY + htmlLift, 0]}
            center
            distanceFactor={distanceFactor}
            zIndexRange={[80, 200]}
            style={{ pointerEvents: "none" }}
          >
            <div className="pointer-events-none flex flex-col items-center select-none">
              <div
                className="relative max-w-[min(340px,90vw)] rounded-xl border-2 bg-bg-elevated/95 px-4 py-3 shadow-xl backdrop-blur"
                style={{
                  borderColor: accentColor,
                  boxShadow:
                    "0 12px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.08)",
                }}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="mt-1 inline-block h-3 w-3 shrink-0 rounded-full ring-2 ring-white/20"
                    style={{ background: accentColor }}
                  />
                  <div className="min-w-0">
                    <div className="text-base font-semibold leading-snug text-fg sm:text-[17px]">
                      {title}
                    </div>
                    {subtitle ? (
                      <p className="mt-2 text-sm leading-relaxed text-fg-muted sm:text-[15px]">
                        {subtitle}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
              <div
                className="relative"
                style={{
                  marginTop: -2,
                  width: 0,
                  height: 0,
                  borderLeft: "11px solid transparent",
                  borderRight: "11px solid transparent",
                  borderTop: `13px solid ${accentColor}`,
                  filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.35))",
                }}
              />
              <div
                className="relative"
                style={{
                  marginTop: -14,
                  width: 0,
                  height: 0,
                  borderLeft: "9px solid transparent",
                  borderRight: "9px solid transparent",
                  borderTop: "11px solid rgba(25, 34, 42, 0.96)",
                }}
              />
            </div>
          </Html>
        </>
      ) : null}
    </group>
  );
}
