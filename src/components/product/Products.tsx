import { useLocation, useNavigate } from "react-router-dom";
import ProductGrid from "./ProductGrid";

interface ProductLocationState {
  subCategoryId?: string;
  subCategoryName?: string;
  description?: string;
  categoryId?: string;
  categoryName?: string;
}

export default function Products() {
  const location = useLocation();
  const navigate = useNavigate();
  const subCategoryData = location.state as ProductLocationState | undefined;

  console.log("SubCategory Data in Products:", subCategoryData);

  const handleBack = () => {
    // If we have category info, go back to that specific category's subcategories
    if (subCategoryData?.categoryId) {
      navigate("/subcategory", {
        state: {
          categoryId: subCategoryData.categoryId,
          categoryName: subCategoryData.categoryName,
        },
      });
    } else {
      // Otherwise go to all subcategories
      navigate("/subcategory");
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row gap-8">
      {/* Product Grid */}
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

        <ProductGrid subCategoryData={subCategoryData} />
      </div>
    </main>
  );
}
