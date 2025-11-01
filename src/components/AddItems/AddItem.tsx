import { useState } from "react";
import AddCategoryForm from "./AddCategoryForm";
import AddSubCategoryForm from "./AddSubCategoryForm";
import AddProductForm from "./AddProductForm";

export const AddItem = () => {
  const [activeForm, setActiveForm] = useState<"category" | "subcategory" | "product" | null>(null);

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Add Item</h2>

      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setActiveForm("category")}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Add Category
        </button>

        <button
          onClick={() => setActiveForm("subcategory")}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
        >
          Add SubCategory
        </button>

        <button
          onClick={() => setActiveForm("product")}
          className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
        >
          Add Product
        </button>
      </div>

      <div className="border rounded-xl p-4 shadow">
        {activeForm === "category" && <AddCategoryForm />}
        {activeForm === "subcategory" && <AddSubCategoryForm />}
        {activeForm === "product" && <AddProductForm />}
      </div>
    </div>
  );
};
