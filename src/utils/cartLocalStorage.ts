// ============================================================================
// LOCAL STORAGE CART UTILITIES
// ============================================================================
// Manages cart for anonymous (non-authenticated) users using browser LocalStorage
// ============================================================================

import type { LocalCart, LocalCartItem } from '../types/cart.types';

const CART_STORAGE_KEY = 'threadcart_local_cart';

// ============================================================================
// HELPER: Get Local Cart from LocalStorage
// ============================================================================

export const getLocalCart = (): LocalCart => {
  try {
    const cartData = localStorage.getItem(CART_STORAGE_KEY);
    if (!cartData) {
      return { items: [] };
    }

    const cart: LocalCart = JSON.parse(cartData);
    return cart;
  } catch (error) {
    console.error('Error reading local cart:', error);
    return { items: [] };
  }
};

// ============================================================================
// HELPER: Save Local Cart to LocalStorage
// ============================================================================

const saveLocalCart = (cart: LocalCart): void => {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error('Error saving local cart:', error);
  }
};

// ============================================================================
// ADD TO LOCAL CART
// ============================================================================

export const addToLocalCart = (product_id: number, quantity: number): LocalCartItem => {
  const cart = getLocalCart();

  // Check if product already exists in cart
  const existingItemIndex = cart.items.findIndex(
    (item) => item.product_id === product_id
  );

  if (existingItemIndex !== -1) {
    // Update quantity if product exists
    cart.items[existingItemIndex].quantity += quantity;
    cart.items[existingItemIndex].added_at = new Date().toISOString();
  } else {
    // Add new item
    const newItem: LocalCartItem = {
      product_id,
      quantity,
      added_at: new Date().toISOString(),
    };
    cart.items.push(newItem);
  }

  saveLocalCart(cart);
  return cart.items.find((item) => item.product_id === product_id)!;
};

// ============================================================================
// UPDATE LOCAL CART ITEM QUANTITY
// ============================================================================

export const updateLocalCartItem = (
  product_id: number,
  quantity: number
): LocalCartItem | null => {
  const cart = getLocalCart();

  const itemIndex = cart.items.findIndex((item) => item.product_id === product_id);

  if (itemIndex === -1) {
    console.warn(`Product ${product_id} not found in local cart`);
    return null;
  }

  if (quantity <= 0) {
    // Remove item if quantity is 0 or negative
    cart.items.splice(itemIndex, 1);
    saveLocalCart(cart);
    return null;
  }

  // Update quantity
  cart.items[itemIndex].quantity = quantity;
  cart.items[itemIndex].added_at = new Date().toISOString();

  saveLocalCart(cart);
  return cart.items[itemIndex];
};

// ============================================================================
// REMOVE FROM LOCAL CART
// ============================================================================

export const removeLocalCartItem = (product_id: number): boolean => {
  const cart = getLocalCart();

  const itemIndex = cart.items.findIndex((item) => item.product_id === product_id);

  if (itemIndex === -1) {
    console.warn(`Product ${product_id} not found in local cart`);
    return false;
  }

  cart.items.splice(itemIndex, 1);
  saveLocalCart(cart);
  return true;
};

// ============================================================================
// CLEAR LOCAL CART
// ============================================================================

export const clearLocalCart = (): void => {
  try {
    localStorage.removeItem(CART_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing local cart:', error);
  }
};

// ============================================================================
// GET LOCAL CART ITEM COUNT (Unique Products)
// ============================================================================

export const getLocalCartItemCount = (): number => {
  const cart = getLocalCart();
  return cart.items.length; // Unique products count
};

// ============================================================================
// GET LOCAL CART TOTAL QUANTITY (Sum of all quantities)
// ============================================================================

export const getLocalCartTotalQuantity = (): number => {
  const cart = getLocalCart();
  return cart.items.reduce((total, item) => total + item.quantity, 0);
};

// ============================================================================
// GET ITEM QUANTITY IN LOCAL CART
// ============================================================================

export const getLocalCartItemQuantity = (product_id: number): number => {
  const cart = getLocalCart();
  const item = cart.items.find((item) => item.product_id === product_id);
  return item ? item.quantity : 0;
};

// ============================================================================
// CHECK IF PRODUCT IS IN LOCAL CART
// ============================================================================

export const isProductInLocalCart = (product_id: number): boolean => {
  const cart = getLocalCart();
  return cart.items.some((item) => item.product_id === product_id);
};

// ============================================================================
// GET ALL LOCAL CART ITEMS
// ============================================================================

export const getLocalCartItems = (): LocalCartItem[] => {
  const cart = getLocalCart();
  return cart.items;
};

// ============================================================================
// VALIDATE LOCAL CART (Check if items are valid)
// ============================================================================

export const validateLocalCart = (validProductIds: number[]): void => {
  const cart = getLocalCart();

  // Filter out items with invalid product IDs
  const validItems = cart.items.filter((item) =>
    validProductIds.includes(item.product_id)
  );

  if (validItems.length !== cart.items.length) {
    cart.items = validItems;
    saveLocalCart(cart);
    console.log('Cleaned up invalid items from local cart');
  }
};
