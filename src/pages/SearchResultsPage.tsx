import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import supabase from "../utils/supabase";
import { CategorySkeleton, EmptyState, ErrorState } from "../components/CategoryGrid";
import ShortProductDetail from "../components/product/ShortProductDetail";
import { convertGoogleDriveUrl, handleImageError } from "../utils/imageUtils";
import { trackSearch } from "../utils/analytics";

interface Category {
  id: string;
  name: string;
  image_url: string;
  description: string;
}

interface SubCategory {
  id: string;
  name: string;
  image_url: string;
  description: string;
}

interface Product {
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

interface SearchResults {
  categories: Category[];
  subCategories: SubCategory[];
  products: Product[];
}

async function searchAll(query: string): Promise<SearchResults> {
  const searchPattern = `%${query}%`;

  const [categoriesRes, subCategoriesRes, productsRes] = await Promise.all([
    supabase
      .from("categories")
      .select("*")
      .ilike("name", searchPattern)
      .order("sort_number", { ascending: true }),
    supabase
      .from("sub-categories")
      .select("*")
      .ilike("name", searchPattern)
      .order("sort_number", { ascending: true }),
    supabase
      .from("product")
      .select("*")
      .or(`name.ilike.${searchPattern},part_number.ilike.${searchPattern}`)
      .order("sort_number", { ascending: true }),
  ]);

  if (categoriesRes.error) throw new Error(categoriesRes.error.message);
  if (subCategoriesRes.error) throw new Error(subCategoriesRes.error.message);
  if (productsRes.error) throw new Error(productsRes.error.message);

  return {
    categories: categoriesRes.data || [],
    subCategories: subCategoriesRes.data || [],
    products: productsRes.data || [],
  };
}

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") || "";

  const [results, setResults] = useState<SearchResults>({
    categories: [],
    subCategories: [],
    products: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(query);

  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  useEffect(() => {
    if (!query) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const performSearch = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await searchAll(query);
        if (isMounted) {
          setResults(data);
          // Track search event
          trackSearch(query);
        }
      } catch (e) {
        if (isMounted) {
          setError(e instanceof Error ? e.message : "Search failed");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    performSearch();

    return () => {
      isMounted = false;
    };
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = searchInput.trim();
    if (trimmedQuery) {
      navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`);
    }
  };

  const handleCategoryClick = (cat: Category) => {
    navigate(`/subcategory`, {
      state: {
        categoryId: cat.id,
        categoryName: cat.name,
        description: cat.description,
      },
    });
  };

  const handleSubCategoryClick = (subCat: SubCategory) => {
    navigate(`/products`, {
      state: {
        subCategoryId: subCat.id,
        subCategoryName: subCat.name,
        description: subCat.description,
      },
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedRow((prev) => (prev === id ? null : id));
  };

  const totalResults =
    results.categories.length +
    results.subCategories.length +
    results.products.length;

  const retry = () => {
    if (query) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Search Header */}
      <div className="bg-white border-b border-border py-6">
        <div className="max-w-7xl mx-auto px-6">
          <form onSubmit={handleSearch} className="max-w-xl">
            <div className="flex bg-white border border-border rounded-lg shadow-sm overflow-hidden">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search products, categories..."
                className="flex-1 px-4 py-3 focus:outline-none"
              />
              <button
                type="submit"
                className="bg-primary text-white px-5 flex items-center justify-center hover:bg-primary-hover"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </form>

          {query && !loading && (
            <p className="mt-4 text-text-secondary">
              {totalResults} result{totalResults !== 1 ? "s" : ""} for "{query}"
            </p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Loading State */}
        {loading && (
          <div className="space-y-12">
            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-6">
                Searching...
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <CategorySkeleton key={i} />
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Error State */}
        {error && <ErrorState message={error} onRetry={retry} />}

        {/* No Query */}
        {!query && !loading && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              Start Searching
            </h2>
            <p className="text-text-secondary">
              Enter a search term to find products, categories, and subcategories.
            </p>
          </div>
        )}

        {/* No Results */}
        {query && !loading && !error && totalResults === 0 && <EmptyState />}

        {/* Results */}
        {!loading && !error && totalResults > 0 && (
          <div className="space-y-12">
            {/* Categories Section */}
            {results.categories.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-text-primary mb-6">
                  Categories ({results.categories.length})
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  {results.categories.map((cat) => (
                    <div
                      key={cat.id}
                      onClick={() => handleCategoryClick(cat)}
                      className="rounded-lg overflow-hidden border border-border hover:shadow-md transition-shadow duration-200 cursor-pointer bg-gray-50"
                    >
                      <img
                        src={convertGoogleDriveUrl(cat.image_url)}
                        alt={cat.name}
                        className="w-full h-32 object-contain"
                        onError={handleImageError}
                      />
                      <div className="p-3 text-center">
                        <p className="text-sm font-medium text-text-primary">
                          {cat.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* SubCategories Section */}
            {results.subCategories.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-text-primary mb-6">
                  Subcategories ({results.subCategories.length})
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  {results.subCategories.map((subCat) => (
                    <div
                      key={subCat.id}
                      onClick={() => handleSubCategoryClick(subCat)}
                      className="rounded-lg overflow-hidden border border-border hover:shadow-md transition-shadow duration-200 cursor-pointer bg-gray-50"
                    >
                      <img
                        src={convertGoogleDriveUrl(subCat.image_url)}
                        alt={subCat.name}
                        className="w-full h-32 object-contain"
                        onError={handleImageError}
                      />
                      <div className="p-3 text-center">
                        <p className="text-sm font-medium text-text-primary">
                          {subCat.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Products Section */}
            {results.products.length > 0 && (
              <section className="bg-white rounded-lg border border-border p-6">
                <h2 className="text-xl font-semibold text-text-primary mb-6">
                  Products ({results.products.length})
                </h2>

                <div className="overflow-hidden border-t border-gray-200">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="text-left border-b border-gray-200 bg-gray-50">
                        <th className="py-3 px-4 font-semibold text-gray-700 w-1/4">
                          Name
                        </th>
                        <th className="py-3 px-4 font-semibold text-gray-700 w-1/6">
                          Price
                        </th>
                        <th className="py-3 px-4 font-semibold text-gray-700 w-1/6">
                          Part Number
                        </th>
                        <th className="py-3 px-4 font-semibold text-gray-700 w-1/6">
                          Thread Style
                        </th>
                        <th className="py-3 px-4 font-semibold text-gray-700 w-1/6">
                          Grade
                        </th>
                        <th className="py-3 px-4 font-semibold text-gray-700 w-1/6"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.products.map((p) => (
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
                              {p.part_number || "-"}
                            </td>
                            <td className="py-3 px-4 text-gray-800 align-top">
                              {p.thread_style || "-"}
                            </td>
                            <td className="py-3 px-4 text-gray-800 align-top">
                              {p.Grade || "-"}
                            </td>
                            <td className="py-3 px-4 text-gray-800 align-top">
                              {p.quantity === 0 && (
                                <span className="text-red-600 font-semibold">
                                  Out of Stock
                                </span>
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
                            <td colSpan={6} className="p-0 border-b border-gray-200">
                              <div
                                className={`overflow-hidden transition-[max-height] duration-300 ${
                                  expandedRow === p.id ? "max-h-[500px]" : "max-h-0"
                                }`}
                              >
                                <ShortProductDetail
                                  name={p.name}
                                  image={p.image_url}
                                  desc={p.description}
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
                                  hsnSac={p["HSN/SAC"]}
                                />
                              </div>
                            </td>
                          </tr>
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
