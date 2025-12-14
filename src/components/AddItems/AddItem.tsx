import { useState, useEffect } from "react";
import AddCategoryForm from "./AddCategoryForm";
import AddSubCategoryForm from "./AddSubCategoryForm";
import AddProductForm from "./AddProductForm";
import AddPincodeForm from "./AddPincodeForm";
import ManageCategories from "./ManageCategories";
import ManageSubCategories from "./ManageSubCategories";
import ManageProducts from "./ManageProducts";
import ManagePincodes from "./ManagePincodes";
import ManageContactSubmissions from "./ManageContactSubmissions";
import Unauthorized from "../Unauthorized";
import { isAdmin } from "../../utils/adminCheck";

type ViewMode = "add" | "manage";
type ItemType = "category" | "subcategory" | "product" | "pincode" | "contact" | null;

export const AddItem = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("add");
  const [activeForm, setActiveForm] = useState<ItemType>(null);
  const [isUserAdmin, setIsUserAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      const adminStatus = await isAdmin();
      setIsUserAdmin(adminStatus);
    };
    checkAdminStatus();
  }, []);

  // Show loading state while checking admin status
  if (isUserAdmin === null) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Show unauthorized if not admin
  if (!isUserAdmin) {
    return <Unauthorized />;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Manage Inventory</h2>

      {/* View Mode Toggle */}
      <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setViewMode("add")}
          className={`px-4 py-2 rounded-lg transition ${
            viewMode === "add"
              ? "bg-white text-gray-900 shadow"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Add New
        </button>
        <button
          onClick={() => setViewMode("manage")}
          className={`px-4 py-2 rounded-lg transition ${
            viewMode === "manage"
              ? "bg-white text-gray-900 shadow"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          View & Edit
        </button>
      </div>

      {/* Item Type Buttons */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <button
          onClick={() => setActiveForm("category")}
          className={`px-4 py-2 rounded-lg transition ${
            activeForm === "category"
              ? "bg-blue-500 text-white"
              : "bg-blue-100 text-blue-700 hover:bg-blue-200"
          }`}
        >
          {viewMode === "add" ? "Add" : "Manage"} Category
        </button>

        <button
          onClick={() => setActiveForm("subcategory")}
          className={`px-4 py-2 rounded-lg transition ${
            activeForm === "subcategory"
              ? "bg-green-500 text-white"
              : "bg-green-100 text-green-700 hover:bg-green-200"
          }`}
        >
          {viewMode === "add" ? "Add" : "Manage"} SubCategory
        </button>

        <button
          onClick={() => setActiveForm("product")}
          className={`px-4 py-2 rounded-lg transition ${
            activeForm === "product"
              ? "bg-purple-500 text-white"
              : "bg-purple-100 text-purple-700 hover:bg-purple-200"
          }`}
        >
          {viewMode === "add" ? "Add" : "Manage"} Product
        </button>

        <button
          onClick={() => setActiveForm("pincode")}
          className={`px-4 py-2 rounded-lg transition ${
            activeForm === "pincode"
              ? "bg-orange-500 text-white"
              : "bg-orange-100 text-orange-700 hover:bg-orange-200"
          }`}
        >
          {viewMode === "add" ? "Add" : "Manage"} Pincode
        </button>

        <button
          onClick={() => {
            setActiveForm("contact");
            setViewMode("manage");
          }}
          className={`px-4 py-2 rounded-lg transition ${
            activeForm === "contact"
              ? "bg-teal-500 text-white"
              : "bg-teal-100 text-teal-700 hover:bg-teal-200"
          }`}
        >
          Contact Submissions
        </button>
      </div>

      {/* Content Area */}
      <div className="border rounded-xl p-6 shadow bg-white">
        {viewMode === "add" ? (
          <>
            {activeForm === "category" && <AddCategoryForm />}
            {activeForm === "subcategory" && <AddSubCategoryForm />}
            {activeForm === "product" && <AddProductForm />}
            {activeForm === "pincode" && <AddPincodeForm />}
            {activeForm === "contact" && <ManageContactSubmissions />}
            {!activeForm && (
              <p className="text-gray-500 text-center py-12">
                Select an item type to add
              </p>
            )}
          </>
        ) : (
          <>
            {activeForm === "category" && <ManageCategories />}
            {activeForm === "subcategory" && <ManageSubCategories />}
            {activeForm === "product" && <ManageProducts />}
            {activeForm === "pincode" && <ManagePincodes />}
            {activeForm === "contact" && <ManageContactSubmissions />}
            {!activeForm && (
              <p className="text-gray-500 text-center py-12">
                Select an item type to manage
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};
