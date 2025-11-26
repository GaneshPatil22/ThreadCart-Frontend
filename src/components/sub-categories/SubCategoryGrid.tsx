import { useNavigate } from "react-router-dom";
import supabase from "../../utils/supabase";
import { useState, useEffect } from "react";
import { CategorySkeleton, EmptyState, ErrorState } from "../CategoryGrid";

interface CategoryData {
  categoryId?: string;
  categoryName?: string;
}

interface SubCategoryGridProps {
  categoryData?: CategoryData;
}

interface SubCategory {
  id: string;
  name: string;
  image_url: string;
  description: string;
}

async function fetchSubCategories(categoryId?: string) {
  let query = supabase
    .from("sub-categories")
    .select("*")
    .order("sort_number", { ascending: true });

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  const res = await query;
  if (res.error) {
    throw new Error(res.error.message);
  }

  if (!res.data) {
    throw new Error("No data received from server");
  }

  return res.data.map((subCat: SubCategory) => ({
    id: subCat.id,
    name: subCat.name,
    image: subCat.image_url,
    desc: subCat.description,
  }));
}

export default function SubCategoryGrid({
  categoryData,
}: SubCategoryGridProps) {
  const navigate = useNavigate();
  const [subCategories, setSubCategories] = useState<
    { id: string; name: string; image: string; desc: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const loadSubCategories = () => {
    setRefetchTrigger(prev => prev + 1);
  };

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchSubCategories(categoryData?.categoryId);

        if (!isMounted) return;

        setSubCategories(data);
      } catch (e) {
        if (!isMounted) return;
        console.error("Error fetching subcategories:", e);
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
  }, [categoryData?.categoryId, refetchTrigger]);

  const handleSubCategoryClick = (cat: {
    id: string;
    name: string;
    desc: string;
  }) => {
    console.log("Navigating to products with sub-category:", cat);

    navigate(`/products`, {
      state: {
        subCategoryId: cat.id,
        subCategoryName: cat.name,
        description: cat.desc,
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
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <CategorySkeleton key={i} />
            ))}
          </div>
        )}

        {error && <ErrorState message={error} onRetry={loadSubCategories} />}

        {!loading && !error && subCategories.length === 0 && <EmptyState />}

        {!loading && !error && subCategories.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {subCategories.map((cat) => (
              <div
                key={cat.id}
                onClick={() => handleSubCategoryClick(cat)}
                className="rounded-lg overflow-hidden border border-border hover:shadow-md transition-shadow duration-200 cursor-pointer bg-gray-50"
              >
                <img
                  src={convertGoogleDriveUrl(cat.image)}
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
