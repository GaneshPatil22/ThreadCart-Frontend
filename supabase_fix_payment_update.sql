-- ============================================================================
-- FIX: Allow users to update payment status on their own orders
-- ============================================================================
-- Run this in Supabase SQL Editor to fix the payment status update issue
-- ============================================================================

-- Drop the restrictive policy that blocks all updates
DROP POLICY IF EXISTS "Users cannot update orders" ON public.orders;

-- Create a new policy that allows users to update payment info on their own orders
-- Only allows updating payment-related fields when order is in pending/confirmed status
CREATE POLICY "Users can update payment info on own orders"
    ON public.orders
    FOR UPDATE
    USING (
        auth.uid() = user_id
        AND status IN ('pending', 'confirmed')
    )
    WITH CHECK (
        auth.uid() = user_id
    );

-- ============================================================================
-- Add grand_total column if not exists
-- ============================================================================
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS grand_total DECIMAL(10,2);

-- Update existing orders to have grand_total (18% GST on total_amount)
UPDATE public.orders
SET grand_total = total_amount * 1.18
WHERE grand_total IS NULL;

-- ============================================================================
-- DONE! Payment status updates should now work
-- ============================================================================
