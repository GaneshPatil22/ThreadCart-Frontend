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
        {/* Free Packaging */}
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
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
          <div>
            <h3 className="font-semibold text-text-primary mb-1">Free Packaging</h3>
            <p className="text-sm text-text-secondary">
              On all orders
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

        {/* Quality Assured */}
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
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          <div>
            <h3 className="font-semibold text-text-primary mb-1">Quality Assured</h3>
            <p className="text-sm text-text-secondary">
              Certified products
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
