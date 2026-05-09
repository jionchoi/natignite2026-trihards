"use client";

import { useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/cn";
import { SOLID_A11Y_GLYPHS } from "@/components/decorative/solid-a11y-glyphs";

export type BackgroundIntensity = "landing" | "subtle";

interface Particle {
  x: number;
  y: number;
  size: number;
  opacity: number;
  depth: number;
}

interface FloatShape {
  x: number;
  y: number;
  rot: number;
  s: number;
  kind: "square" | "hex";
}

function det01(i: number, salt: number) {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function strokeHex(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

interface ParticleBackgroundProps {
  /** Landing = full effect; subtle = same language, lower density & opacity for inner routes */
  intensity?: BackgroundIntensity;
}

export function ParticleBackground({
  intensity = "subtle",
}: ParticleBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const shapesRef = useRef<FloatShape[]>([]);
  const animationRef = useRef<number>(0);
  const windRef = useRef(0);

  const landing = intensity === "landing";

  const geoMarkers = useMemo(() => {
    const n = landing ? 52 : 22;
    return Array.from({ length: n }, (_, i) => ({
      left: `${2 + det01(i, 1) * 94}%`,
      top: `${4 + det01(i, 2) * 82}%`,
      delay: `${-det01(i, 3) * 28}s`,
      duration: `${18 + det01(i, 4) * 18}s`,
      scale: 0.45 + det01(i, 5) * 1.2,
      variant: i % 3,
    }));
  }, [landing]);

  const a11yFloaters = useMemo(() => {
    const n = landing ? 28 : 12;
    return Array.from({ length: n }, (_, i) => ({
      Glyph: SOLID_A11Y_GLYPHS[i % SOLID_A11Y_GLYPHS.length]!,
      left: `${4 + det01(i, 11) * 90}%`,
      top: `${7 + det01(i, 12) * 80}%`,
      delay: `${-det01(i, 13) * 22}s`,
      duration: `${26 + det01(i, 14) * 22}s`,
      scale: 0.65 + det01(i, 15) * 0.75,
    }));
  }, [landing]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = () =>
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const wind =
      intensity === "landing"
        ? prefersReducedMotion()
          ? 0
          : 0.62
        : prefersReducedMotion()
          ? 0
          : 0.38;
    windRef.current = wind;

    const shapeCount = intensity === "landing" ? 34 : 14;

    const initShapes = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      shapesRef.current = Array.from({ length: shapeCount }, (_, idx) => ({
        x: Math.random() * w,
        y: Math.random() * h,
        rot: Math.random() * Math.PI * 2,
        s: 16 + Math.random() * 48,
        kind: idx % 2 === 0 ? "square" : "hex",
      }));
    };

    const particleCap =
      intensity === "landing"
        ? prefersReducedMotion()
          ? 40
          : 96
        : prefersReducedMotion()
          ? 28
          : 44;

    const initParticles = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const particleCount = Math.min(
        particleCap,
        Math.floor((w * h) / (intensity === "landing" ? 15500 : 28000)),
      );
      particlesRef.current = [];

      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push({
          x: Math.random() * w,
          y: Math.random() * h,
          size: Math.random() * 1.9 + 0.45,
          opacity:
            (Math.random() * 0.35 + 0.09) *
            (intensity === "landing" ? 1 : 0.72),
          depth: Math.random(),
        });
      }
    };

    const drawWireShapes = (t: number, reduced: boolean) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const wx = windRef.current;
      const shapes = shapesRef.current;
      const pulseBase = intensity === "landing" ? 0.14 : 0.09;
      const pulseAmp = intensity === "landing" ? 0.08 : 0.045;

      shapes.forEach((sh) => {
        const pulse =
          pulseBase +
          Math.sin(t * 0.0011 + sh.x * 0.007 + sh.y * 0.005) * pulseAmp;
        ctx.save();
        ctx.translate(sh.x, sh.y);
        ctx.rotate(sh.rot + t * 0.000025);

        ctx.strokeStyle = `rgba(252, 253, 255, ${pulse})`;
        ctx.lineWidth = intensity === "landing" ? 1.15 : 0.85;
        ctx.shadowColor = "rgba(230, 240, 255, 0.55)";
        ctx.shadowBlur = intensity === "landing" ? 8 : 5;

        if (sh.kind === "square") {
          ctx.beginPath();
          ctx.rect(-sh.s / 2, -sh.s / 2, sh.s, sh.s);
          ctx.stroke();
          ctx.rotate(Math.PI / 4);
          ctx.strokeStyle = `rgba(220, 232, 252, ${pulse * 0.88})`;
          ctx.lineWidth = intensity === "landing" ? 0.85 : 0.65;
          ctx.beginPath();
          ctx.rect(-sh.s * 0.38, -sh.s * 0.38, sh.s * 0.76, sh.s * 0.76);
          ctx.stroke();
        } else {
          strokeHex(ctx, 0, 0, sh.s * 0.5);
          ctx.stroke();
          ctx.strokeStyle = `rgba(225, 235, 252, ${pulse * 0.82})`;
          ctx.lineWidth = 0.68;
          strokeHex(ctx, 0, 0, sh.s * 0.26);
          ctx.stroke();
        }

        ctx.restore();
      });

      if (!reduced && wx !== 0) {
        const sway = Math.sin(t * 0.00035) * 0.22;
        shapes.forEach((sh) => {
          sh.x += wx;
          sh.y += sway;
          if (sh.x < -100) sh.x = w + 100;
          if (sh.x > w + 100) sh.x = -100;
          if (sh.y < -80) sh.y = h + 80;
          if (sh.y > h + 80) sh.y = -80;
        });
      }
    };

    const drawStatic = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);
      const particles = particlesRef.current;
      const t = 1.72;

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distanceSq = dx * dx + dy * dy;
          const linkMax = 140;
          if (distanceSq < linkMax * linkMax) {
            const distance = Math.sqrt(distanceSq);
            const depthMix = (particles[i].depth + particles[j].depth) * 0.35;
            const alpha =
              (intensity === "landing" ? 0.07 : 0.045) *
                (1 - distance / linkMax) +
              depthMix * 0.04;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(240, 245, 255, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      particles.forEach((particle) => {
        const tw =
          Math.sin(t + particle.x * 0.002 + particle.depth * 6) * 0.25;
        const th = Math.cos(t * 0.9 + particle.y * 0.002) * 0.25;
        ctx.beginPath();
        ctx.arc(
          particle.x + tw,
          particle.y + th,
          particle.size,
          0,
          Math.PI * 2,
        );
        ctx.fillStyle = `rgba(248, 250, 255, ${particle.opacity + tw * 0.04})`;
        ctx.fill();
      });

      drawWireShapes(performance.now(), true);
    };

    const drawParticles = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      const particles = particlesRef.current;
      const t = performance.now();
      const tf = t * 0.00006;
      const wx = windRef.current;
      const sway = Math.sin(t * 0.00035) * 0.24;

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distanceSq = dx * dx + dy * dy;
          const linkMax = 144;
          if (distanceSq < linkMax * linkMax) {
            const distance = Math.sqrt(distanceSq);
            const depthMix = (particles[i].depth + particles[j].depth) * 0.35;
            const alpha =
              (intensity === "landing" ? 0.09 : 0.055) *
                (1 - distance / linkMax) +
              depthMix * 0.05;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(244, 248, 255, ${alpha})`;
            ctx.lineWidth = 0.52;
            ctx.stroke();
          }
        }
      }

      particles.forEach((particle) => {
        const tw =
          Math.sin(tf + particle.x * 0.002 + particle.depth * 6) * 0.38;
        const th = Math.cos(tf * 0.9 + particle.y * 0.002) * 0.38;
        ctx.beginPath();
        ctx.arc(
          particle.x + tw,
          particle.y + th,
          particle.size,
          0,
          Math.PI * 2,
        );
        ctx.fillStyle = `rgba(252, 253, 255, ${particle.opacity + tw * 0.045})`;
        ctx.fill();
      });

      if (wx !== 0) {
        particles.forEach((particle) => {
          particle.x += wx;
          particle.y += sway * 0.08;
          if (particle.x < -12) particle.x = w + 12;
          if (particle.x > w + 12) particle.x = -12;
          if (particle.y < -12) particle.y = h + 12;
          if (particle.y > h + 12) particle.y = -12;
        });
      }

      drawWireShapes(t, false);

      animationRef.current = requestAnimationFrame(drawParticles);
    };

    const onResize = () => {
      resizeCanvas();
      initParticles();
      initShapes();
      if (prefersReducedMotion()) {
        cancelAnimationFrame(animationRef.current);
        drawStatic();
      }
    };

    resizeCanvas();
    initParticles();
    initShapes();

    if (prefersReducedMotion()) {
      drawStatic();
    } else {
      drawParticles();
    }

    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, [intensity]);

  return (
    <div
      className={cn(
        "particle-bg-root pointer-events-none fixed inset-0 z-0 overflow-hidden",
        landing ? "particle-bg-root--landing" : "particle-bg-root--subtle",
      )}
      aria-hidden
    >
      <div className="particle-bg-void absolute inset-0" />

      <div className="particle-bg-orbs absolute inset-0">
        <div className="particle-bg-orb particle-bg-orb-a" />
        <div className="particle-bg-orb particle-bg-orb-b" />
        <div className="particle-bg-orb particle-bg-orb-c" />
      </div>

      <div className="particle-bg-ambient absolute inset-0" />

      <div className="particle-bg-fisheye-root absolute inset-0 flex items-center justify-center">
        <div className="particle-bg-fisheye-sphere">
          <div className="particle-bg-depth particle-bg-depth--fisheye absolute inset-0">
            <div className="particle-bg-plane particle-bg-plane--a absolute inset-[-42%]" />
            <div className="particle-bg-plane particle-bg-plane--b absolute inset-[-48%]" />
          </div>
        </div>
      </div>

      <div className="particle-bg-sync-flow absolute inset-0">
        <div className="particle-bg-geometry absolute inset-0">
          {geoMarkers.map((p, i) => (
            <span
              key={i}
              className="particle-bg-geo-anchor"
              style={{ left: p.left, top: p.top }}
            >
              <span
                className="particle-bg-geo-scale"
                style={{ transform: `scale(${p.scale})` }}
              >
                {p.variant === 0 ? (
                  <span
                    className="particle-bg-geo-plus"
                    style={{
                      animationDelay: p.delay,
                      animationDuration: p.duration,
                    }}
                  >
                    +
                  </span>
                ) : p.variant === 1 ? (
                  <span
                    className="particle-bg-geo-rhomb"
                    style={{
                      animationDelay: p.delay,
                      animationDuration: p.duration,
                    }}
                  />
                ) : (
                  <span
                    className="particle-bg-geo-ring"
                    style={{
                      animationDelay: p.delay,
                      animationDuration: p.duration,
                    }}
                  />
                )}
              </span>
            </span>
          ))}
        </div>

        <div className="particle-bg-a11y-icons absolute inset-0 overflow-hidden">
          {a11yFloaters.map(({ Glyph, left, top, delay, duration, scale }, i) => (
            <span
              key={`a11y-${i}`}
              className="particle-bg-a11y-anchor"
              style={{ left, top }}
            >
              <span
                className="particle-bg-a11y-scale"
                style={{
                  transform: `scale(${scale})`,
                  animation: `a11y-glyph-drift ${duration} ease-in-out infinite alternate`,
                  animationDelay: delay,
                }}
              >
                <Glyph className="particle-bg-a11y-svg" />
              </span>
            </span>
          ))}
        </div>
      </div>

      <div className={cn("particle-bg-canvas-wrap absolute inset-0")}>
        <canvas
          ref={canvasRef}
          className={cn(
            "absolute inset-0 h-full w-full mix-blend-screen",
            landing ? "opacity-[0.74]" : "opacity-[0.42]",
          )}
        />
      </div>

      <div className="particle-bg-noise pointer-events-none absolute inset-0" />
      <div className="particle-bg-chroma-edge pointer-events-none absolute inset-0" />
      <div className="particle-bg-vignette pointer-events-none absolute inset-0" />
      <div className="particle-bg-scanlines-fine absolute inset-0" />
      <div
        className={cn(
          "particle-bg-scanlines absolute inset-0",
          landing ? "opacity-[0.36]" : "opacity-[0.22]",
        )}
      />
    </div>
  );
}
