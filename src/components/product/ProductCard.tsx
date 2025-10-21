import { ShoppingCart } from "lucide-react";

interface ProductProps {
  id: number;
  name: string;
  image: string;
  price: number;
  brand: string;
}

export default function ProductCard({ name, image, price, brand }: ProductProps) {
  return (
    <div className="bg-white border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
      <img src={image} alt={name} className="w-full h-48 object-cover" />
      <div className="p-4">
        <p className="text-sm text-text-secondary mb-1">{brand}</p>
        <h3 className="font-medium text-text-primary line-clamp-1">{name}</h3>
        <p className="text-lg font-semibold text-primary mt-2">${price.toFixed(2)}</p>
        <button className="mt-4 flex items-center justify-center w-full bg-primary text-white py-2 rounded-md hover:bg-primary-hover">
          <ShoppingCart className="w-4 h-4 mr-2" /> Add to Cart
        </button>
      </div>
    </div>
  );
}
