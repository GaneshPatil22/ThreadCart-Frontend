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
  console.log('[CategoryGrid] Starting fetchCategories...');

  const res = await supabase
    .from("categories")
    .select()
    .order("sort_number", { ascending: true });

  console.log('[CategoryGrid] Supabase response:', res);

  if (res.error) {
    console.error('[CategoryGrid] Error from Supabase:', res.error);
    throw new Error(res.error.message);
  }

  if (!res.data) {
    console.error('[CategoryGrid] No data received');
    throw new Error("No data received from server");
  }

  console.log('[CategoryGrid] Successfully fetched categories:', res.data.length);

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
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const loadCategories = () => {
    console.log('[CategoryGrid] Retry triggered');
    setRefetchTrigger(prev => prev + 1);
  };

  useEffect(() => {
    console.log('[CategoryGrid] useEffect triggered');
    let isMounted = true;

    const load = async () => {
      console.log('[CategoryGrid] Starting load...');
      setLoading(true);
      setError(null);

      try {
        // Give Supabase client time to initialize from localStorage
        console.log('[CategoryGrid] Waiting for Supabase to initialize...');
        await new Promise(resolve => setTimeout(resolve, 100));

        if (!isMounted) return;

        console.log('[CategoryGrid] Fetching categories...');

        // Set a timeout for the fetch
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout after 10 seconds')), 10000)
        );

        const data = await Promise.race([
          fetchCategories(),
          timeoutPromise
        ]) as Awaited<ReturnType<typeof fetchCategories>>;

        if (!isMounted) {
          console.log('[CategoryGrid] Component unmounted after fetch, aborting');
          return;
        }

        console.log('[CategoryGrid] Setting categories:', data.length);
        setCategories(data);
      } catch (e) {
        if (!isMounted) return;
        console.error("[CategoryGrid] Error fetching categories:", e);
        setError(e instanceof Error ? e.message : "An unexpected error occurred");
      } finally {
        if (isMounted) {
          console.log('[CategoryGrid] Finished loading');
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      console.log('[CategoryGrid] Cleanup - component unmounting');
      isMounted = false;
    };
  }, [refetchTrigger]);

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

  const convertGoogleDriveUrl = (url: string): string => {
    // Match /d/FILE_ID/ or id=FILE_ID
    const fileIdMatch =
      url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);

    if (fileIdMatch && fileIdMatch[1]) {
      const fileId = fileIdMatch[1];
      // Use thumbnail endpoint - more reliable than uc?export=view
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
    }

    return url;
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
                  src={convertGoogleDriveUrl(cat.image)}
                  alt={cat.name}
                  className="w-full h-32 object-contain"
                  onLoad={() =>
                    console.log("Image loaded successfully:", cat.image)
                  }
                  onError={(e) => {
                    console.error("Image failed to load:", cat.image);
                    console.error(e);
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
