-- ============================================================================
-- EMAIL SUBSCRIBERS TABLE
-- ============================================================================
-- Stores leads captured via the on-site lead capture popup (newsletter signup
-- with optional phone, name, and interest tags).
--
-- RLS strategy:
--   - INSERT: open to anon + authenticated (public lead capture form)
--   - SELECT / UPDATE / DELETE: admin only
--   - Duplicate emails are handled at the service layer (unique-violation
--     is mapped to a friendly "already subscribed" success).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.email_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  name TEXT,
  interests TEXT[] NOT NULL DEFAULT '{}',
  source TEXT,
  page_url TEXT,
  user_agent TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.email_subscribers IS 'Newsletter / lead-capture popup signups';

CREATE INDEX IF NOT EXISTS idx_email_subscribers_status     ON public.email_subscribers(status);
CREATE INDEX IF NOT EXISTS idx_email_subscribers_created_at ON public.email_subscribers(created_at DESC);

ALTER TABLE public.email_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe"
  ON public.email_subscribers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Only admin can view subscribers"
  ON public.email_subscribers
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'superadmin@threadcart.com');

CREATE POLICY "Only admin can update subscribers"
  ON public.email_subscribers
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'superadmin@threadcart.com');

CREATE POLICY "Only admin can delete subscribers"
  ON public.email_subscribers
  FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'superadmin@threadcart.com');

CREATE OR REPLACE FUNCTION public.update_email_subscriber_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS email_subscribers_updated_at ON public.email_subscribers;
CREATE TRIGGER email_subscribers_updated_at
  BEFORE UPDATE ON public.email_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_email_subscriber_timestamp();
