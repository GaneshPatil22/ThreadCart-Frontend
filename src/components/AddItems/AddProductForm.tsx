import { useEffect, useState } from "react";
import supabase from "../../utils/supabase";
import { NumberInput } from "../../utils/NumberInput";
import { MultiImageUpload } from "../common/MultiImageUpload";
import { IMAGEKIT, SINGLE_PRODUCT_DEFAULTS } from "../../utils/constants";

type SubCategoryType = "single" | "multiple";

interface SubCategoryOption {
  id: number;
  name: string;
  type: SubCategoryType;
}

export default function AddProductForm() {
  const [subcategories, setSubcategories] = useState<SubCategoryOption[]>([]);

  const [selectedSub, setSelectedSub] = useState<number | null>(null);
  const [selectedSubType, setSelectedSubType] = useState<SubCategoryType>("multiple");
  const [price, setPrice] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number | null>(null);
  const [fastenerLength, setFastenerLength] = useState<number | null>(null);
  const [headHeight, setHeadHeight] = useState<number | null>(null);
  const [grade, setGrade] = useState<number | null>(null);
  const [sortNumber, setSortNumber] = useState<number>(0);

  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [threadStyle, setThreadStyle] = useState<string | null>(null);
  const [threadSize, setThreadSize] = useState<string | null>(null);
  const [coating, setCoating] = useState<string | null>(null);
  const [partNumber, setPartNumber] = useState<string | null>(null);
  const [material, setMaterial] = useState<string | null>(null);
  const [hsnSac, setHsnSac] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  const isSingleType = selectedSubType === "single";

  useEffect(() => {
    const fetchSubs = async () => {
      const { data, error } = await supabase
        .from("sub-categories")
        .select("id, name, type");
      if (error) console.error(error.message);
      else setSubcategories(data || []);
    };
    fetchSubs();
  }, []);

  const handleSubCategoryChange = (subId: number) => {
    setSelectedSub(subId);
    const sub = subcategories.find((s) => s.id === subId);
    const type = (sub?.type as SubCategoryType) || "multiple";
    setSelectedSubType(type);

    // Auto-fill default values for single-type products
    if (type === "single") {
      setThreadStyle(SINGLE_PRODUCT_DEFAULTS.STRING);
      setThreadSize(SINGLE_PRODUCT_DEFAULTS.STRING);
      setFastenerLength(SINGLE_PRODUCT_DEFAULTS.NUMBER);
      setHeadHeight(SINGLE_PRODUCT_DEFAULTS.NUMBER);
      setGrade(SINGLE_PRODUCT_DEFAULTS.NUMBER);
      setCoating(SINGLE_PRODUCT_DEFAULTS.STRING);
      setMaterial(SINGLE_PRODUCT_DEFAULTS.STRING);
    } else {
      // Reset to empty for multi-type so user fills them in
      setThreadStyle(null);
      setThreadSize(null);
      setFastenerLength(null);
      setHeadHeight(null);
      setGrade(null);
      setCoating(null);
      setMaterial(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return alert("Select a subcategory first");
    if (images.length === 0) return alert("Please upload at least one image");
    setLoading(true);

    const { error } = await supabase.from("product").insert([
      {
        name: productName,
        description: description,
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
        part_number: partNumber,
        sort_number: sortNumber,
        Material: material,
        "HSN/SAC": hsnSac,
      },
    ]);

    if (error) alert(error.message);
    else {
      alert("Product added!");
      setProductName("");
      setDescription(null);
      setSelectedSub(null);
      setSelectedSubType("multiple");
      setImages([]);
      setPrice(null);
      setQuantity(null);
      setThreadStyle(null);
      setThreadSize(null);
      setFastenerLength(null);
      setHeadHeight(null);
      setGrade(null);
      setCoating(null);
      setPartNumber(null);
      setSortNumber(0);
      setMaterial(null);
      setHsnSac(null);
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold">Add Product</h3>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          SubCategory <span className="text-red-500">*</span>
        </label>
        <select
          value={selectedSub ?? ""}
          onChange={(e) => handleSubCategoryChange(Number(e.target.value))}
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
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Product Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="Enter product name"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          className="w-full border rounded-lg p-2"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          placeholder="Enter product description (optional)"
          value={description ?? ""}
          onChange={(e) => setDescription(e.target.value || null)}
          className="w-full border rounded-lg p-2 min-h-[80px] resize-y"
          rows={3}
        />
      </div>

      <MultiImageUpload
        value={images}
        onChange={setImages}
        folder={IMAGEKIT.FOLDERS.PRODUCTS}
        label="Product Images"
        minImages={1}
        maxImages={10}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Price (₹) <span className="text-red-500">*</span>
        </label>
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
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Quantity in Stock <span className="text-red-500">*</span>
        </label>
        <NumberInput
          value={quantity}
          onChange={setQuantity}
          placeholder="Enter quantity"
          className="w-full"
          required
          min={0}
        />
      </div>

      {/* Spec fields — hidden for single-type sub-categories */}
      {!isSingleType && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Thread Style
            </label>
            <input
              type="text"
              placeholder="e.g., Full Thread, Half Thread"
              value={threadStyle ?? ""}
              onChange={(e) => setThreadStyle(e.target.value)}
              className="w-full border rounded-lg p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Thread Size x Pitch <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., M8 x 1.25"
              value={threadSize ?? ""}
              onChange={(e) => setThreadSize(e.target.value)}
              className="w-full border rounded-lg p-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fastener Length (mm)
            </label>
            <NumberInput
              value={fastenerLength}
              onChange={setFastenerLength}
              placeholder="e.g., 25"
              className="w-full"
              min={0}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Head Height (mm)
            </label>
            <NumberInput
              value={headHeight}
              onChange={setHeadHeight}
              placeholder="e.g., 5"
              className="w-full"
              min={0}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Grade
            </label>
            <NumberInput
              value={grade}
              onChange={setGrade}
              placeholder="e.g., 8.8, 10.9"
              className="w-full"
              min={0}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Finish / Coating <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Zinc Plated, Black Oxide"
              value={coating ?? ""}
              onChange={(e) => setCoating(e.target.value)}
              className="w-full border rounded-lg p-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Material
            </label>
            <input
              type="text"
              placeholder="e.g., Stainless Steel, Carbon Steel"
              value={material ?? ""}
              onChange={(e) => setMaterial(e.target.value)}
              className="w-full border rounded-lg p-2"
            />
          </div>
        </>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Part Number <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="e.g., 12345"
          value={partNumber ?? ""}
          onChange={(e) => setPartNumber(e.target.value)}
          className="w-full border rounded-lg p-2"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          HSN/SAC Code
        </label>
        <input
          type="text"
          placeholder="e.g., 73181500"
          value={hsnSac ?? ""}
          onChange={(e) => setHsnSac(e.target.value)}
          className="w-full border rounded-lg p-2"
        />
      </div>

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
        disabled={loading || images.length === 0}
        className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Adding..." : "Add Product"}
      </button>
    </form>
  );
}
