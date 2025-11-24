-- ==========================================
-- ThreadCart Admin Authorization Setup
-- ==========================================
-- This script sets up Row Level Security (RLS) policies
-- to ensure only the admin user can modify data
-- ==========================================

-- STEP 1: Enable Row Level Security on all tables
-- ==========================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sub-categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE product ENABLE ROW LEVEL SECURITY;

-- STEP 2: Drop existing policies (if any)
-- ==========================================

DROP POLICY IF EXISTS "Enable read access for all users" ON categories;
DROP POLICY IF EXISTS "Enable insert for admin only" ON categories;
DROP POLICY IF EXISTS "Enable update for admin only" ON categories;
DROP POLICY IF EXISTS "Enable delete for admin only" ON categories;

DROP POLICY IF EXISTS "Enable read access for all users" ON "sub-categories";
DROP POLICY IF EXISTS "Enable insert for admin only" ON "sub-categories";
DROP POLICY IF EXISTS "Enable update for admin only" ON "sub-categories";
DROP POLICY IF EXISTS "Enable delete for admin only" ON "sub-categories";

DROP POLICY IF EXISTS "Enable read access for all users" ON product;
DROP POLICY IF EXISTS "Enable insert for admin only" ON product;
DROP POLICY IF EXISTS "Enable update for admin only" ON product;
DROP POLICY IF EXISTS "Enable delete for admin only" ON product;

-- STEP 3: Create READ policies (allow everyone to view data)
-- ==========================================

-- Categories - Anyone can read
CREATE POLICY "Enable read access for all users" ON categories
    FOR SELECT
    USING (true);

-- SubCategories - Anyone can read
CREATE POLICY "Enable read access for all users" ON "sub-categories"
    FOR SELECT
    USING (true);

-- Products - Anyone can read
CREATE POLICY "Enable read access for all users" ON product
    FOR SELECT
    USING (true);

-- STEP 4: Create INSERT policies (only admin can add)
-- ==========================================

-- Categories - Only admin can insert
CREATE POLICY "Enable insert for admin only" ON categories
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.email() = 'superadmin@threadcart.com'
    );

-- SubCategories - Only admin can insert
CREATE POLICY "Enable insert for admin only" ON "sub-categories"
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.email() = 'superadmin@threadcart.com'
    );

-- Products - Only admin can insert
CREATE POLICY "Enable insert for admin only" ON product
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.email() = 'superadmin@threadcart.com'
    );

-- STEP 5: Create UPDATE policies (only admin can edit)
-- ==========================================

-- Categories - Only admin can update
CREATE POLICY "Enable update for admin only" ON categories
    FOR UPDATE
    TO authenticated
    USING (
        auth.email() = 'superadmin@threadcart.com'
    )
    WITH CHECK (
        auth.email() = 'superadmin@threadcart.com'
    );

-- SubCategories - Only admin can update
CREATE POLICY "Enable update for admin only" ON "sub-categories"
    FOR UPDATE
    TO authenticated
    USING (
        auth.email() = 'superadmin@threadcart.com'
    )
    WITH CHECK (
        auth.email() = 'superadmin@threadcart.com'
    );

-- Products - Only admin can update
CREATE POLICY "Enable update for admin only" ON product
    FOR UPDATE
    TO authenticated
    USING (
        auth.email() = 'superadmin@threadcart.com'
    )
    WITH CHECK (
        auth.email() = 'superadmin@threadcart.com'
    );

-- STEP 6: Create DELETE policies (only admin can delete)
-- ==========================================

-- Categories - Only admin can delete
CREATE POLICY "Enable delete for admin only" ON categories
    FOR DELETE
    TO authenticated
    USING (
        auth.email() = 'superadmin@threadcart.com'
    );

-- SubCategories - Only admin can delete
CREATE POLICY "Enable delete for admin only" ON "sub-categories"
    FOR DELETE
    TO authenticated
    USING (
        auth.email() = 'superadmin@threadcart.com'
    );

-- Products - Only admin can delete
CREATE POLICY "Enable delete for admin only" ON product
    FOR DELETE
    TO authenticated
    USING (
        auth.email() = 'superadmin@threadcart.com'
    );

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================
-- Run these to verify the policies are set up correctly

-- Check RLS status
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('categories', 'sub-categories', 'product');

-- List all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('categories', 'sub-categories', 'product')
ORDER BY tablename, cmd;

-- ==========================================
-- IMPORTANT NOTES
-- ==========================================
-- 1. The admin email is hardcoded as 'superadmin@threadcart.com'
-- 2. Anyone can READ data (categories, subcategories, products)
-- 3. Only the admin can INSERT, UPDATE, or DELETE data
-- 4. Even if someone bypasses frontend validation, the database will reject their request
-- 5. Make sure the admin user is registered with email: superadmin@threadcart.com
-- ==========================================

-- ==========================================
-- TESTING
-- ==========================================
-- To test, try these queries as different users:

-- As anonymous user (should work):
-- SELECT * FROM categories;

-- As regular authenticated user (should fail):
-- INSERT INTO categories (name, image_url, description, sort_number)
-- VALUES ('Test', 'test.jpg', 'Test', 0);

-- As admin user (should work):
-- INSERT INTO categories (name, image_url, description, sort_number)
-- VALUES ('Test', 'test.jpg', 'Test', 0);
-- ==========================================
