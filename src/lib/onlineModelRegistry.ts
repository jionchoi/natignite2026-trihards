/**
 * Direct GLB URLs (Khronos glTF Sample Models, raw.githubusercontent.com).
 * Resolved without extra HTTP — keeps suggestion → placement latency low.
 */
const KHR =
  "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main";

export const ONLINE_ASSET_KEYS = [
  "seating_chair",
  "seating_sofa",
  "lighting_floor",
  "lighting_lantern",
  "prop_cart",
  "prop_antique",
  "plant_avocado",
  "gear_small",
  "generic_box",
  "accent_duck",
] as const;

export type OnlineAssetKey = (typeof ONLINE_ASSET_KEYS)[number];

export const ONLINE_ASSET_GLBS: Record<OnlineAssetKey, string> = {
  seating_chair: `${KHR}/2.0/SheenChair/glTF-Binary/SheenChair.glb`,
  seating_sofa: `${KHR}/2.0/GlamVelvetSofa/glTF-Binary/GlamVelvetSofa.glb`,
  lighting_floor: `${KHR}/2.0/IridescenceLamp/glTF-Binary/IridescenceLamp.glb`,
  lighting_lantern: `${KHR}/2.0/Lantern/glTF-Binary/Lantern.glb`,
  prop_cart: `${KHR}/2.0/CesiumMilkTruck/glTF-Binary/CesiumMilkTruck.glb`,
  prop_antique: `${KHR}/2.0/AntiqueCamera/glTF-Binary/AntiqueCamera.glb`,
  plant_avocado: `${KHR}/2.0/Avocado/glTF-Binary/Avocado.glb`,
  gear_small: `${KHR}/2.0/GearboxAssy/glTF-Binary/GearboxAssy.glb`,
  generic_box: `${KHR}/2.0/Box/glTF-Binary/Box.glb`,
  accent_duck: `${KHR}/2.0/Duck/glTF-Binary/Duck.glb`,
};

export function glbUrlForAssetKey(key: string): string | null {
  if ((ONLINE_ASSET_KEYS as readonly string[]).includes(key)) {
    return ONLINE_ASSET_GLBS[key as OnlineAssetKey];
  }
  return null;
}
