// ============================================================================
// CART VALIDATION UTILITIES
// ============================================================================
// Helper functions to validate cart items against product inventory
// ============================================================================

import { supabase } from './supabase';
import type { CartItemWithProduct, CartValidationResult, CartValidationIssue } from '../types/cart.types';
import type { Product } from '../types/database.types';

// ============================================================================
// VALIDATE CART ITEMS
// ============================================================================

export const validateCartItems = async (
  cartItems: CartItemWithProduct[]
): Promise<CartValidationResult> => {
  if (cartItems.length === 0) {
    return {
      is_valid: true,
      issues: [],
    };
  }

  const issues: CartValidationIssue[] = [];

  // Fetch current product data for all cart items
  const productIds = cartItems.map((item) => item.product_id);

  const { data: products, error } = await supabase
    .from('product')
    .select('id, name, price, quantity')
    .in('id', productIds);

  if (error || !products) {
    console.error('Error fetching products for validation:', error);
    return {
      is_valid: false,
      issues: [
        {
          product_id: 0,
          product_name: 'Unknown',
          issue_type: 'product_deleted',
          message: 'Failed to validate cart items',
        },
      ],
    };
  }

  // Create a map for quick lookup
  const productMap = new Map<number, Product>();
  products.forEach((product: any) => {
    productMap.set(product.id, product);
  });

  // Validate each cart item
  for (const cartItem of cartItems) {
    const product = productMap.get(cartItem.product_id);

    // Check if product still exists
    if (!product) {
      issues.push({
        product_id: cartItem.product_id,
        product_name: cartItem.product.name,
        issue_type: 'product_deleted',
        message: 'This product is no longer available',
      });
      continue;
    }

    // Check if out of stock
    if (product.quantity === 0) {
      issues.push({
        product_id: cartItem.product_id,
        product_name: product.name,
        issue_type: 'out_of_stock',
        message: 'This product is currently out of stock',
        current_quantity: cartItem.quantity,
        available_quantity: 0,
      });
      continue;
    }

    // Check if insufficient stock
    if (cartItem.quantity > product.quantity) {
      issues.push({
        product_id: cartItem.product_id,
        product_name: product.name,
        issue_type: 'insufficient_stock',
        message: `Only ${product.quantity} units available, but you have ${cartItem.quantity} in cart`,
        current_quantity: cartItem.quantity,
        available_quantity: product.quantity,
      });
      continue;
    }

    // Check if price changed
    if (cartItem.product.price !== product.price) {
      issues.push({
        product_id: cartItem.product_id,
        product_name: product.name,
        issue_type: 'price_changed',
        message: `Price has changed from ₹${cartItem.product.price.toFixed(
          2
        )} to ₹${product.price.toFixed(2)}`,
        old_price: cartItem.product.price,
        new_price: product.price,
      });
    }
  }

  return {
    is_valid: issues.length === 0,
    issues,
  };
};

// ============================================================================
// CHECK PRODUCT AVAILABILITY
// ============================================================================

export const checkProductAvailability = async (
  product_id: number,
  requested_quantity: number
): Promise<{
  available: boolean;
  max_quantity: number;
  message: string;
}> => {
  try {
    const { data: product, error } = await supabase
      .from('product')
      .select('quantity')
      .eq('id', product_id)
      .single();

    if (error || !product) {
      return {
        available: false,
        max_quantity: 0,
        message: 'Product not found',
      };
    }

    if (product.quantity === 0) {
      return {
        available: false,
        max_quantity: 0,
        message: 'Product is out of stock',
      };
    }

    if (requested_quantity > product.quantity) {
      return {
        available: false,
        max_quantity: product.quantity,
        message: `Only ${product.quantity} units available`,
      };
    }

    return {
      available: true,
      max_quantity: product.quantity,
      message: 'Product is available',
    };
  } catch (error) {
    console.error('Error checking product availability:', error);
    return {
      available: false,
      max_quantity: 0,
      message: 'Failed to check availability',
    };
  }
};

// ============================================================================
// AUTO-FIX CART ISSUES
// ============================================================================

export const autoFixCartIssues = async (
  cartItems: CartItemWithProduct[],
  issues: CartValidationIssue[]
): Promise<{
  fixed_items: CartItemWithProduct[];
  removed_items: number[];
}> => {
  const fixed_items: CartItemWithProduct[] = [];
  const removed_items: number[] = [];

  for (const item of cartItems) {
    const itemIssues = issues.filter((issue) => issue.product_id === item.product_id);

    if (itemIssues.length === 0) {
      // No issues, keep item as is
      fixed_items.push(item);
      continue;
    }

    // Check issue types
    const hasDeletedIssue = itemIssues.some(
      (issue) => issue.issue_type === 'product_deleted'
    );
    const hasOutOfStockIssue = itemIssues.some(
      (issue) => issue.issue_type === 'out_of_stock'
    );
    const hasInsufficientStockIssue = itemIssues.some(
      (issue) => issue.issue_type === 'insufficient_stock'
    );
    const hasPriceChangeIssue = itemIssues.some(
      (issue) => issue.issue_type === 'price_changed'
    );

    if (hasDeletedIssue || hasOutOfStockIssue) {
      // Remove item from cart
      removed_items.push(item.product_id);
      continue;
    }

    if (hasInsufficientStockIssue) {
      // Adjust quantity to available stock
      const issue = itemIssues.find(
        (issue) => issue.issue_type === 'insufficient_stock'
      );
      if (issue && issue.available_quantity !== undefined) {
        fixed_items.push({
          ...item,
          quantity: issue.available_quantity,
        });
      }
      continue;
    }

    if (hasPriceChangeIssue) {
      // Update price (no action needed, will be fetched from DB)
      fixed_items.push(item);
      continue;
    }

    // Default: keep item
    fixed_items.push(item);
  }

  return {
    fixed_items,
    removed_items,
  };
};

// ============================================================================
// CALCULATE CART TOTALS
// ============================================================================

export const calculateCartTotals = (
  items: CartItemWithProduct[]
): {
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  item_count: number;
  total_quantity: number;
} => {
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  // TODO: Implement tax calculation based on location
  const tax = 0;

  // TODO: Implement shipping calculation based on weight/location
  // Free shipping over ₹100
  const shipping = subtotal >= 100 ? 0 : 0;

  const total = subtotal + tax + shipping;
  const item_count = items.length;
  const total_quantity = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    subtotal,
    tax,
    shipping,
    total,
    item_count,
    total_quantity,
  };
};

// ============================================================================
// FORMAT CURRENCY
// ============================================================================

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
};

// ============================================================================
// CHECK IF CART QUALIFIES FOR FREE SHIPPING
// ============================================================================

export const checkFreeShipping = (
  subtotal: number,
  threshold: number = 100
): {
  qualifies: boolean;
  remaining: number;
  message: string;
} => {
  if (subtotal >= threshold) {
    return {
      qualifies: true,
      remaining: 0,
      message: 'You qualify for free shipping!',
    };
  }

  const remaining = threshold - subtotal;

  return {
    qualifies: false,
    remaining,
    message: `Add ${formatCurrency(remaining)} more to qualify for free shipping`,
  };
};
