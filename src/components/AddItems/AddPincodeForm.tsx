import { useState } from "react";
import supabase from "../../utils/supabase";
import { requireAdmin } from "../../utils/adminCheck";

export default function AddPincodeForm() {
  const [pincode, setPincode] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [deliveryDays, setDeliveryDays] = useState<number>(5);
  const [shippingCharge, setShippingCharge] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await requireAdmin();

      if (pincode.length !== 6 || !/^\d{6}$/.test(pincode)) {
        throw new Error("Pincode must be exactly 6 digits");
      }

      const { error } = await supabase.from("supported_pincodes").insert([
        {
          pincode,
          city,
          state,
          delivery_days: deliveryDays,
          shipping_charge: shippingCharge,
          is_active: isActive,
        },
      ]);

      if (error) throw error;

      alert("Pincode added successfully!");
      setPincode("");
      setCity("");
      setState("");
      setDeliveryDays(5);
      setShippingCharge(0);
      setIsActive(true);
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("An error occurred while adding the pincode");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold">Add Supported Pincode</h3>

      <input
        type="text"
        placeholder="Pincode (6 digits)"
        value={pincode}
        onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        className="w-full border rounded-lg p-2"
        required
        maxLength={6}
        pattern="\d{6}"
      />

      <input
        type="text"
        placeholder="City"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        className="w-full border rounded-lg p-2"
        required
      />

      <input
        type="text"
        placeholder="State"
        value={state}
        onChange={(e) => setState(e.target.value)}
        className="w-full border rounded-lg p-2"
        required
      />

      <input
        type="number"
        placeholder="Delivery Days"
        value={deliveryDays}
        onChange={(e) => setDeliveryDays(Number(e.target.value))}
        className="w-full border rounded-lg p-2"
        required
        min={1}
        max={30}
      />

      <div>
        <label className="text-sm text-gray-500 mb-1 block">
          Shipping Charge (₹) - Set 0 for free shipping
        </label>
        <input
          type="number"
          placeholder="Shipping Charge"
          value={shippingCharge}
          onChange={(e) => setShippingCharge(Number(e.target.value))}
          className="w-full border rounded-lg p-2"
          min={0}
          step={10}
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500"
        />
        <span className="text-gray-700">Active (serviceable)</span>
      </label>

      <button
        type="submit"
        disabled={loading}
        className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
      >
        {loading ? "Adding..." : "Add Pincode"}
      </button>
    </form>
  );
}
