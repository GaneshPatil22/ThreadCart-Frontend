-- ============================================================================
-- ADMIN DELETE ORDERS - RLS POLICIES
-- ============================================================================
-- Run this in Supabase SQL Editor to allow admin to delete orders
-- ============================================================================

-- ============================================================================
-- 1. DROP EXISTING DELETE POLICIES (if any)
-- ============================================================================

DROP POLICY IF EXISTS "Admin can delete orders" ON orders;
DROP POLICY IF EXISTS "Admin can delete order items" ON order_items;

-- ============================================================================
-- 2. ADD DELETE POLICY FOR ORDERS TABLE
-- ============================================================================

CREATE POLICY "Admin can delete orders"
ON orders
FOR DELETE
TO authenticated
USING (
  (SELECT auth.jwt()->>'email') = 'superadmin@threadcart.com'
);

-- ============================================================================
-- 3. ADD DELETE POLICY FOR ORDER_ITEMS TABLE
-- ============================================================================

CREATE POLICY "Admin can delete order items"
ON order_items
FOR DELETE
TO authenticated
USING (
  (SELECT auth.jwt()->>'email') = 'superadmin@threadcart.com'
);

-- ============================================================================
-- OPTIONAL: If you want CASCADE DELETE (auto-delete items when order deleted)
-- ============================================================================
-- This requires modifying the foreign key constraint.
-- Only run if the constraint doesn't already have ON DELETE CASCADE.

-- First, check existing constraint:
-- SELECT conname, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'order_items'::regclass AND contype = 'f';

-- If you want to add CASCADE (destructive - drops and recreates constraint):
-- ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_order_id_fkey;
-- ALTER TABLE order_items
--   ADD CONSTRAINT order_items_order_id_fkey
--   FOREIGN KEY (order_id)
--   REFERENCES orders(id)
--   ON DELETE CASCADE;

-- ============================================================================
-- VERIFY POLICIES
-- ============================================================================

SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('orders', 'order_items')
  AND cmd = 'DELETE'
ORDER BY tablename;
