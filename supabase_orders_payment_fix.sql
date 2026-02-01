-- ============================================================================
-- FIX: ORDERS PAYMENT STATUS UPDATE POLICY
-- ============================================================================
-- This fixes the issue where payment status remains "pending" after successful
-- Razorpay payment because users couldn't update their own orders.
--
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- STEP 1: Add policy to allow users to update their own orders
-- ============================================================================
-- This allows users to update payment-related fields on their own orders

-- Drop existing user update policy if exists
DROP POLICY IF EXISTS "Users can update own order payment" ON orders;

-- Create new policy: Users can update their own orders (for payment status)
CREATE POLICY "Users can update own order payment"
ON orders
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- VERIFY: Check policies on orders table
-- ============================================================================
-- Run this to see all policies:

SELECT
  policyname,
  cmd,
  roles,
  SUBSTRING(qual::text, 1, 100) as using_condition,
  SUBSTRING(with_check::text, 1, 100) as with_check_condition
FROM pg_policies
WHERE tablename = 'orders'
ORDER BY policyname;

-- ============================================================================
-- EXPECTED RESULT: You should see these policies
-- ============================================================================
-- 1. "Users can view their own orders" (SELECT)
-- 2. "Users can create their own orders" (INSERT)
-- 3. "Users can update own order payment" (UPDATE) <-- NEW
-- 4. "Admin can view all orders" (SELECT)
-- 5. "Admin can update all orders" (UPDATE)
-- ============================================================================
