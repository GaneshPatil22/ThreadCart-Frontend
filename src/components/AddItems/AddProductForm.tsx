import { useEffect, useState } from "react";
import supabase from "../../utils/supabase";
import { NumberInput } from "../../utils/NumberInput";

export default function AddProductForm() {
  const [subcategories, setSubcategories] = useState<
    { id: number; name: string }[]
  >([]);

  const [selectedSub, setSelectedSub] = useState<number | null>(null);
  const [price, setPrice] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number | null>(null);
  const [fastenerLength, setFastenerLength] = useState<number | null>(null);
  const [headHeight, setHeadHeight] = useState<number | null>(null);
  const [grade, setGrade] = useState<number | null>(null);
  const [hexHeight, setHexHeight] = useState<number | null>(null);

  const [productName, setProductName] = useState("");
  const [images, setImages] = useState<string[] | null>(null);
  const [threadStyle, setThreadStyle] = useState<string | null>(null);
  const [threadSize, setThreadSize] = useState<string | null>(null);
  const [coating, setCoating] = useState<string | null>(null);

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

  const handleImageChange = (index: number, value: string) => {
    const newImages = [...(images ?? [])];
    newImages[index] = value;
    setImages(newImages);
  };

  const addImageField = () => {
    setImages([...(images ?? []), ""]);
  };

  const removeImageField = (index: number) => {
    const newImages = images && images.filter((_, i) => i !== index);
    setImages(newImages);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return alert("Select a subcategory first");
    setLoading(true);

    const { error } = await supabase.from("product").insert([
      {
        name: productName,
        image_url: images,
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
      setSelectedSub(null);
      setImages(null);
      setPrice(null);
      setQuantity(null);
      setThreadStyle(null);
      setThreadSize(null);
      setThreadStyle(null);
      setFastenerLength(null);
      setHeadHeight(null);
      setGrade(null);
      setCoating(null);
      setHexHeight(null);
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
      <div className="space-y-2">
        <label className="font-medium text-gray-700">Image URLs</label>
        {images &&
          images.map((url, index) => (
            <div key={index} className="flex gap-2 items-center">
              <input
                type="text"
                placeholder={`Image URL ${index + 1}`}
                value={url}
                onChange={(e) => handleImageChange(index, e.target.value)}
                className="flex-1 border rounded-lg p-2 focus:ring-2 focus:ring-blue-400"
                required
              />
              {images.length > 1 && (
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

      {/* Preview Section */}
      {images && images.some((i) => i.trim()) && (
        <div className="flex gap-2 flex-wrap mt-2">
          {images
            .filter((url) => url.trim())
            .map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`Preview ${i + 1}`}
                className="w-16 h-16 object-cover rounded border"
                onError={(e) =>
                  (e.currentTarget.src =
                    "https://via.placeholder.com/150x150?text=No+Image")
                }
              />
            ))}
        </div>
      )}

      <div>
        <NumberInput
          value={price}
          onChange={setPrice}
          placeholder="Enter price"
          className="w-full"
          required
          min={0}
        />
      </div>

      <div>
        <NumberInput
          value={quantity}
          onChange={setQuantity}
          placeholder="Total Quantity"
          className="w-full"
          required
          min={0}
        />
      </div>

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

      <div>
        <NumberInput
          value={fastenerLength}
          onChange={setFastenerLength}
          placeholder="Fastener Length"
          className="w-full"
          required
          min={0}
        />
      </div>

      <div>
        <NumberInput
          value={headHeight}
          onChange={setHeadHeight}
          placeholder="Head height"
          className="w-full"
          required
          min={0}
        />
      </div>

      <div>
        <NumberInput
          value={grade}
          onChange={setGrade}
          placeholder="Grade"
          className="w-full"
          required
          min={0}
        />
      </div>

      <input
        type="text"
        placeholder="Coating"
        value={coating ?? ""}
        onChange={(e) => setCoating(e.target.value)}
        className="w-full border rounded-lg p-2"
      />

      <div>
        <NumberInput
          value={hexHeight}
          onChange={setHexHeight}
          placeholder="Hex height"
          className="w-full"
          required
          min={0}
        />
      </div>

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
