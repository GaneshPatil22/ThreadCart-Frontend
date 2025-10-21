// import { useNavigate } from "react-router-dom";
import supabase from "../../utils/supabase";
import { useState, useEffect, useCallback } from "react";
import { CategorySkeleton, EmptyState, ErrorState } from "../CategoryGrid";

interface SubCategoryData {
  subCategoryId?: string;
  subCategoryName?: string;
}

interface SubCategoryGridProps {
  subCategoryData?: SubCategoryData;
}

interface ProductModel {
  id: string;
  name: string;
  image_url: string;
  description: string;
  price: number;
  quantity: number;
  dummy_dimensions: string;
}

async function fetchProducts(subCategoryId?: string) {
  let query = supabase.from("product").select("*");

  if (subCategoryId) {
    query = query.eq("sub_cat_id", subCategoryId);
  }

  const res = await query;
  if (res.error) {
    throw new Error(res.error.message);
  }

  if (!res.data) {
    throw new Error("No data received from server");
  }

  return res.data.map((product: ProductModel) => ({
    id: product.id,
    name: product.name,
    image: product.image_url,
    desc: product.description,
    price: product.price,
    quantity: product.quantity,
    dimensions: product.dummy_dimensions,
  }));
}

export default function ProductGrid({ subCategoryData }: SubCategoryGridProps) {
  // const navigate = useNavigate();
  const [products, setProducts] = useState<
    { id: string; name: string; image: string; desc: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
console.log("RECEIVED SubCategory Data in ProductGrid:", subCategoryData);
  const loadProducts = useCallback(() => {
    setLoading(true);
    setError(null);

    fetchProducts(subCategoryData?.subCategoryId)
      .then(setProducts)
      .catch((e) => {
        console.error("Error fetching categories:", e);
        setError(e.message || "An unexpected error occurred");
      })
      .finally(() => setLoading(false));
  }, [subCategoryData?.subCategoryId]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // const handleSubCategoryClick = (cat: {
  //   id: string;
  //   name: string;
  //   desc: string;
  // }) => {
  //   navigate(`/products`, {
  //     state: {
  //       categoryId: cat.id,
  //       categoryName: cat.name,
  //       description: cat.desc,
  //     },
  //   });
  // };

  return (
    <section className="py-14 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <CategorySkeleton key={i} />
            ))}
          </div>
        )}

        {error && <ErrorState message={error} onRetry={loadProducts} />}

        {!loading && !error && products.length === 0 && <EmptyState />}

        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {products.map((cat) => (
              <div
                key={cat.id}
                // onClick={() => handleSubCategoryClick(cat)}
                className="rounded-lg overflow-hidden border border-border hover:shadow-md transition-shadow duration-200 cursor-pointer bg-gray-50"
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-32 object-contain"
                  onError={(e) => {
                    // Fallback for broken images
                    e.currentTarget.src =
                      "https://via.placeholder.com/200x128?text=No+Image";
                  }}
                />
                <div className="p-3 text-center">
                  <p className="text-sm font-medium text-text-primary">
                    {cat.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
