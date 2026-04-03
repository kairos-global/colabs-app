-- =============================================================================
-- Community features: listing categories + spaces categories + community_published_collabs
-- Run in Supabase SQL Editor before testing these features.
-- =============================================================================

-- 1. Add categories (text array) and roles_needed to collaboration_listings
ALTER TABLE collaboration_listings ADD COLUMN IF NOT EXISTS categories text[] DEFAULT '{}';
ALTER TABLE collaboration_listings ADD COLUMN IF NOT EXISTS roles_needed text;

-- 2. Add categories (text array) to spaces (used when posting to community)
ALTER TABLE spaces ADD COLUMN IF NOT EXISTS categories text[] DEFAULT '{}';

-- 3. Create community_published_collabs table
-- Holds metadata for spaces posted to the Community board (one row per space).
-- External-visibility items from the linked space are live-loaded on the detail page.
CREATE TABLE IF NOT EXISTS community_published_collabs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES spaces (id) ON DELETE CASCADE,
  published_by uuid NOT NULL REFERENCES profiles (id),
  title text NOT NULL,
  summary text,
  published_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT community_published_collabs_space_id_unique UNIQUE (space_id)
);

ALTER TABLE community_published_collabs ENABLE ROW LEVEL SECURITY;

-- Anyone can read published collabs (public community board)
CREATE POLICY "community_published_collabs_select"
  ON community_published_collabs FOR SELECT
  USING (true);

CREATE POLICY "community_published_collabs_insert"
  ON community_published_collabs FOR INSERT
  WITH CHECK (
    published_by IN (
      SELECT id FROM profiles WHERE clerk_user_id = current_clerk_user_id()
    )
  );

CREATE POLICY "community_published_collabs_update"
  ON community_published_collabs FOR UPDATE
  USING (
    published_by IN (
      SELECT id FROM profiles WHERE clerk_user_id = current_clerk_user_id()
    )
  );

CREATE POLICY "community_published_collabs_delete"
  ON community_published_collabs FOR DELETE
  USING (
    published_by IN (
      SELECT id FROM profiles WHERE clerk_user_id = current_clerk_user_id()
    )
  );
