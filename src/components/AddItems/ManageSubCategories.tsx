import { useEffect, useState } from "react";
import supabase from "../../utils/supabase";
import { getDisplayUrl, handleImageError } from "../../utils/imageUtils";
import { ImageUpload } from "../common/ImageUpload";
import { IMAGEKIT } from "../../utils/constants";

interface SubCategory {
  id: number;
  name: string;
  description: string;
  image_url: string;
  category_id: number;
  sort_number: number;
}

interface Category {
  id: number;
  name: string;
}

export default function ManageSubCategories() {
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<SubCategory | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    const [subCatsResult, catsResult] = await Promise.all([
      supabase
        .from("sub-categories")
        .select("*")
        .order("sort_number", { ascending: true }),
      supabase.from("categories").select("id, name"),
    ]);

    if (subCatsResult.error) {
      console.error(subCatsResult.error);
      alert("Error fetching subcategories");
    } else {
      setSubCategories(subCatsResult.data || []);
    }

    if (catsResult.error) {
      console.error(catsResult.error);
    } else {
      setCategories(catsResult.data || []);
    }

    setLoading(false);
  };

  const getCategoryName = (categoryId: number) => {
    return categories.find((c) => c.id === categoryId)?.name || "Unknown";
  };

  const handleEdit = (subCategory: SubCategory) => {
    setEditingId(subCategory.id);
    setEditForm({ ...subCategory });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const handleSaveEdit = async () => {
    if (!editForm) return;

    const { error } = await supabase
      .from("sub-categories")
      .update({
        name: editForm.name,
        description: editForm.description,
        image_url: editForm.image_url,
        category_id: editForm.category_id,
        sort_number: editForm.sort_number,
      })
      .eq("id", editForm.id);

    if (error) {
      alert("Error updating subcategory: " + error.message);
    } else {
      alert("SubCategory updated successfully!");
      setEditingId(null);
      setEditForm(null);
      fetchData();
    }
  };

  const handleDelete = async (id: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this subcategory? This will also affect related products."
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("sub-categories")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Error deleting subcategory: " + error.message);
    } else {
      alert("SubCategory deleted successfully!");
      fetchData();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const filteredSubCategories = subCategories.filter((sc) => {
    const categoryName = getCategoryName(sc.category_id).toLowerCase();
    const term = searchTerm.toLowerCase();
    return (
      sc.name.toLowerCase().includes(term) ||
      sc.description.toLowerCase().includes(term) ||
      categoryName.includes(term)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Manage SubCategories</h3>
        <span className="text-sm text-gray-500">
          {searchTerm
            ? `${filteredSubCategories.length} of ${subCategories.length} subcategories`
            : `${subCategories.length} subcategories`}
        </span>
      </div>

      <input
        type="text"
        placeholder="Search by name, description, or category..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full border rounded-lg p-2 mb-4"
      />

      {filteredSubCategories.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          {searchTerm ? "No subcategories found matching your search." : "No subcategories found. Add one using the form above."}
        </p>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {filteredSubCategories.map((subCategory) => (
            <div
              key={subCategory.id}
              className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition"
            >
              {editingId === subCategory.id && editForm ? (
                <div className="space-y-3">
                  <select
                    value={editForm.category_id}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        category_id: Number(e.target.value),
                      })
                    }
                    className="w-full border rounded-lg p-2"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
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
                    placeholder="SubCategory Name"
                  />
                  <input
                    type="text"
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                    className="w-full border rounded-lg p-2"
                    placeholder="Description"
                  />
                  <ImageUpload
                    value={editForm.image_url}
                    onChange={(url) =>
                      setEditForm({ ...editForm, image_url: url })
                    }
                    folder={IMAGEKIT.FOLDERS.SUBCATEGORIES}
                    label="SubCategory Image"
                    required
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
                      disabled={!editForm.image_url}
                      className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <img
                      src={getDisplayUrl(subCategory.image_url)}
                      alt={subCategory.name}
                      className="w-16 h-16 object-cover rounded"
                      onError={handleImageError}
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">
                        {subCategory.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {subCategory.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Category: {getCategoryName(subCategory.category_id)} |
                        Sort Order: {subCategory.sort_number}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(subCategory)}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(subCategory.id)}
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
