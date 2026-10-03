-- Migration: Add is_test_payment to orders table
-- The admin user checks out against the Razorpay TEST account so the live
-- deployment can be exercised without real money; every other user hits the
-- LIVE account. Both are decided server-side in the razorpay-create-order and
-- razorpay-verify-payment Edge Functions from the signed-in user's email.
--
-- Without this flag those admin test orders are indistinguishable from real
-- revenue in Manage Orders and in any reporting built on this table.

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS is_test_payment BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.orders.is_test_payment IS
  'True when paid via the Razorpay test account (admin-only test checkout). Exclude from revenue reporting.';

-- Partial index: real orders are the common read path, test rows stay rare.
CREATE INDEX IF NOT EXISTS idx_orders_is_test_payment
  ON public.orders (is_test_payment)
  WHERE is_test_payment = true;

-- Backfill: every order placed before this flag existed was a development or
-- test transaction - no real customer revenue had been taken at that point.
-- Run ONCE, at the time of migration. Re-running would wrongly flag real orders.
UPDATE public.orders
SET is_test_payment = true
WHERE is_test_payment = false;
