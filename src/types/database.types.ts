// ============================================================================
// DATABASE TYPES
// ============================================================================
// Core database table types matching Supabase schema
// ============================================================================

export interface Database {
  public: {
    Tables: {
      carts: {
        Row: Cart;
        Insert: CartInsert;
        Update: CartUpdate;
      };
      cart_items: {
        Row: CartItem;
        Insert: CartItemInsert;
        Update: CartItemUpdate;
      };
      orders: {
        Row: Order;
        Insert: OrderInsert;
        Update: OrderUpdate;
      };
      order_items: {
        Row: OrderItem;
        Insert: OrderItemInsert;
        Update: OrderItemUpdate;
      };
      product: {
        Row: Product;
        Insert: ProductInsert;
        Update: ProductUpdate;
      };
    };
  };
}

// ============================================================================
// CART TYPES
// ============================================================================

export interface Cart {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CartInsert {
  id?: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface CartUpdate {
  user_id?: string;
  updated_at?: string;
}

// ============================================================================
// CART ITEM TYPES
// ============================================================================

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: number; // BIGINT in database
  quantity: number;
  added_at: string;
  updated_at: string;
}

export interface CartItemInsert {
  id?: string;
  cart_id: string;
  product_id: number; // BIGINT in database
  quantity: number;
  added_at?: string;
  updated_at?: string;
}

export interface CartItemUpdate {
  cart_id?: string;
  product_id?: number; // BIGINT in database
  quantity?: number;
  updated_at?: string;
}

// ============================================================================
// ORDER TYPES
// ============================================================================

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'packed'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export type PaymentMethod = 'razorpay' | 'cod' | 'bank_transfer';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface ShippingAddress {
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  total_amount: number;
  grand_total: number; // Total with GST and shipping
  shipping_charge: number; // Shipping charge at time of order
  gst_number: string | null; // Customer GST number (optional)
  status: OrderStatus;
  payment_method: PaymentMethod | null;
  payment_id: string | null;
  payment_status: PaymentStatus;
  shipping_address: ShippingAddress;
  billing_address: ShippingAddress | null; // Billing address (null if same as shipping)
  notes: string | null; // Admin notes for order
  created_at: string;
  confirmed_at: string | null;
  packed_at: string | null;
  shipped_at: string | null;
  out_for_delivery_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
}

export interface OrderInsert {
  id?: string;
  order_number: string;
  user_id: string;
  total_amount: number;
  grand_total: number; // Total with GST and shipping
  shipping_charge?: number; // Shipping charge
  gst_number?: string | null; // Customer GST number (optional)
  status?: OrderStatus;
  payment_method?: PaymentMethod | null;
  payment_id?: string | null;
  payment_status?: PaymentStatus;
  shipping_address: ShippingAddress;
  billing_address?: ShippingAddress | null; // Billing address (null if same as shipping)
  notes?: string | null;
  created_at?: string;
}

export interface OrderUpdate {
  status?: OrderStatus;
  payment_method?: PaymentMethod | null;
  payment_id?: string | null;
  payment_status?: PaymentStatus;
  notes?: string | null;
  confirmed_at?: string | null;
  packed_at?: string | null;
  shipped_at?: string | null;
  out_for_delivery_at?: string | null;
  delivered_at?: string | null;
  cancelled_at?: string | null;
}

// ============================================================================
// ORDER ITEM TYPES
// ============================================================================

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: number; // BIGINT in database
  quantity: number;
  price_at_purchase: number;
  created_at: string;
}

export interface OrderItemInsert {
  id?: string;
  order_id: string;
  product_id: number; // BIGINT in database
  quantity: number;
  price_at_purchase: number;
  created_at?: string;
}

export interface OrderItemUpdate {
  // Order items should not be updated after creation
  // Included for completeness
}

// ============================================================================
// PRODUCT TYPES (from existing schema)
// ============================================================================

export interface Product {
  id: number; // BIGINT in database
  name: string;
  image_url: string[];
  price: number;
  quantity: number;
  thread_style: string | null;
  thread_size_pitch: string | null;
  fastener_length: string | null;
  head_height: string | null;
  Grade: string | null;
  Coating: string | null;
  part_number: string | null;
  sub_cat_id: string;
  sort_number: number;
  Material: string | null;
  'HSN/SAC': string | null;
}

export interface ProductInsert {
  id?: number; // BIGINT in database
  name: string;
  image_url: string[];
  price: number;
  quantity: number;
  thread_style?: string | null;
  thread_size_pitch?: string | null;
  fastener_length?: string | null;
  head_height?: string | null;
  Grade?: string | null;
  Coating?: string | null;
  part_number?: string | null;
  sub_cat_id: string;
  sort_number?: number;
  Material?: string | null;
  'HSN/SAC'?: string | null;
}

export interface ProductUpdate {
  name?: string;
  image_url?: string[];
  price?: number;
  quantity?: number;
  thread_style?: string | null;
  thread_size_pitch?: string | null;
  fastener_length?: string | null;
  head_height?: string | null;
  Grade?: string | null;
  Coating?: string | null;
  part_number?: string | null;
  sub_cat_id?: string;
  sort_number?: number;
  Material?: string | null;
  'HSN/SAC'?: string | null;
}
