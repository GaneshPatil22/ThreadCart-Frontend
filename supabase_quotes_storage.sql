-- ============================================================================
-- QUOTES STORAGE BUCKET SETUP
-- ============================================================================
-- Run this in Supabase SQL Editor to create storage bucket for quote PDFs
-- ============================================================================

-- ============================================================================
-- 1. CREATE STORAGE BUCKET FOR QUOTES
-- ============================================================================
-- Note: You may need to create this via Supabase Dashboard > Storage > New Bucket
-- Bucket name: quotes
-- Public: false (we'll use signed URLs)

-- If using SQL (requires superuser/service role):
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'quotes',
  'quotes',
  false,  -- Private bucket, use signed URLs for access
  10485760,  -- 10MB limit
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. STORAGE POLICIES
-- ============================================================================

-- Allow anyone (including anonymous) to upload quote PDFs
-- This is needed because users don't need to be logged in to request a quote
CREATE POLICY "Anyone can upload quote PDFs"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'quotes');

-- Allow admin to read all quote PDFs
CREATE POLICY "Admin can read all quotes"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'quotes'
  AND (SELECT auth.jwt()->>'email') = 'superadmin@threadcart.com'
);

-- Allow admin to delete quote PDFs (cleanup)
CREATE POLICY "Admin can delete quotes"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'quotes'
  AND (SELECT auth.jwt()->>'email') = 'superadmin@threadcart.com'
);

-- ============================================================================
-- ALTERNATIVE: If above doesn't work, create bucket via Dashboard
-- ============================================================================
-- 1. Go to Supabase Dashboard > Storage
-- 2. Click "New Bucket"
-- 3. Name: quotes
-- 4. Public: OFF (unchecked)
-- 5. Click "Create bucket"
-- 6. Then run only the policies above (skip the INSERT INTO storage.buckets)
-- ============================================================================
