// ============================================================================
// SUPABASE EDGE FUNCTION: RAZORPAY VERIFY PAYMENT
// ============================================================================
// Verifies the signature Razorpay returns after a successful checkout.
//
// Razorpay signs `{order_id}|{payment_id}` with HMAC-SHA256 using the account's
// key secret. Only someone holding that secret can produce a valid signature,
// so a matching signature proves the payment is genuine. The secret lives only
// in this function's environment and never reaches the browser.
//
// The caller must be logged in, and an order is only written to the database
// after this endpoint returns verified: true.
//
// Required environment variables (set with `supabase secrets set ...`):
//   RAZORPAY_KEY_SECRET
// ============================================================================

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET') ?? '';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RequestBody {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
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

/** HMAC-SHA256 of `payload` keyed with `secret`, hex encoded. */
async function hmacSha256Hex(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Length-independent constant-time string comparison. Avoids leaking how much
 * of a forged signature was correct via response timing.
 */
const timingSafeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
};

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return error('Method not allowed', 405);

  // ---- Config sanity ----
  if (!RAZORPAY_KEY_SECRET) {
    console.error('RAZORPAY_KEY_SECRET missing');
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

  // ---- Parse body ----
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return error('Invalid JSON body');
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return error('Missing razorpay_order_id, razorpay_payment_id or razorpay_signature');
  }

  try {
    const expected = await hmacSha256Hex(
      `${razorpay_order_id}|${razorpay_payment_id}`,
      RAZORPAY_KEY_SECRET
    );

    if (!timingSafeEqual(expected, razorpay_signature)) {
      // Do NOT treat this as paid. Logged so genuine failures are debuggable.
      console.warn('Signature mismatch for order', razorpay_order_id);
      return json({ verified: false, error: 'Payment signature verification failed' }, 400);
    }

    return json({ verified: true });
  } catch (err) {
    console.error('Error in razorpay-verify-payment:', err);
    return error('Could not verify payment', 500);
  }
});
