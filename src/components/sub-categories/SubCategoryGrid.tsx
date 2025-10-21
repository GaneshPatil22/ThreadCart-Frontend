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
}

async function fetchSubCategories(categoryId?: string) {
  const res = await supabase
    .from("sub-categories")
    .select()
    .eq("category_id", categoryId);
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
  }));
}

export default function SubCategoryGrid({
  categoryData,
}: SubCategoryGridProps) {
  const navigate = useNavigate();
  const [subCategories, setSubCategories] = useState<
    { id: string; name: string; image: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSubCategories = () => {
    setLoading(true);
    setError(null);

    fetchSubCategories(categoryData?.categoryId)
      .then((data) => {
        setSubCategories(data);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };
  useEffect(() => {
    loadSubCategories();
  }, []);

  const handleSubCategoryClick = (cat: { id: string; name: string }) => {
    navigate(`/subcategory`, {
      state: {
        categoryId: cat.id,
        categoryName: cat.name,
      },
    });
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
