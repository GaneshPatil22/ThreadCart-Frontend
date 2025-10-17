import { useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import { api } from "../config/api";

// const products = [
//   {
//     id: 1,
//     name: "Heavy Duty Power Drill",
//     brand: "Bosch",
//     price: 129.99,
//     image:
//       "https://images.unsplash.com/photo-1581092786908-5d5b9a92c24e?auto=format&fit=crop&w=600&q=60",
//   },
//   {
//     id: 2,
//     name: "Safety Helmet - Industrial Grade",
//     brand: "3M",
//     price: 39.99,
//     image:
//       "https://images.unsplash.com/photo-1607860108855-6a66a3f0d2a5?auto=format&fit=crop&w=600&q=60",
//   },
//   {
//     id: 3,
//     name: "Adjustable Wrench Set",
//     brand: "Stanley",
//     price: 49.99,
//     image:
//       "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=60",
//   },
//   {
//     id: 4,
//     name: "Industrial Vacuum Cleaner",
//     brand: "Makita",
//     price: 299.0,
//     image:
//       "https://images.unsplash.com/photo-1592152224987-90f45e2dfca1?auto=format&fit=crop&w=600&q=60",
//   },
// ];

// export default function ProductGrid() {
//   return (
//     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//       {products.map((p) => (
//         <ProductCard key={p.id} {...p} />
//       ))}
//     </div>
//   );
// }

interface Product {
  id: number;
  attributes: {
    name: string;
    price: number;
    brand: string;
    image: { data?: { attributes: { url: string } } };
  };
}

export default function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(api.getProducts());
        const data = await res.json();
        setProducts(data.data || []);
      } catch (err) {
        console.error("❌ Error fetching products:", err);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((p) => {
        const imageUrl = p.attributes.image?.data?.attributes?.url
          ? `${import.meta.env.VITE_STRAPI_URL}${p.attributes.image.data.attributes.url}`
          : "https://via.placeholder.com/300x200";

        return (
          <ProductCard
            key={p.id}
            id={p.id}
            name={p.attributes.name}
            brand={p.attributes.brand}
            price={p.attributes.price}
            image={imageUrl}
          />
        );
      })}
    </div>
  );
}
