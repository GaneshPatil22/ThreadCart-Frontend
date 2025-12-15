import { useLocation } from "react-router-dom";
// import FilterSidebar from "../FilterSidebar"; // Hidden until filter functionality is implemented
import SubCategoryGrid from "./SubCategoryGrid";

export function SubCategoryHome() {
  const location = useLocation();
  const categoryData = location.state as
    | { categoryId?: string; categoryName?: string; description?: string }
    | undefined;
    console.log("Category Data in SubCategoryHome:", categoryData);
  return (
    <main className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row gap-8">
      {/* Sidebar - Hidden until filter functionality is implemented */}
      {/* <div className="flex-shrink-0">
        <FilterSidebar />
      </div> */}

      {/* Product Grid */}
      <div className="flex-1">
        <h1 className="text-2xl font-semibold text-text-primary mb-2">
          {categoryData?.categoryName
            ? categoryData.categoryName
            : "All Products"}
        </h1>

        <p className="text-sm text-text-secondary mb-6">
          Showing results for:{" "}
          <span className="font-medium text-accent">
            {categoryData?.categoryName || "all"}
          </span>
        </p>

        <p className="text-sm text-text-secondary mb-6">
          <span className="font-medium text-accent">
            {categoryData?.description || ""}
          </span>
        </p>

        <SubCategoryGrid categoryData={categoryData} />
      </div>
    </main>
  );
}
