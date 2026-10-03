// ============================================================================
// SUPABASE EDGE FUNCTION: RAZORPAY CREATE ORDER
// ============================================================================
// Creates a Razorpay order server-side and returns its order_id to the browser.
//
// The amount is recomputed here from the caller's OWN cart rows in the database.
// The client never sends an amount, so a tampered frontend cannot pay less than
// the cart is actually worth.
//
// Pricing mirrors src/services/cart.service.ts + src/utils/featureFlags.ts:
//   subtotal = Σ(product.price × quantity)   (DB prices are GST-EXCLUSIVE)
//   tax      = subtotal × GST_RATE
//   shipping = tiered on subtotal
//   total    = subtotal + tax + shipping
// Keep those three files in sync — if the tiers or GST rate change in the
// frontend, change them here too or checkout totals will disagree.
//
// Required environment variables (set with `supabase secrets set ...`):
//   RAZORPAY_KEY_ID
//   RAZORPAY_KEY_SECRET
// ============================================================================

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID') ?? '';
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET') ?? '';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

const RAZORPAY_ORDERS_API = 'https://api.razorpay.com/v1/orders';

// Mirrors TAX.GST_RATE in src/utils/constants.ts
const GST_RATE = 0.18;

// Mirrors SHIPPING.TIERS in src/utils/featureFlags.ts
const SHIPPING_TIERS = [
  { min: 0, max: 1000, charge: 80 },
  { min: 1000, max: 4000, charge: 180 },
  { min: 4000, max: Infinity, charge: 600 },
];

// Razorpay rejects anything below 100 paise (₹1)
const MIN_AMOUNT_PAISE = 100;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RequestBody {
  /** Client-supplied reference, echoed into the Razorpay receipt field. */
  receipt?: string;
}

interface CartItemRow {
  quantity: number;
  product: { price: number } | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const error = (message: string, status = 400) => json({ error: message }, status);

/** Tiered shipping — mirrors calculateOrderBasedShipping() in featureFlags.ts. */
const shippingForSubtotal = (subtotal: number): number => {
  const tier = SHIPPING_TIERS.find((t) => subtotal > t.min && subtotal <= t.max);
  return tier ? tier.charge : SHIPPING_TIERS[SHIPPING_TIERS.length - 1].charge;
};

/** Razorpay receipt field is capped at 40 characters. */
const sanitizeReceipt = (receipt: string | undefined): string =>
  (receipt && typeof receipt === 'string' ? receipt : `TC${Date.now()}`).slice(0, 40);

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return error('Method not allowed', 405);

  // ---- Config sanity ----
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    console.error('Razorpay env vars missing');
    return error('Payment gateway not configured', 500);
  }

  // ---- AuthN: verify caller is logged in ----
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return error('Authentication required', 401);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return error('Invalid session', 401);
  }
  const userId = userData.user.id;

  // ---- Parse body (receipt is the only accepted input — never an amount) ----
  let body: RequestBody = {};
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    // Empty body is fine; receipt falls back to a generated one.
  }

  try {
    // ---- Recompute the amount from the caller's own cart ----
    // RLS restricts these reads to the authenticated user's rows.
    const { data: cart, error: cartErr } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (cartErr) {
      console.error('Error loading cart:', cartErr);
      return error('Could not load cart', 500);
    }
    if (!cart) return error('Cart is empty', 400);

    const { data: cartItems, error: itemsErr } = await supabase
      .from('cart_items')
      .select('quantity, product:product_id ( price )')
      .eq('cart_id', cart.id);

    if (itemsErr) {
      console.error('Error loading cart items:', itemsErr);
      return error('Could not load cart', 500);
    }

    const items = (cartItems ?? []) as unknown as CartItemRow[];
    if (items.length === 0) return error('Cart is empty', 400);

    // A missing product row means the product was deleted while in the cart.
    if (items.some((item) => !item.product)) {
      return error('A product in your cart is no longer available', 409);
    }

    const subtotal = items.reduce(
      (sum, item) => sum + (item.product?.price ?? 0) * item.quantity,
      0
    );
    const tax = subtotal * GST_RATE;
    const shipping = shippingForSubtotal(subtotal);
    const total = subtotal + tax + shipping;

    const amountInPaise = Math.round(total * 100);
    if (amountInPaise < MIN_AMOUNT_PAISE) {
      return error('Order amount is below the minimum payable value', 400);
    }

    // ---- Create the order with Razorpay ----
    const razorpayResponse = await fetch(RAZORPAY_ORDERS_API, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt: sanitizeReceipt(body.receipt),
        payment_capture: 1, // auto-capture on success
        notes: { user_id: userId },
      }),
    });

    if (razorpayResponse.status === 401) {
      console.error('Razorpay rejected our credentials');
      return error('Payment gateway authentication failed', 401);
    }

    if (!razorpayResponse.ok) {
      const detail = await razorpayResponse.text();
      console.error('Razorpay order creation failed:', razorpayResponse.status, detail);
      return error('Could not create payment order', 500);
    }

    const order = await razorpayResponse.json();

    // Breakdown is returned so the client records the same figures it charged.
    return json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      breakdown: { subtotal, tax, shipping, total },
    });
  } catch (err) {
    console.error('Error in razorpay-create-order:', err);
    return error('Could not create payment order', 500);
  }
});
