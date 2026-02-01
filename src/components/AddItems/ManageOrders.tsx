import { useEffect, useState } from "react";
import {
  getAllOrders,
  adminUpdateOrderStatus,
  adminUpdatePaymentStatus,
  adminUpdateOrderNotes,
  adminDeleteOrder,
  getOrderStatusCounts,
  getPaymentStatusCounts,
} from "../../services/admin-order.service";
import { downloadInvoice } from "../../services/invoice.service";
import type { OrderWithItems } from "../../types/order.types";
import type { OrderStatus, PaymentStatus } from "../../types/database.types";
import { TAX } from "../../utils/constants";
import { Download, Trash2 } from "lucide-react";

// ============================================================================
// STATUS OPTIONS
// ============================================================================

const ORDER_STATUS_OPTIONS = [
  { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-700" },
  { value: "confirmed", label: "Confirmed", color: "bg-blue-100 text-blue-700" },
  { value: "packed", label: "Packed", color: "bg-purple-100 text-purple-700" },
  { value: "shipped", label: "Shipped", color: "bg-indigo-100 text-indigo-700" },
  { value: "out_for_delivery", label: "Out for Delivery", color: "bg-orange-100 text-orange-700" },
  { value: "delivered", label: "Delivered", color: "bg-green-100 text-green-700" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-700" },
] as const;

const PAYMENT_STATUS_OPTIONS = [
  { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-700" },
  { value: "completed", label: "Completed", color: "bg-green-100 text-green-700" },
  { value: "failed", label: "Failed", color: "bg-red-100 text-red-700" },
  { value: "refunded", label: "Refunded", color: "bg-gray-100 text-gray-700" },
] as const;

// ============================================================================
// COMPONENT
// ============================================================================

export default function ManageOrders() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterOrderStatus, setFilterOrderStatus] = useState<string>("all");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const data = await getAllOrders();
    setOrders(data);
    setLoading(false);
  };

  // ============================================================================
  // FILTERS
  // ============================================================================

  const filteredOrders = orders.filter((order) => {
    // Order status filter
    if (filterOrderStatus !== "all" && order.status !== filterOrderStatus) {
      return false;
    }
    // Payment status filter
    if (filterPaymentStatus !== "all" && order.payment_status !== filterPaymentStatus) {
      return false;
    }
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesOrderNumber = order.order_number.toLowerCase().includes(query);
      const matchesCustomerName = order.shipping_address.full_name.toLowerCase().includes(query);
      const matchesPhone = order.shipping_address.phone.includes(query);
      if (!matchesOrderNumber && !matchesCustomerName && !matchesPhone) {
        return false;
      }
    }
    return true;
  });

  const orderStatusCounts = getOrderStatusCounts(orders);
  const paymentStatusCounts = getPaymentStatusCounts(orders);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleOrderStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdating(orderId);
    const result = await adminUpdateOrderStatus(orderId, newStatus);
    if (result.success) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } else {
      alert("Error updating order status: " + result.error);
    }
    setUpdating(null);
  };

  const handlePaymentStatusChange = async (orderId: string, newStatus: PaymentStatus) => {
    setUpdating(orderId);
    const result = await adminUpdatePaymentStatus(orderId, newStatus);
    if (result.success) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, payment_status: newStatus } : o))
      );
    } else {
      alert("Error updating payment status: " + result.error);
    }
    setUpdating(null);
  };

  const handleSaveNotes = async (orderId: string) => {
    setUpdating(orderId);
    const result = await adminUpdateOrderNotes(orderId, notesValue);
    if (result.success) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, notes: notesValue || null } : o))
      );
      setEditingNotes(null);
      setNotesValue("");
    } else {
      alert("Error updating notes: " + result.error);
    }
    setUpdating(null);
  };

  const startEditingNotes = (order: OrderWithItems) => {
    setEditingNotes(order.id);
    setNotesValue(order.notes || "");
  };

  const handleDownloadInvoice = async (order: OrderWithItems) => {
    setDownloadingInvoice(order.id);
    try {
      await downloadInvoice(order);
    } catch (error) {
      console.error("Error downloading invoice:", error);
      alert("Failed to download invoice. Please try again.");
    }
    setDownloadingInvoice(null);
  };

  const handleDeleteOrder = async (order: OrderWithItems) => {
    setDeleting(order.id);
    const result = await adminDeleteOrder(order.id, order.user_id);
    if (result.success) {
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
      setExpandedId(null);
      setDeleteConfirm(null);
    } else {
      alert("Error deleting order: " + result.error);
    }
    setDeleting(null);
  };

  // ============================================================================
  // HELPERS
  // ============================================================================

  const getOrderStatusStyle = (status: string) => {
    return ORDER_STATUS_OPTIONS.find((s) => s.value === status)?.color || "bg-gray-100 text-gray-600";
  };

  const getPaymentStatusStyle = (status: string) => {
    return PAYMENT_STATUS_OPTIONS.find((s) => s.value === status)?.color || "bg-gray-100 text-gray-600";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatAddress = (address: OrderWithItems["shipping_address"]) => {
    const parts = [
      address.address_line1,
      address.address_line2,
      address.city,
      address.state,
      address.postal_code,
      address.country,
    ].filter(Boolean);
    return parts.join(", ");
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Order Management</h3>
        <span className="text-sm text-gray-500">{orders.length} total orders</span>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by order #, customer name, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
        />
      </div>

      {/* Order Status Filter */}
      <div className="mb-2">
        <p className="text-xs text-gray-500 uppercase mb-2">Order Status</p>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterOrderStatus("all")}
            className={`px-3 py-1 rounded-full text-sm transition ${
              filterOrderStatus === "all"
                ? "bg-gray-800 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All ({orderStatusCounts.total})
          </button>
          {ORDER_STATUS_OPTIONS.map((status) => (
            <button
              key={status.value}
              onClick={() => setFilterOrderStatus(status.value)}
              className={`px-3 py-1 rounded-full text-sm transition ${
                filterOrderStatus === status.value
                  ? "bg-gray-800 text-white"
                  : `${status.color} hover:opacity-80`
              }`}
            >
              {status.label} ({orderStatusCounts[status.value as keyof typeof orderStatusCounts] || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Payment Status Filter */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 uppercase mb-2">Payment Status</p>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterPaymentStatus("all")}
            className={`px-3 py-1 rounded-full text-sm transition ${
              filterPaymentStatus === "all"
                ? "bg-gray-800 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All ({paymentStatusCounts.total})
          </button>
          {PAYMENT_STATUS_OPTIONS.map((status) => (
            <button
              key={status.value}
              onClick={() => setFilterPaymentStatus(status.value)}
              className={`px-3 py-1 rounded-full text-sm transition ${
                filterPaymentStatus === status.value
                  ? "bg-gray-800 text-white"
                  : `${status.color} hover:opacity-80`
              }`}
            >
              {status.label} ({paymentStatusCounts[status.value as keyof typeof paymentStatusCounts] || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          {orders.length === 0
            ? "No orders yet."
            : "No orders match your filters."}
        </p>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className={`border rounded-lg bg-white shadow-sm hover:shadow-md transition ${
                order.status === "cancelled" ? "opacity-60" : ""
              }`}
            >
              {/* Quick View - Always visible */}
              <div
                className="p-4 cursor-pointer"
                onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-bold text-primary">#{order.order_number}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${getOrderStatusStyle(order.status)}`}>
                        {ORDER_STATUS_OPTIONS.find((s) => s.value === order.status)?.label || order.status}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs ${getPaymentStatusStyle(order.payment_status)}`}>
                        {order.payment_method?.toUpperCase()} - {PAYMENT_STATUS_OPTIONS.find((s) => s.value === order.payment_status)?.label || order.payment_status}
                      </span>
                    </div>
                    <p className="text-sm font-medium">{order.shipping_address.full_name}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                      <span className="font-semibold text-gray-900">{formatCurrency(order.grand_total)}</span>
                      <span>{order.items.length} item{order.items.length !== 1 ? "s" : ""}</span>
                      <span>{formatDate(order.created_at)}</span>
                    </div>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      expandedId === order.id ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === order.id && (
                <div className="px-4 pb-4 border-t pt-3 space-y-4">
                  {/* Customer & Address Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 uppercase">Customer</label>
                      <p className="text-sm font-medium">{order.shipping_address.full_name}</p>
                      <p className="text-sm">
                        <a href={`tel:${order.shipping_address.phone}`} className="text-blue-600 hover:underline">
                          {order.shipping_address.phone}
                        </a>
                      </p>
                      {order.gst_number && (
                        <p className="text-sm mt-1">
                          <span className="text-gray-500">GST:</span>{" "}
                          <span className="font-mono">{order.gst_number}</span>
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase">Shipping Address</label>
                      <p className="text-sm">{formatAddress(order.shipping_address)}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase">Billing Address</label>
                      {order.billing_address ? (
                        <>
                          <p className="text-sm font-medium">{order.billing_address.full_name}</p>
                          <p className="text-sm">{formatAddress(order.billing_address)}</p>
                          <p className="text-sm text-gray-500">Phone: {order.billing_address.phone}</p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-medium">{order.shipping_address.full_name}</p>
                          <p className="text-sm">{formatAddress(order.shipping_address)}</p>
                          <p className="text-sm text-gray-500">Phone: {order.shipping_address.phone}</p>
                          <p className="text-xs text-gray-400 mt-1">(Same as shipping address)</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Order Items */}
                  <div>
                    <label className="text-xs text-gray-500 uppercase mb-2 block">Items</label>
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-3">
                            {item.product?.image_url?.[0] && (
                              <img
                                src={item.product.image_url[0]}
                                alt={item.product?.name}
                                className="w-10 h-10 object-cover rounded"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = "none";
                                }}
                              />
                            )}
                            <div>
                              <p className="font-medium">{item.product?.name || "Product unavailable"}</p>
                              <p className="text-gray-500">Qty: {item.quantity} x {formatCurrency(item.price_at_purchase)}</p>
                            </div>
                          </div>
                          <span className="font-medium">{formatCurrency(item.quantity * item.price_at_purchase)}</span>
                        </div>
                      ))}
                      <div className="border-t pt-2 mt-2 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Subtotal</span>
                          <span>{formatCurrency(order.total_amount)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">GST ({TAX.GST_PERCENTAGE}%)</span>
                          <span>{formatCurrency(order.total_amount * TAX.GST_RATE)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Shipping</span>
                          <span>
                            {(order.shipping_charge || 0) === 0
                              ? <span className="text-green-600">FREE</span>
                              : formatCurrency(order.shipping_charge || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm font-bold border-t pt-1 mt-1">
                          <span>Grand Total</span>
                          <span>{formatCurrency(order.grand_total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Timestamps */}
                  <div>
                    <label className="text-xs text-gray-500 uppercase mb-2 block">Timeline</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Created:</span>
                        <p>{formatDate(order.created_at)}</p>
                      </div>
                      {order.confirmed_at && (
                        <div>
                          <span className="text-gray-500">Confirmed:</span>
                          <p>{formatDate(order.confirmed_at)}</p>
                        </div>
                      )}
                      {order.packed_at && (
                        <div>
                          <span className="text-gray-500">Packed:</span>
                          <p>{formatDate(order.packed_at)}</p>
                        </div>
                      )}
                      {order.shipped_at && (
                        <div>
                          <span className="text-gray-500">Shipped:</span>
                          <p>{formatDate(order.shipped_at)}</p>
                        </div>
                      )}
                      {order.out_for_delivery_at && (
                        <div>
                          <span className="text-gray-500">Out for Delivery:</span>
                          <p>{formatDate(order.out_for_delivery_at)}</p>
                        </div>
                      )}
                      {order.delivered_at && (
                        <div>
                          <span className="text-gray-500">Delivered:</span>
                          <p>{formatDate(order.delivered_at)}</p>
                        </div>
                      )}
                      {order.cancelled_at && (
                        <div>
                          <span className="text-gray-500 text-red-500">Cancelled:</span>
                          <p>{formatDate(order.cancelled_at)}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
                    {/* Order Status */}
                    <div>
                      <label className="text-xs text-gray-500 uppercase mb-1 block">Update Order Status</label>
                      <select
                        value={order.status}
                        onChange={(e) => handleOrderStatusChange(order.id, e.target.value as OrderStatus)}
                        disabled={updating === order.id}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50"
                      >
                        {ORDER_STATUS_OPTIONS.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Payment Status */}
                    <div>
                      <label className="text-xs text-gray-500 uppercase mb-1 block">Update Payment Status</label>
                      <select
                        value={order.payment_status}
                        onChange={(e) => handlePaymentStatusChange(order.id, e.target.value as PaymentStatus)}
                        disabled={updating === order.id}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50"
                      >
                        {PAYMENT_STATUS_OPTIONS.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-xs text-gray-500 uppercase mb-1 block">Admin Notes</label>
                    {editingNotes === order.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={notesValue}
                          onChange={(e) => setNotesValue(e.target.value)}
                          placeholder="Add notes about this order..."
                          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveNotes(order.id)}
                            disabled={updating === order.id}
                            className="px-4 py-1.5 bg-primary text-white rounded-lg text-sm hover:bg-primary-hover disabled:opacity-50"
                          >
                            {updating === order.id ? "Saving..." : "Save Notes"}
                          </button>
                          <button
                            onClick={() => {
                              setEditingNotes(null);
                              setNotesValue("");
                            }}
                            className="px-4 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => startEditingNotes(order)}
                        className="bg-gray-50 rounded-lg p-3 min-h-[60px] cursor-pointer hover:bg-gray-100 transition"
                      >
                        {order.notes ? (
                          <p className="text-sm whitespace-pre-wrap">{order.notes}</p>
                        ) : (
                          <p className="text-sm text-gray-400 italic">Click to add notes...</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center justify-between gap-3 pt-2 border-t">
                    <button
                      onClick={() => handleDownloadInvoice(order)}
                      disabled={downloadingInvoice === order.id}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover disabled:opacity-50 transition"
                    >
                      {downloadingInvoice === order.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          Download Invoice
                        </>
                      )}
                    </button>

                    {/* Delete Order */}
                    {deleteConfirm === order.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-red-600 font-medium">Delete this order?</span>
                        <button
                          onClick={() => handleDeleteOrder(order)}
                          disabled={deleting === order.id}
                          className="px-3 py-1.5 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition"
                        >
                          {deleting === order.id ? "Deleting..." : "Yes, Delete"}
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          disabled={deleting === order.id}
                          className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-sm font-medium hover:bg-gray-300 disabled:opacity-50 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(order.id)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Order
                      </button>
                    )}
                  </div>

                  {/* Payment Info */}
                  {order.payment_id && (
                    <div className="text-xs text-gray-500">
                      <span className="uppercase">Payment ID:</span> {order.payment_id}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
