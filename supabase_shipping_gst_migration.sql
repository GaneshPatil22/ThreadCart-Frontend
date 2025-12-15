-- ============================================================================
-- SHIPPING & GST MIGRATION
-- ============================================================================
-- Adds shipping charges per pincode and GST number support for orders
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- STEP 1: Add shipping_charge column to supported_pincodes
-- ============================================================================

ALTER TABLE supported_pincodes
ADD COLUMN IF NOT EXISTS shipping_charge DECIMAL(10, 2) DEFAULT 0;

-- Update comment
COMMENT ON COLUMN supported_pincodes.shipping_charge IS 'Shipping charge for this pincode in INR. 0 = free shipping.';

-- ============================================================================
-- STEP 2: Add gst_number and shipping_charge to orders table
-- ============================================================================

-- GST Number (optional, provided by customer)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS gst_number VARCHAR(15) DEFAULT NULL;

-- Shipping charge (captured at time of order)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS shipping_charge DECIMAL(10, 2) DEFAULT 0;

-- Add comments
COMMENT ON COLUMN orders.gst_number IS 'Customer GST number (optional). Format: 22AAAAA0000A1Z5';
COMMENT ON COLUMN orders.shipping_charge IS 'Shipping charge at time of order in INR';

-- ============================================================================
-- STEP 3: Set default shipping charges for existing pincodes (optional)
-- ============================================================================

-- Example: Set 500 Rs shipping for all existing pincodes
-- UPDATE supported_pincodes SET shipping_charge = 500 WHERE shipping_charge = 0;

-- Or set specific charges per pincode:
-- UPDATE supported_pincodes SET shipping_charge = 100 WHERE pincode = '560001';
-- UPDATE supported_pincodes SET shipping_charge = 0 WHERE pincode = '560002'; -- Free shipping

-- ============================================================================
-- VERIFY: Check the changes
-- ============================================================================

-- Check supported_pincodes structure
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'supported_pincodes';

-- Check orders structure
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- View pincodes with shipping charges
SELECT pincode, city, state, delivery_days, shipping_charge, is_active
FROM supported_pincodes
ORDER BY pincode;
