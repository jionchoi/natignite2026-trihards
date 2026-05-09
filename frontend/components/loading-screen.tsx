"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Environment } from "@react-three/drei"
import * as THREE from "three"
import { Room } from "./floating-room"

const PHOTOGRAPHERS = [
  {
    id: 0,
    pos: [-0.5, -0.58, 0.5] as [number, number, number],
    rotY: Math.atan2(0.9, -1.66),
    camLeft:  new THREE.Vector3(-0.569, 0.46, 1.088),
    camRight: new THREE.Vector3(-0.955, 0.46, 0.878),
    lookAt:   new THREE.Vector3(0.32, 0.05, -1.0),
  },
  {
    id: 1,
    pos: [0.5, -0.58, 0.0] as [number, number, number],
    rotY: Math.atan2(-1.66, -0.4),
    camLeft:  new THREE.Vector3(1.086, 0.46, -0.089),
    camRight: new THREE.Vector3(0.986, 0.46, 0.339),
    lookAt:   new THREE.Vector3(-1.0, 0.20, -0.32),
  },
]

const LOOPS = 3
const WIDE_POS   = new THREE.Vector3(4, 2, 4)   // matches FloatingRoom camera
const WIDE_LOOK  = new THREE.Vector3(0, 0, 0)
const FOV_START  = 52
const FOV_END    = 35                            // matches FloatingRoom fov

// ------------- 3D figure -------------
function Photographer({ cfg, flash }: { cfg: (typeof PHOTOGRAPHERS)[number]; flash: boolean }) {
  const dark    = "#0e0e0e"
  const darkAlt = "#141414"

  return (
    <group position={cfg.pos} rotation={[0, cfg.rotY, 0]} scale={0.5}>
      <pointLight position={[0, 1.63, 0.60]} intensity={flash ? 80 : 0} color="#fff8e0" distance={12} decay={1.2} />

      <mesh position={[0, 1.05, 0]}>
        <capsuleGeometry args={[0.22, 0.72, 10, 24]} />
        <meshStandardMaterial color={dark} roughness={0.72} metalness={0.08} />
      </mesh>

      <mesh position={[0, 1.50, 0]}>
        <cylinderGeometry args={[0.072, 0.090, 0.18, 20]} />
        <meshStandardMaterial color={darkAlt} roughness={0.80} />
      </mesh>

      <mesh position={[0, 1.695, -0.02]}>
        <sphereGeometry args={[0.205, 36, 36]} />
        <meshStandardMaterial color={darkAlt} roughness={0.78} />
      </mesh>
      <mesh position={[0, 1.815, -0.06]}>
        <sphereGeometry args={[0.210, 32, 20]} />
        <meshStandardMaterial color="#080808" roughness={1} />
      </mesh>

      <mesh position={[-0.28, 1.44, 0.28]} rotation={[1.10, 0, -0.08]}>
        <capsuleGeometry args={[0.055, 0.60, 8, 14]} />
        <meshStandardMaterial color={dark} roughness={0.72} metalness={0.08} />
      </mesh>
      <mesh position={[0.28, 1.44, 0.28]} rotation={[1.10, 0, 0.08]}>
        <capsuleGeometry args={[0.055, 0.60, 8, 14]} />
        <meshStandardMaterial color={dark} roughness={0.72} metalness={0.08} />
      </mesh>

      <mesh position={[0, 1.64, 0.46]}>
        <boxGeometry args={[0.31, 0.21, 0.10]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.20} metalness={0.70} />
      </mesh>
      <mesh position={[0.13, 1.64, 0.46]}>
        <boxGeometry args={[0.07, 0.23, 0.11]} />
        <meshStandardMaterial color="#0d0d0d" roughness={0.25} metalness={0.60} />
      </mesh>
      <mesh position={[0, 1.64, 0.52]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.057, 0.073, 0.09, 20]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.16} metalness={0.85} />
      </mesh>
      <mesh position={[0, 1.64, 0.566]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.039, 0.039, 0.006, 20]} />
        <meshStandardMaterial color="#1a3a88" roughness={0} metalness={1} transparent opacity={0.90} />
      </mesh>
      <mesh position={[0.09, 1.76, 0.46]}>
        <boxGeometry args={[0.08, 0.044, 0.022]} />
        <meshStandardMaterial
          color={flash ? "#ffffff" : "#999999"}
          emissive={flash ? "#ffffff" : "#111111"}
          emissiveIntensity={flash ? 6 : 0.05}
        />
      </mesh>
    </group>
  )
}

// ------------- Camera animator -------------
function SceneCamera({
  rawRef,
  isDoneRef,
  onZoomComplete,
}: {
  rawRef: React.RefObject<number>
  isDoneRef: React.RefObject<boolean>
  onZoomComplete: () => void
}) {
  const { camera } = useThree()
  // Per-visit random shoulder state
  const visitIdxRef   = useRef(-1)
  const useLeftRef    = useRef(false)
  // Zoom-out state
  const zoomTRef      = useRef(0)
  const zoomStartPos  = useRef(new THREE.Vector3())
  const zoomStartLook = useRef(new THREE.Vector3())
  const zoomCalledRef = useRef(false)
  const lookTarget    = useRef(new THREE.Vector3())

  useFrame((_, delta) => {
    if (isDoneRef.current) {
      // First frame of zoom-out — record where we are
      if (zoomTRef.current === 0) {
        zoomStartPos.current.copy(camera.position)
        zoomStartLook.current.copy(lookTarget.current)
      }
      zoomTRef.current = Math.min(zoomTRef.current + delta / 1.6, 1)
      const t = zoomTRef.current
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
      camera.position.lerpVectors(zoomStartPos.current, WIDE_POS, e)
      lookTarget.current.lerpVectors(zoomStartLook.current, WIDE_LOOK, e)
      camera.lookAt(lookTarget.current)
      ;(camera as THREE.PerspectiveCamera).fov = THREE.MathUtils.lerp(FOV_START, FOV_END, e)
      ;(camera as THREE.PerspectiveCamera).updateProjectionMatrix()
      if (zoomTRef.current >= 1 && !zoomCalledRef.current) {
        zoomCalledRef.current = true
        onZoomComplete()
      }
      return
    }

    // Loop — pick a random shoulder each time we arrive at a new person
    const totalT  = rawRef.current * LOOPS
    const loopT   = totalT % 1
    const loopIdx = Math.floor(Math.min(totalT, LOOPS - 0.001))
    const personIdx = loopT < 0.5 ? 0 : 1
    const visitIdx  = loopIdx * 2 + personIdx

    if (visitIdx !== visitIdxRef.current) {
      visitIdxRef.current = visitIdx
      useLeftRef.current  = Math.random() < 0.5
    }

    const p = PHOTOGRAPHERS[personIdx]
    const target = useLeftRef.current ? p.camLeft : p.camRight
    camera.position.lerp(target, 0.06)
    lookTarget.current.lerp(p.lookAt, 0.06)
    camera.lookAt(lookTarget.current)
  })

  return null
}

// ------------- LoadingScreen -------------
export function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [progress,      setProgress]      = useState(0)
  const [activeId,      setActiveId]      = useState<number | null>(null)
  const [overlayFading, setOverlayFading] = useState(false) // dark bg + UI fade first
  const [canvasFading,  setCanvasFading]  = useState(false) // 3D canvas fades second

  const rawRef    = useRef(0)
  const isDoneRef = useRef(false)

  // Two-stage fade: overlay out (500ms), then canvas out (800ms), then unmount
  const handleZoomComplete = useCallback(() => {
    setOverlayFading(true)
    setTimeout(() => {
      setCanvasFading(true)
      setTimeout(onComplete, 800)
    }, 500)
  }, [onComplete])

  // Progress animation
  useEffect(() => {
    const DURATION = 6000
    const start = performance.now()
    let raf: number

    const tick = (now: number) => {
      const raw = Math.min((now - start) / DURATION, 1)
      rawRef.current = raw
      const eased = raw < 0.5
        ? 2 * raw * raw
        : 1 - Math.pow(-2 * raw + 2, 2) / 2
      setProgress(Math.round(eased * 100))

      if (raw < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        isDoneRef.current = true   // triggers zoom-out in SceneCamera
      }
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  // Flash — fires on whichever person the camera is currently near
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>

    const flash = () => {
      if (isDoneRef.current) return
      const loopT = (rawRef.current * LOOPS) % 1
      const id = loopT < 0.5 ? 0 : 1
      setActiveId(id)
setTimeout(() => setActiveId(null), 400)
      timer = setTimeout(flash, 700 + Math.random() * 900)
    }

    timer = setTimeout(flash, 1200)
    return () => clearTimeout(timer)
  }, [])

  const initialPos = PHOTOGRAPHERS[0].camLeft.toArray() as [number, number, number]

  const overlayStyle = {
    opacity: overlayFading ? 0 : 1,
    transition: "opacity 0.5s ease-in-out",
  }

  return (
    <div
      className="fixed inset-0 z-50"
      style={{ pointerEvents: overlayFading ? "none" : "all" }}
    >
      {/* Stage 1: dark bg + vignette — fade out first */}
      <div className="absolute inset-0 bg-background pointer-events-none" style={overlayStyle} />
      <div className="absolute inset-0 pointer-events-none" style={{
        ...overlayStyle,
        background: "radial-gradient(ellipse at center, transparent 22%, rgba(0,0,0,0.82) 100%)",
      }} />

      {/* Stage 2: 3D canvas — fade out second, revealing FloatingRoom beneath */}
      <div className="absolute inset-0" style={{
        opacity: canvasFading ? 0 : 1,
        transition: "opacity 0.8s ease-in-out",
      }}>
        <Canvas
          camera={{ position: initialPos, fov: 52 }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: "transparent" }}
        >
          <ambientLight intensity={0.40} />
          <directionalLight position={[5, 5, 5]} intensity={0.80} castShadow />
          <directionalLight position={[-3, 3, -3]} intensity={0.28} color="#1D9E75" />
          <pointLight position={[0, 2, 0]} intensity={0.38} />
          <Room />
          {PHOTOGRAPHERS.map((cfg) => (
            <Photographer key={cfg.id} cfg={cfg} flash={activeId === cfg.id} />
          ))}
          <SceneCamera rawRef={rawRef} isDoneRef={isDoneRef} onZoomComplete={handleZoomComplete} />
          <Environment preset="city" />
        </Canvas>
      </div>

      <div className="absolute inset-y-0 right-5 flex flex-col items-center justify-center pointer-events-none" style={{ ...overlayStyle, gap: "14px" }}>
        <span className="font-mono tabular-nums" style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em" }}>
          {String(progress).padStart(3, "0")}
        </span>
        <div style={{ width: "1px", height: "180px", background: "rgba(255,255,255,0.1)", borderRadius: "999px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: `${progress}%`, background: "oklch(0.62 0.15 160)", borderRadius: "999px", transition: "height 0.05s linear" }} />
        </div>
        <span style={{ fontSize: "8px", color: "rgba(255,255,255,0.18)", fontFamily: "monospace", letterSpacing: "0.2em", writingMode: "vertical-rl", textTransform: "uppercase" }}>
          Loading
        </span>
      </div>

      <div className="absolute bottom-5 left-5 pointer-events-none" style={overlayStyle}>
        <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.18)", fontFamily: "monospace", letterSpacing: "0.25em", textTransform: "uppercase" }}>
          Accessify
        </span>
      </div>
    </div>
  )
}
