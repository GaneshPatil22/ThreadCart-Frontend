import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import ProductGrid from "./ProductGrid";
import ProductDetailView from "./ProductDetailView";
import supabase from "../../utils/supabase";
import { ErrorState, EmptyState } from "../CategoryGrid";

interface ProductLocationState {
  subCategoryId?: string;
  subCategoryName?: string;
  description?: string;
  categoryId?: string;
  categoryName?: string;
  type?: "single" | "multiple";
}

interface SingleProduct {
  id: number;
  name: string;
  image_url: string[];
  description: string;
  price: number;
  quantity: number;
  thread_style: string | null;
  thread_size_pitch: string | null;
  fastener_length: string | null;
  head_height: string | null;
  Coating: string | null;
  part_number: string | null;
  Material: string | null;
  "HSN/SAC": string | null;
}

export default function Products() {
  const location = useLocation();
  const navigate = useNavigate();
  const subCategoryData = location.state as ProductLocationState | undefined;

  const isSingleType = subCategoryData?.type === "single";

  const [singleProduct, setSingleProduct] = useState<SingleProduct | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSingleType || !subCategoryData?.subCategoryId) return;

    let isMounted = true;

    const fetchFirstProduct = async () => {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("product")
        .select("*")
        .eq("sub_cat_id", subCategoryData.subCategoryId!)
        .order("sort_number", { ascending: true })
        .limit(1);

      if (!isMounted) return;

      if (fetchError) {
        setError(fetchError.message);
      } else if (data && data.length > 0) {
        setSingleProduct(data[0]);
      } else {
        setSingleProduct(null);
      }
      setLoading(false);
    };

    fetchFirstProduct();
    return () => { isMounted = false; };
  }, [isSingleType, subCategoryData?.subCategoryId]);

  const handleBack = () => {
    if (subCategoryData?.categoryId) {
      navigate("/subcategory", {
        state: {
          categoryId: subCategoryData.categoryId,
          categoryName: subCategoryData.categoryName,
        },
      });
    } else {
      navigate("/subcategory");
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row gap-8">
      <div className="flex-1">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-4"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-base font-medium">
            Back to {subCategoryData?.categoryName || "All Categories"}
          </span>
        </button>

        <h1 className="text-2xl font-semibold text-text-primary mb-2">
          {subCategoryData?.subCategoryName
            ? subCategoryData.subCategoryName
            : "All Products"}
        </h1>

        {!isSingleType && (
          <>
            <p className="text-sm text-text-secondary mb-6">
              Showing results for:{" "}
              <span className="font-medium text-accent">
                {subCategoryData?.subCategoryName || "all"}
              </span>
            </p>

            <p className="text-sm text-text-secondary mb-6">
              <span className="font-medium text-accent">
                {subCategoryData?.description || ""}
              </span>
            </p>
          </>
        )}

        {isSingleType ? (
          <>
            {loading && (
              <div className="text-center py-10 text-gray-500">Loading product...</div>
            )}
            {error && <ErrorState message={error} onRetry={() => window.location.reload()} />}
            {!loading && !error && !singleProduct && <EmptyState />}
            {!loading && !error && singleProduct && (
              <ProductDetailView
                name={singleProduct.name}
                image={singleProduct.image_url}
                desc={singleProduct.description}
                quantity={singleProduct.quantity}
                productId={singleProduct.id}
                price={singleProduct.price}
                thread_style={singleProduct.thread_style}
                thread_size_pitch={singleProduct.thread_size_pitch}
                fastener_length={singleProduct.fastener_length}
                head_height={singleProduct.head_height}
                Coating={singleProduct.Coating}
                part_number={singleProduct.part_number}
                Material={singleProduct.Material}
                hsnSac={singleProduct["HSN/SAC"]}
              />
            )}
          </>
        ) : (
          <ProductGrid subCategoryData={subCategoryData} />
        )}
      </div>
    </main>
  );
}
