"use client"

import { useEffect, useRef } from "react"

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
  depth: number
}

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animationRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const prefersReducedMotion = () =>
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.floor(window.innerWidth * dpr)
      canvas.height = Math.floor(window.innerHeight * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const initParticles = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      const particleCount = Math.min(
        prefersReducedMotion() ? 48 : 72,
        Math.floor((w * h) / 18000),
      )
      particlesRef.current = []

      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.42,
          vy: (Math.random() - 0.5) * 0.42,
          size: Math.random() * 1.6 + 0.65,
          opacity: Math.random() * 0.35 + 0.08,
          depth: Math.random(),
        })
      }
    }

    const drawStatic = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      ctx.clearRect(0, 0, w, h)
      const particles = particlesRef.current
      const t = 1.72

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const distanceSq = dx * dx + dy * dy
          const linkMax = 128
          const linkMaxSq = linkMax * linkMax

          if (distanceSq < linkMaxSq) {
            const distance = Math.sqrt(distanceSq)
            const depthMix = (particles[i].depth + particles[j].depth) * 0.35
            const alpha = 0.05 * (1 - distance / linkMax) + depthMix * 0.035
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(236, 238, 244, ${alpha})`
            ctx.lineWidth = 0.45
            ctx.stroke()
          }
        }
      }

      particles.forEach((particle) => {
        const tw = Math.sin(t + particle.x * 0.002 + particle.depth * 6) * 0.25
        const th = Math.cos(t * 0.9 + particle.y * 0.002) * 0.25
        ctx.beginPath()
        ctx.arc(particle.x + tw, particle.y + th, particle.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(243, 244, 250, ${particle.opacity + tw * 0.035})`
        ctx.fill()
      })
    }

    const drawParticles = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      ctx.clearRect(0, 0, w, h)

      const particles = particlesRef.current
      const t = performance.now() * 0.00006

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const distanceSq = dx * dx + dy * dy
          const linkMax = 128
          const linkMaxSq = linkMax * linkMax

          if (distanceSq < linkMaxSq) {
            const distance = Math.sqrt(distanceSq)
            const depthMix = (particles[i].depth + particles[j].depth) * 0.35
            const alpha = 0.06 * (1 - distance / linkMax) + depthMix * 0.04
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(240, 242, 248, ${alpha})`
            ctx.lineWidth = 0.45
            ctx.stroke()
          }
        }
      }

      particles.forEach((particle) => {
        const tw = Math.sin(t + particle.x * 0.002 + particle.depth * 6) * 0.35
        const th = Math.cos(t * 0.9 + particle.y * 0.002) * 0.35
        ctx.beginPath()
        ctx.arc(particle.x + tw, particle.y + th, particle.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(245, 246, 250, ${particle.opacity + tw * 0.04})`
        ctx.fill()
      })

      particles.forEach((particle) => {
        particle.x += particle.vx
        particle.y += particle.vy

        if (particle.x < -8) particle.x = w + 8
        if (particle.x > w + 8) particle.x = -8
        if (particle.y < -8) particle.y = h + 8
        if (particle.y > h + 8) particle.y = -8
      })

      animationRef.current = requestAnimationFrame(drawParticles)
    }

    const onResize = () => {
      resizeCanvas()
      initParticles()
      if (prefersReducedMotion()) {
        cancelAnimationFrame(animationRef.current)
        drawStatic()
      }
    }

    resizeCanvas()
    initParticles()

    if (prefersReducedMotion()) {
      drawStatic()
    } else {
      drawParticles()
    }

    window.addEventListener("resize", onResize)

    return () => {
      cancelAnimationFrame(animationRef.current)
      window.removeEventListener("resize", onResize)
    }
  }, [])

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-0 bg-background" />
      <div className="absolute inset-0 particle-bg-ambient" />
      <div className="absolute inset-0 particle-bg-depth">
        <div className="absolute inset-[-40%] particle-bg-plane opacity-[0.38]" />
        <div className="absolute inset-[-45%] particle-bg-plane-2 opacity-[0.28]" />
      </div>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full mix-blend-screen opacity-[0.5]"
      />
      <div className="absolute inset-0 particle-bg-noise pointer-events-none" />
      <div className="absolute inset-0 particle-bg-chroma-edge pointer-events-none" />
      <div className="absolute inset-0 particle-bg-vignette pointer-events-none" />
      <div className="absolute inset-0 particle-bg-scanlines opacity-[0.35]" />
    </div>
  )
}
