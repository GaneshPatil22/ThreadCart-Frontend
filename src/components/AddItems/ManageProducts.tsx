import { useEffect, useState } from "react";
import supabase from "../../utils/supabase";
import { handleImageError } from "../../utils/imageUtils";

interface Product {
  id: number;
  name: string;
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
}

interface SubCategory {
  id: number;
  name: string;
}

export default function ManageProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

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
    setEditingId(product.id);
    setEditForm({ ...product });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const handleSaveEdit = async () => {
    if (!editForm) return;

    const { error } = await supabase
      .from("product")
      .update({
        name: editForm.name,
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
      })
      .eq("id", editForm.id);

    if (error) {
      alert("Error updating product: " + error.message);
    } else {
      alert("Product updated successfully!");
      setEditingId(null);
      setEditForm(null);
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
      (p.part_number && p.part_number.toString().includes(term))
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
        placeholder="Search by name, subcategory, thread style, finish, or part number..."
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
              {editingId === product.id && editForm ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  <select
                    value={editForm.sub_cat_id}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        sub_cat_id: Number(e.target.value),
                      })
                    }
                    className="w-full border rounded-lg p-2"
                  >
                    <option value="">Select SubCategory</option>
                    {subCategories.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    className="w-full border rounded-lg p-2"
                    placeholder="Product Name"
                  />

                  <div className="space-y-2">
                    <label className="font-medium text-sm text-gray-700">
                      Image URLs
                    </label>
                    {editForm.image_url.map((url, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder={`Image URL ${index + 1}`}
                          value={url}
                          onChange={(e) =>
                            handleImageChange(index, e.target.value)
                          }
                          className="flex-1 border rounded-lg p-2"
                        />
                        {editForm.image_url.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeImageField(index)}
                            className="text-red-500 hover:text-red-700 font-bold text-lg"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addImageField}
                      className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                    >
                      + Add another image
                    </button>
                  </div>

                  <input
                    type="number"
                    value={editForm.price}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        price: Number(e.target.value),
                      })
                    }
                    className="w-full border rounded-lg p-2"
                    placeholder="Price"
                    min={0}
                  />
                  <input
                    type="number"
                    value={editForm.quantity}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        quantity: Number(e.target.value),
                      })
                    }
                    className="w-full border rounded-lg p-2"
                    placeholder="Quantity"
                    min={0}
                  />
                  <input
                    type="text"
                    value={editForm.thread_style || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, thread_style: e.target.value })
                    }
                    className="w-full border rounded-lg p-2"
                    placeholder="Thread Style"
                  />
                  <input
                    type="text"
                    value={editForm.thread_size_pitch || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        thread_size_pitch: e.target.value,
                      })
                    }
                    className="w-full border rounded-lg p-2"
                    placeholder="Thread Size x Pitch"
                  />
                  <input
                    type="number"
                    value={editForm.fastener_length || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        fastener_length: Number(e.target.value),
                      })
                    }
                    className="w-full border rounded-lg p-2"
                    placeholder="Fastener Length"
                    min={0}
                  />
                  <input
                    type="number"
                    value={editForm.head_height || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        head_height: Number(e.target.value),
                      })
                    }
                    className="w-full border rounded-lg p-2"
                    placeholder="Head Height"
                    min={0}
                  />
                  <input
                    type="number"
                    value={editForm.Grade || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        Grade: Number(e.target.value),
                      })
                    }
                    className="w-full border rounded-lg p-2"
                    placeholder="Grade"
                    min={0}
                  />
                  <input
                    type="text"
                    value={editForm.Coating || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, Coating: e.target.value })
                    }
                    className="w-full border rounded-lg p-2"
                    placeholder="Finish"
                  />
                  <input
                    type="number"
                    value={editForm.part_number || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        part_number: Number(e.target.value),
                      })
                    }
                    className="w-full border rounded-lg p-2"
                    placeholder="Part Number"
                    min={0}
                  />
                  <input
                    type="number"
                    value={editForm.sort_number}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        sort_number: Number(e.target.value),
                      })
                    }
                    className="w-full border rounded-lg p-2"
                    placeholder="Sort Number"
                    min={0}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEdit}
                      className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
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
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
