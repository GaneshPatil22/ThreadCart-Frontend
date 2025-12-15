// ============================================================================
// CART SUMMARY
// ============================================================================
// Displays cart totals and checkout button
// ============================================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { supabase } from '../../utils/supabase';
import { TAX } from '../../utils/constants';

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
    navigate('/checkout');
  };

  return (
    <div className="bg-white rounded-lg border p-6 sticky top-4">
      <h2 className="text-xl font-semibold text-text-primary mb-4">
        Order Summary
      </h2>

      {/* Subtotal (excluding tax) */}
      <div className="flex justify-between text-text-secondary mb-2">
        <span>Subtotal ({cart.item_count} items)</span>
        <span>₹{cart.subtotal.toFixed(2)}</span>
      </div>

      {/* GST */}
      <div className="flex justify-between text-text-secondary mb-2">
        <span>GST ({TAX.GST_PERCENTAGE}%)</span>
        <span>₹{cart.tax.toFixed(2)}</span>
      </div>

      {/* Shipping Note */}
      <div className="flex justify-between text-text-secondary mb-4">
        <span>Shipping</span>
        <span className="text-gray-400 italic text-sm">Calculated at checkout</span>
      </div>

      {/* Divider */}
      <div className="border-t border-border my-4"></div>

      {/* Total */}
      <div className="flex justify-between text-lg font-semibold mb-2">
        <span className="text-text-primary">Subtotal</span>
        <span className="text-accent">₹{(cart.subtotal + cart.tax).toFixed(2)}</span>
      </div>
      <p className="text-xs text-text-secondary mb-4">Shipping calculated at checkout based on delivery location</p>

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
