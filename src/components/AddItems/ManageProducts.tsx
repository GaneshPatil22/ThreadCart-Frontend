import { useEffect, useState } from "react";
import supabase from "../../utils/supabase";
import { handleImageError } from "../../utils/imageUtils";

interface Product {
  id: number;
  name: string;
  description: string | null;
  image_url: string[];
  price: number;
  quantity: number;
  thread_style: string | null;
  thread_size_pitch: string | null;
  fastener_length: number | null;
  head_height: number | null;
  Grade: number | null;
  Coating: string | null;
  part_number: number | null;
  sub_cat_id: number;
  sort_number: number;
  Material: string | null;
  "HSN/SAC": string | null;
}

interface SubCategory {
  id: number;
  name: string;
}

export default function ManageProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editForm, setEditForm] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isModalOpen) {
        handleCloseModal();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isModalOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isModalOpen]);

  const fetchData = async () => {
    setLoading(true);

    const [productsResult, subCatsResult] = await Promise.all([
      supabase
        .from("product")
        .select("*")
        .order("sort_number", { ascending: true }),
      supabase.from("sub-categories").select("id, name"),
    ]);

    if (productsResult.error) {
      console.error(productsResult.error);
      alert("Error fetching products");
    } else {
      setProducts(productsResult.data || []);
    }

    if (subCatsResult.error) {
      console.error(subCatsResult.error);
    } else {
      setSubCategories(subCatsResult.data || []);
    }

    setLoading(false);
  };

  const getSubCategoryName = (subCatId: number) => {
    return subCategories.find((sc) => sc.id === subCatId)?.name || "Unknown";
  };

  const handleEdit = (product: Product) => {
    setEditForm({ ...product });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditForm(null);
  };

  const handleSaveEdit = async () => {
    if (!editForm) return;

    setSaving(true);
    const { error } = await supabase
      .from("product")
      .update({
        name: editForm.name,
        description: editForm.description,
        image_url: editForm.image_url,
        price: editForm.price,
        quantity: editForm.quantity,
        thread_style: editForm.thread_style,
        thread_size_pitch: editForm.thread_size_pitch,
        fastener_length: editForm.fastener_length,
        head_height: editForm.head_height,
        Grade: editForm.Grade,
        Coating: editForm.Coating,
        part_number: editForm.part_number,
        sub_cat_id: editForm.sub_cat_id,
        sort_number: editForm.sort_number,
        Material: editForm.Material,
        "HSN/SAC": editForm["HSN/SAC"],
      })
      .eq("id", editForm.id);

    setSaving(false);

    if (error) {
      alert("Error updating product: " + error.message);
    } else {
      alert("Product updated successfully!");
      handleCloseModal();
      fetchData();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this product?")) {
      return;
    }

    const { error } = await supabase.from("product").delete().eq("id", id);

    if (error) {
      alert("Error deleting product: " + error.message);
    } else {
      alert("Product deleted successfully!");
      fetchData();
    }
  };

  const handleImageChange = (index: number, value: string) => {
    if (!editForm) return;
    const newImages = [...editForm.image_url];
    newImages[index] = value;
    setEditForm({ ...editForm, image_url: newImages });
  };

  const addImageField = () => {
    if (!editForm) return;
    setEditForm({ ...editForm, image_url: [...editForm.image_url, ""] });
  };

  const removeImageField = (index: number) => {
    if (!editForm) return;
    const newImages = editForm.image_url.filter((_, i) => i !== index);
    setEditForm({ ...editForm, image_url: newImages });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const filteredProducts = products.filter((p) => {
    const subCategoryName = getSubCategoryName(p.sub_cat_id).toLowerCase();
    const term = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      subCategoryName.includes(term) ||
      (p.thread_style && p.thread_style.toLowerCase().includes(term)) ||
      (p.thread_size_pitch && p.thread_size_pitch.toLowerCase().includes(term)) ||
      (p.Coating && p.Coating.toLowerCase().includes(term)) ||
      (p.part_number && p.part_number.toString().includes(term)) ||
      (p.Material && p.Material.toLowerCase().includes(term)) ||
      (p["HSN/SAC"] && p["HSN/SAC"].toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Manage Products</h3>
        <span className="text-sm text-gray-500">
          {searchTerm
            ? `${filteredProducts.length} of ${products.length} products`
            : `${products.length} products`}
        </span>
      </div>

      <input
        type="text"
        placeholder="Search by name, subcategory, material, HSN/SAC..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full border rounded-lg p-2 mb-4"
      />

      {filteredProducts.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          {searchTerm ? "No products found matching your search." : "No products found. Add one using the form above."}
        </p>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  {product.image_url && product.image_url.length > 0 && (
                    <img
                      src={product.image_url[0]}
                      alt={product.name}
                      className="w-20 h-20 object-cover rounded"
                      onError={handleImageError}
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">{product.name}</h4>
                    {product.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{product.description}</p>
                    )}
                    <div className="text-sm text-gray-600 space-y-1 mt-1">
                      <p>
                        SubCategory: {getSubCategoryName(product.sub_cat_id)}
                      </p>
                      <p>
                        Price: ₹{product.price} | Quantity: {product.quantity}
                      </p>
                      {product.thread_style && (
                        <p>Thread Style: {product.thread_style}</p>
                      )}
                      {product.thread_size_pitch && (
                        <p>Thread Size: {product.thread_size_pitch}</p>
                      )}
                      {product.Material && (
                        <p>Material: {product.Material}</p>
                      )}
                      {product.part_number && (
                        <p>Part Number: {product.part_number}</p>
                      )}
                      {product["HSN/SAC"] && (
                        <p>HSN/SAC: {product["HSN/SAC"]}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        Sort Order: {product.sort_number}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(product)}
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="bg-primary text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Product Modal */}
      {isModalOpen && editForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseModal();
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Edit Product</h2>
                <p className="text-sm text-gray-500 mt-0.5 truncate max-w-md">
                  {editForm.name}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-6">
                {/* Basic Information Section */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter product name"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={editForm.description || ""}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value || null })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[80px] resize-y"
                        placeholder="Enter product description (optional)"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sub Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={editForm.sub_cat_id}
                        onChange={(e) => setEditForm({ ...editForm, sub_cat_id: Number(e.target.value) })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select SubCategory</option>
                        {subCategories.map((sub) => (
                          <option key={sub.id} value={sub.id}>
                            {sub.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sort Order
                      </label>
                      <input
                        type="number"
                        value={editForm.sort_number}
                        onChange={(e) => setEditForm({ ...editForm, sort_number: Number(e.target.value) })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0"
                        min={0}
                      />
                    </div>
                  </div>
                </div>

                {/* Pricing & Inventory Section */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Pricing & Inventory
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price (₹) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={editForm.price}
                        onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                        min={0}
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity in Stock <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={editForm.quantity}
                        onChange={(e) => setEditForm({ ...editForm, quantity: Number(e.target.value) })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0"
                        min={0}
                      />
                    </div>
                  </div>
                </div>

                {/* Images Section */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Product Images
                  </h3>
                  <div className="space-y-3">
                    {editForm.image_url.map((url, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Image URL {index + 1}
                          </label>
                          <input
                            type="text"
                            placeholder="https://example.com/image.jpg"
                            value={url}
                            onChange={(e) => handleImageChange(index, e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        {url && (
                          <img
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className="w-12 h-12 object-cover rounded border mt-6"
                            onError={handleImageError}
                          />
                        )}
                        {editForm.image_url.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeImageField(index)}
                            className="mt-6 p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                            aria-label="Remove image"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addImageField}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add another image
                    </button>
                  </div>
                </div>

                {/* Product Specifications Section */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Product Specifications
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Thread Style
                      </label>
                      <input
                        type="text"
                        value={editForm.thread_style || ""}
                        onChange={(e) => setEditForm({ ...editForm, thread_style: e.target.value || null })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Full Thread, Half Thread"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Thread Size × Pitch
                      </label>
                      <input
                        type="text"
                        value={editForm.thread_size_pitch || ""}
                        onChange={(e) => setEditForm({ ...editForm, thread_size_pitch: e.target.value || null })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., M8 x 1.25"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fastener Length (mm)
                      </label>
                      <input
                        type="number"
                        value={editForm.fastener_length || ""}
                        onChange={(e) => setEditForm({ ...editForm, fastener_length: e.target.value ? Number(e.target.value) : null })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., 25"
                        min={0}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Head Height (mm)
                      </label>
                      <input
                        type="number"
                        value={editForm.head_height || ""}
                        onChange={(e) => setEditForm({ ...editForm, head_height: e.target.value ? Number(e.target.value) : null })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., 5"
                        min={0}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Grade
                      </label>
                      <input
                        type="number"
                        value={editForm.Grade || ""}
                        onChange={(e) => setEditForm({ ...editForm, Grade: e.target.value ? Number(e.target.value) : null })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., 8.8, 10.9"
                        min={0}
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Finish / Coating
                      </label>
                      <input
                        type="text"
                        value={editForm.Coating || ""}
                        onChange={(e) => setEditForm({ ...editForm, Coating: e.target.value || null })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Zinc Plated, Black Oxide"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Material
                      </label>
                      <input
                        type="text"
                        value={editForm.Material || ""}
                        onChange={(e) => setEditForm({ ...editForm, Material: e.target.value || null })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Stainless Steel, Carbon Steel"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Part Number
                      </label>
                      <input
                        type="number"
                        value={editForm.part_number || ""}
                        onChange={(e) => setEditForm({ ...editForm, part_number: e.target.value ? Number(e.target.value) : null })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., 12345"
                        min={0}
                      />
                    </div>
                  </div>
                </div>

                {/* Tax & Compliance Section */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Tax & Compliance
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        HSN/SAC Code
                      </label>
                      <input
                        type="text"
                        value={editForm["HSN/SAC"] || ""}
                        onChange={(e) => setEditForm({ ...editForm, "HSN/SAC": e.target.value || null })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., 73181500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Harmonized System Nomenclature code for GST
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <button
                onClick={handleCloseModal}
                disabled={saving}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
