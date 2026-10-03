// ============================================================================
// RAZORPAY INTEGRATION UTILITIES
// ============================================================================
// Browser-side helpers only.
//
// Order creation and signature verification deliberately do NOT live here —
// both require the Razorpay key secret and run in Supabase Edge Functions:
//   supabase/functions/razorpay-create-order
//   supabase/functions/razorpay-verify-payment
// They are called from src/services/checkout.service.ts. Never reintroduce a
// client-side verification helper: anything the browser can compute, an
// attacker can forge.
// ============================================================================

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
// TYPESCRIPT DECLARATIONS FOR RAZORPAY
// ============================================================================

declare global {
  interface Window {
    Razorpay: any;
  }
}
