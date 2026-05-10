"use client";

import { usePathname } from "next/navigation";
import { ParticleBackground } from "@/components/particle-background";

/**
 * Single global backdrop: full halftone density on the landing and the upload
 * input flow so they feel like a single experience; toned-down on inner views
 * (analyze, etc.) where dense decoration would compete with content.
 */
export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const heroRoute = pathname === "/" || pathname === "/start";

  return (
    <>
      <ParticleBackground intensity={heroRoute ? "landing" : "subtle"} />
      {children}
    </>
  );
}
