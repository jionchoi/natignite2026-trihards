// Approximate stair riser height (meters). Used by the staircase geometry in
// Fixture.tsx and the agent surface-height calc in AgentSimulation.tsx so the
// agent's foot lands on the same tread the geometry draws.
export const STAIR_RISER = 0.18;

export function treadCount(height: number): number {
  return Math.max(1, Math.round(height / STAIR_RISER));
}
