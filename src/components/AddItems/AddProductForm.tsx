import { useEffect, useState } from "react";
import supabase from "../../utils/supabase";

export default function AddProductForm() {
  const [subcategories, setSubcategories] = useState<
    { id: number; name: string }[]
  >([]);

  const [selectedSub, setSelectedSub] = useState<number | null>(null);
  const [price, setPrice] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number | null>(null);
  const [fastenerLength, setFastenerLength] = useState<number | null>(null);

  const [productName, setProductName] = useState("");

  const [url, setUrl] = useState<string | null>(null);
  const [threadStyle, setThreadStyle] = useState<string | null>(null);
  const [threadSize, setThreadSize] = useState<string | null>(null);
  const [headHeight, setHeadHeight] = useState<string | null>(null);
  const [grade, setGrade] = useState<string | null>(null);
  const [coating, setCoating] = useState<string | null>(null);
  const [hexHeight, setHexHeight] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSubs = async () => {
      const { data, error } = await supabase
        .from("sub-categories")
        .select("id, name");
      if (error) console.error(error.message);
      else setSubcategories(data || []);
    };
    fetchSubs();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return alert("Select a subcategory first");
    setLoading(true);

    const { error } = await supabase.from("product").insert([
      {
        name: productName,
        image_url: url,
        price,
        quantity,
        thread_style: threadStyle,
        sub_cat_id: selectedSub,
        thread_size_pitch: threadSize,
        fastener_length: fastenerLength,
        head_height: headHeight,
        Grade: grade,
        Coating: coating,
        hex_height: hexHeight,
      },
    ]);

    if (error) alert(error.message);
    else {
      alert("Product added!");
      setProductName("");
      setPrice(null);
      setSelectedSub(null);
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold">Add Product</h3>
      <select
        value={selectedSub ?? ""}
        onChange={(e) => setSelectedSub(Number(e.target.value))}
        className="w-full border rounded-lg p-2"
        required
      >
        <option value="">Select SubCategory</option>
        {subcategories.map((sub) => (
          <option key={sub.id} value={sub.id}>
            {sub.name}
          </option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Product Name"
        value={productName}
        onChange={(e) => setProductName(e.target.value)}
        className="w-full border rounded-lg p-2"
        required
      />
      <input
        type="text"
        placeholder="Image Url"
        value={url ?? ""}
        onChange={(e) => setUrl(e.target.value)}
        className="w-full border rounded-lg p-2"
        required
      />
      <input
        type="number"
        placeholder="Price"
        value={price ?? ""}
        onChange={(e) => setPrice(Number(e.target.value))}
        className="w-full border rounded-lg p-2"
        required
      />
      <input
        type="number"
        placeholder="Total Quantity"
        value={quantity ?? ""}
        onChange={(e) => setQuantity(Number(e.target.value))}
        className="w-full border rounded-lg p-2"
        required
      />
      <input
        type="text"
        placeholder="Thread Style"
        value={threadStyle ?? ""}
        onChange={(e) => setThreadStyle(e.target.value)}
        className="w-full border rounded-lg p-2"
      />
      <input
        type="text"
        placeholder="Thread size x Pitch"
        value={threadSize ?? ""}
        onChange={(e) => setThreadSize(e.target.value)}
        className="w-full border rounded-lg p-2"
      />
      <input
        type="number"
        placeholder="Fastener Length"
        value={fastenerLength ?? ""}
        onChange={(e) => setFastenerLength(Number(e.target.value))}
        className="w-full border rounded-lg p-2"
      />

      <input
        type="text"
        placeholder="Head height"
        value={headHeight ?? ""}
        onChange={(e) => setHeadHeight(e.target.value)}
        className="w-full border rounded-lg p-2"
      />
      <input
        type="text"
        placeholder="Grade"
        value={grade ?? ""}
        onChange={(e) => setGrade(e.target.value)}
        className="w-full border rounded-lg p-2"
      />
      <input
        type="text"
        placeholder="Coating"
        value={coating ?? ""}
        onChange={(e) => setCoating(e.target.value)}
        className="w-full border rounded-lg p-2"
      />
      <input
        type="text"
        placeholder="Hex height"
        value={hexHeight ?? ""}
        onChange={(e) => setHexHeight(e.target.value)}
        className="w-full border rounded-lg p-2"
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600"
      >
        {loading ? "Adding..." : "Add Product"}
      </button>
    </form>
  );
}
