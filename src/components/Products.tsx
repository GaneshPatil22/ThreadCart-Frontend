import { useLocation } from "react-router-dom";
import FilterSidebar from "../components/FilterSidebar";
import ProductGrid from "../components/ProductGrid";

export default function Products() {
  const location = useLocation();
  const categoryData = location.state as { categoryId?: string; categoryName?: string } | undefined;

  return (
    <main className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row gap-8">
      {/* Sidebar */}
      <div className="flex-shrink-0">
        <FilterSidebar />
      </div>

      {/* Product Grid */}
      <div className="flex-1">
        <h1 className="text-2xl font-semibold text-text-primary mb-2">
          {categoryData?.categoryName ? categoryData.categoryName : "All Products"}
        </h1>

        <p className="text-sm text-text-secondary mb-6">
          Showing results for:{" "}
          <span className="font-medium text-primary">
            {categoryData?.categoryId || "all"}
          </span>
        </p>

        <ProductGrid />
      </div>
    </main>
  );
}
