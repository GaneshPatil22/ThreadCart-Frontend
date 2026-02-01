import supabase from "../../utils/supabase";
import { useState, useEffect } from "react";
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
  thread_style: string | null;
  thread_size_pitch: string | null;
  fastener_length: string | null;
  head_height: string | null;
  Grade: string | null;
  Coating: string | null;
  part_number: string | null;
  Material: string | null;
  "HSN/SAC": string | null;
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
    thread_style: product.thread_style,
    thread_size_pitch: product.thread_size_pitch,
    fastener_length: product.fastener_length,
    head_height: product.head_height,
    Grade: product.Grade,
    Coating: product.Coating,
    part_number: product.part_number,
    Material: product.Material,
    hsnSac: product["HSN/SAC"],
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
      thread_style: string | null;
      thread_size_pitch: string | null;
      fastener_length: string | null;
      head_height: string | null;
      Grade: string | null;
      Coating: string | null;
      part_number: string | null;
      Material: string | null;
      hsnSac: string | null;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

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

        // Auto-expand the first product if there are products
        if (data.length > 0) {
          setExpandedRow(data[0].id);
        }
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

  if (loading)
    return (
      <div className="text-center py-10 text-gray-500">Loading products...</div>
    );

  if (error) return <ErrorState message={error} onRetry={loadProducts} />;

  if (products.length === 0) return <EmptyState />;

  return (
    <section className="py-8 sm:py-14 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-text-primary mb-4 sm:mb-6">
          Products
        </h2>

        {/* Hint for users */}
        <p className="text-sm text-gray-500 mb-4 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Click on any row to view product details
        </p>

        {/* Mobile Card Layout */}
        <div className="md:hidden space-y-3">
          {products.map((p, index) => (
            <div
              key={p.id}
              className={`border rounded-lg overflow-hidden transition-all duration-200 ${
                expandedRow === p.id
                  ? "border-primary shadow-md ring-1 ring-primary/20"
                  : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
              }`}
            >
              {/* Card Header - Clickable */}
              <div
                className={`p-3 cursor-pointer transition-colors ${
                  expandedRow === p.id
                    ? "bg-primary/5"
                    : "bg-white active:bg-gray-50"
                }`}
                onClick={() => toggleExpand(p.id)}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-800 text-sm truncate">{p.name}</h3>
                      {index === 0 && expandedRow === p.id && (
                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                          Expanded
                        </span>
                      )}
                    </div>
                    <p className="text-primary font-semibold mt-1">₹{p.price}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {p.quantity === 0 && (
                      <span className="text-red-600 text-xs font-semibold">Out of Stock</span>
                    )}
                    <div className={`p-1 rounded-full transition-colors ${
                      expandedRow === p.id ? "bg-primary/10" : "bg-gray-100"
                    }`}>
                      <svg
                        className={`w-4 h-4 transition-transform duration-200 ${
                          expandedRow === p.id ? "rotate-180 text-primary" : "text-gray-400"
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                {/* Quick Info */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                  {p.part_number && <span>Part: {p.part_number}</span>}
                  {p.thread_style && <span>Style: {p.thread_style}</span>}
                  {expandedRow !== p.id && (
                    <span className="text-primary/70 ml-auto">Tap to expand ↓</span>
                  )}
                </div>
              </div>

              {/* Expandable Content */}
              <div
                className={`overflow-hidden transition-[max-height] duration-300 ${
                  expandedRow === p.id ? "max-h-[800px]" : "max-h-0"
                }`}
              >
                <ShortProductDetail
                  name={p.name}
                  image={p.image}
                  desc={p.desc}
                  quantity={p.quantity}
                  productId={Number(p.id)}
                  price={p.price}
                  thread_style={p.thread_style}
                  thread_size_pitch={p.thread_size_pitch}
                  fastener_length={p.fastener_length}
                  head_height={p.head_height}
                  Coating={p.Coating}
                  part_number={p.part_number}
                  Material={p.Material}
                  hsnSac={p.hsnSac}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table Layout */}
        <div className="hidden md:block overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left bg-gray-50">
                <th className="py-3 px-4 font-semibold text-gray-700">
                  Name
                </th>
                <th className="py-3 px-4 font-semibold text-gray-700">
                  Price
                </th>
                <th className="py-3 px-4 font-semibold text-gray-700">
                  Part Number
                </th>
                <th className="py-3 px-4 font-semibold text-gray-700">
                  Thread Style
                </th>
                <th className="py-3 px-4 font-semibold text-gray-700">
                  Grade
                </th>
                <th className="py-3 px-4 font-semibold text-gray-700">
                  Finish
                </th>
                <th className="py-3 px-4 font-semibold text-gray-700">
                  Material
                </th>
                <th className="py-3 px-4 font-semibold text-gray-700 w-10">
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <>
                  {/* Main Row */}
                  <tr
                    key={p.id}
                    className={`border-t border-gray-200 cursor-pointer transition-all duration-200 ${
                      expandedRow === p.id
                        ? "bg-primary/5 hover:bg-primary/10"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => toggleExpand(p.id)}
                  >
                    <td className="py-3 px-4 align-middle">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${expandedRow === p.id ? "text-primary" : "text-gray-800"}`}>
                          {p.name}
                        </span>
                        {expandedRow === p.id && (
                          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">
                            Viewing
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-800 align-middle font-medium">
                      ₹{p.price}
                    </td>
                    <td className="py-3 px-4 text-gray-600 align-middle">
                      {p.part_number || "-"}
                    </td>
                    <td className="py-3 px-4 text-gray-600 align-middle">
                      {p.thread_style || "-"}
                    </td>
                    <td className="py-3 px-4 text-gray-600 align-middle">
                      {p.Grade || "-"}
                    </td>
                    <td className="py-3 px-4 text-gray-600 align-middle">
                      {p.Coating || "-"}
                    </td>
                    <td className="py-3 px-4 text-gray-600 align-middle">
                      {p.Material || "-"}
                    </td>
                    <td className="py-3 px-4 align-middle">
                      <div className="flex items-center gap-2">
                        {p.quantity == 0 && (
                          <span className="text-red-600 text-xs font-semibold whitespace-nowrap">Out of Stock</span>
                        )}
                        <div className={`p-1.5 rounded-full transition-colors ${
                          expandedRow === p.id ? "bg-primary/20" : "bg-gray-100 group-hover:bg-gray-200"
                        }`}>
                          <svg
                            className={`w-4 h-4 transition-transform duration-200 ${
                              expandedRow === p.id ? "rotate-180 text-primary" : "text-gray-400"
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
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
                    <td colSpan={8} className="p-0 border-t border-primary/20">
                      <div
                        className={`overflow-hidden transition-[max-height] duration-300 bg-gradient-to-b from-primary/5 to-white ${
                          expandedRow === p.id ? "max-h-[600px]" : "max-h-0"
                        }`}
                      >
                        <ShortProductDetail
                          name={p.name}
                          image={p.image}
                          desc={p.desc}
                          quantity={p.quantity}
                          productId={Number(p.id)}
                          price={p.price}
                          thread_style={p.thread_style}
                          thread_size_pitch={p.thread_size_pitch}
                          fastener_length={p.fastener_length}
                          head_height={p.head_height}
                          Coating={p.Coating}
                          part_number={p.part_number}
                          Material={p.Material}
                          hsnSac={p.hsnSac}
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
