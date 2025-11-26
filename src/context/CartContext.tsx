// ============================================================================
// CART CONTEXT
// ============================================================================
// Global cart state management with automatic auth detection
// Routes to LocalStorage (anonymous) or Supabase (authenticated)
// ============================================================================

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import type {
  CartContextState,
  CartSummary,
  AddToCartResult,
  UpdateCartItemResult,
  RemoveFromCartResult,
  CartValidationResult,
  CartItemWithProduct,
} from '../types/cart.types';

// Supabase cart service
import * as cartService from '../services/cart.service';

// LocalStorage cart utilities
import * as localCartUtils from '../utils/cartLocalStorage';
import { mergeLocalCartWithDB } from '../services/cart.service';

// ============================================================================
// CREATE CONTEXT
// ============================================================================

export const CartContext = createContext<CartContextState | undefined>(undefined);

// ============================================================================
// CART PROVIDER
// ============================================================================

interface CartProviderProps {
  children: React.ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cart, setCart] = useState<CartSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // ============================================================================
  // AUTH STATE LISTENER
  // ============================================================================

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const initializeAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (mounted) {
        setUserId(session?.user?.id || null);
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      const newUserId = session?.user?.id || null;

      setUserId((prevUserId) => {
        // Handle login: merge LocalStorage cart with DB cart
        if (newUserId && !prevUserId) {
          handleLogin(newUserId);
        }

        // Handle logout: clear cart state
        if (!newUserId && prevUserId) {
          setCart(null);
        }

        // Refresh cart after auth change
        if (newUserId) {
          loadCart(newUserId);
        } else {
          loadLocalCart();
        }

        return newUserId;
      });
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // ============================================================================
  // LOAD CART (Initial Load)
  // ============================================================================

  useEffect(() => {
    if (loading) return;

    let mounted = true;

    const loadCartData = async () => {
      if (userId) {
        await loadCart(userId);
      } else {
        await loadLocalCart();
      }
    };

    if (mounted) {
      loadCartData();
    }

    return () => {
      mounted = false;
    };
  }, [userId, loading]);

  // ============================================================================
  // LOAD SUPABASE CART (Authenticated)
  // ============================================================================

  const loadCart = async (uid: string) => {
    try {
      setError(null);
      const cartData = await cartService.getCartWithItems(uid);
      setCart(cartData);
    } catch (err) {
      console.error('Error loading cart:', err);
      setError('Failed to load cart');
    }
  };

  // ============================================================================
  // LOAD LOCAL STORAGE CART (Anonymous)
  // ============================================================================

  const loadLocalCart = async () => {
    try {
      setError(null);
      const localCart = localCartUtils.getLocalCart();

      if (localCart.items.length === 0) {
        setCart({
          items: [],
          subtotal: 0,
          tax: 0,
          shipping: 0,
          total: 0,
          item_count: 0,
          total_quantity: 0,
        });
        return;
      }

      // Fetch product details for each item
      const productIds = localCart.items.map((item) => item.product_id);

      const { data: products, error: productsError } = await supabase
        .from('product')
        .select('*')
        .in('id', productIds);

      if (productsError) {
        console.error('Error fetching products:', productsError);
        setError('Failed to load cart products');
        return;
      }

      // Combine local cart items with product details
      const items: CartItemWithProduct[] = localCart.items
        .map((localItem) => {
          const product = products?.find((p) => p.id === localItem.product_id);
          if (!product) return null;

          return {
            id: `local-${localItem.product_id}`, // Use product_id as temporary string id
            cart_id: 'local',
            product_id: localItem.product_id,
            quantity: localItem.quantity,
            added_at: localItem.added_at,
            product,
          };
        })
        .filter((item): item is CartItemWithProduct => item !== null);

      // Calculate summary
      const subtotal = items.reduce(
        (total, item) => total + item.product.price * item.quantity,
        0
      );
      const tax = 0;
      const shipping = 0;
      const total = subtotal + tax + shipping;
      const item_count = items.length;
      const total_quantity = items.reduce((sum, item) => sum + item.quantity, 0);

      setCart({
        items,
        subtotal,
        tax,
        shipping,
        total,
        item_count,
        total_quantity,
      });
    } catch (err) {
      console.error('Error loading local cart:', err);
      setError('Failed to load cart');
    }
  };

  // ============================================================================
  // HANDLE LOGIN - MERGE CARTS
  // ============================================================================

  const handleLogin = async (uid: string) => {
    try {
      const localCartItems = localCartUtils.getLocalCartItems();

      if (localCartItems.length > 0) {
        // Merge local cart with DB cart
        const mergeResult = await mergeLocalCartWithDB(uid, localCartItems);

        if (mergeResult.success) {
          // Clear local storage after successful merge
          localCartUtils.clearLocalCart();
          console.log(`Merged ${mergeResult.merged_count} items from local cart`);
        }
      }

      // Load the merged cart
      await loadCart(uid);
    } catch (err) {
      console.error('Error handling login merge:', err);
    }
  };

  // ============================================================================
  // ADD TO CART
  // ============================================================================

  const addToCart = useCallback(
    async (product_id: number, quantity: number): Promise<AddToCartResult> => {
      try {
        if (userId) {
          // Authenticated: use Supabase
          const result = await cartService.addToCart(userId, product_id, quantity);

          if (result.success) {
            await loadCart(userId);
          }

          return result;
        } else {
          // Anonymous: use LocalStorage
          localCartUtils.addToLocalCart(product_id, quantity);
          await loadLocalCart();

          return {
            success: true,
            message: 'Added to cart successfully',
          };
        }
      } catch (err) {
        console.error('Error in addToCart:', err);
        return {
          success: false,
          message: 'Failed to add to cart',
        };
      }
    },
    [userId]
  );

  // ============================================================================
  // UPDATE QUANTITY
  // ============================================================================

  const updateQuantity = useCallback(
    async (product_id: number, quantity: number): Promise<UpdateCartItemResult> => {
      try {
        if (userId) {
          // Authenticated: use Supabase
          const result = await cartService.updateCartItemQuantity(
            userId,
            product_id,
            quantity
          );

          if (result.success) {
            await loadCart(userId);
          }

          return result;
        } else {
          // Anonymous: use LocalStorage
          if (quantity <= 0) {
            localCartUtils.removeLocalCartItem(product_id);
          } else {
            localCartUtils.updateLocalCartItem(product_id, quantity);
          }
          await loadLocalCart();

          return {
            success: true,
            message: 'Quantity updated successfully',
          };
        }
      } catch (err) {
        console.error('Error in updateQuantity:', err);
        return {
          success: false,
          message: 'Failed to update quantity',
        };
      }
    },
    [userId]
  );

  // ============================================================================
  // REMOVE FROM CART
  // ============================================================================

  const removeFromCart = useCallback(
    async (product_id: number): Promise<RemoveFromCartResult> => {
      try {
        if (userId) {
          // Authenticated: use Supabase
          const result = await cartService.removeFromCart(userId, product_id);

          if (result.success) {
            await loadCart(userId);
          }

          return result;
        } else {
          // Anonymous: use LocalStorage
          localCartUtils.removeLocalCartItem(product_id);
          await loadLocalCart();

          return {
            success: true,
            message: 'Removed from cart successfully',
          };
        }
      } catch (err) {
        console.error('Error in removeFromCart:', err);
        return {
          success: false,
          message: 'Failed to remove from cart',
        };
      }
    },
    [userId]
  );

  // ============================================================================
  // CLEAR CART
  // ============================================================================

  const clearCart = useCallback(async (): Promise<void> => {
    try {
      if (userId) {
        await cartService.clearCart(userId);
        await loadCart(userId);
      } else {
        localCartUtils.clearLocalCart();
        await loadLocalCart();
      }
    } catch (err) {
      console.error('Error in clearCart:', err);
    }
  }, [userId]);

  // ============================================================================
  // REFRESH CART
  // ============================================================================

  const refreshCart = useCallback(async (): Promise<void> => {
    if (userId) {
      await loadCart(userId);
    } else {
      await loadLocalCart();
    }
  }, [userId]);

  // ============================================================================
  // VALIDATE CART
  // ============================================================================

  const validateCart = useCallback(async (): Promise<CartValidationResult> => {
    // TODO: Implement cart validation
    // Check if products still exist, prices changed, stock available
    return {
      is_valid: true,
      issues: [],
    };
  }, [cart]);

  // ============================================================================
  // UTILITY: GET ITEM QUANTITY
  // ============================================================================

  const getItemQuantity = useCallback(
    (product_id: number): number => {
      if (!cart) return 0;
      const item = cart.items.find((item) => item.product_id === product_id);
      return item ? item.quantity : 0;
    },
    [cart]
  );

  // ============================================================================
  // UTILITY: CHECK IF IN CART
  // ============================================================================

  const isInCart = useCallback(
    (product_id: number): boolean => {
      if (!cart) return false;
      return cart.items.some((item) => item.product_id === product_id);
    },
    [cart]
  );

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const value: CartContextState = {
    cart,
    loading,
    error,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    refreshCart,
    validateCart,
    getItemQuantity,
    isInCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
