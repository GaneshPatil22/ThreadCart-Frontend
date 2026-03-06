import { useState, useEffect, useCallback } from "react";
import { useCart } from "../../hooks/useCart";
import { getDisplayUrl, handleImageError } from "../../utils/imageUtils";
import { trackAddToCart } from "../../utils/analytics";
import { shouldShowSpec, formatSpecValue } from "../../utils/productSpecUtils";

export interface ProductDetailViewProps {
  name: string;
  image: string[];
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
  onClose?: () => void;
}

export default function ProductDetailView({
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
  onClose,
}: ProductDetailViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartQuantity, setCartQuantity] = useState(1);
  const [quantityInput, setQuantityInput] = useState("1");
  const [showFullscreenImage, setShowFullscreenImage] = useState(false);

  const { addToCart, isInCart, getItemQuantity } = useCart();

  // Lock body scroll when mounted as modal
  useEffect(() => {
    if (onClose) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "unset";
      };
    }
  }, [onClose]);

  // Keyboard: Escape to close
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) {
        e.preventDefault();
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (onClose) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [handleKeyDown, onClose]);

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

    const currentInCart = getItemQuantity(productId);
    const availableStock = quantity - currentInCart;

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
      trackAddToCart({ id: productId, name, price }, cartQuantity);
      setCartQuantity(1);
      setQuantityInput("1");
      alert(`Successfully added ${cartQuantity} item(s) to cart!`);
    } else {
      alert(result.message);
    }
  };

  const handleQuantityChange = (newQty: number) => {
    if (newQty < 1) return;

    const currentInCart = getItemQuantity(productId);
    const availableStock = quantity - currentInCart;

    if (newQty > availableStock) {
      alert(
        `Only ${availableStock} more units available (${currentInCart} already in cart, ${quantity} total stock)`
      );
      return;
    }

    setCartQuantity(newQty);
    setQuantityInput(String(newQty));
  };

  const specs = [
    { label: "Thread Style", value: thread_style },
    { label: "Thread Size/Pitch", value: thread_size_pitch },
    { label: "Fastener Length", value: fastener_length },
    { label: "Head Height", value: head_height },
    { label: "Finish", value: Coating },
    { label: "Material", value: Material },
    { label: "HSN/SAC", value: hsnSac },
  ].filter((s) => shouldShowSpec(s.value));

  const content = (
    <div className="bg-white min-h-screen sm:min-h-0">
      {/* Header with close button (only in modal mode) */}
      {onClose && (
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 truncate pr-4">{name}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
            title="Close (Esc)"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Main Content - Two Column Layout */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Image + Price + Add to Cart */}
          <div className="lg:w-[45%] flex-shrink-0">
            {/* Image Carousel */}
            <div className="relative w-full aspect-square max-w-md mx-auto bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
              <img
                src={getDisplayUrl(image[currentIndex])}
                alt={name}
                className="w-full h-full object-contain cursor-pointer"
                onClick={() => setShowFullscreenImage(true)}
                onError={handleImageError}
              />

              {/* Navigation Arrows */}
              {image.length > 1 && (
                <>
                  <button
                    onClick={handlePrev}
                    className="absolute top-1/2 left-2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute top-1/2 right-2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}

              {/* Image Counter */}
              {image.length > 1 && (
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                  {currentIndex + 1} / {image.length}
                </div>
              )}
            </div>

            {/* Thumbnail Strip */}
            {image.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1 justify-center">
                {image.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-md overflow-hidden border-2 transition-all ${
                      index === currentIndex
                        ? "border-primary ring-1 ring-primary/30"
                        : "border-gray-200 opacity-70 hover:opacity-100 hover:border-gray-400"
                    }`}
                  >
                    <img
                      src={getDisplayUrl(img)}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={handleImageError}
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Price */}
            <div className="mt-5">
              <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                ₹{price}
              </span>
            </div>

            {/* Cart Status */}
            {isInCart(productId) && (
              <div className="flex items-center gap-2 text-green-600 font-semibold text-sm mt-3">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>In Cart: {getItemQuantity(productId)} unit(s)</span>
              </div>
            )}

            {/* Quantity Selector + Add to Cart */}
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 font-medium">Quantity:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleQuantityChange(cartQuantity - 1)}
                    disabled={cartQuantity <= 1}
                    className="w-10 h-10 flex items-center justify-center border-2 border-gray-300 rounded-md hover:bg-gray-100 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg active:bg-gray-200"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantityInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setQuantityInput(val);
                      const parsed = parseInt(val);
                      if (!isNaN(parsed) && parsed >= 1) {
                        const currentInCart = getItemQuantity(productId);
                        const availableStock = quantity - currentInCart;
                        if (parsed <= availableStock) {
                          setCartQuantity(parsed);
                        }
                      }
                    }}
                    onBlur={() => {
                      const parsed = parseInt(quantityInput);
                      if (!quantityInput || isNaN(parsed) || parsed < 1) {
                        setCartQuantity(1);
                        setQuantityInput("1");
                      } else {
                        const currentInCart = getItemQuantity(productId);
                        const availableStock = quantity - currentInCart;
                        const clamped = Math.min(parsed, availableStock);
                        setCartQuantity(clamped);
                        setQuantityInput(String(clamped));
                      }
                    }}
                    onFocus={(e) => e.target.select()}
                    className="w-20 text-center border-2 border-gray-300 rounded-md py-2 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    min="1"
                    max={quantity - getItemQuantity(productId)}
                  />
                  <button
                    onClick={() => handleQuantityChange(cartQuantity + 1)}
                    disabled={cartQuantity >= quantity - getItemQuantity(productId)}
                    className="w-10 h-10 flex items-center justify-center border-2 border-gray-300 rounded-md hover:bg-gray-100 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg active:bg-gray-200"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={
                  addingToCart ||
                  quantity === 0 ||
                  quantity - getItemQuantity(productId) === 0
                }
                className="w-full bg-primary text-white px-8 py-3 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base font-bold shadow-md hover:shadow-lg active:shadow-sm"
              >
                {addingToCart ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Adding...
                  </span>
                ) : quantity - getItemQuantity(productId) === 0 ? (
                  "All in Cart"
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                    </svg>
                    Add to Cart
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Right Column - Product Info */}
          <div className="lg:w-[55%] flex-1">
            {/* Part Number */}
            {shouldShowSpec(part_number) && (
              <div className="mb-2">
                <span className="inline-block bg-yellow-100 text-yellow-800 text-sm font-semibold px-2.5 py-0.5 rounded">
                  Part No: {formatSpecValue(part_number)}
                </span>
              </div>
            )}

            {/* Title */}
            {!onClose && (
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">{name}</h1>
            )}
            {onClose && (
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 lg:block hidden">{name}</h2>
            )}

            {/* Description */}
            {desc && desc.trim() && (
              <div className="mb-6">
                <h3 className="text-base font-semibold text-gray-800 mb-2">Description</h3>
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">{desc}</p>
              </div>
            )}

            {/* Specifications Table */}
            {specs.length > 0 && (
              <div className="mb-6">
                <h3 className="text-base font-semibold text-gray-800 mb-3">Specifications</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <tbody>
                      {specs.map((spec, index) => (
                        <tr
                          key={spec.label}
                          className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
                        >
                          <td className="px-4 py-2.5 text-sm text-gray-600 font-medium w-[40%] border-r border-gray-200">
                            {spec.label}
                          </td>
                          <td className="px-4 py-2.5 text-sm text-gray-900">
                            {formatSpecValue(spec.value)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Stock Status (out of stock only) */}
            {quantity === 0 && (
              <div className="inline-flex items-center gap-2 bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm font-medium">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Currently out of stock
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Image Viewer */}
      {showFullscreenImage && (
        <FullscreenImageViewer
          images={image}
          currentIndex={currentIndex}
          onClose={() => setShowFullscreenImage(false)}
          onIndexChange={setCurrentIndex}
          productName={name}
        />
      )}
    </div>
  );

  // If onClose is provided, render as a modal overlay
  if (onClose) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 overflow-y-auto" onClick={onClose}>
        <div
          className="min-h-screen sm:py-8 sm:px-4 flex items-start justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white w-full sm:max-w-5xl sm:rounded-xl sm:shadow-2xl overflow-hidden">
            {content}
          </div>
        </div>
      </div>
    );
  }

  // Otherwise render inline (for single-product subcategory view - Phase 3)
  return content;
}

/**
 * Fullscreen Image Viewer (reused from ShortProductDetail pattern)
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

  useEffect(() => {
    setMainImageLoaded(false);
    setIsZoomed(false);
  }, [currentIndex]);

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

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [handleKeyDown]);

  return (
    <div className="fixed inset-0 bg-black/95 flex flex-col z-[60]" onClick={onClose}>
      {/* Header */}
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
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            title="Close (Esc)"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Image */}
      <div
        className="flex-1 flex items-center justify-center relative px-4 sm:px-16"
        onClick={(e) => e.stopPropagation()}
      >
        {images.length > 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); onIndexChange(currentIndex === 0 ? images.length - 1 : currentIndex - 1); }}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white z-10"
          >
            <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        <div className="relative flex items-center justify-center">
          {!mainImageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 sm:w-80 sm:h-80 bg-gray-800 rounded-lg animate-pulse flex items-center justify-center">
                <span className="text-gray-500 text-sm">Loading...</span>
              </div>
            </div>
          )}
          <img
            src={getDisplayUrl(images[currentIndex])}
            alt={`${productName} - Image ${currentIndex + 1}`}
            className={`max-w-full max-h-[70vh] object-contain transition-all duration-200 ${
              isZoomed ? "scale-150 cursor-zoom-out" : "cursor-zoom-in"
            } ${mainImageLoaded ? "opacity-100" : "opacity-0"}`}
            onClick={(e) => { e.stopPropagation(); setIsZoomed(!isZoomed); }}
            onLoad={() => setMainImageLoaded(true)}
            onError={(e) => { handleImageError(e); setMainImageLoaded(true); }}
            draggable={false}
          />
        </div>

        {images.length > 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); onIndexChange(currentIndex === images.length - 1 ? 0 : currentIndex + 1); }}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white z-10"
          >
            <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="p-3 sm:p-4 bg-black/50" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-center gap-2 sm:gap-3 overflow-x-auto pb-1">
            {images.map((img, index) => (
              <button
                key={index}
                onClick={() => onIndexChange(index)}
                className={`flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-md overflow-hidden border-2 transition-all ${
                  index === currentIndex
                    ? "border-white ring-2 ring-white/50"
                    : "border-gray-600 opacity-70 hover:opacity-100 hover:border-gray-400"
                }`}
              >
                <img
                  src={getDisplayUrl(img)}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={handleImageError}
                  draggable={false}
                />
              </button>
            ))}
          </div>
          <div className="hidden sm:flex justify-center mt-2 text-xs text-gray-400">
            Use arrow keys to navigate | Esc to close
          </div>
        </div>
      )}
    </div>
  );
}
