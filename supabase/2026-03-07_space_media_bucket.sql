-- ============================================================================
-- Space media bucket (separate from profile-media)
-- ============================================================================
-- Space uploads use bucket "space-media" with paths:
--   {space_id}/images/{uuid}.{ext}
--   {space_id}/video/{uuid}.{ext}
--   {space_id}/audio/{uuid}.{ext}
-- Server-side uploads use service role (bypass RLS). This migration only
-- creates the bucket so it exists; no storage.objects policies required for
-- service-role uploads. Public read so space media URLs work.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('space-media', 'space-media', true)
on conflict (id) do update set public = true;
