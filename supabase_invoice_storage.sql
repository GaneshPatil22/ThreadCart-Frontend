-- ============================================================================
-- INVOICE STORAGE BUCKET SETUP
-- ============================================================================
-- Run this in Supabase SQL Editor to create storage bucket for invoices
-- ============================================================================

-- ============================================================================
-- 1. CREATE STORAGE BUCKET FOR INVOICES
-- ============================================================================
-- Note: You may need to create this via Supabase Dashboard > Storage > New Bucket
-- Bucket name: invoices
-- Public: false (we'll use signed URLs)

-- If using SQL (requires superuser/service role):
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'invoices',
  'invoices',
  false,  -- Private bucket, use signed URLs for access
  5242880,  -- 5MB limit
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. DROP EXISTING POLICIES (to avoid conflicts)
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can upload invoices" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own invoices" ON storage.objects;
DROP POLICY IF EXISTS "Admin can read all invoices" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete invoices" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own invoices" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read invoices with token" ON storage.objects;

-- ============================================================================
-- 3. STORAGE POLICIES
-- ============================================================================

-- Allow authenticated users to upload invoices to their own folder
CREATE POLICY "Users can upload own invoices"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'invoices'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to read their own invoices
CREATE POLICY "Users can read own invoices"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'invoices'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow admin to read all invoices
CREATE POLICY "Admin can read all invoices"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'invoices'
  AND (SELECT auth.jwt()->>'email') = 'superadmin@threadcart.com'
);

-- Allow admin to upload any invoice (for order notifications)
CREATE POLICY "Admin can upload any invoice"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'invoices'
  AND (SELECT auth.jwt()->>'email') = 'superadmin@threadcart.com'
);

-- Allow admin to delete invoices (cleanup)
CREATE POLICY "Admin can delete invoices"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'invoices'
  AND (SELECT auth.jwt()->>'email') = 'superadmin@threadcart.com'
);

-- ============================================================================
-- ALTERNATIVE: If above doesn't work, create bucket via Dashboard
-- ============================================================================
-- 1. Go to Supabase Dashboard > Storage
-- 2. Click "New Bucket"
-- 3. Name: invoices
-- 4. Public: OFF (unchecked)
-- 5. Click "Create bucket"
-- 6. Then run only the policies above (skip the INSERT INTO storage.buckets)
-- ============================================================================
