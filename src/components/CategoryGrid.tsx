import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../utils/supabase";

// Match the API response structure
interface Category {
  id: string;
  name: string;
  image_url: string;
}

async function fetchCategories() {
  const res = await supabase.from("categories").select();
  console.log(res);
  // Map API response to UI-friendly structure
  return res.data!.map((cat: Category) => ({
    id: cat.id,
    name: cat.name,
    image: cat.image_url,
  }));
}

export default function CategoryGrid() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<
    { id: string; name: string; image: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleCategoryClick = (cat: { id: string; name: string }) => {
    navigate(`/products`, {
      state: {
        categoryId: cat.id,
        categoryName: cat.name,
      },
    });
  };
  console.log(categories);
  return (
    <section className="py-14 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-2xl font-semibold text-text-primary mb-8">
          Shop by Category
        </h2>

        {loading && <div className="text-text-secondary">Loading...</div>}
        {error && <div className="text-red-500">{error}</div>}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {!loading &&
            !error &&
            categories.map((cat) => (
              <div
                key={cat.id}
                onClick={() => handleCategoryClick(cat)}
                className="rounded-lg overflow-hidden border border-border hover:shadow-md transition-shadow duration-200 cursor-pointer bg-gray-50"
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-32 object-contain"
                />
                <div className="p-3 text-center">
                  <p className="text-sm font-medium text-text-primary">
                    {cat.name}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}
