import { useEffect, useState } from "react";
import supabase from "../../utils/supabase";

export default function AddSubCategoryForm() {
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [subName, setSubName] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase.from("categories").select("id, name");
      if (error) console.error(error.message);
      else setCategories(data || []);
    };
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return alert("Select a category first");
    setLoading(true);

    const { error } = await supabase
      .from("sub-categories")
      .insert([{ name: subName, category_id: selectedCategory, image_url: url, description }]);

    if (error) alert(error.message);
    else {
      alert("SubCategory added!");
      setSubName("");
      setSelectedCategory(null);
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold">Add SubCategory</h3>

      <select
        value={selectedCategory ?? ""}
        onChange={(e) => setSelectedCategory(Number(e.target.value))}
        className="w-full border rounded-lg p-2"
        required
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
        placeholder="SubCategory Name"
        value={subName}
        onChange={(e) => setSubName(e.target.value)}
        className="w-full border rounded-lg p-2"
        required
      />

      <input
        type="text"
        placeholder="Image Url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="w-full border rounded-lg p-2"
        required
      />

      <input
        type="text"
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full border rounded-lg p-2"
        required
      />

      <button
        type="submit"
        disabled={loading}
        className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
      >
        {loading ? "Adding..." : "Add SubCategory"}
      </button>
    </form>
  );
}
