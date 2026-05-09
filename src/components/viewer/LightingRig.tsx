"use client";

export function LightingRig() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 4, 5]} intensity={1.6} color="#ffffff" />
      <directionalLight position={[-4, 2, 3]} intensity={0.7} color="#7c5cff" />
      <directionalLight position={[0, -3, 2]} intensity={0.4} color="#22d3ee" />
      <directionalLight position={[2, 1, -5]} intensity={1.0} color="#ff9d6c" />
      <pointLight position={[0, 0, 2]} intensity={0.6} color="#ffd6a8" />
    </>
  );
}
