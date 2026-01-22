import { useState, useEffect, useCallback } from "react";
import { useCart } from "../../hooks/useCart";
import { convertGoogleDriveUrl, handleImageError } from "../../utils/imageUtils";
import { trackAddToCart } from "../../utils/analytics";

/**
 * Checks if a value represents "STANDARD" (0 or -1).
 */
const isStandardValue = (value: string | number | null | undefined): boolean => {
  if (typeof value === "number") {
    return value === 0 || value === -1;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "0" || trimmed === "-1";
  }
  return false;
};

/**
 * Checks if a specification value should be displayed.
 * - Show if value is 0 or -1 (will display as "STANDARD")
 * - Show if value is a valid non-empty string
 * - Hide if null, undefined, NaN, or empty
 */
const shouldShowSpec = (value: string | number | null | undefined): boolean => {
  // Show if it's a "STANDARD" value (0 or -1)
  if (isStandardValue(value)) {
    return true;
  }

  // Hide null/undefined
  if (value === null || value === undefined) {
    return false;
  }

  // Hide NaN
  if (typeof value === "number" && isNaN(value)) {
    return false;
  }

  // Hide empty strings and invalid string values
  if (typeof value === "string") {
    const trimmed = value.trim().toLowerCase();
    if (trimmed === "" || trimmed === "null" || trimmed === "nan" || trimmed === "undefined") {
      return false;
    }
  }

  // Show valid values
  return true;
};

/**
 * Formats a product specification value.
 * Returns "STANDARD" for 0 or -1, otherwise returns the original value.
 */
const formatSpecValue = (value: string | number | null | undefined): string => {
  // Return "STANDARD" for 0 or -1
  if (isStandardValue(value)) {
    return "STANDARD";
  }

  // Return the value as-is (shouldShowSpec already filters invalid values)
  if (typeof value === "number") {
    return String(value);
  }

  return value ?? "";
};

interface ProductDetailProps {
  name: string;
  image: string[]; // multiple images
  desc?: string;
  quantity: number;
  productId: number;
  price: number;
  thread_style?: string | null;
  thread_size_pitch?: string | null;
  fastener_length?: string | null;
  head_height?: string | null;
  Coating?: string | null;
  part_number?: string | null;
  Material?: string | null;
  hsnSac?: string | null;
}

export default function ShortProductDetail({
  name,
  image,
  desc,
  quantity,
  productId,
  price,
  thread_style,
  thread_size_pitch,
  fastener_length,
  head_height,
  Coating,
  part_number,
  Material,
  hsnSac,
}: ProductDetailProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartQuantity, setCartQuantity] = useState(1);

  const { addToCart, isInCart, getItemQuantity } = useCart();

  // Handle swipe (basic)
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? image.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === image.length - 1 ? 0 : prev + 1));
  };

  const handleAddToCart = async () => {
    if (quantity === 0) {
      alert("This product is out of stock");
      return;
    }

    // Get current quantity in cart
    const currentInCart = getItemQuantity(productId);
    const availableStock = quantity - currentInCart;

    // Check if trying to add more than available
    if (cartQuantity > availableStock) {
      alert(
        `Only ${availableStock} more units can be added (${currentInCart} already in cart, ${quantity} total stock)`
      );
      return;
    }

    setAddingToCart(true);
    const result = await addToCart(productId, cartQuantity);
    setAddingToCart(false);

    if (result.success) {
      // Track add to cart event
      trackAddToCart({ id: productId, name, price }, cartQuantity);
      setCartQuantity(1); // Reset quantity after adding
      alert(`Successfully added ${cartQuantity} item(s) to cart!`);
    } else {
      alert(result.message);
    }
  };

  const handleQuantityChange = (newQty: number) => {
    if (newQty < 1) return;

    // Get current quantity in cart
    const currentInCart = getItemQuantity(productId);
    const availableStock = quantity - currentInCart;

    // Check if trying to select more than available
    if (newQty > availableStock) {
      alert(
        `Only ${availableStock} more units available (${currentInCart} already in cart, ${quantity} total stock)`
      );
      return;
    }

    setCartQuantity(newQty);
  };

  return (
    <div className="bg-gray-50 p-3 sm:p-4 border-t border-gray-200 flex flex-col sm:flex-row gap-4">
      {/* Image Carousel */}
      <div className="relative w-full sm:w-32 h-48 sm:h-32 flex-shrink-0 mx-auto sm:mx-0 max-w-[200px] sm:max-w-none">
        <img
          src={convertGoogleDriveUrl(image[currentIndex])}
          alt={name}
          className="w-full h-full object-contain rounded border cursor-pointer"
          onClick={() => setShowModal(true)}
          onError={handleImageError}
        />

        {/* Left/Right Navigation (Optional) */}
        {image.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute top-1/2 left-1 -translate-y-1/2 bg-white/70 hover:bg-white rounded-full p-2 sm:p-1 text-sm sm:text-xs"
            >
              ◀
            </button>
            <button
              onClick={handleNext}
              className="absolute top-1/2 right-1 -translate-y-1/2 bg-white/70 hover:bg-white rounded-full p-2 sm:p-1 text-sm sm:text-xs"
            >
              ▶
            </button>
          </>
        )}

        {/* Dots Indicator */}
        {image.length > 1 && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
            {image.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i === currentIndex ? "bg-gray-800" : "bg-gray-400"
                }`}
              ></div>
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-800 mb-2 text-base sm:text-lg">{name}</h3>
        {desc && desc.trim() && (
          <p className="text-gray-600 text-xs sm:text-sm mb-3">{desc}</p>
        )}

        {/* Product Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mb-3 text-xs sm:text-sm">
          <div>
            <span className="text-gray-500">Price:</span>
            <span className="ml-2 font-semibold text-accent">₹{price}</span>
          </div>

          {/* <div>
            <span className="text-gray-500">Stock:</span>
            <span className="ml-2 font-semibold">
              {quantity > 0 ? (
                <>
                  {quantity} available
                  {isInCart(productId) && (
                    <span className="text-orange-600 text-xs ml-1">
                      ({quantity - getItemQuantity(productId)} more can be added)
                    </span>
                  )}
                </>
              ) : (
                <span className="text-red-600">Out of Stock</span>
              )}
            </span>
          </div> */}

          {shouldShowSpec(part_number) && (
            <div>
              <span className="text-gray-500">Part Number:</span>
              <span className="ml-2 font-medium text-gray-800">
                {formatSpecValue(part_number)}
              </span>
            </div>
          )}

          {shouldShowSpec(thread_style) && (
            <div>
              <span className="text-gray-500">Thread Style:</span>
              <span className="ml-2 font-medium text-gray-800">
                {formatSpecValue(thread_style)}
              </span>
            </div>
          )}

          {shouldShowSpec(thread_size_pitch) && (
            <div>
              <span className="text-gray-500">Thread Size/Pitch:</span>
              <span className="ml-2 font-medium text-gray-800">
                {formatSpecValue(thread_size_pitch)}
              </span>
            </div>
          )}

          {shouldShowSpec(fastener_length) && (
            <div>
              <span className="text-gray-500">Fastener Length:</span>
              <span className="ml-2 font-medium text-gray-800">
                {formatSpecValue(fastener_length)}
              </span>
            </div>
          )}

          {shouldShowSpec(head_height) && (
            <div>
              <span className="text-gray-500">Head Height:</span>
              <span className="ml-2 font-medium text-gray-800">
                {formatSpecValue(head_height)}
              </span>
            </div>
          )}

          {shouldShowSpec(Coating) && (
            <div>
              <span className="text-gray-500">Finish:</span>
              <span className="ml-2 font-medium text-gray-800">{formatSpecValue(Coating)}</span>
            </div>
          )}

          {shouldShowSpec(Material) && (
            <div>
              <span className="text-gray-500">Material:</span>
              <span className="ml-2 font-medium text-gray-800">{formatSpecValue(Material)}</span>
            </div>
          )}

          {shouldShowSpec(hsnSac) && (
            <div>
              <span className="text-gray-500">HSN/SAC:</span>
              <span className="ml-2 font-medium text-gray-800">{formatSpecValue(hsnSac)}</span>
            </div>
          )}
        </div>

        {/* Add to Cart Section */}
        <div className="flex flex-col gap-3 mt-4">
          {/* Cart Status - Show at top if in cart */}
          {isInCart(productId) && (
            <div className="flex items-center gap-2 text-green-600 font-semibold text-xs sm:text-sm">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>In Cart: {getItemQuantity(productId)} unit(s)</span>
            </div>
          )}

          {/* Quantity Selector & Add to Cart Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Quantity Row */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Quantity Label */}
              <span className="text-xs sm:text-sm text-gray-600 font-medium">Quantity:</span>

              {/* Quantity Selector */}
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={() => handleQuantityChange(cartQuantity - 1)}
                  disabled={cartQuantity <= 1}
                  className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center border-2 border-gray-300 rounded-md hover:bg-gray-100 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-base sm:text-lg active:bg-gray-200"
                >
                  -
                </button>
                <input
                  type="number"
                  value={cartQuantity}
                  onChange={(e) =>
                    handleQuantityChange(parseInt(e.target.value) || 1)
                  }
                  className="w-16 sm:w-20 text-center border-2 border-gray-300 rounded-md py-2 text-base sm:text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  min="1"
                  max={quantity - getItemQuantity(productId)}
                />
                <button
                  onClick={() => handleQuantityChange(cartQuantity + 1)}
                  disabled={cartQuantity >= quantity - getItemQuantity(productId)}
                  className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center border-2 border-gray-300 rounded-md hover:bg-gray-100 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-base sm:text-lg active:bg-gray-200"
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to Cart Button - LARGE & PROMINENT */}
            <button
              onClick={handleAddToCart}
              disabled={
                addingToCart ||
                quantity === 0 ||
                quantity - getItemQuantity(productId) === 0
              }
              className="w-full sm:w-auto sm:flex-1 bg-primary text-white px-6 sm:px-8 py-3 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base font-bold shadow-md hover:shadow-lg active:shadow-sm"
            >
                {addingToCart ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Adding...
                </span>
              ) : quantity - getItemQuantity(productId) === 0 ? (
                "✓ All in Cart"
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                  </svg>
                  Add to Cart
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Fullscreen Image Modal - Amazon Style */}
      {showModal && (
        <FullscreenImageViewer
          images={image}
          currentIndex={currentIndex}
          onClose={() => setShowModal(false)}
          onIndexChange={setCurrentIndex}
          productName={name}
        />
      )}
    </div>
  );
}

/**
 * Amazon-style Fullscreen Image Viewer Component
 */
interface FullscreenImageViewerProps {
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
  productName: string;
}

function FullscreenImageViewer({
  images,
  currentIndex,
  onClose,
  onIndexChange,
  productName,
}: FullscreenImageViewerProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [mainImageLoaded, setMainImageLoaded] = useState(false);
  const [loadedThumbnails, setLoadedThumbnails] = useState<Set<number>>(new Set());

  // Reset loading state when image changes
  useEffect(() => {
    setMainImageLoaded(false);
    setIsZoomed(false);
  }, [currentIndex]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        onIndexChange(currentIndex === 0 ? images.length - 1 : currentIndex - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        onIndexChange(currentIndex === images.length - 1 ? 0 : currentIndex + 1);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    },
    [currentIndex, images.length, onIndexChange, onClose]
  );

  // Add keyboard event listener
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [handleKeyDown]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    onIndexChange(currentIndex === 0 ? images.length - 1 : currentIndex - 1);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    onIndexChange(currentIndex === images.length - 1 ? 0 : currentIndex + 1);
  };

  const handleThumbnailClick = (index: number) => {
    onIndexChange(index);
  };

  const handleThumbnailLoad = (index: number) => {
    setLoadedThumbnails((prev) => new Set(prev).add(index));
  };

  return (
    <div
      className="fixed inset-0 bg-black/95 flex flex-col z-50"
      onClick={onClose}
    >
      {/* Header with close button and image counter */}
      <div className="flex items-center justify-between p-3 sm:p-4 text-white">
        <div className="text-sm sm:text-base font-medium truncate max-w-[60%]">
          {productName}
        </div>
        <div className="flex items-center gap-4">
          {images.length > 1 && (
            <span className="text-sm text-gray-300">
              {currentIndex + 1} / {images.length}
            </span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            title="Close (Esc)"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Image Area */}
      <div
        className="flex-1 flex items-center justify-center relative px-4 sm:px-16"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Arrow */}
        {images.length > 1 && (
          <button
            onClick={handlePrev}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white z-10"
            title="Previous (←)"
          >
            <svg
              className="w-6 h-6 sm:w-8 sm:h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        )}

        {/* Main Image with Loading State */}
        <div className="relative flex items-center justify-center">
          {/* Loading Skeleton */}
          {!mainImageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 sm:w-80 sm:h-80 bg-gray-800 rounded-lg animate-pulse flex flex-col items-center justify-center gap-3">
                <svg
                  className="w-12 h-12 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-gray-500 text-sm">Loading image...</span>
              </div>
            </div>
          )}

          {/* Actual Image */}
          <img
            src={convertGoogleDriveUrl(images[currentIndex])}
            alt={`${productName} - Image ${currentIndex + 1}`}
            className={`max-w-full max-h-[60vh] sm:max-h-[70vh] object-contain transition-all duration-200 ${
              isZoomed ? "scale-150 cursor-zoom-out" : "cursor-zoom-in"
            } ${mainImageLoaded ? "opacity-100" : "opacity-0"}`}
            onClick={(e) => {
              e.stopPropagation();
              setIsZoomed(!isZoomed);
            }}
            onLoad={() => setMainImageLoaded(true)}
            onError={(e) => {
              handleImageError(e);
              setMainImageLoaded(true);
            }}
            draggable={false}
          />
        </div>

        {/* Right Arrow */}
        {images.length > 1 && (
          <button
            onClick={handleNext}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white z-10"
            title="Next (→)"
          >
            <svg
              className="w-6 h-6 sm:w-8 sm:h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Thumbnail Strip - Always shows placeholders for total image count */}
      {images.length > 1 && (
        <div
          className="p-3 sm:p-4 bg-black/50"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-center gap-2 sm:gap-3 overflow-x-auto pb-1">
            {images.map((img, index) => (
              <button
                key={index}
                onClick={() => handleThumbnailClick(index)}
                className={`flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-md overflow-hidden border-2 transition-all relative ${
                  index === currentIndex
                    ? "border-white ring-2 ring-white/50"
                    : "border-gray-600 opacity-70 hover:opacity-100 hover:border-gray-400"
                }`}
              >
                {/* Loading Skeleton - Shows image icon placeholder */}
                {!loadedThumbnails.has(index) && (
                  <div className="absolute inset-0 bg-gray-700 animate-pulse flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}

                {/* Actual Thumbnail */}
                <img
                  src={convertGoogleDriveUrl(img)}
                  alt={`Thumbnail ${index + 1}`}
                  className={`w-full h-full object-cover transition-opacity ${
                    loadedThumbnails.has(index) ? "opacity-100" : "opacity-0"
                  }`}
                  onLoad={() => handleThumbnailLoad(index)}
                  onError={(e) => {
                    handleImageError(e);
                    handleThumbnailLoad(index);
                  }}
                  draggable={false}
                />

                {/* Image number indicator */}
                <div className="absolute bottom-0.5 right-0.5 bg-black/60 text-white text-[10px] px-1 rounded">
                  {index + 1}
                </div>
              </button>
            ))}
          </div>

          {/* Keyboard hint */}
          <div className="hidden sm:flex justify-center mt-2 text-xs text-gray-400">
            Use ← → arrow keys to navigate • Esc to close • Click outside to dismiss
          </div>
        </div>
      )}
    </div>
  );
}
