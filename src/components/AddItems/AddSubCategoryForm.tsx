import { useEffect, useState } from "react";
import supabase from "../../utils/supabase";
import { ImageUpload } from "../common/ImageUpload";
import { IMAGEKIT } from "../../utils/constants";

export default function AddSubCategoryForm() {
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [subName, setSubName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [sortNumber, setSortNumber] = useState<number>(0);
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
    if (!imageUrl) return alert("Please upload an image");
    setLoading(true);

    const { error } = await supabase
      .from("sub-categories")
      .insert([{ name: subName, category_id: selectedCategory, image_url: imageUrl, description, sort_number: sortNumber }]);

    if (error) alert(error.message);
    else {
      alert("SubCategory added!");
      setSubName("");
      setSelectedCategory(null);
      setDescription("");
      setImageUrl("");
      setSortNumber(0);
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

      <ImageUpload
        value={imageUrl}
        onChange={setImageUrl}
        folder={IMAGEKIT.FOLDERS.SUBCATEGORIES}
        label="SubCategory Image"
        required
        placeholder="Click or drag image to upload"
      />

      <input
        type="text"
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full border rounded-lg p-2"
        required
      />

      <input
        type="number"
        placeholder="Sort Number (for display order)"
        value={sortNumber}
        onChange={(e) => setSortNumber(Number(e.target.value))}
        className="w-full border rounded-lg p-2"
        required
        min={0}
      />

      <button
        type="submit"
        disabled={loading || !imageUrl}
        className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Adding..." : "Add SubCategory"}
      </button>
    </form>
  );
}
