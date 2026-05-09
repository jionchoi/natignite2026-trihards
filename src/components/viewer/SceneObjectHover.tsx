"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useThree } from "@react-three/fiber";

export interface HoverInfo {
  title: string;
  subtitle?: string;
  accentColor: string;
}

/**
 * Shared hover handle: a small accent pin sphere on the object plus a
 * callback that bubbles the hover info up so the viewport can render a
 * single, persistent banner in the corner instead of a floating callout.
 */
export function SceneHoverChrome({
  title,
  subtitle,
  accentColor,
  pinLocalY,
  /** When true, suppress hover entirely (e.g. during a drag). */
  disabled = false,
  /** Bubble hover info up to the viewport. Pass null on leave. */
  onHoverChange,
  children,
}: {
  title: string;
  subtitle?: string;
  accentColor: string;
  pinLocalY: number;
  disabled?: boolean;
  onHoverChange?: (info: HoverInfo | null) => void;
  children: ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  const gl = useThree((s) => s.gl);
  const isActive = hovered && !disabled;
  // Track whether *we* are the one currently reporting to the parent so we
  // only clear the parent's state when leaving — avoids a fast cursor swap
  // between two fixtures racing to null out the new fixture's info.
  const reportedRef = useRef(false);

  useEffect(() => {
    gl.domElement.style.cursor = isActive ? "pointer" : "";
    return () => {
      gl.domElement.style.cursor = "";
    };
  }, [isActive, gl]);

  useEffect(() => {
    if (!onHoverChange) return;
    if (isActive) {
      onHoverChange({ title, subtitle, accentColor });
      reportedRef.current = true;
    } else if (reportedRef.current) {
      onHoverChange(null);
      reportedRef.current = false;
    }
  }, [isActive, title, subtitle, accentColor, onHoverChange]);

  // Keep the parent's hover state in sync if this chrome unmounts mid-hover.
  useEffect(() => {
    return () => {
      if (reportedRef.current) onHoverChange?.(null);
    };
  }, [onHoverChange]);

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
      {isActive ? (
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
      ) : null}
    </group>
  );
}
