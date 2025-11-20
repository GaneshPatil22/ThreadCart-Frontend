import { useState } from "react";

interface ProductDetailProps {
  name: string;
  image: string[]; // multiple images
  desc?: string;
  quantity: number;
}

export default function ShortProductDetail({
  name,
  image,
  desc,
  quantity,
}: ProductDetailProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);

  // Handle swipe (basic)
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? image.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === image.length - 1 ? 0 : prev + 1));
  };
  const convertGoogleDriveUrl = (url: string): string => {
    // Match /d/FILE_ID/ or id=FILE_ID
    const fileIdMatch =
      url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);

    if (fileIdMatch && fileIdMatch[1]) {
      const fileId = fileIdMatch[1];
      // Use thumbnail endpoint - more reliable than uc?export=view
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
    }

    return url;
  };
  return (
    <div className="bg-gray-50 p-4 border-t border-gray-200 flex gap-4">
      {/* Image Carousel */}
      <div className="relative w-32 h-32 flex-shrink-0">
        <img
          src={convertGoogleDriveUrl(image[currentIndex])}
          alt={name}
          className="w-full h-full object-contain rounded border cursor-pointer"
          onClick={() => setShowModal(true)}
          onError={(e) =>
            (e.currentTarget.src =
              "https://via.placeholder.com/150x150?text=No+Image")
          }
        />

        {/* Left/Right Navigation (Optional) */}
        {image.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute top-1/2 left-1 -translate-y-1/2 bg-white/70 hover:bg-white rounded-full p-1 text-xs"
            >
              ◀
            </button>
            <button
              onClick={handleNext}
              className="absolute top-1/2 right-1 -translate-y-1/2 bg-white/70 hover:bg-white rounded-full p-1 text-xs"
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
      <div className="flex-1">
        <h3 className="font-semibold text-gray-800 mb-2">{name}</h3>
        <p className="text-gray-600 text-sm mb-2">
          {desc || "No description available"}
        </p>
        <p className="text-sm text-gray-500">Quantity: {quantity}</p>
      </div>

      {/* Fullscreen Image Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setShowModal(false)}
        >
          <div
            className="relative max-w-full max-h-full"
            onClick={(e) => e.stopPropagation()} // prevent closing on image click
          >
            <img
              src={image[currentIndex]}
              alt={name}
              className="max-w-[90vw] max-h-[80vh] object-contain cursor-zoom-in"
              onClick={(e) => {
                e.currentTarget.classList.toggle("scale-150");
                e.currentTarget.classList.toggle("cursor-zoom-out");
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
