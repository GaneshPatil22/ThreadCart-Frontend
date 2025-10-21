// src/components/ProductDetail.tsx
interface ProductDetailProps {
  name: string;
  image: string;
  desc?: string;
  quantity: number;
}

export default function ShortProductDetail({
  name,
  image,
  desc,
  quantity,
}: ProductDetailProps) {
  return (
    <div className="bg-gray-50 p-4 border-t border-gray-200 flex gap-4">
      <img
        src={image}
        alt={name}
        className="w-32 h-32 object-contain rounded border"
        onError={(e) =>
          (e.currentTarget.src =
            "https://via.placeholder.com/150x150?text=No+Image")
        }
      />
      <div>
        <h3 className="font-semibold text-gray-800 mb-2">{name}</h3>
        <p className="text-gray-600 text-sm mb-2">
          {desc || "No description available"}
        </p>
        <p className="text-sm text-gray-500">Quantity: {quantity}</p>
      </div>
    </div>
  );
}
