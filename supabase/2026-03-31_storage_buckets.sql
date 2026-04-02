-- ============================================================
-- CoLabs Storage Buckets + Policies
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ectnrhfslxnzpwmrqjfn/sql/new
-- ============================================================

-- 1. Create buckets (public = files are readable without auth)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'space-media',
    'space-media',
    true,
    53687091200, -- 50 GB (Pro limit; server enforces per-plan before upload)
    ARRAY[
      'image/jpeg','image/png','image/gif','image/webp','image/svg+xml',
      'video/mp4','video/quicktime','video/webm','video/x-msvideo',
      'audio/mpeg','audio/mp4','audio/ogg','audio/wav','audio/webm',
      'application/pdf'
    ]
  ),
  (
    'profile-media',
    'profile-media',
    true,
    52428800, -- 50 MB for profile avatars + media
    ARRAY[
      'image/jpeg','image/png','image/gif','image/webp',
      'video/mp4','video/quicktime','video/webm'
    ]
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;


-- 2. Public read policy: anyone can read files from both buckets
CREATE POLICY "Public read – space-media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'space-media');

CREATE POLICY "Public read – profile-media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-media');

-- 3. Authenticated upload/delete for space-media
--    (Server uses service role key so RLS is bypassed server-side;
--     these policies cover any direct client uploads if needed)
CREATE POLICY "Auth upload – space-media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'space-media' AND auth.role() = 'authenticated');

CREATE POLICY "Auth delete – space-media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'space-media' AND auth.role() = 'authenticated');

-- 4. Authenticated upload/delete for profile-media
CREATE POLICY "Auth upload – profile-media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'profile-media' AND auth.role() = 'authenticated');

CREATE POLICY "Auth delete – profile-media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'profile-media' AND auth.role() = 'authenticated');
