-- ============================================================================
-- CONTACT FORM SUBMISSIONS TABLE
-- ============================================================================
-- Run this SQL in your Supabase SQL Editor to create the contact_submissions table
-- ============================================================================

-- Create the contact_submissions table
CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON contact_submissions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can INSERT (submit contact form)
CREATE POLICY "Anyone can submit contact form"
  ON contact_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Only admin can SELECT (view submissions)
CREATE POLICY "Only admin can view contact submissions"
  ON contact_submissions
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'superadmin@threadcart.com');

-- Policy: Only admin can UPDATE (mark as read, replied, etc.)
CREATE POLICY "Only admin can update contact submissions"
  ON contact_submissions
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'superadmin@threadcart.com');

-- Policy: Only admin can DELETE
CREATE POLICY "Only admin can delete contact submissions"
  ON contact_submissions
  FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'superadmin@threadcart.com');

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_contact_submission_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS contact_submissions_updated_at ON contact_submissions;
CREATE TRIGGER contact_submissions_updated_at
  BEFORE UPDATE ON contact_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_submission_timestamp();
