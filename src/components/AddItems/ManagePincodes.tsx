import { useEffect, useState } from "react";
import supabase from "../../utils/supabase";

interface Pincode {
  pincode: string;
  city: string;
  state: string;
  delivery_days: number;
  shipping_charge: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function ManagePincodes() {
  const [pincodes, setPincodes] = useState<Pincode[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPincode, setEditingPincode] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Pincode | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchPincodes();
  }, []);

  const fetchPincodes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("supported_pincodes")
      .select("*")
      .order("pincode", { ascending: true });

    if (error) {
      console.error(error);
      alert("Error fetching pincodes");
    } else {
      setPincodes(data || []);
    }
    setLoading(false);
  };

  const handleEdit = (pincode: Pincode) => {
    setEditingPincode(pincode.pincode);
    setEditForm({ ...pincode });
  };

  const handleCancelEdit = () => {
    setEditingPincode(null);
    setEditForm(null);
  };

  const handleSaveEdit = async () => {
    if (!editForm) return;

    const { error } = await supabase
      .from("supported_pincodes")
      .update({
        city: editForm.city,
        state: editForm.state,
        delivery_days: editForm.delivery_days,
        shipping_charge: editForm.shipping_charge,
        is_active: editForm.is_active,
      })
      .eq("pincode", editForm.pincode);

    if (error) {
      alert("Error updating pincode: " + error.message);
    } else {
      alert("Pincode updated successfully!");
      setEditingPincode(null);
      setEditForm(null);
      fetchPincodes();
    }
  };

  const handleDelete = async (pincode: string) => {
    if (
      !confirm(
        `Are you sure you want to delete pincode ${pincode}? This may affect user addresses using this pincode.`
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("supported_pincodes")
      .delete()
      .eq("pincode", pincode);

    if (error) {
      alert("Error deleting pincode: " + error.message);
    } else {
      alert("Pincode deleted successfully!");
      fetchPincodes();
    }
  };

  const filteredPincodes = pincodes.filter(
    (p) =>
      p.pincode.includes(searchTerm) ||
      p.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Manage Pincodes</h3>
        <span className="text-sm text-gray-500">
          {searchTerm
            ? `${filteredPincodes.length} of ${pincodes.length} pincodes`
            : `${pincodes.length} pincodes`}
        </span>
      </div>

      <input
        type="text"
        placeholder="Search by pincode, city, or state..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full border rounded-lg p-2 mb-4"
      />

      {filteredPincodes.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          {searchTerm ? "No pincodes found matching your search." : "No pincodes found. Add one using the form above."}
        </p>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {filteredPincodes.map((pincode) => (
            <div
              key={pincode.pincode}
              className={`border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition ${
                !pincode.is_active ? "opacity-60 bg-gray-50" : ""
              }`}
            >
              {editingPincode === pincode.pincode && editForm ? (
                <div className="space-y-3">
                  <div className="bg-gray-100 p-2 rounded">
                    <span className="font-mono font-semibold">{editForm.pincode}</span>
                    <span className="text-xs text-gray-500 ml-2">(cannot change)</span>
                  </div>
                  <input
                    type="text"
                    value={editForm.city}
                    onChange={(e) =>
                      setEditForm({ ...editForm, city: e.target.value })
                    }
                    className="w-full border rounded-lg p-2"
                    placeholder="City"
                  />
                  <input
                    type="text"
                    value={editForm.state}
                    onChange={(e) =>
                      setEditForm({ ...editForm, state: e.target.value })
                    }
                    className="w-full border rounded-lg p-2"
                    placeholder="State"
                  />
                  <input
                    type="number"
                    value={editForm.delivery_days}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        delivery_days: Number(e.target.value),
                      })
                    }
                    className="w-full border rounded-lg p-2"
                    placeholder="Delivery Days"
                    min={1}
                    max={30}
                  />
                  <div>
                    <label className="text-sm text-gray-500 mb-1 block">
                      Shipping Charge (₹) - Set 0 for free shipping
                    </label>
                    <input
                      type="number"
                      value={editForm.shipping_charge}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          shipping_charge: Number(e.target.value),
                        })
                      }
                      className="w-full border rounded-lg p-2"
                      placeholder="Shipping Charge"
                      min={0}
                      step={10}
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.is_active}
                      onChange={(e) =>
                        setEditForm({ ...editForm, is_active: e.target.checked })
                      }
                      className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                    />
                    <span className="text-gray-700">Active (serviceable)</span>
                  </label>
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
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-lg">{pincode.pincode}</span>
                      {!pincode.is_active && (
                        <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700">
                      {pincode.city}, {pincode.state}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Delivery: {pincode.delivery_days} days</span>
                      <span>
                        Shipping:{" "}
                        {(pincode.shipping_charge || 0) === 0 ? (
                          <span className="text-green-600 font-medium">FREE</span>
                        ) : (
                          <span>₹{pincode.shipping_charge}</span>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(pincode)}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(pincode.pincode)}
                      className="bg-primary text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
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
