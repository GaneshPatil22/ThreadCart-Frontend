import { useState } from "react";
import supabase from "../../utils/supabase";

export default function AddCategoryForm() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [sortNumber, setSortNumber] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from("categories")
      .insert([{ name, image_url: url, description, sort_number: sortNumber }]);
    if (error) alert(error.message);
    else {
      alert("Category added successfully!");
      setName("");
      setDescription("");
      setUrl("");
      setSortNumber(0);
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold">Add Category</h3>

      <input
        type="text"
        placeholder="Category Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
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

      <input
        type="text"
        placeholder="Image URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
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
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
      >
        {loading ? "Adding..." : "Add Category"}
      </button>
    </form>
  );
}
