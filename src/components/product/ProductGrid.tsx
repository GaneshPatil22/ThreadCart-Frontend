import supabase from "../../utils/supabase";
import { useState, useEffect } from "react";
import { EmptyState, ErrorState } from "../CategoryGrid";
import ShortProductDetail from "./ShortProductDetail";
import { useCart } from "../../hooks/useCart";

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
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const { addToCart, isInCart, getItemQuantity } = useCart();
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  const loadProducts = () => {
    setRefetchTrigger(prev => prev + 1);
  };

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
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

    load();

    return () => {
      isMounted = false;
    };
  }, [subCategoryData?.subCategoryId, refetchTrigger]);

  const toggleExpand = (id: string) => {
    setExpandedRow((prev) => (prev === id ? null : id));
  };

  const handleAddToCart = async (productId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent row expansion when clicking button

    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (product.quantity === 0) {
      alert('This product is out of stock');
      return;
    }

    setAddingToCart(productId);
    const result = await addToCart(Number(productId), 1);
    setAddingToCart(null);

    if (result.success) {
      // Optional: Show success message
      console.log('Added to cart successfully');
    } else {
      alert(result.message);
    }
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
                <th className="py-3 px-4 font-semibold text-gray-700 w-2/5">
                  Name
                </th>
                <th className="py-3 px-4 font-semibold text-gray-700 w-1/5">
                  Price
                </th>
                <th className="py-3 px-4 font-semibold text-gray-700 w-1/5">
                  Dimensions
                </th>
                <th className="py-3 px-4 font-semibold text-gray-700 w-1/5 text-center">
                  Action
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
                      {p.quantity === 0 && (
                        <span className="ml-2 text-xs text-red-600 font-semibold">
                          Out of Stock
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-800 align-top">
                      ₹{p.price}
                    </td>
                    <td className="py-3 px-4 text-gray-800 align-top">
                      {p.dimensions || "-"}
                    </td>
                    <td className="py-3 px-4 text-center align-top">
                      {isInCart(Number(p.id)) ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xs text-green-600 font-semibold">
                            In Cart ({getItemQuantity(Number(p.id))})
                          </span>
                          <button
                            onClick={(e) => handleAddToCart(p.id, e)}
                            disabled={addingToCart === p.id || p.quantity === 0}
                            className="text-xs text-primary hover:text-primary-hover underline disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Add More
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => handleAddToCart(p.id, e)}
                          disabled={addingToCart === p.id || p.quantity === 0}
                          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          {addingToCart === p.id ? 'Adding...' : 'Add to Cart'}
                        </button>
                      )}
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
                    <td colSpan={4} className="p-0 border-b border-gray-200">
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
