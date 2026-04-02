-- ============================================================
-- Publication Analytics
-- Tracks views on public /published/[id] pages.
-- Run in Supabase SQL Editor after the storage buckets migration.
-- ============================================================

CREATE TABLE IF NOT EXISTS publication_views (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_id uuid NOT NULL REFERENCES space_publications(id) ON DELETE CASCADE,
  viewed_at     timestamptz NOT NULL DEFAULT now(),
  -- Store a hashed IP so we can deduplicate without storing raw PII
  ip_hash       text,
  -- Optional: referrer domain for reach tracking
  referrer      text
);

-- Index for fast per-publication count queries
CREATE INDEX IF NOT EXISTS idx_publication_views_pub_id
  ON publication_views (publication_id);

-- Index for time-based queries (analytics over time)
CREATE INDEX IF NOT EXISTS idx_publication_views_viewed_at
  ON publication_views (viewed_at);

-- Convenience view: total views per publication
CREATE OR REPLACE VIEW publication_view_counts AS
SELECT
  publication_id,
  COUNT(*)                              AS total_views,
  COUNT(DISTINCT ip_hash)               AS unique_viewers,
  MAX(viewed_at)                        AS last_viewed_at,
  COUNT(*) FILTER (WHERE viewed_at > now() - interval '7 days')  AS views_last_7d,
  COUNT(*) FILTER (WHERE viewed_at > now() - interval '30 days') AS views_last_30d
FROM publication_views
GROUP BY publication_id;
