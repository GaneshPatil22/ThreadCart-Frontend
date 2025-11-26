// ============================================================================
// CART TYPES
// ============================================================================
// Application-level cart types for UI and business logic
// ============================================================================

import type { Product } from './database.types';

// ============================================================================
// CART ITEM WITH PRODUCT DETAILS
// ============================================================================

export interface CartItemWithProduct {
  id: string; // cart_item.id
  cart_id: string;
  product_id: number; // BIGINT - matches product.id
  quantity: number;
  added_at: string;
  product: Product;
}

// ============================================================================
// LOCAL STORAGE CART TYPES (Anonymous Users)
// ============================================================================

export interface LocalCartItem {
  product_id: number; // BIGINT - matches product.id
  quantity: number;
  added_at: string; // ISO timestamp
}

export interface LocalCart {
  items: LocalCartItem[];
}

// ============================================================================
// CART SUMMARY TYPES
// ============================================================================

export interface CartSummary {
  items: CartItemWithProduct[];
  subtotal: number; // Sum of all item prices * quantities
  tax: number; // Future: calculated tax
  shipping: number; // Future: shipping cost
  total: number; // subtotal + tax + shipping
  item_count: number; // Unique products count
  total_quantity: number; // Sum of all quantities
}

// ============================================================================
// CART VALIDATION TYPES
// ============================================================================

export interface CartValidationResult {
  is_valid: boolean;
  issues: CartValidationIssue[];
}

export interface CartValidationIssue {
  product_id: number; // BIGINT - matches product.id
  product_name: string;
  issue_type: 'out_of_stock' | 'insufficient_stock' | 'price_changed' | 'product_deleted';
  message: string;
  current_quantity?: number; // In cart
  available_quantity?: number; // In stock
  old_price?: number;
  new_price?: number;
}

// ============================================================================
// ADD TO CART TYPES
// ============================================================================

export interface AddToCartParams {
  product_id: number; // BIGINT - matches product.id
  quantity: number;
}

export interface AddToCartResult {
  success: boolean;
  message: string;
  cart_item?: CartItemWithProduct;
}

// ============================================================================
// UPDATE CART TYPES
// ============================================================================

export interface UpdateCartItemParams {
  product_id: number; // BIGINT - matches product.id
  quantity: number;
}

export interface UpdateCartItemResult {
  success: boolean;
  message: string;
  cart_item?: CartItemWithProduct;
}

// ============================================================================
// REMOVE FROM CART TYPES
// ============================================================================

export interface RemoveFromCartParams {
  product_id: number; // BIGINT - matches product.id
}

export interface RemoveFromCartResult {
  success: boolean;
  message: string;
}

// ============================================================================
// CART CONTEXT STATE
// ============================================================================

export interface CartContextState {
  // Cart data
  cart: CartSummary | null;
  loading: boolean;
  error: string | null;

  // Cart operations
  addToCart: (product_id: number, quantity: number) => Promise<AddToCartResult>;
  updateQuantity: (product_id: number, quantity: number) => Promise<UpdateCartItemResult>;
  removeFromCart: (product_id: number) => Promise<RemoveFromCartResult>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;

  // Validation
  validateCart: () => Promise<CartValidationResult>;

  // Utility
  getItemQuantity: (product_id: number) => number;
  isInCart: (product_id: number) => boolean;
}

// ============================================================================
// MERGE CART TYPES
// ============================================================================

export interface MergeCartResult {
  success: boolean;
  message: string;
  merged_count: number; // Number of items merged
  error?: string;
}
