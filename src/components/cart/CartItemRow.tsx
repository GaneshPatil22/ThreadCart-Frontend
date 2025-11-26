// ============================================================================
// CART ITEM ROW
// ============================================================================
// Individual cart item with image, details, quantity selector, and remove button
// ============================================================================

import { useState } from 'react';
import type { CartItemWithProduct } from '../../types/cart.types';
import { useCart } from '../../hooks/useCart';

interface CartItemRowProps {
  item: CartItemWithProduct;
}

export const CartItemRow: React.FC<CartItemRowProps> = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const product = item.product;

  // Check stock status
  const isOutOfStock = product.quantity === 0;
  const hasInsufficientStock = item.quantity > product.quantity;

  // Calculate subtotal
  const subtotal = product.price * item.quantity;

  // Handle quantity change
  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1) return;
    if (newQuantity > product.quantity) {
      alert(`Only ${product.quantity} units available in stock`);
      return;
    }

    setIsUpdating(true);
    await updateQuantity(product.id, newQuantity);
    setIsUpdating(false);
  };

  // Handle remove
  const handleRemove = async () => {
    if (!confirm('Remove this item from cart?')) return;

    setIsRemoving(true);
    await removeFromCart(product.id);
  };

  // Get first product image
  const productImage =
    product.image_url && product.image_url.length > 0
      ? product.image_url[0]
      : '/placeholder-product.png';

  return (
    <div
      className={`flex flex-col sm:flex-row gap-4 p-4 bg-white rounded-lg border ${
        isRemoving ? 'opacity-50' : ''
      }`}
    >
      {/* Product Image */}
      <div className="flex-shrink-0">
        <img
          src={productImage}
          alt={product.name}
          className="w-24 h-24 object-cover rounded-md"
          onError={(e) => {
            e.currentTarget.src = '/placeholder-product.png';
          }}
        />
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-semibold text-text-primary mb-1 truncate">
          {product.name}
        </h3>

        {/* Product Specs */}
        <div className="text-sm text-text-secondary space-y-0.5 mb-2">
          {product.part_number && <p>Part #: {product.part_number}</p>}
          {product.thread_style && <p>Thread: {product.thread_style}</p>}
          {product.Grade && <p>Grade: {product.Grade}</p>}
        </div>

        {/* Stock Warnings */}
        {isOutOfStock && (
          <p className="text-red-600 text-sm font-medium">Out of Stock</p>
        )}
        {hasInsufficientStock && !isOutOfStock && (
          <p className="text-orange-600 text-sm font-medium">
            Only {product.quantity} units available
          </p>
        )}

        {/* Price */}
        <p className="text-lg font-semibold text-primary mt-2">
          ${product.price.toFixed(2)}
        </p>
      </div>

      {/* Quantity & Actions */}
      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-4">
        {/* Quantity Selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleQuantityChange(item.quantity - 1)}
            disabled={isUpdating || item.quantity <= 1}
            className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Decrease quantity"
          >
            -
          </button>

          <input
            type="number"
            value={item.quantity}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              if (!isNaN(val)) handleQuantityChange(val);
            }}
            disabled={isUpdating}
            className="w-16 text-center border border-gray-300 rounded-md py-1 focus:outline-none focus:ring-2 focus:ring-primary"
            min="1"
            max={product.quantity}
          />

          <button
            onClick={() => handleQuantityChange(item.quantity + 1)}
            disabled={isUpdating || item.quantity >= product.quantity}
            className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        {/* Subtotal */}
        <p className="text-lg font-semibold text-text-primary">
          ${subtotal.toFixed(2)}
        </p>

        {/* Remove Button */}
        <button
          onClick={handleRemove}
          disabled={isRemoving}
          className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
          aria-label="Remove item"
        >
          Remove
        </button>
      </div>
    </div>
  );
};
