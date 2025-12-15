-- ============================================================================
-- COMPLETE FIX FOR ORDERS RLS
-- ============================================================================
-- Run each section separately if needed
-- ============================================================================

-- STEP 1: Check what's causing the issue
-- Run this first to see existing policies and triggers:

SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'orders';

-- Check for triggers that might reference users table:
SELECT tgname, tgtype, proname
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'orders';

-- ============================================================================
-- STEP 2: Drop ALL existing policies on orders
-- ============================================================================

DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'orders'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON orders', pol.policyname);
    END LOOP;
END $$;

-- ============================================================================
-- STEP 3: Temporarily disable RLS to test
-- (This will allow all operations - use only for testing)
-- ============================================================================

-- UNCOMMENT THIS LINE TO DISABLE RLS TEMPORARILY:
-- ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 4: Create simple policies (no user table reference)
-- ============================================================================

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Simple policy: Allow all authenticated users to SELECT (for now)
CREATE POLICY "orders_select_policy"
ON orders
FOR SELECT
TO authenticated
USING (true);

-- Simple policy: Allow all authenticated users to INSERT their own
CREATE POLICY "orders_insert_policy"
ON orders
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Simple policy: Allow admin to UPDATE any order
-- Using email from JWT token directly
CREATE POLICY "orders_update_admin"
ON orders
FOR UPDATE
TO authenticated
USING (
  (SELECT auth.jwt()->>'email') = 'superadmin@threadcart.com'
);

-- ============================================================================
-- STEP 5: Same for order_items
-- ============================================================================

DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'order_items'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON order_items', pol.policyname);
    END LOOP;
END $$;

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_items_select_policy"
ON order_items
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "order_items_insert_policy"
ON order_items
FOR INSERT
TO authenticated
WITH CHECK (true);

-- ============================================================================
-- STEP 6: Add notes column if missing
-- ============================================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT;

-- ============================================================================
-- VERIFY: Check final policies
-- ============================================================================

SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE tablename IN ('orders', 'order_items')
ORDER BY tablename, policyname;
