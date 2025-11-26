// ============================================================================
// RAZORPAY INTEGRATION UTILITIES
// ============================================================================
// Scaffolding for Razorpay payment integration
// Ready for Phase 7 implementation with actual API keys
// ============================================================================

import type {
  RazorpayConfig,
  RazorpayOrderOptions,
  RazorpayPaymentResponse,
} from '../types/order.types';

// ============================================================================
// RAZORPAY CONFIGURATION
// ============================================================================

// TODO: Add these to .env file
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_XXXXXXXX';

// ============================================================================
// LOAD RAZORPAY SCRIPT
// ============================================================================

export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    // Check if script already loaded
    if (document.getElementById('razorpay-script')) {
      resolve(true);
      return;
    }

    // Load Razorpay checkout script
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;

    script.onload = () => {
      resolve(true);
    };

    script.onerror = () => {
      console.error('Failed to load Razorpay script');
      resolve(false);
    };

    document.body.appendChild(script);
  });
};

// ============================================================================
// CREATE RAZORPAY ORDER (Backend Call)
// ============================================================================

// TODO: This should be a backend API call to create Razorpay order
// For now, this is a placeholder structure
export const createRazorpayOrder = async (
  options: RazorpayOrderOptions
): Promise<{ order_id: string; amount: number } | null> => {
  try {
    // TODO: Replace with actual backend API call
    // const response = await fetch('/api/razorpay/create-order', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(options),
    // });
    // const data = await response.json();
    // return data;

    console.log('Creating Razorpay order with options:', options);

    // PLACEHOLDER: Return mock order
    return {
      order_id: 'order_' + Date.now(),
      amount: options.amount,
    };
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return null;
  }
};

// ============================================================================
// VERIFY RAZORPAY PAYMENT (Backend Call)
// ============================================================================

// TODO: This should be a backend API call to verify payment signature
export const verifyRazorpayPayment = async (
  response: RazorpayPaymentResponse
): Promise<boolean> => {
  try {
    // TODO: Replace with actual backend API call
    // const verifyResponse = await fetch('/api/razorpay/verify-payment', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(response),
    // });
    // const data = await verifyResponse.json();
    // return data.verified;

    console.log('Verifying Razorpay payment:', response);

    // PLACEHOLDER: Return true for now
    return true;
  } catch (error) {
    console.error('Error verifying Razorpay payment:', error);
    return false;
  }
};

// ============================================================================
// INITIATE RAZORPAY CHECKOUT
// ============================================================================

export const initiateRazorpayCheckout = async (
  config: Omit<RazorpayConfig, 'key_id'>
): Promise<void> => {
  try {
    // Load Razorpay script
    const scriptLoaded = await loadRazorpayScript();

    if (!scriptLoaded) {
      alert('Failed to load payment gateway. Please try again.');
      return;
    }

    // Check if Razorpay is available
    if (!window.Razorpay) {
      alert('Payment gateway not available. Please refresh and try again.');
      return;
    }

    // Create Razorpay options
    const options: RazorpayConfig = {
      key_id: RAZORPAY_KEY_ID,
      ...config,
    };

    // Initialize Razorpay checkout
    const razorpay = new window.Razorpay(options);

    // Open checkout modal
    razorpay.open();
  } catch (error) {
    console.error('Error initiating Razorpay checkout:', error);
    alert('Failed to initiate payment. Please try again.');
  }
};

// ============================================================================
// RAZORPAY CHECKOUT FLOW HELPER
// ============================================================================

export interface CheckoutFlowParams {
  amount: number; // in rupees (will be converted to paise)
  order_number: string;
  user_name?: string;
  user_email?: string;
  user_phone?: string;
  onSuccess: (response: RazorpayPaymentResponse) => void;
  onFailure: (error: any) => void;
}

export const startRazorpayCheckout = async (
  params: CheckoutFlowParams
): Promise<void> => {
  try {
    const { amount, order_number, user_name, user_email, user_phone } = params;

    // Convert amount to paise (1 INR = 100 paise)
    const amountInPaise = Math.round(amount * 100);

    // Step 1: Create Razorpay order on backend
    const orderData = await createRazorpayOrder({
      amount: amountInPaise,
      currency: 'INR',
      receipt: order_number,
      notes: {
        order_number: order_number,
      },
    });

    if (!orderData) {
      params.onFailure({ message: 'Failed to create payment order' });
      return;
    }

    // Step 2: Initiate Razorpay checkout
    await initiateRazorpayCheckout({
      order_id: orderData.order_id,
      amount: amountInPaise,
      currency: 'INR',
      name: 'ThreadCart',
      description: `Order ${order_number}`,
      image: '/logo.jpeg', // Your logo URL
      prefill: {
        name: user_name,
        email: user_email,
        contact: user_phone,
      },
      theme: {
        color: '#e11d48', // Your primary color
      },
      handler: async (response: RazorpayPaymentResponse) => {
        // Step 3: Verify payment on backend
        const isVerified = await verifyRazorpayPayment(response);

        if (isVerified) {
          params.onSuccess(response);
        } else {
          params.onFailure({ message: 'Payment verification failed' });
        }
      },
    });
  } catch (error) {
    console.error('Error in startRazorpayCheckout:', error);
    params.onFailure(error);
  }
};

// ============================================================================
// TYPESCRIPT DECLARATIONS FOR RAZORPAY
// ============================================================================

declare global {
  interface Window {
    Razorpay: any;
  }
}

// ============================================================================
// BACKEND API ENDPOINTS (TO BE IMPLEMENTED)
// ============================================================================

/*
BACKEND REQUIREMENTS:

1. POST /api/razorpay/create-order
   - Creates Razorpay order using Razorpay API
   - Requires: amount, currency, receipt
   - Returns: { order_id, amount }
   - Uses Razorpay Orders API: https://razorpay.com/docs/api/orders/

2. POST /api/razorpay/verify-payment
   - Verifies payment signature using Razorpay secret
   - Requires: razorpay_order_id, razorpay_payment_id, razorpay_signature
   - Returns: { verified: boolean }
   - Uses crypto.createHmac to verify signature

3. Environment Variables Required:
   - RAZORPAY_KEY_ID (public key)
   - RAZORPAY_KEY_SECRET (secret key)

4. Install Razorpay Node SDK:
   npm install razorpay

5. Example Backend Code (Node.js):

   const Razorpay = require('razorpay');
   const crypto = require('crypto');

   const razorpay = new Razorpay({
     key_id: process.env.RAZORPAY_KEY_ID,
     key_secret: process.env.RAZORPAY_KEY_SECRET,
   });

   // Create Order
   app.post('/api/razorpay/create-order', async (req, res) => {
     const options = {
       amount: req.body.amount,
       currency: req.body.currency,
       receipt: req.body.receipt,
       notes: req.body.notes,
     };

     try {
       const order = await razorpay.orders.create(options);
       res.json({ order_id: order.id, amount: order.amount });
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
       .update(body.toString())
       .digest('hex');

     const verified = expectedSignature === razorpay_signature;
     res.json({ verified });
   });

RAZORPAY DOCUMENTATION:
- Orders API: https://razorpay.com/docs/api/orders/
- Payment Verification: https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/#verify-payment-signature
- Checkout.js: https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/
*/
