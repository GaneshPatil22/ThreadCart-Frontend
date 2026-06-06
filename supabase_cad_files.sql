-- ==========================================
-- ThreadCart CAD Files Setup
-- ==========================================
-- Creates product_cad_files table for storing CAD file metadata.
-- Actual file bytes live in Cloudflare R2; this table only holds
-- the storage_key (path in the bucket) and metadata.
--
-- Supported file types: step | pdf | sldprt | stl
-- (add more by updating the CHECK constraint and constants.ts)
-- ==========================================

-- STEP 1: Create the table
-- ==========================================

CREATE TABLE IF NOT EXISTS public.product_cad_files (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES public.product(id) ON DELETE CASCADE,
  file_type VARCHAR(20) NOT NULL,
  storage_key TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_size_bytes BIGINT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  download_count INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT product_cad_files_file_type_check
    CHECK (file_type IN ('step', 'pdf', 'sldprt', 'stl')),

  CONSTRAINT product_cad_files_product_type_unique
    UNIQUE (product_id, file_type)
);

-- Indexes for the hot lookups
CREATE INDEX IF NOT EXISTS idx_product_cad_files_product_id
  ON public.product_cad_files(product_id);

-- STEP 2: Enable Row Level Security
-- ==========================================

ALTER TABLE public.product_cad_files ENABLE ROW LEVEL SECURITY;

-- STEP 3: Drop existing policies (idempotent re-runs)
-- ==========================================

DROP POLICY IF EXISTS "Enable read access for all users" ON public.product_cad_files;
DROP POLICY IF EXISTS "Enable insert for admin only" ON public.product_cad_files;
DROP POLICY IF EXISTS "Enable update for admin only" ON public.product_cad_files;
DROP POLICY IF EXISTS "Enable delete for admin only" ON public.product_cad_files;

-- STEP 4: READ policy — anyone can see which files are available
-- ==========================================
-- (The download_count column is harmless to expose; actual download is
--  gated by the edge function which requires auth.)

CREATE POLICY "Enable read access for all users" ON public.product_cad_files
  FOR SELECT
  USING (true);

-- STEP 5: WRITE policies — only admin
-- ==========================================

CREATE POLICY "Enable insert for admin only" ON public.product_cad_files
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.email() = 'superadmin@threadcart.com');

CREATE POLICY "Enable update for admin only" ON public.product_cad_files
  FOR UPDATE
  TO authenticated
  USING (auth.email() = 'superadmin@threadcart.com')
  WITH CHECK (auth.email() = 'superadmin@threadcart.com');

CREATE POLICY "Enable delete for admin only" ON public.product_cad_files
  FOR DELETE
  TO authenticated
  USING (auth.email() = 'superadmin@threadcart.com');

-- STEP 6: Atomic download counter (used by the edge function)
-- ==========================================
-- A SECURITY DEFINER function lets any authenticated user bump the counter
-- without granting them full UPDATE rights on the table.

CREATE OR REPLACE FUNCTION public.increment_cad_download_count(
  p_cad_file_id BIGINT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.product_cad_files
  SET download_count = download_count + 1
  WHERE id = p_cad_file_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_cad_download_count(BIGINT)
  TO authenticated;

-- ==========================================
-- VERIFICATION
-- ==========================================
-- SELECT * FROM pg_policies WHERE tablename = 'product_cad_files';
-- SELECT * FROM public.product_cad_files LIMIT 1;
