// ============================================================================
// PAYMENT METHOD SELECTOR
// ============================================================================
// Component to display payment method (Online Payment via Razorpay)
// ============================================================================

import { isRazorpayConfigured, isRazorpayTestMode } from '../../services/checkout.service';

export const PaymentMethodSelector = () => {
  const razorpayAvailable = isRazorpayConfigured();
  const isTestMode = isRazorpayTestMode();

  return (
    <div className="space-y-3">
      <div
        className={`flex items-start gap-4 p-4 border rounded-lg transition-all border-accent bg-accent-light ring-1 ring-accent ${
          !razorpayAvailable ? 'opacity-50' : ''
        }`}
      >
        <div className="mt-1">
          <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-text-primary">Pay Online</span>
            {razorpayAvailable && (
              <>
                <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                  Secure
                </span>
                {isTestMode && (
                  <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">
                    Test Mode
                  </span>
                )}
              </>
            )}
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            {razorpayAvailable
              ? 'Credit/Debit Card, UPI, Net Banking, Wallets'
              : 'Not configured - Contact admin'}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <img src="https://cdn.razorpay.com/logos/BUVwvgaqVByGp2_medium.png" alt="Razorpay" className="h-6" />
        </div>
      </div>
    </div>
  );
};
