// ============================================================================
// CART ITEM ROW
// ============================================================================
// Individual cart item with image, details, quantity selector, and remove button
// ============================================================================

import { useState, useEffect } from 'react';
import type { CartItemWithProduct } from '../../types/cart.types';
import { useCart } from '../../hooks/useCart';
import { getDisplayUrl, handleImageError, PLACEHOLDER_IMAGE } from '../../utils/imageUtils';

interface CartItemRowProps {
  item: CartItemWithProduct;
}

export const CartItemRow: React.FC<CartItemRowProps> = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [inputQuantity, setInputQuantity] = useState<string>(String(item.quantity));
  const [isEditing, setIsEditing] = useState(false);

  // Sync local input when item.quantity changes from outside (e.g., after API update)
  useEffect(() => {
    if (!isEditing) {
      setInputQuantity(String(item.quantity));
    }
  }, [item.quantity]);

  const product = item.product;

  // Check stock status
  const isOutOfStock = product.quantity === 0;
  const hasInsufficientStock = item.quantity > product.quantity;

  // Calculate subtotal
  const subtotal = product.price * item.quantity;

  // Handle quantity change via +/- buttons (immediate API call)
  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1) return;
    if (newQuantity > product.quantity) {
      alert(`Only ${product.quantity} units available in stock`);
      return;
    }

    setInputQuantity(String(newQuantity));
    setIsUpdating(true);
    await updateQuantity(product.id, newQuantity);
    setIsUpdating(false);
  };

  // Commit the typed quantity (called on blur or Enter)
  const commitQuantity = async () => {
    setIsEditing(false);
    const newQuantity = parseInt(inputQuantity);

    // Invalid or unchanged - reset
    if (isNaN(newQuantity) || newQuantity < 1) {
      setInputQuantity(String(item.quantity));
      return;
    }

    // Same as current - no API call needed
    if (newQuantity === item.quantity) return;

    // Exceeds stock - show error and reset
    if (newQuantity > product.quantity) {
      alert(`Only ${product.quantity} units available in stock`);
      setInputQuantity(String(item.quantity));
      return;
    }

    setIsUpdating(true);
    const result = await updateQuantity(product.id, newQuantity);
    if (!result.success) {
      setInputQuantity(String(item.quantity));
    }
    setIsUpdating(false);
  };

  // Handle remove
  const handleRemove = async () => {
    if (!confirm('Remove this item from cart?')) return;

    setIsRemoving(true);
    await removeFromCart(product.id);
  };

  // Get product images
  const productImages =
    product.image_url && product.image_url.length > 0
      ? product.image_url
      : [PLACEHOLDER_IMAGE];

  // Image navigation
  const handlePrevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? productImages.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === productImages.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <div
      className={`flex flex-col sm:flex-row gap-4 p-4 bg-white rounded-lg border ${
        isRemoving ? 'opacity-50' : ''
      }`}
    >
      {/* Product Image Carousel */}
      <div className="flex-shrink-0 relative w-32 h-32">
        <img
          src={getDisplayUrl(productImages[currentImageIndex])}
          alt={product.name}
          className="w-full h-full object-contain rounded-md border cursor-pointer"
          onClick={() => setShowModal(true)}
          onError={handleImageError}
        />

        {/* Navigation Arrows */}
        {productImages.length > 1 && (
          <>
            <button
              onClick={handlePrevImage}
              className="absolute top-1/2 left-1 -translate-y-1/2 bg-white/70 hover:bg-white rounded-full p-1 text-xs shadow-md"
              aria-label="Previous image"
            >
              ◀
            </button>
            <button
              onClick={handleNextImage}
              className="absolute top-1/2 right-1 -translate-y-1/2 bg-white/70 hover:bg-white rounded-full p-1 text-xs shadow-md"
              aria-label="Next image"
            >
              ▶
            </button>
          </>
        )}

        {/* Image Indicator Dots */}
        {productImages.length > 1 && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
            {productImages.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i === currentImageIndex ? 'bg-gray-800' : 'bg-gray-400'
                }`}
              ></div>
            ))}
          </div>
        )}
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
        <p className="text-lg font-semibold text-accent mt-2">
          ₹{product.price.toFixed(2)}
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
            value={inputQuantity}
            onChange={(e) => {
              setIsEditing(true);
              setInputQuantity(e.target.value);
            }}
            onBlur={commitQuantity}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
              }
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
          ₹{subtotal.toFixed(2)}
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

      {/* Fullscreen Image Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setShowModal(false)}
        >
          <div
            className="relative max-w-full max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={getDisplayUrl(productImages[currentImageIndex])}
              alt={product.name}
              className="max-w-[90vw] max-h-[80vh] object-contain cursor-zoom-in"
              onClick={(e) => {
                e.currentTarget.classList.toggle('scale-150');
                e.currentTarget.classList.toggle('cursor-zoom-out');
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
