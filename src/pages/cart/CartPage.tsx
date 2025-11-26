// ============================================================================
// CART PAGE
// ============================================================================
// Full cart page with items list and summary
// ============================================================================

import { useCart } from '../../hooks/useCart';
import { CartItemRow } from '../../components/cart/CartItemRow';
import { CartSummary } from '../../components/cart/CartSummary';
import { EmptyCart } from '../../components/cart/EmptyCart';

export const CartPage = () => {
  const { cart, loading, error, clearCart } = useCart();

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-text-secondary">Loading your cart...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 font-medium mb-2">Error loading cart</p>
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // Empty cart
  if (!cart || cart.item_count === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyCart />
      </div>
    );
  }

  // Cart with items
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Shopping Cart</h1>
        <p className="text-text-secondary">
          {cart.item_count} {cart.item_count === 1 ? 'item' : 'items'} in your cart
        </p>
      </div>

      {/* Cart Layout: Items + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items - Left Side (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Clear Cart Button */}
          {cart.item_count > 0 && (
            <div className="flex justify-end mb-4">
              <button
                onClick={async () => {
                  if (confirm('Are you sure you want to clear your cart?')) {
                    await clearCart();
                  }
                }}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Clear Cart
              </button>
            </div>
          )}

          {/* Cart Items List */}
          {cart.items.map((item) => (
            <CartItemRow key={item.id} item={item} />
          ))}
        </div>

        {/* Cart Summary - Right Side (1/3 width) */}
        <div className="lg:col-span-1">
          <CartSummary />
        </div>
      </div>

      {/* Additional Info Section */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Free Shipping */}
        <div className="flex items-start gap-4 p-4 bg-white rounded-lg border">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-primary flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
            />
          </svg>
          <div>
            <h3 className="font-semibold text-text-primary mb-1">Free Shipping</h3>
            <p className="text-sm text-text-secondary">
              On orders over $100
            </p>
          </div>
        </div>

        {/* Secure Checkout */}
        <div className="flex items-start gap-4 p-4 bg-white rounded-lg border">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-primary flex-shrink-0"
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
          <div>
            <h3 className="font-semibold text-text-primary mb-1">Secure Payment</h3>
            <p className="text-sm text-text-secondary">
              100% secure transactions
            </p>
          </div>
        </div>

        {/* Easy Returns */}
        <div className="flex items-start gap-4 p-4 bg-white rounded-lg border">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-primary flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <div>
            <h3 className="font-semibold text-text-primary mb-1">Easy Returns</h3>
            <p className="text-sm text-text-secondary">
              30-day return policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
