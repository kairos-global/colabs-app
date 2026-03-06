export type PlanTier = "starter" | "pro";

// Storage limits per space (bytes)
export const STARTER_SPACE_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB
export const PRO_SPACE_BYTES = 50 * 1024 * 1024 * 1024; // 50 GB

// Other conceptual limits for future enforcement
export const STARTER_MAX_SPACES = 3;
export const STARTER_MAX_COLLABORATORS_PER_SPACE = 10;

export function getPlanTierForProfile(planTier: PlanTier | null | undefined): PlanTier {
  // For now everyone is treated as starter until billing integration exists.
  return planTier === "pro" ? "pro" : "starter";
}

