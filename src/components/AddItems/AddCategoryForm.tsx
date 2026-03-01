import { useState } from "react";
import supabase from "../../utils/supabase";
import { requireAdmin } from "../../utils/adminCheck";
import { ImageUpload } from "../common/ImageUpload";
import { IMAGEKIT } from "../../utils/constants";

export default function AddCategoryForm() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [sortNumber, setSortNumber] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!imageUrl) {
      alert("Please upload an image");
      return;
    }

    setLoading(true);

    try {
      // Check admin status before proceeding
      await requireAdmin();

      const { error } = await supabase
        .from("categories")
        .insert([{ name, image_url: imageUrl, description, sort_number: sortNumber }]);

      if (error) throw error;

      alert("Category added successfully!");
      setName("");
      setDescription("");
      setImageUrl("");
      setSortNumber(0);
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("An error occurred while adding the category");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold">Add Category</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Category Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="Enter category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border rounded-lg p-2"
          required
        />
      </div>

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

      <ImageUpload
        value={imageUrl}
        onChange={setImageUrl}
        folder={IMAGEKIT.FOLDERS.CATEGORIES}
        label="Category Image"
        required
        placeholder="Click or drag image to upload"
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Sort Order <span className="text-red-500">*</span>
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

      <button
        type="submit"
        disabled={loading || !imageUrl}
        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Adding..." : "Add Category"}
      </button>
    </form>
  );
}
