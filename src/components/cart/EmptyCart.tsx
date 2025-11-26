// ============================================================================
// EMPTY CART COMPONENT
// ============================================================================
// Displays empty state when cart has no items
// ============================================================================

import { Link } from 'react-router-dom';

export const EmptyCart = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* Empty Cart Icon */}
      <div className="mb-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-24 w-24 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      </div>

      {/* Message */}
      <h2 className="text-2xl font-semibold text-text-primary mb-2">
        Your cart is empty
      </h2>
      <p className="text-text-secondary mb-8 text-center max-w-md">
        Looks like you haven't added any items to your cart yet. Start shopping to fill it up!
      </p>

      {/* Continue Shopping Button */}
      <Link
        to="/"
        className="bg-primary text-white px-8 py-3 rounded-lg font-medium hover:bg-primary-hover transition-colors"
      >
        Continue Shopping
      </Link>
    </div>
  );
};
