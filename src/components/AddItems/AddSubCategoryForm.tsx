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
  const [catalogSortNumber, setCatalogSortNumber] = useState<number>(0);
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
      .insert([{ name: subName, category_id: selectedCategory, image_url: imageUrl, description, sort_number: sortNumber, catalog_sort_number: catalogSortNumber }]);

    if (error) alert(error.message);
    else {
      alert("SubCategory added!");
      setSubName("");
      setSelectedCategory(null);
      setDescription("");
      setImageUrl("");
      setSortNumber(0);
      setCatalogSortNumber(0);
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold">Add SubCategory</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Parent Category <span className="text-red-500">*</span>
        </label>
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
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          SubCategory Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="Enter subcategory name"
          value={subName}
          onChange={(e) => setSubName(e.target.value)}
          className="w-full border rounded-lg p-2"
          required
        />
      </div>

      <ImageUpload
        value={imageUrl}
        onChange={setImageUrl}
        folder={IMAGEKIT.FOLDERS.SUBCATEGORIES}
        label="SubCategory Image"
        required
        placeholder="Click or drag image to upload"
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="Enter description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border rounded-lg p-2"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Sort Order (Subcategory Page) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          placeholder="0"
          value={sortNumber}
          onChange={(e) => setSortNumber(Number(e.target.value))}
          className="w-full border rounded-lg p-2"
          required
          min={0}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Catalog Sort Order (Catalog Page) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          placeholder="0"
          value={catalogSortNumber}
          onChange={(e) => setCatalogSortNumber(Number(e.target.value))}
          className="w-full border rounded-lg p-2"
          required
          min={0}
        />
      </div>

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
