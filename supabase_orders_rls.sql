-- ============================================================================
-- ORDERS TABLE RLS POLICIES
-- ============================================================================
-- Run this in Supabase SQL Editor to fix permission issues
-- ============================================================================

-- Drop existing policies on orders table (if any causing issues)
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can create their own orders" ON orders;
DROP POLICY IF EXISTS "Admin can view all orders" ON orders;
DROP POLICY IF EXISTS "Admin can update all orders" ON orders;
DROP POLICY IF EXISTS "Admin full access to orders" ON orders;

-- Enable RLS on orders table (if not already enabled)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICY 1: Users can view their own orders
-- ============================================================================
CREATE POLICY "Users can view their own orders"
ON orders
FOR SELECT
USING (auth.uid() = user_id);

-- ============================================================================
-- POLICY 2: Users can create orders for themselves
-- ============================================================================
CREATE POLICY "Users can create their own orders"
ON orders
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- POLICY 3: Admin can view all orders
-- ============================================================================
CREATE POLICY "Admin can view all orders"
ON orders
FOR SELECT
USING (auth.jwt() ->> 'email' = 'superadmin@threadcart.com');

-- ============================================================================
-- POLICY 4: Admin can update all orders (status, payment, notes)
-- ============================================================================
CREATE POLICY "Admin can update all orders"
ON orders
FOR UPDATE
USING (auth.jwt() ->> 'email' = 'superadmin@threadcart.com')
WITH CHECK (auth.jwt() ->> 'email' = 'superadmin@threadcart.com');

-- ============================================================================
-- ORDER_ITEMS TABLE RLS POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their order items" ON order_items;
DROP POLICY IF EXISTS "Users can create order items" ON order_items;
DROP POLICY IF EXISTS "Admin can view all order items" ON order_items;

-- Enable RLS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICY: Users can view their own order items
-- ============================================================================
CREATE POLICY "Users can view their order items"
ON order_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  )
);

-- ============================================================================
-- POLICY: Users can create order items for their orders
-- ============================================================================
CREATE POLICY "Users can create order items"
ON order_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  )
);

-- ============================================================================
-- POLICY: Admin can view all order items
-- ============================================================================
CREATE POLICY "Admin can view all order items"
ON order_items
FOR SELECT
USING (auth.jwt() ->> 'email' = 'superadmin@threadcart.com');

-- ============================================================================
-- VERIFY POLICIES
-- ============================================================================
-- Run these to check policies are created:

-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename IN ('orders', 'order_items');
