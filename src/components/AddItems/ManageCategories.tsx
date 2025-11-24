import { useEffect, useState } from "react";
import supabase from "../../utils/supabase";

interface Category {
  id: number;
  name: string;
  description: string;
  image_url: string;
  sort_number: number;
}

export default function ManageCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Category | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_number", { ascending: true });

    if (error) {
      console.error(error);
      alert("Error fetching categories");
    } else {
      setCategories(data || []);
    }
    setLoading(false);
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setEditForm({ ...category });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const handleSaveEdit = async () => {
    if (!editForm) return;

    const { error } = await supabase
      .from("categories")
      .update({
        name: editForm.name,
        description: editForm.description,
        image_url: editForm.image_url,
        sort_number: editForm.sort_number,
      })
      .eq("id", editForm.id);

    if (error) {
      alert("Error updating category: " + error.message);
    } else {
      alert("Category updated successfully!");
      setEditingId(null);
      setEditForm(null);
      fetchCategories();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this category? This will also affect related subcategories.")) {
      return;
    }

    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) {
      alert("Error deleting category: " + error.message);
    } else {
      alert("Category deleted successfully!");
      fetchCategories();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold mb-4">Manage Categories</h3>

      {categories.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No categories found. Add one using the form above.</p>
      ) : (
        <div className="space-y-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition"
            >
              {editingId === category.id && editForm ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full border rounded-lg p-2"
                    placeholder="Category Name"
                  />
                  <input
                    type="text"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full border rounded-lg p-2"
                    placeholder="Description"
                  />
                  <input
                    type="text"
                    value={editForm.image_url}
                    onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
                    className="w-full border rounded-lg p-2"
                    placeholder="Image URL"
                  />
                  <input
                    type="number"
                    value={editForm.sort_number}
                    onChange={(e) => setEditForm({ ...editForm, sort_number: Number(e.target.value) })}
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <img
                      src={category.image_url}
                      alt={category.name}
                      className="w-16 h-16 object-cover rounded"
                      onError={(e) => {
                        e.currentTarget.src = "https://via.placeholder.com/150?text=No+Image";
                      }}
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{category.name}</h4>
                      <p className="text-sm text-gray-600">{category.description}</p>
                      <p className="text-xs text-gray-500 mt-1">Sort Order: {category.sort_number}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(category)}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
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
