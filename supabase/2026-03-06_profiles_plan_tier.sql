-- ============================================================================
-- Add plan_tier to profiles (for Starter vs Pro billing)
-- ============================================================================
-- Safe to run multiple times. If the column already exists, this is a no-op.
-- ============================================================================

-- Add column if it doesn't exist (e.g. DB was created before schema had it)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS plan_tier text DEFAULT 'starter';

-- Ensure the check constraint exists (drop first to avoid duplicate, then add)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_plan_tier_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_plan_tier_check
  CHECK (plan_tier IN ('starter', 'pro'));

-- Backfill any NULLs to starter
UPDATE profiles SET plan_tier = 'starter' WHERE plan_tier IS NULL;
