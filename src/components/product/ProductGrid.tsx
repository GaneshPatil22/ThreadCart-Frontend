import supabase from "../../utils/supabase";
import { useState, useEffect, useCallback } from "react";
import { EmptyState, ErrorState } from "../CategoryGrid";
import ShortProductDetail from "./ShortProductDetail";

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
  image_url: string[];
  description: string;
  price: number;
  quantity: number;
  dummy_dimensions: string;
}

async function fetchProducts(subCategoryId?: string) {
  let query = supabase
    .from("product")
    .select("*")
    .order("sort_number", { ascending: true });
  if (subCategoryId) query = query.eq("sub_cat_id", subCategoryId);

  const res = await query;
  if (res.error) throw new Error(res.error.message);
  if (!res.data) throw new Error("No data received from server");

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
  const [products, setProducts] = useState<
    {
      id: string;
      name: string;
      image: string[];
      desc: string;
      dimensions: string;
      quantity: number;
      price: number;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchProducts(subCategoryData?.subCategoryId);

        if (!isMounted) return;

        setProducts(data);
      } catch (e) {
        if (!isMounted) return;
        console.error("Error fetching products:", e);
        setError(e instanceof Error ? e.message : "An unexpected error occurred");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, [subCategoryData?.subCategoryId]);

  const toggleExpand = (id: string) => {
    setExpandedRow((prev) => (prev === id ? null : id));
  };

  if (loading)
    return (
      <div className="text-center py-10 text-gray-500">Loading products...</div>
    );

  if (error) return <ErrorState message={error} onRetry={loadProducts} />;

  if (products.length === 0) return <EmptyState />;

  return (
    <section className="py-14 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-2xl font-semibold text-text-primary mb-6">
          Products
        </h2>

        <div className="overflow-hidden border-t border-gray-200">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left border-b border-gray-200 bg-gray-50">
                <th className="py-3 px-4 font-semibold text-gray-700 w-1/2">
                  Name
                </th>
                <th className="py-3 px-4 font-semibold text-gray-700 w-1/4">
                  Price
                </th>
                <th className="py-3 px-4 font-semibold text-gray-700 w-1/4">
                  Dimensions
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <>
                  {/* Main Row */}
                  <tr
                    key={p.id}
                    className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => toggleExpand(p.id)}
                  >
                    <td className="py-3 px-4 text-gray-800 align-top">
                      {p.name}
                    </td>
                    <td className="py-3 px-4 text-gray-800 align-top">
                      ₹{p.price}
                    </td>
                    <td className="py-3 px-4 text-gray-800 align-top">
                      {p.dimensions || "-"}
                    </td>
                  </tr>

                  {/* Expandable Row */}
                  <tr
                    className={`transition-all duration-300 ease-in-out ${
                      expandedRow === p.id
                        ? "opacity-100"
                        : "opacity-0 pointer-events-none"
                    }`}
                  >
                    <td colSpan={3} className="p-0 border-b border-gray-200">
                      <div
                        className={`overflow-hidden transition-[max-height] duration-300 ${
                          expandedRow === p.id ? "max-h-[400px]" : "max-h-0"
                        }`}
                      >
                        <ShortProductDetail
                          name={p.name}
                          image={p.image}
                          desc={p.desc}
                          quantity={p.quantity}
                        />
                      </div>
                    </td>
                  </tr>
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
