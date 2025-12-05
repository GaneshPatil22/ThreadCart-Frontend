// ============================================================================
// CHECKOUT ITEM ROW COMPONENT
// ============================================================================
// Compact display of a cart item in checkout summary
// ============================================================================

import type { CartItemWithProduct } from '../../types/cart.types';

interface CheckoutItemRowProps {
  item: CartItemWithProduct;
}

export const CheckoutItemRow = ({ item }: CheckoutItemRowProps) => {
  const { product, quantity } = item;
  const itemTotal = product.price * quantity;

  // Get the first image or use placeholder
  const imageUrl =
    product.image_url && product.image_url.length > 0
      ? product.image_url[0]
      : '/placeholder-product.png';

  return (
    <div className="flex gap-4 py-3 border-b border-border last:border-b-0">
      {/* Product Image */}
      <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder-product.png';
          }}
        />
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-text-primary text-sm line-clamp-2">
          {product.name}
        </h4>
        <div className="mt-1 flex items-center gap-2 text-xs text-text-secondary">
          {product.part_number && (
            <span className="bg-gray-100 px-2 py-0.5 rounded">
              {product.part_number}
            </span>
          )}
          <span>Qty: {quantity}</span>
        </div>
      </div>

      {/* Price */}
      <div className="text-right flex-shrink-0">
        <p className="font-semibold text-text-primary">${itemTotal.toFixed(2)}</p>
        {quantity > 1 && (
          <p className="text-xs text-text-secondary">
            ${product.price.toFixed(2)} each
          </p>
        )}
      </div>
    </div>
  );
};
