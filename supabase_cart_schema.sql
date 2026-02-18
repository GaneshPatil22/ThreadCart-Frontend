-- ============================================================================
-- THREADCART CART SYSTEM - DATABASE SCHEMA
-- ============================================================================
-- This file contains the complete database schema for the cart and order system
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. CARTS TABLE
-- ============================================================================
-- One cart per authenticated user
CREATE TABLE IF NOT EXISTS public.carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for faster user cart lookups
CREATE INDEX IF NOT EXISTS idx_carts_user_id ON public.carts(user_id);

-- ============================================================================
-- 2. CART_ITEMS TABLE
-- ============================================================================
-- Individual items in a user's cart
CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES public.product(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Ensure one product appears only once per cart
    UNIQUE(cart_id, product_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON public.cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON public.cart_items(product_id);

-- ============================================================================
-- 3. ORDERS TABLE
-- ============================================================================
-- Order header with tracking timestamps
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Pricing
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),

    -- Order status
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled')),

    -- Payment details
    payment_method TEXT CHECK (payment_method IN ('razorpay', 'cod', 'bank_transfer')),
    payment_id TEXT, -- Razorpay payment ID
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refund_initiated', 'refunded')),

    -- Shipping address (stored as JSON)
    shipping_address JSONB NOT NULL,

    -- Order tracking timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    confirmed_at TIMESTAMPTZ,
    packed_at TIMESTAMPTZ,
    shipped_at TIMESTAMPTZ,
    out_for_delivery_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ
);

-- Indexes for orders
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- ============================================================================
-- 4. ORDER_ITEMS TABLE
-- ============================================================================
-- Individual items in an order (historical snapshot)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES public.product(id) ON DELETE RESTRICT,

    -- Snapshot at time of purchase
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_at_purchase NUMERIC(10, 2) NOT NULL CHECK (price_at_purchase >= 0),

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for order items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CARTS RLS POLICIES
-- ============================================================================

-- Users can view only their own cart
CREATE POLICY "Users can view their own cart"
    ON public.carts
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create their own cart
CREATE POLICY "Users can create their own cart"
    ON public.carts
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own cart
CREATE POLICY "Users can update their own cart"
    ON public.carts
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own cart
CREATE POLICY "Users can delete their own cart"
    ON public.carts
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- CART_ITEMS RLS POLICIES
-- ============================================================================

-- Users can view items in their own cart
CREATE POLICY "Users can view their own cart items"
    ON public.cart_items
    FOR SELECT
    USING (
        cart_id IN (
            SELECT id FROM public.carts WHERE user_id = auth.uid()
        )
    );

-- Users can add items to their own cart
CREATE POLICY "Users can add items to their own cart"
    ON public.cart_items
    FOR INSERT
    WITH CHECK (
        cart_id IN (
            SELECT id FROM public.carts WHERE user_id = auth.uid()
        )
    );

-- Users can update items in their own cart
CREATE POLICY "Users can update their own cart items"
    ON public.cart_items
    FOR UPDATE
    USING (
        cart_id IN (
            SELECT id FROM public.carts WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        cart_id IN (
            SELECT id FROM public.carts WHERE user_id = auth.uid()
        )
    );

-- Users can delete items from their own cart
CREATE POLICY "Users can delete their own cart items"
    ON public.cart_items
    FOR DELETE
    USING (
        cart_id IN (
            SELECT id FROM public.carts WHERE user_id = auth.uid()
        )
    );

-- ============================================================================
-- ORDERS RLS POLICIES
-- ============================================================================

-- Users can view only their own orders
CREATE POLICY "Users can view their own orders"
    ON public.orders
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create their own orders
CREATE POLICY "Users can create their own orders"
    ON public.orders
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users cannot update orders (only admins should, via separate policy)
CREATE POLICY "Users cannot update orders"
    ON public.orders
    FOR UPDATE
    USING (false);

-- Users cannot delete orders
CREATE POLICY "Users cannot delete orders"
    ON public.orders
    FOR DELETE
    USING (false);

-- ============================================================================
-- ORDER_ITEMS RLS POLICIES
-- ============================================================================

-- Users can view items in their own orders
CREATE POLICY "Users can view their own order items"
    ON public.order_items
    FOR SELECT
    USING (
        order_id IN (
            SELECT id FROM public.orders WHERE user_id = auth.uid()
        )
    );

-- Users can insert order items only during order creation
CREATE POLICY "Users can create order items for their orders"
    ON public.order_items
    FOR INSERT
    WITH CHECK (
        order_id IN (
            SELECT id FROM public.orders WHERE user_id = auth.uid()
        )
    );

-- Users cannot update or delete order items
CREATE POLICY "Users cannot update order items"
    ON public.order_items
    FOR UPDATE
    USING (false);

CREATE POLICY "Users cannot delete order items"
    ON public.order_items
    FOR DELETE
    USING (false);

-- ============================================================================
-- 6. ADMIN POLICIES (Optional - for superadmin@threadcart.com)
-- ============================================================================

-- Admin can update any order status
CREATE POLICY "Admin can update orders"
    ON public.orders
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.email = 'superadmin@threadcart.com'
        )
    );

-- Admin can view all orders
CREATE POLICY "Admin can view all orders"
    ON public.orders
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.email = 'superadmin@threadcart.com'
        )
    );

-- ============================================================================
-- 7. FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for carts table
DROP TRIGGER IF EXISTS update_carts_updated_at ON public.carts;
CREATE TRIGGER update_carts_updated_at
    BEFORE UPDATE ON public.carts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for cart_items table
DROP TRIGGER IF EXISTS update_cart_items_updated_at ON public.cart_items;
CREATE TRIGGER update_cart_items_updated_at
    BEFORE UPDATE ON public.cart_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. HELPER FUNCTION: Generate Order Number
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    order_num TEXT;
    is_unique BOOLEAN := FALSE;
BEGIN
    WHILE NOT is_unique LOOP
        -- Format: TC-YYYYMMDD-XXXXXX (e.g., TC-20250126-A1B2C3)
        order_num := 'TC-' ||
                     TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
                     UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));

        -- Check if unique
        SELECT NOT EXISTS(SELECT 1 FROM public.orders WHERE order_number = order_num)
        INTO is_unique;
    END LOOP;

    RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SCHEMA SETUP COMPLETE
-- ============================================================================
-- Next steps:
-- 1. Run this script in Supabase SQL Editor
-- 2. Verify all tables are created
-- 3. Test RLS policies with a test user
-- 4. Generate TypeScript types using Supabase CLI
-- ============================================================================
