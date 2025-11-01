import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../utils/supabase";

// Match the API response structure
interface Category {
  id: string;
  name: string;
  image_url: string;
  description: string;
}

async function fetchCategories() {
  const res = await supabase.from("categories").select();
  console.log(res)

  if (res.error) {
    throw new Error(res.error.message);
  }

  if (!res.data) {
    throw new Error("No data received from server");
  }

  // Map API response to UI-friendly structure
  return res.data.map((cat: Category) => ({
    id: cat.id,
    name: cat.name,
    image: cat.image_url,
    description: cat.description,
  }));
}

// Loading skeleton component
export function CategorySkeleton() {
  return (
    <div className="rounded-lg overflow-hidden border border-border bg-gray-50 animate-pulse">
      <div className="w-full h-32 bg-gray-200"></div>
      <div className="p-3 text-center">
        <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
      </div>
    </div>
  );
}

// Error state component
export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
        <svg
          className="w-8 h-8 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">
        Failed to Load Categories
      </h3>
      <p className="text-text-secondary mb-6 max-w-md mx-auto">{message}</p>
      <button
        onClick={onRetry}
        className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-200"
      >
        Try Again
      </button>
    </div>
  );
}

// Empty state component
export function EmptyState() {
  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
        <svg
          className="w-8 h-8 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">
        No Categories Found
      </h3>
      <p className="text-text-secondary">
        Categories will appear here once they are added.
      </p>
    </div>
  );
}

export default function CategoryGrid() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<
    { id: string; name: string; image: string; description: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = () => {
    setLoading(true);
    setError(null);

    fetchCategories()
      .then(setCategories)
      .catch((e) => {
        console.error("Error fetching categories:", e);
        setError(e.message || "An unexpected error occurred");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleCategoryClick = (cat: {
    id: string;
    name: string;
    description: string;
  }) => {
    navigate(`/subcategory`, {
      state: {
        categoryId: cat.id,
        categoryName: cat.name,
        description: cat.description,
      },
    });
  };

  return (
    <section className="py-14 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-2xl font-semibold text-text-primary mb-8">
          Shop by Category
        </h2>

        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <CategorySkeleton key={i} />
            ))}
          </div>
        )}

        {error && <ErrorState message={error} onRetry={loadCategories} />}

        {!loading && !error && categories.length === 0 && <EmptyState />}

        {!loading && !error && categories.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {categories.map((cat) => (
              <div
                key={cat.id}
                onClick={() => handleCategoryClick(cat)}
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
