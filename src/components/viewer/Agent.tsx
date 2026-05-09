"use client";

import { type Persona, PERSONA_COLOR } from "@/lib/personas";

interface AgentProps {
  persona: Persona;
}

const SKIN = "#f3d6b5";

export function Agent({ persona }: AgentProps) {
  const accent = PERSONA_COLOR[persona];

  if (persona === "wheelchair") {
    return (
      <group>
        {/* seat */}
        <mesh position={[0, 0.32, 0]} castShadow>
          <boxGeometry args={[0.42, 0.12, 0.4]} />
          <meshStandardMaterial color={accent} roughness={0.6} />
        </mesh>
        {/* backrest */}
        <mesh position={[0, 0.55, -0.16]} castShadow>
          <boxGeometry args={[0.42, 0.42, 0.06]} />
          <meshStandardMaterial color={accent} roughness={0.6} />
        </mesh>
        {/* wheels */}
        <mesh position={[0.24, 0.22, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.22, 0.22, 0.04, 18]} />
          <meshStandardMaterial color="#1a1d22" roughness={0.5} />
        </mesh>
        <mesh position={[-0.24, 0.22, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.22, 0.22, 0.04, 18]} />
          <meshStandardMaterial color="#1a1d22" roughness={0.5} />
        </mesh>
        {/* body */}
        <mesh position={[0, 0.78, -0.05]} castShadow>
          <capsuleGeometry args={[0.13, 0.22, 6, 12]} />
          <meshStandardMaterial color="#3c4350" roughness={0.7} />
        </mesh>
        {/* head */}
        <mesh position={[0, 1.08, -0.05]} castShadow>
          <sphereGeometry args={[0.12, 18, 18]} />
          <meshStandardMaterial color={SKIN} roughness={0.6} />
        </mesh>
      </group>
    );
  }

  if (persona === "blind") {
    return (
      <group>
        {/* body */}
        <mesh position={[0, 0.55, 0]} castShadow>
          <capsuleGeometry args={[0.14, 0.7, 6, 12]} />
          <meshStandardMaterial color={accent} roughness={0.7} />
        </mesh>
        {/* head */}
        <mesh position={[0, 1.12, 0]} castShadow>
          <sphereGeometry args={[0.13, 18, 18]} />
          <meshStandardMaterial color={SKIN} roughness={0.6} />
        </mesh>
        {/* glasses bar */}
        <mesh position={[0, 1.13, 0.1]}>
          <boxGeometry args={[0.18, 0.04, 0.01]} />
          <meshStandardMaterial color="#1a1d22" />
        </mesh>
        {/* white cane (forward + down at ~30°) */}
        <group position={[0.12, 0.78, 0.05]}>
          <mesh
            position={[0.0, -0.32, 0.42]}
            rotation={[Math.PI * 0.32, 0, 0]}
            castShadow
          >
            <cylinderGeometry args={[0.011, 0.011, 1.05, 8]} />
            <meshStandardMaterial color="#fafafa" roughness={0.4} />
          </mesh>
          {/* red tip */}
          <mesh position={[0.0, -0.7, 0.78]} rotation={[Math.PI * 0.32, 0, 0]}>
            <cylinderGeometry args={[0.018, 0.018, 0.12, 8]} />
            <meshStandardMaterial color="#e54848" roughness={0.4} />
          </mesh>
        </group>
      </group>
    );
  }

  // ambulatory
  return (
    <group>
      <mesh position={[0, 0.55, 0]} castShadow>
        <capsuleGeometry args={[0.14, 0.7, 6, 12]} />
        <meshStandardMaterial color={accent} roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.12, 0]} castShadow>
        <sphereGeometry args={[0.13, 18, 18]} />
        <meshStandardMaterial color={SKIN} roughness={0.6} />
      </mesh>
    </group>
  );
}
