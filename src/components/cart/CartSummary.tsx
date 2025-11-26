// ============================================================================
// CART SUMMARY
// ============================================================================
// Displays cart totals and checkout button
// ============================================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { supabase } from '../../utils/supabase';

export const CartSummary = () => {
  const { cart } = useCart();
  const navigate = useNavigate();
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);

  if (!cart) return null;

  const handleCheckout = async () => {
    setIsCheckingAuth(true);

    // Check if user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession();

    setIsCheckingAuth(false);

    if (!session) {
      // Show login prompt for anonymous users
      alert('Please login to continue with checkout');
      // TODO: Open auth modal or redirect to login
      return;
    }

    // Proceed to checkout
    // TODO: Navigate to checkout page (Phase 7)
    alert('Checkout functionality coming soon!');
  };

  return (
    <div className="bg-white rounded-lg border p-6 sticky top-4">
      <h2 className="text-xl font-semibold text-text-primary mb-4">
        Order Summary
      </h2>

      {/* Cart Items Count */}
      <div className="flex justify-between text-text-secondary mb-2">
        <span>Items ({cart.item_count})</span>
        <span>${cart.subtotal.toFixed(2)}</span>
      </div>

      {/* Tax (Future) */}
      <div className="flex justify-between text-text-secondary mb-2">
        <span>Tax</span>
        <span>${cart.tax.toFixed(2)}</span>
      </div>

      {/* Shipping (Future) */}
      <div className="flex justify-between text-text-secondary mb-4">
        <span>Shipping</span>
        <span>{cart.shipping === 0 ? 'FREE' : `$${cart.shipping.toFixed(2)}`}</span>
      </div>

      {/* Divider */}
      <div className="border-t border-border my-4"></div>

      {/* Total */}
      <div className="flex justify-between text-lg font-semibold text-text-primary mb-6">
        <span>Total</span>
        <span>${cart.total.toFixed(2)}</span>
      </div>

      {/* Checkout Button */}
      <button
        onClick={handleCheckout}
        disabled={isCheckingAuth || cart.item_count === 0}
        className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isCheckingAuth ? 'Checking...' : 'Proceed to Checkout'}
      </button>

      {/* Continue Shopping Link */}
      <button
        onClick={() => navigate('/')}
        className="w-full mt-3 text-primary hover:text-primary-hover font-medium py-2"
      >
        Continue Shopping
      </button>

      {/* Security Note */}
      <div className="mt-6 text-xs text-text-secondary text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 inline-block mr-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        Secure checkout powered by Razorpay
      </div>
    </div>
  );
};
