# Razorpay Setup Guide

> **Current Status:** COD (Cash on Delivery) is working. Razorpay is disabled until API keys are configured.

---

## Quick Setup (5 minutes)

### Step 1: Get Razorpay API Keys

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Sign up / Login
3. Go to **Settings → API Keys**
4. Generate a new key pair (Test Mode first)
5. Copy:
   - `Key ID` (starts with `rzp_test_` or `rzp_live_`)
   - `Key Secret` (keep this safe, needed for backend)

---

### Step 2: Add Environment Variable

Create or edit `.env.local` in project root:

```env
# Razorpay Configuration
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
```

**That's it!** Restart dev server and Razorpay will be enabled.

---

## Files Reference

### Files That Use Razorpay Config

| File | Purpose |
|------|---------|
| `src/services/checkout.service.ts` | Reads `VITE_RAZORPAY_KEY_ID`, initiates payment |
| `src/utils/razorpay.ts` | Loads Razorpay script, payment utilities |
| `src/components/checkout/PaymentMethodSelector.tsx` | Shows/hides Razorpay option based on config |

---

### Key Code Locations

#### 1. Environment Variable Check
**File:** `src/services/checkout.service.ts` (Line ~35)
```typescript
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || '';
```

#### 2. Razorpay Availability Check
**File:** `src/services/checkout.service.ts` (Line ~188)
```typescript
export const isRazorpayConfigured = (): boolean => {
  return Boolean(RAZORPAY_KEY_ID && RAZORPAY_KEY_ID !== 'rzp_test_XXXXXXXX');
};
```

#### 3. Payment Initiation
**File:** `src/services/checkout.service.ts` (Line ~125-180)
- Loads Razorpay script
- Opens payment modal
- Handles success/failure callbacks

---

## Test Cards (Razorpay Test Mode)

| Card Number | Result |
|-------------|--------|
| `4111 1111 1111 1111` | Success |
| `4000 0000 0000 0002` | Failure |

- **CVV:** Any 3 digits (e.g., `123`)
- **Expiry:** Any future date (e.g., `12/25`)
- **OTP:** `1234` (for test mode)

---

## Environment Files

```
ThreadCart/
├── .env.development      # Development settings
├── .env.production       # Production settings
├── .env.local           # Local overrides (add Razorpay key here)
└── .env.example         # Template (create this for team)
```

### Recommended `.env.local` (for development)
```env
# Supabase (already configured)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Razorpay (add when ready)
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
```

### Production `.env.production`
```env
# Use LIVE keys in production
VITE_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx
```

---

## How It Works (Flow)

```
User clicks "Pay $X.XX"
        ↓
isRazorpayConfigured() checks if key exists
        ↓
    ┌───┴───┐
    │       │
  Yes       No
    │       │
    ↓       ↓
Load      Show error:
Razorpay  "Payment gateway
script    not configured"
    │
    ↓
Open Razorpay checkout modal
    │
    ↓
User completes payment
    │
    ↓
On success → Create order in DB → Navigate to success page
On failure → Show error → Stay on checkout
On cancel  → Close modal → Stay on checkout
```

---

## Backend Integration (Optional - For Production)

> **Note:** Current implementation works without backend for TEST MODE.
> For PRODUCTION with signature verification, you need a backend.

### Why Backend is Needed for Production

1. **Security:** Razorpay Key Secret should NEVER be exposed to frontend
2. **Verification:** Payment signature must be verified server-side
3. **Reliability:** Prevents payment fraud

### Backend Endpoints Required

```
POST /api/razorpay/create-order
  - Creates Razorpay order
  - Returns: { order_id, amount }

POST /api/razorpay/verify-payment
  - Verifies payment signature
  - Returns: { verified: boolean }
```

### Backend Code (Node.js/Express)

**File to create:** `server/razorpay.js` or use Supabase Edge Functions

```javascript
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET, // SECRET - backend only!
});

// Create Order
app.post('/api/razorpay/create-order', async (req, res) => {
  try {
    const { amount, currency, receipt } = req.body;

    const order = await razorpay.orders.create({
      amount: amount * 100, // Convert to paise
      currency: currency || 'INR',
      receipt: receipt,
    });

    res.json({
      order_id: order.id,
      amount: order.amount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify Payment
app.post('/api/razorpay/verify-payment', (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  const verified = expectedSignature === razorpay_signature;
  res.json({ verified });
});
```

### Update Frontend for Backend Integration

**File:** `src/services/checkout.service.ts`

Replace the `initiateRazorpayPayment` function to call your backend:

```typescript
// Instead of generating order_id on frontend,
// call your backend to create a Razorpay order:

const response = await fetch('/api/razorpay/create-order', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: cart.total,
    currency: 'INR',
    receipt: `order_${Date.now()}`,
  }),
});

const { order_id } = await response.json();

// Use this order_id in Razorpay options
const options = {
  key: RAZORPAY_KEY_ID,
  order_id: order_id, // From backend
  // ... rest of options
};
```

---

## Supabase Edge Function Alternative

If you don't want a separate backend, use Supabase Edge Functions:

**File:** `supabase/functions/create-razorpay-order/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID')
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')

serve(async (req) => {
  const { amount, currency, receipt } = await req.json()

  const auth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)

  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: amount * 100,
      currency: currency || 'INR',
      receipt: receipt,
    }),
  })

  const order = await response.json()

  return new Response(
    JSON.stringify({ order_id: order.id, amount: order.amount }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

---

## Checklist

### Minimum Setup (Test Mode)
- [ ] Create Razorpay account
- [ ] Get Test API Key ID
- [ ] Add `VITE_RAZORPAY_KEY_ID` to `.env.local`
- [ ] Restart dev server
- [ ] Test with test card

### Production Setup
- [ ] Get Live API Keys
- [ ] Set up backend for signature verification
- [ ] Add `RAZORPAY_KEY_SECRET` to backend env (NEVER in frontend!)
- [ ] Update frontend to call backend endpoints
- [ ] Test with real card (small amount)
- [ ] Enable live mode in Razorpay dashboard

---

## Troubleshooting

### "Payment gateway not configured"
- Check if `VITE_RAZORPAY_KEY_ID` is in `.env.local`
- Restart dev server after adding env variable
- Check browser console for errors

### "Failed to load payment gateway"
- Check internet connection
- Razorpay CDN might be blocked (try VPN)
- Check browser console for script loading errors

### Payment succeeds but order not created
- Check Supabase connection
- Check browser console for errors
- Verify `orders` table exists with correct schema

### Razorpay modal not opening
- Check if script loaded: `window.Razorpay` should exist
- Check for JavaScript errors in console
- Try in incognito mode (extensions might block)

---

## Links

- [Razorpay Dashboard](https://dashboard.razorpay.com)
- [Razorpay Docs - Web Integration](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/)
- [Razorpay API Reference](https://razorpay.com/docs/api/)
- [Test Cards](https://razorpay.com/docs/payments/payments/test-card-upi-details/)

---

## Summary

| Mode | What You Need | Works Now? |
|------|---------------|------------|
| **COD** | Nothing | ✅ Yes |
| **Razorpay Test** | `VITE_RAZORPAY_KEY_ID` only | ✅ After adding key |
| **Razorpay Live** | Key ID + Backend + Key Secret | Needs backend setup |

---

**Last Updated:** December 2024
