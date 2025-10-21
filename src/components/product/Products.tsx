import { useLocation } from "react-router-dom";
import ProductGrid from "./ProductGrid";

export default function Products() {
  const location = useLocation();
  const subCategoryData = location.state as
    | { subCategoryId?: string; subCategoryName?: string; description?: string }
    | undefined;
console.log("SubCategory Data in Products:", subCategoryData);
  return (
    <main className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row gap-8">
      {/* Product Grid */}
      <div className="flex-1">
        <h1 className="text-2xl font-semibold text-text-primary mb-2">
          {subCategoryData?.subCategoryName
            ? subCategoryData.subCategoryName
            : "All Products"}
        </h1>

        <p className="text-sm text-text-secondary mb-6">
          Showing results for:{" "}
          <span className="font-medium text-primary">
            {subCategoryData?.subCategoryId || "all"}
          </span>
        </p>

        <p className="text-sm text-text-secondary mb-6">
          <span className="font-medium text-primary">
            {subCategoryData?.description || ""}
          </span>
        </p>

        <ProductGrid subCategoryData={subCategoryData} />
      </div>
    </main>
  );
}
