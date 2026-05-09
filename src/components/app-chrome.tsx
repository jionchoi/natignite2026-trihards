"use client";

import { usePathname } from "next/navigation";
import { ParticleBackground } from "@/components/particle-background";

/**
 * Single global backdrop: strongest on `/`, toned-down elsewhere while keeping the same system.
 */
export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  return (
    <>
      <ParticleBackground intensity={isLanding ? "landing" : "subtle"} />
      {children}
    </>
  );
}
