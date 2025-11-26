// ============================================================================
// ORDER TYPES
// ============================================================================
// Application-level order types for checkout and order tracking
// ============================================================================

import type { Order, OrderItem, OrderStatus, PaymentMethod, ShippingAddress, Product } from './database.types';

// ============================================================================
// ORDER WITH ITEMS
// ============================================================================

export interface OrderItemWithProduct extends OrderItem {
  product: Product;
}

export interface OrderWithItems extends Order {
  items: OrderItemWithProduct[];
}

// ============================================================================
// ORDER CREATION TYPES
// ============================================================================

export interface CreateOrderParams {
  user_id: string;
  shipping_address: ShippingAddress;
  payment_method: PaymentMethod;
  cart_items: Array<{
    product_id: number; // BIGINT - matches product.id
    quantity: number;
    price: number;
  }>;
}

export interface CreateOrderResult {
  success: boolean;
  order?: OrderWithItems;
  error?: string;
}

// ============================================================================
// ORDER TRACKING TYPES
// ============================================================================

export interface OrderStatusHistory {
  status: OrderStatus;
  timestamp: string | null;
  is_current: boolean;
  is_completed: boolean;
}

export interface OrderTracking {
  order_number: string;
  current_status: OrderStatus;
  history: OrderStatusHistory[];
  estimated_delivery?: string;
}

// Order status progression map
export const ORDER_STATUS_FLOW: Record<OrderStatus, number> = {
  pending: 0,
  confirmed: 1,
  packed: 2,
  shipped: 3,
  out_for_delivery: 4,
  delivered: 5,
  cancelled: -1,
};

// Status display configuration
export interface OrderStatusConfig {
  label: string;
  color: string;
  icon: string;
  description: string;
}

export const ORDER_STATUS_CONFIG: Record<OrderStatus, OrderStatusConfig> = {
  pending: {
    label: 'Order Placed',
    color: 'text-yellow-600',
    icon: '⏳',
    description: 'Your order has been received and is being processed',
  },
  confirmed: {
    label: 'Confirmed',
    color: 'text-blue-600',
    icon: '✓',
    description: 'Your order has been confirmed and is being prepared',
  },
  packed: {
    label: 'Packed',
    color: 'text-purple-600',
    icon: '📦',
    description: 'Your order has been packed and is ready for shipment',
  },
  shipped: {
    label: 'Shipped',
    color: 'text-indigo-600',
    icon: '🚚',
    description: 'Your order has been shipped',
  },
  out_for_delivery: {
    label: 'Out for Delivery',
    color: 'text-orange-600',
    icon: '🛵',
    description: 'Your order is out for delivery',
  },
  delivered: {
    label: 'Delivered',
    color: 'text-green-600',
    icon: '✓',
    description: 'Your order has been delivered',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-red-600',
    icon: '✕',
    description: 'Your order has been cancelled',
  },
};

// ============================================================================
// RAZORPAY INTEGRATION TYPES
// ============================================================================

export interface RazorpayOrderOptions {
  amount: number; // in paise (1 INR = 100 paise)
  currency: string;
  receipt: string; // order_number
  notes?: Record<string, string>;
}

export interface RazorpayPaymentResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface RazorpayConfig {
  key_id: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  handler: (response: RazorpayPaymentResponse) => void;
}

// ============================================================================
// CHECKOUT TYPES
// ============================================================================

export interface CheckoutParams {
  shipping_address: ShippingAddress;
  payment_method: PaymentMethod;
}

export interface CheckoutResult {
  success: boolean;
  order?: OrderWithItems;
  razorpay_order_id?: string; // For Razorpay flow
  error?: string;
}

// ============================================================================
// ORDER FILTERS & QUERIES
// ============================================================================

export interface OrderFilters {
  status?: OrderStatus[];
  date_from?: string;
  date_to?: string;
  search?: string; // Search by order_number or product name
}

export interface OrderListResult {
  orders: OrderWithItems[];
  total_count: number;
  page: number;
  per_page: number;
}

// ============================================================================
// ORDER SUMMARY FOR INVOICE
// ============================================================================

export interface OrderInvoice {
  order: Order;
  items: OrderItemWithProduct[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  billing_address: ShippingAddress;
  shipping_address: ShippingAddress;
}

// ============================================================================
// ADMIN ORDER MANAGEMENT (Future)
// ============================================================================

export interface UpdateOrderStatusParams {
  order_id: string;
  new_status: OrderStatus;
  notes?: string;
}

export interface UpdateOrderStatusResult {
  success: boolean;
  order?: Order;
  error?: string;
}
