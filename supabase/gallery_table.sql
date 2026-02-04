-- ============================================================================
-- GALLERY TABLE
-- ============================================================================
-- Table to store gallery images uploaded to ImageKit
-- Only admins can add/delete images, all users can view
-- ============================================================================

-- Create the gallery table
CREATE TABLE IF NOT EXISTS gallery (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  file_id TEXT NOT NULL,  -- ImageKit file ID for deletion
  title TEXT,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for sorting
CREATE INDEX IF NOT EXISTS idx_gallery_sort_order ON gallery(sort_order ASC);

-- Enable Row Level Security
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read gallery images
CREATE POLICY "Anyone can view gallery images"
  ON gallery FOR SELECT
  USING (true);

-- Only admin can insert gallery images
CREATE POLICY "Only admin can insert gallery images"
  ON gallery FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'email' = 'superadmin@threadcart.com'
  );

-- Only admin can update gallery images
CREATE POLICY "Only admin can update gallery images"
  ON gallery FOR UPDATE
  USING (
    auth.jwt() ->> 'email' = 'superadmin@threadcart.com'
  );

-- Only admin can delete gallery images
CREATE POLICY "Only admin can delete gallery images"
  ON gallery FOR DELETE
  USING (
    auth.jwt() ->> 'email' = 'superadmin@threadcart.com'
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_gallery_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER gallery_updated_at
  BEFORE UPDATE ON gallery
  FOR EACH ROW
  EXECUTE FUNCTION update_gallery_updated_at();
