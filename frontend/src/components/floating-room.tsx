"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Environment, Float, RoundedBox, MeshTransmissionMaterial, OrbitControls } from "@react-three/drei"
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib"
import * as THREE from "three"

// Initial camera spherical coordinates
const INITIAL_AZIMUTH = Math.atan2(4, 4) // azimuthal angle from camera position [4, 2, 4]
const INITIAL_POLAR = Math.acos(2 / Math.sqrt(4*4 + 2*2 + 4*4)) // polar angle
const INITIAL_DISTANCE = Math.sqrt(4*4 + 2*2 + 4*4)

export function Room() {
  const wallColor = "#1c2228"
  const floorColor = "#12161a"
  const accentColor = "#d5d9e1"
  const frameColor = "#363d47"

  return (
    <group scale={0.8}>
        {/* Floor */}
        <RoundedBox args={[3, 0.1, 3]} radius={0.02} position={[0, -0.8, 0]}>
          <meshStandardMaterial color={floorColor} roughness={0.3} metalness={0.1} />
        </RoundedBox>

        {/* Back Wall */}
        <RoundedBox args={[3, 2, 0.1]} radius={0.02} position={[0, 0.2, -1.45]}>
          <meshStandardMaterial color={wallColor} roughness={0.5} />
        </RoundedBox>

        {/* Left Wall */}
        <RoundedBox args={[0.1, 2, 3]} radius={0.02} position={[-1.45, 0.2, 0]}>
          <meshStandardMaterial color={wallColor} roughness={0.5} />
        </RoundedBox>

        {/* Door Frame on Back Wall */}
        <group position={[0.5, 0.1, -1.38]}>
          {/* Door opening - wider accessible door */}
          <RoundedBox args={[0.9, 1.6, 0.08]} radius={0.01}>
            <meshStandardMaterial color="#0d1518" roughness={0.8} />
          </RoundedBox>
          {/* Door frame */}
          <RoundedBox args={[1.0, 1.7, 0.06]} radius={0.02} position={[0, 0, -0.02]}>
            <meshStandardMaterial color={frameColor} roughness={0.4} />
          </RoundedBox>
          {/* Accessibility symbol on door */}
          <mesh position={[0, 0.3, 0.05]}>
            <circleGeometry args={[0.15, 32]} />
            <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.08} />
          </mesh>
        </group>

        {/* Window on Left Wall */}
        <group position={[-1.38, 0.3, -0.5]} rotation={[0, Math.PI / 2, 0]}>
          <RoundedBox args={[0.8, 0.8, 0.08]} radius={0.02}>
            <MeshTransmissionMaterial
              backside
              samples={4}
              thickness={0.2}
              chromaticAberration={0.02}
              transmission={0.95}
              roughness={0.1}
              color="#a8d5e8"
            />
          </RoundedBox>
          {/* Window frame */}
          <RoundedBox args={[0.9, 0.9, 0.04]} radius={0.02} position={[0, 0, -0.03]}>
            <meshStandardMaterial color={frameColor} roughness={0.4} />
          </RoundedBox>
        </group>

        {/* Ramp indicator on floor */}
        <mesh position={[-0.5, -0.74, 0.8]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.8, 0.5]} />
          <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.06} />
        </mesh>

        {/* Grab bar on left wall */}
        <group position={[-1.38, -0.2, 0.5]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.03, 0.6, 8, 16]} />
            <meshStandardMaterial color="#8a9da6" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>

        {/* Counter with lowered section */}
        <group position={[0.8, -0.3, 0.5]}>
          {/* Main counter */}
          <RoundedBox args={[0.8, 0.08, 0.5]} radius={0.01} position={[0, 0.2, 0]}>
            <meshStandardMaterial color={frameColor} roughness={0.3} />
          </RoundedBox>
          {/* Lowered accessible section */}
          <RoundedBox args={[0.4, 0.08, 0.5]} radius={0.01} position={[-0.6, 0, 0]}>
            <meshStandardMaterial color={accentColor} roughness={0.3} />
          </RoundedBox>
          {/* Counter base */}
          <RoundedBox args={[0.8, 0.5, 0.45]} radius={0.02} position={[0, -0.15, 0]}>
            <meshStandardMaterial color={wallColor} roughness={0.5} />
          </RoundedBox>
        </group>

        {/* Signage */}
        <group position={[-1.38, 0.8, 0.3]} rotation={[0, Math.PI / 2, 0]}>
          <RoundedBox args={[0.3, 0.2, 0.02]} radius={0.01}>
            <meshStandardMaterial color="#1a2328" roughness={0.3} />
          </RoundedBox>
          <mesh position={[0, 0, 0.015]}>
            <circleGeometry args={[0.06, 32]} />
            <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.12} />
          </mesh>
        </group>
      </group>
  )
}

function CameraAnimator({ 
  controlsRef, 
  shouldReset 
}: { 
  controlsRef: React.RefObject<OrbitControlsImpl | null>
  shouldReset: boolean 
}) {
  const spherical = useRef(new THREE.Spherical())
  const targetSpherical = useRef(new THREE.Spherical(INITIAL_DISTANCE, INITIAL_POLAR, INITIAL_AZIMUTH))
  
  useFrame(() => {
    if (!controlsRef.current || !shouldReset) return
    
    const controls = controlsRef.current
    
    // Get current spherical coordinates
    spherical.current.setFromVector3(
      controls.object.position.clone().sub(controls.target)
    )
    
    // Lerp towards target
    spherical.current.radius = THREE.MathUtils.lerp(spherical.current.radius, targetSpherical.current.radius, 0.05)
    spherical.current.phi = THREE.MathUtils.lerp(spherical.current.phi, targetSpherical.current.phi, 0.05)
    spherical.current.theta = THREE.MathUtils.lerp(spherical.current.theta, targetSpherical.current.theta, 0.05)
    
    // Apply to camera
    const newPos = new THREE.Vector3().setFromSpherical(spherical.current).add(controls.target)
    controls.object.position.copy(newPos)
    controls.update()
  })
  
  return null
}

export function FloatingRoom() {
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isInteracting, setIsInteracting] = useState(false)
  const [shouldReset, setShouldReset] = useState(false)

  const handleInteractionStart = useCallback(() => {
    setIsInteracting(true)
    setShouldReset(false)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }, [])

  const handleInteractionEnd = useCallback(() => {
    // Start smooth reset after 0.5 seconds of inactivity
    timeoutRef.current = setTimeout(() => {
      setShouldReset(true)
      // Resume auto-rotate after a short delay for the animation
      setTimeout(() => {
        setIsInteracting(false)
        setShouldReset(false)
      }, 800)
    }, 500)
  }, [])

  return (
    <div className="w-full h-48 sm:h-64 md:h-72 relative">
      {/* Glow effect behind the room */}
      <div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 58% 48% at 50% 50%, rgba(255, 255, 255, 0.065) 0%, transparent 72%)",
        }}
      />
      <Canvas
        camera={{ position: [4, 2, 4], fov: 35 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
        <directionalLight position={[-3, 3, -3]} intensity={0.22} color="#c5cad4" />
        <pointLight position={[0, 2, 0]} intensity={0.5} color="#ffffff" />
        
        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
          <Room />
        </Float>
        
        <CameraAnimator controlsRef={controlsRef} shouldReset={shouldReset} />
        
        <OrbitControls
          ref={controlsRef}
          enableZoom={false}
          enablePan={false}
          autoRotate={!isInteracting}
          autoRotateSpeed={1.5}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2.2}
          onStart={handleInteractionStart}
          onEnd={handleInteractionEnd}
        />
        
        <Environment preset="city" />
      </Canvas>
      
    </div>
  )
}
