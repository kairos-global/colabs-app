export type PlanTier = "starter" | "pro";

// Storage limits per space (bytes)
export const STARTER_SPACE_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB
export const PRO_SPACE_BYTES = 50 * 1024 * 1024 * 1024; // 50 GB

// Other conceptual limits for future enforcement
export const STARTER_MAX_SPACES = 3;
export const STARTER_MAX_COLLABORATORS_PER_SPACE = 10;

export function getPlanTierForProfile(planTier: PlanTier | null | undefined): PlanTier {
  return planTier === "pro" ? "pro" : "starter";
}

export function getSpaceByteLimitForPlan(tier: PlanTier): number {
  return tier === "pro" ? PRO_SPACE_BYTES : STARTER_SPACE_BYTES;
}

/** Pro = no practical cap for these counts in app logic. */
export function getMaxSpacesForPlan(tier: PlanTier): number {
  return tier === "pro" ? Number.MAX_SAFE_INTEGER : STARTER_MAX_SPACES;
}

export function getMaxCollaboratorsPerSpaceForPlan(tier: PlanTier): number {
  return tier === "pro" ? Number.MAX_SAFE_INTEGER : STARTER_MAX_COLLABORATORS_PER_SPACE;
}

